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

Este repositório contém dados reais de processos e de analistas embutidos no arquivo. Ele deve permanecer privado no GitHub, e o acesso ao site publicado deve ser restrito (por exemplo, via Deployment Protection da Vercel).

## Administração e controle de acesso

O menu lateral tem uma seção "Administração" para criar usuários e definir quais visões cada um pode acessar (papéis: administrador ou usuário comum). O usuário padrão inicial é `admin` / `admin123`; troque a senha assim que possível pelo próprio painel.

Esse controle é client-side: usuários, senhas e permissões ficam salvos no `localStorage` do navegador, sem servidor nem banco de dados. Ele serve para organizar o uso da ferramenta entre a equipe, mas não é uma barreira de segurança real, qualquer pessoa com acesso ao código-fonte da página pode ver a lista de usuários e senhas ou contornar as restrições de visão pelo console do navegador. Para proteção efetiva dos dados, o controle de acesso à própria URL do site (repositório privado, Deployment Protection na Vercel) é o que importa.
