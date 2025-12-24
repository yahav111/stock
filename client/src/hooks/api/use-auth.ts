/**
 * Auth React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi, type SignupParams, type LoginParams, type User } from '../../lib/api';
import { useAuthStore } from '../../stores/auth-store';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  session: () => [...authKeys.all, 'session'] as const,
};

/**
 * Hook to get current user
 */
export function useCurrentUser(enabled = true) {
  const { setUser } = useAuthStore();
  
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: async () => {
      try {
        const user = await authApi.me();
        setUser(user);
        return user;
      } catch {
        setUser(null);
        throw new Error('Not authenticated');
      }
    },
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for signup
 */
export function useSignup() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: (params: SignupParams) => authApi.signup(params),
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(authKeys.user(), data.user);
      navigate('/dashboard');
    },
  });
}

/**
 * Hook for login
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: (params: LoginParams) => authApi.login(params),
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(authKeys.user(), data.user);
      navigate('/dashboard');
    },
  });
}

/**
 * Hook for logout
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      setUser(null);
      queryClient.clear(); // Clear all cached data
      navigate('/login');
    },
    onError: () => {
      // Logout anyway on error
      setUser(null);
      queryClient.clear();
      navigate('/login');
    },
  });
}

/**
 * Hook to check session validity
 */
export function useCheckSession() {
  return useQuery({
    queryKey: authKeys.session(),
    queryFn: authApi.checkSession,
    retry: false,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Combined auth hook with all actions
 */
export function useAuth() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const currentUserQuery = useCurrentUser(!user);
  const loginMutation = useLogin();
  const signupMutation = useSignup();
  const logoutMutation = useLogout();
  
  return {
    user,
    isAuthenticated,
    isLoading: isLoading || currentUserQuery.isLoading,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
    signup: signupMutation.mutate,
    signupAsync: signupMutation.mutateAsync,
    signupError: signupMutation.error,
    isSigningUp: signupMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}

