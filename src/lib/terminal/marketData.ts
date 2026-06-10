// DB Terminal — shared market data layer.
//
// Dual source architecture:
//   Primary:  massive.com (Polygon.io-compatible) — US stocks/ETFs only,
//             used when MASSIVE_API_KEY is set. Auth: Bearer token.
//   Fallback: Yahoo Finance v8 chart endpoint via direct fetch (no library).
//             Index/futures/crypto tape symbols (^VIX, GC=F, CL=F, BTC-USD)
//             ALWAYS use Yahoo. Any massive error/429/empty silently falls
//             back to Yahoo.
//
// All upstream calls go through throttled() (max 4 concurrent, spaced) and
// results are memoized in a module-level cache (long-running server host, so
// module state persists between requests).

import { SECTORS } from './sectors-data';

// ---------- types ----------

export interface Bar {
  date: number; // epoch ms
  open: number | null;
  high: number | null;
  low: number | null;
  close: number;
  volume: number | null;
}

export interface MinuteData {
  bars: Bar[];
  regStartMs: number | null;
  regEndMs: number | null;
  preStartMs: number | null;
  preEndMs: number | null;
  lastPrice: number | null;
}

export type MarketState = 'PRE' | 'REGULAR' | 'POST' | 'CLOSED';

export interface Quote {
  symbol: string;
  price: number | null;
  prevClose: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  marketState: MarketState;
}

export interface NewsItem {
  title: string;
  link: string | null;
  date: number | null;
  source: string;
}

export interface ChainContract {
  strike: number | null;
  volume: number | null;
  openInterest: number | null;
  impliedVolatility: number | null; // decimal (0.25 = 25%)
  lastPrice: number | null;
  bid: number | null;
  ask: number | null;
}

export interface ChainData {
  spot: number | null;
  expiryMs: number | null;
  calls: ChainContract[];
  puts: ChainContract[];
}

// ---------- constants ----------

export const TAPE_SYMBOLS = ['SPY', 'QQQ', 'IWM', 'DIA', '^VIX', 'BTC-USD', 'GC=F', 'CL=F'];
export const TAPE_LABELS: Record<string, string> = {
  SPY: 'S&P 500', QQQ: 'NASDAQ', IWM: 'RUSSELL', DIA: 'DOW',
  '^VIX': 'VIX', 'BTC-USD': 'BITCOIN', 'GC=F': 'GOLD', 'CL=F': 'OIL',
};
export const DEFAULT_WATCHLIST = ['SPY', 'QQQ', 'NVDA', 'TSLA', 'AAPL', 'AMD', 'META', 'AMZN'];

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const MASSIVE_BASE = process.env.MASSIVE_BASE_URL || 'https://api.massive.com';
const massiveKey = () => process.env.MASSIVE_API_KEY || '';

// Symbols that must always route to Yahoo (massive only covers US stocks/ETFs)
const YAHOO_ONLY = new Set(['^VIX', 'BTC-USD', 'GC=F', 'CL=F']);

// ---------- small math helpers ----------

export function pct(a: number, b: number): number { return b ? ((a - b) / b) * 100 : 0; }
export function round2(n: number): number { return Math.round(n * 100) / 100; }
export function round1(n: number): number { return Math.round(n * 10) / 10; }
export const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;

export function sma(closes: number[], n: number): number | null {
  if (closes.length < n) return null;
  const slice = closes.slice(-n);
  return slice.reduce((a, b) => a + b, 0) / n;
}

// Wilder's ATR: seed = simple average of first `period` true ranges, then
// ATR = (prevATR * (period-1) + TR) / period.
export function computeATR(bars: Bar[] | null | undefined, period = 14): number | null {
  if (!Array.isArray(bars) || bars.length < period + 1) return null;
  const trs: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    const h = bars[i].high, l = bars[i].low, pc = bars[i - 1].close;
    if (h == null || l == null || pc == null) continue;
    trs.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
  }
  if (trs.length < period) return null;
  let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
  }
  return atr;
}

