/**
 * API Client
 * Axios instance with interceptors for authentication, error handling, and retry logic
 */

import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 120000, // 120 seconds (Polygon.io rate limiting can cause 40+ second delays)
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for session auth
});

// ===================
// Request Interceptor
// ===================

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Log requests in development
    if (import.meta.env.DEV) {
      console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    // Add authentication token if available
    // Try to get token from localStorage (auth-storage)
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const authData = JSON.parse(authStorage);
        const token = authData?.state?.token;
        if (token && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      // Ignore errors reading from localStorage
    }
    
    // Add timestamp to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ===================
// Response Interceptor
// ===================

apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.url}`, response.data);
    }
    
    return response;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    // Log errors in development
    if (import.meta.env.DEV) {
      console.error(`❌ API Error: ${error.config?.url}`, error.response?.data);
    }
    
    // Handle specific error codes
    if (error.response) {
      const status = error.response.status;
      
      // Unauthorized - session expired
      if (status === 401) {
        // Clear auth state
        try {
          const authStorage = localStorage.getItem('auth-storage');
          if (authStorage) {
            const authData = JSON.parse(authStorage);
            if (authData?.state) {
              authData.state.user = null;
              authData.state.token = null;
              authData.state.isAuthenticated = false;
              localStorage.setItem('auth-storage', JSON.stringify(authData));
            }
          }
        } catch (error) {
          // Ignore errors
        }
        
        // Redirect to home page if not already there
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      }
      
      // Rate limited
      if (status === 429) {
        // Could implement retry logic here
        console.warn('Rate limited, please wait before retrying');
      }
      
      // Server error
      if (status >= 500) {
        console.error('Server error, please try again later');
      }
    }
    
    // Network error
    if (!error.response) {
      const isNetworkError = error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error');
      if (isNetworkError) {
        console.error('❌ Cannot connect to server. Make sure the server is running on http://localhost:3001');
        console.error('   Run: cd server && npm run dev');
      } else {
        console.error('Network error, please check your connection');
      }
    }
    
    return Promise.reject(error);
  }
);

// ===================
// Types
// ===================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp?: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ===================
// Helper Functions
// ===================

/**
 * Extract data from API response
 * Throws if response is an error
 */
export function unwrapResponse<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new ApiClientError(response.error.code, response.error.message, response.error.details);
  }
  return response.data;
}

/**
 * Custom error class for API errors
 */
export class ApiClientError extends Error {
  public readonly code: string;
  public readonly details?: unknown;
  
  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Check if error is an API error
 */
export function isApiError(error: unknown): error is AxiosError<ApiErrorResponse> {
  return axios.isAxiosError(error) && error.response?.data?.success === false;
}

/**
 * Get error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.response?.data.error.message || 'An error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

export default apiClient;

