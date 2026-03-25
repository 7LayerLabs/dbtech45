'use client';

import { useEffect, useState } from 'react';

interface TokenUsage {
  id: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  created_at: string;
  agent: { name: string } | null;
}

interface TokenStats {
  usage: TokenUsage[];
  totals: {
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
  };
}

const colors = {
  carbon: '#111111',
  graphite: '#1A1A1A',
  amber: '#F59E0B',
  white: '#FFFFFF',
  silver: '#A3A3A3',
  smoke: '#737373',
  border: '#222222',
};

export default function TokensPage() {
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    fetchTokens();
  }, [days]);

  async function fetchTokens() {
    try {
      const res = await fetch(`/api/mission-control/tokens?days=${days}`);
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '60px 30px', textAlign: 'center', color: colors.smoke }}>
        <div style={{ fontSize: '18px', fontWeight: 600, color: colors.amber }}>Loading usage data...</div>
      </div>
    );
  }

  const formatNumber = (num: number) => num.toLocaleString();
  const formatCost = (cost: number) => `$${cost.toFixed(4)}`;

  const card: React.CSSProperties = {
    background: colors.carbon,
    border: `1px solid ${colors.border}`,
    borderRadius: '12px',
    padding: '20px',
  };

  return (
    <div style={{ padding: '20px 30px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
        <div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: colors.white, fontFamily: "'Space Grotesk', system-ui, sans-serif", textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
            Usage & Costs
          </div>
          <div style={{ color: colors.smoke, marginTop: '4px' }}>
            Track API spending across all agents
          </div>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          style={{
            padding: '8px 16px',
            background: colors.graphite,
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            color: colors.white,
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          <option value={1}>Last 24 hours</option>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={card}>
          <div style={{ fontSize: '13px', color: colors.silver, marginBottom: '8px', fontWeight: 500 }}>
            Input Tokens
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: colors.white }}>
            {formatNumber(stats?.totals.input_tokens || 0)}
          </div>
        </div>

        <div style={card}>
          <div style={{ fontSize: '13px', color: colors.silver, marginBottom: '8px', fontWeight: 500 }}>
            Output Tokens
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: colors.white }}>
            {formatNumber(stats?.totals.output_tokens || 0)}
          </div>
        </div>

        <div style={card}>
          <div style={{ fontSize: '13px', color: colors.silver, marginBottom: '8px', fontWeight: 500 }}>
            Total Cost
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: colors.amber }}>
            {formatCost(stats?.totals.cost_usd || 0)}
          </div>
        </div>
      </div>

      {/* Usage Table */}
      <div style={card}>
        <div style={{ fontSize: '18px', fontWeight: 600, color: colors.white, marginBottom: '20px' }}>
          Recent Usage
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: colors.silver }}>
                  Agent
                </th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: colors.silver }}>
                  Model
                </th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: colors.silver }}>
                  Input
                </th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: colors.silver }}>
                  Output
                </th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: colors.silver }}>
                  Cost
                </th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: colors.silver }}>
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {!stats || stats.usage.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '60px 16px', textAlign: 'center', color: colors.smoke }}>
                    No token usage data yet
                  </td>
                </tr>
              ) : (
                stats.usage.map((usage) => (
                  <tr key={usage.id} style={{ 
                    borderBottom: `1px solid ${colors.border}`,
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = colors.graphite}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px', color: colors.white, fontSize: '14px', fontWeight: 500 }}>
                      {usage.agent?.name || 'Unknown'}
                    </td>
                    <td style={{ padding: '12px 16px', color: colors.smoke, fontSize: '13px', fontFamily: 'monospace' }}>
                      {usage.model}
                    </td>
                    <td style={{ padding: '12px 16px', color: colors.white, fontSize: '14px', textAlign: 'right' }}>
                      {formatNumber(usage.input_tokens)}
                    </td>
                    <td style={{ padding: '12px 16px', color: colors.white, fontSize: '14px', textAlign: 'right' }}>
                      {formatNumber(usage.output_tokens)}
                    </td>
                    <td style={{ padding: '12px 16px', color: colors.amber, fontSize: '14px', fontWeight: 600, textAlign: 'right' }}>
                      {formatCost(usage.cost_usd)}
                    </td>
                    <td style={{ padding: '12px 16px', color: colors.silver, fontSize: '12px', textAlign: 'right' }}>
                      {new Date(usage.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
