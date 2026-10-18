import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '@/types';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const AUTH_BYPASS_URLS = [
  '/auth/login',
  '/auth/register',
  '/auth/demo',
  '/auth/refresh',
  '/auth/logout',
];

// Response interceptor to handle silent token refresh on 401 responses
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as CustomAxiosRequestConfig | undefined;

    if (!originalRequest || !error.response) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url || '';
    const isBypassUrl = AUTH_BYPASS_URLS.some((url) => requestUrl.includes(url));

    if (error.response.status === 401 && !originalRequest._retry && !isBypassUrl) {
      originalRequest._retry = true;

      try {
        await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: { 'Content-Type': 'application/json' },
          }
        );
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export function getApiErrorMessage(
  error: unknown,
  fallback: string = 'An unexpected error occurred. Please try again.'
): string {
  if (axios.isAxiosError(error)) {
    const apiResponse = error.response?.data as ApiResponse | undefined;
    if (apiResponse?.error?.message) {
      return apiResponse.error.message;
    }
    if (typeof error.response?.data === 'string') {
      return error.response.data;
    }
    if (error.message) {
      return error.message;
    }
  } else if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export default api;
