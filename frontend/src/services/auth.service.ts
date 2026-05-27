import { api } from './api';
import { toast } from '@/contexts/ToastContext';
import type {
  LoginCredentials,
  SignupData,
  User,
  UpdateProfileData,
  UpdatePasswordData,
  UserWithStats,
} from '@/types';

export const authService = {
  async signup(data: SignupData): Promise<{ access_token: string; user: User }> {
    const response = await api.post('/auth/signup', data);
    const responseData = response.data as any;
    const access_token = responseData.data?.tokens?.access_token;
    const user = responseData.data?.user;
    toast.success('Account created successfully!');
    return { access_token, user };
  },

  async login(credentials: LoginCredentials): Promise<{ access_token: string; user: User }> {
    const response = await api.post('/auth/login', credentials);
    const responseData = response.data as any;
    const access_token = responseData.data?.tokens?.access_token;
    const user = responseData.data?.user;
    toast.success('Welcome back!');
    return { access_token, user };
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
    toast.success('Logged out successfully');
  },

  async getMe(): Promise<UserWithStats> {
    const response = await api.get('/users/me');
    const responseData = response.data as any;
    return responseData.data || responseData;
  },

  async updateProfile(data: UpdateProfileData): Promise<UserWithStats> {
    const response = await api.patch('/users/me', data);
    const responseData = response.data as any;
    return responseData.data || responseData;
  },

  async updatePassword(data: UpdatePasswordData): Promise<void> {
    await api.patch('/users/me', data);
  },
};
