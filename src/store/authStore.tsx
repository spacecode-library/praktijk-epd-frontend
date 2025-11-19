import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi } from '@/services/api';
import { 
  User, 
  AuthState, 
  LoginCredentials, 
  RegisterData, 
  UserRole,
  TwoFactorSetup,
  AuthenticationState,
  AuthNavigation
} from '@/types/auth';
import { PremiumNotifications } from '@/utils/premiumNotifications';

// Centralized navigation and auth helpers
const createAuthNavigation = (): AuthNavigation => {
  const getDashboardPath = (role: UserRole): string => {
    switch (role) {
      case UserRole.ADMIN:
        return '/admin/dashboard';
      case UserRole.THERAPIST:
      case UserRole.SUBSTITUTE:
        return '/therapist/dashboard';
      case UserRole.CLIENT:
        return '/client/dashboard';
      case UserRole.ASSISTANT:
        return '/assistant/dashboard';
      case UserRole.BOOKKEEPER:
        return '/bookkeeper/dashboard';
      default:
        return '/client/dashboard';
    }
  };

  const requires2FASetup = (user: User): boolean => {
    // Check if user is in a role that requires 2FA AND hasn't completed setup yet
    const roleRequires2FA = ['admin', 'therapist', 'bookkeeper', 'assistant', 'substitute'].includes(user.role);
    return roleRequires2FA && !user.two_factor_setup_completed;
  };

  const getNextNavigationPath = (user: User, authState: AuthenticationState): string => {
    switch (authState) {
      case AuthenticationState.REQUIRES_2FA_SETUP:
        return '/auth/2fa';
      case AuthenticationState.REQUIRES_2FA_VERIFICATION:
        return '/auth/2fa';
      case AuthenticationState.AUTHENTICATED_COMPLETE:
        return getDashboardPath(user.role);
      default:
        return getDashboardPath(user.role);
    }
  };

  const navigateWithAuth = (path: string, replace = false): void => {
    // Navigation will be handled by the component that subscribes to the store
  };

  return {
    getDashboardPath,
    requires2FASetup,
    getNextNavigationPath,
    navigateWithAuth
  };
};

interface AuthStore extends AuthState {
  // Navigation helper
  navigation: AuthNavigation;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean | 'email_not_verified'>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  setup2FA: () => Promise<TwoFactorSetup | null>;
  verify2FA: (code: string, secret?: string) => Promise<boolean>;
  complete2FALogin: (twoFactorCode: string) => Promise<boolean>;
  disable2FA: (code: string) => Promise<boolean>;
  clearAuth: () => void;
  startTokenRefreshTimer: () => void;
  stopTokenRefreshTimer: () => void;
  
  // State management with new state machine
  setAuthenticationState: (state: AuthenticationState) => void;
  setError: (error: string | null) => void;
  setPendingNavigation: (path: string | null) => void;
  
  // Legacy support (deprecated)
  setLoading: (loading: boolean) => void;
  setRequiresTwoFactor: (requires: boolean) => void;
  setTwoFactorSetupRequired: (required: boolean) => void;
  updateUser: (user: Partial<User>) => void;
  
  // Computed values
  isAdmin: () => boolean;
  isTherapist: () => boolean;
  isClient: () => boolean;
  canAccess: (roles: UserRole[]) => boolean;
  getDisplayName: () => string;
  getRoleColor: () => string;
}

// Token refresh timer
let tokenRefreshTimer: NodeJS.Timeout | null = null;
let isLogoutInProgress = false;

