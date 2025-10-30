# Task & Time Tracker

A modern, real-time task and time tracking application built with Next.js, featuring comprehensive time management capabilities and AI-powered task suggestions.

## ✨ Features

- **Authentication System**: Secure signup, login, logout with JWT tokens
- **Task Management**: Full CRUD operations with status tracking (Pending, In Progress, Completed)
- **Real-time Time Tracking**: 
  - Start/stop timers for individual tasks
  - Live timer display with real-time updates
  - Automatic timer stop when tasks are marked as completed
  - Persistent time logs with duration calculation
- **Smart Dashboard**: 
  - Real-time tracked time display for each task
  - Live daily summary with total time tracking
  - Task categorization by status
- **AI Integration**: OpenAI-powered task title and description suggestions
- **Responsive Design**: Clean, modern UI that works on all devices

## 🚀 Tech Stack

- **Frontend**: Next.js 16 (React), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, JWT Authentication
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT API for task suggestions
- **Deployment**: Vercel-ready
- **Real-time Updates**: Client-side state management with optimistic updates

## 🛠️ Setup Instructions for Local Development

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- OpenAI API key (optional, for AI features)

### 1. Clone and Install
```bash
git clone <repository-url>
cd task-tracker
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# JWT Secret (generate a strong random string)
JWT_SECRET=your_jwt_secret_here_change_this_to_a_random_string

# OpenAI API Key (optional - for AI task suggestions)
OPENAI_API_KEY=sk-your_openai_api_key
```

### 3. Database Setup
1. Create a new Supabase project
2. In the Supabase SQL Editor, run the schema from `database/schema.sql`
3. This will create the required tables: `users`, `tasks`, and `time_logs`

### 4. Run the Application
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 5. First Time Setup
1. Navigate to `/signup` to create your account
2. Login and start creating tasks
3. Use the timer functionality to track time on your tasks

## 📱 Application Structure

### Pages
- **`/`** - Main dashboard (requires authentication)
- **`/login`** - User login page
- **`/signup`** - User registration page

### Key Features Explained

#### Real-time Timer Tracking
- **Individual Task Timers**: Each task displays its total tracked time, updating in real-time
- **Live Timer Display**: Running timers show current duration (e.g., "Stop (5m 23s)")
- **Automatic Updates**: Total tracked time updates immediately when timers are stopped
- **Smart Completion**: When a task is marked as "Completed", any running timer automatically stops

#### Daily Summary
- **Real-time Total**: Shows total time tracked for the current day, updates without page refresh
- **Task Categorization**: Displays tasks grouped by status (Completed, In Progress, Pending)
- **Live Updates**: Summary refreshes automatically when tasks are updated or timers are used

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - User login

### Tasks (Bearer token required)
- `GET /api/tasks` - List user's tasks
- `POST /api/tasks` - Create new task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Time Tracking (Bearer token required)
- `GET /api/time-logs` - List time logs
- `POST /api/time-logs` - Start time tracking
- `POST /api/time-logs/:id/stop` - Stop time tracking

### Analytics
- `GET /api/summary/daily` - Get daily summary

### AI Features
- `POST /api/ai/suggest-task` - Get AI-generated task suggestions

## 🚀 Deployment

### Vercel Deployment (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `JWT_SECRET`
   - `OPENAI_API_KEY` (optional)
4. Deploy!

### Other Platforms
The app can be deployed on any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

Ensure environment variables are configured and the database schema is applied to your Supabase instance.

## 🌐 Live Demo

**Live Application**: [Add your deployed link here]

### Test Credentials (Optional)
```
Email: demo@example.com
Password: demodemo
```

## 📸 Screenshots

*Add screenshots of your application here showing:*
- Dashboard with tasks and timers
- Real-time timer functionality
- Daily summary section
- Task creation with AI suggestions

## 🎥 Demo Video

*Add link to demo video showcasing the real-time timer functionality*

## 🔧 Recent Improvements

### Timer Tracking Enhancements
- **Fixed Real-time Updates**: Total tracked time now updates immediately without page refresh
- **Enhanced Calculations**: Improved time calculation logic with better error handling
- **Smart State Management**: Optimized state updates for better performance
- **Completion Integration**: Seamless timer stop when tasks are marked as completed

## 🔒 Security Notes

### Authentication System
This application uses custom JWT authentication implemented in the application layer. The current setup does **not** use Supabase Auth but rather implements its own authentication system.

### Supabase RLS (Row Level Security)
**Important**: This app currently has RLS disabled on Supabase. If you want to enable RLS:

1. **Option 1**: Migrate to Supabase Auth and enable RLS with policies:
```sql
alter table users enable row level security;
alter table tasks enable row level security;
alter table time_logs enable row level security;

create policy "users_self" on users
  for select using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "tasks_by_owner" on tasks
  for all using (auth.uid() = user_id) 
  with check (auth.uid() = user_id);

create policy "time_logs_by_owner" on time_logs
  for all using (auth.uid() = user_id) 
  with check (auth.uid() = user_id);
```

2. **Option 2**: Keep custom JWT and implement service role policies (advanced)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Known Issues

- None currently reported

## 📞 Support

For support, email [your-email] or create an issue in the repository.

---

**Built with ❤️ using Next.js and Supabase**
