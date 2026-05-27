export interface User {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  created_at: Date;
  updated_at: Date;
}

export interface SanitizedUser {
  id: string;
  email: string;
  display_name: string;
  created_at: Date;
}

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  priority: 'low' | 'medium' | 'high';
  due_date: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  created_at: Date;
}

export interface TodoWithTags extends Todo {
  tags: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserStats {
  total_todos: number;
  completed_todos: number;
  pending_todos: number;
}
