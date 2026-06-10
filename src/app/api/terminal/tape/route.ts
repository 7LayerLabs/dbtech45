import { NextResponse } from 'next/server';
import {
  cached,
  getQuotes,
  round2,
  pct,
  TAPE_SYMBOLS,
  TAPE_LABELS,
} from '@/lib/terminal/marketData';

// DB Terminal — market tape.
// Returns: [{ symbol, label, price, change, changePct, prevClose, dayHigh,
//             dayLow, volume, marketState }]
// Same JSON contract as the local reference GET /api/tape. 15s cache.

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await cached('tape', 15000, async () => {
      const quotes = await getQuotes(TAPE_SYMBOLS);
      return quotes
        .filter((q) => q.price != null)
        .map((q) => ({
          symbol: q.symbol,
          label: TAPE_LABELS[q.symbol] || q.symbol,
          price: round2(q.price as number),
          change: q.prevClose != null ? round2((q.price as number) - q.prevClose) : null,
          changePct: q.prevClose != null ? round2(pct(q.price as number, q.prevClose)) : null,
          prevClose: q.prevClose != null ? round2(q.prevClose) : null,
          dayHigh: q.dayHigh != null ? round2(q.dayHigh) : null,
          dayLow: q.dayLow != null ? round2(q.dayLow) : null,
          volume: q.volume,
          marketState: q.marketState,
        }));
    });
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'tape fetch failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
