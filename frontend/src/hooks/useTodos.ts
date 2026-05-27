import { useState, useCallback, useEffect } from 'react';
import { todoService } from '@/services/todo.service';
import type { Todo, TodoFilters, CreateTodoData, UpdateTodoData, Pagination } from '@/types';

interface UseTodosReturn {
  todos: Todo[];
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;
  filters: TodoFilters;
  page: number;
  limit: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setFilters: (filters: TodoFilters) => void;
  fetchTodos: () => Promise<void>;
  createTodo: (data: CreateTodoData) => Promise<Todo>;
  updateTodo: (id: string, data: UpdateTodoData) => Promise<Todo>;
  deleteTodo: (id: string) => Promise<void>;
  toggleTodo: (id: string, isCompleted: boolean) => Promise<Todo>;
}

export function useTodos(initialFilters: TodoFilters = {}): UseTodosReturn {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TodoFilters>(initialFilters);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const fetchTodos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await todoService.getTodos({
        ...filters,
        page,
        limit,
      });
      setTodos(response.data);
      setPagination(response.pagination);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch todos';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [filters, page, limit]);

  const createTodo = useCallback(async (data: CreateTodoData): Promise<Todo> => {
    const todo = await todoService.createTodo(data);
    setTodos((prev) => [todo, ...prev]);
    if (pagination) {
      setPagination({ ...pagination, total: pagination.total + 1 });
    }
    return todo;
  }, [pagination]);

  const updateTodo = useCallback(async (id: string, data: UpdateTodoData): Promise<Todo> => {
    const todo = await todoService.updateTodo(id, data);
    setTodos((prev) => prev.map((t) => (t.id === id ? todo : t)));
    return todo;
  }, []);

  const deleteTodo = useCallback(async (id: string): Promise<void> => {
    await todoService.deleteTodo(id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
    if (pagination) {
      setPagination({ ...pagination, total: pagination.total - 1 });
    }
  }, [pagination]);

  const toggleTodo = useCallback(async (id: string, isCompleted: boolean): Promise<Todo> => {
    return updateTodo(id, { is_completed: !isCompleted });
  }, [updateTodo]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  return {
    todos,
    pagination,
    isLoading,
    error,
    filters,
    page,
    limit,
    setPage,
    setLimit,
    setFilters,
    fetchTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
  };
}