// Classic floor-trader pivots from prior session H/L/C.
export function computePivots(h: number, l: number, c: number) {
  const pp = (h + l + c) / 3;
  return {
    pp,
    r1: 2 * pp - l,
    r2: pp + (h - l),
    r3: h + 2 * (pp - l),
    s1: 2 * pp - h,
    s2: pp - (h - l),
    s3: l - 2 * (h - pp),
  };
}

// ---------- ET time helpers ----------

interface EtParts { year: number; month: number; day: number; hour: number; minute: number; second: number }

const ET_FMT = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hour12: false,
});

export function etParts(ts: number): EtParts {
  const out: Record<string, number> = {};
  for (const p of ET_FMT.formatToParts(new Date(ts))) {
    if (p.type !== 'literal') out[p.type] = Number(p.value);
  }
  if (out.hour === 24) out.hour = 0;
  return out as unknown as EtParts;
}

// epoch ms for a wall-clock America/New_York time (DST-safe two-pass)
export function etEpoch(year: number, month: number, day: number, hour: number, minute: number): number {
  const want = Date.UTC(year, month - 1, day, hour, minute);
  let guess = want;
  for (let i = 0; i < 2; i++) {
    const p = etParts(guess);
    const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    guess += want - asUtc;
  }
  return guess;
}

export function etDateString(ts: number): string {
  const p = etParts(ts);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

// ---------- cache ----------

interface CacheHit { t: number; v: unknown }
const cache = new Map<string, CacheHit>();

export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < ttlMs) return hit.v as T;
  const v = await fn();
  cache.set(key, { t: Date.now(), v });
  if (cache.size > 1500) {
    const now = Date.now();
    for (const [k, h] of cache) {
      if (now - h.t > 30 * 60000) cache.delete(k);
    }
  }
  return v;
}

// ---------- throttle ----------
// Max 4 upstream calls in flight, 150ms spacing, one retry with backoff on 429.

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
let inFlight = 0;
const waiters: Array<() => void> = [];

export async function throttled<T>(fn: () => Promise<T>): Promise<T> {
  if (inFlight >= 4) await new Promise<void>((r) => waiters.push(r));
  inFlight++;
  try {
    try {
      return await fn();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/Too Many Requests|429/i.test(msg)) {
        await sleep(5000);
        return await fn();
      }
      throw e;
    }
  } finally {
    inFlight--;
    await sleep(150);
    const next = waiters.shift();
    if (next) next();
  }
}

// ---------- low-level fetchers ----------

