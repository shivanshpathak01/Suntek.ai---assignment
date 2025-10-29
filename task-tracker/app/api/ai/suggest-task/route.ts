import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { generateTaskSuggestion } from '@/lib/ai-service';
import { ApiResponse, AITaskSuggestion } from '@/lib/types';
import { aiSuggestSchema, formatZodError } from '@/lib/validation';

export const POST = withAuth(async (req) => {
  try {
    const json = await req.json();
    const parsed = aiSuggestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse>({ success: false, error: formatZodError(parsed.error) }, { status: 400 });
    }
    const suggestion = await generateTaskSuggestion(parsed.data.userInput);
    return NextResponse.json<ApiResponse<AITaskSuggestion>>({ success: true, data: suggestion });
  } catch (error) {
    console.error('AI suggest error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to generate suggestion' }, { status: 500 });
  }
});


