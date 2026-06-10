// DB Terminal trade-ideas engine (ported from lib/ideas-engine.mjs).
//
// Consumes the terminal's own data routes via internal fetch (origin comes
// from the incoming request): /api/terminal/watchlist, /api/terminal/orb/:sym,
// /api/terminal/pullbacks, /api/terminal/atr/:sym. A failed symbol is skipped.
//
// The idea-building math (orbIdeaFrom / pullbackIdeaFrom) is pure and exported
// for unit testing. Results are cached in-memory for 60 seconds.

export interface IdeaSettings {
  accountSize: number
  riskPct: number
}

export interface TradeIdea {
  symbol: string
  side: 'LONG' | 'SHORT'
  playType: 'ORB_BREAKOUT' | 'ORB_BREAKDOWN' | 'PULLBACK'
  entry: number
  stop: number
  targets: number[]
  rr: number
  atr14: number
  shares: number
  riskDollars: number
  confidence: 'HIGH' | 'MEDIUM'
  reasons: string[]
}

export interface IdeasResponse {
  settings: IdeaSettings
  generated: number
  ideas: TradeIdea[]
}

export interface OrbData {
  symbol?: string
  status?: string
  last?: number | null
  orbHigh?: number | null
  orbLow?: number | null
  levels?: { pdc?: number | null } | null
  error?: unknown
}

export interface PullbackCandidate {
  symbol: string
  sector?: string
  sectorEtf?: string
  price?: number | null
  sma20?: number | null
  sma50?: number | null
  sma200?: number | null
  rsVsSector?: number | null
  offHighPct?: number | null
  nearSma20?: boolean
  setup?: string
}

const round2 = (n: number) => Math.round(n * 100) / 100
const round1 = (n: number) => Math.round(n * 10) / 10

// ---------- pure idea builders ----------

// ORB day-trade play: only fires while the live status is BREAKOUT or
// BREAKDOWN (i.e. market open, opening range complete, price outside it).
export function orbIdeaFrom(orb: OrbData | null, atr: number | null, riskDollars: number): TradeIdea | null {
  if (!orb || orb.error) return null
  if (orb.status !== 'BREAKOUT' && orb.status !== 'BREAKDOWN') return null
  if (orb.last == null || orb.orbHigh == null || orb.orbLow == null) return null
  if (atr == null || atr <= 0) return null

  const isLong = orb.status === 'BREAKOUT'
  const entry = orb.last
  const stop = isLong ? orb.orbLow : orb.orbHigh // other side of the range
  const dist = Math.abs(entry - stop)
  if (!(dist > 0)) return null
  if (dist > 1.5 * atr) return null // range too wide = bad R:R, skip

  const targets = isLong ? [entry + atr, entry + 2 * atr] : [entry - atr, entry - 2 * atr]
  const pdc = orb.levels && orb.levels.pdc != null ? orb.levels.pdc : null
  const withTrend = pdc != null && (isLong ? entry > pdc : entry < pdc)

  const reasons: string[] = [
    isLong
      ? `Price ${round2(entry)} broke above ORB high ${round2(orb.orbHigh)} (9:30-9:45 opening range)`
      : `Price ${round2(entry)} broke below ORB low ${round2(orb.orbLow)} (9:30-9:45 opening range)`,
  ]
  if (pdc != null) {
    if (withTrend) {
      reasons.push(isLong
        ? `Also above prior-day close ${round2(pdc)} — buyers in control`
        : `Also below prior-day close ${round2(pdc)} — sellers in control`)
    } else {
      reasons.push(isLong
        ? `Caution: still below prior-day close ${round2(pdc)} — overhead supply`
        : `Caution: still above prior-day close ${round2(pdc)} — possible squeeze`)
    }
  }
  reasons.push(`Stop at ORB ${isLong ? 'low' : 'high'} ${round2(stop)} risks ${round2(dist)}/share (${round1(dist / atr)}x ATR ${round2(atr)})`)
  reasons.push(`Targets at +1x / +2x ATR from entry`)

  return {
    symbol: String(orb.symbol || '').toUpperCase(),
    side: isLong ? 'LONG' : 'SHORT',
    playType: isLong ? 'ORB_BREAKOUT' : 'ORB_BREAKDOWN',
    entry: round2(entry),
    stop: round2(stop),
    targets: targets.map(round2),
    rr: round1(Math.abs(targets[0] - entry) / dist),
    atr14: round2(atr),
    shares: Math.floor(riskDollars / dist),
    riskDollars: round2(riskDollars),
    confidence: withTrend ? 'HIGH' : 'MEDIUM',
    reasons: reasons.slice(0, 4),
  }
}

