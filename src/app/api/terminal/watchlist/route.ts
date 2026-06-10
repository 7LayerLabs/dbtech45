// GET/POST /api/terminal/watchlist
// GET  -> ["SPY", "QQQ", ...]
// POST -> { symbols: [...] } -> saved (uppercased, trimmed) list

import { NextRequest, NextResponse } from 'next/server'
import { getKV, setKV } from '@/lib/terminal/store'

export const dynamic = 'force-dynamic'

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e))

const DEFAULT_WATCHLIST = ['SPY', 'QQQ', 'NVDA', 'TSLA', 'AAPL', 'AMD', 'META', 'AMZN']

export async function GET() {
  try {
    const list = await getKV<string[]>('watchlist', DEFAULT_WATCHLIST)
    return NextResponse.json(Array.isArray(list) ? list : DEFAULT_WATCHLIST)
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: { symbols?: unknown[] } = {}
    try { body = await req.json() } catch {}
    const list = (Array.isArray(body.symbols) ? body.symbols : [])
      .map(s => String(s).toUpperCase().trim())
      .filter(Boolean)
    await setKV('watchlist', list)
    return NextResponse.json(list)
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
