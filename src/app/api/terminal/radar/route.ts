// GET/POST/DELETE /api/terminal/radar — "MY RADAR" curiosity list.
// GET    -> { items: [{symbol, note, addedAt, price, change, changePct}] } (live quote enriched)
// POST   -> { symbol, note } adds/replaces (deduped by symbol), returns updated list (no quotes)
// DELETE -> { symbol } removes, returns updated list (no quotes)
// Persisted under KV key 'radar' (Supabase-primary, in-memory fallback).

import { NextRequest, NextResponse } from 'next/server'
import { getKV, setKV } from '@/lib/terminal/store'
import { getQuotes, cleanSymbol } from '@/lib/terminal/marketData'

export const dynamic = 'force-dynamic'

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e))

interface RadarEntry {
  symbol: string
  note: string
  addedAt: number
}

interface RadarItem extends RadarEntry {
  price: number | null
  change: number | null
  changePct: number | null
}

async function readList(): Promise<RadarEntry[]> {
  const raw = await getKV<RadarEntry[]>('radar', [])
  if (!Array.isArray(raw)) return []
  return raw
    .filter((e) => e && typeof e === 'object' && typeof (e as RadarEntry).symbol === 'string')
    .map((e) => ({
      symbol: String(e.symbol).toUpperCase().trim(),
      note: typeof e.note === 'string' ? e.note : '',
      addedAt: Number(e.addedAt) || 0,
    }))
    .filter((e) => e.symbol.length > 0)
}

const bare = (list: RadarEntry[]): RadarItem[] =>
  list.map((e) => ({ ...e, price: null, change: null, changePct: null }))

export async function GET() {
  try {
    const list = await readList()
    let items: RadarItem[] = bare(list)
    if (list.length) {
      try {
        const quotes = await getQuotes(list.map((e) => e.symbol))
        const bySym = new Map(quotes.map((q) => [q.symbol, q]))
        items = list.map((e): RadarItem => {
          const q = bySym.get(e.symbol)
          const price = q?.price ?? null
          const prev = q?.prevClose ?? null
          const change = price != null && prev != null ? price - prev : null
          const changePct = change != null && prev ? (change / prev) * 100 : null
          return { ...e, price, change, changePct }
        })
      } catch {
        // quote failure leaves price fields null — list still renders
      }
    }
    return NextResponse.json({ items })
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: { symbol?: unknown; note?: unknown } = {}
    try { body = await req.json() } catch {}
    const symbol = cleanSymbol(String(body.symbol ?? ''))
    if (!symbol) return NextResponse.json({ error: 'invalid symbol' }, { status: 400 })
    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) : ''

    const list = await readList()
    const next = [...list.filter((e) => e.symbol !== symbol), { symbol, note, addedAt: Date.now() }]
    await setKV('radar', next)
    return NextResponse.json({ items: bare(next) })
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    let body: { symbol?: unknown } = {}
    try { body = await req.json() } catch {}
    const symbol = String(body.symbol ?? '').toUpperCase().trim()
    if (!symbol) return NextResponse.json({ error: 'invalid symbol' }, { status: 400 })

    const list = await readList()
    const next = list.filter((e) => e.symbol !== symbol)
    await setKV('radar', next)
    return NextResponse.json({ items: bare(next) })
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
