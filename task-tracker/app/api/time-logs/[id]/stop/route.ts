import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { ApiResponse, TimeLog } from '@/lib/types';

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const id = req.nextUrl.pathname.split('/').slice(-2, -1)[0];
    const body = await req.json().catch(() => ({}));
    const end_time: string | undefined = body?.end_time;

    if (!id) return NextResponse.json<ApiResponse>({ success: false, error: 'Time log ID required' }, { status: 400 });

    const { data: timeLog } = await supabase
      .from('time_logs')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.userId)
      .single();

    if (!timeLog) return NextResponse.json<ApiResponse>({ success: false, error: 'Time log not found' }, { status: 404 });
    if (timeLog.end_time) return NextResponse.json<ApiResponse>({ success: false, error: 'Time log already stopped' }, { status: 400 });

    const endTime = end_time ? new Date(end_time) : new Date();
    const startTime = new Date(timeLog.start_time);
    const duration_seconds = Math.max(0, Math.floor((endTime.getTime() - startTime.getTime()) / 1000));

    const { data, error } = await supabase
      .from('time_logs')
      .update({ end_time: endTime.toISOString(), duration_seconds })
      .eq('id', id)
      .eq('user_id', req.user!.userId)
      .select('*')
      .single();
    if (error || !data) throw error || new Error('Failed to stop time log');

    return NextResponse.json<ApiResponse<TimeLog>>({ success: true, data });
  } catch (error) {
    console.error('Stop time log error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 });
  }
});


