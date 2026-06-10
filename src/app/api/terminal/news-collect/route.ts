// GET /api/terminal/news-collect -> { added, total }
// Pulls fresh headlines from the live news route (built in parallel) and
// archives them; falls back to fetching the RSS sources directly if the
// live route is unavailable.

import { NextRequest, NextResponse } from 'next/server'
import { collectNews, archiveNewsItems } from '@/lib/terminal/newsCollector'
import type { RawNewsItem } from '@/lib/terminal/store'

export const dynamic = 'force-dynamic'

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e))

export async function GET(req: NextRequest) {
  try {
    const origin = new URL(req.url).origin
    let items: RawNewsItem[] | null = null
    try {
      const r = await fetch(`${origin}/api/terminal/news-live`, { cache: 'no-store' })
      if (r.ok) {
        const j = await r.json()
        if (Array.isArray(j)) items = j as RawNewsItem[]
      }
    } catch {
      // live route unavailable -> direct RSS sweep below
    }
    const result = items ? await archiveNewsItems(items) : await collectNews()
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
