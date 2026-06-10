// DB Terminal storage helper.
// Supabase is the primary store; an in-memory fallback map keeps the terminal
// working when env vars are missing (the site's supabase client becomes a
// no-op stub) or when the terminal_* tables have not been created yet. In
// fallback mode settings/watchlist/levels/journal/news simply do not survive
// a server restart.
//
// IMPORTANT: the stub client in src/lib/supabase.ts returns truthy function
// values for `data`/`error`, so we gate every Supabase call on the env vars
// directly instead of trusting the response shape.

import { supabase } from '@/lib/supabase'

const hasSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export interface JournalTrade {
  id: string
  date: number
  symbol: string
  side: string
  setup: string
  entry: number
  exit: number
  size: number
  stop: number | null
  pnl: number
  rMultiple: number | null
  notes: string
}

export interface NewsItem {
  title: string
  link: string
  date: number | null
  source: string
  savedAt: number
}

interface TerminalMem {
  kv: Map<string, unknown>
  journal: JournalTrade[]
  news: Map<string, NewsItem>
}

// Survives hot reloads and is shared across all route modules in the process
const g = globalThis as unknown as { __terminalMem?: TerminalMem }
const mem: TerminalMem = g.__terminalMem ?? (g.__terminalMem = { kv: new Map(), journal: [], news: new Map() })

// ---------- key/value (settings, watchlist, levels) ----------

export async function getKV<T>(key: string, fallback: T): Promise<T> {
  if (hasSupabase) {
    try {
      const { data, error } = await supabase
        .from('terminal_kv')
        .select('value')
        .eq('key', key)
        .maybeSingle()
      if (!error && data && (data as { value?: unknown }).value != null) {
        return (data as { value: unknown }).value as T
      }
    } catch {
      // table missing or network error -> fall through to memory
    }
  }
  if (mem.kv.has(key)) return mem.kv.get(key) as T
  return fallback
}

export async function setKV(key: string, value: unknown): Promise<void> {
  mem.kv.set(key, value)
  if (hasSupabase) {
    try {
      await supabase
        .from('terminal_kv')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    } catch {
      // best effort -- memory copy already updated
    }
  }
}

// ---------- journal ----------

interface JournalRow {
  id: string
  date: number | string | null
  symbol: string | null
  side: string | null
  setup: string | null
  entry: number | string | null
  exit: number | string | null
  size: number | string | null
  stop: number | string | null
  pnl: number | string | null
  r_multiple: number | string | null
  notes: string | null
}

function toNum(v: number | string | null | undefined): number | null {
  if (v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function rowToTrade(r: JournalRow): JournalTrade {
  return {
    id: r.id,
    date: toNum(r.date) ?? 0,
    symbol: r.symbol ?? '',
    side: r.side ?? '',
    setup: r.setup ?? '',
    entry: toNum(r.entry) ?? 0,
    exit: toNum(r.exit) ?? 0,
    size: toNum(r.size) ?? 0,
    stop: toNum(r.stop),
    pnl: toNum(r.pnl) ?? 0,
    rMultiple: toNum(r.r_multiple),
    notes: r.notes ?? '',
  }
}

export async function listTrades(): Promise<JournalTrade[]> {
  if (hasSupabase) {
    try {
      const { data, error } = await supabase.from('terminal_journal').select('*')
      if (!error && Array.isArray(data)) return (data as JournalRow[]).map(rowToTrade)
    } catch {
      // fall through to memory
    }
  }
  return mem.journal.slice()
}

export async function insertTrade(t: JournalTrade): Promise<void> {
  mem.journal.push(t)
  if (hasSupabase) {
    try {
      await supabase.from('terminal_journal').insert({
        id: t.id,
        date: t.date,
        symbol: t.symbol,
        side: t.side,
        setup: t.setup,
        entry: t.entry,
        exit: t.exit,
        size: t.size,
        stop: t.stop,
        pnl: t.pnl,
        r_multiple: t.rMultiple,
        notes: t.notes,
      })
    } catch {
      // best effort -- memory copy already updated
    }
  }
}

export async function deleteTrade(id: string): Promise<void> {
  mem.journal = mem.journal.filter(t => t.id !== id)
  if (hasSupabase) {
    try {
      await supabase.from('terminal_journal').delete().eq('id', id)
    } catch {
      // best effort
    }
  }
}

// ---------- news archive ----------

export interface RawNewsItem {
  title: string
  link?: string | null
  date?: number | null
  source?: string | null
}

// Insert headlines not seen before (deduped by title). Returns how many were new.
export async function addNews(items: RawNewsItem[]): Promise<number> {
  const now = Date.now()
  const batch = new Map<string, NewsItem>()
  for (const i of items || []) {
    if (!i || typeof i.title !== 'string' || !i.title.trim()) continue
    if (!batch.has(i.title)) {
      batch.set(i.title, {
        title: i.title,
        link: typeof i.link === 'string' ? i.link : '',
        date: typeof i.date === 'number' && Number.isFinite(i.date) ? i.date : null,
        source: typeof i.source === 'string' ? i.source : '',
        savedAt: now,
      })
    }
  }
  if (!batch.size) return 0

  let known: Set<string> | null = null
  if (hasSupabase) {
    try {
      const { data, error } = await supabase
        .from('terminal_news')
        .select('title')
        .in('title', [...batch.keys()])
      if (!error && Array.isArray(data)) {
        known = new Set((data as { title: string }[]).map(r => r.title))
      }
    } catch {
      // fall through to memory dedupe
    }
  }
  if (!known) known = new Set(mem.news.keys())

  const fresh = [...batch.values()].filter(i => !known!.has(i.title))
  for (const i of fresh) mem.news.set(i.title, i)

  if (hasSupabase && fresh.length) {
    try {
      await supabase.from('terminal_news').upsert(
        fresh.map(i => ({ title: i.title, link: i.link, date: i.date, source: i.source, saved_at: i.savedAt })),
        { onConflict: 'title', ignoreDuplicates: true }
      )
    } catch {
      // best effort -- memory copy already updated
    }
  }
  return fresh.length
}

interface NewsRow {
  title: string
  link: string | null
  date: number | string | null
  source: string | null
  saved_at: number | string | null
}

export async function readNews(limit = 5000): Promise<NewsItem[]> {
  if (hasSupabase) {
    try {
      const { data, error } = await supabase
        .from('terminal_news')
        .select('title, link, date, source, saved_at')
        .order('saved_at', { ascending: false })
        .limit(limit)
      if (!error && Array.isArray(data)) {
        return (data as NewsRow[]).map(r => ({
          title: r.title,
          link: r.link ?? '',
          date: toNum(r.date),
          source: r.source ?? '',
          savedAt: toNum(r.saved_at) ?? 0,
        }))
      }
    } catch {
      // fall through to memory
    }
  }
  return [...mem.news.values()]
}

export async function countNews(): Promise<number> {
  if (hasSupabase) {
    try {
      const { count, error } = await supabase
        .from('terminal_news')
        .select('title', { count: 'exact', head: true })
      if (!error && typeof count === 'number') return count
    } catch {
      // fall through to memory
    }
  }
  return mem.news.size
}
