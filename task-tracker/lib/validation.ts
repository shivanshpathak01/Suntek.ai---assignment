import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(255),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(0),
  description: z.string().trim().optional(),
  status: z.enum(['Pending', 'In Progress', 'Completed']).optional(),
  userInput: z.string().trim().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().optional(),
  description: z.string().trim().optional(),
  status: z.enum(['Pending', 'In Progress', 'Completed']).optional(),
}).refine((obj) => Object.keys(obj).length > 0, { message: 'No fields to update' });

export const createTimeLogSchema = z.object({
  task_id: z.string().uuid('Invalid task id'),
  start_time: z.string().datetime(),
});

export const stopTimeLogSchema = z.object({
  end_time: z.string().datetime().optional(),
});

export const aiSuggestSchema = z.object({
  userInput: z.string().trim().min(1, 'userInput is required'),
});

export function formatZodError(error: unknown): string {
  if (error && typeof error === 'object' && 'errors' in (error as any)) {
    try {
      const issues = (error as any).errors as Array<{ path: (string|number)[]; message: string }>;
      return issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    } catch {}
  }
  return 'Invalid request body';
}


