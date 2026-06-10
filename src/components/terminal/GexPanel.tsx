'use client';
import { useCallback, useEffect, useState } from 'react';
import GexLevels from '@/components/markets/GexLevels';
import { Panel, Icons, Offline, Loading } from './shared';

interface OptionContract {
  strike: number;
  last: number;
  change: number;
  changePercent: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  vwap: number;
  high: number;
  low: number;
  ticker: string;
}

interface ChainData {
  symbol: string;
  expDate: string;
  currentPrice: number;
  calls: OptionContract[];
  puts: OptionContract[];
  expirations: string[];
}

// GEX dealer-gamma levels — wraps the site's existing GexLevels component.
// Wired the same way the old markets page did: SPY chain from /api/options-data?type=chain.
export default function GexPanel() {
  const [data, setData] = useState<ChainData | null>(null);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/options-data?type=chain&symbol=SPY', { signal: AbortSignal.timeout(12000) });
      if (!r.ok) throw new Error('chain');
      const d = (await r.json()) as ChainData;
      if (!d || !Array.isArray(d.calls) || !Array.isArray(d.puts)) throw new Error('bad');
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

  return (
    <Panel icon={Icons.layers} title="GEX LEVELS — SPY" sub="dealer gamma exposure" noScroll>
      {data ? (
        <GexLevels symbol="SPY" currentPrice={data.currentPrice} calls={data.calls} puts={data.puts} />
      ) : offline ? (
        <Offline label="OPTIONS CHAIN UNAVAILABLE — RETRYING" />
      ) : (
        <Loading label="Loading SPY chain for GEX..." />
      )}
    </Panel>
  );
}
