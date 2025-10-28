import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { ApiResponse, CreateTaskInput, Task, UpdateTaskInput } from '@/lib/types';

// Create task
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body: CreateTaskInput & { userInput?: string } = await req.json();
    const { title, description, status } = body;

    if (!title) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: req.user!.userId,
        title,
        description: description || null,
        status: status || 'Pending',
      })
      .select('*')
      .single();

    if (error || !data) {
      throw error || new Error('Failed to create task');
    }

    return NextResponse.json<ApiResponse<Task>>({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 });
  }
});

// List tasks
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', req.user!.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json<ApiResponse<Task[]>>({ success: true, data: data || [] });
  } catch (error) {
    console.error('List tasks error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 });
  }
});


