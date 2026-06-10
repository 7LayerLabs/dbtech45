// GET /api/terminal/news-archive?q=&source=&limit=
// -> { total, matched, items: [{ title, link, date, source, savedAt }] } sorted desc

import { NextRequest, NextResponse } from 'next/server'
import { readNews, countNews } from '@/lib/terminal/store'

export const dynamic = 'force-dynamic'

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e))

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const q = (url.searchParams.get('q') || '').toLowerCase()
    const source = (url.searchParams.get('source') || '').toLowerCase()
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '', 10) || 100, 500)

    let items = await readNews()
    const total = await countNews()
    if (q) items = items.filter(i => (i.title || '').toLowerCase().includes(q))
    if (source) items = items.filter(i => (i.source || '').toLowerCase() === source)
    items.sort((a, b) => (b.date || b.savedAt || 0) - (a.date || a.savedAt || 0))
    return NextResponse.json({ total, matched: items.length, items: items.slice(0, limit) })
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
