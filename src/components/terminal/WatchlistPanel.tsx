'use client';
import { useCallback, useEffect, useState } from 'react';
import type { ManualLevel } from './types';
import { Panel, Icons, T } from './shared';

interface Props {
  watchlist: string[];
  onWatchlistSaved: (symbols: string[]) => void;
  onLevelsSaved: () => void;
}

// Watchlist editor + manual price levels editor (levels appear in ORB detail + sparkline)
export default function WatchlistPanel({ watchlist, onWatchlistSaved, onLevelsSaved }: Props) {
  const [watchInput, setWatchInput] = useState('');
  const [lvlSymbol, setLvlSymbol] = useState('');
  const [lvlInput, setLvlInput] = useState('');
  const [levels, setLevels] = useState<Record<string, ManualLevel[]>>({});
  const [levelsLoaded, setLevelsLoaded] = useState(false);

  useEffect(() => {
    setWatchInput(watchlist.join(', '));
  }, [watchlist]);

  const loadLevels = useCallback(async () => {
    try {
      const r = await fetch('/api/terminal/levels');
      if (!r.ok) throw new Error('levels');
      const all = (await r.json()) as Record<string, ManualLevel[]>;
      setLevels(all || {});
      setLevelsLoaded(true);
    } catch {}
  }, []);

  useEffect(() => {
    loadLevels();
  }, [loadLevels]);

  const saveWatchlist = async () => {
    try {
      const symbols = watchInput
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
      const r = await fetch('/api/terminal/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols }),
      });
      if (!r.ok) throw new Error('watchlist');
      const saved = (await r.json()) as string[];
      onWatchlistSaved(Array.isArray(saved) ? saved : symbols);
      loadLevels();
    } catch {}
  };

  const saveLevels = async () => {
    try {
      const symbol = lvlSymbol.trim().toUpperCase();
      if (!symbol) return;
      const parsed = lvlInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((part) => {
          const m = part.match(/^([\d.]+)\s*(.*)$/);
          return m ? { price: parseFloat(m[1]), note: m[2] || '' } : null;
        })
        .filter((x): x is ManualLevel & { note: string } => !!x);
      await fetch('/api/terminal/levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, levels: parsed }),
      });
      setLvlInput('');
      loadLevels();
      onLevelsSaved();
    } catch {}
  };

  const syms = Object.keys(levels);

  return (
    <Panel icon={Icons.list} title={<>WATCHLIST &amp; MY LEVELS</>}>
      <div className="dbt-row-flex">
        <input
          placeholder="SPY, QQQ, NVDA, TSLA..."
          value={watchInput}
          onChange={(e) => setWatchInput(e.target.value)}
        />
        <button onClick={saveWatchlist}>SAVE LIST</button>
      </div>
      <div className="dbt-row-flex">
        <input
          placeholder="Ticker"
          style={{ flex: '0 0 80px' }}
          value={lvlSymbol}
          onChange={(e) => setLvlSymbol(e.target.value)}
        />
        <input
          placeholder="Levels: 601.5 support, 605 resistance, 610"
          value={lvlInput}
          onChange={(e) => setLvlInput(e.target.value)}
        />
        <button onClick={saveLevels}>SAVE</button>
      </div>
      <div className="dbt-hint">
        Levels format: price + optional note, comma separated. They appear inside each ticker&apos;s ORB detail and on
        its chart. Save an empty line to clear a ticker&apos;s levels.
      </div>
      <div style={{ marginTop: 8 }}>
        {syms.length ? (
          syms.map((s) => (
            <div key={s} style={{ padding: '3px 0', fontSize: 11 }}>
              <span style={{ color: T.amber, fontWeight: 700 }}>{s}</span> &mdash;{' '}
              {(levels[s] || []).map((l, i) => (
                <span key={i}>
                  {i > 0 && ', '}
                  <span style={{ color: T.blue }}>{l.price}</span>
                  {l.note ? <span style={{ color: T.dim }}> {l.note}</span> : null}
                </span>
              ))}
            </div>
          ))
        ) : (
          <div className="dbt-hint">{levelsLoaded ? 'No manual levels saved yet.' : 'Loading levels...'}</div>
        )}
      </div>
    </Panel>
  );
}
