'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { OrbData, Pivots, AtrData } from './types';
import { Panel, Icons, StatusBadge, Offline, Loading, fmt, cls, sign, T } from './shared';

interface Props {
  watchlist: string[];
  visible: boolean; // F1 tab active — sparkline canvases are zero-width while hidden
  refreshKey: number; // bumped when manual levels are saved
  onAlert: (symbol: string, dir: 'BREAKOUT' | 'BREAKDOWN', price: number | null) => void;
}

function orbMidOf(d: OrbData): number | null {
  if (d.orbMid != null) return d.orbMid;
  if (d.orbHigh != null && d.orbLow != null) return Math.round((d.orbHigh + d.orbLow) * 50) / 100;
  return null;
}

// Raw-canvas sparkline: price line + dashed ORB high/mid/low + dotted manual levels
function Spark({ d, visible }: { d: OrbData; visible: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c || !visible) return;
    try {
      const parent = c.parentElement;
      if (!parent) return;
      const w = parent.clientWidth - 20;
      const h = 80;
      if (w < 60) return; // hidden — redrawn when tab becomes visible
      const dpr = window.devicePixelRatio || 1;
      c.width = w * dpr;
      c.height = h * dpr;
      c.style.width = w + 'px';
      c.style.height = h + 'px';
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      const bars = (d.bars || []).filter((b) => b && b.c != null);
      if (bars.length < 2) {
        ctx.fillStyle = T.dim;
        ctx.font = `10px ${T.mono}`;
        ctx.fillText('NO INTRADAY BARS YET', 4, 16);
        return;
      }
      const closes = bars.map((b) => b.c as number);
      let lo = Math.min(...closes);
      let hi = Math.max(...closes);
      if (d.orbHigh != null) { hi = Math.max(hi, d.orbHigh); lo = Math.min(lo, d.orbHigh); }
      if (d.orbLow != null) { hi = Math.max(hi, d.orbLow); lo = Math.min(lo, d.orbLow); }
      const pad = (hi - lo) * 0.06 || hi * 0.001 || 1;
      lo -= pad;
      hi += pad;
      const X = (i: number) => 1 + (i / (bars.length - 1)) * (w - 2);
      const Y = (v: number) => h - 2 - ((v - lo) / (hi - lo)) * (h - 4);
      const hline = (v: number | null | undefined, color: string, dash: number[]) => {
        if (v == null || v < lo || v > hi) return;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.setLineDash(dash);
        ctx.beginPath();
        ctx.moveTo(0, Y(v));
        ctx.lineTo(w, Y(v));
        ctx.stroke();
        ctx.restore();
      };
      hline(d.orbHigh, 'rgba(16,185,129,.8)', [4, 3]); // ORB high — dashed green
      hline(d.orbLow, 'rgba(239,68,68,.8)', [4, 3]); // ORB low — dashed red
      const mid = d.orbMid != null ? d.orbMid : d.orbHigh != null && d.orbLow != null ? (d.orbHigh + d.orbLow) / 2 : null;
      hline(mid, 'rgba(245,158,11,.9)', [6, 4]); // ORB mid (50% fib) — dashed amber
      for (const m of d.manualLevels || []) hline(m.price, 'rgba(245,158,11,.7)', [2, 3]); // manual — dotted amber
      // price line
      ctx.strokeStyle = T.blue;
      ctx.lineWidth = 1.25;
      ctx.setLineDash([]);
      ctx.beginPath();
      bars.forEach((b, i) => {
        if (i === 0) ctx.moveTo(X(i), Y(b.c as number));
        else ctx.lineTo(X(i), Y(b.c as number));
      });
      ctx.stroke();
      // last price dot
      ctx.fillStyle = T.text;
      ctx.beginPath();
      ctx.arc(X(bars.length - 1), Y(closes[closes.length - 1]), 2, 0, Math.PI * 2);
      ctx.fill();
    } catch {}
  }, [d, visible]);

  return <canvas ref={ref} className="dbt-spark" />;
}

function LvlRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="dbt-lvl-row">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Detail({ d, pivots, atr, visible }: { d: OrbData; pivots: Pivots | null; atr: AtrData | null; visible: boolean }) {
  const L = d.levels || {};
  const mid = orbMidOf(d);
  const above = mid != null && d.last != null ? d.last >= mid : null;
  return (
    <div className="dbt-orb-detail">
      <Spark d={d} visible={visible} />
      <LvlRow label="ORB RANGE" value={d.orbRangePct != null ? `${d.orbRangePct}%` : '--'} />
      {mid != null && (
        <LvlRow
          label="ORB MID (50% FIB)"
          value={
            <span style={{ color: T.amber }}>
              {fmt(mid)}{' '}
              {above != null && <span className={above ? 'up' : 'down'}>{above ? 'ABOVE' : 'BELOW'}</span>}
            </span>
          }
        />
      )}
      <LvlRow
        label="DIST FROM ORB HIGH"
        value={
          <span className={cls(d.distFromHighPct)}>
            {d.distFromHighPct != null ? `${sign(d.distFromHighPct)}${d.distFromHighPct}%` : '--'}
          </span>
        }
      />
      {atr && atr.atr14 != null && (
        <LvlRow
          label="ATR (14D)"
          value={
            <span>
              {fmt(atr.atr14)}
              {atr.atrPct != null && <span style={{ color: T.dim }}> ({fmt(atr.atrPct)}%)</span>}
            </span>
          }
        />
      )}
      <LvlRow label="PRIOR DAY HIGH" value={fmt(L.pdh)} />
      <LvlRow label="PRIOR DAY LOW" value={fmt(L.pdl)} />
      <LvlRow label="PRIOR DAY CLOSE" value={fmt(L.pdc)} />
      <LvlRow label="PREMARKET HIGH" value={fmt(L.pmHigh)} />
      <LvlRow label="PREMARKET LOW" value={fmt(L.pmLow)} />
      {pivots && (
        <>
          <div className="dbt-lvl-sep" />
          <LvlRow label="PIVOT R2" value={<span className="down">{fmt(pivots.r2)}</span>} />
          <LvlRow label="PIVOT R1" value={<span className="down">{fmt(pivots.r1)}</span>} />
          <LvlRow label="PIVOT PP" value={<span style={{ color: T.amber }}>{fmt(pivots.pp)}</span>} />
          <LvlRow label="PIVOT S1" value={<span className="up">{fmt(pivots.s1)}</span>} />
          <LvlRow label="PIVOT S2" value={<span className="up">{fmt(pivots.s2)}</span>} />
        </>
      )}
      {(d.manualLevels || []).length > 0 && (
        <>
          <div className="dbt-lvl-sep" />
          {(d.manualLevels || []).map((m, i) => (
            <LvlRow
              key={i}
              label={`MY LEVEL ${m.note ? `(${m.note})` : ''}`}
              value={<span style={{ color: T.blue }}>{fmt(m.price)}</span>}
            />
          ))}
        </>
      )}
    </div>
  );
}

