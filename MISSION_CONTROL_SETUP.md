# Mission Control Setup Instructions

**Status:** Phase 1 (MVP) code complete! 🎉  
**Time:** Built in 1 hour  
**Next:** Run database migration

---

## Step 1: Run Database Migration

1. Go to https://supabase.com/dashboard/project/hnkjhhabebzmcwwhhfeu
2. Click **"SQL Editor"** in left sidebar
3. Click **"New query"**
4. Copy the SQL from `supabase/migrations/20260321_mission_control.sql`
5. Paste into editor
6. Click **"Run"** (bottom right)
7. Wait for success message

**What this does:**
- Creates 4 tables (agents, tasks, activities, token_usage)
- Sets up indexes for performance
- Enables Row Level Security (RLS)
- Enables Realtime subscriptions
- Seeds your 8 agents (Milo, Paula, Bobby, Jim, Remy, Dwight, Wendy, Anders)

---

## Step 2: Test Locally

```bash
cd C:\Users\derek\OneDrive\Desktop\MILO\projects\dbtech45
npm run dev
```

Open: http://localhost:3000/os/mission-control

**You should see:**
- Dashboard with 8 agents (all offline)
- Quick links to Agents, Task Board, Activity Feed
- Stats: 8 total agents, 0 active tasks

---

## Step 3: Test API Routes

**Test agent heartbeat:**
```powershell
curl -X POST http://localhost:3000/api/mission-control/agents `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Anders\",\"status\":\"online\",\"model\":\"claude-sonnet-4-6\",\"emoji\":\"🔐\",\"role\":\"IT Director\"}'
```

**Expected:** Anders shows as "online" in dashboard

**Create a test task:**
```powershell
curl -X POST http://localhost:3000/api/mission-control/tasks `
  -H "Content-Type: application/json" `
  -d '{\"title\":\"Test Mission Control\",\"description\":\"First task!\",\"priority\":\"high\"}'
```

**Expected:** Task appears in Task Board → Inbox column

---

## Step 4: Deploy to Vercel

```bash
git add .
git commit -m "Add Mission Control (Phase 1)"
git push
```

Vercel will auto-deploy.

**Access at:** https://dbtech45.com/os/mission-control

---

## What You Built

### Pages Created (5 total):
1. `/os/mission-control` - Dashboard (stats + recent activity)
2. `/os/mission-control/agents` - Agent grid (8 agents with status)
3. `/os/mission-control/tasks` - Kanban board (5 columns)
4. `/os/mission-control/activity` - Activity feed (real-time log)
5. `/os/mission-control/tokens` - Cost tracking (coming soon)

### API Routes (4 endpoints):
- `GET/POST /api/mission-control/agents` - Register/list agents
- `GET/POST/PATCH/DELETE /api/mission-control/tasks` - Task CRUD
- `GET/POST /api/mission-control/activities` - Activity log
- `GET/POST /api/mission-control/tokens` - Token usage

### Database Tables:
- `agents` - 8 agents (Milo, Paula, Bobby, etc.)
- `tasks` - Task board (inbox → assigned → in_progress → in_review → done)
- `activities` - Activity feed (all agent actions logged)
- `token_usage` - Cost tracking per agent

---

## Next: Agent Integration

**To make agents poll Mission Control:**

Create `skills/mission-control-poll.sh` in each agent workspace:

```bash
#!/bin/bash

AGENT_NAME="Milo"  # Change per agent
API_URL="https://dbtech45.com/api/mission-control"

# Send heartbeat
curl -X POST "$API_URL/agents" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$AGENT_NAME\",\"status\":\"online\"}"

# Check for assigned tasks
tasks=$(curl -s "$API_URL/tasks?status=assigned&assigned_to=$AGENT_NAME")

if [ ! -z "$tasks" ]; then
  echo "Found tasks: $tasks"
  # Process tasks here
fi
```

**Run via OpenClaw heartbeat:**
```json
{
  "heartbeat": {
    "enabled": true,
    "intervalMs": 60000,
    "command": "bash ~/skills/mission-control-poll.sh"
  }
}
```

---

## Phase 2 Features (Coming Next)

**2-3 hours to add:**
- Chat interface (talk to agents from UI)
- Drag-and-drop Kanban (reorder tasks)
- Real-time notifications (toast alerts)
- Mobile-responsive improvements

**Phase 3 Features:**
- Trading dashboard (Bobby integration)
- Social media queue (Jim integration)
- Restaurant ops (Remy integration)

---

## Troubleshooting

**Problem:** "Table 'agents' does not exist"  
**Fix:** Run database migration (Step 1)

**Problem:** Can't access /os/mission-control  
**Fix:** Check file paths match: `src/app/(dashboard)/os/mission-control/page.tsx`

**Problem:** Agents showing as offline  
**Fix:** Agents need to send heartbeat via API (see Agent Integration above)

**Problem:** Supabase RLS blocking access  
**Fix:** Make sure you're logged in (Supabase Auth)

---

**Status:** Ready to test! Run the migration and let's see it live. 🚀
