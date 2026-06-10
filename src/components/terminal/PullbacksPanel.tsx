'use client';
import { useCallback, useEffect, useState } from 'react';
import type { PullbacksData } from './types';
import { Panel, Icons, Offline, Loading, StatusBadge, fmt, cls, T } from './shared';

// Pullback scanner — strong stocks in lagging sectors. Polls every 10 min.
export default function PullbacksPanel() {
  const [data, setData] = useState<PullbacksData | null>(null);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/terminal/pullbacks');
      if (!r.ok) throw new Error('pullbacks');
      const d = (await r.json()) as PullbacksData;
      if (!d || !Array.isArray(d.candidates)) throw new Error('bad');
      setData(d);
      setOffline(false);
    } catch {
      setData((prev) => {
        if (!prev) setOffline(true);
        return prev;
      });
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 10 * 60000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <Panel icon={Icons.trend} title="PULLBACK SCANNER" sub="strong stocks in lagging sectors">
      {data ? (
        data.candidates.length ? (
          <>
            <table className="dbt-table">
              <tbody>
                <tr>
                  <th style={{ textAlign: 'left' }}>SYM</th>
                  <th>SECTOR</th>
                  <th>PRICE</th>
                  <th>RS vs SECT</th>
                  <th>OFF 20D HIGH</th>
                  <th>SETUP</th>
                </tr>
                {data.candidates.map((c) => (
                  <tr key={c.symbol}>
                    <td style={{ color: T.amber, fontWeight: 700 }}>{c.symbol}</td>
                    <td style={{ color: T.dim }}>{c.sectorEtf}</td>
                    <td>{fmt(c.price)}</td>
                    <td className="up">+{c.rsVsSector}%</td>
                    <td className={cls(c.offHighPct)}>{c.offHighPct}%</td>
                    <td>
                      {c.setup === 'PULLBACK' ? (
                        <StatusBadge status="PULLBACK" />
                      ) : (
                        <span className="dbt-badge b-neutral">EXTENDED</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="dbt-hint">
              Criteria: stock is ABOVE its 50 + 200 day average AND beating its own sector ETF over 3 months, while the
              sector itself is in the bottom 3. PULLBACK = currently 2-10% off its 20-day high (potential bounce entry).
              EXTENDED = strong but not pulled back yet.
            </div>
          </>
        ) : (
          <Loading
            label={
              'No candidates right now. Lagging sectors: ' +
              (data.laggingSectors || []).map((l) => l.etf).join(', ')
            }
          />
        )
      ) : offline ? (
        <Offline label="SCANNER UNAVAILABLE — RETRYING" />
      ) : (
        <Loading label="Scanning (first run takes ~30s)..." />
      )}
    </Panel>
  );
}
