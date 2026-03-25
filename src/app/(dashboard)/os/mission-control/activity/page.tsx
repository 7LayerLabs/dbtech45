'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Activity {
  id: string;
  action: string;
  note: string;
  created_at: string;
  agent: { name: string } | null;
  task: { title: string } | null;
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

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchActivities();
    
    const channel = supabase
      .channel('activities-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, fetchActivities)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchActivities() {
    try {
      const res = await fetch('/api/mission-control/activities?limit=100');
      const data = await res.json();
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '60px 30px', textAlign: 'center', color: colors.smoke }}>
        <div style={{ fontSize: '18px', fontWeight: 600, color: colors.amber }}>Loading activity...</div>
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
          Activity Feed
        </div>
        <div style={{ color: colors.smoke, marginTop: '4px' }}>
          Real-time event stream · {activities.length} events
        </div>
      </div>

      {/* Activity Stream */}
      <div style={card}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '800px', overflowY: 'auto' }}>
          {activities.length === 0 ? (
            <div style={{ textAlign: 'center', color: colors.smoke, padding: '60px 0' }}>No activity yet</div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} style={{
                background: colors.graphite,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                padding: '16px',
                transition: 'border-color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = colors.amber}
              onMouseLeave={e => e.currentTarget.style.borderColor = colors.border}>
                <div style={{ fontSize: '14px', color: colors.white, marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600 }}>{activity.agent?.name || 'System'}</span>
                  <span style={{ color: colors.smoke, marginLeft: '8px' }}>
                    {activity.action.replace(/_/g, ' ')}
                  </span>
                </div>
                {activity.task && (
                  <div style={{ fontSize: '13px', color: colors.amber, marginBottom: '6px' }}>
                    → {activity.task.title}
                  </div>
                )}
                {activity.note && (
                  <div style={{ fontSize: '13px', color: colors.smoke, marginBottom: '6px', lineHeight: '1.5' }}>
                    {activity.note}
                  </div>
                )}
                <div style={{ fontSize: '12px', color: colors.silver }}>
                  {formatTimestamp(activity.created_at)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return `${mins} minute${mins > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleString();
  }
}
