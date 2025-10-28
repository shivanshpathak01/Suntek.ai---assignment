// User types
export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface UserWithPassword extends User {
  password_hash: string;
}

// Task types
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
}

// Time log types
export interface TimeLog {
  id: string;
  task_id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTimeLogInput {
  task_id: string;
  start_time: string;
}

export interface UpdateTimeLogInput {
  end_time: string;
  duration_seconds: number;
}

// Task with time tracking info
export interface TaskWithTimeInfo extends Task {
  total_time_seconds: number;
  active_time_log?: TimeLog;
  time_logs: TimeLog[];
}

// Daily summary types
export interface DailySummary {
  date: string;
  tasks_worked_on: Task[];
  total_time_seconds: number;
  completed_tasks: Task[];
  in_progress_tasks: Task[];
  pending_tasks: Task[];
}

// Auth types
export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// AI task generation types
export interface AITaskSuggestion {
  title: string;
  description: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