async function fetchJson(url: string, headers: Record<string, string>, timeoutMs = 10000): Promise<unknown> {
  return throttled(async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { headers, signal: controller.signal, cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url.split('?')[0]}`);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  });
}

export async function yahooJson(url: string): Promise<unknown> {
  return fetchJson(url, { 'User-Agent': BROWSER_UA, Accept: 'application/json' });
}

async function massiveJson(path: string): Promise<unknown> {
  const key = massiveKey();
  if (!key) throw new Error('MASSIVE_API_KEY not set');
  return fetchJson(`${MASSIVE_BASE}${path}`, {
    Authorization: `Bearer ${key}`,
    Accept: 'application/json',
  });
}

// ---------- symbol routing ----------

function massiveEligible(symbol: string): boolean {
  if (!massiveKey()) return false;
  if (YAHOO_ONLY.has(symbol)) return false;
  // plain US stock/ETF tickers only (class shares like BRK-B allowed)
  return /^[A-Z]{1,5}(-[A-Z])?$/.test(symbol);
}

const toMassiveTicker = (symbol: string) => symbol.replace('-', '.');

// ---------- Yahoo chart parsing ----------

/* eslint-disable @typescript-eslint/no-explicit-any */

function parseYahooBars(result: any): Bar[] {
  const ts: number[] = result?.timestamp || [];
  const q = result?.indicators?.quote?.[0] || {};
  const bars: Bar[] = [];
  for (let i = 0; i < ts.length; i++) {
    const close = q.close?.[i];
    if (close == null) continue;
    bars.push({
      date: ts[i] * 1000,
      open: q.open?.[i] ?? null,
      high: q.high?.[i] ?? null,
      low: q.low?.[i] ?? null,
      close,
      volume: q.volume?.[i] ?? null,
    });
  }
  return bars;
}

const toMs = (v: unknown): number | null => {
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number' && Number.isFinite(v)) return v > 1e12 ? v : v * 1000;
  return null;
};

async function yahooChart(symbol: string, query: string): Promise<{ meta: any; bars: Bar[] }> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?${query}`;
  const data: any = await yahooJson(url);
  const result = data?.chart?.result?.[0];
  if (!result) {
    const err = data?.chart?.error?.description || 'empty chart result';
    throw new Error(`Yahoo chart ${symbol}: ${err}`);
  }
  return { meta: result.meta || {}, bars: parseYahooBars(result) };
}

// ---------- daily bars ----------

export async function getDailyBars(symbol: string, days = 130): Promise<Bar[]> {
  return cached(`daily:${symbol}:${days}`, 10 * 60000, async () => {
    if (massiveEligible(symbol)) {
      try {
        const from = etDateString(Date.now() - days * 86400000);
        const to = etDateString(Date.now());
        const data: any = await massiveJson(
          `/v2/aggs/ticker/${encodeURIComponent(toMassiveTicker(symbol))}/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=50000`
        );
        const results: any[] = data?.results || [];
        if (results.length) {
          return results
            .filter((r) => r.c != null)
            .map((r): Bar => ({
              date: r.t,
              open: r.o ?? null,
              high: r.h ?? null,
              low: r.l ?? null,
              close: r.c,
              volume: r.v ?? null,
            }));
        }
      } catch {
        // fall through to Yahoo
      }
    }
    const period1 = Math.floor((Date.now() - days * 86400000) / 1000);
    const period2 = Math.floor(Date.now() / 1000) + 86400;
    const { bars } = await yahooChart(symbol, `period1=${period1}&period2=${period2}&interval=1d`);
    return bars;
  });
}

// ---------- minute bars (with ET session boundaries) ----------

export async function getMinuteBars(symbol: string): Promise<MinuteData> {
  return cached(`minute:${symbol}`, 25000, async () => {
    if (massiveEligible(symbol)) {
      try {
        const from = etDateString(Date.now() - 6 * 86400000);
        const to = etDateString(Date.now());
        const data: any = await massiveJson(
          `/v2/aggs/ticker/${encodeURIComponent(toMassiveTicker(symbol))}/range/1/minute/${from}/${to}?adjusted=true&sort=asc&limit=50000`
        );
        const results: any[] = data?.results || [];
        if (results.length) {
          const bars = results
            .filter((r) => r.c != null)
            .map((r): Bar => ({
              date: r.t,
              open: r.o ?? null,
              high: r.h ?? null,
              low: r.l ?? null,
              close: r.c,
              volume: r.v ?? null,
            }));
          // session boundaries from the most recent bar's ET calendar day
          const lastBar = bars[bars.length - 1];
          const p = etParts(lastBar.date);
          const regStartMs = etEpoch(p.year, p.month, p.day, 9, 30);
          const regEndMs = etEpoch(p.year, p.month, p.day, 16, 0);
          const preStartMs = etEpoch(p.year, p.month, p.day, 4, 0);
          return {
            bars,
            regStartMs,
            regEndMs,
            preStartMs,
            preEndMs: regStartMs,
            lastPrice: lastBar.close,
          } satisfies MinuteData;
        }
      } catch {
        // fall through to Yahoo
      }
    }
    const { meta, bars } = await yahooChart(symbol, 'interval=1m&range=5d&includePrePost=true');
    const reg = meta?.currentTradingPeriod?.regular;
    const pre = meta?.currentTradingPeriod?.pre;
    const lastPrice =
      num(meta?.regularMarketPrice) ?? (bars.length ? bars[bars.length - 1].close : null);
    return {
      bars,
      regStartMs: toMs(reg?.start),
      regEndMs: toMs(reg?.end),
      preStartMs: toMs(pre?.start),
      preEndMs: toMs(pre?.end),
      lastPrice,
    } satisfies MinuteData;
  });
}

// ---------- quotes ----------

function etMarketState(now = Date.now()): MarketState {
  const p = etParts(now);
  // Sunday=0 Saturday=6 in ET
  const dow = new Date(etEpoch(p.year, p.month, p.day, 12, 0)).getUTCDay();
  if (dow === 0 || dow === 6) return 'CLOSED';
  const mins = p.hour * 60 + p.minute;
  if (mins >= 4 * 60 && mins < 9 * 60 + 30) return 'PRE';
  if (mins >= 9 * 60 + 30 && mins < 16 * 60) return 'REGULAR';
  if (mins >= 16 * 60 && mins < 20 * 60) return 'POST';
  return 'CLOSED';
}

async function yahooQuote(symbol: string): Promise<Quote | null> {
  try {
    const period1 = Math.floor((Date.now() - 7 * 86400000) / 1000);
    const period2 = Math.floor(Date.now() / 1000) + 86400;
    const { meta, bars } = await yahooChart(
      symbol,
      `period1=${period1}&period2=${period2}&interval=1d`
    );
    const price = num(meta?.regularMarketPrice) ?? (bars.length ? bars[bars.length - 1].close : null);
    const prevClose =
      num(meta?.chartPreviousClose) ??
      num(meta?.previousClose) ??
      (bars.length > 1 ? bars[bars.length - 2].close : null);
    const today = bars[bars.length - 1];
    const reg = meta?.currentTradingPeriod?.regular;
    const pre = meta?.currentTradingPeriod?.pre;
    const post = meta?.currentTradingPeriod?.post;
    const now = Date.now();
    let marketState: MarketState = 'CLOSED';
    const rs = toMs(reg?.start), re = toMs(reg?.end);
    const ps = toMs(pre?.start), pe = toMs(pre?.end);
    const os = toMs(post?.start), oe = toMs(post?.end);
    if (rs != null && re != null && now >= rs && now < re) marketState = 'REGULAR';
    else if (ps != null && pe != null && now >= ps && now < pe) marketState = 'PRE';
    else if (os != null && oe != null && now >= os && now < oe) marketState = 'POST';
    if (price == null) return null;
    return {
      symbol,
      price,
      prevClose,
      dayHigh: today?.high ?? null,
      dayLow: today?.low ?? null,
      volume: today?.volume ?? null,
      marketState,
    };
  } catch {
    return null;
  }
}

export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  const out = new Map<string, Quote>();
  const massiveSyms = symbols.filter((s) => massiveEligible(s));
  const yahooSyms = symbols.filter((s) => !massiveEligible(s));

  if (massiveSyms.length) {
    try {
      const tickers = massiveSyms.map((s) => encodeURIComponent(toMassiveTicker(s))).join(',');
      const data: any = await massiveJson(
        `/v2/snapshot/locale/us/markets/stocks/tickers?tickers=${tickers}`
      );
      const state = etMarketState();
      const byTicker = new Map<string, any>();
      for (const t of data?.tickers || []) byTicker.set(t.ticker, t);
      for (const sym of massiveSyms) {
        const t = byTicker.get(toMassiveTicker(sym));
        const price = num(t?.lastTrade?.p) ?? num(t?.min?.c) ?? num(t?.day?.c);
        if (!t || price == null) continue;
        out.set(sym, {
          symbol: sym,
          price,
          prevClose: num(t?.prevDay?.c),
          dayHigh: num(t?.day?.h),
          dayLow: num(t?.day?.l),
          volume: num(t?.day?.v),
          marketState: state,
        });
      }
    } catch {
      // missing symbols fall back to Yahoo below
    }
  }

  const remaining = symbols.filter((s) => !out.has(s));
  const yahooResults = await Promise.all(
    [...new Set([...yahooSyms, ...remaining])].map((s) => yahooQuote(s))
  );
  for (const q of yahooResults) if (q) out.set(q.symbol, q);

  return symbols.map((s) => out.get(s)).filter((q): q is Quote => q != null);
}

