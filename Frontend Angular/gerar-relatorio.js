/*
 * =====================================================================================
 * Projeto RR-Nexus
 * Versão: 3.8.2
 * Autor(es): Elisa / FrontEnd
 * Data: 02/11/2025
 * Descrição: Script Node.js auxiliar para gerar um relatório de testes em Markdown.
 * Lê o JSON gerado pelo Karma e formata uma tabela visual.
 * =====================================================================================
 */

// --- SEÇÃO 1: IMPORTAÇÕES E CAMINHOS ---
const fs = require('fs');
const path = require('path');

// Configuração dos Caminhos
const coverageFolder = path.join(__dirname, 'coverage/projeto-rr-nexus');
const jsonPath = path.join(coverageFolder, 'coverage-summary.json');
const mdPath = path.join(__dirname, 'TESTE_UNITARIO.md');

try {
  // --- SEÇÃO 2: VALIDAÇÃO ---
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Arquivo não encontrado: ${jsonPath}. \nRode 'ng test --no-watch --code-coverage' antes de gerar o relatório.`);
  }
  
  const report = require(jsonPath);
  const total = report.total;
  const files = Object.keys(report).filter(key => key !== 'total');

  // --- SEÇÃO 3: FUNÇÕES AUXILIARES ---
  const getIcon = (pct) => {
    if (pct >= 95) return '🟢';
    if (pct >= 80) return '🟡';
    return '🔴';
  };

  // Formata a célula como: "100% (10/10) 🟢"
  const formatCell = (metric) => {
    return `**${metric.pct}%** (${metric.covered}/${metric.total}) ${getIcon(metric.pct)}`;
  };

  // --- SEÇÃO 4: MONTAGEM DO MARKDOWN ---
  let content = `
# Relatório de Testes Unitários - RR Nexus

**Data:** ${new Date().toLocaleString('pt-BR')}

## Resumo Geral (Totais)

| Categoria | Cobertura (Cobertos/Total) |
| :--- | ---: |
| **Statements** | ${formatCell(total.statements)} |
| **Branches** | ${formatCell(total.branches)} |
| **Functions** | ${formatCell(total.functions)} |
| **Lines** | ${formatCell(total.lines)} |

---

## Detalhamento por Arquivo

| Arquivo | Statements | Branches | Functions | Lines |
| :--- | ---: | ---: | ---: | ---: |
`;

  // --- SEÇÃO 5: LOOP DE ARQUIVOS ---
  files.forEach(filePath => {
    const data = report[filePath];
    
    // Limpeza do caminho do arquivo
    let displayPath = filePath;
    const srcIndex = filePath.indexOf('src');
    
    if (srcIndex !== -1) {
      displayPath = filePath.substring(srcIndex);
    }
    
    // Normaliza as barras para funcionar em Windows e Linux
    displayPath = displayPath.replace(/\\/g, '/');

    // Adiciona a linha na tabela
    content += `| \`${displayPath}\` | ${formatCell(data.statements)} | ${formatCell(data.branches)} | ${formatCell(data.functions)} | ${formatCell(data.lines)} |\n`;
  });

  content += `
---
> *Relatório gerado automaticamente via script.*
`;

  // --- SEÇÃO 6: SALVAR ARQUIVO ---
  fs.writeFileSync(mdPath, content);
  console.log(`Relatório Markdown DETALHADO gerado com sucesso em: \n   ${mdPath}`);

} catch (err) {
  console.error('Erro ao gerar relatório:', err.message);
}