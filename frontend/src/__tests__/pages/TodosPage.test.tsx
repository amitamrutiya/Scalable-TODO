import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { TodosPage } from '@/pages/TodosPage';
import { storage } from '@/utils/storage';
import { resetMockTodos } from '@/mocks/handlers';
import { createMockTodos } from '@/test/factories';

describe('TodosPage', () => {
  beforeEach(() => {
    storage.setToken('mock-token');
    resetMockTodos(createMockTodos(5));
  });

  it('should render page header', async () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <TodosPage />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByRole('heading', { name: /my tasks/i })).toBeInTheDocument();
  });

  it('should render todo list after loading', async () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <TodosPage />
        </MemoryRouter>
      </AuthProvider>
    );

    const todoItems = await screen.findAllByText(/Todo \d/i);
    expect(todoItems.length).toBeGreaterThan(0);
  });

  it('should allow adding a new todo', async () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <TodosPage />
        </MemoryRouter>
      </AuthProvider>
    );

    const addButton = screen.getByRole('button', { name: /add new task/i });
    await userEvent.click(addButton);

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
  });
});
