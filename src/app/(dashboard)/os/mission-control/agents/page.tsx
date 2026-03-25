'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: string;
  model: string;
  last_heartbeat: string;
}

const colors = {
  carbon: '#111111',
  graphite: '#1A1A1A',
  amber: '#F59E0B',
  white: '#FFFFFF',
  silver: '#A3A3A3',
  smoke: '#737373',
  border: '#222222',
  success: '#10B981',
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchAgents();
    
    const channel = supabase
      .channel('agents-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, fetchAgents)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchAgents() {
    try {
      const res = await fetch('/api/mission-control/agents');
      const data = await res.json();
      setAgents(data);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '60px 30px', textAlign: 'center', color: colors.smoke }}>
        <div style={{ fontSize: '18px', fontWeight: 600, color: colors.amber }}>Loading agents...</div>
      </div>
    );
  }

  const onlineCount = agents.filter(a => a.status === 'online').length;
  const card: React.CSSProperties = {
    background: colors.carbon,
    border: `1px solid ${colors.border}`,
    borderRadius: '12px',
    padding: '20px',
  };

  return (
    <div style={{ padding: '20px 30px' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ fontSize: '28px', fontWeight: 700, color: colors.white, fontFamily: "'Space Grotesk', system-ui, sans-serif", textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          Agents
        </div>
        <div style={{ color: colors.smoke, marginTop: '4px' }}>
          {onlineCount} of {agents.length} agents online
        </div>
      </div>

      {/* Agents Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {agents.map((agent) => {
          const timeSince = agent.last_heartbeat
            ? Math.floor((Date.now() - new Date(agent.last_heartbeat).getTime()) / 1000 / 60)
            : null;

          return (
            <div key={agent.id} style={card}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: colors.white, marginBottom: '4px' }}>
                    {agent.name}
                  </div>
                  <div style={{ fontSize: '13px', color: colors.smoke }}>{agent.role}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: agent.status === 'online' ? colors.success : colors.silver 
                  }}></div>
                  <span style={{ fontSize: '12px', color: colors.silver, textTransform: 'capitalize' }}>
                    {agent.status}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {agent.model && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: colors.silver }}>Model</span>
                    <span style={{ color: colors.smoke, fontFamily: 'monospace', fontSize: '11px' }}>
                      {agent.model}
                    </span>
                  </div>
                )}
                {timeSince !== null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: colors.silver }}>Last seen</span>
                    <span style={{ color: colors.smoke }}>
                      {timeSince === 0 ? 'Just now' : 
                       timeSince < 60 ? `${timeSince}m ago` :
                       timeSince < 1440 ? `${Math.floor(timeSince / 60)}h ago` :
                       `${Math.floor(timeSince / 1440)}d ago`}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => router.push('/os/mission-control/chat')}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    background: colors.amber,
                    color: colors.white,
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Chat
                </button>
                <button style={{
                  padding: '8px 12px',
                  background: colors.graphite,
                  color: colors.silver,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}>
                  Details
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
