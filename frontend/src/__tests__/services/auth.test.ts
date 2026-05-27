import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from '@/services/auth.service';
import { storage } from '@/utils/storage';
import { createMockAuthResponse, createMockUserWithStats } from '@/test/factories';

describe('authService', () => {
  beforeEach(() => {
    storage.removeToken();
  });

  describe('signup', () => {
    it('should signup with valid data and return auth response', async () => {
      const data = {
        email: 'newuser@example.com',
        password: 'password123',
        display_name: 'New User',
      };

      const result = await authService.signup(data);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.access_token).toBe('mock-signup-token');
    });

    it('should throw error with invalid data', async () => {
      const data = {
        email: '',
        password: 'password123',
        display_name: 'New User',
      };

      await expect(authService.signup(data)).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login with valid credentials and return auth response', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await authService.login(credentials);

      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe('mock-login-token');
    });

    it('should throw error with invalid credentials', async () => {
      const credentials = {
        email: 'wrong@example.com',
        password: 'password123',
      };

      await expect(authService.login(credentials)).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      await expect(authService.logout()).resolves.not.toThrow();
    });
  });

  describe('getMe', () => {
    it('should return user data when authenticated', async () => {
      storage.setToken('mock-token');

      const result = await authService.getMe();

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('stats');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw error when not authenticated', async () => {
      storage.removeToken();

      await expect(authService.getMe()).rejects.toThrow();
    });
  });

  describe('updateProfile', () => {
    it('should update display name', async () => {
      storage.setToken('mock-token');

      const result = await authService.updateProfile({ display_name: 'Updated Name' });

      expect(result.display_name).toBe('Updated Name');
    });
  });
});
