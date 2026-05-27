import { api } from './api';
import type {
  LoginCredentials,
  SignupData,
  AuthResponse,
  UpdateProfileData,
  UpdatePasswordData,
  UserWithStats,
} from '@/types';

export const authService = {
  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/signup', data);
    return response.data;
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getMe(): Promise<UserWithStats> {
    const response = await api.get<UserWithStats>('/users/me');
    return response.data;
  },

  async updateProfile(data: UpdateProfileData): Promise<UserWithStats> {
    const response = await api.patch<UserWithStats>('/users/me', data);
    return response.data;
  },

  async updatePassword(data: UpdatePasswordData): Promise<void> {
    await api.patch('/users/me', data);
  },
};
