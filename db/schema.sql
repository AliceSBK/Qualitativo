-- Qualidade de Cadastro: schema do backend compartilhado.
-- Roda em Postgres (Vercel Postgres / Neon em produção, Postgres local em dev).
-- Aplique com: psql "$POSTGRES_URL" -f db/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'usuario' CHECK (role IN ('admin', 'usuario')),
  views JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dataset compartilhado (equivalente ao antigo `const D` embutido no HTML).
-- Uma única linha (id=1), substituída inteira a cada importação da base.
CREATE TABLE IF NOT EXISTS app_data (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT
);

-- "Marcados corrigidos" (manual ou automático pelo importBase).
CREATE TABLE IF NOT EXISTS corrections (
  pasta TEXT NOT NULL,
  category TEXT NOT NULL,
  corrected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  corrected_by TEXT,
  PRIMARY KEY (pasta, category)
);

-- Base de tarefas de complementação ("Minhas tarefas"), só as
-- "Complementar Cadastro" abertas. Substituída inteira a cada importação.
CREATE TABLE IF NOT EXISTS tasks (
  pasta TEXT NOT NULL,
  processo TEXT,
  prazo TIMESTAMPTZ,
  PRIMARY KEY (pasta)
);

CREATE TABLE IF NOT EXISTS task_meta (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  file_name TEXT,
  count INT,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Estado auxiliar da importação de tarefas: quais pastas tinham tarefa
-- aberta na última importação (pra comparar com a próxima) e quais estão
-- atualmente marcadas como "Inicial disponibilizada incompleta".
CREATE TABLE IF NOT EXISTS task_state (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  open_pastas JSONB NOT NULL DEFAULT '[]',
  incomplete_pastas JSONB NOT NULL DEFAULT '[]'
);

-- Última causa raiz conhecida por pasta (fora de "A Classificar").
CREATE TABLE IF NOT EXISTS causa_hist (
  pasta TEXT PRIMARY KEY,
  causa TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Alertas de mudança de causa raiz (append/upsert por pasta).
CREATE TABLE IF NOT EXISTS causa_alerts (
  pasta TEXT PRIMARY KEY,
  processo TEXT,
  causa_anterior TEXT,
  causa_atual TEXT,
  detectado_em TEXT
);

-- Assinaturas (pasta+causa) já verificadas, para não repetir o alerta.
CREATE TABLE IF NOT EXISTS causa_verified (
  pasta TEXT NOT NULL,
  causa TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_by TEXT,
  PRIMARY KEY (pasta, causa)
);

-- Histórico de retratos (Acompanhamento), um por importação distinta.
CREATE TABLE IF NOT EXISTS snapshots (
  id SERIAL PRIMARY KEY,
  ts BIGINT NOT NULL,
  sig TEXT NOT NULL,
  total_processos INT NOT NULL,
  tot INT NOT NULL,
  summary JSONB NOT NULL
);

-- Usuário administrador padrão inicial (senha: admin123).
-- Troque pelo painel de Administração assim que possível.
-- Hash bcrypt de "admin123" com custo 10.
INSERT INTO users (username, password_hash, role, views)
VALUES ('admin', '$2a$10$CXeemSIB1sG4XoXfboZem.IvAOTkImj2L1LBULvh.tfPQgp6XevFW', 'admin', '[]')
ON CONFLICT (username) DO NOTHING;
