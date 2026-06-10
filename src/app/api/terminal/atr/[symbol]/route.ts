import { NextResponse } from 'next/server';
import {
  cached,
  cleanSymbol,
  computeATR,
  getDailyBars,
  round2,
} from '@/lib/terminal/marketData';

// DB Terminal — Wilder ATR(14) from daily bars.
// Returns: { symbol, atr14, atrPct }
// Same JSON contract as the local reference GET /api/atr/:symbol. 10min cache.

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
    const data = await cached(`atr:${symbol}`, 10 * 60000, async () => {
      const bars = await getDailyBars(symbol, 120);
      const atr = computeATR(bars, 14);
      const lastClose = bars && bars.length ? bars[bars.length - 1].close : null;
      return {
        symbol,
        atr14: atr != null ? round2(atr) : null,
        atrPct: atr != null && lastClose ? round2((atr / lastClose) * 100) : null,
      };
    });
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'atr fetch failed';
    return NextResponse.json({ error: message, symbol }, { status: 500 });
  }
}
