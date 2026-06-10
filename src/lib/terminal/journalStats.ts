// DB Terminal journal stats + helpers (ported 1:1 from lib/journal.mjs).
// Pure functions only -- no storage or network -- so they can be unit tested.

export const round2 = (n: number) => Math.round(n * 100) / 100
export const round1 = (n: number) => Math.round(n * 10) / 10

export function num(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v.trim()) : v
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

export interface JournalStats {
  totalTrades: number
  wins: number
  losses: number
  winRate: number
  totalPnl: number
  avgWin: number | null
  avgLoss: number | null
  profitFactor: number | null
  avgR: number | null
  bestTrade: number | null
  worstTrade: number | null
}

export function computeStats(trades: Array<{ pnl?: number | null; rMultiple?: number | null }>): JournalStats {
  const stats: JournalStats = {
    totalTrades: trades.length,
    wins: 0,
    losses: 0,
    winRate: 0,
    totalPnl: 0,
    avgWin: null,
    avgLoss: null,
    profitFactor: null,
    avgR: null,
    bestTrade: null,
    worstTrade: null,
  }
  if (!trades.length) return stats

  let grossWins = 0
  let grossLosses = 0
  let totalPnl = 0
  const rs: number[] = []
  for (const t of trades) {
    const pnl = typeof t.pnl === 'number' ? t.pnl : 0
    totalPnl += pnl
    if (pnl > 0) { stats.wins++; grossWins += pnl }
    else if (pnl < 0) { stats.losses++; grossLosses += pnl }
    if (typeof t.rMultiple === 'number' && Number.isFinite(t.rMultiple)) rs.push(t.rMultiple)
    if (stats.bestTrade == null || pnl > stats.bestTrade) stats.bestTrade = pnl
    if (stats.worstTrade == null || pnl < stats.worstTrade) stats.worstTrade = pnl
  }

  stats.totalPnl = round2(totalPnl)
  stats.winRate = round1((stats.wins / trades.length) * 100)
  stats.avgWin = stats.wins ? round2(grossWins / stats.wins) : null
  stats.avgLoss = stats.losses ? round2(grossLosses / stats.losses) : null
  stats.profitFactor = stats.losses ? round2(grossWins / Math.abs(grossLosses)) : null
  stats.avgR = rs.length ? round2(rs.reduce((a, b) => a + b, 0) / rs.length) : null
  stats.bestTrade = round2(stats.bestTrade as number)
  stats.worstTrade = round2(stats.worstTrade as number)
  return stats
}
