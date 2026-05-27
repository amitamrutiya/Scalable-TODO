import { api } from './api';
import { toast } from '@/contexts/ToastContext';
import type {
  Todo,
  PaginatedResponse,
  TodoFilters,
  CreateTodoData,
  UpdateTodoData,
} from '@/types';

interface GetTodosParams extends TodoFilters {
  page?: number;
  limit?: number;
}

export const todoService = {
  async getTodos(params: GetTodosParams = {}): Promise<PaginatedResponse<Todo>> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.priority) queryParams.append('priority', params.priority);
    if (params.tag) queryParams.append('tag', params.tag);
    if (params.search) queryParams.append('search', params.search);
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.order) queryParams.append('order', params.order);

    const query = queryParams.toString();
    const response = await api.get(`/todos${query ? `?${query}` : ''}`);
    const responseData = response.data as any;
    
    // Handle nested response: {success, data: {todos, pagination}}
    const innerData = responseData.data || responseData;
    
    // Backend returns {todos: Todo[], pagination: Pagination}
    // But frontend expects {data: Todo[], pagination: Pagination}
    const todos = Array.isArray(innerData.todos) ? innerData.todos : [];
    const pagination = innerData.pagination || { page: 1, limit: 20, total: 0, total_pages: 0 };
    
    return {
      data: todos,
      pagination,
    };
  },

  async createTodo(data: CreateTodoData): Promise<Todo> {
    const response = await api.post('/todos', data);
    const responseData = response.data as any;
    const todo = responseData.data || responseData;
    toast.success('Todo created');
    return todo;
  },

  async updateTodo(id: string, data: UpdateTodoData): Promise<Todo> {
    const response = await api.patch(`/todos/${id}`, data);
    const responseData = response.data as any;
    const todo = responseData.data || responseData;
    toast.success('Todo updated');
    return todo;
  },

  async deleteTodo(id: string): Promise<void> {
    await api.delete(`/todos/${id}`);
    toast.success('Todo deleted');
  },
};