export async function getQuote(symbol: string): Promise<Quote | null> {
  const list = await getQuotes([symbol]);
  return list[0] ?? null;
}

// ---------- sector rotation (shared by /sectors and /pullbacks) ----------

export interface SectorRow {
  etf: string;
  name: string;
  ret: { w1: number | null; m1: number | null; m3: number | null };
  rs: { w1: number | null; m1: number | null; m3: number | null };
  composite: number;
  rank?: number;
  lagging?: boolean;
  leading?: boolean;
}

export interface SectorsResult {
  spy: { w1: number | null; m1: number | null; m3: number | null };
  rows: SectorRow[];
}

export async function computeSectors(): Promise<SectorsResult> {
  return cached('sectors', 5 * 60000, async () => {
    const symbols = ['SPY', ...Object.keys(SECTORS)];
    const all = await Promise.all(
      symbols.map(async (s) => ({ s, bars: await getDailyBars(s, 130).catch((): Bar[] => []) }))
    );
    const map = Object.fromEntries(all.map((x) => [x.s, x.bars]));
    const spy = map['SPY'];
    const ret = (bars: Bar[] | undefined, n: number): number | null => {
      if (!bars || bars.length < n + 1) return null;
      const last = bars[bars.length - 1].close;
      const past = bars[bars.length - 1 - n].close;
      return pct(last, past);
    };
    const spyR = { w1: ret(spy, 5), m1: ret(spy, 21), m3: ret(spy, 63) };
    const rows: SectorRow[] = Object.keys(SECTORS).map((etf) => {
      const bars = map[etf];
      const r = { w1: ret(bars, 5), m1: ret(bars, 21), m3: ret(bars, 63) };
      const rs = {
        w1: r.w1 != null && spyR.w1 != null ? r.w1 - spyR.w1 : null,
        m1: r.m1 != null && spyR.m1 != null ? r.m1 - spyR.m1 : null,
        m3: r.m3 != null && spyR.m3 != null ? r.m3 - spyR.m3 : null,
      };
      const composite = (rs.w1 ?? 0) * 0.2 + (rs.m1 ?? 0) * 0.4 + (rs.m3 ?? 0) * 0.4;
      return { etf, name: SECTORS[etf].name, ret: r, rs, composite: round2(composite) };
    });
    rows.sort((a, b) => b.composite - a.composite);
    rows.forEach((r, i) => {
      r.rank = i + 1;
      r.lagging = i >= rows.length - 3;
      r.leading = i < 3;
    });
    return { spy: spyR, rows };
  });
}

