import axios, { AxiosError } from 'axios';
import { storage } from '@/utils/storage';
import { toast } from '@/contexts/ToastContext';

const API_BASE_URL = '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors and show specific validation messages
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as Record<string, unknown> | undefined;
      const message = typeof data?.message === 'string' ? data.message : '';

      switch (status) {
        case 400: {
          // Show specific validation errors from details array
          const details = Array.isArray(data?.details) ? data.details : [];
          if (details.length > 0) {
            // Show each validation error as a separate toast
            details.forEach((detail: any) => {
              const detailMessage = detail.message || String(detail);
              toast.error(detailMessage);
            });
          } else {
            toast.error(message || 'Validation failed');
          }
          break;
        }
        case 401:
          toast.error('Session expired. Please login again.');
          storage.removeToken();
          window.location.href = '/login';
          break;
        case 403:
          toast.error('Access denied.');
          break;
        case 404:
          toast.error('Resource not found.');
          break;
        case 409:
          toast.error('Resource already exists.');
          break;
        case 500:
          toast.error('Server error. Please try again.');
          break;
        default:
          toast.error(message || 'An error occurred. Please try again.');
      }
    } else {
      toast.error('Network error. Check your connection.');
    }

    return Promise.reject(error);
  }
);
