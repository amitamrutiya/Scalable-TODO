import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTodos } from '@/hooks/useTodos';
import { storage } from '@/utils/storage';
import { resetMockTodos } from '@/mocks/handlers';
import { createMockTodos } from '@/test/factories';

describe('useTodos', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;

  beforeEach(() => {
    storage.setToken('mock-token');
    resetMockTodos();
  });

  describe('fetchTodos', () => {
    it('should fetch todos and populate state', async () => {
      resetMockTodos(createMockTodos(5));

      const { result } = renderHook(() => useTodos(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.todos).toHaveLength(5);
      expect(result.current.pagination).not.toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should handle empty todo list', async () => {
      const { result } = renderHook(() => useTodos(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.todos).toHaveLength(0);
    });
  });

  describe('createTodo', () => {
    it('should add new todo to list', async () => {
      const { result } = renderHook(() => useTodos(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const newTodo = await act(async () => {
        return result.current.createTodo({
          title: 'New Task',
          priority: 'high',
        });
      });

      expect(newTodo.title).toBe('New Task');
      expect(result.current.todos).toHaveLength(1);
      expect(result.current.pagination?.total).toBe(1);
    });
  });

  describe('updateTodo', () => {
    it('should modify existing todo', async () => {
      resetMockTodos(createMockTodos(3));

      const { result } = renderHook(() => useTodos(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const updated = await act(async () => {
        return result.current.updateTodo('todo-1', {
          title: 'Updated Title',
        });
      });

      expect(updated.title).toBe('Updated Title');
      const todoInList = result.current.todos.find((t) => t.id === 'todo-1');
      expect(todoInList?.title).toBe('Updated Title');
    });
  });

  describe('deleteTodo', () => {
    it('should remove todo from list', async () => {
      resetMockTodos(createMockTodos(3));

      const { result } = renderHook(() => useTodos(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.deleteTodo('todo-1');
      });

      expect(result.current.todos).toHaveLength(2);
      expect(result.current.todos.find((t) => t.id === 'todo-1')).toBeUndefined();
    });
  });

  describe('toggleTodo', () => {
    it('should flip completion status', async () => {
      resetMockTodos([{ ...createMockTodos(1)[0], id: 'todo-1', is_completed: false }]);

      const { result } = renderHook(() => useTodos(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const toggled = await act(async () => {
        return result.current.toggleTodo('todo-1', false);
      });

      expect(toggled.is_completed).toBe(true);
    });
  });

  describe('filters and pagination', () => {
    it('should trigger refetch when filters change', async () => {
      resetMockTodos(createMockTodos(3));

      const { result } = renderHook(() => useTodos(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.setFilters({ priority: 'high' });
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.filters.priority).toBe('high');
    });

    it('should trigger refetch when page changes', async () => {
      resetMockTodos(createMockTodos(30));

      const { result } = renderHook(() => useTodos(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.setPage(2);
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.page).toBe(2);
    });

    it('should trigger refetch when limit changes', async () => {
      resetMockTodos(createMockTodos(10));

      const { result } = renderHook(() => useTodos(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.setLimit(5);
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.limit).toBe(5);
    });
  });
});