export const useAuthStore = create<AuthStore>()(
  persist(
      (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      authenticationState: AuthenticationState.IDLE,
      error: null,
      pendingNavigation: null,
      
      // Legacy support (deprecated)
      isAuthenticated: false,
      isLoading: false,
      requiresTwoFactor: false,
      twoFactorSetupRequired: false,
      
      // Navigation helper
      navigation: createAuthNavigation(),

      // Actions
      login: async (credentials: LoginCredentials): Promise<boolean | 'email_not_verified'> => {
        try {
          // Set authenticating state
          set({ 
            authenticationState: AuthenticationState.AUTHENTICATING,
            error: null,
            isLoading: true, // Legacy support
            requiresTwoFactor: false // Legacy support
          });
          
          const response = await authApi.login(credentials);
          
          // Handle 2FA requirement (can come with success: false if 2FA is needed)
          if (response.requiresTwoFactor) {
            // For 2FA verification, we might not have full user data yet
            // Try to use existing user data or create minimal user object
            const userData = response.user || { email: credentials.email } as any;
            
            // Store login credentials for 2FA retry (encrypted)
            const pendingLogin = {
              email: credentials.email,
              password: credentials.password,
              rememberDevice: credentials.rememberDevice
            };
            localStorage.setItem('pendingLogin', JSON.stringify(pendingLogin));
            
            set({ 
              authenticationState: AuthenticationState.REQUIRES_2FA_VERIFICATION,
              user: userData,
              error: null,
              // Legacy support
              requiresTwoFactor: true,
              isLoading: false,
              isAuthenticated: false
            });
            return false; // Need 2FA verification
          }

          if (response.success) {
            // User is authenticated, now check what kind of 2FA is required
            const user = response.user!;
            const navigation = get().navigation;
            
            // Check if user requires onboarding (must change password)
            if (response.requiresOnboarding || user.mustChangePassword) {
              set({
                user,
                accessToken: response.accessToken || null,
                authenticationState: AuthenticationState.AUTHENTICATED_COMPLETE,
                error: null,
                pendingNavigation: '/onboarding',
                // Legacy support
                isAuthenticated: true,
                isLoading: false,
                requiresTwoFactor: false,
                twoFactorSetupRequired: false
              });
              
              // Store in localStorage
              if (response.accessToken) {
                localStorage.setItem('accessToken', response.accessToken);
              }
              localStorage.setItem('user', JSON.stringify(user));
              
              PremiumNotifications.info('Please complete your account setup', {
                title: 'Account Setup Required',
                duration: 5000
              });
              return true;
            }
            
            // Check if user's role requires 2FA
            const roleRequires2FA = ['admin', 'therapist', 'bookkeeper', 'assistant', 'substitute'].includes(user.role);
            
            if (roleRequires2FA) {
              // If user hasn't completed 2FA setup, require setup
              if (!user.two_factor_setup_completed) {
                set({
                  user,
                  accessToken: response.accessToken || null,
                  authenticationState: AuthenticationState.REQUIRES_2FA_SETUP,
                  error: null,
                  // Legacy support
                  isAuthenticated: true,
                  isLoading: false,
                  requiresTwoFactor: false,
                  twoFactorSetupRequired: true
                });
                
                PremiumNotifications.auth.twoFactorRequired();
                return true;
              }
            }
            
            // Complete authentication
            set({
              user,
              accessToken: response.accessToken || null,
              authenticationState: AuthenticationState.AUTHENTICATED_COMPLETE,
              error: null,
              pendingNavigation: navigation.getDashboardPath(user.role),
              // Legacy support
              isAuthenticated: true,
              isLoading: false,
              requiresTwoFactor: false,
              twoFactorSetupRequired: false
            });
            
            // Manually store in localStorage to ensure persistence
            if (response.accessToken) {
              localStorage.setItem('accessToken', response.accessToken);
            }
            localStorage.setItem('user', JSON.stringify(user));
            
            // Start token refresh timer
            get().startTokenRefreshTimer();
            
            PremiumNotifications.auth.loginSuccess(user.first_name);
            return true;
          }
          
          // Login failed
          set({ 
            authenticationState: AuthenticationState.ERROR,
            error: response.message || 'Login failed',
            // Legacy support
            isLoading: false,
            requiresTwoFactor: false
          });
          
          PremiumNotifications.auth.loginFailed(response.message);
          return false;
        } catch (error: any) {
          // Handle errors
          const errorMessage = error.response?.data?.message || 'Login failed';
          
          // Check if error is due to unverified email
          if (error.response?.status === 403 && 
              error.response?.data?.message?.includes('verify your email')) {
            set({ 
              authenticationState: AuthenticationState.ERROR,
              error: 'Email not verified',
              // Legacy support
              isLoading: false,
              requiresTwoFactor: false
            });
            return 'email_not_verified';
          }
          
          // Check if account is locked (423 status)
          if (error.response?.status === 423) {
            set({ 
              authenticationState: AuthenticationState.ERROR,
              error: errorMessage || 'Account is temporarily locked',
              // Legacy support
              isLoading: false,
              requiresTwoFactor: false
            });
            PremiumNotifications.error(errorMessage || 'Account is temporarily locked. Please try again later or contact support.', {
              title: 'Account Locked',
              duration: 10000
            });
            // Don't re-throw for 423, just return false
            return false;
          }
          
          set({ 
            authenticationState: AuthenticationState.ERROR,
            error: errorMessage,
            // Legacy support
            isLoading: false,
            requiresTwoFactor: false
          });
          
          // Re-throw the error so it can be caught by the form
          throw error;
        }
      },

      register: async (userData: RegisterData): Promise<boolean> => {
        try {
          set({ isLoading: true });
          
          const response = await authApi.register(userData);
          
          if (response.success) {
            set({ isLoading: false });
            PremiumNotifications.success('Account created successfully!', {
              title: 'Registration Complete',
              description: 'Please check your email to verify your account',
              duration: 8000,
            });
            return true;
          }
          
          PremiumNotifications.error(response.message || 'Registration failed', { title: 'Registration Failed' });
          set({ isLoading: false });
          return false;
        } catch (error: any) {
          const message = error.response?.data?.message || 'Registration failed';
          PremiumNotifications.error(message, { title: 'Registration Error' });
          set({ isLoading: false });
          // Re-throw the error so it can be caught by the form
          throw error;
        }
      },

      logout: async (): Promise<void> => {
        // Prevent multiple simultaneous logout attempts
        if (isLogoutInProgress) {
          // Logout already in progress, skipping
          return;
        }
        
        isLogoutInProgress = true;
        
        try {
          // Stop token refresh timer first
          get().stopTokenRefreshTimer();
          
          await authApi.logout();
        } catch (error) {
          // Silent fail on logout error
        } finally {
          isLogoutInProgress = false;
          // Clear all auth state
          set({
            user: null,
            accessToken: null,
            authenticationState: AuthenticationState.IDLE,
            error: null,
            pendingNavigation: null,
            // Legacy support
            isAuthenticated: false,
            isLoading: false,
            requiresTwoFactor: false,
            twoFactorSetupRequired: false
          });
          // Clear local storage
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          localStorage.removeItem('tempToken');
          localStorage.removeItem('pendingLogin');
          PremiumNotifications.success('Logged out successfully', { duration: 2000 });
        }
      },

      refreshAuth: async (): Promise<void> => {
        try {
          const token = localStorage.getItem('accessToken');
          if (!token) {
            get().clearAuth();
            return;
          }

          // Set authenticating state during refresh
          set({ 
            authenticationState: AuthenticationState.AUTHENTICATING,
            isLoading: true,
            error: null
          });
          
          const user = await authApi.getCurrentUser();
          const navigation = get().navigation;
          
          // Check if user needs 2FA setup
          if (navigation.requires2FASetup(user)) {
            set({
              user,
              accessToken: token,
              authenticationState: AuthenticationState.REQUIRES_2FA_SETUP,
              error: null,
              // Legacy support
              isAuthenticated: true,
              isLoading: false,
              requiresTwoFactor: false,
              twoFactorSetupRequired: true
            });
            
            // Manually store in localStorage to ensure persistence
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('accessToken', token);
          } else {
            // Complete authentication
            set({
              user,
              accessToken: token,
              authenticationState: AuthenticationState.AUTHENTICATED_COMPLETE,
              error: null,
              pendingNavigation: navigation.getDashboardPath(user.role),
              // Legacy support
              isAuthenticated: true,
              isLoading: false,
              requiresTwoFactor: false,
              twoFactorSetupRequired: false
            });
            
            // Manually store in localStorage to ensure persistence
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('accessToken', token);
            
            // Start token refresh timer
            get().startTokenRefreshTimer();
          }
        } catch (error) {
          // Silent fail on auth refresh
          get().clearAuth();
        }
      },

      setup2FA: async (): Promise<TwoFactorSetup | null> => {
        try {
          const setup = await authApi.setup2FA();
          PremiumNotifications.info('2FA setup initiated', { description: 'Scan the QR code with your authenticator app' });
          return setup;
        } catch (error: any) {
          // Silent fail on 2FA setup error
          let message = '2FA setup failed';
          
          if (error.response?.status === 409) {
            message = '2FA is already enabled for this account';
          } else if (error.response?.status === 429) {
            message = 'Too many requests. Please wait a moment before trying again.';
          } else if (error.response?.data?.message) {
            message = error.response.data.message;
          }
          
          PremiumNotifications.error(message, { title: '2FA Setup Failed' });
          return null;
        }
      },

      // Complete 2FA login by retrying login with 2FA code
      complete2FALogin: async (twoFactorCode: string): Promise<boolean> => {
        try {
          const pendingLoginStr = localStorage.getItem('pendingLogin');
          if (!pendingLoginStr) {
            throw new Error('No pending login credentials found');
          }
          
          const pendingLogin = JSON.parse(pendingLoginStr);
          
          // Retry login with 2FA code
          const loginWithMFA = {
            ...pendingLogin,
            twoFactorCode
          };
          
          const response = await authApi.login(loginWithMFA);
          
          if (response.success && response.user && response.accessToken) {
            const navigation = get().navigation;
            const dashboardPath = navigation.getDashboardPath(response.user.role);
            
            // Setting auth state with token
            
            // Store token in localStorage FIRST
            // Storing token in localStorage
            localStorage.setItem('accessToken', response.accessToken);
            localStorage.setItem('user', JSON.stringify(response.user));
            localStorage.removeItem('pendingLogin'); // Clean up
            
            // Force persist the state immediately
            const newState = {
              user: response.user,
              accessToken: response.accessToken,
              authenticationState: AuthenticationState.AUTHENTICATED_COMPLETE,
              error: null,
              pendingNavigation: dashboardPath,
              // Legacy support
              isAuthenticated: true,
              isLoading: false,
              requiresTwoFactor: false,
              twoFactorSetupRequired: false
            };
            
            // Store the auth state in localStorage manually to ensure persistence
            const storeState = {
              state: {
                user: response.user,
                accessToken: response.accessToken,
                authenticationState: AuthenticationState.AUTHENTICATED_COMPLETE,
                isAuthenticated: true,
                requiresTwoFactor: false,
                twoFactorSetupRequired: false
              }
            };
            localStorage.setItem('praktijk-epd-auth', JSON.stringify(storeState));
            
            set(newState);
            
            // Auth state stored successfully
            
            // Start token refresh timer
            get().startTokenRefreshTimer();
            
            PremiumNotifications.auth.loginSuccess(response.user.first_name);
            return true;
          } else {
            // Response not successful
          }
          
          PremiumNotifications.error(response.message || '2FA verification failed', { title: '2FA Verification Failed' });
          return false;
        } catch (error: any) {
          // Silent fail on 2FA login completion
          let message = '2FA verification failed';
          
          if (error.response?.status === 400) {
            message = 'Invalid verification code. Please try again.';
          } else if (error.response?.status === 401) {
            message = 'Authentication failed. Please log in again.';
            // Clear pending login and redirect to login
            localStorage.removeItem('pendingLogin');
            get().clearAuth();
          } else if (error.response?.status === 429) {
            message = 'Too many verification attempts. Please wait before trying again.';
          } else if (error.response?.data?.message) {
            message = error.response.data.message;
          }
          
          PremiumNotifications.error(message, { title: '2FA Verification Failed' });
          return false;
        }
      },

      verify2FA: async (code: string, secret?: string): Promise<boolean> => {
        try {
          const response = await authApi.verify2FA(code, secret);
          
          if (response.success) {
            const navigation = get().navigation;
            
            // Update user 2FA status if this was setup verification
            if (secret) {
              const currentUser = get().user;
              if (currentUser) {
                const updatedUser = { 
                  ...currentUser, 
                  two_factor_enabled: true,
                  two_factor_setup_completed: true 
                };
                set({
                  user: updatedUser,
                  authenticationState: AuthenticationState.AUTHENTICATED_COMPLETE,
                  error: null,
                  pendingNavigation: navigation.getDashboardPath(updatedUser.role),
                  // Legacy support
                  twoFactorSetupRequired: false,
                  isAuthenticated: true,
                  requiresTwoFactor: false
                });
              }
            } else {
              // This is a login 2FA verification
              // Update authentication state if we have user data in response
              if (response.user && response.accessToken) {
                const dashboardPath = navigation.getDashboardPath(response.user.role);
                set({
                  user: response.user,
                  accessToken: response.accessToken,
                  authenticationState: AuthenticationState.AUTHENTICATED_COMPLETE,
                  error: null,
                  pendingNavigation: dashboardPath,
                  // Legacy support
                  isAuthenticated: true,
                  requiresTwoFactor: false,
                  twoFactorSetupRequired: false
                });
                localStorage.setItem('accessToken', response.accessToken);
                localStorage.setItem('user', JSON.stringify(response.user));
              } else {
                // Clear requiresTwoFactor flag but keep current user
                set({ 
                  authenticationState: AuthenticationState.AUTHENTICATED_COMPLETE,
                  error: null,
                  requiresTwoFactor: false 
                });
              }
            }
            
            PremiumNotifications.auth.twoFactorSuccess();
            return true;
          }
          
          PremiumNotifications.error(response.message || '2FA verification failed', { title: '2FA Verification Failed' });
          return false;
        } catch (error: any) {
          // Silent fail on 2FA verification
          let message = '2FA verification failed';
          
          if (error.response?.status === 400) {
            message = 'Invalid verification code. Please try again.';
          } else if (error.response?.status === 401) {
            message = 'Authentication expired. Please log in again.';
            // Clear auth state and redirect to login
            get().clearAuth();
            // Don't redirect here, let the component handle it
          } else if (error.response?.status === 429) {
            message = 'Too many verification attempts. Please wait before trying again.';
          } else if (error.response?.status === 404) {
            message = 'No 2FA setup found. Please set up 2FA first.';
          } else if (error.response?.data?.message) {
            message = error.response.data.message;
          }
          
          PremiumNotifications.error(message, { title: '2FA Verification Failed' });
          return false;
        }
      },

      disable2FA: async (code: string): Promise<boolean> => {
        try {
          const response = await authApi.disable2FA(code);
          
          if (response.success) {
            const currentUser = get().user;
            if (currentUser) {
              set({
                user: { 
                  ...currentUser, 
                  two_factor_enabled: false,
                  // Keep setup completion flag - user has completed setup before
                  two_factor_setup_completed: true
                }
              });
            }
            
            PremiumNotifications.success('2FA disabled successfully', { title: 'Security Updated' });
            return true;
          }
          
          PremiumNotifications.error(response.message || '2FA disable failed', { title: '2FA Disable Failed' });
          return false;
        } catch (error: any) {
          const message = error.response?.data?.message || '2FA disable failed';
          PremiumNotifications.error(message, { title: '2FA Setup Failed' });
          return false;
        }
      },

      clearAuth: (): void => {
        // Stop token refresh timer
        get().stopTokenRefreshTimer();
        
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        localStorage.removeItem('tempToken');
        localStorage.removeItem('pendingLogin');
        set({
          user: null,
          accessToken: null,
          authenticationState: AuthenticationState.IDLE,
          error: null,
          pendingNavigation: null,
          // Legacy support
          isAuthenticated: false,
          isLoading: false,
          requiresTwoFactor: false,
          twoFactorSetupRequired: false
        });
      },

      startTokenRefreshTimer: (): void => {
        // Clear existing timer
        if (tokenRefreshTimer) {
          clearInterval(tokenRefreshTimer);
        }

        // Set up periodic token refresh check (every 5 minutes)
        // With 15-minute tokens, this ensures we catch expiration
        tokenRefreshTimer = setInterval(async () => {
          const token = localStorage.getItem('accessToken');
          if (token) {
            try {
              // Parse token to check expiration
              const payload = JSON.parse(atob(token.split('.')[1]));
              const expirationTime = payload.exp * 1000;
              const currentTime = Date.now();
              const timeUntilExpiry = expirationTime - currentTime;

              // Only refresh if token expires within 5 minutes
              if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
                console.log('[Auth] Token expiring soon, refreshing...');
                await get().refreshAuth();
              }
            } catch (error) {
              // Don't clear auth on timer error - let axios interceptor handle it
              console.error('[Auth] Token refresh check failed:', error);
            }
          }
        }, 5 * 60 * 1000); // Check every 5 minutes
      },

      stopTokenRefreshTimer: (): void => {
        if (tokenRefreshTimer) {
          clearInterval(tokenRefreshTimer);
          tokenRefreshTimer = null;
        }
      },

      // New state management methods
      setAuthenticationState: (state: AuthenticationState): void => {
        set({ 
          authenticationState: state,
          // Update legacy flags for backward compatibility
          isLoading: state === AuthenticationState.AUTHENTICATING,
          requiresTwoFactor: state === AuthenticationState.REQUIRES_2FA_VERIFICATION,
          twoFactorSetupRequired: state === AuthenticationState.REQUIRES_2FA_SETUP,
          isAuthenticated: [
            AuthenticationState.AUTHENTICATED,
            AuthenticationState.REQUIRES_2FA_SETUP,
            AuthenticationState.AUTHENTICATED_COMPLETE
          ].includes(state)
        });
      },

      setError: (error: string | null): void => {
        set({ error });
      },

      setPendingNavigation: (path: string | null): void => {
        set({ pendingNavigation: path });
      },

      // Legacy support methods (deprecated)
      setLoading: (loading: boolean): void => {
        set({ isLoading: loading });
      },

      setRequiresTwoFactor: (requires: boolean): void => {
        set({ requiresTwoFactor: requires });
      },

      setTwoFactorSetupRequired: (required: boolean): void => {
        set({ twoFactorSetupRequired: required });
      },

      updateUser: (userData: Partial<User>): void => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          set({ user: updatedUser });
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      },

      // Computed values
      isAdmin: (): boolean => {
        return get().user?.role === UserRole.ADMIN;
      },

      isTherapist: (): boolean => {
        const role = get().user?.role;
        return role === UserRole.THERAPIST || role === UserRole.SUBSTITUTE;
      },

      isClient: (): boolean => {
        return get().user?.role === UserRole.CLIENT;
      },

      canAccess: (roles: UserRole[]): boolean => {
        const userRole = get().user?.role;
        return userRole ? roles.includes(userRole) : false;
      },

      getDisplayName: (): string => {
        const user = get().user;
        if (!user) return '';
        return `${user.first_name} ${user.last_name}`;
      },

      getRoleColor: (): string => {
        const role = get().user?.role;
        const colorMap: Record<UserRole, string> = {
          [UserRole.ADMIN]: 'text-admin-primary',
          [UserRole.THERAPIST]: 'text-therapist-primary',
          [UserRole.CLIENT]: 'text-client-primary',
          [UserRole.ASSISTANT]: 'text-assistant-primary',
          [UserRole.BOOKKEEPER]: 'text-bookkeeper-primary',
          [UserRole.SUBSTITUTE]: 'text-therapist-primary'
        };
        return role ? colorMap[role] : 'text-gray-600';
      }
    }),
    {
      name: 'praktijk-epd-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        authenticationState: state.authenticationState,
        isAuthenticated: state.isAuthenticated,
        // Persist 2FA states to maintain them across refreshes
        requiresTwoFactor: state.requiresTwoFactor,
        twoFactorSetupRequired: state.twoFactorSetupRequired
      }),
    }
  )
);

