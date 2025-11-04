import { Component, OnInit } from '@angular/core';
// 1. Importe o DatePipe para formatar a data/hora
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-profile-form',
  standalone: true,
  // 2. Adicione o DatePipe aos imports
  imports: [DatePipe],
  templateUrl: './profile-form.component.html',
  styleUrl: './profile-form.component.css'
})
export class ProfileFormComponent implements OnInit {

  // 3. Esta é a "estruturinha" para os dados
  public username: string = 'USERNAME';
  public userId: string = 'ID DO USUÁRIO';
  public sessionId: string = 'SESS-789-XYZ-123';
  public serverName: string = 'Servidor A (Simulado)'; // Requisito do PDF
  public loginTime: Date = new Date(); // Guarda a data/hora do login

  constructor() { }

  ngOnInit(): void {
    // 4. No futuro, chamaremos uma função aqui para
    // carregar estes dados de um serviço (backend)
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    // TODO: Substituir por chamadas reais de API e de Rede
    // Por agora, os dados simulados acima são suficientes.
    console.log('Página de perfil carregada.');
  }
}