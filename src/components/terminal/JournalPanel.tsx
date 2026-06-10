'use client';
import { useCallback, useEffect, useState } from 'react';
import type { JournalData } from './types';
import { Panel, Icons, Offline, Loading, fmt, fmt0, cls, sign, T } from './shared';

// Trade journal — stats strip, add form, delete. Polls every 5 min.
export default function JournalPanel() {
  const [data, setData] = useState<JournalData | null>(null);
  const [offline, setOffline] = useState(false);
  const [msg, setMsg] = useState<{ text: string; bad: boolean } | null>(null);
  const [sym, setSym] = useState('');
  const [side, setSide] = useState('LONG');
  const [setup, setSetup] = useState('ORB');
  const [entry, setEntry] = useState('');
  const [exit, setExit] = useState('');
  const [size, setSize] = useState('');
  const [stop, setStop] = useState('');
  const [notes, setNotes] = useState('');

  const flash = (text: string, bad = false) => {
    setMsg({ text, bad });
    setTimeout(() => setMsg(null), 5000);
  };

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/terminal/journal');
      if (!r.ok) throw new Error('journal');
      const d = (await r.json()) as JournalData;
      if (!d || !d.stats) throw new Error('bad');
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

  const addTrade = async () => {
    const body: Record<string, unknown> = {
      symbol: sym.trim().toUpperCase(),
      side,
      setup,
      entry: parseFloat(entry),
      exit: parseFloat(exit),
      size: parseInt(size, 10),
      notes: notes.trim(),
    };
    const stopN = parseFloat(stop);
    if (isFinite(stopN)) body.stop = stopN;
    if (!body.symbol || !isFinite(body.entry as number) || !isFinite(body.exit as number) || !isFinite(body.size as number)) {
      flash('Need symbol, entry, exit, and size.', true);
      return;
    }
    try {
      const r = await fetch('/api/terminal/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error('post');
      setSym(''); setEntry(''); setExit(''); setSize(''); setStop(''); setNotes('');
      flash('Trade logged.');
      load();
    } catch {
      flash('Save failed — journal service offline.', true);
    }
  };

  const deleteTrade = async (id: string) => {
    try {
      const r = await fetch(`/api/terminal/journal/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('del');
      load();
    } catch {
      flash('Delete failed — journal service offline.', true);
    }
  };

  const s = data?.stats;
  const trades = (data?.trades || []).slice().sort((a, b) => (b.date || 0) - (a.date || 0));
  const pnlCls = s && s.totalPnl != null ? (s.totalPnl > 0 ? 'up' : s.totalPnl < 0 ? 'down' : 'flat') : 'flat';

  return (
    <Panel
      icon={Icons.journal}
      title="TRADE JOURNAL"
      sub={data ? `${s?.totalTrades || 0} trades logged` : offline ? 'offline' : ''}
      noScroll
    >
      {data && s ? (
        <div className="dbt-jstats">
          <div className="dbt-jstat">
            <div className="lbl">WIN RATE</div>
            <div className={`val ${(s.winRate ?? 0) >= 50 ? 'up' : 'down'}`}>
              {s.winRate != null ? fmt(s.winRate) + '%' : '--'}
            </div>
          </div>
          <div className="dbt-jstat">
            <div className="lbl">TOTAL P&amp;L</div>
            <div className={`val ${pnlCls}`}>{s.totalPnl != null ? sign(s.totalPnl) + '$' + fmt(s.totalPnl) : '--'}</div>
          </div>
          <div className="dbt-jstat">
            <div className="lbl">PROFIT FACTOR</div>
            <div className="val">{s.profitFactor != null ? fmt(s.profitFactor) : '--'}</div>
          </div>
          <div className="dbt-jstat">
            <div className="lbl">AVG R</div>
            <div className={`val ${cls(s.avgR)}`}>{s.avgR != null ? sign(s.avgR) + fmt(s.avgR) : '--'}</div>
          </div>
          <div className="dbt-jstat">
            <div className="lbl">TRADES</div>
            <div className="val">
              {fmt0(s.totalTrades)}{' '}
              <span style={{ fontSize: 11, color: T.dim }}>
                {fmt0(s.wins)}W / {fmt0(s.losses)}L
              </span>
            </div>
          </div>
          <div className="dbt-jstat">
            <div className="lbl">AVG WIN / LOSS</div>
            <div className="val" style={{ fontSize: 13 }}>
              <span className="up">${fmt(s.avgWin)}</span> <span style={{ color: T.dim }}>/</span>{' '}
              <span className="down">${fmt(Math.abs(s.avgLoss ?? 0))}</span>
            </div>
          </div>
          <div className="dbt-jstat">
            <div className="lbl">BEST / WORST</div>
            <div className="val" style={{ fontSize: 13 }}>
              <span className="up">${fmt(s.bestTrade)}</span> <span style={{ color: T.dim }}>/</span>{' '}
              <span className="down">${fmt(s.worstTrade)}</span>
            </div>
          </div>
        </div>
      ) : offline ? (
        <Offline label="JOURNAL SERVICE OFFLINE — RETRYING" />
      ) : (
        <Loading label="Loading stats..." />
      )}

      <div className="dbt-sec-lbl">LOG A TRADE</div>
      <div className="dbt-jform">
        <input placeholder="SYMBOL" style={{ flex: '0 0 86px' }} value={sym} onChange={(e) => setSym(e.target.value)} />
        <select value={side} onChange={(e) => setSide(e.target.value)}>
          <option value="LONG">LONG</option>
          <option value="SHORT">SHORT</option>
        </select>
        <select value={setup} onChange={(e) => setSetup(e.target.value)}>
          <option value="ORB">ORB</option>
          <option value="PULLBACK">PULLBACK</option>
          <option value="LEVELS">LEVELS</option>
          <option value="OTHER">OTHER</option>
        </select>
        <input type="number" step={0.01} placeholder="ENTRY" style={{ flex: '0 0 90px' }} value={entry} onChange={(e) => setEntry(e.target.value)} />
        <input type="number" step={0.01} placeholder="EXIT" style={{ flex: '0 0 90px' }} value={exit} onChange={(e) => setExit(e.target.value)} />
        <input type="number" step={1} placeholder="SIZE" style={{ flex: '0 0 70px' }} value={size} onChange={(e) => setSize(e.target.value)} />
        <input type="number" step={0.01} placeholder="STOP (OPT)" style={{ flex: '0 0 100px' }} value={stop} onChange={(e) => setStop(e.target.value)} />
        <input className="wide" placeholder="NOTES" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <button onClick={addTrade}>ADD TRADE</button>
      </div>
      {msg && (
        <div className="dbt-hint" style={{ color: msg.bad ? T.red : T.dim, marginBottom: 8 }}>
          {msg.text}
        </div>
      )}

      {data ? (
        trades.length ? (
          <table className="dbt-table">
            <tbody>
              <tr>
                <th>DATE</th>
                <th style={{ textAlign: 'left' }}>SYM</th>
                <th>SIDE</th>
                <th>SETUP</th>
                <th>ENTRY</th>
                <th>EXIT</th>
                <th>SIZE</th>
                <th>P&amp;L</th>
                <th>R</th>
                <th style={{ textAlign: 'left' }}>NOTES</th>
                <th></th>
              </tr>
              {trades.map((t) => (
                <tr key={t.id}>
                  <td style={{ textAlign: 'left', color: T.dim }}>
                    {t.date ? new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '--'}
                  </td>
                  <td style={{ color: T.amber, fontWeight: 700 }}>{t.symbol}</td>
                  <td className={t.side === 'SHORT' ? 'down' : 'up'}>{t.side}</td>
                  <td style={{ color: T.dim }}>{t.setup || '--'}</td>
                  <td>{fmt(t.entry)}</td>
                  <td>{fmt(t.exit)}</td>
                  <td>{fmt0(t.size)}</td>
                  <td className={cls(t.pnl)} style={{ fontWeight: 700 }}>
                    {t.pnl != null ? sign(t.pnl) + '$' + fmt(t.pnl) : '--'}
                  </td>
                  <td className={cls(t.rMultiple)}>{t.rMultiple != null ? sign(t.rMultiple) + fmt(t.rMultiple) : '--'}</td>
                  <td
                    style={{
                      textAlign: 'left',
                      color: T.dim,
                      maxWidth: 220,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t.notes || ''}
                  </td>
                  <td>
                    <button className="dbt-del-btn" title="Delete trade" onClick={() => deleteTrade(t.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 10, height: 10 }}>
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Loading label="No trades logged yet. Add your first one above." />
        )
      ) : null}
    </Panel>
  );
}
