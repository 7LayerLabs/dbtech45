'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { TapeItem } from './types';
import { fmt, cls, sign } from './shared';

// Market tape — polls /api/terminal/tape every 15s, reports SPY market state upward.
export default function TapeStrip({ onMarketState }: { onMarketState: (state: string) => void }) {
  const [items, setItems] = useState<TapeItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const onStateRef = useRef(onMarketState);
  onStateRef.current = onMarketState;

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/terminal/tape');
      if (!r.ok) throw new Error('tape');
      const data = (await r.json()) as TapeItem[];
      if (!Array.isArray(data)) return;
      setItems(data);
      setFailed(false);
      const state = data.find((d) => d.symbol === 'SPY')?.marketState || '--';
      onStateRef.current(state);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="dbt-tape">
      {items ? (
        items.map((d) => (
          <div className="dbt-tape-item" key={d.symbol}>
            <div className="dbt-tape-sym">{d.label}</div>
            <div className={`dbt-tape-px ${cls(d.changePct)}`}>{fmt(d.price)}</div>
            <div className={`dbt-tape-chg ${cls(d.changePct)}`}>
              {sign(d.change)}{fmt(d.change)} ({sign(d.changePct)}{fmt(d.changePct)}%)
            </div>
          </div>
        ))
      ) : (
        <div className="dbt-loading" style={{ padding: '10px 16px' }}>
          {failed ? 'Tape feed offline — retrying...' : 'Loading market tape...'}
        </div>
      )}
    </div>
  );
}
