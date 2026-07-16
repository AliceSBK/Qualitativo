# Qualitativo — Qualidade de Cadastro (Legal Ops Cível)

Dashboard estático em HTML/CSS/JavaScript puro para análise de qualidade de cadastro de processos cíveis. Não requer build nem backend: todo o processamento (leitura de planilhas via `xlsx.full.min.js` e gráficos via `Chart.js`) acontece no navegador do usuário.

## Estrutura

- `index.html`: aplicação completa (HTML, CSS e JavaScript em um único arquivo).

## Rodando localmente

Basta abrir o arquivo `index.html` em um navegador, ou servir a pasta com qualquer servidor estático, por exemplo:

```bash
npx serve .
```

## Deploy

Este projeto está configurado para deploy automático na Vercel a partir do GitHub. Qualquer push na branch principal gera um novo deploy em produção; pushes em outras branches e Pull Requests geram deploys de preview.
