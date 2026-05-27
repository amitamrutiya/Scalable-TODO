export interface User {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

export interface UserWithStats extends User {
  stats: {
    total_todos: number;
    completed_todos: number;
    pending_todos: number;
  };
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  is_completed: boolean;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  display_name: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    tokens: {
      access_token: string;
      token_type: string;
      expires_in: number;
    };
  };
  message: string;
}

// Legacy type for backwards compatibility (tokens extracted from nested response)
export interface AuthTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface UpdateProfileData {
  display_name?: string;
}

export interface UpdatePasswordData {
  current_password: string;
  new_password: string;
}

export interface TodoFilters {
  status?: 'completed' | 'pending';
  priority?: 'low' | 'medium' | 'high';
  tag?: string;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface CreateTodoData {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  tags?: string[];
}

export interface UpdateTodoData {
  title?: string;
  description?: string;
  is_completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  tags?: string[];
}
