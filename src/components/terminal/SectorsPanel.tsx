'use client';
import { useCallback, useEffect, useState } from 'react';
import type { SectorsData } from './types';
import { Panel, Icons, Offline, Loading, cls, sign, T } from './shared';

// Sector rotation vs SPY — polls /api/terminal/sectors every 5 min
export default function SectorsPanel() {
  const [data, setData] = useState<SectorsData | null>(null);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/terminal/sectors');
      if (!r.ok) throw new Error('sectors');
      const d = (await r.json()) as SectorsData;
      if (!d || !Array.isArray(d.rows)) throw new Error('bad');
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
    const t = setInterval(load, 5 * 60000);
    return () => clearInterval(t);
  }, [load]);

  const maxAbs = data ? Math.max(...data.rows.map((r) => Math.abs(r.composite)), 1) : 1;

  return (
    <Panel icon={Icons.rotate} title="SECTOR ROTATION vs SPY" sub="1W / 1M / 3M relative strength">
      {data ? (
        <>
          <table className="dbt-table">
            <tbody>
              <tr>
                <th>#</th>
                <th style={{ textAlign: 'left' }}>SECTOR</th>
                <th>1W RS</th>
                <th>1M RS</th>
                <th>3M RS</th>
                <th>SCORE</th>
              </tr>
              {data.rows.map((r) => (
                <tr key={r.etf}>
                  <td style={{ textAlign: 'left', color: T.dim }}>{r.rank}</td>
                  <td style={{ textAlign: 'left' }}>
                    {r.etf} <span style={{ color: T.dim }}>{r.name}</span>
                    {r.lagging && <span className="dbt-lag-tag lag">LAGGING</span>}
                    {r.leading && <span className="dbt-lag-tag lead">LEADING</span>}
                  </td>
                  <td className={cls(r.rs.w1)}>{r.rs.w1 != null ? sign(r.rs.w1) + r.rs.w1.toFixed(1) : '--'}</td>
                  <td className={cls(r.rs.m1)}>{r.rs.m1 != null ? sign(r.rs.m1) + r.rs.m1.toFixed(1) : '--'}</td>
                  <td className={cls(r.rs.m3)}>{r.rs.m3 != null ? sign(r.rs.m3) + r.rs.m3.toFixed(1) : '--'}</td>
                  <td>
                    <span
                      className="dbt-rs-bar"
                      style={{
                        width: Math.max(4, (Math.abs(r.composite) / maxAbs) * 50),
                        background: r.composite >= 0 ? T.green : T.red,
                      }}
                    />{' '}
                    <span className={cls(r.composite)}>
                      {sign(r.composite)}
                      {r.composite}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="dbt-hint">
            RS = sector return minus SPY return for the period. Score = weighted blend (20% 1W, 40% 1M, 40% 3M). Bottom
            3 feed the pullback scanner.
          </div>
        </>
      ) : offline ? (
        <Offline label="SECTOR DATA UNAVAILABLE — RETRYING" />
      ) : (
        <Loading label="Ranking sectors..." />
      )}
    </Panel>
  );
}
