// Type definitions for authentication and user management

import { JWT } from 'next-auth/jwt';
import { Session } from 'next-auth';

// User profile
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: UserRole;
  createdAt: number;
  updatedAt: number;
}

// User roles for authorization
export type UserRole = 'user' | 'analyst' | 'admin';

// Extended JWT with custom fields
export interface ExtendedJWT extends JWT {
  id: string;
  role: UserRole;
}

// Extended Session with custom fields
export interface ExtendedSession extends Session {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    role: UserRole;
  };
}

// Login credentials
export interface LoginCredentials {
  email: string;
  password: string;
}

// Registration data
export interface RegistrationData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Password reset request
export interface PasswordResetRequest {
  email: string;
}

// Password reset data
export interface PasswordResetData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// User profile update data
export interface UserProfileUpdate {
  name?: string;
  email?: string;
  image?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

// Auth form states
export type AuthFormState = 'idle' | 'submitting' | 'success' | 'error';

// Auth form field validation errors
export interface AuthFormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

// API registration request body
export interface RegisterRequestBody {
  name: string;
  email: string;
  password: string;
}

// API login request body
export interface LoginRequestBody {
  email: string;
  password: string;
}

// API response for auth operations
export interface AuthApiResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  error?: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}

// User preferences
export interface UserPreferences {
  userId: string;
  theme: 'dark' | 'light' | 'system';
  dashboardLayout?: string;
  notifications: {
    email: boolean;
    dashboard: boolean;
    criticalOnly: boolean;
  };
  alertSettings: {
    minSeverity: 'low' | 'medium' | 'high' | 'critical';
    threatTypes: string[];
  };
}

// User session activity
export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  timestamp: number;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

// Role-based permissions
export interface Permission {
  action: string;
  subject: string;
  conditions?: Record<string, any>;
}

export type PermissionMap = Record<UserRole, Permission[]>;

// Default permissions by role
export const defaultPermissions: PermissionMap = {
  user: [
    { action: 'read', subject: 'dashboard' },
    { action: 'read', subject: 'vulnerabilities' },
    { action: 'read', subject: 'attacks' },
    { action: 'read', subject: 'predictions' },
    { action: 'read', subject: 'profile' },
    { action: 'update', subject: 'profile' },
  ],
  analyst: [
    { action: 'read', subject: 'dashboard' },
    { action: 'read', subject: 'vulnerabilities' },
    { action: 'read', subject: 'attacks' },
    { action: 'read', subject: 'predictions' },
    { action: 'read', subject: 'profile' },
    { action: 'update', subject: 'profile' },
    { action: 'create', subject: 'predictions' },
    { action: 'update', subject: 'predictions' },
    { action: 'read', subject: 'indicators' },
    { action: 'create', subject: 'indicators' },
    { action: 'update', subject: 'indicators' },
  ],
  admin: [
    { action: 'manage', subject: 'all' },
  ],
};