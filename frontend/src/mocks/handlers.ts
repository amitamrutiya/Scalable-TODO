import { http, HttpResponse } from 'msw';
import type { Todo, UserWithStats, PaginatedResponse, CreateTodoData, UpdateTodoData } from '@/types';

const API_BASE = 'http://localhost:3000/api/v1';

// Store mutable state for todos across handlers
let mockTodos: Todo[] = [];

export function resetMockTodos(todos: Todo[] = []) {
  mockTodos = todos;
}

export function getMockTodos() {
  return mockTodos;
}

export const handlers = [
  // Auth: Signup
  http.post(`${API_BASE}/auth/signup`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    if (!body.email || !body.password) {
      return HttpResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }
    const response = {
      success: true,
      data: {
        user: {
          id: 'mock-user-id',
          email: body.email,
          display_name: body.display_name || 'Mock User',
          created_at: new Date().toISOString(),
        },
        tokens: {
          access_token: 'mock-signup-token',
          token_type: 'Bearer',
          expires_in: 3600,
        },
      },
      message: 'User registered successfully',
    };
    return HttpResponse.json(response, { status: 201 });
  }),

  // Auth: Login
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    if (body.email === 'wrong@example.com' || body.password === 'wrongpassword') {
      return HttpResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    const response = {
      success: true,
      data: {
        user: {
          id: 'mock-user-id',
          email: body.email,
          display_name: 'Mock User',
          created_at: new Date().toISOString(),
        },
        tokens: {
          access_token: 'mock-login-token',
          token_type: 'Bearer',
          expires_in: 3600,
        },
      },
      message: 'Login successful',
    };
    return HttpResponse.json(response);
  }),

  // Auth: Logout
  http.post(`${API_BASE}/auth/logout`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Users: Get Me
  http.get(`${API_BASE}/users/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const user: UserWithStats = {
      id: 'user-1',
      email: 'test@example.com',
      display_name: 'Test User',
      created_at: '2024-01-01T00:00:00.000Z',
      stats: {
        total_todos: 5,
        completed_todos: 2,
        pending_todos: 3,
      },
    };
    return HttpResponse.json(user);
  }),

  // Users: Update Profile
  http.patch(`${API_BASE}/users/me`, async ({ request }) => {
    const body = await request.json() as Partial<UserWithStats>;
    const user: UserWithStats = {
      id: 'user-1',
      email: 'test@example.com',
      display_name: body.display_name || 'Test User',
      created_at: '2024-01-01T00:00:00.000Z',
      stats: {
        total_todos: 5,
        completed_todos: 2,
        pending_todos: 3,
      },
    };
    return HttpResponse.json(user);
  }),

  // Users: Update Password
  http.patch(`${API_BASE}/users/me/password`, async () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Todos: Get All
  http.get(`${API_BASE}/todos`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const tag = url.searchParams.get('tag');
    const search = url.searchParams.get('search');

    let filtered = [...mockTodos];

    if (status === 'completed') {
      filtered = filtered.filter((t) => t.is_completed);
    } else if (status === 'pending') {
      filtered = filtered.filter((t) => !t.is_completed);
    }

    if (priority) {
      filtered = filtered.filter((t) => t.priority === priority);
    }

    if (tag) {
      filtered = filtered.filter((t) => t.tags.includes(tag));
    }

    if (search) {
      filtered = filtered.filter((t) =>
        t.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    const response: PaginatedResponse<Todo> = {
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    };

    return HttpResponse.json(response);
  }),

  // Todos: Create
  http.post(`${API_BASE}/todos`, async ({ request }) => {
    const body = await request.json() as CreateTodoData;
    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      title: body.title,
      description: body.description,
      is_completed: false,
      priority: body.priority || 'medium',
      due_date: body.due_date,
      tags: body.tags || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockTodos.unshift(newTodo);
    return HttpResponse.json(newTodo, { status: 201 });
  }),

  // Todos: Update
  http.patch(`${API_BASE}/todos/:id`, async ({ request, params }) => {
    const { id } = params;
    const body = await request.json() as UpdateTodoData;
    const index = mockTodos.findIndex((t) => t.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: 'Todo not found' }, { status: 404 });
    }
    const updated: Todo = {
      ...mockTodos[index],
      ...body,
      id: String(id),
      updated_at: new Date().toISOString(),
    };
    mockTodos[index] = updated;
    return HttpResponse.json(updated);
  }),

  // Todos: Delete
  http.delete(`${API_BASE}/todos/:id`, ({ params }) => {
    const { id } = params;
    const index = mockTodos.findIndex((t) => t.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: 'Todo not found' }, { status: 404 });
    }
    mockTodos.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
