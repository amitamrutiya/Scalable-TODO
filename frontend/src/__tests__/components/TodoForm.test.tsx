import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoForm } from '@/components/todos/TodoForm';

describe('TodoForm', () => {
  const mockSubmit = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show add button initially', () => {
    render(<TodoForm onSubmit={mockSubmit} />);
    expect(screen.getByRole('button', { name: /add new task/i })).toBeInTheDocument();
  });

  it('should expand form when add button is clicked', async () => {
    render(<TodoForm onSubmit={mockSubmit} />);

    await userEvent.click(screen.getByRole('button', { name: /add new task/i }));

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    render(<TodoForm onSubmit={mockSubmit} />);

    await userEvent.click(screen.getByRole('button', { name: /add new task/i }));
    await userEvent.type(screen.getByLabelText(/title/i), 'New Task');
    await userEvent.type(screen.getByLabelText(/description/i), 'Task description');
    await userEvent.click(screen.getByRole('button', { name: /create task/i }));

    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'New Task',
        description: 'Task description',
        priority: 'medium',
      })
    );
  });

  it('should show loading state during submission', async () => {
    render(<TodoForm onSubmit={mockSubmit} isLoading />);
    await userEvent.click(screen.getByRole('button', { name: /add new task/i }));

    const submitButton = screen.getByRole('button', { name: /create task/i });
    expect(submitButton).toBeDisabled();
  });

  it('should collapse form when cancel is clicked', async () => {
    render(<TodoForm onSubmit={mockSubmit} />);

    await userEvent.click(screen.getByRole('button', { name: /add new task/i }));
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.queryByLabelText(/title/i)).not.toBeInTheDocument();
  });

  it('should parse comma-separated tags', async () => {
    render(<TodoForm onSubmit={mockSubmit} />);

    await userEvent.click(screen.getByRole('button', { name: /add new task/i }));
    await userEvent.type(screen.getByLabelText(/title/i), 'Tagged Task');
    await userEvent.type(screen.getByLabelText(/tags/i), 'work, urgent, important');
    await userEvent.click(screen.getByRole('button', { name: /create task/i }));

    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: ['work', 'urgent', 'important'],
      })
    );
  });

  it('should require title field', async () => {
    render(<TodoForm onSubmit={mockSubmit} />);

    await userEvent.click(screen.getByRole('button', { name: /add new task/i }));
    const titleInput = screen.getByLabelText(/title/i);
    expect(titleInput).toHaveAttribute('required');
  });
});
