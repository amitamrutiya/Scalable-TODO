import { useState, useCallback, useEffect } from 'react';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';
import type { UpdateProfileData, UpdatePasswordData, UserWithStats } from '@/types';

interface UseProfileReturn {
  profile: UserWithStats | null;
  isLoading: boolean;
  error: string | null;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  updatePassword: (data: UpdatePasswordData) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useProfile(): UseProfileReturn {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState<UserWithStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await authService.getMe();
      setProfile(userData);
      setUser(userData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  const updateProfile = useCallback(async (data: UpdateProfileData): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await authService.updateProfile(data);
      setProfile(updated);
      setUser(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  const updatePassword = useCallback(async (data: UpdatePasswordData): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.updatePassword(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update password';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setProfile(user);
      setIsLoading(false);
    } else {
      refreshProfile();
    }
  }, [user, refreshProfile]);

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    updatePassword,
    refreshProfile,
  };
}
