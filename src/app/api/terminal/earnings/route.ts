import { NextResponse } from 'next/server';
import { cached, fetchEarnings, parseSymbolsParam } from '@/lib/terminal/marketData';

// DB Terminal — upcoming earnings for the watchlist.
// Best effort via Yahoo quoteSummary calendarEvents (no crumb auth — if Yahoo
// rejects with 401/crumb errors, symbols simply drop out and this returns []).
// Watchlist via ?symbols=SPY,QQQ,... (defaults to the standard watchlist).
// Returns: [{ symbol, date, avgEstimate, callTime }] sorted by date ascending.
// Same JSON contract as the local reference GET /api/earnings. 30min cache.

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const watchlist = parseSymbolsParam(searchParams.get('symbols'));
    const data = await cached(
      `earnings:${watchlist.join(',')}`,
      30 * 60000,
      () => fetchEarnings(watchlist)
    );
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'earnings fetch failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
