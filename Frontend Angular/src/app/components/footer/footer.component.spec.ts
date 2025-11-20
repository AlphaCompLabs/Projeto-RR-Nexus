/*
 * =====================================================================================
 * Projeto RR-Nexus
 * Versão: 3.1.9
 * Autor(es): Elisa / FrontEnd
 * Data: 02/11/2025
 * Descrição: Testes unitários para garantir a renderização correta do Footer.
 * =====================================================================================
 */

// --- SEÇÃO 1: IMPORTAÇÕES DE TESTE ---
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';
import { By } from '@angular/platform-browser';

// --- SEÇÃO 2: SUÍTE DE TESTES (FooterComponent) ---
describe('FooterComponent', () => {
  
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  // --- SEÇÃO 3: CONFIGURAÇÃO DO AMBIENTE (SETUP) ---
  /**
   * Configura o módulo de teste antes de cada caso.
   * Inicializa o componente standalone e detecta mudanças iniciais.
   */
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent] // Componente standalone
    })
    .compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // --- SEÇÃO 4: CASOS DE TESTE ---

  it('deve ser criado', () => {
    expect(component).toBeTruthy();
  });

  /**
   * Verifica se os links externos estão presentes e apontam
   * para as URLs corretas (Repositório e Organização).
   */
  it('deve renderizar dois links externos (GitHub e AlphaCompLabs)', () => {
    // Busca todas as tags <a> no DOM
    const links = fixture.debugElement.queryAll(By.css('a'));
    
    expect(links.length).toBe(2);

    // Verifica se os links apontam para os endereços certos
    const githubLink = links[0].nativeElement.getAttribute('href');
    const alphaLink = links[1].nativeElement.getAttribute('href');

    expect(githubLink).toBe('https://github.com/AlphaCompLabs/Projeto-RR-Nexus');
    expect(alphaLink).toBe('https://github.com/AlphaCompLabs');
  });

  /**
   * Garante que os ícones SVG (logos) estão sendo carregados
   * a partir do caminho de assets correto.
   */
  it('deve exibir as imagens dos logos corretamente', () => {
    const images = fixture.debugElement.queryAll(By.css('img'));
    
    // Esperamos 2 imagens (os logos)
    expect(images.length).toBe(2);

    expect(images[0].nativeElement.getAttribute('src')).toContain('assets/images/github.svg');
    expect(images[1].nativeElement.getAttribute('src')).toContain('assets/images/alpha-comp-labs.svg');
  });

  /**
   * Valida se o texto estático de rodapé (IESB, Ano) está visível.
   */
  it('deve exibir o texto de copyright correto', () => {
    const p = fixture.debugElement.query(By.css('p')).nativeElement;
    
    // .textContent limpa os espaços em branco extras do HTML para facilitar a comparação
    expect(p.textContent).toContain('Redes de Computadores - IESB, 2025');
  });
});