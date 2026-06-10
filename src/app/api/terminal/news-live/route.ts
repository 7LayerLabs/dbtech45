import { NextResponse } from 'next/server';
import { cached, fetchAllNews, parseSymbolsParam } from '@/lib/terminal/marketData';

// DB Terminal — live news wire.
// Merges CNBC top stories RSS, MarketWatch top stories RSS, per-watchlist
// Yahoo Finance RSS (first 6 symbols), and massive /v2/reference/news when
// MASSIVE_API_KEY is set. Deduped by title, sorted newest first.
// Watchlist via ?symbols=SPY,QQQ,... (defaults to the standard watchlist).
// Returns: [{ title, link, date, source }] — up to 100 items (callers slice).
// Same item shape as the local reference GET /api/news. 5min cache.

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const watchlist = parseSymbolsParam(searchParams.get('symbols'));
    const key = `news:${watchlist.slice(0, 6).join(',')}`;
    const data = await cached(key, 5 * 60000, () => fetchAllNews(watchlist));
    return NextResponse.json(data.slice(0, 100));
  } catch (e) {
    const message = e instanceof Error ? e.message : 'news fetch failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
