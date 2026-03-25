'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, X } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  created_at: string;
  agent?: { name: string };
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

const columns = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'assigned', label: 'Assigned' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'in_review', label: 'In Review' },
  { id: 'done', label: 'Done' }
];

export default function TaskBoardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTask, setShowNewTask] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchTasks();
    
    const channel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchTasks() {
    try {
      const res = await fetch('/api/mission-control/tasks');
      const data = await res.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createTask(title: string, description: string, priority: string) {
    try {
      await fetch('/api/mission-control/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, priority })
      });
      fetchTasks();
      setShowNewTask(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  }

  async function updateTaskStatus(taskId: string, newStatus: string) {
    try {
      await fetch('/api/mission-control/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status: newStatus })
      });
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '60px 30px', textAlign: 'center', color: colors.smoke }}>
        <div style={{ fontSize: '18px', fontWeight: 600, color: colors.amber }}>Loading tasks...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 30px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
        <div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: colors.white, fontFamily: "'Space Grotesk', system-ui, sans-serif", textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
            Task Board
          </div>
          <div style={{ color: colors.smoke, marginTop: '4px' }}>
            {tasks.length} tasks · {tasks.filter(t => t.status === 'in_progress').length} in progress
          </div>
        </div>
        <button
          onClick={() => setShowNewTask(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: colors.amber,
            color: colors.white,
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Plus size={18} />
          New Task
        </button>
      </div>

      {/* Kanban Board */}
      <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px' }}>
        {columns.map((column) => {
          const columnTasks = tasks.filter(t => t.status === column.id);
          
          return (
            <div key={column.id} style={{ minWidth: '300px', flex: '0 0 300px' }}>
              <div style={{ background: colors.carbon, border: `1px solid ${colors.border}`, borderRadius: '12px', overflow: 'hidden' }}>
                {/* Column Header */}
                <div style={{ background: colors.graphite, padding: '16px', borderBottom: `1px solid ${colors.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: colors.white, fontWeight: 600, fontSize: '14px' }}>{column.label}</span>
                    <span style={{ 
                      background: colors.amber, 
                      color: colors.white, 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      fontSize: '12px',
                      fontWeight: 600
                    }}>
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                {/* Tasks */}
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto' }}>
                  {columnTasks.length === 0 ? (
                    <div style={{ textAlign: 'center', color: colors.smoke, padding: '40px 0', fontSize: '13px' }}>
                      No tasks
                    </div>
                  ) : (
                    columnTasks.map((task) => {
                      const priorityColors = {
                        low: colors.silver,
                        medium: colors.amber,
                        high: '#EF4444'
                      };
                      const priorityColor = priorityColors[task.priority as keyof typeof priorityColors];

                      return (
                        <div key={task.id} style={{
                          background: colors.graphite,
                          border: `1px solid ${colors.border}`,
                          borderRadius: '8px',
                          padding: '12px',
                          cursor: 'pointer',
                          transition: 'border-color 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = colors.amber}
                        onMouseLeave={e => e.currentTarget.style.borderColor = colors.border}>
                          {/* Task Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px', gap: '8px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: colors.white, flex: 1 }}>
                              {task.title}
                            </div>
                            <div style={{ 
                              fontSize: '10px', 
                              fontWeight: 600, 
                              color: priorityColor,
                              textTransform: 'uppercase',
                              background: `${priorityColor}22`,
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              {task.priority}
                            </div>
                          </div>

                          {/* Description */}
                          {task.description && (
                            <div style={{ fontSize: '13px', color: colors.smoke, marginBottom: '8px', lineHeight: '1.4' }}>
                              {task.description.substring(0, 80)}{task.description.length > 80 ? '...' : ''}
                            </div>
                          )}

                          {/* Agent */}
                          {task.agent && (
                            <div style={{ fontSize: '12px', color: colors.silver, marginBottom: '8px' }}>
                              → {task.agent.name}
                            </div>
                          )}

                          {/* Status Selector */}
                          <select
                            value={task.status}
                            onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              background: colors.carbon,
                              border: `1px solid ${colors.border}`,
                              borderRadius: '6px',
                              color: colors.silver,
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="inbox">Inbox</option>
                            <option value="assigned">Assigned</option>
                            <option value="in_progress">In Progress</option>
                            <option value="in_review">In Review</option>
                            <option value="done">Done</option>
                          </select>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Task Modal */}
      {showNewTask && (
        <NewTaskModal onClose={() => setShowNewTask(false)} onCreate={createTask} />
      )}
    </div>
  );
}

function NewTaskModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (title: string, description: string, priority: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim()) {
      onCreate(title, description, priority);
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '20px'
    }}>
      <div style={{
        background: colors.carbon,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '24px',
        width: '100%',
        maxWidth: '500px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: colors.white }}>New Task</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.silver, cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: colors.silver, marginBottom: '6px', fontWeight: 500 }}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title..."
              autoFocus
              style={{
                width: '100%',
                padding: '10px 12px',
                background: colors.graphite,
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                color: colors.white,
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: colors.silver, marginBottom: '6px', fontWeight: 500 }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: colors.graphite,
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                color: colors.white,
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: colors.silver, marginBottom: '6px', fontWeight: 500 }}>
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: colors.graphite,
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                color: colors.white,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px',
                background: colors.graphite,
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                color: colors.silver,
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '10px',
                background: colors.amber,
                border: 'none',
                borderRadius: '6px',
                color: colors.white,
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