// Swing play: strong stock in a lagging sector, pulled back, always LONG.
// The 20-day high is reconstructed from the scanner's offHighPct
// (offHighPct = (price - high20) / high20 * 100  =>  high20 = price / (1 + off/100)).
export function pullbackIdeaFrom(c: PullbackCandidate | null, atr: number | null, riskDollars: number): TradeIdea | null {
  try {
    if (!c || !c.price) return null
    if (atr == null || atr <= 0) return null

    const off = typeof c.offHighPct === 'number' && Number.isFinite(c.offHighPct) ? c.offHighPct : null
    if (off == null || off <= -100) return null
    const high20 = c.price / (1 + off / 100)
    if (!Number.isFinite(high20) || high20 <= 0) return null

    const entry = c.price
    const stop = Math.min(c.sma50 != null ? c.sma50 : Infinity, entry - 1.5 * atr)
    const dist = entry - stop
    if (!(dist > 0) || !Number.isFinite(dist)) return null

    const targets = [high20, high20 + atr]
    if (targets[0] <= entry) return null // no room to the 20-day high

    const reasons: string[] = [
      `${c.symbol} beating its ${c.sector} sector (${c.sectorEtf}) by ${round2(c.rsVsSector ?? 0)}% over 3 months`,
      `Pulled back ${Math.abs(round2(off))}% off 20-day high ${round2(high20)} — strong stock in lagging sector`,
      `Holding above 50-day ${round2(c.sma50 ?? 0)} and 200-day ${round2(c.sma200 ?? 0)} — uptrend intact`,
    ]
    if (c.nearSma20 && c.sma20 != null) reasons.push(`Sitting near 20-day SMA ${round2(c.sma20)} — common bounce spot`)

    return {
      symbol: String(c.symbol).toUpperCase(),
      side: 'LONG',
      playType: 'PULLBACK',
      entry: round2(entry),
      stop: round2(stop),
      targets: targets.map(round2),
      rr: round1((targets[0] - entry) / dist),
      atr14: round2(atr),
      shares: Math.floor(riskDollars / dist),
      riskDollars: round2(riskDollars),
      confidence: (c.rsVsSector != null && c.rsVsSector > 8) ? 'HIGH' : 'MEDIUM',
      reasons: reasons.slice(0, 4),
    }
  } catch {
    return null
  }
}

// ---------- self-call helpers ----------

async function selfGet<T>(origin: string, pathname: string, fallback: T): Promise<T> {
  try {
    const r = await fetch(`${origin}${pathname}`, { cache: 'no-store' })
    if (!r.ok) return fallback
    return (await r.json()) as T
  } catch {
    return fallback
  }
}

async function atrFor(origin: string, symbol: string): Promise<number | null> {
  const a = await selfGet<{ atr14?: number | null } | null>(
    origin, `/api/terminal/atr/${encodeURIComponent(symbol)}`, null
  )
  return a && typeof a.atr14 === 'number' && Number.isFinite(a.atr14) && a.atr14 > 0 ? a.atr14 : null
}

async function buildOrbIdea(origin: string, sym: string, riskDollars: number): Promise<TradeIdea | null> {
  const orb = await selfGet<OrbData | null>(origin, `/api/terminal/orb/${encodeURIComponent(sym)}`, null)
  if (!orb || orb.error) return null
  if (orb.status !== 'BREAKOUT' && orb.status !== 'BREAKDOWN') return null
  const atr = await atrFor(origin, sym)
  const idea = orbIdeaFrom({ ...orb, symbol: orb.symbol || sym }, atr, riskDollars)
  return idea
}

async function buildPullbackIdea(origin: string, c: PullbackCandidate, riskDollars: number): Promise<TradeIdea | null> {
  try {
    const atr = await atrFor(origin, c.symbol)
    return pullbackIdeaFrom(c, atr, riskDollars)
  } catch {
    return null
  }
}

// ---------- the brain ----------

export async function buildIdeas(origin: string, settings: IdeaSettings): Promise<IdeasResponse> {
  const riskDollars = settings.accountSize * settings.riskPct / 100
  const ideas: TradeIdea[] = []

  // ORB plays from the watchlist (day trades)
  const watchlist = await selfGet<string[]>(origin, '/api/terminal/watchlist', [])
  const syms = (Array.isArray(watchlist) ? watchlist : []).slice(0, 16)
  const orbIdeas = await Promise.all(syms.map(s => buildOrbIdea(origin, s, riskDollars).catch(() => null)))
  ideas.push(...orbIdeas.filter((i): i is TradeIdea => Boolean(i)))

  // Pullback plays from the scanner (swings)
  const pb = await selfGet<{ candidates?: PullbackCandidate[] } | null>(origin, '/api/terminal/pullbacks', null)
  const candidates = ((pb && pb.candidates) || []).filter(c => c.setup === 'PULLBACK')
  const pbIdeas = await Promise.all(candidates.slice(0, 12).map(c => buildPullbackIdea(origin, c, riskDollars)))
  ideas.push(...pbIdeas.filter((i): i is TradeIdea => Boolean(i)))

  // HIGH confidence first, then best reward:risk
  ideas.sort((a, b) =>
    (a.confidence === 'HIGH' ? 0 : 1) - (b.confidence === 'HIGH' ? 0 : 1) ||
    b.rr - a.rr)

  return {
    settings: { accountSize: settings.accountSize, riskPct: settings.riskPct },
    generated: Date.now(),
    ideas: ideas.slice(0, 8), // closed market / no signals => [] (never fabricate)
  }
}

// 60-second in-memory cache (global so it survives dev hot reloads)
const gIdeas = globalThis as unknown as { __terminalIdeasCache?: { t: number; v: IdeasResponse } }

export async function buildIdeasCached(origin: string, settings: IdeaSettings): Promise<IdeasResponse> {
  const hit = gIdeas.__terminalIdeasCache
  if (hit && Date.now() - hit.t < 60000) return hit.v
  const v = await buildIdeas(origin, settings)
  gIdeas.__terminalIdeasCache = { t: Date.now(), v }
  return v
}