export default function OrbPanel({ watchlist, visible, refreshKey, onAlert }: Props) {
  const [rows, setRows] = useState<OrbData[]>([]);
  const [updated, setUpdated] = useState('');
  const [offline, setOffline] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(['SPY']));
  const [pivots, setPivots] = useState<Record<string, Pivots | null>>({});
  const [atrs, setAtrs] = useState<Record<string, AtrData | null>>({});

  const prevStatusRef = useRef<Record<string, string>>({}); // survives re-renders — alert transition tracking
  const pivotReqRef = useRef<Set<string>>(new Set());
  const watchlistRef = useRef(watchlist);
  watchlistRef.current = watchlist;
  const expandedRef = useRef(expanded);
  expandedRef.current = expanded;
  const onAlertRef = useRef(onAlert);
  onAlertRef.current = onAlert;

  const fetchPivotAtr = useCallback(async (sym: string) => {
    if (pivotReqRef.current.has(sym)) return;
    pivotReqRef.current.add(sym);
    try {
      const r = await fetch(`/api/terminal/pivots/${encodeURIComponent(sym)}`);
      const pv = r.ok ? ((await r.json()) as Pivots) : null;
      setPivots((p) => ({ ...p, [sym]: pv }));
    } catch {
      setPivots((p) => ({ ...p, [sym]: null }));
    }
    try {
      const r = await fetch(`/api/terminal/atr/${encodeURIComponent(sym)}`);
      const a = r.ok ? ((await r.json()) as AtrData) : null;
      setAtrs((p) => ({ ...p, [sym]: a }));
    } catch {
      setAtrs((p) => ({ ...p, [sym]: null }));
    }
  }, []);

  const load = useCallback(async () => {
    const wl = watchlistRef.current;
    if (!wl.length) return;
    try {
      const results = await Promise.all(
        wl.map((s) =>
          fetch(`/api/terminal/orb/${encodeURIComponent(s)}`)
            .then((r) => r.json() as Promise<OrbData>)
            .catch(() => null)
        )
      );
      const good = results.filter((d): d is OrbData => !!d && !d.error && !!d.symbol);
      if (!good.length) {
        setRows((prev) => {
          if (!prev.length) setOffline(true);
          return prev; // keep last good data
        });
        return;
      }
      // alert on status transitions into BREAKOUT / BREAKDOWN
      for (const d of good) {
        const prev = prevStatusRef.current[d.symbol];
        if (prev && prev !== d.status && (d.status === 'BREAKOUT' || d.status === 'BREAKDOWN')) {
          onAlertRef.current(d.symbol, d.status, d.status === 'BREAKOUT' ? d.orbHigh : d.orbLow);
        }
        prevStatusRef.current[d.symbol] = d.status;
      }
      setRows(good);
      setOffline(false);
      setUpdated('updated ' + new Date().toLocaleTimeString());
      // pivots + ATR for expanded rows (cached, fail-soft)
      good.filter((d) => expandedRef.current.has(d.symbol)).forEach((d) => fetchPivotAtr(d.symbol));
    } catch {
      setRows((prev) => {
        if (!prev.length) setOffline(true);
        return prev;
      });
    }
  }, [fetchPivotAtr]);

  // 30s poll — also reruns when watchlist or manual levels change
  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load, watchlist, refreshKey]);

  const toggle = (sym: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(sym)) next.delete(sym);
      else {
        next.add(sym);
        fetchPivotAtr(sym);
      }
      return next;
    });
  };

  return (
    <Panel icon={Icons.range} title={<>ORB &mdash; OPENING RANGE (9:30&ndash;9:45)</>} sub={updated} noScroll>
      {rows.length ? (
        <table className="dbt-table">
          <tbody>
            <tr>
              <th>SYM</th>
              <th>LAST</th>
              <th>ORB HIGH</th>
              <th>ORB MID</th>
              <th>ORB LOW</th>
              <th>STATUS</th>
            </tr>
            {rows.map((d) => {
              const mid = orbMidOf(d);
              return (
                <React.Fragment key={d.symbol}>
                  <tr className="dbt-clickable" onClick={() => toggle(d.symbol)}>
                    <td style={{ color: T.amber, fontWeight: 700 }}>{d.symbol}</td>
                    <td>{fmt(d.last)}</td>
                    <td className="up">{fmt(d.orbHigh)}</td>
                    <td style={{ color: T.amber }}>{fmt(mid)}</td>
                    <td className="down">{fmt(d.orbLow)}</td>
                    <td>
                      <StatusBadge status={d.status} />
                    </td>
                  </tr>
                  {expanded.has(d.symbol) && (
                    <tr>
                      <td colSpan={6} style={{ padding: 0 }}>
                        <Detail d={d} pivots={pivots[d.symbol] ?? null} atr={atrs[d.symbol] ?? null} visible={visible} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      ) : offline ? (
        <Offline label="ORB DATA UNAVAILABLE" />
      ) : (
        <Loading label="Loading ORB data..." />
      )}
    </Panel>
  );
}
