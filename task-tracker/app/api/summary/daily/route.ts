import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { ApiResponse, DailySummary, Task } from '@/lib/types';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Fetch tasks for user
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', req.user!.userId);
    if (tasksError) throw tasksError;

    // Fetch time logs for today
    const { data: timeLogs, error: logsError } = await supabase
      .from('time_logs')
      .select('*')
      .eq('user_id', req.user!.userId)
      .gte('start_time', startOfDay.toISOString())
      .lt('start_time', endOfDay.toISOString());
    if (logsError) throw logsError;

    // Aggregate
    const taskIdToTotal: Record<string, number> = {};
    let totalSeconds = 0;
    for (const log of timeLogs || []) {
      const duration = log.duration_seconds ?? Math.max(0, Math.floor(((log.end_time ? new Date(log.end_time) : now).getTime() - new Date(log.start_time).getTime()) / 1000));
      totalSeconds += duration;
      taskIdToTotal[log.task_id] = (taskIdToTotal[log.task_id] || 0) + duration;
    }

    const workedTaskIds = new Set(Object.keys(taskIdToTotal));
    const tasksWorkedOn: Task[] = (tasks || []).filter((t) => workedTaskIds.has(t.id));
    const completedTasks: Task[] = (tasks || []).filter((t) => t.status === 'Completed');
    const inProgressTasks: Task[] = (tasks || []).filter((t) => t.status === 'In Progress');
    const pendingTasks: Task[] = (tasks || []).filter((t) => t.status === 'Pending');

    const summary: DailySummary = {
      date: startOfDay.toISOString().slice(0, 10),
      tasks_worked_on: tasksWorkedOn,
      total_time_seconds: totalSeconds,
      completed_tasks: completedTasks,
      in_progress_tasks: inProgressTasks,
      pending_tasks: pendingTasks,
    };

    return NextResponse.json<ApiResponse<DailySummary>>({ success: true, data: summary });
  } catch (error) {
    console.error('Daily summary error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 });
  }
});



