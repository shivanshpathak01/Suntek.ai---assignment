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
  const [aiLoading, setAiLoading] = useState(false);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [nowTs, setNowTs] = useState<number>(Date.now());
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
    // load time logs
    const timeRes = await authedFetch('/api/time-logs');
    const timeJson = await timeRes.json();
    if (timeRes.ok && timeJson.success) {
      const logs = timeJson.data as TimeLog[];
      setTimeLogs(logs);
      const active: Record<string, TimeLog> = {};
      for (const log of logs) {
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
      const body: any = { title: taskTitle, description: taskDesc, status };
      if (newTaskInput.trim() && !taskTitle) {
        body.userInput = newTaskInput.trim();
      }
      const res = await authedFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to create');
      setTitle('');
      setDescription('');
      setNewTaskInput('');
      await fetchTasks();
      await fetchSummary();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function suggestWithAI() {
    try {
      setAiLoading(true);
      setError(null);
      const res = await authedFetch('/api/ai/suggest-task', {
        method: 'POST',
        body: JSON.stringify({ userInput: newTaskInput }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'AI suggestion failed');
      setTitle(json.data.title || '');
      setDescription(json.data.description || '');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAiLoading(false);
    }
  }

  async function updateTask(id: string, updates: Partial<Task>) {
    try {
      // If marking as Completed and timer running, stop it first so duration is captured
      if (updates.status === 'Completed' && activeLogByTask[id]) {
        await stopTimer(id);
        // Wait a bit to ensure the timer stop is processed
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const res = await authedFetch(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
      const json = await res.json();
      if (res.ok && json.success) {
        await fetchTasks();
        await fetchSummary();
      } else {
        setError(json.error || 'Failed to update task');
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function deleteTask(id: string) {
    const res = await authedFetch(`/api/tasks/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (res.ok && json.success) {
      // optimistic removal
      setActiveLogByTask((p) => {
        const { [id]: _, ...rest } = p as any;
        return rest;
      });
      setTimeLogs((logs) => logs.filter((l) => l.task_id !== id));
      await fetchTasks();
      await fetchSummary();
    }
  }

  async function startTimer(taskId: string) {
    const optimisticLog: TimeLog = {
      id: `tmp-${taskId}-${Date.now()}`,
      task_id: taskId,
      start_time: new Date().toISOString(),
      end_time: null,
      duration_seconds: null,
    };
    setActiveLogByTask((p) => ({ ...p, [taskId]: optimisticLog }));
    setTimeLogs((p) => [optimisticLog, ...p]);
    const res = await authedFetch('/api/time-logs', {
      method: 'POST',
      body: JSON.stringify({ task_id: taskId, start_time: optimisticLog.start_time }),
    });
    const json = await res.json();
    if (res.ok && json.success) {
      setTimeLogs((logs) => {
        const filtered = logs.filter((l) => l.id !== optimisticLog.id);
        return [json.data as TimeLog, ...filtered];
      });
      setActiveLogByTask((p) => ({ ...p, [taskId]: json.data as TimeLog }));
      await fetchTasks();
      await fetchSummary();
    } else {
      setTimeLogs((logs) => logs.filter((l) => l.id !== optimisticLog.id));
      setActiveLogByTask((p) => {
        const { [taskId]: _, ...rest } = p;
        return rest;
      });
    }
  }

  async function stopTimer(taskId: string) {
    const log = activeLogByTask[taskId];
    if (!log) return;
    const endIso = new Date().toISOString();
    // optimistic close
    setActiveLogByTask((p) => {
      const { [taskId]: _, ...rest } = p;
      return rest;
    });
    setTimeLogs((logs) => logs.map((l) => (l.id === log.id ? { ...l, end_time: endIso, duration_seconds: Math.max(0, Math.floor((new Date(endIso).getTime() - new Date(l.start_time).getTime()) / 1000)) } : l)));
    const res = await authedFetch(`/api/time-logs/${log.id}/stop`, {
      method: 'POST',
      body: JSON.stringify({ end_time: endIso }),
    });
    const json = await res.json();
    if (res.ok && json.success) {
      setTimeLogs((logs) => logs.map((l) => (l.id === log.id ? (json.data as TimeLog) : l)));
      await fetchTasks();
      await fetchSummary();
    } else {
      await fetchTasks();
      await fetchSummary();
    }
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    window.location.href = '/login';
  }

  const totalsByTask = useMemo(() => {
    const totals: Record<string, number> = {};

    // If no time logs, return empty totals
    if (!timeLogs || timeLogs.length === 0) {
      return totals;
    }

    for (const log of timeLogs) {
      if (!log || !log.task_id) continue;

      const base = totals[log.task_id] || 0;
      let duration = 0;

      try {
        if (log.duration_seconds !== null && log.duration_seconds !== undefined && log.end_time) {
          // Use stored duration for completed logs
          duration = log.duration_seconds;
        } else if (!log.end_time && log.start_time) {
          // Calculate live duration for active logs
          const start = new Date(log.start_time).getTime();
          if (!isNaN(start) && nowTs > start) {
            duration = Math.max(0, Math.floor((nowTs - start) / 1000));
          }
        } else if (log.end_time && log.start_time) {
          // Fallback calculation for logs with end_time but no duration_seconds
          const start = new Date(log.start_time).getTime();
          const end = new Date(log.end_time).getTime();
          if (!isNaN(start) && !isNaN(end) && end > start) {
            duration = Math.max(0, Math.floor((end - start) / 1000));
          }
        }
      } catch (error) {
        console.error('Error calculating duration for log:', log, error);
        duration = 0;
      }

      totals[log.task_id] = base + duration;
    }

    return totals;
  }, [timeLogs, nowTs]);

  const activeCount = useMemo(() => Object.keys(activeLogByTask).length, [activeLogByTask]);

  // Initialize nowTs properly and update it when there are active timers
  useEffect(() => {
    setNowTs(Date.now()); // Ensure initial value is set
  }, []);

  useEffect(() => {
    if (activeCount === 0) return;
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [activeCount]);

  // Also update nowTs when timeLogs change to ensure calculations are current
  useEffect(() => {
    setNowTs(Date.now());
  }, [timeLogs]);

  const clientTodaySeconds = useMemo(() => {
    if (!timeLogs || timeLogs.length === 0) return 0;

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
    let total = 0;

    for (const log of timeLogs) {
      if (!log || !log.start_time) continue;

      try {
        const startTime = new Date(log.start_time).getTime();
        if (isNaN(startTime) || startTime < startOfDay || startTime >= endOfDay) continue;

        let duration = 0;

        if (log.duration_seconds !== null && log.duration_seconds !== undefined && log.end_time) {
          // Use stored duration for completed logs
          duration = log.duration_seconds;
        } else if (!log.end_time) {
          // Calculate live duration for active logs
          if (nowTs > startTime) {
            duration = Math.max(0, Math.floor((nowTs - startTime) / 1000));
          }
        } else if (log.end_time) {
          // Fallback calculation
          const endTime = new Date(log.end_time).getTime();
          if (!isNaN(endTime) && endTime > startTime) {
            duration = Math.max(0, Math.floor((endTime - startTime) / 1000));
          }
        }

        total += duration;
      } catch (error) {
        console.error('Error calculating today duration for log:', log, error);
      }
    }
    return total;
  }, [timeLogs, nowTs]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 text-black">
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
    <div className="min-h-screen bg-zinc-50 text-black">
      <header className="flex items-center justify-between max-w-4xl mx-auto p-4">
        <h1 className="text-5xl font-bold">Task & Time Tracker</h1>
        <div className="flex items-center gap-4 text-sm">
          <span>
            Today: {format(new Date(), 'yyyy-MM-dd')} • {Math.floor((clientTodaySeconds) / 3600)}h {Math.floor(((clientTodaySeconds) % 3600) / 60)}m
          </span>
          <button onClick={logout} className="px-3 py-1 border bg-red-300 rounded">Log out</button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 grid gap-6">
        {error && <div className="text-red-600 text-sm">{error}</div>}

        <section className="bg-white border rounded p-4">
          <h2 className="font-medium mb-3">Add Task</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex gap-2">
              <input placeholder="Natural language: e.g., follow up with designer" className="border rounded px-3 py-2 flex-1" value={newTaskInput} onChange={(e) => setNewTaskInput(e.target.value)} />
              <button type="button" onClick={suggestWithAI} disabled={!newTaskInput.trim() || aiLoading} className="px-3 py-2 border rounded whitespace-nowrap">{aiLoading ? 'Thinking…' : 'Suggest'}</button>
            </div>
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
                    <div className="text-xs text-zinc-500">Tracked: {Math.floor((totalsByTask[task.id] || 0) / 3600)}h {Math.floor(((totalsByTask[task.id] || 0) % 3600) / 60)}m</div>
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
            <div className="text-sm text-zinc-700 mb-2">Total Tracked: {Math.floor(clientTodaySeconds / 3600)}h {Math.floor((clientTodaySeconds % 3600) / 60)}m</div>
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
