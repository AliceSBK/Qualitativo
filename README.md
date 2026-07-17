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

## Login e controle de acesso

O sistema exige login antes de mostrar qualquer parte do dashboard: ao abrir o link, aparece uma tela cheia pedindo usuário e senha. Usuário padrão inicial: `admin` / `admin123`, exibido na própria tela enquanto não for alterado. Troque a senha assim que possível pelo painel "Administração" (visível só para administradores após o login).

No painel de Administração é possível criar novos usuários com papel de administrador (acesso total) ou usuário comum (visão limitada às seções escolhidas na criação).

Esse controle é client-side: usuários, senhas, sessão e permissões ficam salvos no navegador (`localStorage`/`sessionStorage`), sem servidor nem banco de dados. A tela de login evita que alguém sem credenciais veja o dashboard casualmente, mas não é uma barreira de segurança real, os dados de qualquer forma trafegam junto com a página, e alguém com conhecimento técnico pode inspecionar o código-fonte da página e ver a lista de usuários e senhas ou contornar as restrições. Para proteção efetiva, o controle de acesso à própria URL do site (repositório privado, Deployment Protection na Vercel) continua sendo o que importa.

A tela de login tem a opção "Lembrar-me": quando marcada, a sessão fica salva entre reinícios do navegador (`localStorage`); quando desmarcada, encerra ao fechar a aba (`sessionStorage`). O link "Esqueceu a senha?" não redefine nada automaticamente (não há e-mail nem backend), só orienta a procurar um administrador para trocar a senha pelo painel.

## Identidade visual

O layout segue a paleta e a tipografia do SBK Brand Book 2026 (verde escuro como cor dominante, fonte Plus Jakarta Sans com fallback Calibri). O dashboard em si usa o par de contraste "verde escuro sobre off-white/branco"; a tela de login usa o par inverso, "branco sobre verde escuro", com um fundo em gradiente verde e uma animação leve de rede de pontos em canvas.

Há alternância entre tema claro e escuro (botão no topo da tela de login e no rodapé do menu lateral), com a preferência salva no navegador. O tema escuro usa os tons secundários mais profundos do Brand Book (verde profundo, ciano profundo) como superfícies, mantendo texto claro sobre fundo escuro.

A marca "SBK" no topo do menu e na tela de login é um texto estilizado temporário, criado a partir de uma captura de tela de baixa resolução; deve ser substituído por um arquivo de logo oficial em SVG ou PNG em alta resolução assim que disponível.