// ---------- options chain (massive primary, Yahoo v7 fallback) ----------

async function massiveChain(symbol: string): Promise<ChainData | null> {
  if (!massiveEligible(symbol)) return null;
  try {
    const today = etDateString(Date.now());
    const data: any = await massiveJson(
      `/v3/snapshot/options/${encodeURIComponent(toMassiveTicker(symbol))}?expiration_date.gte=${today}&limit=250&sort=expiration_date`
    );
    const results: any[] = data?.results || [];
    if (!results.length) return null;

    // nearest expiry
    const expiries = [...new Set(
      results.map((r) => r?.details?.expiration_date).filter((d): d is string => typeof d === 'string')
    )].sort();
    if (!expiries.length) return null;
    const target = expiries[0];
    const filtered = results.filter((r) => r?.details?.expiration_date === target);

    const mapContract = (r: any): ChainContract => ({
      strike: num(r?.details?.strike_price),
      volume: num(r?.day?.volume),
      openInterest: num(r?.open_interest),
      impliedVolatility: num(r?.implied_volatility),
      lastPrice: num(r?.day?.close),
      bid: num(r?.last_quote?.bid),
      ask: num(r?.last_quote?.ask),
    });

    const calls = filtered.filter((r) => r?.details?.contract_type === 'call').map(mapContract);
    const puts = filtered.filter((r) => r?.details?.contract_type === 'put').map(mapContract);
    if (!calls.length && !puts.length) return null;

    let spot = num(results.find((r) => num(r?.underlying_asset?.price) != null)?.underlying_asset?.price);
    if (spot == null) {
      const q = await getQuote(symbol);
      spot = q?.price ?? null;
    }
    return { spot, expiryMs: Date.parse(target) || null, calls, puts };
  } catch {
    return null;
  }
}

