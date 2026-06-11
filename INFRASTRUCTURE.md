# DBTech45 Infrastructure Reference

Shared reference for Milo, Anders, and all agents.

## Vercel
- **Team:** milos-projects-b55f88cf
- **Project:** dbtech45
- **Dashboard:** https://vercel.com/milos-projects-b55f88cf/dbtech45
- **Live URL:** https://dbtech45.vercel.app
- **Git Integration:** Auto-deploys from `master` branch

## GitHub
- **Org:** Milobuilds45
- **Repo:** https://github.com/Milobuilds45/dbtech45
- **Branch:** `master` (default)
- **Backup remote:** `backup` (same repo)

## Supabase
- **Org:** DBTech45
- **Project:** dbtech45-os
- **Project ID:** hnkjhhabebzmcwwhhfeu
- **URL:** https://hnkjhhabebzmcwwhhfeu.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/hnkjhhabebzmcwwhhfeu
- **Region:** us-west-2 (AWS)
- **Publishable Key:** sb_publishable_bSWy7hZPLEwilatHxnIzpw_re3uWe-V
- **Note (2026-06-11):** Repointed from dead project `ltoejmkktovxrsqtopeg` to new project above. Tables `calendar_tasks` + `todos` recreated; RLS verified for anon read/write.

## Database Tables
| Table | Purpose |
|-------|---------|
| ideas_vault | Idea pipeline (spark -> shaping -> building -> shipped) |
| goals | Project goals with progress tracking |
| todos | Tasks / Kanban items |
| activities | Activity feed / deploy logs |
| daily_notes | Quick notes from Daily Feed |
| skills | Team skills inventory |
| memory_entries | Decision log / context memory |

## Brand Assets
- **Brand Kit:** https://7layerlabs.github.io/dbtech45-agent-icons-v3/DBTECH45-BRAND-KIT.html
- **Brand Spec:** https://7layerlabs.github.io/dbtech45-agent-icons-v3/brand-spec.html
- **Icons Repo:** https://github.com/7LayerLabs/dbtech45-agent-icons-v3

## Env Vars (Vercel)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_API_KEY`
- `XAI_API_KEY`
- `GROQ_API_KEY`

---
Updated: Feb 11, 2026
