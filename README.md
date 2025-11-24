<html>
<div align="center">
    <img src="./logo_readme.svg" alt="RR Nexus - Sessões Contínuas" width="800" style="max-width: 100%;">

  <br>
  <p>
    <strong><h3>Tecnologias Utilizadas:</h3></strong>
    <div style="height: 5px;"></div>
    <img src="https://img.shields.io/badge/Frontend-Angular_18-EA1EF3?style=for-the-badge&logo=angular&logoColor=white" alt="Angular">
    &nbsp;&nbsp;&nbsp;
    <img src="https://img.shields.io/badge/Styling-Tailwind_CSS-EA1EF3?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind">
    <br><br>
    <div style="height: 10px;"></div>
    <img src="https://img.shields.io/badge/Backend-Node.js_Express-8C0590?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="NodeJS">
    &nbsp;&nbsp;&nbsp;
    <img src="https://img.shields.io/badge/Database-MongoDB-8C0590?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
    <br><br>
    <div style="height: 10px;"></div>
    <img src="https://img.shields.io/badge/Server-Nginx-5B0772?style=for-the-badge&logo=nginx&logoColor=white" alt="Nginx">
    &nbsp;&nbsp;&nbsp;
    <img src="https://img.shields.io/badge/OS-Linux_Mint-5B0772?style=for-the-badge&logo=linuxmint&logoColor=white" alt="Linux Mint">
    &nbsp;&nbsp;&nbsp;
    <img src="https://img.shields.io/badge/Infra-Round_Robin_DNS-5B0772?style=for-the-badge&logo=dns&logoColor=white" alt="RR DNS">
  </p>

  <p>
    Redes de Computadores - IESB 2025
  </p>
</div>
</html><br>


---

## 📖 Sobre o Projeto

O **Projeto RR-Nexus** é uma implementação prática de uma arquitetura de aplicação web distribuída, focada em resolver desafios de **escalabilidade horizontal** e **disponibilidade**.

O objetivo central é demonstrar como manter a persistência de sessão do usuário (stateful) em um ambiente onde o balanceamento de carga é feito via **DNS Round Robin (stateless)**, garantindo que o usuário permaneça logado independentemente de qual servidor atenda sua requisição.

### 🎯 Objetivos de Aprendizagem
* Implementação de arquitetura de 3 camadas (Apresentação, Lógica, Dados).
* Configuração de servidor DNS com estratégia Round Robin.
* Resolução do problema de "Sessão Desconectada" em ambientes distribuídos sem uso de *sticky sessions*.
* Monitoramento e identificação do servidor respondente (hostname).

---

## 🏗️ Arquitetura da Solução

O ambiente de produção simulado é composto por **5 Máquinas Virtuais (VMs) rodando Linux Mint**, configuradas em rede:

1.  **3x VMs de Aplicação (HTTP):** Hospedam o servidor Web (Frontend + Backend).
2.  **1x VM de DNS:** Servidor de Nomes autoritativo configurado para distribuir o tráfego rotativamente.
3.  **1x VM de Banco de Dados:** Hospeda a conexão com o MongoDB e centraliza as informações.

### O Desafio da Sessão Centralizada
Como o DNS Round Robin apenas alterna o IP de destino sem conhecimento do estado da aplicação, um usuário poderia logar no **Servidor A** e, na próxima requisição, cair no **Servidor B**, sendo desconectado.

**Nossa Solução:** Implementamos um mecanismo onde a sessão é persistida na coleção `sessoes` do banco `granada`. Qualquer servidor da aplicação consulta este "Cadernão Central" para validar o acesso, tornando o login transparente para o usuário.

---

## 🧩 Módulos do Projeto & Instruções de Ativação

Cada componente possui instruções específicas de inicialização dentro de seus diretórios. Siga a ordem abaixo para subir a infraestrutura.

### 1. 🗄️ Banco de Dados (Persistência)
* **VM Alvo:** VM de Banco de Dados
* **Tecnologia:** MongoDB (Atlas/Local)
* **Cluster/Base:** NetvisionBD / `granada`
* **Detalhes:** Utiliza índices **TTL (Time-To-Live)** na coleção `sessoes` para expiração automática.
* [🔗 Ir para Documentação do Banco de Dados](./Database/README.md)

### 2. 📡 Redes & DNS (Infraestrutura)
* **VM Alvo:** VM de DNS
* **Função:** Balanceamento Round Robin e resolução de nomes.
* **Estratégia:** Distribuição cíclica de IPs para o domínio `www.meutrabalho.com.br`.
* [🔗 Ir para Documentação e Tutorial de Ativação de Redes](./Network/README.md)

### 3. ⚙️ Backend (Aplicação)
* **VMs Alvo:** VMs de Aplicação 01, 02 e 03.
* **Função:** Autenticação, validação de sessão e API.
* **Lógica:** Garante que o token de sessão seja válido independente da instância (VM) que o processa.
* [🔗 Ir para Documentação e Tutorial de Ativação do Backend](./Backend/README.md)

### 4. 💻 Frontend (Apresentação)
* **VMs Alvo:** VMs de Aplicação 01, 02 e 03.
* **Função:** Interface do usuário (Login e Dashboard).
* **Requisito:** Exibe o **hostname** da VM Linux Mint que está respondendo.
* [🔗 Ir para Documentação e Tutorial de Ativação do Frontend](./Frontend%20Angular/README.md)

---

## 🚀 Fluxo de Execução Geral

Após ativar os componentes individuais conforme os links acima:

1.  **Configuração do Cliente:** Aponte o DNS da sua máquina local para o IP da **VM de DNS**.
2.  **Acesso:** Abra o navegador e digite `www.meutrabalho.com.br`.
3.  **Teste de Carga:**
    * Faça Login.
    * Limpe o cache de DNS (`ipconfig /flushdns` ou via browser).
    * Atualize a página e observe a troca de servidores mantendo a sessão ativa.

---

## 🤝 Padrões de Contribuição

Para garantir a qualidade e consistência do código entre as equipes, seguimos regras estritas.

**Pontos Chave:**
* ✅ **Commits:** Mensagens claras e atômicas.
* ✅ **Código:** Variáveis em inglês, sem valores *hardcoded*.
* ✅ **Logs:** Uso de logging estruturado.

Antes de abrir um Pull Request, leia o guia completo:
👉 [**CODING_STANDARDS.md**](./CODING_STANDARDS.md)

---

## 📝 Checklist de Avaliação

Este projeto foi desenvolvido para atender aos critérios rigorosos da avaliação:

| Status | Requisito | Detalhe |
| :---: | :--- | :--- |
| 🟢 | **Infraestrutura** | 5 VMs Linux Mint (3 HTTP, 1 DNS, 1 Banco). |
| 🔄 | **Round Robin** | O DNS alterna os IPs das VMs corretamente a cada consulta. |
| 💾 | **Sessão Centralizada** | Usuário permanece logado mesmo trocando de VM física. |
| 🏷️ | **Observabilidade** | Hostname da VM é exibido na interface do usuário. |
| 🗺️ | **Documentação** | Mapa de Rede desenhado com IPs e nomes dos servidores. |
| 🧪 | **Qualidade** | Testes Unitários automatizados implementados. |
| ✨ | **Ponto Extra** | **Failover:** Se uma VM HTTP for desligada, o sistema detecta e redireciona. |

---

<div align="center"><br>
Made by <i><strong>AlphaCompLabs</strong></i> 🐺
</div>