// Auth hooks for convenience
export const useAuth = () => {
  const store = useAuthStore();
  return {
    user: store.user,
    // New state machine properties
    authenticationState: store.authenticationState,
    error: store.error,
    pendingNavigation: store.pendingNavigation,
    navigation: store.navigation,
    // Legacy properties (for backward compatibility)
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    requiresTwoFactor: store.requiresTwoFactor,
    twoFactorSetupRequired: store.twoFactorSetupRequired,
    // Actions
    login: store.login,
    register: store.register,
    logout: store.logout,
    refreshAuth: store.refreshAuth,
    setup2FA: store.setup2FA,
    verify2FA: store.verify2FA,
    complete2FALogin: store.complete2FALogin,
    disable2FA: store.disable2FA,
    startTokenRefreshTimer: store.startTokenRefreshTimer,
    stopTokenRefreshTimer: store.stopTokenRefreshTimer,
    // State management
    setAuthenticationState: store.setAuthenticationState,
    setError: store.setError,
    setPendingNavigation: store.setPendingNavigation,
    // Computed values
    isAdmin: store.isAdmin,
    isTherapist: store.isTherapist,
    isClient: store.isClient,
    canAccess: store.canAccess,
    getDisplayName: store.getDisplayName,
    getRoleColor: store.getRoleColor,
    updateUser: store.updateUser,
  };
};

// Role-based access control hook
export const useRoleAccess = (allowedRoles: UserRole[]) => {
  const { user, canAccess } = useAuth();
  return {
    hasAccess: canAccess(allowedRoles),
    userRole: user?.role,
    isLoading: !user && useAuthStore.getState().isLoading,
  };
};

// Authentication status hook
export const useAuthStatus = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  return {
    isAuthenticated,
    isLoading,
    user,
    needsEmailVerification: user && !user.email_verified,
    needs2FASetup: useAuthStore.getState().twoFactorSetupRequired,
    accountStatus: user?.status,
  };
};

// Make auth store available globally for API interceptor
if (typeof window !== 'undefined') {
  (window as any).useAuthStore = useAuthStore;
}