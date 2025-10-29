## Task and Time Tracking App

Features implemented:
- Authentication: signup, login, logout (JWT)
- Tasks CRUD with statuses
- Real-time time tracking (start/stop), time logs
- Daily summary for current day
- Simple dashboard UI

### Running locally

1) Set environment variables in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=replace-with-strong-secret
# Optional for AI suggestions
OPENAI_API_KEY=sk-...
```

2) Install and run:
```
npm install
npm run dev
```

3) Database

Use Supabase SQL editor to run `database/schema.sql` to create tables.

### API Overview

- POST `/api/auth/signup` { name, email, password }
- POST `/api/auth/login` { email, password }
- GET/POST `/api/tasks` (Bearer token required)
- GET/PATCH/DELETE `/api/tasks/:id` (Bearer token required)
- POST `/api/time-logs` start a log
- POST `/api/time-logs/:id/stop` stop a log
- GET `/api/time-logs` list logs
- GET `/api/summary/daily` daily summary

### UI

- `/signup`, `/login`
- `/` dashboard: tasks, timers, summary

### Deployment

Deploy on your platform of choice (e.g., Vercel). Ensure environment variables are configured, and run the schema on your Supabase instance.

Live demo: <add link>

Test credentials (optional):
- email: demo@example.com
- password: demodemo

### Optional: Supabase RLS (Read before enabling)

This app uses custom JWT in the app layer for auth. If you enable Supabase RLS, you must also use Supabase Auth (so `auth.uid()` works in policies) or create permissive policies that still limit access appropriately.

If you migrate to Supabase Auth, enable RLS and add policies like:
```
alter table users enable row level security;
alter table tasks enable row level security;
alter table time_logs enable row level security;

create policy "users_self" on users
  for select using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "tasks_by_owner" on tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "time_logs_by_owner" on time_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

If you keep custom JWT (current setup), keep RLS disabled or write proxy policies and a service role flow. Otherwise queries will fail.
