import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST /api/mission-control/webhook - Agent sends a reply
export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  
  const { agent_name, message } = body;
  
  if (!agent_name || !message) {
    return NextResponse.json({ error: 'agent_name and message required' }, { status: 400 });
  }

  // Find agent by name
  const { data: agent } = await supabase
    .from('agents')
    .select('id')
    .eq('name', agent_name)
    .single();

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  // Insert agent's reply
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      agent_id: agent.id,
      from_user: false,
      message,
      read: false
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
