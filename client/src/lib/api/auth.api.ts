/**
 * Auth API
 * All authentication-related API calls
 */

import apiClient, { unwrapResponse } from './client';
import type { ApiSuccessResponse } from './client';

// ===================
// Types
// ===================

export interface SignupParams {
  email: string;
  password: string;
  name?: string;
}

export interface LoginParams {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt?: string;
}

export interface AuthResult {
  user: User;
  sessionId: string;
}

export interface SessionInfo {
  valid: boolean;
  userId: string;
  expiresAt: string;
}

// ===================
// API Functions
// ===================

/**
 * Create a new account
 */
export async function signup(params: SignupParams): Promise<AuthResult> {
  const response = await apiClient.post<ApiSuccessResponse<AuthResult>>(
    '/auth/signup',
    params
  );
  return unwrapResponse(response.data);
}

/**
 * Login to existing account
 */
export async function login(params: LoginParams): Promise<AuthResult> {
  const response = await apiClient.post<ApiSuccessResponse<AuthResult>>(
    '/auth/login',
    params
  );
  return unwrapResponse(response.data);
}

/**
 * Logout and invalidate session
 */
export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

/**
 * Get current authenticated user
 */
export async function me(): Promise<User> {
  const response = await apiClient.get<ApiSuccessResponse<User>>(
    '/auth/me'
  );
  return unwrapResponse(response.data);
}

/**
 * Check if current session is valid
 */
export async function checkSession(): Promise<SessionInfo> {
  const response = await apiClient.get<ApiSuccessResponse<SessionInfo>>(
    '/auth/session'
  );
  return unwrapResponse(response.data);
}

// Export as namespace
export const authApi = {
  signup,
  login,
  logout,
  me,
  checkSession,
};

