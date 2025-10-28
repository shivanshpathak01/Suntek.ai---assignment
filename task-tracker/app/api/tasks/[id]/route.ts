import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { ApiResponse, Task, UpdateTaskInput } from '@/lib/types';

// Get single task
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const id = req.nextUrl.pathname.split('/').pop();
    if (!id) return NextResponse.json<ApiResponse>({ success: false, error: 'Task ID required' }, { status: 400 });

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.userId)
      .single();

    if (error || !data) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json<ApiResponse<Task>>({ success: true, data });
  } catch (error) {
    console.error('Get task error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 });
  }
});

// Update task
export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const id = req.nextUrl.pathname.split('/').pop();
    if (!id) return NextResponse.json<ApiResponse>({ success: false, error: 'Task ID required' }, { status: 400 });

    const body: UpdateTaskInput = await req.json();

    const { data, error } = await supabase
      .from('tasks')
      .update({ ...body })
      .eq('id', id)
      .eq('user_id', req.user!.userId)
      .select('*')
      .single();

    if (error || !data) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Task not found or not updated' }, { status: 404 });
    }
    return NextResponse.json<ApiResponse<Task>>({ success: true, data });
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 });
  }
});

// Delete task
export const DELETE = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const id = req.nextUrl.pathname.split('/').pop();
    if (!id) return NextResponse.json<ApiResponse>({ success: false, error: 'Task ID required' }, { status: 400 });

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.userId);

    if (error) throw error;
    return NextResponse.json<ApiResponse>({ success: true, message: 'Task deleted' });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 });
  }
});


