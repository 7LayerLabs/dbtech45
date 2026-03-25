import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/mission-control/tokens - Get token usage stats
export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  
  const agent_id = searchParams.get('agent_id');
  const days = parseInt(searchParams.get('days') || '7');
  
  const since = new Date();
  since.setDate(since.getDate() - days);
  
  let query = supabase
    .from('token_usage')
    .select(`
      *,
      agent:agents(name, emoji)
    `)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false });
  
  if (agent_id) {
    query = query.eq('agent_id', agent_id);
  }
  
  const { data: usage, error } = await query;
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // Calculate totals
  const totals = {
    input_tokens: usage?.reduce((sum, u) => sum + u.input_tokens, 0) || 0,
    output_tokens: usage?.reduce((sum, u) => sum + u.output_tokens, 0) || 0,
    cost_usd: usage?.reduce((sum, u) => sum + parseFloat(u.cost_usd), 0) || 0
  };
  
  return NextResponse.json({ usage, totals });
}

// POST /api/mission-control/tokens - Log token usage
export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  
  const { agent_id, model, input_tokens, output_tokens, cost_usd } = body;
  
  if (!agent_id || !model) {
    return NextResponse.json({ error: 'agent_id and model required' }, { status: 400 });
  }
  
  const { data, error } = await supabase
    .from('token_usage')
    .insert({
      agent_id,
      model,
      input_tokens: input_tokens || 0,
      output_tokens: output_tokens || 0,
      cost_usd: cost_usd || 0
    })
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}
