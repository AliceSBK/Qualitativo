# Qualitativo — Qualidade de Cadastro (Legal Ops Cível)

Dashboard em HTML/CSS/JavaScript (frontend em um único arquivo, `index.html`) para análise de qualidade de cadastro de processos cíveis, com um backend próprio (funções serverless da Vercel + banco Postgres) que centraliza usuários, dados importados, correções, tarefas e histórico, para que fiquem iguais para todo mundo que faz login, em qualquer dispositivo.

## Estrutura

- `index.html`: frontend completo (HTML, CSS e JavaScript em um único arquivo). Fala com o backend só via `fetch`, nenhum dado compartilhado fica salvo no navegador.
- `api/`: funções serverless da Vercel (uma por rota: `login`, `users`, `data`, `corrections`, `tasks`, `causa`, `snapshots`).
- `lib/`: conexão com o Postgres (`db.js`) e autenticação por JWT (`auth.js`), usadas pelas funções em `api/`.
- `db/schema.sql`: schema completo do banco (tabelas, chaves, índices). Rodar uma única vez contra o banco de produção.
- `db/seed-data.json`: dataset inicial, usado só para popular o banco automaticamente no primeiro acesso, se a tabela `app_data` estiver vazia.
- `package.json`: dependências do backend (`pg`, `bcryptjs`, `jsonwebtoken`).

## Rodando localmente

Requer Node.js e um Postgres acessível (local ou remoto).

```bash
npm install
```

Crie um arquivo `.env.local` (não versionado) na raiz com:

```
POSTGRES_URL=postgres://usuario:senha@host:5432/nome_do_banco
JWT_SECRET=uma-string-aleatoria-e-longa
```

Rode o schema uma vez contra esse banco:

```bash
psql "$POSTGRES_URL" -f db/schema.sql
```

Depois, para servir o frontend e as funções de `api/` juntos como a Vercel faria, use a CLI da Vercel:

```bash
npx vercel dev
```

O schema já cria o usuário administrador padrão `admin` / `admin123` (senha com hash bcrypt); troque-a assim que possível pelo painel de Administração.

## Deploy

Este projeto está configurado para deploy automático na Vercel a partir do GitHub. Qualquer push na branch principal gera um novo deploy em produção; pushes em outras branches e Pull Requests geram deploys de preview.

Para o backend funcionar em produção, é preciso, uma única vez, no painel da Vercel (aba **Storage** ou **Settings → Environment Variables** do projeto):

1. Provisionar um banco Postgres (Vercel Postgres/Neon, ou qualquer Postgres acessível pela internet) e copiar a URL de conexão.
2. Definir a variável de ambiente `POSTGRES_URL` com essa URL, e `JWT_SECRET` com uma string aleatória longa (por exemplo, gerada com `openssl rand -hex 32`). Ambas devem estar disponíveis pelo menos no ambiente de produção; se quiser testar deploys de preview também, defina nos três ambientes (Production, Preview, Development).
3. Rodar `db/schema.sql` uma vez contra esse banco de produção (pelo `psql`, apontando para a mesma `POSTGRES_URL`, ou pela aba de console SQL do provedor do banco).
4. Fazer um novo deploy (ou redeploy) depois de configurar as variáveis, para que as funções em `api/` passem a enxergá-las.

No primeiro acesso ao dashboard publicado, o backend popula automaticamente a tabela de dados a partir de `db/seed-data.json`, e o login inicial é `admin` / `admin123` (troque assim que entrar).

Este repositório contém dados reais de processos e de analistas embutidos no arquivo `db/seed-data.json`. Ele deve permanecer privado no GitHub, o `POSTGRES_URL`/`JWT_SECRET` nunca devem ser commitados (ficam só em `.env.local`, que está no `.gitignore`, e nas variáveis de ambiente da Vercel), e o acesso ao site publicado deve ser restrito (por exemplo, via Deployment Protection da Vercel), além do login já exigido pela própria aplicação.

## Login e controle de acesso

O sistema exige login antes de mostrar qualquer parte do dashboard: ao abrir o link, aparece uma tela cheia pedindo usuário e senha. Usuário padrão inicial: `admin` / `admin123`, exibido na própria tela enquanto não for alterado. Troque a senha assim que possível pelo painel "Administração" (visível só para administradores após o login).

No painel de Administração é possível criar novos usuários com papel de administrador (acesso total) ou usuário comum (visão limitada às seções escolhidas na criação, e sem permissão de importar, exportar ou marcar/verificar nada, só visualizar).

