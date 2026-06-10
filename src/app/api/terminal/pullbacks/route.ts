import { NextResponse } from 'next/server';
import {
  cached,
  computeSectors,
  getDailyBars,
  pct,
  round2,
  sma,
  type Bar,
} from '@/lib/terminal/marketData';
import { SECTORS } from '@/lib/terminal/sectors-data';

// DB Terminal — pullback scanner.
// Strong stocks (above 50/200 SMA, beating their sector ETF over 3 months)
// inside the LAGGING sectors, currently pulled back 2-10% off their 20-day
// high = PULLBACK setup; otherwise STRONG / EXTENDED.
// Returns: { laggingSectors: [{ etf, name, composite }],
//            candidates: [{ symbol, sector, sectorEtf, price, sma20, sma50,
//              sma200, ret3m, sectorRet3m, rsVsSector, offHighPct, nearSma20,
//              setup }] }
// Same JSON contract as the local reference GET /api/pullbacks. 10min cache.

export const dynamic = 'force-dynamic';

interface Candidate {
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
  setup: 'PULLBACK' | 'STRONG / EXTENDED';
}

export async function GET() {
  try {
    const data = await cached('pullbacks', 10 * 60000, async () => {
      const sectorsResp = await computeSectors();
      const lagging = sectorsResp.rows.filter((r) => r.lagging);
      const candidates: Candidate[] = [];
      for (const sec of lagging) {
        const holdings = SECTORS[sec.etf].holdings;
        const etfBars = await getDailyBars(sec.etf, 260).catch((): Bar[] => []);
        const etfRet3m = etfBars.length > 64
          ? pct(etfBars[etfBars.length - 1].close, etfBars[etfBars.length - 64].close)
          : null;
        const results = await Promise.all(holdings.map(async (sym): Promise<Candidate | null> => {
          try {
            const bars = await getDailyBars(sym, 320);
            if (bars.length < 200) return null;
            const closes = bars.map((b) => b.close);
            const last = closes[closes.length - 1];
            const sma50v = sma(closes, 50), sma200v = sma(closes, 200), sma20v = sma(closes, 20);
            const ret3m = bars.length > 64 ? pct(last, closes[closes.length - 64]) : null;
            const recentHighs = bars.slice(-20).map((b) => b.high).filter((h): h is number => h != null);
            if (!recentHighs.length) return null;
            const high20 = Math.max(...recentHighs);
            const offHigh = pct(last, high20); // negative = pulled back
            const aboveSMAs = !!(sma50v && sma200v && last > sma50v && last > sma200v);
            const beatsSector = ret3m != null && etfRet3m != null && ret3m > etfRet3m;
            if (!aboveSMAs || !beatsSector) return null;
            const pulledBack = offHigh <= -2 && offHigh >= -10;
            return {
              symbol: sym,
              sector: sec.name,
              sectorEtf: sec.etf,
              price: round2(last),
              sma20: round2(sma20v as number),
              sma50: round2(sma50v as number),
              sma200: round2(sma200v as number),
              ret3m: round2(ret3m as number),
              sectorRet3m: round2(etfRet3m as number),
              rsVsSector: round2((ret3m as number) - (etfRet3m as number)),
              offHighPct: round2(offHigh),
              nearSma20: sma20v ? Math.abs(pct(last, sma20v)) <= 2 : false,
              setup: pulledBack ? 'PULLBACK' : 'STRONG / EXTENDED',
            };
          } catch {
            return null;
          }
        }));
        candidates.push(...results.filter((r): r is Candidate => r != null));
      }
      candidates.sort((a, b) =>
        (a.setup === 'PULLBACK' ? -1 : 1) - (b.setup === 'PULLBACK' ? -1 : 1) ||
        b.rsVsSector - a.rsVsSector);
      return {
        laggingSectors: lagging.map((l) => ({ etf: l.etf, name: l.name, composite: l.composite })),
        candidates,
      };
    });
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'pullbacks fetch failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
