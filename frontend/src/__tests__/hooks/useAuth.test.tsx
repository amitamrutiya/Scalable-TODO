import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuthActions } from '@/hooks/useAuth';
import { storage } from '@/utils/storage';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

describe('useAuthActions', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    storage.removeToken();
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should store token and set user on successful login', async () => {
      const { result } = renderHook(() => useAuthActions(), { wrapper });

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password123' });
      });

      expect(storage.getToken()).toBe('mock-login-token');
    });

    it('should set error on failed login', async () => {
      const { result } = renderHook(() => useAuthActions(), { wrapper });

      await act(async () => {
        try {
          await result.current.login({ email: 'wrong@example.com', password: 'password123' });
        } catch {
          // expected
        }
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('signup', () => {
    it('should store token and set user on successful signup', async () => {
      const { result } = renderHook(() => useAuthActions(), { wrapper });

      await act(async () => {
        await result.current.signup({
          email: 'newuser@example.com',
          password: 'password123',
          display_name: 'New User',
        });
      });

      expect(storage.getToken()).toBe('mock-signup-token');
    });

    it('should set error on failed signup', async () => {
      server.use(
        http.post('*/auth/signup', () =>
          HttpResponse.json({ message: 'Email already taken' }, { status: 409 })
        )
      );

      const { result } = renderHook(() => useAuthActions(), { wrapper });

      await act(async () => {
        try {
          await result.current.signup({
            email: 'existing@example.com',
            password: 'password123',
            display_name: 'Existing User',
          });
        } catch {
          // expected
        }
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });
    });
  });

  describe('logout', () => {
    it('should clear token and user on logout', async () => {
      storage.setToken('mock-token');
      const { result } = renderHook(() => useAuthActions(), { wrapper });

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password123' });
      });

      expect(storage.getToken()).toBe('mock-login-token');

      await act(async () => {
        await result.current.logout();
      });

      expect(storage.getToken()).toBeNull();
    });

    it('should still clear state if logout API fails', async () => {
      server.use(
        http.post('*/auth/logout', () =>
          HttpResponse.json({ message: 'Server error' }, { status: 500 })
        )
      );

      storage.setToken('mock-token');
      const { result } = renderHook(() => useAuthActions(), { wrapper });

      await act(async () => {
        await result.current.logout();
      });

      expect(storage.getToken()).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      const { result } = renderHook(() => useAuthActions(), { wrapper });

      await act(async () => {
        try {
          await result.current.login({ email: 'wrong@example.com', password: 'pass' });
        } catch {
          // expected
        }
      });

      await waitFor(() => expect(result.current.error).not.toBeNull());

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
