import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { createMockUserWithStats } from '@/test/factories';

describe('AuthContext', () => {
  it('should provide default unauthenticated state', () => {
    function TestComponent() {
      const { isAuthenticated, user } = useAuth();
      return (
        <div>
          <span data-testid="auth">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</span>
          <span data-testid="user">{user ? user.display_name : 'no-user'}</span>
        </div>
      );
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth')).toHaveTextContent('unauthenticated');
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
  });

  it('should provide user data after setUser is called', async () => {
    function TestComponent() {
      const { isAuthenticated, user, setUser } = useAuth();
      return (
        <div>
          <span data-testid="auth">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</span>
          <span data-testid="user">{user ? user.display_name : 'no-user'}</span>
          <button onClick={() => setUser(createMockUserWithStats())}>Set User</button>
        </div>
      );
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth')).toHaveTextContent('unauthenticated');

    await userEvent.click(screen.getByRole('button', { name: /set user/i }));

    expect(screen.getByTestId('auth')).toHaveTextContent('authenticated');
    expect(screen.getByTestId('user')).toHaveTextContent('Test User');
  });

  it('should clear user data after logout', async () => {
    function TestComponent() {
      const { isAuthenticated, user, setUser, logout } = useAuth();
      return (
        <div>
          <span data-testid="auth">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</span>
          <span data-testid="user">{user ? user.display_name : 'no-user'}</span>
          <button onClick={() => setUser(createMockUserWithStats())}>Set User</button>
          <button onClick={logout}>Logout</button>
        </div>
      );
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: /set user/i }));

    expect(screen.getByTestId('auth')).toHaveTextContent('authenticated');

    await userEvent.click(screen.getByRole('button', { name: /logout/i }));

    expect(screen.getByTestId('auth')).toHaveTextContent('unauthenticated');
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
  });
});
