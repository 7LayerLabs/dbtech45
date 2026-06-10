'use client';
import { useCallback, useEffect, useState } from 'react';
import { Panel, Icons, Offline, Loading, fmt, cls, sign, T } from './shared';

// MY RADAR — persistent curiosity list: ticker + why it caught your eye,
// enriched with live price/change. Quotes refresh every 60s. IpoPanel can push
// symbols in and signals via the 'dbt-radar-changed' window event.

interface RadarItem {
  symbol: string;
  note: string;
  addedAt: number;
  price: number | null;
  change: number | null;
  changePct: number | null;
}

const fmtAdded = (ms: number): string =>
  ms > 0 ? new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '--';

export default function RadarPanel() {
  const [items, setItems] = useState<RadarItem[] | null>(null);
  const [offline, setOffline] = useState(false);
  const [sym, setSym] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/terminal/radar');
      if (!r.ok) throw new Error('radar');
      const d = (await r.json()) as { items?: RadarItem[] };
      if (!d || !Array.isArray(d.items)) throw new Error('bad');
      setItems(d.items);
      setOffline(false);
    } catch {
      setItems((prev) => {
        if (!prev) setOffline(true);
        return prev;
      });
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    const onChanged = () => load();
    window.addEventListener('dbt-radar-changed', onChanged);
    return () => {
      clearInterval(t);
      window.removeEventListener('dbt-radar-changed', onChanged);
    };
  }, [load]);

  const add = useCallback(async () => {
    const symbol = sym.toUpperCase().trim();
    if (!symbol || busy) return;
    setBusy(true);
    setErr('');
    try {
      const r = await fetch('/api/terminal/radar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, note: note.trim() }),
      });
      if (!r.ok) throw new Error('add');
      setSym('');
      setNote('');
      await load();
    } catch {
      setErr('ADD FAILED — RETRY');
    } finally {
      setBusy(false);
    }
  }, [sym, note, busy, load]);

  const remove = useCallback(
    async (symbol: string) => {
      try {
        await fetch('/api/terminal/radar', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol }),
        });
      } catch {}
      load();
    },
    [load]
  );

  return (
    <Panel icon={Icons.target} title="MY RADAR" sub="companies you're curious about — 60s quotes" maxHeight={620}>
      <form
        className="dbt-row-flex"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input
          value={sym}
          onChange={(e) => setSym(e.target.value.toUpperCase())}
          placeholder="TICKER"
          maxLength={12}
          style={{ flex: '0 0 90px', textTransform: 'uppercase' }}
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="why I'm intrigued..."
          maxLength={500}
        />
        <button type="submit" disabled={busy}>ADD</button>
      </form>
      {err && (
        <div className="dbt-hint" style={{ color: T.red, marginBottom: 6 }}>
          {err}
        </div>
      )}

      {items ? (
        items.length ? (
          <div>
            {items
              .slice()
              .sort((a, b) => b.addedAt - a.addedAt)
              .map((it) => (
                <div key={it.symbol} style={{ padding: '7px 0', borderBottom: `1px solid ${T.rowBorder}` }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                    <span style={{ color: T.amber, fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>
                      {it.symbol}
                    </span>
                    <span style={{ fontWeight: 700 }}>{fmt(it.price)}</span>
                    <span className={cls(it.changePct)} style={{ fontSize: 12 }}>
                      {it.changePct == null ? '--' : `${sign(it.changePct)}${fmt(it.changePct)}%`}
                    </span>
                    <span style={{ marginLeft: 'auto', color: T.dim, fontSize: 10, letterSpacing: 1 }}>
                      {fmtAdded(it.addedAt)}
                    </span>
                    <button
                      type="button"
                      className="dbt-del-btn"
                      title={`Remove ${it.symbol}`}
                      onClick={() => remove(it.symbol)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}>
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </div>
                  {it.note ? (
                    <div style={{ color: T.dim, fontStyle: 'italic', fontSize: 11, lineHeight: 1.5, marginTop: 2 }}>
                      {it.note}
                    </div>
                  ) : null}
                </div>
              ))}
          </div>
        ) : (
          <div className="dbt-hint" style={{ padding: '10px 0' }}>
            Companies you&apos;re curious about live here — add a ticker and why it caught your eye.
          </div>
        )
      ) : offline ? (
        <Offline label="RADAR UNAVAILABLE — RETRYING" />
      ) : (
        <Loading label="Loading radar..." />
      )}
    </Panel>
  );
}
