import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { hashPassword, generateToken } from '@/lib/auth';
import { SignupInput, ApiResponse, AuthResponse } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body: SignupInput = await req.json();
    const { email, password, name } = body;

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
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
      console.error('Error creating user:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to create user' },
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

