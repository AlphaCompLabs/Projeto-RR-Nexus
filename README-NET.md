# 📘 Documentação do Projeto de Redes - Infraestrutura de Alta Disponibilidade

**Autores:** Mayron Malaquias e Pedro Borges

Este documento descreve a implementação técnica de uma rede com 6 Máquinas Virtuais (VMs), focando em balanceamento de carga (**Round Robin Cíclico**) com verificação de saúde (**Health Check**) automatizada e proxy reverso.

---

## 1. Visão Geral da Arquitetura 🗺️

A rede opera na faixa `172.19.50.0/24`. A infraestrutura foi desenhada para garantir alta disponibilidade: se um servidor HTTP cair, o DNS remove seu registro automaticamente, redirecionando o tráfego apenas para os nós saudáveis.

| Hostname | IP Fixo | Função | Detalhes Técnicos |
| :--- | :--- | :--- | :--- |
| **DNS-Server** | `172.19.50.24` | Load Balancer e DNS | **BIND9 + Script Health Check** |
| **HTTP-01** | `172.19.50.21` | Web Server | Nginx (Proxy 80 -> 4200) |
| **HTTP-02** | `172.19.50.22` | Web Server | Nginx (Proxy 80 -> 4200) |
| **HTTP-03** | `172.19.50.23` | Web Server | Nginx (Proxy 80 -> 4200) |
| **Back-end** | `172.19.50.25` | Aplicação | Acesso Híbrido (LAN + Internet p/ Mongo) |
| **Cliente** | `172.19.50.26` | Validação | Firefox (Disable Cache / Direct DNS) |

---

## 2. Configuração de Rede (Netplan) 🔌

Todos os servidores utilizam IP estático configurado via Netplan.

### Servidores HTTP/DNS
Arquivo: `/etc/netplan/01-netcfg.yaml`

```yaml
network:
  version: 2
  renderer: NetworkManager
  ethernets:
    enp0s3:
      dhcp4: no
      addresses: [172.19.50.24/24] # IP da máquina atual
      nameservers:
        addresses: [172.19.50.24]  # DNS aponta sempre para o servidor DNS
```

Aplicar: `sudo netplan apply`

---

### Configuração Especial: Back-end (Híbrido)

O Back-end possui duas interfaces: uma interna para falar com os HTTPs e uma externa (NAT) para buscar dados no MongoDB Atlas.

```yaml
enp0s3: # Interna (Rede do Projeto)
  addresses: [172.19.50.25/24]
  dhcp4: no
enp0s8: # Internet (NAT/Bridge)
  dhcp4: yes
```

---

## 3. Servidores HTTP (Nginx Proxy) 🔄

Arquivo: `/etc/nginx/sites-available/db.meutrabalho.com.br`

```nginx
server {
    listen 80 default_server;
    servername ;

    # Headers de identidade (sem hardcode)
    add_header X-Server-Name  $hostname always;
    add_header X-Server-Addr  $server_addr always;
    add_header X-Server-Port  $server_port always;

    # Endpoint leve para checar a identidade do servidor
    location = /lb-ping {
        add_header Cache-Control "no-store" always;
        return 204;
    }

    # Proxy para o dev server/framework do front em 4200
    location / {
        proxy_pass         http://127.0.0.1:4200/;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;

        # repassar os headers que o bloco acima já adiciona
        add_header X-Server-Name  $hostname always;
        add_header X-Server-Addr  $server_addr always;
        add_header X-Server-Port  $server_port always;

        # evitar cache na camada do LB/CDN
        add_header Cache-Control "no-store" always;
    }
}
```

---

## 4. O Coração do Projeto: DNS BIND9 Dinâmico 🧠

Utilizamos o BIND9 configurado para aceitar atualizações dinâmicas (nsupdate), permitindo que nosso script de monitoramento adicione ou remova IPs em tempo real.

### 4.1. Instalação e Configuração Base

```bash
sudo apt install bind9 bind9utils -y
```

---

### 4.2. Round Robin Cíclico (Ordem Fixa)

Arquivo: `/etc/bind/named.conf.options`

```conf
options {
    directory "/var/cache/bind";

    // Configurações padrões...

    // FORÇA A ORDEM CÍCLICA NA RESPOSTA (O "Pulo do Gato")
    rrset-order { order cyclic; };

    listen-on-v6 { any; };
}
```

---

### 4.3. Zona com Permissão de Update

Arquivo: `/etc/bind/named.conf.local`

```conf
zone "meutrabalho.com.br" {
    type master;
    file "/etc/bind/db.meutrabalho.com.br";
    allow-update { 127.0.0.1; }; // Permite DDNS local via script
};
```

---

### 4.4. Script de Health Check (monitor-dns.sh)

Arquivo: `/usr/local/bin/monitor-dns.sh`

```bash
#!/bin/bash

ZONE="meutrabalho.com.br"
DOMAIN="www.meutrabalho.com.br"
TTL=60
SERVIDORES=("172.19.50.21" "172.19.50.22" "172.19.50.23")
declare -A STATUS_ATUAL

update_dns() {
    ACTION=$1; IP=$2
    nsupdate <<EOF
server 127.0.0.1
zone $ZONE
update $ACTION $DOMAIN $TTL A $IP
send
quit
EOF
}

while true; do
    for ip in "${SERVIDORES[@]}"; do
        if curl -s --connect-timeout 2 "http://$ip" > /dev/null; then
            if [ "${STATUS_ATUAL[$ip]}" != "UP" ]; then
                echo "Servidor $ip UP. Adicionando."
                update_dns "add" $ip
                STATUS_ATUAL[$ip]="UP"
            fi
        else
            if [ "${STATUS_ATUAL[$ip]}" != "DOWN" ]; then
                echo "Servidor $ip DOWN. Removendo."
                update_dns "delete" $ip
                STATUS_ATUAL[$ip]="DOWN"
            fi
        fi
    done
    sleep 5
done
```

---

## 5. Validação e Testes no Cliente 🧪

### Desativar Resolvedor Local

```bash
sudo systemctl stop systemd-resolved
sudo systemctl disable systemd-resolved
```

### Arquivo `/etc/resolv.conf`

```
nameserver 172.19.50.24
```

---

### Teste 1: Round Robin Cíclico

```bash
nslookup www.meutrabalho.com.br
```

A ordem dos IPs rotaciona a cada consulta.

---

### Teste 2: Failover (Health Check)

```bash
watch nslookup www.meutrabalho.com.br
```

Ao desligar o servidor HTTP-01 (172.19.50.21), o IP some da lista em ~5 segundos.  
Ao religar, retorna automaticamente.



