// GET /api/terminal/ipos
// -> { upcoming: [{name, symbol, exchange, expectedDate, priceRange, sharesM, status}],
//      recent:   [{name, symbol, exchange, listedDate, price, status}] }
//
// Primary source: Nasdaq public IPO calendar (api.nasdaq.com/api/ipo/calendar?date=YYYY-MM).
// Requires browser headers or the endpoint hangs/403s. Verified live shape:
//   data.upcoming.upcomingTable.rows -> { companyName, proposedTickerSymbol, proposedExchange,
//                                         proposedSharePrice, sharesOffered, expectedPriceDate }
//   data.priced.rows                 -> { companyName, proposedTickerSymbol, proposedExchange,
//                                         proposedSharePrice, sharesOffered, pricedDate, dealStatus }
// Secondary (merge/dedupe by symbol): massive /vX/reference/ipos when MASSIVE_API_KEY is set.
// Everything degrades gracefully — on total failure we return empty lists + error with status 200.

import { NextResponse } from 'next/server'
import { cached } from '@/lib/terminal/marketData'

export const dynamic = 'force-dynamic'

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
const MASSIVE_BASE = process.env.MASSIVE_BASE_URL || 'https://api.massive.com'

interface UpcomingIpo {
  name: string | null
  symbol: string | null
  exchange: string | null
  expectedDate: string | null // YYYY-MM-DD
  priceRange: string | null
  sharesM: number | null // shares offered, in millions
  status: string | null
}

interface RecentIpo {
  name: string | null
  symbol: string | null
  exchange: string | null
  listedDate: string | null // YYYY-MM-DD
  price: number | null
  status: string | null
}

interface IposPayload {
  upcoming: UpcomingIpo[]
  recent: RecentIpo[]
}

// ---------- defensive field helpers (every upstream field may be missing) ----------

const str = (v: unknown): string | null => {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t ? t : null
}

