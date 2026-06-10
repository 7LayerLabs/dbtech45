// GET/POST /api/terminal/journal (ported from lib/journal.mjs)
// GET  -> { stats, trades } (trades newest first, stats recomputed each GET)
// POST -> validates body (400 on bad input), returns the created trade
// PnL math: LONG (exit - entry) * size, SHORT (entry - exit) * size.
// rMultiple only computed when a stop is provided.

import { NextRequest, NextResponse } from 'next/server'
import { listTrades, insertTrade, type JournalTrade } from '@/lib/terminal/store'
import { computeStats, num, round2 } from '@/lib/terminal/journalStats'

export const dynamic = 'force-dynamic'

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e))

const SIDES = new Set(['LONG', 'SHORT'])

// Public trade shape (stop is stored but never returned, matching the reference)
function publicTrade(t: JournalTrade) {
  return {
    id: t.id,
    date: t.date,
    symbol: t.symbol,
    side: t.side,
    setup: t.setup,
    entry: t.entry,
    exit: t.exit,
    size: t.size,
    pnl: t.pnl,
    rMultiple: t.rMultiple,
    notes: t.notes,
  }
}

export async function GET() {
  try {
    const trades = (await listTrades())
      .slice()
      .sort((a, b) => (b.date || 0) - (a.date || 0))
      .map(publicTrade)
    return NextResponse.json({ stats: computeStats(trades), trades })
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown> | null = null
    try { body = await req.json() } catch {}
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Missing JSON body' }, { status: 400 })
    }

    const symbol = typeof body.symbol === 'string' ? body.symbol.toUpperCase().trim() : ''
    if (!symbol) return NextResponse.json({ error: 'symbol is required' }, { status: 400 })

    const side = typeof body.side === 'string' ? body.side.toUpperCase().trim() : ''
    if (!SIDES.has(side)) return NextResponse.json({ error: 'side must be LONG or SHORT' }, { status: 400 })

    const setup = typeof body.setup === 'string' ? body.setup.trim() : ''
    if (!setup) return NextResponse.json({ error: 'setup is required' }, { status: 400 })

    const entry = num(body.entry)
    const exit = num(body.exit)
    const size = num(body.size)
    if (entry == null || entry <= 0) return NextResponse.json({ error: 'entry must be a positive number' }, { status: 400 })
    if (exit == null || exit <= 0) return NextResponse.json({ error: 'exit must be a positive number' }, { status: 400 })
    if (size == null || size <= 0) return NextResponse.json({ error: 'size must be a positive number' }, { status: 400 })

    const date = num(body.date) ?? Date.now()

    const pnl = round2(side === 'LONG' ? (exit - entry) * size : (entry - exit) * size)

    let rMultiple: number | null = null
    const stop = num(body.stop)
    if (stop != null) {
      const risk = Math.abs(entry - stop) * size
      if (risk > 0) rMultiple = round2(pnl / risk)
    }

    const trades = await listTrades()

    // id = 't_' + timestamp; bump by 1ms on collision (rapid consecutive posts)
    let ts = Date.now()
    while (trades.some(t => t.id === 't_' + ts)) ts++

    const trade: JournalTrade = {
      id: 't_' + ts,
      date,
      symbol,
      side,
      setup,
      entry,
      exit,
      size,
      stop,
      pnl,
      rMultiple,
      notes: typeof body.notes === 'string' ? body.notes.trim() : '',
    }

    await insertTrade(trade)
    return NextResponse.json(publicTrade(trade))
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
