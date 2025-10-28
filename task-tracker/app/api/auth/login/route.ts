import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { comparePassword, generateToken } from '@/lib/auth';
import { ApiResponse, AuthResponse, LoginInput, UserWithPassword } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body: LoginInput = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, password_hash, created_at, updated_at')
      .eq('email', email)
      .single();

    if (error || !user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isValid = await comparePassword(password, (user as UserWithPassword).password_hash);
    if (!isValid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const token = generateToken(user);

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    return NextResponse.json<ApiResponse<AuthResponse>>(
      { success: true, data: { user: safeUser, token }, message: 'Login successful' },
      { status: 200 }
    );
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


