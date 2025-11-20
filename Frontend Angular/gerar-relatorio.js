const fs = require('fs');
const path = require('path');

// 1. Configuração dos Caminhos
// Verifique se o nome da pasta 'projeto-rr-nexus' está igual ao gerado no coverage
const coverageFolder = path.join(__dirname, 'coverage/projeto-rr-nexus');
const jsonPath = path.join(coverageFolder, 'coverage-summary.json');
const mdPath = path.join(__dirname, 'TESTE_UNITARIO.md');

try {
  // 2. Validação
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Arquivo não encontrado: ${jsonPath}. \nRode 'ng test --no-watch --code-coverage' antes de gerar o relatório.`);
  }
  
  const report = require(jsonPath);
  const total = report.total;
  const files = Object.keys(report).filter(key => key !== 'total');

  // 3. Funções Auxiliares
  const getIcon = (pct) => {
    if (pct >= 95) return '🟢';
    if (pct >= 80) return '🟡';
    return '🔴';
  };

  // Formata a célula como: "100% (10/10) 🟢"
  const formatCell = (metric) => {
    return `**${metric.pct}%** (${metric.covered}/${metric.total}) ${getIcon(metric.pct)}`;
  };

  // 4. Início do Markdown
  let content = `
# Testes Unitários - FrontEnd - RR Nexus

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

  // 5. Loop pelos arquivos
  files.forEach(filePath => {
    const data = report[filePath];
    
    // Limpeza do caminho do arquivo (para remover C:/Users/...)
    // Tenta pegar o caminho relativo a partir de 'src' ou da raiz
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

  // 6. Salvar
  fs.writeFileSync(mdPath, content);
  console.log(`Relatório Markdown DETALHADO gerado com sucesso em: \n   ${mdPath}`);

} catch (err) {
  console.error('Erro ao gerar relatório:', err.message);
}