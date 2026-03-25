import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/mission-control/tasks - List tasks (with filters)
export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  
  const status = searchParams.get('status');
  const assigned_to = searchParams.get('assigned_to');
  const priority = searchParams.get('priority');
  
  let query = supabase
    .from('tasks')
    .select(`
      *,
      agent:agents(name, emoji)
    `)
    .order('created_at', { ascending: false });
  
  if (status) query = query.eq('status', status);
  if (assigned_to) query = query.eq('assigned_to', assigned_to);
  if (priority) query = query.eq('priority', priority);
  
  const { data: tasks, error } = await query;
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(tasks);
}

// POST /api/mission-control/tasks - Create task
export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  
  const { title, description, status, priority, assigned_to, created_by } = body;
  
  if (!title) {
    return NextResponse.json({ error: 'Task title required' }, { status: 400 });
  }
  
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title,
      description,
      status: status || 'inbox',
      priority: priority || 'medium',
      assigned_to,
      created_by: created_by || 'Derek'
    })
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // Log activity
  await supabase.from('activities').insert({
    task_id: data.id,
    action: 'task_created',
    note: `Task "${title}" created`
  });
  
  return NextResponse.json(data);
}

// PATCH /api/mission-control/tasks/:id - Update task
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  
  const { id, title, description, status, priority, assigned_to } = body;
  
  if (!id) {
    return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
  }
  
  const updates: any = { updated_at: new Date().toISOString() };
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (status !== undefined) updates.status = status;
  if (priority !== undefined) updates.priority = priority;
  if (assigned_to !== undefined) updates.assigned_to = assigned_to;
  
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // Log activity
  if (status) {
    await supabase.from('activities').insert({
      task_id: id,
      agent_id: assigned_to,
      action: 'status_changed',
      note: `Task status changed to ${status}`
    });
  }
  
  return NextResponse.json(data);
}

// DELETE /api/mission-control/tasks/:id - Delete task
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
  }
  
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}
