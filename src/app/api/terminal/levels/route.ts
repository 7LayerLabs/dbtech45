// GET/POST /api/terminal/levels
// GET  -> { SPY: [{ price, note }], ... }
// POST -> { symbol, levels } (empty/missing levels deletes the symbol's key)

import { NextRequest, NextResponse } from 'next/server'
import { getKV, setKV } from '@/lib/terminal/store'

export const dynamic = 'force-dynamic'

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e))

interface Level { price: number; note?: string }
type LevelsMap = Record<string, Level[]>

export async function GET() {
  try {
    return NextResponse.json(await getKV<LevelsMap>('levels', {}))
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: { symbol?: unknown; levels?: unknown } = {}
    try { body = await req.json() } catch {}
    const symbol = typeof body.symbol === 'string' ? body.symbol.toUpperCase().trim() : ''
    if (!symbol) return NextResponse.json({ error: 'symbol is required' }, { status: 400 })

    const levels = body.levels
    const all = await getKV<LevelsMap>('levels', {})
    if (Array.isArray(levels) && levels.length) all[symbol] = levels as Level[]
    else delete all[symbol]
    await setKV('levels', all)
    return NextResponse.json(all)
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
