-- ═══════════════════════════════════════════════════════════════════════
-- Ops Dashboard — Postgres Schema (Supabase)
-- Project: dbtech45-os (hnkjhhabebzmcwwhhfeu)
-- ═══════════════════════════════════════════════════════════════════════

-- Models (LLM fleet configuration)
CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('anthropic','openai','google','meta','other')),
  role_description TEXT NOT NULL DEFAULT '',
  tier TEXT NOT NULL DEFAULT 'primary' CHECK (tier IN ('primary','backup')),
  api_key_env TEXT NOT NULL DEFAULT '',
  max_context_tokens INTEGER NOT NULL DEFAULT 200000,
  cost_per_input_token NUMERIC(12,8) NOT NULL DEFAULT 0,
  cost_per_output_token NUMERIC(12,8) NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Agents (org chart nodes)
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  responsibilities TEXT[] NOT NULL DEFAULT '{}',
  parent_agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
  department TEXT,
  division TEXT,
  primary_model_id TEXT REFERENCES models(id),
  backup_model_id TEXT REFERENCES models(id),
  tools TEXT[] NOT NULL DEFAULT '{}',
  is_human BOOLEAN NOT NULL DEFAULT false,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Workspaces (agent persistent identities)
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  primary_model_id TEXT REFERENCES models(id),
  backup_model_id TEXT REFERENCES models(id),
  special_model_id TEXT REFERENCES models(id),
  has_own_gateway BOOLEAN NOT NULL DEFAULT false,
  heartbeat_enabled BOOLEAN NOT NULL DEFAULT false,
  tools TEXT[] NOT NULL DEFAULT '{}',
  memory_enabled BOOLEAN NOT NULL DEFAULT true,
  memory_namespace TEXT NOT NULL DEFAULT '',
  memory_retention_days INTEGER NOT NULL DEFAULT 90,
  soul_prompt TEXT NOT NULL DEFAULT '',
  long_term_goals TEXT[] NOT NULL DEFAULT '{}',
  model_routing_rules JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','maintenance')),
  last_heartbeat TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sessions (agent runtime sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agent_id TEXT NOT NULL REFERENCES agents(id),
  agent_name TEXT NOT NULL,
  model_id TEXT REFERENCES models(id),
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('running','idle','error','completed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  tokens_in BIGINT NOT NULL DEFAULT 0,
  tokens_out BIGINT NOT NULL DEFAULT 0,
  cost_estimate NUMERIC(10,4) NOT NULL DEFAULT 0,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Messages (session transcripts)
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system','tool')),
  content TEXT NOT NULL,
  agent_id TEXT REFERENCES agents(id),
  model_id TEXT REFERENCES models(id),
  tokens_used INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, created_at);

-- Cron Jobs
CREATE TABLE IF NOT EXISTS cron_jobs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  schedule TEXT NOT NULL,
  agent_id TEXT NOT NULL REFERENCES agents(id),
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  last_status TEXT NOT NULL DEFAULT 'pending' CHECK (last_status IN ('success','fail','pending','running')),
  next_run_at TIMESTAMPTZ,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Job Runs (execution history)
CREATE TABLE IF NOT EXISTS job_runs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  job_id TEXT NOT NULL REFERENCES cron_jobs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('success','fail','running')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  output TEXT,
  error_message TEXT,
  tokens_used INTEGER,
  cost_estimate NUMERIC(10,4)
);
CREATE INDEX IF NOT EXISTS idx_job_runs_job ON job_runs(job_id, started_at DESC);

-- Standups
CREATE TABLE IF NOT EXISTS standups (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  topic TEXT,
  participant_agent_ids TEXT[] NOT NULL DEFAULT '{}',
  schedule TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Standup Runs
CREATE TABLE IF NOT EXISTS standup_runs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  standup_id TEXT NOT NULL REFERENCES standups(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','running','completed','failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  summary TEXT,
  audio_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_standup_runs_standup ON standup_runs(standup_id, started_at DESC);

-- Standup Messages (conversation transcript)
CREATE TABLE IF NOT EXISTS standup_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  standup_run_id TEXT NOT NULL REFERENCES standup_runs(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES agents(id),
  agent_name TEXT NOT NULL,
  content TEXT NOT NULL,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  msg_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_standup_msgs_run ON standup_messages(standup_run_id, msg_order);

-- Action Items (from standups)
CREATE TABLE IF NOT EXISTS action_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  standup_run_id TEXT NOT NULL REFERENCES standup_runs(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  owner_agent_id TEXT NOT NULL REFERENCES agents(id),
  owner_agent_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done')),
  linked_task_id TEXT,
  linked_session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_action_items_run ON action_items(standup_run_id);

-- Docs (living documentation)
CREATE TABLE IF NOT EXISTS docs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'overview' CHECK (category IN ('overview','task-manager','org-chart','workspaces','standups','changelog')),
  doc_order INTEGER NOT NULL DEFAULT 0,
  auto_generated BOOLEAN NOT NULL DEFAULT false,
  last_generated_by TEXT REFERENCES agents(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_docs_category ON docs(category, doc_order);

-- Change Log (audit trail, triggers doc updates)
CREATE TABLE IF NOT EXISTS change_log (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('agent','workspace','model','job','standup','doc')),
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created','updated','deleted')),
  changes JSONB NOT NULL DEFAULT '{}',
  triggered_by TEXT NOT NULL DEFAULT 'human',
  doc_update_required BOOLEAN NOT NULL DEFAULT false,
  doc_updated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_changelog_entity ON change_log(entity_type, entity_id);

-- Config (key-value store)
CREATE TABLE IF NOT EXISTS ops_config (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT '',
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════
-- Updated_at triggers
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ 
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['models','agents','workspaces','cron_jobs','standups','docs','ops_config']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_updated_at ON %I', t);
    EXECUTE format('CREATE TRIGGER trg_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t);
  END LOOP;
END $$;