// "6/18/2026" or "2026-06-18" -> "2026-06-18"
function toIsoDate(v: unknown): string | null {
  const s = str(v)
  if (!s) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`
  const t = Date.parse(s)
  return Number.isNaN(t) ? null : new Date(t).toISOString().slice(0, 10)
}

// "5,500,000" -> 5.5 (millions)
function toSharesM(v: unknown): number | null {
  const s = str(String(v ?? ''))
  if (!s) return null
  const n = Number(s.replace(/[$,]/g, ''))
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round((n / 1e6) * 100) / 100
}

// "26.00" -> 26; "14.00-16.00" -> midpoint not assumed, take first leg if single fails
function toPrice(v: unknown): number | null {
  const s = str(String(v ?? ''))
  if (!s) return null
  const n = Number(s.replace(/[$,]/g, ''))
  if (Number.isFinite(n) && n > 0) return n
  const first = Number(s.split('-')[0].replace(/[$,]/g, ''))
  return Number.isFinite(first) && first > 0 ? first : null
}

const dateMs = (iso: string | null): number => {
  if (!iso) return NaN
  const t = Date.parse(iso)
  return Number.isNaN(t) ? NaN : t
}

// ---------- Nasdaq calendar ----------

/* eslint-disable @typescript-eslint/no-explicit-any */

async function fetchNasdaqMonth(ym: string): Promise<any | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(`https://api.nasdaq.com/api/ipo/calendar?date=${ym}`, {
      headers: { 'User-Agent': BROWSER_UA, Accept: 'application/json' },
      signal: controller.signal,
      cache: 'no-store',
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function ymOffset(offset: number): string {
  const d = new Date()
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() + offset)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function mapNasdaqUpcoming(rows: any[]): UpcomingIpo[] {
  return rows
    .map((r): UpcomingIpo => ({
      name: str(r?.companyName),
      symbol: str(r?.proposedTickerSymbol)?.toUpperCase() ?? null,
      exchange: str(r?.proposedExchange),
      expectedDate: toIsoDate(r?.expectedPriceDate),
      priceRange: str(r?.proposedSharePrice),
      sharesM: toSharesM(r?.sharesOffered),
      status: str(r?.dealStatus) ?? 'Expected',
    }))
    .filter((r) => r.name != null || r.symbol != null)
}

function mapNasdaqPriced(rows: any[]): RecentIpo[] {
  return rows
    .map((r): RecentIpo => ({
      name: str(r?.companyName),
      symbol: str(r?.proposedTickerSymbol)?.toUpperCase() ?? null,
      exchange: str(r?.proposedExchange),
      listedDate: toIsoDate(r?.pricedDate),
      price: toPrice(r?.proposedSharePrice),
      status: str(r?.dealStatus) ?? 'Priced',
    }))
    .filter((r) => r.name != null || r.symbol != null)
}

// ---------- massive secondary (Polygon-compatible /vX/reference/ipos) ----------

async function fetchMassiveIpos(): Promise<{ upcoming: UpcomingIpo[]; recent: RecentIpo[] } | null> {
  const key = process.env.MASSIVE_API_KEY || ''
  if (!key) return null
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(`${MASSIVE_BASE}/vX/reference/ipos?limit=50`, {
      headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
      signal: controller.signal,
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data: any = await res.json()
    const results: any[] = Array.isArray(data?.results) ? data.results : []
    if (!results.length) return null

    const upcoming: UpcomingIpo[] = []
    const recent: RecentIpo[] = []
    for (const r of results) {
      const symbol = str(r?.ticker)?.toUpperCase() ?? null
      const name = str(r?.issuer_name)
      if (!symbol && !name) continue
      const status = str(r?.ipo_status)
      const listingDate = toIsoDate(r?.listing_date)
      const lo = typeof r?.lowest_offer_price === 'number' ? r.lowest_offer_price : null
      const hi = typeof r?.highest_offer_price === 'number' ? r.highest_offer_price : null
      if (status === 'pending' || status === 'postponed') {
        upcoming.push({
          name,
          symbol,
          exchange: str(r?.primary_exchange),
          expectedDate: listingDate,
          priceRange: lo != null && hi != null ? `${lo.toFixed(2)}-${hi.toFixed(2)}` : lo != null ? lo.toFixed(2) : null,
          sharesM: toSharesM(r?.max_shares_offered ?? r?.shares_outstanding),
          status: status === 'pending' ? 'Expected' : 'Postponed',
        })
      } else if (status === 'new' || status === 'history') {
        recent.push({
          name,
          symbol,
          exchange: str(r?.primary_exchange),
          listedDate: listingDate,
          price: typeof r?.final_issue_price === 'number' ? r.final_issue_price : toPrice(r?.final_issue_price),
          status: 'Priced',
        })
      }
    }
    return { upcoming, recent }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

// ---------- build (throws if no source produced anything, so failures are not cached) ----------

async function buildIpos(): Promise<IposPayload> {
  // prev month: priced only; current: both; next: upcoming only
  const [prev, curr, next] = await Promise.all([
    fetchNasdaqMonth(ymOffset(-1)),
    fetchNasdaqMonth(ymOffset(0)),
    fetchNasdaqMonth(ymOffset(1)),
  ])
  const nasdaqOk = prev != null || curr != null || next != null

  const rowsUp = (d: any): any[] => (Array.isArray(d?.data?.upcoming?.upcomingTable?.rows) ? d.data.upcoming.upcomingTable.rows : [])
  const rowsPriced = (d: any): any[] => (Array.isArray(d?.data?.priced?.rows) ? d.data.priced.rows : [])

  let upcoming = mapNasdaqUpcoming([...rowsUp(curr), ...rowsUp(next)])
  let recent = mapNasdaqPriced([...rowsPriced(prev), ...rowsPriced(curr)])

  const massive = await fetchMassiveIpos()
  if (massive) {
    const upSyms = new Set(upcoming.map((r) => r.symbol).filter(Boolean))
    const recSyms = new Set(recent.map((r) => r.symbol).filter(Boolean))
    // 60-day cutoff keeps massive's history rows from flooding "recently listed"
    const cutoff = Date.now() - 60 * 86400000
    upcoming = [...upcoming, ...massive.upcoming.filter((r) => r.symbol && !upSyms.has(r.symbol))]
    recent = [
      ...recent,
      ...massive.recent.filter((r) => {
        if (!r.symbol || recSyms.has(r.symbol)) return false
        const t = dateMs(r.listedDate)
        return !Number.isNaN(t) && t >= cutoff
      }),
    ]
  }

  if (!nasdaqOk && !massive) throw new Error('sources unavailable')

  // dedupe by symbol (keep first = Nasdaq), sort: upcoming soonest first, recent newest first
  const dedupe = <T extends { symbol: string | null; name: string | null }>(list: T[]): T[] => {
    const seen = new Set<string>()
    return list.filter((r) => {
      const k = r.symbol || r.name || ''
      if (!k || seen.has(k)) return false
      seen.add(k)
      return true
    })
  }
  upcoming = dedupe(upcoming).sort((a, b) => {
    const ta = dateMs(a.expectedDate), tb = dateMs(b.expectedDate)
    if (Number.isNaN(ta) && Number.isNaN(tb)) return 0
    if (Number.isNaN(ta)) return 1
    if (Number.isNaN(tb)) return -1
    return ta - tb
  })
  recent = dedupe(recent).sort((a, b) => (dateMs(b.listedDate) || 0) - (dateMs(a.listedDate) || 0))

  return { upcoming: upcoming.slice(0, 40), recent: recent.slice(0, 40) }
}

/* eslint-enable @typescript-eslint/no-explicit-any */

export async function GET() {
  try {
    const payload = await cached<IposPayload>('ipos', 30 * 60000, buildIpos)
    return NextResponse.json(payload)
  } catch {
    // status 200 so the panel degrades gracefully (dim OFFLINE, keeps retrying)
    return NextResponse.json({ upcoming: [], recent: [], error: 'sources unavailable' })
  }
}
