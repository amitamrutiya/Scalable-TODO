import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoItem } from '@/components/todos/TodoItem';
import { createMockTodo } from '@/test/factories';

describe('TodoItem', () => {
  const mockOnToggle = vi.fn().mockResolvedValue(undefined);
  const mockOnDelete = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    (window.confirm as ReturnType<typeof vi.fn>).mockReturnValue(true);
  });

  it('should render todo with title and description', () => {
    const todo = createMockTodo({ title: 'Buy groceries', description: 'Need milk' });
    render(<TodoItem todo={todo} onToggle={mockOnToggle} onDelete={mockOnDelete} />);

    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
    expect(screen.getByText('Need milk')).toBeInTheDocument();
  });

  it('should render priority badge', () => {
    const todo = createMockTodo({ priority: 'high' });
    render(<TodoItem todo={todo} onToggle={mockOnToggle} onDelete={mockOnDelete} />);

    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('should call onToggle when checkbox is clicked', async () => {
    const todo = createMockTodo({ id: 'todo-1', is_completed: false });
    render(<TodoItem todo={todo} onToggle={mockOnToggle} onDelete={mockOnDelete} />);

    const toggleButton = screen.getAllByRole('button')[0];
    await userEvent.click(toggleButton);

    expect(mockOnToggle).toHaveBeenCalledWith('todo-1', false);
  });

  it('should call onDelete when delete button is clicked', async () => {
    const todo = createMockTodo({ id: 'todo-1' });
    render(<TodoItem todo={todo} onToggle={mockOnToggle} onDelete={mockOnDelete} />);

    const deleteButton = screen.getByRole('button', { name: /delete task/i });
    await userEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockOnDelete).toHaveBeenCalledWith('todo-1');
  });

  it('should not call onDelete if confirm is cancelled', async () => {
    (window.confirm as ReturnType<typeof vi.fn>).mockReturnValue(false);

    const todo = createMockTodo({ id: 'todo-1' });
    render(<TodoItem todo={todo} onToggle={mockOnToggle} onDelete={mockOnDelete} />);

    const deleteButton = screen.getByRole('button', { name: /delete task/i });
    await userEvent.click(deleteButton);

    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('should show completed state visually', () => {
    const todo = createMockTodo({ is_completed: true });
    render(<TodoItem todo={todo} onToggle={mockOnToggle} onDelete={mockOnDelete} />);

    expect(screen.getByText('Test Todo')).toHaveClass('line-through');
  });

  it('should render tags', () => {
    const todo = createMockTodo({ tags: ['work', 'urgent'] });
    render(<TodoItem todo={todo} onToggle={mockOnToggle} onDelete={mockOnDelete} />);

    expect(screen.getByText('work')).toBeInTheDocument();
    expect(screen.getByText('urgent')).toBeInTheDocument();
  });
});
