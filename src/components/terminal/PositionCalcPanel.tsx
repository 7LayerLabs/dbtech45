'use client';
import { useEffect, useState } from 'react';
import type { TerminalSettings } from './types';
import { Panel, Icons, fmt, fmt0, T } from './shared';

interface Props {
  settings: TerminalSettings;
  settingsSub: string;
  onSave: (s: TerminalSettings) => void;
}

// Position size calculator + account settings (account size, risk %, sound alerts)
export default function PositionCalcPanel({ settings, settingsSub, onSave }: Props) {
  const [account, setAccount] = useState(String(settings.accountSize));
  const [risk, setRisk] = useState(String(settings.riskPct));
  const [sound, setSound] = useState(settings.soundAlerts);
  const [ticker, setTicker] = useState('');
  const [entry, setEntry] = useState('');
  const [stop, setStop] = useState('');

  // sync form when settings arrive from the server
  useEffect(() => {
    setAccount(String(settings.accountSize));
    setRisk(String(settings.riskPct));
    setSound(settings.soundAlerts);
  }, [settings]);

  const entryN = parseFloat(entry);
  const stopN = parseFloat(stop);
  const acctN = parseFloat(account) || settings.accountSize;
  const riskN = parseFloat(risk) || settings.riskPct;

  let calcOut: React.ReactNode = <span style={{ color: T.dim }}>Enter entry + stop to size a position.</span>;
  if (isFinite(entryN) && isFinite(stopN) && entryN !== stopN) {
    const perShare = Math.abs(entryN - stopN);
    const budget = (acctN * riskN) / 100;
    const shares = Math.floor(budget / perShare);
    const actualRisk = shares * perShare;
    const tick = ticker.trim().toUpperCase() || 'POSITION';
    calcOut =
      shares > 0 ? (
        <span>
          {tick}: <b style={{ color: T.amber, fontSize: 15 }}>{fmt0(shares)} SHARES</b>&nbsp; risks{' '}
          <span className="down">${fmt(actualRisk)}</span>{' '}
          <span style={{ color: T.dim }}>
            (budget ${fmt(budget)} &middot; ${fmt(perShare)}/sh)
          </span>
        </span>
      ) : (
        <span>
          <span className="down">Stop too wide</span>{' '}
          <span style={{ color: T.dim }}>
            &mdash; ${fmt(perShare)}/sh exceeds ${fmt(budget)} budget
          </span>
        </span>
      );
  }

  const save = () => {
    onSave({
      accountSize: parseFloat(account) || 25000,
      riskPct: parseFloat(risk) || 1,
      soundAlerts: sound,
    });
  };

  return (
    <Panel icon={Icons.calc} title={<>POSITION SIZE &amp; SETTINGS</>} sub={settingsSub}>
      <div className="dbt-calc-grid">
        <label>
          ACCOUNT SIZE $
          <input type="number" min={0} step={100} value={account} onChange={(e) => setAccount(e.target.value)} />
        </label>
        <label>
          RISK PER TRADE %
          <input type="number" min={0} step={0.25} value={risk} onChange={(e) => setRisk(e.target.value)} />
        </label>
      </div>
      <label className="dbt-chk-row">
        <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} /> SOUND ALERTS ON ORB BREAK
      </label>
      <div className="dbt-row-flex" style={{ marginBottom: 12 }}>
        <button onClick={save} style={{ flex: 1 }}>
          SAVE SETTINGS
        </button>
      </div>
      <div className="dbt-sec-lbl">QUICK CALC</div>
      <div className="dbt-calc-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <label>
          TICKER
          <input placeholder="SPY" value={ticker} onChange={(e) => setTicker(e.target.value)} />
        </label>
        <label>
          ENTRY
          <input type="number" step={0.01} placeholder="736.70" value={entry} onChange={(e) => setEntry(e.target.value)} />
        </label>
        <label>
          STOP
          <input type="number" step={0.01} placeholder="731.40" value={stop} onChange={(e) => setStop(e.target.value)} />
        </label>
      </div>
      <div className="dbt-calc-out">{calcOut}</div>
      <div className="dbt-hint">
        Shares = floor(account &times; risk% / |entry &minus; stop|). Risk budget caps the loss if your stop is hit.
      </div>
    </Panel>
  );
}
