'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api } from '@/lib/api';
import { ApiResponse, AuthContextType, LoginInput, RegisterInput, User } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session via GET /api/v1/auth/me
  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
      if (response.data.success && response.data.data?.user) {
        setUser(response.data.data.user);
        return response.data.data.user;
      }
      setUser(null);
      return null;
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (credentials: LoginInput): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await api.post<ApiResponse<{ user: User }>>(
        '/auth/login',
        credentials
      );
      const authenticatedUser = response.data.data?.user;
      if (!authenticatedUser) {
        throw new Error('Authentication succeeded but user data was missing.');
      }
      setUser(authenticatedUser);
      return authenticatedUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterInput): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await api.post<ApiResponse<{ user: User }>>(
        '/auth/register',
        data
      );
      const registeredUser = response.data.data?.user;
      if (!registeredUser) {
        throw new Error('Registration succeeded but user data was missing.');
      }
      setUser(registeredUser);
      return registeredUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const demoLogin = useCallback(async (): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await api.post<ApiResponse<{ user: User }>>('/auth/demo');
      const demoUser = response.data.data?.user;
      if (!demoUser) {
        throw new Error('Demo login succeeded but user data was missing.');
      }
      setUser(demoUser);
      return demoUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      demoLogin,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, register, demoLogin, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
