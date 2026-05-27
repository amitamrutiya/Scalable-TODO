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
    const response = await api.get<PaginatedResponse<Todo>>(`/todos${query ? `?${query}` : ''}`);
    return response.data;
  },

  async createTodo(data: CreateTodoData): Promise<Todo> {
    const response = await api.post<Todo>('/todos', data);
    toast.success('Todo created');
    return response.data;
  },

  async updateTodo(id: string, data: UpdateTodoData): Promise<Todo> {
    const response = await api.patch<Todo>(`/todos/${id}`, data);
    toast.success('Todo updated');
    return response.data;
  },

  async deleteTodo(id: string): Promise<void> {
    await api.delete(`/todos/${id}`);
    toast.success('Todo deleted');
  },
};
