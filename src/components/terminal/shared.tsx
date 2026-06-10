'use client';
import React from 'react';
import { brand } from '@/lib/brand';

// Terminal design tokens — mapped onto the site brand (void/carbon/graphite + electric amber)
export const T = {
  bg: brand.void,
  panel: brand.carbon,
  head: brand.graphite,
  inset: '#0C0C0C',
  border: brand.border,
  rowBorder: '#1B1B1B',
  amber: brand.amber,
  green: brand.success,
  red: brand.error,
  blue: brand.info,
  text: '#D7DDE6',
  dim: '#6B7686',
  mono: "'JetBrains Mono','Fira Code','Consolas',monospace",
} as const;

export const fmt = (n: unknown): string =>
  n == null || isNaN(Number(n))
    ? '--'
    : Number(n).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 });

export const fmt0 = (n: unknown): string =>
  n == null || isNaN(Number(n)) ? '--' : Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });

export const cls = (n: number | null | undefined): string =>
  n != null && n > 0 ? 'up' : n != null && n < 0 ? 'down' : 'flat';

export const sign = (n: number | null | undefined): string => (n != null && n > 0 ? '+' : '');

// Dim offline placeholder — panel stays mounted and keeps retrying
export function Offline({ label }: { label: string }) {
  return (
    <div className="dbt-offline">
      <span className="dbt-offline-dash">&mdash;</span>
      <span>{label}</span>
    </div>
  );
}

export function Loading({ label }: { label: string }) {
  return <div className="dbt-loading">{label}</div>;
}

// Status badge (ORB / options read / setups)
export function StatusBadge({ status }: { status: string }) {
  let variant = 'b-neutral';
  if (status === 'BREAKOUT' || status === 'CLOSED ABOVE' || status === 'BULLISH' || status === 'LONG') variant = 'b-breakout';
  else if (status === 'BREAKDOWN' || status === 'CLOSED BELOW' || status === 'BEARISH' || status === 'SHORT') variant = 'b-breakdown';
  else if (status === 'INSIDE' || status === 'CLOSED INSIDE' || status === 'FORMING' || status === 'NEUTRAL') variant = 'b-inside';
  else if (status === 'PULLBACK') variant = 'b-pullback';
  return <span className={`dbt-badge ${variant}`}>{status}</span>;
}

// Panel chrome: amber title + dim sub on right, scrollable body
export function Panel({
  icon,
  title,
  sub,
  children,
  maxHeight = 520,
  noScroll = false,
  headExtra,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  sub?: React.ReactNode;
  children: React.ReactNode;
  maxHeight?: number;
  noScroll?: boolean;
  headExtra?: React.ReactNode;
}) {
  return (
    <div className="dbt-panel">
      <div className="dbt-panel-head">
        {icon}
        <span className="dbt-title">{title}</span>
        {sub != null && <span className="dbt-sub">{sub}</span>}
      </div>
      {headExtra}
      <div
        className="dbt-panel-body"
        style={noScroll ? { maxHeight: 'none' } : { maxHeight, overflowY: 'auto' }}
      >
        {children}
      </div>
    </div>
  );
}

// Inline SVG icon set — stroke=currentColor, no emojis anywhere
const I = (path: React.ReactNode, color: string = T.amber) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={{ width: 14, height: 14, flexShrink: 0 }}>
    {path}
  </svg>
);

export const Icons = {
  chart: I(<><path d="M3 17l5-6 4 3 6-8" /><path d="M21 21H3V3" /></>),
  target: I(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2" /></>),
  range: I(<><rect x="3" y="8" width="18" height="8" rx="1" /><path d="M12 3v5M12 16v5" /></>),
  calc: I(<><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 7h8M8 11h3M13 11h3M8 15h3M13 15h3" /></>),
  list: I(<path d="M4 6h16M4 12h16M4 18h10" />),
  rotate: I(<><path d="M21 12a9 9 0 11-9-9" /><path d="M21 3v6h-6" /></>),
  trend: I(<><path d="M21 6l-7 7-4-4-7 7" /><path d="M14 6h7v7" /></>),
  options: I(<><path d="M12 3v18" /><path d="M5 8c0-2 1.5-3 3.5-3S12 6 12 8s-1.5 3-3.5 3H12" /><path d="M12 13h3.5c2 0 3.5 1 3.5 3s-1.5 3-3.5 3H12" /></>),
  news: I(<><path d="M4 4h16v16H4z" /><path d="M8 8h8M8 12h8M8 16h5" /></>),
  calendar: I(<><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 10h18" /></>),
  journal: I(<><path d="M4 4h13l3 3v13H4z" /><path d="M8 4v5h8V4" /><rect x="8" y="13" width="8" height="6" /></>),
  layers: I(<><path d="M12 2l9 5-9 5-9-5 9-5z" /><path d="M3 12l9 5 9-5" /><path d="M3 17l9 5 9-5" /></>),
  bolt: I(<path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />),
  arrowUp: (color: string) => I(<><path d="M12 19V5" /><path d="M5 12l7-7 7 7" /></>, color),
  arrowDown: (color: string) => I(<><path d="M12 5v14" /><path d="M19 12l-7 7-7-7" /></>, color),
  x: I(<path d="M6 6l12 12M18 6L6 18" />, 'currentColor'),
};
