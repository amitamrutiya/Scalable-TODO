import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { LoginPage } from '@/pages/LoginPage';
import { TodosPage } from '@/pages/TodosPage';
import { storage } from '@/utils/storage';
import { resetMockTodos } from '@/mocks/handlers';
import { createMockTodos } from '@/test/factories';

describe('Integration: Login Flow', () => {
  beforeEach(() => {
    storage.removeToken();
    resetMockTodos(createMockTodos(3));
  });

  it('should complete full login and view todos flow', async () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/todos" element={<TodosPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    // Step 1: Login page renders
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();

    // Step 2: Fill in credentials and submit
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Step 3: Token should be stored
    expect(storage.getToken()).toBe('mock-login-token');
  });
});
