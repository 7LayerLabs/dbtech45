'use client';
import { useCallback, useEffect, useState } from 'react';
import type { IdeasData, TerminalSettings } from './types';
import { Panel, Icons, Offline, Loading, fmt, fmt0, T } from './shared';

const playLabel = (p: string | undefined) => String(p || '').replace(/_/g, ' ');

// Trade idea cards — polls /api/terminal/ideas every 60s
export default function IdeasPanel({ settings }: { settings: TerminalSettings }) {
  const [data, setData] = useState<IdeasData | null>(null);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/terminal/ideas');
      if (!r.ok) throw new Error('ideas');
      const d = (await r.json()) as IdeasData;
      if (!d || !Array.isArray(d.ideas)) throw new Error('bad');
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
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  const s = data?.settings || {};
  const sub = data
    ? `acct $${fmt0(s.accountSize ?? settings.accountSize)} @ ${s.riskPct ?? settings.riskPct}% risk` +
      (data.generated ? ' · gen ' + new Date(data.generated).toLocaleTimeString() : '')
    : 'engine offline';

  return (
    <Panel icon={Icons.target} title="TRADE IDEAS" sub={sub} noScroll>
      {data ? (
        data.ideas.length ? (
          <div className="dbt-ideas-wrap">
            {data.ideas.map((i, idx) => (
              <div className="dbt-idea-card" key={`${i.symbol}-${idx}`}>
                <div className="dbt-idea-top">
                  <span className="dbt-idea-sym">{i.symbol}</span>
                  {i.side === 'SHORT' ? (
                    <span className="dbt-badge b-short">SHORT</span>
                  ) : (
                    <span className="dbt-badge b-long">LONG</span>
                  )}
                  <span className="dbt-badge b-play">{playLabel(i.playType)}</span>
                  {i.confidence === 'HIGH' ? (
                    <span className="dbt-badge b-conf-high">HIGH</span>
                  ) : (
                    <span className="dbt-badge b-conf-med">{i.confidence || 'MEDIUM'}</span>
                  )}
                  <span className="dbt-idea-rr">
                    <span style={{ color: T.dim }}>R:R</span> {i.rr != null ? Number(i.rr).toFixed(1) : '--'}
                  </span>
                </div>
                <div className="dbt-idea-nums">
                  <div className="dbt-cell">
                    <span className="lbl">ENTRY</span>
                    <span className="val">{fmt(i.entry)}</span>
                  </div>
                  <div className="dbt-cell">
                    <span className="lbl">STOP</span>
                    <span className="val down">{fmt(i.stop)}</span>
                  </div>
                  {(i.targets || []).map((t, n) => (
                    <div className="dbt-cell" key={n}>
                      <span className="lbl">T{n + 1}</span>
                      <span className="val up">{fmt(t)}</span>
                    </div>
                  ))}
                  <div className="dbt-cell">
                    <span className="lbl">ATR14</span>
                    <span className="val" style={{ color: T.dim }}>{fmt(i.atr14)}</span>
                  </div>
                </div>
                <div className="dbt-idea-size">
                  <b>{fmt0(i.shares)} SHARES</b> risks <span className="down">${fmt0(i.riskDollars)}</span>
                </div>
                <ul className="dbt-idea-reasons">
                  {(i.reasons || []).map((rr, n) => (
                    <li key={n}>{rr}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <Loading label="No qualifying setups right now. Engine re-scans every minute." />
        )
      ) : offline ? (
        <Offline label="IDEA ENGINE OFFLINE — RETRYING EVERY 60S" />
      ) : (
        <Loading label="Loading trade ideas..." />
      )}
    </Panel>
  );
}
