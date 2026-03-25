'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Activity, Users, CheckSquare, TrendingUp } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  status: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
}

interface ActivityItem {
  id: string;
  action: string;
  note: string;
  created_at: string;
  agent: { name: string } | null;
}

const colors = {
  void: '#000000',
  carbon: '#111111',
  graphite: '#1A1A1A',
  amber: '#F59E0B',
  white: '#FFFFFF',
  silver: '#A3A3A3',
  smoke: '#737373',
  border: '#222222',
};

export default function MissionControlDashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchData();
    
    const channel = supabase
      .channel('mission-control-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchData() {
    try {
      const [agentsRes, tasksRes, activitiesRes] = await Promise.all([
        fetch('/api/mission-control/agents'),
        fetch('/api/mission-control/tasks'),
        fetch('/api/mission-control/activities?limit=10')
      ]);

      const [agentsData, tasksData, activitiesData] = await Promise.all([
        agentsRes.json(),
        tasksRes.json(),
        activitiesRes.json()
      ]);

      setAgents(agentsData);
      setTasks(tasksData);
      setActivities(activitiesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const stats = {
    totalAgents: agents.length,
    onlineAgents: agents.filter(a => a.status === 'online').length,
    activeTasks: tasks.filter(t => t.status === 'in_progress').length,
    completedToday: tasks.filter(t => t.status === 'done').length
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 30px', textAlign: 'center', color: colors.smoke }}>
        <div style={{ fontSize: '18px', fontWeight: 600, color: colors.amber }}>Loading Mission Control...</div>
      </div>
    );
  }

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
          Mission Control
        </div>
        <div style={{ color: colors.smoke, marginTop: '4px' }}>
          Coordinate your 8-agent swarm
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Users size={20} color={colors.amber} />
            <span style={{ color: colors.silver, fontSize: '14px' }}>Total Agents</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: colors.white }}>{stats.totalAgents}</div>
          <div style={{ color: colors.smoke, fontSize: '13px', marginTop: '4px' }}>{stats.onlineAgents} online</div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <CheckSquare size={20} color={colors.amber} />
            <span style={{ color: colors.silver, fontSize: '14px' }}>Active Tasks</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: colors.white }}>{stats.activeTasks}</div>
          <div style={{ color: colors.smoke, fontSize: '13px', marginTop: '4px' }}>in progress</div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <TrendingUp size={20} color={colors.amber} />
            <span style={{ color: colors.silver, fontSize: '14px' }}>Completed Today</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: colors.white }}>{stats.completedToday}</div>
          <div style={{ color: colors.smoke, fontSize: '13px', marginTop: '4px' }}>tasks finished</div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Activity size={20} color={colors.amber} />
            <span style={{ color: colors.silver, fontSize: '14px' }}>Recent Activity</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: colors.white }}>{activities.length}</div>
          <div style={{ color: colors.smoke, fontSize: '13px', marginTop: '4px' }}>last 10 actions</div>
        </div>
      </div>

      {/* Quick Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <Link href="/os/mission-control/agents" style={{ textDecoration: 'none' }}>
          <div style={{ ...card, cursor: 'pointer', transition: 'border-color 0.2s' }} 
               onMouseEnter={e => e.currentTarget.style.borderColor = colors.amber}
               onMouseLeave={e => e.currentTarget.style.borderColor = colors.border}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: colors.white, marginBottom: '8px' }}>Agents</div>
            <div style={{ color: colors.smoke, fontSize: '14px' }}>View and manage all agents</div>
          </div>
        </Link>

        <Link href="/os/mission-control/tasks" style={{ textDecoration: 'none' }}>
          <div style={{ ...card, cursor: 'pointer', transition: 'border-color 0.2s' }}
               onMouseEnter={e => e.currentTarget.style.borderColor = colors.amber}
               onMouseLeave={e => e.currentTarget.style.borderColor = colors.border}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: colors.white, marginBottom: '8px' }}>Task Board</div>
            <div style={{ color: colors.smoke, fontSize: '14px' }}>Kanban workflow management</div>
          </div>
        </Link>

        <Link href="/os/mission-control/activity" style={{ textDecoration: 'none' }}>
          <div style={{ ...card, cursor: 'pointer', transition: 'border-color 0.2s' }}
               onMouseEnter={e => e.currentTarget.style.borderColor = colors.amber}
               onMouseLeave={e => e.currentTarget.style.borderColor = colors.border}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: colors.white, marginBottom: '8px' }}>Activity Feed</div>
            <div style={{ color: colors.smoke, fontSize: '14px' }}>Real-time event stream</div>
          </div>
        </Link>

        <Link href="/os/mission-control/tokens" style={{ textDecoration: 'none' }}>
          <div style={{ ...card, cursor: 'pointer', transition: 'border-color 0.2s' }}
               onMouseEnter={e => e.currentTarget.style.borderColor = colors.amber}
               onMouseLeave={e => e.currentTarget.style.borderColor = colors.border}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: colors.white, marginBottom: '8px' }}>Usage & Costs</div>
            <div style={{ color: colors.smoke, fontSize: '14px' }}>Token tracking & analytics</div>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div style={card}>
        <div style={{ fontSize: '18px', fontWeight: 600, color: colors.white, marginBottom: '16px' }}>Recent Activity</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activities.length === 0 ? (
            <div style={{ textAlign: 'center', color: colors.smoke, padding: '40px 0' }}>No activity yet</div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} style={{ 
                background: colors.graphite, 
                border: `1px solid ${colors.border}`, 
                borderRadius: '8px', 
                padding: '12px' 
              }}>
                <div style={{ color: colors.white, fontSize: '14px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>{activity.agent?.name || 'System'}</span>
                  <span style={{ color: colors.smoke, marginLeft: '8px' }}>
                    {activity.action.replace(/_/g, ' ')}
                  </span>
                </div>
                {activity.note && (
                  <div style={{ color: colors.smoke, fontSize: '13px', marginBottom: '4px' }}>{activity.note}</div>
                )}
                <div style={{ color: colors.silver, fontSize: '12px' }}>
                  {new Date(activity.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
