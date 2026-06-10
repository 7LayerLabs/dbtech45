'use client';
import { useCallback, useEffect, useState } from 'react';
import { Panel, Icons, Offline, Loading, fmt, T } from './shared';

// IPO WATCH — upcoming + recently priced IPOs (Nasdaq calendar, massive secondary).
// Refreshes every 30 min. Recently-listed rows are clickable to push the symbol
// onto MY RADAR (signals RadarPanel via the 'dbt-radar-changed' window event).

interface UpcomingIpo {
  name: string | null;
  symbol: string | null;
  exchange: string | null;
  expectedDate: string | null;
  priceRange: string | null;
  sharesM: number | null;
  status: string | null;
}

interface RecentIpo {
  name: string | null;
  symbol: string | null;
  exchange: string | null;
  listedDate: string | null;
  price: number | null;
  status: string | null;
}

interface IposData {
  upcoming: UpcomingIpo[];
  recent: RecentIpo[];
  error?: string;
}

const fmtDate = (iso: string | null): string => {
  if (!iso) return '--';
  const t = Date.parse(iso + 'T12:00:00Z');
  return Number.isNaN(t)
    ? iso
    : new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
};

export default function IpoPanel() {
  const [data, setData] = useState<IposData | null>(null);
  const [offline, setOffline] = useState(false);
  const [added, setAdded] = useState('');

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/terminal/ipos');
      if (!r.ok) throw new Error('ipos');
      const d = (await r.json()) as IposData;
      if (!d || !Array.isArray(d.upcoming) || !Array.isArray(d.recent)) throw new Error('bad');
      if (d.error && !d.upcoming.length && !d.recent.length) throw new Error(d.error);
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
    const t = setInterval(load, 30 * 60000);
    return () => clearInterval(t);
  }, [load]);

  const addToRadar = useCallback(async (ipo: RecentIpo) => {
    if (!ipo.symbol) return;
    try {
      const note = `IPO${ipo.listedDate ? ` listed ${fmtDate(ipo.listedDate)}` : ''}${
        ipo.price != null ? ` at $${fmt(ipo.price)}` : ''
      }${ipo.name ? ` — ${ipo.name}` : ''}`;
      const r = await fetch('/api/terminal/radar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: ipo.symbol, note }),
      });
      if (!r.ok) throw new Error('add');
      window.dispatchEvent(new Event('dbt-radar-changed'));
      setAdded(ipo.symbol);
      setTimeout(() => setAdded(''), 4000);
    } catch {}
  }, []);

  return (
    <Panel
      icon={Icons.calendar}
      title="IPO WATCH"
      sub={added ? `${added} ADDED TO RADAR` : 'nasdaq calendar — 30 min refresh'}
      maxHeight={620}
    >
      {data ? (
        <>
          <div className="dbt-sec-lbl">IPO WATCH — UPCOMING</div>
          {data.upcoming.length ? (
            <table className="dbt-table">
              <tbody>
                <tr>
                  <th style={{ textAlign: 'left' }}>COMPANY</th>
                  <th>SYM</th>
                  <th>EXCHANGE</th>
                  <th>EXPECTED</th>
                  <th>PRICE RANGE</th>
                  <th>SHARES</th>
                </tr>
                {data.upcoming.map((u, i) => (
                  <tr key={(u.symbol || u.name || '') + i}>
                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.name || '--'}
                    </td>
                    <td style={{ color: T.amber, fontWeight: 700 }}>{u.symbol || '--'}</td>
                    <td style={{ color: T.dim }}>{u.exchange || '--'}</td>
                    <td>{fmtDate(u.expectedDate)}</td>
                    <td>{u.priceRange || '--'}</td>
                    <td>{u.sharesM != null ? `${fmt(u.sharesM)}M` : '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="dbt-hint">No upcoming IPOs on the calendar.</div>
          )}

          <div className="dbt-sec-lbl" style={{ marginTop: 12 }}>
            RECENTLY LISTED
          </div>
          {data.recent.length ? (
            <>
              <table className="dbt-table">
                <tbody>
                  <tr>
                    <th style={{ textAlign: 'left' }}>COMPANY</th>
                    <th>SYM</th>
                    <th>LISTED</th>
                    <th>IPO PRICE</th>
                    <th></th>
                  </tr>
                  {data.recent.map((r, i) => (
                    <tr
                      key={(r.symbol || r.name || '') + i}
                      className={r.symbol ? 'dbt-clickable' : undefined}
                      title={r.symbol ? `Add ${r.symbol} to MY RADAR` : undefined}
                      onClick={() => addToRadar(r)}
                    >
                      <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.name || '--'}
                      </td>
                      <td style={{ color: T.amber, fontWeight: 700 }}>{r.symbol || '--'}</td>
                      <td>{fmtDate(r.listedDate)}</td>
                      <td>{r.price != null ? fmt(r.price) : '--'}</td>
                      <td style={{ width: 26 }}>
                        {r.symbol ? (
                          <button
                            type="button"
                            style={{ background: 'none', border: '1px solid transparent', padding: '1px 4px', lineHeight: 0, color: T.amber }}
                            title={`Add ${r.symbol} to MY RADAR`}
                            onClick={(e) => {
                              e.stopPropagation();
                              addToRadar(r);
                            }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}>
                              <path d="M12 5v14M5 12h14" />
                            </svg>
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="dbt-hint">Click a recently listed row to add it to MY RADAR.</div>
            </>
          ) : (
            <div className="dbt-hint">No recently priced IPOs.</div>
          )}
        </>
      ) : offline ? (
        <Offline label="IPO CALENDAR UNAVAILABLE — RETRYING" />
      ) : (
        <Loading label="Loading IPO calendar..." />
      )}
    </Panel>
  );
}
