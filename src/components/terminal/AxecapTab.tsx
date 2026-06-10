'use client';
import { useState } from 'react';
import OvernightFlowMatrix from '@/components/axecap/OvernightFlowMatrix';
import InversionTripwires from '@/components/axecap/InversionTripwires';
import TrailingFloorMonitor from '@/components/axecap/TrailingFloorMonitor';
import MasterPlaybook from '@/components/axecap/MasterPlaybook';
import { T } from './shared';

const M = "'JetBrains Mono','Fira Code',monospace";

// F5 AXECAP — embeds the site's existing AxeCap components inside the terminal.
// Mirrors the old /ops/axecap page wiring: prop firm mode toggle + terminal/playbook sub-views.
export default function AxecapTab() {
  const [propFirmMode, setPropFirmMode] = useState(false);
  const [view, setView] = useState<'terminal' | 'playbook'>('terminal');

  return (
    <div style={{ padding: 10 }}>
      {/* Sub-header: prop firm toggle + view switch */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ color: T.amber, fontWeight: 700, fontSize: 13, letterSpacing: 1.5, fontFamily: M, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
              <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
            </svg>
            AXECAP COMMAND TERMINAL
          </div>
          <div style={{ color: T.dim, fontSize: 11, fontFamily: M, marginTop: 2 }}>
            Overnight Flow Algorithm v1.1 — Global Plumbing Decision Matrix
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Prop Firm Mode Toggle */}
          <div
            onClick={() => setPropFirmMode(!propFirmMode)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 8,
              cursor: 'pointer',
              background: propFirmMode ? 'rgba(139,92,246,0.15)' : 'rgba(113,113,122,0.1)',
              border: propFirmMode ? '1px solid rgba(139,92,246,0.4)' : `1px solid ${T.border}`,
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                width: 36,
                height: 20,
                borderRadius: 10,
                position: 'relative',
                background: propFirmMode ? '#8B5CF6' : '#333',
                transition: 'background 0.2s',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 2,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.2s',
                  left: propFirmMode ? 18 : 2,
                }}
              />
            </div>
            <span style={{ fontFamily: M, fontSize: 11, fontWeight: 700, color: propFirmMode ? '#8B5CF6' : T.dim }}>
              PROP FIRM MODE
            </span>
            {propFirmMode && (
              <span
                style={{
                  fontFamily: M,
                  fontSize: 10,
                  padding: '1px 6px',
                  borderRadius: 3,
                  background: 'rgba(139,92,246,0.2)',
                  color: '#8B5CF6',
                }}
              >
                APEX $50K
              </span>
            )}
          </div>

          {/* View switch */}
          <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: `1px solid ${T.border}` }}>
            {(['terminal', 'playbook'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: '8px 16px',
                  background: view === v ? 'rgba(245,158,11,0.15)' : 'transparent',
                  border: 'none',
                  borderRadius: 0,
                  color: view === v ? T.amber : T.dim,
                  fontFamily: M,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1,
                  cursor: 'pointer',
                  borderRight: v === 'terminal' ? `1px solid ${T.border}` : 'none',
                }}
              >
                {v === 'terminal' ? 'TERMINAL' : 'PLAYBOOK'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === 'terminal' ? (
        <>
          {/* 1. Overnight Flow Matrix — 5 tickers + confidence score + scenario detection */}
          <OvernightFlowMatrix />

          {/* 2. Inversion Tripwires — 9:30 AM opening prints for US10Y & DXY */}
          <InversionTripwires />

          {/* 3. Trailing Floor Monitor (Apex prop firm mode) */}
          <TrailingFloorMonitor propFirmMode={propFirmMode} />

          {/* Quick rules reference (ported from the old axecap page, emoji-free) */}
          <div
            style={{
              background: T.panel,
              border: `1px solid ${T.border}`,
              borderRadius: 6,
              padding: '14px 16px',
              marginBottom: 12,
            }}
          >
            <div style={{ color: T.amber, fontWeight: 700, fontSize: 11, fontFamily: M, letterSpacing: 1.5, marginBottom: 12 }}>
              QUICK RULES
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
              {[
                { label: 'TIME WINDOW', value: '9:45 AM — 11:30 AM', color: T.amber },
                { label: 'MAX RISK', value: propFirmMode ? '$250 / trade' : 'Defined by position', color: T.red },
                { label: 'INVERSION', value: 'Exit at market. No hope.', color: T.red },
                { label: 'NEWS LOCKOUT', value: '2 min before CPI/FOMC/NFP', color: '#EAB308' },
              ].map((r) => (
                <div
                  key={r.label}
                  style={{ padding: '10px 12px', background: T.inset, borderRadius: 4, border: `1px solid ${T.border}` }}
                >
                  <div style={{ fontSize: 9, color: r.color, fontWeight: 700, fontFamily: M, letterSpacing: 1, marginBottom: 4 }}>
                    {r.label}
                  </div>
                  <div style={{ fontFamily: M, fontSize: 11, color: '#A3A3A3' }}>{r.value}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <MasterPlaybook />
      )}
    </div>
  );
}
