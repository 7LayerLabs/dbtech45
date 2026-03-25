import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/mission-control/chat?agent_id=xxx - Get messages for an agent
export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agent_id');
  const limit = parseInt(searchParams.get('limit') || '50');

  if (!agentId) {
    return NextResponse.json({ error: 'agent_id required' }, { status: 400 });
  }

  const { data: messages, error } = await supabase
    .from('chat_messages')
    .select(`
      *,
      agent:agents(name, emoji)
    `)
    .eq('agent_id', agentId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(messages);
}

// POST /api/mission-control/chat - Send a message to an agent
export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  
  const { agent_id, from_user, message } = body;
  
  if (!agent_id || !message) {
    return NextResponse.json({ error: 'agent_id and message required' }, { status: 400 });
  }

  // Get agent details
  const { data: agent } = await supabase
    .from('agents')
    .select('name')
    .eq('id', agent_id)
    .single();

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      agent_id,
      from_user: from_user || true,
      message,
      read: false
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log activity
  await supabase.from('activities').insert({
    agent_id,
    action: 'message_received',
    note: `New message: ${message.substring(0, 50)}...`
  });

  // Notify agent via OpenClaw gateway
  // This triggers the agent to check Mission Control and respond
  try {
    await fetch('http://localhost:18789/rpc/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent: agent?.name?.toLowerCase(),
        message: `[Mission Control] Derek: ${message}`
      })
    });
  } catch (err) {
    console.error('Failed to notify agent via gateway:', err);
    // Don't fail the request if notification fails
  }

  return NextResponse.json(data);
}

// PATCH /api/mission-control/chat - Mark messages as read
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  
  const { agent_id } = body;
  
  if (!agent_id) {
    return NextResponse.json({ error: 'agent_id required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('chat_messages')
    .update({ read: true })
    .eq('agent_id', agent_id)
    .eq('read', false);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
