import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/mission-control/agents - List all agents
export async function GET() {
  const supabase = await createClient();
  
  const { data: agents, error } = await supabase
    .from('agents')
    .select('*')
    .order('name');
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(agents);
}

// POST /api/mission-control/agents - Register/update agent (heartbeat)
export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  
  const { name, status, model, emoji, role } = body;
  
  if (!name) {
    return NextResponse.json({ error: 'Agent name required' }, { status: 400 });
  }
  
  const { data, error } = await supabase
    .from('agents')
    .upsert({
      name,
      status: status || 'online',
      model,
      emoji,
      role,
      last_heartbeat: new Date().toISOString()
    }, { 
      onConflict: 'name',
      ignoreDuplicates: false 
    })
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // Log activity
  await supabase.from('activities').insert({
    agent_id: data.id,
    action: 'heartbeat',
    note: `Agent ${name} sent heartbeat`
  });
  
  return NextResponse.json(data);
}
