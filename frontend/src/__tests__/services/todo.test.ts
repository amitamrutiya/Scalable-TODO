import { describe, it, expect, beforeEach } from 'vitest';
import { todoService } from '@/services/todo.service';
import { storage } from '@/utils/storage';
import { resetMockTodos, getMockTodos } from '@/mocks/handlers';
import { createMockTodo, createMockTodos } from '@/test/factories';

describe('todoService', () => {
  beforeEach(() => {
    storage.setToken('mock-token');
    resetMockTodos([]);
  });

  describe('getTodos', () => {
    it('should fetch todos with default params', async () => {
      resetMockTodos(createMockTodos(3));

      const result = await todoService.getTodos();

      expect(result.data).toHaveLength(3);
      expect(result.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: 3,
        total_pages: 1,
      });
    });

    it('should fetch todos with query params', async () => {
      resetMockTodos([
        createMockTodo({ id: 'todo-1', priority: 'high', is_completed: false }),
        createMockTodo({ id: 'todo-2', priority: 'low', is_completed: true }),
        createMockTodo({ id: 'todo-3', priority: 'high', is_completed: false }),
      ]);

      const result = await todoService.getTodos({
        priority: 'high',
        status: 'pending',
      });

      expect(result.data).toHaveLength(2);
      expect(result.data.every((t) => t.priority === 'high')).toBe(true);
    });

    it('should support pagination', async () => {
      resetMockTodos(createMockTodos(25));

      const result = await todoService.getTodos({ page: 2, limit: 10 });

      expect(result.data).toHaveLength(10);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.total_pages).toBe(3);
    });

    it('should support search filter', async () => {
      resetMockTodos([
        createMockTodo({ id: 'todo-1', title: 'Buy groceries' }),
        createMockTodo({ id: 'todo-2', title: 'Walk the dog' }),
        createMockTodo({ id: 'todo-3', title: 'Buy milk' }),
      ]);

      const result = await todoService.getTodos({ search: 'buy' });

      expect(result.data).toHaveLength(2);
    });

    it('should support tag filter', async () => {
      resetMockTodos([
        createMockTodo({ id: 'todo-1', tags: ['work'] }),
        createMockTodo({ id: 'todo-2', tags: ['personal'] }),
        createMockTodo({ id: 'todo-3', tags: ['work', 'urgent'] }),
      ]);

      const result = await todoService.getTodos({ tag: 'work' });

      expect(result.data).toHaveLength(2);
    });
  });

  describe('createTodo', () => {
    it('should create a new todo', async () => {
      const data = {
        title: 'New Todo',
        description: 'Description',
        priority: 'high' as const,
        tags: ['tag1', 'tag2'],
      };

      const result = await todoService.createTodo(data);

      expect(result.title).toBe('New Todo');
      expect(result.priority).toBe('high');
      expect(result.tags).toEqual(['tag1', 'tag2']);
      expect(result.is_completed).toBe(false);
      expect(getMockTodos()).toHaveLength(1);
    });
  });

  describe('updateTodo', () => {
    it('should update todo with partial data', async () => {
      resetMockTodos([createMockTodo({ id: 'todo-1', title: 'Old Title' })]);

      const result = await todoService.updateTodo('todo-1', {
        title: 'Updated Title',
        is_completed: true,
      });

      expect(result.title).toBe('Updated Title');
      expect(result.is_completed).toBe(true);
    });

    it('should throw error for non-existent todo', async () => {
      await expect(
        todoService.updateTodo('non-existent', { title: 'New' })
      ).rejects.toThrow();
    });
  });

  describe('deleteTodo', () => {
    it('should delete todo', async () => {
      resetMockTodos([createMockTodo({ id: 'todo-1' })]);

      await todoService.deleteTodo('todo-1');

      expect(getMockTodos()).toHaveLength(0);
    });

    it('should throw error for non-existent todo', async () => {
      await expect(todoService.deleteTodo('non-existent')).rejects.toThrow();
    });
  });
});
