import axios, { AxiosInstance, AxiosResponse, AxiosError, CancelToken } from 'axios';
import { toast } from 'react-hot-toast';
import { 
  AuthResponse, 
  LoginCredentials, 
  RegisterData, 
  TwoFactorSetup,
  PasswordResetRequest,
  PasswordResetConfirm,
  User,
  ApiResponse,
  ApiError
} from '@/types/auth';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Rate limit tracker
const rateLimitTracker = new Map<string, { count: number; resetTime: number }>();

// Function to check rate limits before making requests
const checkRateLimit = (endpoint: string, limit: number = 5, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const tracker = rateLimitTracker.get(endpoint);
  
  if (!tracker || now > tracker.resetTime) {
    rateLimitTracker.set(endpoint, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (tracker.count >= limit) {
    const waitTime = Math.ceil((tracker.resetTime - now) / 1000);
    console.warn(`Rate limit reached for ${endpoint}. Wait ${waitTime} seconds.`);
    return false;
  }
  
  tracker.count++;
  return true;
};

// Token refresh tracking
let isRefreshingToken = false;
let refreshTokenPromise: Promise<string> | null = null;

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    
    // Skip auth for auth endpoints
    const skipAuthEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
      '/auth/refresh-token',
      '/auth/verify-email',
      '/auth/resend-verification',
      '/health',
      '/public'
    ];
    
    const isSkipEndpoint = skipAuthEndpoints.some(endpoint => 
      config.url?.includes(endpoint)
    );
    
    if (!isSkipEndpoint) {
      let token = localStorage.getItem('accessToken');
      
      // Check if token is expired or about to expire (within 5 minutes)
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const expirationTime = payload.exp * 1000; // Convert to milliseconds
          const currentTime = Date.now();
          const timeUntilExpiry = expirationTime - currentTime;
          
          // If token expires within 5 minutes, refresh it
          if (timeUntilExpiry < 300000) { // 5 minutes = 300000ms
            
            if (!isRefreshingToken) {
              isRefreshingToken = true;
              refreshTokenPromise = refreshAccessToken();
            }
            
            if (refreshTokenPromise) {
              token = await refreshTokenPromise;
            }
          }
        } catch (error) {
          // Token parsing failed - attempt refresh
          // Token is malformed, try to refresh
          if (!isRefreshingToken) {
            isRefreshingToken = true;
            refreshTokenPromise = refreshAccessToken();
            if (refreshTokenPromise) {
              token = await refreshTokenPromise;
            }
          }
        }
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Add timestamp to prevent caching
    config.params = {
      ...config.params,
      _t: Date.now(),
    };
    
    // Log registration requests
    if (config.url?.includes('/auth/register')) {
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper function to refresh access token
const refreshAccessToken = async (): Promise<string> => {
  try {
    // Use refresh-token endpoint which reads refresh token from httpOnly cookie
    // This doesn't require an Authorization header
    const response = await api.post('/auth/refresh-token', {}, {
      headers: {
        // Don't send Authorization header for refresh
      },
      // Ensure cookies are sent
      withCredentials: true
    });
    
    if (response.data.success && response.data.accessToken) {
      const newToken = response.data.accessToken;
      localStorage.setItem('accessToken', newToken);
      
      // Update user data if provided
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return newToken;
    } else {
      throw new Error('Token refresh failed');
    }
  } catch (error) {
    console.error('[API] Token refresh failed:', error);
    // Clear tokens and redirect to login
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    
    // Clear auth store if available
    if ((window as any).useAuthStore) {
      (window as any).useAuthStore.getState().clearAuth();
    }
    
    throw error;
  } finally {
    isRefreshingToken = false;
    refreshTokenPromise = null;
  }
};

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    // Handle 429 rate limit errors specially
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const waitTime = retryAfter ? parseInt(retryAfter) : 60;
      
      // Don't show toast for every 429 error, just log it
      console.warn(`Rate limited. Retry after ${waitTime} seconds.`);
      
      // Set rate limit for this endpoint
      if (originalRequest.url) {
        const endpoint = originalRequest.url.split('?')[0];
        rateLimitTracker.set(endpoint, {
          count: 100, // Set to high number to block requests
          resetTime: Date.now() + (waitTime * 1000)
        });
      }
      
      return Promise.reject(error);
    }
    
    // Handle 403 Forbidden errors - don't try to refresh token for these
    if (error.response?.status === 403) {
      console.warn('403 Forbidden - Access denied');
      return Promise.reject(error);
    }
    
    // Skip refresh for certain endpoints
    const skipRefreshEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
      '/auth/refresh-token',
      '/auth/verify-2fa',
      '/auth/setup-2fa'
    ];
    
    const isSkipEndpoint = skipRefreshEndpoints.some(endpoint => 
      originalRequest.url?.includes(endpoint)
    );
    
    if (error.response?.status === 401 && !originalRequest._retry && !isSkipEndpoint) {
      originalRequest._retry = true;

      // Check if we have an access token
      const accessToken = localStorage.getItem('accessToken');

      // If no token, try refresh anyway (might have httpOnly cookie)
      if (!accessToken) {
        try {
          console.log('[API] No access token, attempting refresh from cookie...');
          const newToken = await refreshAccessToken();
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Only clear auth if refresh explicitly fails
          console.log('[API] Session expired, clearing auth');
          if ((window as any).useAuthStore) {
            (window as any).useAuthStore.getState().clearAuth();
          }
          toast.error('Your session has expired. Please log in again.');
          return Promise.reject(error);
        }
      }

      try {
        // Try to refresh token
        if (!isRefreshingToken) {
          console.log('[API] Refreshing expired token...');
          const newToken = await refreshAccessToken();

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } else {
          // Wait for existing refresh to complete
          if (refreshTokenPromise) {
            const newToken = await refreshTokenPromise;
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError: any) {
        console.error('[API] Token refresh failed:', refreshError);

        // Only clear auth and show message if it's truly expired (not network error)
        if (refreshError.response?.status === 401 || refreshError.response?.status === 403) {
          console.log('[API] Refresh token expired, clearing auth');
          if ((window as any).useAuthStore) {
            (window as any).useAuthStore.getState().clearAuth();
          }
          toast.error('Your session has expired. Please log in again.');
        } else {
          // Network error or temporary issue - don't logout
          console.warn('[API] Temporary refresh error, keeping session');
          toast.warning('Connection issue. Please try again.');
        }
        return Promise.reject(error);
      }
    }
    
    // Handle different error types
    if (error.response?.status === 403) {
      toast.error('Access denied. You do not have permission for this action.');
    } else if (error.response?.status === 404) {
      // Don't show generic toast for 404 errors - let components handle them
      // 404s are often expected (e.g., "no assigned therapist" for new clients)
      return Promise.reject(error);
    } else if (error.response?.status === 422) {
      // Validation errors are handled by individual components
      return Promise.reject(error);
    } else if (error.response?.status === 423) {
      // Account locked - don't show a toast here as the auth store handles it
      console.warn('Account locked:', (error.response.data as any)?.message);
      return Promise.reject(error);
    } else if (error.response?.status && error.response.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      toast.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authApi = {
  /**
   * Login user
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    
    if (response.data.success && response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }
    
    return response.data;
  },

  /**
   * Register new user
   */
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    
    const response = await api.post<AuthResponse>('/auth/register', userData);
    
    
    return response.data;
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    // Check if we have a token before trying to logout
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      try {
        await api.delete('/auth/logout');
      } catch (error) {
        // Continue with logout even if API call fails
        console.error('Logout API call failed:', error);
      }
    }
    
    // Always clear local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  },

  /**
   * Get current user
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data!;
  },

  /**
   * Refresh access token
   */
  refreshToken: async (): Promise<{ accessToken: string; user: User }> => {
    const response = await api.post<ApiResponse<{ accessToken: string; user: User }>>('/auth/refresh');
    
    if (response.data.success && response.data.data?.accessToken) {
      localStorage.setItem('accessToken', response.data.data.accessToken);
      if (response.data.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
    }
    
    return response.data.data!;
  },

  /**
   * Request password reset
   */
  forgotPassword: async (data: PasswordResetRequest): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>('/auth/forgot-password', data);
    return response.data;
  },

  /**
   * Confirm password reset
   */
  resetPassword: async (data: PasswordResetConfirm): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>('/auth/reset-password', data);
    return response.data;
  },

  /**
   * Verify email address with rate limit check
   */
  verifyEmail: async (token: string): Promise<ApiResponse> => {
    // Check rate limit before making request
    const endpoint = `/auth/verify-email/${token}`;
    if (!checkRateLimit(endpoint, 3, 60000)) { // Allow 3 attempts per minute
      throw {
        response: {
          status: 429,
          data: {
            success: false,
            message: 'Too many verification attempts. Please wait before trying again.'
          }
        }
      };
    }
    
    const response = await api.get<ApiResponse>(`/auth/verify-email/${token}`);
    return response.data;
  },

  /**
   * Resend verification email with rate limit check
   */
  resendVerificationEmail: async (email: string): Promise<ApiResponse> => {
    // Check rate limit before making request
    const endpoint = '/auth/resend-verification';
    if (!checkRateLimit(endpoint, 3, 30000)) { // Allow 3 attempts per 30 seconds
      throw {
        response: {
          status: 429,
          data: {
            success: false,
            message: 'Too many resend attempts. Please wait 30 seconds before trying again.'
          }
        }
      };
    }
    
    const response = await api.post<ApiResponse>('/auth/resend-verification', { email });
    return response.data;
  },

  /**
   * Setup 2FA
   */
  setup2FA: async (): Promise<TwoFactorSetup> => {
    const response = await api.post<ApiResponse<TwoFactorSetup>>('/auth/setup-2fa');
    return response.data.data!;
  },

  /**
   * Verify 2FA setup
   */
  verify2FA: async (code: string, secret?: string): Promise<AuthResponse> => {
    // Include temporary token if available (for 2FA verification during login)
    const tempToken = localStorage.getItem('tempToken');
    const headers: any = {};
    
    if (tempToken && !secret) {
      // Use temp token for login 2FA verification
      headers['X-Temp-Token'] = tempToken;
    }
    
    const response = await api.post<AuthResponse>('/auth/verify-2fa', { 
      code, 
      ...(secret && { secret }) 
    }, {
      headers
    });
    
    // Clear temp token after successful verification
    if (response.data.success && tempToken && !secret) {
      localStorage.removeItem('tempToken');
    }
    
    return response.data;
  },

  /**
   * Disable 2FA
   */
  disable2FA: async (code: string): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>('/auth/disable-2fa', { code });
    return response.data;
  },

  /**
   * Change password
   */
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>('/auth/change-password', data);
    return response.data;
  },

  /**
   * Get active sessions
   */
  getSessions: async (): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>('/auth/sessions');
    return response.data.data || [];
  },

  /**
   * Revoke session
   */
  revokeSession: async (sessionId: string): Promise<ApiResponse> => {
    const response = await api.delete<ApiResponse>(`/auth/sessions/${sessionId}`);
    return response.data;
  },

  /**
   * Revoke all sessions
   */
  revokeAllSessions: async (): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>('/auth/revoke-all-sessions');
    return response.data;
  },
};

