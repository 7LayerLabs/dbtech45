// DB Terminal — API contracts for /api/terminal/*

export interface TapeItem {
  symbol: string;
  label: string;
  price: number;
  change: number;
  changePct: number;
  prevClose: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  marketState: string;
}

export interface ManualLevel {
  price: number;
  note?: string;
}

export interface OrbBar {
  t: number;
  c: number | null;
}

export interface OrbData {
  symbol: string;
  status: string; // PRE-MARKET | FORMING | INSIDE | BREAKOUT | BREAKDOWN | CLOSED | CLOSED ABOVE | CLOSED BELOW | CLOSED INSIDE
  last: number | null;
  orbHigh: number | null;
  orbLow: number | null;
  orbMid: number | null;
  orbRangePct: number | null;
  distFromHighPct: number | null;
  distFromLowPct: number | null;
  levels?: {
    pdh?: number | null;
    pdl?: number | null;
    pdc?: number | null;
    pmHigh?: number | null;
    pmLow?: number | null;
  };
  manualLevels?: ManualLevel[];
  bars?: OrbBar[];
  error?: string;
}

export interface SectorRow {
  etf: string;
  name: string;
  ret: { w1: number | null; m1: number | null; m3: number | null };
  rs: { w1: number | null; m1: number | null; m3: number | null };
  composite: number;
  rank: number;
  lagging?: boolean;
  leading?: boolean;
}

export interface SectorsData {
  spy: { w1: number; m1: number; m3: number };
  rows: SectorRow[];
}

export interface PullbackCandidate {
  symbol: string;
  sector: string;
  sectorEtf: string;
  price: number;
  sma20: number;
  sma50: number;
  sma200: number;
  ret3m: number;
  sectorRet3m: number;
  rsVsSector: number;
  offHighPct: number;
  nearSma20: boolean;
  setup: string; // PULLBACK | EXTENDED
}

export interface PullbacksData {
  laggingSectors: { etf: string; name: string; composite: number }[];
  candidates: PullbackCandidate[];
}

export interface OptionsActivity {
  type: string; // CALL | PUT
  strike: number;
  volume: number;
  oi: number;
  volOiRatio: number | null;
  iv: number | null;
  last: number | null;
  unusual?: boolean;
}

export interface OptionsData {
  symbol: string;
  spot: number;
  expiry: string;
  daysToExpiry: number | null;
  atmIV: number | null;
  pcRatio: number | null;
  expectedMove?: { abs: number | null; pct: number | null };
  topActivity?: OptionsActivity[];
  supportWalls?: { strike: number; putOI: number }[];
  resistanceWalls?: { strike: number; callOI: number }[];
  read: string; // BULLISH | BEARISH | NEUTRAL
  readReason?: string;
  error?: string;
}

export interface Pivots {
  symbol: string;
  pp: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
}

export interface AtrData {
  symbol: string;
  atr14: number | null;
  atrPct: number | null;
}

export interface TradeIdea {
  symbol: string;
  side: string; // LONG | SHORT
  playType: string;
  entry: number | null;
  stop: number | null;
  targets?: number[];
  rr: number | null;
  atr14: number | null;
  shares: number | null;
  riskDollars: number | null;
  confidence?: string;
  reasons?: string[];
}

export interface IdeasData {
  settings?: { accountSize?: number; riskPct?: number };
  generated?: number | string;
  ideas: TradeIdea[];
}

export interface TerminalSettings {
  accountSize: number;
  riskPct: number;
  soundAlerts: boolean;
}

export interface NewsItem {
  title: string;
  link: string;
  date?: string | number | null;
  source: string;
}

export interface NewsArchiveResult {
  total: number;
  matched: number;
  items: NewsItem[];
}

export interface JournalTrade {
  id: string;
  date?: number;
  symbol: string;
  side: string;
  setup?: string;
  entry: number | null;
  exit: number | null;
  size: number | null;
  pnl: number | null;
  rMultiple: number | null;
  notes?: string;
}

export interface JournalStats {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number | null;
  totalPnl: number | null;
  avgWin: number | null;
  avgLoss: number | null;
  profitFactor: number | null;
  avgR: number | null;
  bestTrade: number | null;
  worstTrade: number | null;
}

export interface JournalData {
  stats: JournalStats;
  trades: JournalTrade[];
}

export interface EarningsRow {
  symbol: string;
  date: number;
  avgEstimate: number | null;
  callTime?: string | number | null;
}
