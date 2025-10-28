"use client";

import { useEffect, useMemo, useState } from 'react';
import Timer from './components/Timer';
import { format } from 'date-fns';

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: 'Pending' | 'In Progress' | 'Completed';
  created_at: string;
  updated_at: string;
};

type TimeLog = {
  id: string;
  task_id: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
};

export default function Dashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [creating, setCreating] = useState(false);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Pending' | 'In Progress' | 'Completed'>('Pending');
  const [activeLogByTask, setActiveLogByTask] = useState<Record<string, TimeLog | undefined>>({});
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ total_time_seconds: number; date: string; completed_tasks?: any[]; in_progress_tasks?: any[]; pending_tasks?: any[] } | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
  }, []);

  useEffect(() => {
    if (!token) return;
    void fetchTasks();
    void fetchSummary();
  }, [token]);

  async function authedFetch(input: RequestInfo, init?: RequestInit) {
    if (!token) throw new Error('Not authenticated');
    return fetch(input, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async function fetchTasks() {
    const res = await authedFetch('/api/tasks');
    const json = await res.json();
    if (!res.ok || !json.success) {
      setError(json.error || 'Failed to load tasks');
      return;
    }
    setTasks(json.data);
    // load active logs
    const timeRes = await authedFetch('/api/time-logs');
    const timeJson = await timeRes.json();
    if (timeRes.ok && timeJson.success) {
      const active: Record<string, TimeLog> = {};
      for (const log of timeJson.data as TimeLog[]) {
        if (!log.end_time) active[log.task_id] = log;
      }
      setActiveLogByTask(active);
    }
  }

  async function fetchSummary() {
    const res = await authedFetch('/api/summary/daily');
    const json = await res.json();
    if (res.ok && json.success) setSummary(json.data);
  }

  async function createTask() {
    setCreating(true);
    try {
      let taskTitle = title.trim();
      let taskDesc = description.trim();
      if (!taskTitle && newTaskInput.trim()) {
        // naive transform if AI not used here
        taskTitle = newTaskInput.trim().replace(/^\w/, (c) => c.toUpperCase());
        taskDesc = `Task: ${newTaskInput.trim()}`;
      }
      const res = await authedFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: taskTitle, description: taskDesc, status }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to create');
      setTitle('');
      setDescription('');
      setNewTaskInput('');
      await fetchTasks();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function updateTask(id: string, updates: Partial<Task>) {
    const res = await authedFetch(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
    const json = await res.json();
    if (res.ok && json.success) await fetchTasks();
  }

  async function deleteTask(id: string) {
    const res = await authedFetch(`/api/tasks/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (res.ok && json.success) await fetchTasks();
  }

  async function startTimer(taskId: string) {
    const res = await authedFetch('/api/time-logs', {
      method: 'POST',
      body: JSON.stringify({ task_id: taskId, start_time: new Date().toISOString() }),
    });
    const json = await res.json();
    if (res.ok && json.success) await fetchTasks();
  }

  async function stopTimer(taskId: string) {
    const log = activeLogByTask[taskId];
    if (!log) return;
    const res = await authedFetch(`/api/time-logs/${log.id}/stop`, {
      method: 'POST',
      body: JSON.stringify({ end_time: new Date().toISOString() }),
    });
    const json = await res.json();
    if (res.ok && json.success) await fetchTasks();
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    window.location.href = '/login';
  }

  const totalsByTask = useMemo(() => {
    return {} as Record<string, number>;
  }, [tasks]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">Task & Time Tracker</h1>
          <div className="space-x-3">
            <a href="/login" className="px-4 py-2 bg-black text-white rounded">Log in</a>
            <a href="/signup" className="px-4 py-2 border rounded">Sign up</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="flex items-center justify-between max-w-4xl mx-auto p-4">
        <h1 className="text-xl font-semibold">Task & Time Tracker</h1>
        <div className="flex items-center gap-4 text-sm">
          {summary && (
            <span>Today: {format(new Date(), 'yyyy-MM-dd')} • {Math.floor((summary.total_time_seconds || 0)/3600)}h {Math.floor(((summary.total_time_seconds || 0)%3600)/60)}m</span>
          )}
          <button onClick={logout} className="px-3 py-1 border rounded">Log out</button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 grid gap-6">
        {error && <div className="text-red-600 text-sm">{error}</div>}

        <section className="bg-white border rounded p-4">
          <h2 className="font-medium mb-3">Add Task</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <input placeholder="Natural language: e.g., follow up with designer" className="border rounded px-3 py-2" value={newTaskInput} onChange={(e) => setNewTaskInput(e.target.value)} />
            <input placeholder="Title (optional)" className="border rounded px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input placeholder="Description (optional)" className="border rounded px-3 py-2 sm:col-span-2" value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="flex items-center gap-2">
              <select className="border rounded px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                <option>Pending</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
              <button onClick={createTask} disabled={creating} className="px-4 py-2 bg-black text-white rounded disabled:opacity-60">{creating ? 'Adding...' : 'Add task'}</button>
            </div>
          </div>
        </section>

        <section className="bg-white border rounded p-4">
          <h2 className="font-medium mb-3">Tasks</h2>
          <div className="grid gap-3">
            {tasks.map((task) => {
              const active = activeLogByTask[task.id];
              const runningSeconds = active ? Math.floor((Date.now() - new Date(active.start_time).getTime()) / 1000) : 0;
              return (
                <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between border rounded px-3 py-2">
                  <div className="flex-1">
                    <div className="font-medium">{task.title}</div>
                    {task.description && <div className="text-sm text-zinc-600">{task.description}</div>}
                    <div className="text-xs text-zinc-500 mt-1">Status: {task.status}</div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 sm:mt-0">
                    <select value={task.status} onChange={(e) => updateTask(task.id, { status: e.target.value as Task['status'] })} className="border rounded px-2 py-1 text-sm">
                      <option>Pending</option>
                      <option>In Progress</option>
                      <option>Completed</option>
                    </select>
                    {!active ? (
                      <button onClick={() => startTimer(task.id)} className="px-3 py-1 bg-emerald-600 text-white rounded text-sm">Start</button>
                    ) : (
                      <button onClick={() => stopTimer(task.id)} className="px-3 py-1 bg-rose-600 text-white rounded text-sm">Stop (<Timer startIso={active.start_time} />)</button>
                    )}
                    <button onClick={() => deleteTask(task.id)} className="px-3 py-1 border rounded text-sm">Delete</button>
                  </div>
                </div>
              );
            })}
            {tasks.length === 0 && <div className="text-sm text-zinc-600">No tasks yet.</div>}
          </div>
        </section>

        {summary && (
          <section className="bg-white border rounded p-4">
            <h2 className="font-medium mb-3">Today's Summary</h2>
            <div className="text-sm text-zinc-700 mb-2">Total Tracked: {Math.floor((summary.total_time_seconds || 0)/3600)}h {Math.floor(((summary.total_time_seconds || 0)%3600)/60)}m</div>
            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              <div>
                <div className="font-medium mb-1">Completed</div>
                <ul className="list-disc ml-5">
                  {(summary.completed_tasks || []).map((t: any) => (
                    <li key={t.id}>{t.title}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="font-medium mb-1">In Progress</div>
                <ul className="list-disc ml-5">
                  {(summary.in_progress_tasks || []).map((t: any) => (
                    <li key={t.id}>{t.title}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="font-medium mb-1">Pending</div>
                <ul className="list-disc ml-5">
                  {(summary.pending_tasks || []).map((t: any) => (
                    <li key={t.id}>{t.title}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