async function yahooChain(symbol: string): Promise<ChainData> {
  const data: any = await yahooJson(
    `https://query2.finance.yahoo.com/v7/finance/options/${encodeURIComponent(symbol)}`
  );
  const result = data?.optionChain?.result?.[0];
  if (!result) throw new Error(`Yahoo options ${symbol}: empty result`);
  const chain = Array.isArray(result?.options) ? result.options[0] : null;
  const mapContract = (c: any): ChainContract => ({
    strike: num(c?.strike),
    volume: num(c?.volume),
    openInterest: num(c?.openInterest),
    impliedVolatility: num(c?.impliedVolatility),
    lastPrice: num(c?.lastPrice),
    bid: num(c?.bid),
    ask: num(c?.ask),
  });
  return {
    spot: num(result?.quote?.regularMarketPrice),
    expiryMs: toMs(chain?.expirationDate),
    calls: (Array.isArray(chain?.calls) ? chain.calls : []).map(mapContract),
    puts: (Array.isArray(chain?.puts) ? chain.puts : []).map(mapContract),
  };
}

export async function getOptionChain(symbol: string): Promise<ChainData> {
  const fromMassive = await massiveChain(symbol);
  if (fromMassive) return fromMassive;
  return yahooChain(symbol);
}

// ---------- news (RSS via regex parser + massive reference news) ----------

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));
}

function tagText(block: string, tag: string): string | null {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  if (!m) return null;
  let text = m[1].trim();
  const cdata = text.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  if (cdata) text = cdata[1].trim();
  return decodeEntities(text);
}

function parseRssItems(xmlText: string, source: string): NewsItem[] {
  const items: NewsItem[] = [];
  const blocks = xmlText.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
  for (const block of blocks) {
    const title = tagText(block, 'title');
    if (!title) continue;
    const link = tagText(block, 'link');
    const pubDate = tagText(block, 'pubDate');
    const ts = pubDate ? Date.parse(pubDate) : NaN;
    items.push({ title, link, date: Number.isNaN(ts) ? null : ts, source });
  }
  return items;
}

async function fetchRss(url: string, source: string): Promise<NewsItem[]> {
  try {
    return await throttled(async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      try {
        const r = await fetch(url, {
          headers: { 'User-Agent': BROWSER_UA },
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!r.ok) return [];
        const text = await r.text();
        return parseRssItems(text, source);
      } finally {
        clearTimeout(timer);
      }
    });
  } catch {
    return [];
  }
}

