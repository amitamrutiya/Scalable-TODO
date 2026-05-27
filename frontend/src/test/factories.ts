import type { User, UserWithStats, Todo, AuthResponse } from '@/types';

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'test@example.com',
    display_name: 'Test User',
    created_at: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function createMockUserWithStats(overrides: Partial<UserWithStats> = {}): UserWithStats {
  return {
    ...createMockUser(overrides),
    stats: {
      total_todos: 5,
      completed_todos: 2,
      pending_todos: 3,
      ...overrides.stats,
    },
  };
}

export function createMockTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: `todo-${Math.random().toString(36).substr(2, 9)}`,
    title: 'Test Todo',
    description: 'Test description',
    is_completed: false,
    priority: 'medium',
    due_date: undefined,
    tags: [],
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function createMockTodos(count: number): Todo[] {
  return Array.from({ length: count }, (_, i) =>
    createMockTodo({
      id: `todo-${i + 1}`,
      title: `Todo ${i + 1}`,
    })
  );
}

export function createMockAuthResponse(overrides: Partial<AuthResponse> = {}): AuthResponse {
  return {
    access_token: 'mock-access-token',
    token_type: 'Bearer',
    expires_in: 3600,
    ...overrides,
  };
}
