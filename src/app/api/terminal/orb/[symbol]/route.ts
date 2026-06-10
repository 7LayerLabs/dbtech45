import { NextResponse } from 'next/server';
import {
  cached,
  cleanSymbol,
  getDailyBars,
  getMinuteBars,
  pct,
  round2,
} from '@/lib/terminal/marketData';

// DB Terminal — ORB (opening range breakout) panel.
// Opening range = 9:30-9:45 ET (first 15 minutes) from 1-minute bars, plus
// prior-day H/L/C, premarket H/L, and the last ~90 regular-session closes for
// the sparkline. Status machine: PRE-MARKET / FORMING / INSIDE / BREAKOUT /
// BREAKDOWN / CLOSED ABOVE / CLOSED BELOW / CLOSED INSIDE / CLOSED.
// Returns: { symbol, status, last, orbHigh, orbLow, orbMid, orbRangePct,
//            distFromHighPct, distFromLowPct,
//            levels: { pdh, pdl, pdc, pmHigh, pmLow }, manualLevels, bars }
// Same JSON contract as the local reference GET /api/orb/:symbol. 30s cache.
// manualLevels persistence lives in a separate route; this returns [].

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
    const data = await cached(`orb:${symbol}`, 30000, async () => {
      const minute = await getMinuteBars(symbol);
      const { bars, regStartMs, regEndMs, preStartMs, preEndMs } = minute;

      const todayBars = regStartMs != null
        ? bars.filter((b) => b.date >= regStartMs && b.date < (regEndMs ?? Infinity))
        : [];
      const orbBars = regStartMs != null
        ? todayBars.filter((b) => b.date < regStartMs + 15 * 60000)
        : [];
      const preBars = preStartMs != null
        ? bars.filter((b) => b.date >= preStartMs && b.date < (preEndMs ?? regStartMs ?? Infinity))
        : [];

      const highs = (arr: typeof bars) => arr.map((b) => b.high).filter((h): h is number => h != null);
      const lows = (arr: typeof bars) => arr.map((b) => b.low).filter((l): l is number => l != null);

      const orbHigh = orbBars.length ? Math.max(...highs(orbBars)) : null;
      const orbLow = orbBars.length ? Math.min(...lows(orbBars)) : null;
      const pmHigh = preBars.length ? Math.max(...highs(preBars)) : null;
      const pmLow = preBars.length ? Math.min(...lows(preBars)) : null;

      // Prior day H/L/C from daily bars (exclude the session day's bar)
      const daily = await getDailyBars(symbol, 15);
      const todayStr = regStartMs != null
        ? new Date(regStartMs).toDateString()
        : new Date().toDateString();
      const priorDays = daily.filter((b) => new Date(b.date).toDateString() !== todayStr);
      const prior = priorDays[priorDays.length - 1] || null;

      const last = todayBars.length
        ? todayBars[todayBars.length - 1].close
        : (minute.lastPrice ?? (bars.length ? bars[bars.length - 1].close : null));
      const now = Date.now();
      const orbComplete = regStartMs != null ? now >= regStartMs + 15 * 60000 : false;
      const sessionOpen = regStartMs != null && regEndMs != null
        ? now >= regStartMs && now < regEndMs
        : false;

      let status = 'CLOSED';
      if (sessionOpen && !orbComplete) status = 'FORMING';
      else if (sessionOpen && orbComplete && orbHigh != null && orbLow != null && last != null) {
        if (last > orbHigh) status = 'BREAKOUT';
        else if (last < orbLow) status = 'BREAKDOWN';
        else status = 'INSIDE';
      } else if (!sessionOpen && regStartMs != null && now < regStartMs) status = 'PRE-MARKET';
      else if (orbHigh != null && orbLow != null && last != null) {
        // after close, show where it ended
        status = last > orbHigh ? 'CLOSED ABOVE' : last < orbLow ? 'CLOSED BELOW' : 'CLOSED INSIDE';
      }

      return {
        symbol,
        status,
        last: last != null ? round2(last) : null,
        orbHigh: orbHigh != null ? round2(orbHigh) : null,
        orbLow: orbLow != null ? round2(orbLow) : null,
        orbMid: orbHigh != null && orbLow != null ? round2((orbHigh + orbLow) / 2) : null,
        orbRangePct: orbHigh && orbLow && last ? round2(((orbHigh - orbLow) / last) * 100) : null,
        distFromHighPct: orbHigh && last ? round2(pct(last, orbHigh)) : null,
        distFromLowPct: orbLow && last ? round2(pct(last, orbLow)) : null,
        levels: {
          pdh: prior && prior.high != null ? round2(prior.high) : null,
          pdl: prior && prior.low != null ? round2(prior.low) : null,
          pdc: prior ? round2(prior.close) : null,
          pmHigh: pmHigh != null ? round2(pmHigh) : null,
          pmLow: pmLow != null ? round2(pmLow) : null,
        },
        manualLevels: [] as Array<{ price: number; note: string }>,
        bars: todayBars.slice(-90).map((b) => ({ t: b.date, c: round2(b.close) })),
      };
    });
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'orb fetch failed';
    return NextResponse.json({ error: message, symbol }, { status: 500 });
  }
}
