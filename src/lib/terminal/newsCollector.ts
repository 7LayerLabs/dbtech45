// DB Terminal 24/7 news collection sweep.
// Takes no request: fetches the RSS sources directly (same sources as the
// local reference server) and archives fresh headlines into the store.
// Used by both /api/terminal/news-collect (as a fallback) and
// src/instrumentation.ts (the every-5-minutes server loop, where the deploy
// origin is unknown at boot so self-fetching is not an option).

import { getKV, addNews, countNews, type RawNewsItem } from './store'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

// Matches the local server's fetchAllNews fallback (NOT the watchlist route's
// 8-symbol default) so behavior is identical when no watchlist is saved.
const NEWS_WATCHLIST_FALLBACK = ['SPY', 'QQQ', 'NVDA', 'TSLA']

// ---------- minimal RSS parsing (no new dependencies) ----------

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

function tagContent(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'))
  if (!m) return null
  let v = m[1].trim()
  const cdata = v.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/)
  if (cdata) v = cdata[1].trim()
  return decodeEntities(v)
}

export function parseRssItems(xmlText: string, source: string): RawNewsItem[] {
  const blocks = xmlText.match(/<item[\s>][\s\S]*?<\/item>/gi) || []
  const items: RawNewsItem[] = []
  for (const block of blocks) {
    const title = tagContent(block, 'title')
    if (!title) continue
    const link = tagContent(block, 'link') || ''
    const pubDate = tagContent(block, 'pubDate')
    const ts = pubDate ? new Date(pubDate).getTime() : NaN
    items.push({ title, link, date: Number.isFinite(ts) ? ts : null, source })
  }
  return items
}

async function fetchRss(url: string, source: string): Promise<RawNewsItem[]> {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA }, cache: 'no-store' })
    if (!r.ok) return []
    const text = await r.text()
    return parseRssItems(text, source)
  } catch {
    return []
  }
}

// ---------- the sweep ----------

export async function collectNews(): Promise<{ added: number; total: number }> {
  const watch = await getKV<string[]>('watchlist', NEWS_WATCHLIST_FALLBACK)
  const list = Array.isArray(watch) ? watch : NEWS_WATCHLIST_FALLBACK
  const feeds = [
    fetchRss('https://www.cnbc.com/id/100003114/device/rss/rss.html', 'CNBC'),
    fetchRss('https://feeds.content.dowjones.io/public/rss/mw_topstories', 'MarketWatch'),
    ...list.slice(0, 6).map(s =>
      fetchRss(`https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(s)}&region=US&lang=en-US`, s)
    ),
  ]
  const all = (await Promise.all(feeds)).flat()
  const added = await addNews(all)
  const total = await countNews()
  return { added, total }
}

// Archive an already-fetched batch (used by /api/terminal/news-collect when
// it pulls from the live news route instead of hitting RSS itself).
export async function archiveNewsItems(items: RawNewsItem[]): Promise<{ added: number; total: number }> {
  const added = await addNews(items)
  const total = await countNews()
  return { added, total }
}
