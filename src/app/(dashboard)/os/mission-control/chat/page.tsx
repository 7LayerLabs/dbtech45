'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Send } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  status: string;
}

interface Message {
  id: string;
  from_user: boolean;
  message: string;
  created_at: string;
  read: boolean;
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

export default function ChatPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    if (selectedAgent) {
      fetchMessages(selectedAgent.id);
      subscribeToMessages(selectedAgent.id);
    }
  }, [selectedAgent]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function fetchAgents() {
    try {
      const res = await fetch('/api/mission-control/agents');
      const data = await res.json();
      setAgents(data);
      if (data.length > 0) {
        setSelectedAgent(data[0]);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages(agentId: string) {
    try {
      const res = await fetch(`/api/mission-control/chat?agent_id=${agentId}`);
      const data = await res.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }

  function subscribeToMessages(agentId: string) {
    const channel = supabase
      .channel(`chat-${agentId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chat_messages',
        filter: `agent_id=eq.${agentId}`
      }, () => {
        fetchMessages(agentId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async function sendMessage() {
    if (!input.trim() || !selectedAgent || sending) return;

    setSending(true);
    try {
      const res = await fetch('/api/mission-control/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: selectedAgent.id,
          from_user: true,
          message: input
        })
      });
      
      if (!res.ok) {
        const error = await res.json();
        console.error('Send failed:', error);
        alert(`Failed to send: ${error.error || 'Unknown error'}`);
        return;
      }
      
      setInput('');
      fetchMessages(selectedAgent.id);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Network error - check console');
    } finally {
      setSending(false);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  if (loading) {
    return (
      <div style={{ padding: '60px 30px', textAlign: 'center', color: colors.smoke }}>
        <div style={{ fontSize: '18px', fontWeight: 600, color: colors.amber }}>Loading chat...</div>
      </div>
    );
  }

  const card: React.CSSProperties = {
    background: colors.carbon,
    border: `1px solid ${colors.border}`,
    borderRadius: '12px',
  };

  return (
    <div style={{ padding: '20px 30px', height: 'calc(100vh - 40px)' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '28px', fontWeight: 700, color: colors.white, fontFamily: "'Space Grotesk', system-ui, sans-serif", textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          Chat
        </div>
        <div style={{ color: colors.smoke, marginTop: '4px' }}>
          Message your agents directly
        </div>
      </div>

      {/* Chat Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', height: 'calc(100% - 100px)' }}>
        {/* Agent List */}
        <div style={{ ...card, padding: '16px', overflowY: 'auto' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: colors.silver, marginBottom: '12px', textTransform: 'uppercase' }}>
            Agents
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {agents.map((agent) => (
              <div
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                style={{
                  padding: '12px',
                  background: selectedAgent?.id === agent.id ? colors.graphite : 'transparent',
                  border: `1px solid ${selectedAgent?.id === agent.id ? colors.amber : colors.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  if (selectedAgent?.id !== agent.id) {
                    e.currentTarget.style.background = colors.graphite;
                  }
                }}
                onMouseLeave={e => {
                  if (selectedAgent?.id !== agent.id) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: colors.white }}>{agent.name}</span>
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: agent.status === 'online' ? colors.success : colors.silver 
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        {selectedAgent ? (
          <div style={{ ...card, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Chat Header */}
            <div style={{ 
              padding: '16px 20px', 
              borderBottom: `1px solid ${colors.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: colors.white }}>{selectedAgent.name}</div>
                <div style={{ fontSize: '12px', color: colors.smoke, marginTop: '2px', textTransform: 'capitalize' }}>
                  {selectedAgent.status}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: colors.smoke, padding: '60px 0' }}>
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      justifyContent: msg.from_user ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{
                      maxWidth: '70%',
                      padding: '12px 16px',
                      background: msg.from_user ? colors.amber : colors.graphite,
                      color: msg.from_user ? colors.white : colors.white,
                      borderRadius: '12px',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}>
                      {msg.message}
                      <div style={{ 
                        fontSize: '11px', 
                        color: msg.from_user ? 'rgba(255,255,255,0.7)' : colors.silver,
                        marginTop: '6px'
                      }}>
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '16px 20px', borderTop: `1px solid ${colors.border}` }}>
              <form 
                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                style={{ display: 'flex', gap: '12px' }}
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Message ${selectedAgent.name}...`}
                  disabled={sending}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: colors.graphite,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    color: colors.white,
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = colors.amber}
                  onBlur={(e) => e.currentTarget.style.borderColor = colors.border}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  style={{
                    padding: '12px 24px',
                    background: input.trim() && !sending ? colors.amber : colors.graphite,
                    border: 'none',
                    borderRadius: '8px',
                    color: colors.white,
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: input.trim() && !sending ? 1 : 0.5
                  }}
                >
                  <Send size={16} />
                  Send
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ textAlign: 'center', color: colors.smoke }}>
              Select an agent to start chatting
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
