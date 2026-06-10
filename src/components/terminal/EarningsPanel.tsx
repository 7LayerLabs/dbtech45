'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { EarningsRow } from './types';
import { Panel, Icons, Offline, Loading, fmt, T } from './shared';

// Earnings dates for the watchlist — polls every 30 min, refetches on watchlist change
export default function EarningsPanel({ watchlist }: { watchlist: string[] }) {
  const [rows, setRows] = useState<EarningsRow[] | null>(null);
  const [offline, setOffline] = useState(false);
  const watchlistRef = useRef(watchlist);
  watchlistRef.current = watchlist;

  const load = useCallback(async () => {
    const wl = watchlistRef.current;
    if (!wl.length) return;
    try {
      const r = await fetch(`/api/terminal/earnings?symbols=${encodeURIComponent(wl.join(','))}`);
      if (!r.ok) throw new Error('earnings');
      const data = (await r.json()) as EarningsRow[];
      if (!Array.isArray(data)) return;
      setRows(data);
      setOffline(false);
    } catch {
      setRows((prev) => {
        if (!prev) setOffline(true);
        return prev;
      });
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30 * 60000);
    return () => clearInterval(t);
  }, [load, watchlist]);

  return (
    <Panel icon={Icons.calendar} title="EARNINGS / CALLS" sub="watchlist">
      {rows ? (
        rows.length ? (
          <>
            <table className="dbt-table">
              <tbody>
                <tr>
                  <th style={{ textAlign: 'left' }}>SYM</th>
                  <th>NEXT EARNINGS</th>
                  <th>EST EPS</th>
                  <th>DAYS</th>
                </tr>
                {rows.map((r) => {
                  const days = Math.ceil((r.date - Date.now()) / 86400000);
                  return (
                    <tr key={r.symbol}>
                      <td style={{ color: T.amber, fontWeight: 700 }}>{r.symbol}</td>
                      <td>
                        {new Date(r.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td>{r.avgEstimate != null ? fmt(r.avgEstimate) : '--'}</td>
                      <td className={days <= 7 ? 'down' : 'flat'}>{days >= 0 ? `${days}d` : 'past'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="dbt-hint">
              Red day-count = earnings within a week (volatility risk on swing holds). Click a ticker on
              Yahoo/TradingView for the call webcast link.
            </div>
          </>
        ) : (
          <Loading label="No upcoming earnings found for watchlist." />
        )
      ) : offline ? (
        <Offline label="EARNINGS DATA UNAVAILABLE — RETRYING" />
      ) : (
        <Loading label="Loading earnings dates..." />
      )}
    </Panel>
  );
}
