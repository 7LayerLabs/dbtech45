// GET /api/terminal/ideas
// -> { settings: { accountSize, riskPct }, generated, ideas: [...] }
// Trade idea cards: ORB breakout/breakdown plays from the watchlist plus
// pullback swings from the scanner. Self-calls the terminal's own data routes
// (orb/atr/pullbacks/watchlist) via the request origin. 60s in-memory cache.

import { NextRequest, NextResponse } from 'next/server'
import { getKV } from '@/lib/terminal/store'
import { DEFAULT_SETTINGS, sanitizeSettings, type TerminalSettings } from '@/lib/terminal/settings'
import { buildIdeasCached } from '@/lib/terminal/ideasEngine'

export const dynamic = 'force-dynamic'

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e))

export async function GET(req: NextRequest) {
  try {
    const origin = new URL(req.url).origin
    const settings = sanitizeSettings(await getKV<TerminalSettings>('settings', DEFAULT_SETTINGS))
    const data = await buildIdeasCached(origin, {
      accountSize: settings.accountSize,
      riskPct: settings.riskPct,
    })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
