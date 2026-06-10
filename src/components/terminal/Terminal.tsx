'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import EconomicCalendar from '@/components/markets/EconomicCalendar';
import type { TerminalSettings } from './types';
import { T, fmt } from './shared';
import TapeStrip from './TapeStrip';
import IdeasPanel from './IdeasPanel';
import OrbPanel from './OrbPanel';
import PositionCalcPanel from './PositionCalcPanel';
import WatchlistPanel from './WatchlistPanel';
import SectorsPanel from './SectorsPanel';
import PullbacksPanel from './PullbacksPanel';
import OptionsPanel from './OptionsPanel';
import NewsPanel from './NewsPanel';
import EarningsPanel from './EarningsPanel';
import GexPanel from './GexPanel';
import JournalPanel from './JournalPanel';
import AxecapTab from './AxecapTab';
import RadarPanel from './RadarPanel';
import IpoPanel from './IpoPanel';

const TABS = ['TRADE', 'SCAN', 'INTEL', 'JOURNAL', 'AXECAP', 'RADAR'] as const;
const TAB_COUNT = TABS.length;

interface Toast {
  id: number;
  msg: string;
  dir: 'BREAKOUT' | 'BREAKDOWN';
}

// Scoped terminal stylesheet — brand tokens (void/carbon/graphite + electric amber), JetBrains Mono,
// dense uppercase 10-11px letter-spaced labels, tabular numbers. Matches the local DB Terminal reference.
const CSS = `
.dbt { background: ${T.bg}; color: ${T.text}; font-family: ${T.mono}; font-size: 13px; font-variant-numeric: tabular-nums; min-height: 100vh; }
.dbt * { box-sizing: border-box; }
.dbt .up { color: ${T.green}; } .dbt .down { color: ${T.red}; } .dbt .flat { color: ${T.dim}; }

.dbt-topbar { position: sticky; top: 0; z-index: 50; background: #0A0A0A; }
.dbt-header { display: flex; align-items: center; gap: 16px; padding: 10px 16px; border-bottom: 1px solid ${T.border}; background: #0A0A0A; }
.dbt-logo { color: ${T.amber}; font-weight: 700; font-size: 16px; letter-spacing: 2px; white-space: nowrap; display: flex; align-items: center; gap: 8px; }
.dbt-logo svg { width: 18px; height: 18px; }
.dbt-clock { margin-left: auto; color: ${T.dim}; white-space: nowrap; }
.dbt-mkt-state { padding: 2px 8px; border: 1px solid ${T.border}; border-radius: 3px; font-size: 11px; color: ${T.dim}; }
.dbt-mkt-state.open { color: ${T.green}; border-color: ${T.green}; }

.dbt-tape { display: flex; gap: 0; overflow-x: auto; border-bottom: 1px solid ${T.border}; background: #0A0A0A; }
.dbt-tape-item { padding: 8px 18px; border-right: 1px solid ${T.border}; white-space: nowrap; min-width: 130px; }
.dbt-tape-sym { color: ${T.dim}; font-size: 11px; letter-spacing: 1px; }
.dbt-tape-px { font-size: 16px; font-weight: 700; margin: 2px 0; }
.dbt-tape-chg { font-size: 12px; }

.dbt-tabs { display: flex; gap: 2px; background: #0A0A0A; border-bottom: 1px solid ${T.border}; padding: 0 10px; }
.dbt-tab { display: flex; align-items: center; gap: 7px; background: none; border: none; border-bottom: 2px solid transparent; border-radius: 0; color: ${T.dim}; padding: 9px 14px 7px; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; cursor: pointer; font-family: ${T.mono}; }
.dbt-tab .fkey { border: 1px solid ${T.border}; border-radius: 3px; padding: 1px 5px; font-size: 9px; letter-spacing: 1px; color: ${T.dim}; background: ${T.panel}; }
.dbt-tab:hover { color: ${T.text}; background: rgba(245,158,11,.04); }
.dbt-tab.active { color: ${T.amber}; border-bottom-color: ${T.amber}; }
.dbt-tab.active .fkey { color: ${T.amber}; border-color: rgba(245,158,11,.5); }

.dbt-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 10px; }
.dbt-grid-trade { display: grid; grid-template-columns: 1.4fr 1fr; gap: 10px; padding: 10px; }
.dbt-grid-intel { display: grid; grid-template-columns: 1.15fr 1fr 0.9fr; gap: 10px; padding: 10px; }
@media (max-width: 1280px) { .dbt-grid-intel { grid-template-columns: 1fr 1fr; } }
@media (max-width: 900px) { .dbt-grid2, .dbt-grid-trade, .dbt-grid-intel { grid-template-columns: 1fr; } }
.dbt-col { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.dbt-section-pad { padding: 10px; }

.dbt-panel { background: ${T.panel}; border: 1px solid ${T.border}; border-radius: 6px; overflow: hidden; }
.dbt-panel-head { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid ${T.border}; background: ${T.head}; }
.dbt-title { color: ${T.amber}; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; }
.dbt-sub { color: ${T.dim}; font-size: 10px; margin-left: auto; }
.dbt-panel-body { padding: 8px 12px; }
.dbt-panel-body::-webkit-scrollbar { width: 6px; }
.dbt-panel-body::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }

.dbt-table { width: 100%; border-collapse: collapse; }
.dbt-table th { text-align: right; color: ${T.dim}; font-size: 10px; font-weight: 400; letter-spacing: 1px; padding: 4px 6px; border-bottom: 1px solid ${T.border}; }
.dbt-table th:first-child, .dbt-table td:first-child { text-align: left; }
.dbt-table td { text-align: right; padding: 5px 6px; border-bottom: 1px solid ${T.rowBorder}; font-size: 12px; }
.dbt-table tr:hover td { background: #141414; }
.dbt-clickable { cursor: pointer; }

.dbt-badge { display: inline-block; padding: 1px 7px; border-radius: 3px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; }
.dbt-badge.b-breakout, .dbt-badge.b-long, .dbt-badge.b-conf-high { background: rgba(16,185,129,.15); color: ${T.green}; border: 1px solid rgba(16,185,129,.4); }
.dbt-badge.b-breakdown, .dbt-badge.b-short { background: rgba(239,68,68,.15); color: ${T.red}; border: 1px solid rgba(239,68,68,.4); }
.dbt-badge.b-inside, .dbt-badge.b-conf-med, .dbt-badge.b-unusual { background: rgba(245,158,11,.12); color: ${T.amber}; border: 1px solid rgba(245,158,11,.35); }
.dbt-badge.b-neutral { background: rgba(107,118,134,.12); color: ${T.dim}; border: 1px solid ${T.border}; }
.dbt-badge.b-pullback, .dbt-badge.b-play { background: rgba(59,130,246,.13); color: ${T.blue}; border: 1px solid rgba(59,130,246,.4); }

.dbt-orb-detail { background: ${T.inset}; border: 1px solid ${T.border}; border-radius: 4px; margin: 4px 0 10px; padding: 8px 10px; font-size: 11px; }
.dbt-lvl-row { display: flex; justify-content: space-between; padding: 2px 0; }
.dbt-lvl-row > span:first-child { color: ${T.dim}; }
.dbt-lvl-sep { border-top: 1px dashed ${T.border}; margin: 5px 0 3px; }
.dbt-spark { display: block; width: 100%; height: 80px; margin-bottom: 6px; }

.dbt-rs-bar { display: inline-block; height: 8px; border-radius: 2px; vertical-align: middle; }
.dbt-lag-tag { font-size: 9px; letter-spacing: 1px; padding: 1px 5px; border-radius: 2px; margin-left: 6px; }
.dbt-lag-tag.lag { background: rgba(239,68,68,.12); color: ${T.red}; }
.dbt-lag-tag.lead { background: rgba(16,185,129,.12); color: ${T.green}; }

.dbt-news-item { padding: 6px 0; border-bottom: 1px solid ${T.rowBorder}; }
.dbt-news-item a { color: ${T.text}; text-decoration: none; font-size: 12px; line-height: 1.4; }
.dbt-news-item a:hover { color: ${T.amber}; }
.dbt-news-meta { color: ${T.dim}; font-size: 10px; margin-top: 2px; }
.dbt-news-meta .src { color: ${T.blue}; }

.dbt input, .dbt button, .dbt textarea, .dbt select { font-family: ${T.mono}; font-size: 12px; background: ${T.inset}; color: ${T.text}; border: 1px solid ${T.border}; border-radius: 4px; padding: 6px 8px; }
.dbt input:focus, .dbt textarea:focus, .dbt select:focus { outline: none; border-color: ${T.amber}; }
.dbt button { cursor: pointer; color: ${T.amber}; border-color: rgba(245,158,11,.4); }
.dbt button:hover { background: rgba(245,158,11,.1); }
.dbt-row-flex { display: flex; gap: 6px; margin-bottom: 8px; }
.dbt-row-flex input { flex: 1; min-width: 0; }
.dbt-hint { color: ${T.dim}; font-size: 10px; line-height: 1.5; margin-top: 6px; }
.dbt-loading { color: ${T.dim}; padding: 12px 0; font-size: 11px; }
.dbt-sec-lbl { color: ${T.dim}; font-size: 10px; letter-spacing: 1.5px; margin: 8px 0 4px; }

.dbt-offline { display: flex; align-items: center; gap: 10px; padding: 18px 4px; color: ${T.dim}; opacity: .65; font-size: 11px; letter-spacing: 1px; }
.dbt-offline-dash { font-size: 18px; }

.dbt-ideas-wrap { display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 8px; }
.dbt-idea-card { background: ${T.inset}; border: 1px solid ${T.border}; border-radius: 5px; padding: 9px 11px; }
.dbt-idea-top { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
.dbt-idea-sym { color: ${T.amber}; font-weight: 700; font-size: 15px; letter-spacing: 1px; }
.dbt-idea-rr { margin-left: auto; color: ${T.text}; font-size: 11px; }
.dbt-idea-nums { display: flex; gap: 14px; flex-wrap: wrap; margin: 7px 0 5px; border-top: 1px solid ${T.rowBorder}; border-bottom: 1px solid ${T.rowBorder}; padding: 6px 0; }
.dbt-cell .lbl { display: block; color: ${T.dim}; font-size: 9px; letter-spacing: 1px; }
.dbt-cell .val { font-size: 13px; font-weight: 700; }
.dbt-idea-size { color: ${T.text}; font-size: 11px; letter-spacing: .5px; margin-bottom: 5px; }
.dbt-idea-size b { color: ${T.amber}; }
.dbt-idea-reasons { list-style: none; margin: 0; padding: 0; }
.dbt-idea-reasons li { position: relative; padding-left: 12px; color: ${T.dim}; font-size: 11px; line-height: 1.5; }
.dbt-idea-reasons li::before { content: ""; position: absolute; left: 0; top: 7px; width: 5px; height: 2px; background: ${T.amber}; }

.dbt-opt-read { display: flex; align-items: center; gap: 8px; margin: 6px 0; flex-wrap: wrap; }
.dbt-opt-reason { color: ${T.dim}; font-size: 11px; line-height: 1.5; margin-bottom: 6px; }
.dbt-opt-em { display: flex; align-items: baseline; gap: 10px; background: ${T.inset}; border: 1px solid ${T.border}; border-radius: 4px; padding: 8px 12px; margin-bottom: 8px; }
.dbt-opt-em .big { font-size: 22px; font-weight: 700; color: ${T.amber}; }
.dbt-opt-em .lbl { color: ${T.dim}; font-size: 10px; letter-spacing: 1px; }
.dbt-opt-stats { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 8px; }
.dbt-walls { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
.dbt-wall-col { background: ${T.inset}; border: 1px solid ${T.border}; border-radius: 4px; padding: 6px 8px; }
.dbt-wall-col .wlbl { font-size: 9px; letter-spacing: 1px; margin-bottom: 4px; }
.dbt-wall-row { display: flex; justify-content: space-between; font-size: 11px; padding: 2px 0; }
.dbt-wall-row .oi { color: ${T.dim}; }

.dbt-calc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px; }
.dbt-calc-grid label { display: flex; flex-direction: column; gap: 3px; color: ${T.dim}; font-size: 9px; letter-spacing: 1px; }
.dbt-calc-out { background: ${T.inset}; border: 1px solid ${T.border}; border-radius: 4px; padding: 8px 10px; font-size: 12px; }
.dbt-chk-row { display: flex; align-items: center; gap: 8px; margin: 8px 0; color: ${T.dim}; font-size: 11px; letter-spacing: 1px; cursor: pointer; }
.dbt-chk-row input { accent-color: ${T.amber}; cursor: pointer; }

.dbt-jstats { display: flex; gap: 0; flex-wrap: wrap; border: 1px solid ${T.border}; border-radius: 4px; background: ${T.inset}; margin-bottom: 10px; }
.dbt-jstat { flex: 1; min-width: 90px; padding: 8px 12px; border-right: 1px solid ${T.border}; }
.dbt-jstat:last-child { border-right: none; }
.dbt-jstat .lbl { color: ${T.dim}; font-size: 9px; letter-spacing: 1px; }
.dbt-jstat .val { font-size: 16px; font-weight: 700; margin-top: 2px; }
.dbt-jform { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
.dbt-jform input, .dbt-jform select { min-width: 70px; }
.dbt-jform input.wide { flex: 1; min-width: 140px; }
.dbt-del-btn { background: none !important; border: 1px solid transparent !important; color: ${T.dim} !important; padding: 1px 4px !important; line-height: 0; }
.dbt-del-btn:hover { color: ${T.red} !important; border-color: rgba(239,68,68,.4) !important; background: rgba(239,68,68,.08) !important; }

.dbt-toasts { position: fixed; top: 14px; right: 14px; z-index: 100; display: flex; flex-direction: column; gap: 8px; max-width: 340px; }
.dbt-toast { display: flex; align-items: center; gap: 10px; background: ${T.head}; border: 1px solid ${T.amber}; border-left: 3px solid ${T.amber}; border-radius: 4px; padding: 10px 14px; font-size: 12px; font-weight: 700; letter-spacing: .5px; box-shadow: 0 4px 18px rgba(0,0,0,.6); cursor: pointer; animation: dbt-toast-in .18s ease-out; }
.dbt-toast svg { width: 16px; height: 16px; flex-shrink: 0; }
@keyframes dbt-toast-in { from { transform: translateX(24px); opacity: 0; } to { transform: none; opacity: 1; } }
`;

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export default function Terminal() {
  const [activeTab, setActiveTab] = useState(0);
  const [clock, setClock] = useState('--:--:-- ET');
  const [mktState, setMktState] = useState('--');
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [settings, setSettings] = useState<TerminalSettings>({ accountSize: 25000, riskPct: 1, soundAlerts: true });
  const [settingsSub, setSettingsSub] = useState('');
  const [orbRefresh, setOrbRefresh] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const audioRef = useRef<AudioContext | null>(null);
  const toastIdRef = useRef(0);
  const watchlistLoadedRef = useRef(false);

  // ---------- clock (ET, 1s tick) ----------
  useEffect(() => {
    const tick = () => {
      const et = new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false });
      setClock(et + ' ET');
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // ---------- watchlist (retry until loaded) ----------
  useEffect(() => {
    const load = async () => {
      if (watchlistLoadedRef.current) return;
      try {
        const r = await fetch('/api/terminal/watchlist');
        if (!r.ok) throw new Error('watchlist');
        const list = (await r.json()) as string[];
        if (Array.isArray(list) && list.length) {
          watchlistLoadedRef.current = true;
          setWatchlist(list);
        }
      } catch {}
    };
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  // ---------- settings ----------
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/terminal/settings');
        if (!r.ok) throw new Error('settings');
        const s = (await r.json()) as Partial<TerminalSettings>;
        if (s && typeof s.accountSize === 'number') {
          setSettings({ accountSize: s.accountSize, riskPct: s.riskPct ?? 1, soundAlerts: s.soundAlerts !== false });
          setSettingsSub('synced');
        }
      } catch {
        setSettingsSub('local only');
      }
    })();
  }, []);

  const saveSettings = useCallback(async (s: TerminalSettings) => {
    setSettings(s);
    try {
      const r = await fetch('/api/terminal/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s),
      });
      setSettingsSub(r.ok ? 'saved ' + new Date().toLocaleTimeString() : 'save failed (kept locally)');
    } catch {
      setSettingsSub('save failed (kept locally)');
    }
  }, []);

  // ---------- alerts: audio + toast + notification ----------
  // AudioContext is created on the first user gesture (browser autoplay policy)
  useEffect(() => {
    const initUserGesture = () => {
      try {
        if (!audioRef.current) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (AC) audioRef.current = new AC();
        }
        if (audioRef.current && audioRef.current.state === 'suspended') {
          audioRef.current.resume().catch(() => {});
        }
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
          Notification.requestPermission().catch(() => {});
        }
      } catch {}
    };
    document.addEventListener('click', initUserGesture);
    document.addEventListener('keydown', initUserGesture);
    return () => {
      document.removeEventListener('click', initUserGesture);
      document.removeEventListener('keydown', initUserGesture);
    };
  }, []);

  const beep = useCallback((dir: 'BREAKOUT' | 'BREAKDOWN') => {
    const ctx = audioRef.current;
    if (!ctx || ctx.state !== 'running') return;
    try {
      const t = ctx.currentTime;
      const tones = dir === 'BREAKOUT' ? [660, 990] : [990, 660]; // rising = breakout, falling = breakdown
      tones.forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = f;
        o.connect(g);
        g.connect(ctx.destination);
        const s = t + i * 0.15;
        g.gain.setValueAtTime(0.0001, s);
        g.gain.linearRampToValueAtTime(0.25, s + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, s + 0.14);
        o.start(s);
        o.stop(s + 0.16);
      });
    } catch {}
  }, []);

  const showToast = useCallback((msg: string, dir: 'BREAKOUT' | 'BREAKDOWN') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, msg, dir }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 8000);
  }, []);

  const orbAlert = useCallback(
    (sym: string, dir: 'BREAKOUT' | 'BREAKDOWN', price: number | null) => {
      const msg = `${sym} BROKE ORB ${dir === 'BREAKOUT' ? 'HIGH' : 'LOW'} ${fmt(price)}`;
      showToast(msg, dir);
      if (settingsRef.current.soundAlerts) beep(dir);
      try {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('DB TERMINAL', { body: msg, tag: 'orb-' + sym });
        }
      } catch {}
    },
    [showToast, beep]
  );

  // ---------- keyboard: F1-F6 and 1-6 switch tabs ----------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const fkeys: Record<string, number> = { F1: 0, F2: 1, F3: 2, F4: 3, F5: 4, F6: 5 };
      if (e.key in fkeys) {
        e.preventDefault();
        setActiveTab(fkeys[e.key]);
        return;
      }
      const t = e.target as HTMLElement | null;
      const typing =
        !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if (!typing && /^[1-6]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setActiveTab(Number(e.key) - 1);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const mktLabel =
    mktState === 'REGULAR'
      ? 'MARKET OPEN'
      : mktState === 'PRE'
        ? 'PRE-MARKET'
        : mktState === 'POST' || mktState === 'POSTPOST'
          ? 'AFTER HOURS'
          : mktState === '--'
            ? '--'
            : 'CLOSED';

  const secStyle = (i: number): React.CSSProperties => ({ display: activeTab === i ? 'block' : 'none' });

  return (
    <div className="dbt">
      <style>{CSS}</style>

      {/* sticky top: header + tape + function-key tabs */}
      <div className="dbt-topbar">
        <header className="dbt-header">
          <div className="dbt-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 17l5-6 4 3 6-8" />
              <path d="M21 21H3V3" />
            </svg>
            DB TERMINAL
          </div>
          <span className={`dbt-mkt-state${mktState === 'REGULAR' ? ' open' : ''}`}>{mktLabel}</span>
          <span className="dbt-clock">{clock}</span>
        </header>

        <TapeStrip onMarketState={setMktState} />

        <nav className="dbt-tabs">
          {TABS.map((label, i) => (
            <button key={label} className={`dbt-tab${activeTab === i ? ' active' : ''}`} onClick={() => setActiveTab(i)}>
              <span className="fkey">F{i + 1}</span>
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* in-app toasts (top-right, 8s) */}
      <div className="dbt-toasts">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="dbt-toast"
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
          >
            {t.dir === 'BREAKOUT' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2">
                <path d="M12 19V5" />
                <path d="M5 12l7-7 7 7" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke={T.red} strokeWidth="2">
                <path d="M12 5v14" />
                <path d="M19 12l-7 7-7-7" />
              </svg>
            )}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>

      {/* ============ F1 TRADE ============ */}
      {/* All sections stay mounted so every poll loop keeps running regardless of active tab */}
      <section style={secStyle(0)}>
        <div className="dbt-section-pad" style={{ paddingBottom: 0 }}>
          <IdeasPanel settings={settings} />
        </div>
        <div className="dbt-grid-trade">
          <div className="dbt-col">
            <OrbPanel watchlist={watchlist} visible={activeTab === 0} refreshKey={orbRefresh} onAlert={orbAlert} />
          </div>
          <div className="dbt-col">
            <PositionCalcPanel settings={settings} settingsSub={settingsSub} onSave={saveSettings} />
            <WatchlistPanel
              watchlist={watchlist}
              onWatchlistSaved={(list) => {
                watchlistLoadedRef.current = true;
                setWatchlist(list);
              }}
              onLevelsSaved={() => setOrbRefresh((n) => n + 1)}
            />
          </div>
        </div>
      </section>

      {/* ============ F2 SCAN ============ */}
      <section style={secStyle(1)}>
        <div className="dbt-grid2">
          <SectorsPanel />
          <PullbacksPanel />
        </div>
      </section>

      {/* ============ F3 INTEL ============ */}
      <section style={secStyle(2)}>
        <div className="dbt-grid-intel">
          <div className="dbt-col">
            <OptionsPanel />
          </div>
          <div className="dbt-col">
            <NewsPanel />
          </div>
          <div className="dbt-col">
            <EarningsPanel watchlist={watchlist} />
          </div>
        </div>
        {/* Site intel folded in: SPY GEX levels + economic calendar */}
        <div className="dbt-grid2" style={{ paddingTop: 0 }}>
          <GexPanel />
          <div style={{ minWidth: 0 }}>
            <EconomicCalendar />
          </div>
        </div>
      </section>

      {/* ============ F4 JOURNAL ============ */}
      <section style={secStyle(3)}>
        <div className="dbt-section-pad">
          <JournalPanel />
        </div>
      </section>

      {/* ============ F5 AXECAP ============ */}
      <section style={secStyle(4)}>
        <AxecapTab />
      </section>

      {/* ============ F6 RADAR ============ */}
      <section style={secStyle(5)}>
        <div className="dbt-grid-trade">
          <div className="dbt-col">
            <RadarPanel />
          </div>
          <div className="dbt-col">
            <IpoPanel />
          </div>
        </div>
      </section>
    </div>
  );
}
