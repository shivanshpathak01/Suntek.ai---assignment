import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Compare password
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Verify JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Extract user from token
export function getUserFromToken(token: string): { userId: string; email: string; name: string } | null {
  const decoded = verifyToken(token);
  if (!decoded) return null;
  
  return {
    userId: decoded.userId,
    email: decoded.email,
    name: decoded.name,
  };
}

