-- Migração: estende o monitoramento de causa raiz para cobrir mudança de
-- produto também. Rode uma única vez contra o banco de produção já
-- existente (SQL Editor do Neon). Não precisa rodar isso num banco novo,
-- já criado a partir de db/schema.sql, que já vem com essas colunas.

ALTER TABLE causa_hist ADD COLUMN IF NOT EXISTS produto TEXT;
ALTER TABLE causa_alerts ADD COLUMN IF NOT EXISTS produto_anterior TEXT;
ALTER TABLE causa_alerts ADD COLUMN IF NOT EXISTS produto_atual TEXT;
ALTER TABLE causa_verified ADD COLUMN IF NOT EXISTS produto TEXT NOT NULL DEFAULT '';

ALTER TABLE causa_verified DROP CONSTRAINT IF EXISTS causa_verified_pkey;
ALTER TABLE causa_verified ADD PRIMARY KEY (pasta, causa, produto);
