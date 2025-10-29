import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { hashPassword, generateToken } from '@/lib/auth';
import { SignupInput, ApiResponse, AuthResponse } from '@/lib/types';
import { signupSchema, formatZodError } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = signupSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse>({ success: false, error: formatZodError(parsed.error) }, { status: 400 });
    }
    const { email, password, name } = parsed.data as SignupInput;

    // Validation
    // zod already validates required and min length

    // Check if user already exists
    const { data: existingUser, error: existingErr } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        name,
      })
      .select('id, email, name, created_at, updated_at')
      .single();

    if (error || !newUser) {
      try {
        console.error('Error creating user:', error);
      } catch {}
      return NextResponse.json<ApiResponse>(
        { success: false, error: error?.message || 'Failed to create user' },
        { status: 500 }
      );
    }

    // Generate token
    const token = generateToken(newUser);

    return NextResponse.json<ApiResponse<AuthResponse>>(
      {
        success: true,
        data: {
          user: newUser,
          token,
        },
        message: 'User created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

