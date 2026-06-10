import { NextResponse } from 'next/server';
import {
  cached,
  cleanSymbol,
  getOptionChain,
  num,
  round1,
  round2,
  type ChainContract,
  type ChainData,
} from '@/lib/terminal/marketData';

// DB Terminal — options day-trader read on the NEAREST expiry chain.
// ATM IV, put/call volume ratio, expected move (ATM straddle), top-6 activity
// with unusual flags (vol > 2x OI and > 1000), OI walls (top-3 put OI below /
// call OI above spot), BULLISH/BEARISH/NEUTRAL read at the 1.4x volume line.
// Returns: { symbol, spot, expiry, daysToExpiry, atmIV, pcRatio, expectedMove,
//            topActivity, supportWalls, resistanceWalls, read, readReason }
// Same JSON contract as the local reference GET /api/options/:symbol. 5min cache.
// Chain source: massive /v3/snapshot/options primary, Yahoo v7 options fallback.

export const dynamic = 'force-dynamic';

// mid price of a contract: (bid+ask)/2 when both sides exist, else lastPrice
function mid(c: ChainContract): number | null {
  const bid = num(c.bid), ask = num(c.ask);
  if (bid != null && ask != null && (bid > 0 || ask > 0)) return (bid + ask) / 2;
  return num(c.lastPrice);
}

function analyzeChain(symbol: string, chain: ChainData) {
  const spot = num(chain.spot);
  const calls = chain.calls;
  const puts = chain.puts;

  // ---- expiry / DTE ----
  const expMs = chain.expiryMs;
  const expiry = expMs != null ? new Date(expMs).toISOString().slice(0, 10) : null;
  const daysToExpiry = expMs != null ? Math.max(0, Math.ceil((expMs - Date.now()) / 86400000)) : null;

  // ---- ATM IV (call closest to spot) ----
  let atmCall: ChainContract | null = null;
  let atmPut: ChainContract | null = null;
  if (spot != null) {
    const closest = (arr: ChainContract[]) => arr.reduce<ChainContract | null>((best, c) =>
      num(c.strike) != null &&
      (best == null || Math.abs((c.strike as number) - spot) < Math.abs((best.strike as number) - spot))
        ? c
        : best, null);
    atmCall = closest(calls);
    atmPut = closest(puts);
  }
  const atmIVraw = atmCall ? num(atmCall.impliedVolatility) : null;
  const atmIV = atmIVraw != null ? round1(atmIVraw * 100) : null;

  // ---- put/call volume ratio ----
  const sumVol = (arr: ChainContract[]) => arr.reduce((s, c) => s + (num(c.volume) ?? 0), 0);
  const callVol = sumVol(calls);
  const putVol = sumVol(puts);
  const pcRatio = callVol > 0 ? round2(putVol / callVol) : null;

  // ---- expected move = ATM straddle ----
  let expectedMove: { abs: number | null; pct: number | null } = { abs: null, pct: null };
  const cm = atmCall ? mid(atmCall) : null;
  const pm = atmPut ? mid(atmPut) : null;
  if (cm != null && pm != null) {
    const abs = round2(cm + pm);
    expectedMove = { abs, pct: spot ? round2((abs / spot) * 100) : null };
  }

  // ---- top activity (top 6 by volume across both sides) ----
  const tagged = [
    ...calls.map((c) => ({ type: 'CALL' as const, c })),
    ...puts.map((c) => ({ type: 'PUT' as const, c })),
  ].filter((x) => num(x.c.volume) != null && num(x.c.strike) != null);
  tagged.sort((a, b) => (b.c.volume ?? 0) - (a.c.volume ?? 0));
  const topActivity = tagged.slice(0, 6).map(({ type, c }) => {
    const vol = num(c.volume), oi = num(c.openInterest), iv = num(c.impliedVolatility);
    return {
      type,
      strike: c.strike,
      volume: vol,
      oi,
      volOiRatio: vol != null && oi ? round2(vol / oi) : null,
      iv: iv != null ? round1(iv * 100) : null,
      last: num(c.lastPrice) != null ? round2(c.lastPrice as number) : null,
      unusual: vol != null && oi != null && vol > 2 * oi && vol > 1000,
    };
  });

  // ---- OI walls ----
  const walls = (arr: ChainContract[], below: boolean, key: string) => arr
    .filter((c) => num(c.strike) != null && num(c.openInterest) != null && spot != null &&
      (below ? (c.strike as number) < spot : (c.strike as number) > spot))
    .sort((a, b) => (b.openInterest as number) - (a.openInterest as number))
    .slice(0, 3)
    .map((c) => ({ strike: c.strike as number, [key]: c.openInterest as number }))
    .sort((a, b) => a.strike - b.strike);
  const supportWalls = walls(puts, true, 'putOI');
  const resistanceWalls = walls(calls, false, 'callOI');

  // ---- directional read ----
  let read: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  let readReason = 'Not enough volume on either side to lean directional.';
  if (callVol > 0 && putVol > 0) {
    const cOverP = callVol / putVol;
    const pOverC = putVol / callVol;
    const topCall = topActivity.find((t) => t.type === 'CALL');
    const topPut = topActivity.find((t) => t.type === 'PUT');
    if (cOverP > 1.4) {
      read = 'BULLISH';
      readReason = `Call volume ${round2(cOverP)}x puts` +
        (topCall ? `; heaviest action at the ${topCall.strike} call` : '') +
        (expiry ? ` expiring ${expiry}.` : '.');
    } else if (pOverC > 1.4) {
      read = 'BEARISH';
      readReason = `Put volume ${round2(pOverC)}x calls` +
        (topPut ? `; heaviest action at the ${topPut.strike} put` : '') +
        (expiry ? ` expiring ${expiry}.` : '.');
    } else {
      readReason = `Flows balanced — put/call ratio ${pcRatio ?? 'n/a'}, no side above the 1.4x conviction line.`;
    }
  }

  return {
    symbol,
    spot: spot != null ? round2(spot) : null,
    expiry,
    daysToExpiry,
    atmIV,
    pcRatio,
    expectedMove,
    topActivity,
    supportWalls,
    resistanceWalls,
    read,
    readReason,
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol: raw } = await params;
  const symbol = cleanSymbol(raw);
  if (!symbol) {
    return NextResponse.json({ error: 'Invalid symbol' }, { status: 400 });
  }
  try {
    const data = await cached(`options:${symbol}`, 5 * 60000, async () => {
      const chain = await getOptionChain(symbol);
      return analyzeChain(symbol, chain);
    });
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'options fetch failed';
    return NextResponse.json({ error: message, symbol }, { status: 500 });
  }
}
