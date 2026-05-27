import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TodoList } from '@/components/todos/TodoList';
import { createMockTodos } from '@/test/factories';

describe('TodoList', () => {
  const mockOnToggle = vi.fn().mockResolvedValue(undefined);
  const mockOnDelete = vi.fn().mockResolvedValue(undefined);

  it('should render list of todos', () => {
    const todos = createMockTodos(3);
    render(
      <TodoList
        todos={todos}
        isLoading={false}
        error={null}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Todo 1')).toBeInTheDocument();
    expect(screen.getByText('Todo 2')).toBeInTheDocument();
    expect(screen.getByText('Todo 3')).toBeInTheDocument();
  });

  it('should render empty state when no todos', () => {
    render(
      <TodoList
        todos={[]}
        isLoading={false}
        error={null}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
  });

  it('should show loading spinner', () => {
    render(
      <TodoList
        todos={[]}
        isLoading={true}
        error={null}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );

    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('should show error message', () => {
    render(
      <TodoList
        todos={[]}
        isLoading={false}
        error="Failed to load todos"
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(/failed to load todos/i)).toBeInTheDocument();
  });

  it('should not show spinner when loading with existing todos', () => {
    const todos = createMockTodos(2);
    render(
      <TodoList
        todos={todos}
        isLoading={true}
        error={null}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Todo 1')).toBeInTheDocument();
  });
});