Usuários, senhas (com hash bcrypt) e permissões ficam no banco Postgres, não no navegador. O login gera um token (JWT) que o navegador guarda em `localStorage` (se "Lembrar-me" estiver marcado) ou `sessionStorage` (senão, some ao fechar a aba); a cada ação, o navegador envia esse token e o backend confere quem é o usuário e se ele tem permissão antes de responder. Perfil "usuário comum" é reforçado dos dois lados: a interface esconde os controles de importação/exportação/marcação, e as funções em `api/` recusam essas ações (HTTP 403) mesmo que alguém tente chamá-las diretamente, sem passar pela tela.

Como tudo fica centralizado no banco, qualquer usuário criado ou dado importado por um administrador aparece automaticamente para todo mundo que fizer login, em qualquer dispositivo, sem precisar reimportar nada.

A tela de login tem a opção "Lembrar-me": quando marcada, o token fica salvo entre reinícios do navegador (`localStorage`); quando desmarcada, encerra ao fechar a aba (`sessionStorage`). O link "Esqueceu a senha?" não redefine nada automaticamente (não há envio de e-mail), só orienta a procurar um administrador para trocar a senha pelo painel.

## Dashboard e acompanhamento

O Dashboard inicial abre com um resumo em texto (taxa geral de pendências, categoria com maior concentração e variação desde a última importação), seguido de KPIs, da tabela mensal de erros, do gráfico de pendências por categoria e de um ranking dos escritórios com mais pendências, agregado por escritório, sem nomes de analistas. O ranking soma erros de roteamento (Escritórios) com pendências de "A Classificar" que **ainda não têm tarefa de complementação aberta**: disponibilizar a inicial é responsabilidade do escritório, mas só conta como pendência dele enquanto ninguém ainda pediu essa complementação.

A seção "Acompanhamento" guarda um retrato (snapshot) do resumo da base a cada importação diferente, salvo no banco e compartilhado entre todos os usuários. Mostra evolução do total de pendências ao longo do tempo, comparação categoria a categoria com o retrato anterior e o histórico completo de retratos. Reabrir a mesma base não duplica o histórico, só uma mudança real nos dados gera um novo retrato. Administradores podem limpar esse histórico pelo próprio painel.

## Importação da base de processos

O card "Base de processos" agora recalcula de verdade seis categorias a partir da planilha bruta importada (mesmo formato usado para montar o snapshot atual: colunas como `nr_pasta`, `nr_processo`, `ds_causa_raiz`, `ds_produto`, `ds_situacao`, `dt_entrada`, `nm_escritorio`, `nm_advogado_do_autor`, `ds_orgao`, `ds_estado`): **A Classificar**, **Venda Enganosa**, **MBA pós 04/07**, **Marco A. Peixoto**, **Cleyton S. Barbosa** e **Órgão (CNJ)**. As regras foram validadas comparando a planilha bruta contra exportações reais do próprio sistema, com correspondência de 98% a 100%, dependendo da categoria.

O órgão esperado vem do próprio número do processo: o padrão CNJ (`NNNNNNN-DD.AAAA.J.TR.OOOO`) já indica se o caso é da Justiça Estadual (segmento `8`, órgão esperado é o TJ do estado) ou da Justiça Federal (segmento `4` ou `5`, órgão esperado é a JF do estado), e o estado vem da coluna `ds_estado`. Antes desse ajuste, "Órgão" ficava congelado desde a primeira importação: uma comparação contra uma exportação real mostrou que 403 dos 586 casos listados já tinham sido corrigidos na base de origem, mas continuavam aparecendo como pendentes por esse motivo.

As demais categorias (**Escritórios**, **Bancoob**, **Cessão de Crédito**, **Campos Vazios**, **Superendividamento/Estratégico >200k**) dependem de tabelas de roteamento (por exemplo, qual analista interno atende cada tipo de cessão, ou qual escritório deveria receber cada causa raiz) que não estão presentes na planilha de processos, só na planilha bruta é possível ver o resultado já aplicado, não a regra. Elas continuam com os valores da última importação até que a regra exata seja informada ou seja possível portar o processo que já gera esses números hoje.

Ao importar uma nova base, pastas que saíram de uma dessas cinco categorias (ex.: causa raiz que estava vazia e agora foi preenchida) são marcadas como **corrigidas automaticamente**, sem precisar selecionar e marcar manualmente.

## Correções marcadas ficam salvas

