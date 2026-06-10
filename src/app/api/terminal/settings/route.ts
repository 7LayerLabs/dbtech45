// GET/POST /api/terminal/settings
// Defaults: { accountSize: 25000, riskPct: 1, soundAlerts: true }
// POST accepts partial updates; invalid fields keep their current values.

import { NextRequest, NextResponse } from 'next/server'
import { getKV, setKV } from '@/lib/terminal/store'
import { DEFAULT_SETTINGS, sanitizeSettings, type TerminalSettings } from '@/lib/terminal/settings'

export const dynamic = 'force-dynamic'

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e))

async function currentSettings(): Promise<TerminalSettings> {
  return sanitizeSettings(await getKV<TerminalSettings>('settings', DEFAULT_SETTINGS))
}

export async function GET() {
  try {
    return NextResponse.json(await currentSettings())
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: unknown = null
    try { body = await req.json() } catch {}
    // partial updates allowed: invalid/missing fields keep current values
    const next = sanitizeSettings(body, await currentSettings())
    await setKV('settings', next)
    return NextResponse.json(next)
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
