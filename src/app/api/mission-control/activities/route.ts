import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/mission-control/activities - List activities
export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  
  const agent_id = searchParams.get('agent_id');
  const limit = parseInt(searchParams.get('limit') || '50');
  
  let query = supabase
    .from('activities')
    .select(`
      *,
      agent:agents(name, emoji),
      task:tasks(title)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (agent_id) {
    query = query.eq('agent_id', agent_id);
  }
  
  const { data: activities, error } = await query;
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(activities);
}

// POST /api/mission-control/activities - Log activity
export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  
  const { agent_id, task_id, action, note } = body;
  
  if (!action) {
    return NextResponse.json({ error: 'Action required' }, { status: 400 });
  }
  
  const { data, error } = await supabase
    .from('activities')
    .insert({
      agent_id,
      task_id,
      action,
      note
    })
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}
