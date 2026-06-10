import { NextResponse } from 'next/server';
import {
  cached,
  cleanSymbol,
  computePivots,
  etDateString,
  getDailyBars,
  round2,
} from '@/lib/terminal/marketData';

// DB Terminal — classic floor-trader pivots from the PRIOR completed day's
// H/L/C (last daily bar that is not today's possibly still-forming bar,
// "today" judged in ET).
// Returns: { symbol, pp, r1, r2, r3, s1, s2, s3 }
// Same JSON contract as the local reference GET /api/pivots/:symbol. 10min cache.

export const dynamic = 'force-dynamic';

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
    const data = await cached(`pivots:${symbol}`, 10 * 60000, async () => {
      const bars = await getDailyBars(symbol, 15);
      const todayEt = etDateString(Date.now());
      const prior = (bars || [])
        .filter((b) => etDateString(b.date) !== todayEt)
        .pop();
      if (!prior || prior.high == null || prior.low == null || prior.close == null) {
        return { symbol, pp: null, r1: null, r2: null, r3: null, s1: null, s2: null, s3: null };
      }
      const p = computePivots(prior.high, prior.low, prior.close);
      return {
        symbol,
        pp: round2(p.pp),
        r1: round2(p.r1), r2: round2(p.r2), r3: round2(p.r3),
        s1: round2(p.s1), s2: round2(p.s2), s3: round2(p.s3),
      };
    });
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'pivots fetch failed';
    return NextResponse.json({ error: message, symbol }, { status: 500 });
  }
}
