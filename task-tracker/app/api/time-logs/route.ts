import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { ApiResponse, CreateTimeLogInput, TimeLog } from '@/lib/types';

// Start a time log
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body: CreateTimeLogInput = await req.json();
    const { task_id, start_time } = body;
    if (!task_id || !start_time) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'task_id and start_time are required' }, { status: 400 });
    }

    // Ensure task belongs to user
    const { data: task } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', task_id)
      .eq('user_id', req.user!.userId)
      .single();
    if (!task) return NextResponse.json<ApiResponse>({ success: false, error: 'Task not found' }, { status: 404 });

    // Check if there's already an active log for this user and task
    const { data: activeLogs } = await supabase
      .from('time_logs')
      .select('id')
      .eq('task_id', task_id)
      .eq('user_id', req.user!.userId)
      .is('end_time', null);
    if (activeLogs && activeLogs.length > 0) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Active timer already running' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('time_logs')
      .insert({ task_id, user_id: req.user!.userId, start_time })
      .select('*')
      .single();
    if (error || !data) throw error || new Error('Failed to start time log');

    return NextResponse.json<ApiResponse<TimeLog>>({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Start time log error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 });
  }
});

// List time logs for user (optionally by task_id)
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const taskId = req.nextUrl.searchParams.get('task_id');
    let query = supabase.from('time_logs').select('*').eq('user_id', req.user!.userId).order('start_time', { ascending: false });
    if (taskId) query = query.eq('task_id', taskId);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json<ApiResponse<TimeLog[]>>({ success: true, data: data || [] });
  } catch (error) {
    console.error('List time logs error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 });
  }
});


