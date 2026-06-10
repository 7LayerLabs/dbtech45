'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { OptionsData } from './types';
import { Panel, Icons, Offline, Loading, StatusBadge, fmt, fmt0, T } from './shared';

// Options flow — read badge, expected move, IV, P/C, OI walls, unusual activity. Polls 5 min.
export default function OptionsPanel() {
  const [symbol, setSymbol] = useState('SPY');
  const [input, setInput] = useState('SPY');
  const [data, setData] = useState<OptionsData | null>(null);
  const [offline, setOffline] = useState(false);
  const [sub, setSub] = useState('');
  const symbolRef = useRef(symbol);
  symbolRef.current = symbol;

  const load = useCallback(async () => {
    const sym = symbolRef.current;
    try {
      const r = await fetch(`/api/terminal/options/${encodeURIComponent(sym)}`);
      if (!r.ok) throw new Error('options');
      const d = (await r.json()) as OptionsData;
      if (!d || d.error || !d.symbol) throw new Error('bad');
      setData(d);
      setOffline(false);
      setSub(d.symbol + ' · updated ' + new Date().toLocaleTimeString());
    } catch {
      setData((prev) => {
        if (!prev) {
          setOffline(true);
          setSub(sym + ' · feed offline');
        }
        return prev;
      });
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5 * 60000);
    return () => clearInterval(t);
  }, [load, symbol]);

  const lookup = () => {
    const s = input.trim().toUpperCase();
    if (s && s !== symbol) {
      setData(null);
      setOffline(false);
      setSymbol(s);
    } else if (s) {
      load();
    }
  };

  const em: { abs?: number | null; pct?: number | null } = data?.expectedMove || {};
  const act = data?.topActivity || [];

  return (
    <Panel
      icon={Icons.options}
      title="OPTIONS FLOW"
      sub={sub}
      noScroll
      headExtra={
        <div className="dbt-row-flex" style={{ padding: '8px 12px 0', marginBottom: 6 }}>
          <input
            placeholder="SPY"
            value={input}
            style={{ flex: '0 0 100px' }}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') lookup();
            }}
          />
          <button onClick={lookup}>LOOKUP</button>
        </div>
      }
    >
      {data ? (
        <>
          <div className="dbt-opt-read">
            <StatusBadge status={data.read || 'NEUTRAL'} />
            <span style={{ color: T.text, fontWeight: 700 }}>{data.symbol}</span>
            <span style={{ color: T.dim }}>SPOT {fmt(data.spot)}</span>
          </div>
          <div className="dbt-opt-reason">{data.readReason || ''}</div>
          <div className="dbt-opt-em">
            <span className="big">{em.abs != null ? fmt(em.abs) : '--'}</span>
            <span style={{ fontSize: 14 }} className="flat">
              {em.pct != null ? `(${fmt(em.pct)}%)` : ''}
            </span>
            <span className="lbl">EXPECTED MOVE BY {data.expiry || '--'}</span>
          </div>
          <div className="dbt-opt-stats">
            <div className="dbt-cell">
              <span className="lbl">ATM IV</span>
              <span className="val">{data.atmIV != null ? fmt(data.atmIV) + '%' : '--'}</span>
            </div>
            <div className="dbt-cell">
              <span className="lbl">P/C RATIO</span>
              <span className={`val ${data.pcRatio != null && data.pcRatio > 1 ? 'down' : data.pcRatio != null && data.pcRatio < 1 ? 'up' : ''}`}>
                {data.pcRatio != null ? fmt(data.pcRatio) : '--'}
              </span>
            </div>
            <div className="dbt-cell">
              <span className="lbl">DTE</span>
              <span className="val">{data.daysToExpiry ?? '--'}</span>
            </div>
            <div className="dbt-cell">
              <span className="lbl">EXPIRY</span>
              <span className="val" style={{ color: T.dim }}>{data.expiry || '--'}</span>
            </div>
          </div>
          <div className="dbt-sec-lbl">OI WALLS</div>
          <div className="dbt-walls">
            <div className="dbt-wall-col">
              <div className="wlbl up">SUPPORT (PUT OI)</div>
              {(data.supportWalls || []).length ? (
                (data.supportWalls || []).map((w, i) => (
                  <div className="dbt-wall-row" key={i}>
                    <span className="up">{fmt(w.strike)}</span>
                    <span className="oi">{fmt0(w.putOI)} OI</span>
                  </div>
                ))
              ) : (
                <div className="dbt-wall-row">
                  <span className="oi">--</span>
                </div>
              )}
            </div>
            <div className="dbt-wall-col">
              <div className="wlbl down">RESISTANCE (CALL OI)</div>
              {(data.resistanceWalls || []).length ? (
                (data.resistanceWalls || []).map((w, i) => (
                  <div className="dbt-wall-row" key={i}>
                    <span className="down">{fmt(w.strike)}</span>
                    <span className="oi">{fmt0(w.callOI)} OI</span>
                  </div>
                ))
              ) : (
                <div className="dbt-wall-row">
                  <span className="oi">--</span>
                </div>
              )}
            </div>
          </div>
          <div className="dbt-sec-lbl">TOP ACTIVITY</div>
          {act.length ? (
            <table className="dbt-table">
              <tbody>
                <tr>
                  <th>TYPE</th>
                  <th>STRIKE</th>
                  <th>VOL</th>
                  <th>OI</th>
                  <th>V/OI</th>
                  <th>LAST</th>
                  <th></th>
                </tr>
                {act.map((a, i) => (
                  <tr key={i}>
                    <td className={a.type === 'CALL' ? 'up' : 'down'} style={{ fontWeight: 700 }}>
                      {a.type}
                    </td>
                    <td>{fmt(a.strike)}</td>
                    <td>{fmt0(a.volume)}</td>
                    <td>{fmt0(a.oi)}</td>
                    <td>{a.volOiRatio != null ? fmt(a.volOiRatio) : '--'}</td>
                    <td>{fmt(a.last)}</td>
                    <td>{a.unusual ? <span className="dbt-badge b-unusual">UNUSUAL</span> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Loading label="No notable contracts." />
          )}
          <div className="dbt-hint">
            Expected move = ATM straddle implied range into expiry. Walls = biggest open-interest strikes (price magnets
            / barriers). V/OI &gt; 1 with size = fresh positioning, flagged UNUSUAL.
          </div>
        </>
      ) : offline ? (
        <Offline label="OPTIONS FEED OFFLINE — RETRYING" />
      ) : (
        <Loading label="Loading options data..." />
      )}
    </Panel>
  );
}
