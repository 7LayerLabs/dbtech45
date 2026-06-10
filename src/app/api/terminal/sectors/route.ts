import { NextResponse } from 'next/server';
import { computeSectors } from '@/lib/terminal/marketData';

// DB Terminal — sector rotation.
// 11 SPDR ETFs vs SPY; returns over 1w/1m/3m; RS = sector return minus SPY;
// composite = .2/.4/.4 weights; bottom 3 flagged lagging, top 3 leading.
// Returns: { spy: { w1, m1, m3 }, rows: [{ etf, name, ret, rs, composite,
//            rank, lagging, leading }] }
// Same JSON contract as the local reference GET /api/sectors. 5min cache
// (inside computeSectors).

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await computeSectors();
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'sectors fetch failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