// Users API endpoints
export const usersApi = {
  /**
   * Get user profile
   */
  getProfile: async (userId?: string): Promise<User> => {
    const endpoint = userId ? `/users/${userId}` : '/users/profile';
    const response = await api.get<ApiResponse<User>>(endpoint);
    return response.data.data!;
  },

  /**
   * Update user profile
   */
  updateProfile: async (userId: string, data: Partial<User>): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(`/users/${userId}`, data);
    return response.data.data!;
  },

  /**
   * Get user activity
   */
  getUserActivity: async (userId: string, limit = 50): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>(`/users/${userId}/activity`, {
      params: { limit }
    });
    return response.data.data || [];
  },
};

// Helper functions
export const apiHelpers = {
  /**
   * Handle API errors and extract user-friendly messages
   */
  handleError: (error: AxiosError): string => {
    if (error.response?.data) {
      const errorData = error.response.data as ApiError;
      return errorData.message || 'An unexpected error occurred';
    }
    
    if (error.code === 'NETWORK_ERROR' || !error.response) {
      return 'Network error. Please check your connection.';
    }
    
    return error.message || 'An unexpected error occurred';
  },

  /**
   * Extract validation errors from API response
   */
  extractValidationErrors: (error: AxiosError): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    if (error.response?.data) {
      const errorData = error.response.data as ApiError;
      if (errorData.errors) {
        errorData.errors.forEach((err) => {
          errors[err.field] = err.message;
        });
      }
    }
    
    return errors;
  },

  /**
   * Check if error is a validation error
   */
  isValidationError: (error: AxiosError): boolean => {
    return error.response?.status === 422;
  },

  /**
   * Check if error is an authentication error
   */
  isAuthError: (error: AxiosError): boolean => {
    return error.response?.status === 401;
  },

  /**
   * Check if error is a permission error
   */
  isPermissionError: (error: AxiosError): boolean => {
    return error.response?.status === 403;
  },

  /**
   * Check if error is rate limit error
   */
  isRateLimitError: (error: AxiosError): boolean => {
    return error.response?.status === 429;
  },

  /**
   * Format API response for consistent error handling
   */
  formatResponse: <T>(response: AxiosResponse<ApiResponse<T>>): T => {
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    return response.data.data!;
  },
};

// Export configured axios instance for use in other services
export default api;