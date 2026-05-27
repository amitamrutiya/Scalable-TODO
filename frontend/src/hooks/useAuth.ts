import { useState, useCallback } from 'react';
import { authService } from '@/services/auth.service';
import { useAuth as useAuthContext } from '@/contexts/AuthContext';
import { storage } from '@/utils/storage';
import type { LoginCredentials, SignupData } from '@/types';

interface UseAuthReturn {
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export function useAuthActions(): UseAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser, logout: clearUser } = useAuthContext();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials);
      storage.setToken(response.access_token);
      const user = await authService.getMe();
      setUser(user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  const signup = useCallback(async (data: SignupData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.signup(data);
      storage.setToken(response.access_token);
      const user = await authService.getMe();
      setUser(user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch {
      // Ignore logout errors
    } finally {
      storage.removeToken();
      clearUser();
      setIsLoading(false);
    }
  }, [clearUser]);

  return {
    isLoading,
    error,
    login,
    signup,
    logout,
    clearError,
  };
}

export function useInitializeAuth() {
  const { isLoading } = useAuthContext();
  return isLoading;
}
