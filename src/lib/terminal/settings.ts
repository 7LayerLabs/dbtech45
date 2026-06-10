// DB Terminal settings: pure sanitize logic (ported from lib/ideas-engine.mjs)

export interface TerminalSettings {
  accountSize: number
  riskPct: number
  soundAlerts: boolean
}

export const DEFAULT_SETTINGS: TerminalSettings = { accountSize: 25000, riskPct: 1, soundAlerts: true }

export const round2 = (n: number) => Math.round(n * 100) / 100

// Invalid / missing fields fall back to `base` (current settings on POST,
// factory defaults on first load) so garbage input never clobbers good values.
export function sanitizeSettings(raw: unknown, base: TerminalSettings = DEFAULT_SETTINGS): TerminalSettings {
  const s = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const acct = Number(s.accountSize)
  const risk = Number(s.riskPct)
  return {
    accountSize: Number.isFinite(acct) && acct > 0 ? round2(acct) : base.accountSize,
    riskPct: Number.isFinite(risk) && risk > 0 && risk <= 100 ? risk : base.riskPct,
    soundAlerts: typeof s.soundAlerts === 'boolean' ? s.soundAlerts : base.soundAlerts,
  }
}
