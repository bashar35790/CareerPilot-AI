export type UserRole = 'USER' | 'ADMIN';
export type CareerLevel = 'ENTRY' | 'JUNIOR' | 'MID' | 'SENIOR';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  targetRole: string | null;
  careerLevel: CareerLevel;
  createdAt: string;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  targetRole?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
  };
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginInput) => Promise<User>;
  register: (data: RegisterInput) => Promise<User>;
  demoLogin: () => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}
