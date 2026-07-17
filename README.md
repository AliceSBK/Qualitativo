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

## Dashboard e acompanhamento

O Dashboard inicial abre com um resumo em texto (taxa geral de pendências, categoria com maior concentração e variação desde a última importação), seguido de KPIs, da tabela mensal de erros, do gráfico de pendências por categoria e de um ranking dos escritórios com mais pendências, agregado por escritório, sem nomes de analistas.

A seção "Acompanhamento" guarda um retrato (snapshot) do resumo da base a cada importação diferente, salvo no navegador (`localStorage`, sem servidor). Mostra evolução do total de pendências ao longo do tempo, comparação categoria a categoria com o retrato anterior e o histórico completo de retratos. Reabrir a mesma base não duplica o histórico, só uma mudança real nos dados gera um novo retrato. Administradores podem limpar esse histórico pelo próprio painel.

## Identidade visual

O layout segue a paleta e a tipografia do SBK Brand Book 2026 (verde escuro como cor dominante, fonte Plus Jakarta Sans com fallback Calibri), no par de contraste "branco sobre verde escuro": o fundo de toda a aplicação, não só da tela de login, é um gradiente verde com uma animação leve de rede de pontos em canvas, fixa e contínua atrás de tudo.

Sidebar, topo, KPIs, cards e tabelas usam superfícies translúcidas com efeito de vidro (`backdrop-filter: blur`), deixando o fundo animado visível através deles e nos espaços entre os cards, mantendo o texto legível por cima.

Há alternância entre tema claro e escuro, com botão no topo da tela de login, no topo do dashboard (barra superior) e no rodapé do menu lateral, com a preferência salva no navegador. O tema escuro usa os tons secundários mais profundos do Brand Book (verde profundo, ciano profundo) como superfícies, mantendo texto claro sobre fundo escuro.

A marca "SBK" no topo do menu e na tela de login é um texto estilizado temporário, criado a partir de uma captura de tela de baixa resolução; deve ser substituído por um arquivo de logo oficial em SVG ou PNG em alta resolução assim que disponível.
