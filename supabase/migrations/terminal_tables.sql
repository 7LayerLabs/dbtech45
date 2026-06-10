-- DB Terminal persistence tables
-- Single-user personal site: RLS is intentionally DISABLED below. If your
-- Supabase project enforces RLS on new tables, either keep the DISABLE
-- statements or replace them with a permissive policy, e.g.:
--   create policy "terminal all" on terminal_kv for all using (true) with check (true);
-- Without these tables (or without Supabase env vars) the app still works --
-- the storage layer falls back to in-memory maps that reset on restart.

-- Generic key/value store for settings, watchlist, levels
-- (keys used: 'settings', 'watchlist', 'levels')
create table if not exists terminal_kv (
  key text primary key,
  value jsonb,
  updated_at timestamptz default now()
);

-- Trade journal (dates are epoch milliseconds)
create table if not exists terminal_journal (
  id text primary key,
  date bigint,
  symbol text,
  side text,
  setup text,
  entry numeric,
  exit numeric,
  size numeric,
  stop numeric,
  pnl numeric,
  r_multiple numeric,
  notes text
);

-- Append-only news archive, deduped by title (epoch ms timestamps)
create table if not exists terminal_news (
  title text primary key,
  link text,
  date bigint,
  source text,
  saved_at bigint
);

create index if not exists terminal_news_date_idx on terminal_news (date desc);
create index if not exists terminal_news_source_idx on terminal_news (source);
create index if not exists terminal_journal_date_idx on terminal_journal (date desc);

-- Single-user site: no row-level security
alter table terminal_kv disable row level security;
alter table terminal_journal disable row level security;
alter table terminal_news disable row level security;