async function fetchMassiveNews(): Promise<NewsItem[]> {
  if (!massiveKey()) return [];
  try {
    const data: any = await massiveJson('/v2/reference/news?limit=50');
    const results: any[] = data?.results || [];
    return results
      .map((r): NewsItem | null => {
        const title = typeof r?.title === 'string' ? r.title : null;
        if (!title) return null;
        const ts = r?.published_utc ? Date.parse(r.published_utc) : NaN;
        return {
          title,
          link: typeof r?.article_url === 'string' ? r.article_url : null,
          date: Number.isNaN(ts) ? null : ts,
          source: r?.publisher?.name || 'Massive',
        };
      })
      .filter((i): i is NewsItem => i != null);
  } catch {
    return [];
  }
}

export async function fetchAllNews(watchlist: string[]): Promise<NewsItem[]> {
  const feeds: Promise<NewsItem[]>[] = [
    fetchRss('https://www.cnbc.com/id/100003114/device/rss/rss.html', 'CNBC'),
    fetchRss('https://feeds.content.dowjones.io/public/rss/mw_topstories', 'MarketWatch'),
    ...watchlist.slice(0, 6).map((s) =>
      fetchRss(
        `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(s)}&region=US&lang=en-US`,
        s
      )
    ),
    fetchMassiveNews(),
  ];
  const all = (await Promise.all(feeds)).flat();
  const seen = new Set<string>();
  const dedup = all.filter((i) => i.title && !seen.has(i.title) && !!seen.add(i.title));
  dedup.sort((a, b) => (b.date || 0) - (a.date || 0));
  return dedup;
}

// ---------- earnings (Yahoo quoteSummary, best effort without crumb) ----------

export interface EarningsRow {
  symbol: string;
  date: number;
  avgEstimate: number | null;
  callTime: number | null;
}

const rawNum = (v: any): number | null => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (v && typeof v === 'object' && typeof v.raw === 'number' && Number.isFinite(v.raw)) return v.raw;
  return null;
};

const rawDateMs = (v: any): number | null => {
  const n = rawNum(v);
  if (n != null) return n > 1e12 ? n : n * 1000;
  if (typeof v === 'string') {
    const t = Date.parse(v);
    return Number.isNaN(t) ? null : t;
  }
  return null;
};

async function fetchEarningsFor(symbol: string): Promise<EarningsRow | null> {
  try {
    const data: any = await yahooJson(
      `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=calendarEvents`
    );
    const e = data?.quoteSummary?.result?.[0]?.calendarEvents?.earnings;
    if (!e) return null;
    const rawDates: any[] = Array.isArray(e.earningsDate) ? e.earningsDate : [];
    const dates = rawDates.map(rawDateMs).filter((d): d is number => d != null);
    if (!dates.length) return null;
    const call = Array.isArray(e.earningsCallDate) ? e.earningsCallDate[0] : e.earningsCallDate;
    return {
      symbol,
      date: Math.min(...dates),
      avgEstimate: rawNum(e.earningsAverage),
      callTime: rawDateMs(call),
    };
  } catch {
    // Yahoo may reject quoteSummary without a crumb (401) — degrade gracefully
    return null;
  }
}

export async function fetchEarnings(symbols: string[]): Promise<EarningsRow[]> {
  const rows = await Promise.all(symbols.map((s) => fetchEarningsFor(s)));
  return rows
    .filter((r): r is EarningsRow => r != null)
    .sort((a, b) => a.date - b.date);
}

/* eslint-enable @typescript-eslint/no-explicit-any */

// ---------- shared query-param helpers ----------

export function parseSymbolsParam(value: string | null): string[] {
  const list = (value || '')
    .split(',')
    .map((s) => s.toUpperCase().trim())
    .filter((s) => /^[A-Z0-9.^=-]{1,12}$/.test(s));
  return list.length ? list : [...DEFAULT_WATCHLIST];
}

export function cleanSymbol(raw: string): string | null {
  const symbol = decodeURIComponent(String(raw || '')).toUpperCase().trim();
  return /^[A-Z0-9.^=-]{1,12}$/.test(symbol) ? symbol : null;
}