"Marcados corrigidos" (manual ou automático) fica salvo no banco, compartilhado entre todos os usuários: não zera ao recarregar a página, abrir uma nova sessão ou logar em outro dispositivo.

## A Classificar — tarefas de complementação

O card "Tarefas de complementação" no menu lateral importa o relatório de tarefas (ex.: exportação "Minhas tarefas" do sistema de tarefas). Ele só considera tarefas cujo título contenha "Complementar Cadastro" (ignora "AJUSTE DE CADASTRO" e qualquer outro tipo) e casa pela pasta ou processo extraídos do título com os registros de "A Classificar". Um filtro na própria tela permite ver só quem tem tarefa complementar aberta (ou só quem não tem). Essa base fica salva no banco, compartilhada entre todos os usuários, então não precisa reimportar a cada vez que a base de processos é atualizada, a sessão reinicia ou alguém loga em outro dispositivo.

A tabela de "A Classificar" não mostra mais analista, essa pendência é por falta de acesso à inicial, não erro de analista. Em vez disso mostra se já existe uma tarefa "Complementar Cadastro" aberta para aquela pasta e o prazo de atendimento (vindo da coluna "Prazo" do relatório de tarefas), que é o prazo de complementação que o escritório abre quando disponibiliza a inicial. No topo da tela, dois indicadores mostram quantos casos já têm tarefa aberta (aguardando o escritório) e quantos ainda não (a complementação nem foi pedida ainda).

O sistema também guarda, no servidor, quais pastas tinham tarefa complementar aberta na última importação da planilha de tarefas. Se numa importação seguinte essa tarefa não aparecer mais aberta, mas a pasta continuar em "A Classificar" (causa raiz ou produto ainda vazios), o status passa a mostrar **"Inicial disponibilizada incompleta"** em vez de simplesmente "Pendente", sinalizando que o escritório encerrou a tarefa sem realmente completar o cadastro.

## Monitoramento de mudança de causa raiz

Nova seção "Mudança de Causa Raiz", em "Monitoramento" (separada de "Erros de Classificação" de propósito: isso não é pendência de erro de cadastro, é controle de mudança de glossário). A cada importação da base de processos, o sistema compara a causa raiz atual de cada pasta com a última causa raiz conhecida (guardada no banco, compartilhada entre todos os usuários). Casos em "A Classificar" nunca entram nessa comparação. Se uma pasta já classificada mudar de causa raiz entre duas importações (ex.: estava "Alegação de fraude" e passou a "Venda enganosa"), aparece um alerta aqui.

O alerta não é "corrigido", é **verificado**: quem revisar confirma que a mudança está correta (ou corrige o cadastro por fora) e marca como verificado, o que remove aquela mudança específica da contagem de pendências. Se a mesma pasta mudar de causa raiz de novo depois de verificada, um novo alerta é gerado.

## Regras de direcionamento por advogado

Além do Marco Antonio Peixoto, existe a mesma lógica de painel para o advogado **Cleyton da Silva Barbosa** (CPF 025.063.501-10, OAB/MS 17.311): ações cadastradas a partir de 15/07/2026 devem ser direcionadas ao MBA Advogados, independente de causa raiz, com Samuel Ribeiro da Silva como responsável interno pela conferência. Esse painel já usa dados reais, recalculados a partir da base de processos (ver seção acima).

## Identidade visual

O layout segue a paleta e a tipografia do SBK Brand Book 2026 (verde escuro como cor dominante, fonte Plus Jakarta Sans com fallback Calibri), no par de contraste "branco sobre verde escuro": o fundo de toda a aplicação, não só da tela de login, é um gradiente verde com uma animação leve de rede de pontos em canvas, fixa e contínua atrás de tudo.

Sidebar, topo, KPIs, cards e tabelas usam superfícies translúcidas com efeito de vidro (`backdrop-filter: blur`), deixando o fundo animado visível através deles e nos espaços entre os cards, mantendo o texto legível por cima.

Há alternância entre tema claro e escuro, com botão no topo da tela de login, no topo do dashboard (barra superior) e no rodapé do menu lateral, com a preferência salva no navegador. O tema escuro usa os tons secundários mais profundos do Brand Book (verde profundo, ciano profundo) como superfícies, mantendo texto claro sobre fundo escuro.

A marca "SBK" no topo do menu e na tela de login é um texto estilizado temporário, criado a partir de uma captura de tela de baixa resolução; deve ser substituído por um arquivo de logo oficial em SVG ou PNG em alta resolução assim que disponível.
