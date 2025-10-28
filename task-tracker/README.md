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
