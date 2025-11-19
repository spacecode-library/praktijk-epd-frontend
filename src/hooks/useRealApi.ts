import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';
import { adminApi, therapistApi, clientApi, assistantApi, bookkeeperApi, commonApi } from '@/services/endpoints';
import { realApiService } from '@/services/realApi';
import { unifiedApi } from '@/services/unifiedApi';
import { useAuth } from '@/store/authStore';
import { ApiResponse } from '@/types/auth';

// Generic hook for API calls with loading and error handling
export function useApiCall<T = any>(
  apiFunction: (...args: any[]) => Promise<ApiResponse<T>>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: any) => void;
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
    successMessage?: string;
  }
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async (...args: any[]) => {
    // Reduced logging - only log function name
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiFunction(...args);
      
      if (response.success && response.data) {
        setData(response.data);
        
        if (options?.showSuccessToast) {
          toast.success(options.successMessage || response.message || 'Operation successful');
        }
        
        options?.onSuccess?.(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Operation failed');
      }
    } catch (err: any) {
      console.error('[useApiCall] Error:', err.message || err);
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      
      if (options?.showErrorToast !== false) {
        toast.error(errorMessage);
      }
      
      options?.onError?.(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiFunction, options]);

  return { execute, isLoading, error, data, setError };
}

// Admin hooks
export function useAdminDashboard() {
  return useApiCall(adminApi.getDashboard);
}

export function useAdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  
  const { execute, isLoading, error } = useApiCall(adminApi.getUsers, {
    onSuccess: (data) => {
      setUsers(data.users);
      setTotal(data.total);
    }
  });

  return { users, total, getUsers: execute, isLoading, error };
}

export function useAdminClients() {
  const [clients, setClients] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  
  const { execute, isLoading, error } = useApiCall(adminApi.getClients, {
    onSuccess: (data) => {
      setClients(data.clients);
      setTotal(data.total);
    }
  });

  return { clients, total, getClients: execute, isLoading, error };
}

export function useAdminTherapists() {
  const [therapists, setTherapists] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  
  const { execute, isLoading, error } = useApiCall(adminApi.getTherapists, {
    onSuccess: (data) => {
      setTherapists(data.therapists);
      setTotal(data.total);
    }
  });

  return { therapists, total, getTherapists: execute, isLoading, error };
}

export function useAdminWaitingList() {
  const [waitingList, setWaitingList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  
  const { execute, isLoading, error } = useApiCall(adminApi.getWaitingList, {
    onSuccess: async (response) => {
      // Use the new response normalizer
      const { normalizeApiResponse } = await import('../utils/apiResponseNormalizer');
      const normalized = normalizeApiResponse(response, 'waitingList');
      
      if (normalized.success && Array.isArray(normalized.data)) {
        setWaitingList(normalized.data);
        setTotal(normalized.pagination?.total || normalized.data.length);
      } else {
        console.warn('Unexpected waiting list response format:', response);
        setWaitingList([]);
        setTotal(0);
      }
    }
  });

  const updateEntry = useApiCall(adminApi.updateWaitingListEntry, {
    showSuccessToast: true,
    successMessage: 'Waiting list entry updated'
  });

  return { 
    waitingList, 
    total, 
    getWaitingList: execute, 
    updateEntry: updateEntry.execute,
    isLoading: isLoading || updateEntry.isLoading, 
    error: error || updateEntry.error 
  };
}

export function useAdminFinancialOverview() {
  return useApiCall(adminApi.getFinancialOverview);
}

// Therapist hooks - MIGRATED to unified API
export function useTherapistDashboard() {
  return useApiCall(unifiedApi.therapist.getDashboard);
}

export function useTherapistProfile() {
  const { execute: getProfile, data: profile, isLoading: isLoadingProfile, error: profileError } = useApiCall(unifiedApi.therapist.getProfile);
  const { execute: updateProfile, isLoading: isUpdating } = useApiCall(unifiedApi.therapist.updateProfile, {
    showSuccessToast: true,
    successMessage: 'Profile updated successfully'
  });

  return {
    profile,
    getProfile,
    updateProfile,
    isLoading: isLoadingProfile || isUpdating,
    error: profileError
  };
}

export function useTherapistClients() {
  const [clients, setClients] = useState<any[]>([]);
  
  const { execute, isLoading, error } = useApiCall(unifiedApi.therapist.getClients, {
    onSuccess: (data) => {
      // API returns Client[] directly
      setClients(Array.isArray(data) ? data : []);
    }
  });

  return { clients, getClients: execute, isLoading, error };
}

export function useTherapistAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  
  const { execute: getAppointments, isLoading, error } = useApiCall(unifiedApi.therapist.getAppointments, {
    onSuccess: (data) => {
      // Handle both direct array response and nested appointments property
      if (Array.isArray(data)) {
        setAppointments(data);
      } else {
        setAppointments([]);
      }
    },
    onError: (error) => {
      console.error('[useTherapistAppointments] Failed to fetch appointments:', error);
      console.error('[useTherapistAppointments] Error details:', {
        message: error?.message,
        response: error?.response,
        status: error?.response?.status,
        data: error?.response?.data
      });
      setAppointments([]);
    },
    showErrorToast: false // Prevent duplicate error toasts
  });

  const { execute: createAppointment } = useApiCall(unifiedApi.admin.createAppointment, {
    showSuccessToast: true,
    successMessage: 'Appointment created successfully'
  });

  const { execute: updateAppointment } = useApiCall(unifiedApi.admin.updateAppointment, {
    showSuccessToast: true,
    successMessage: 'Appointment updated successfully'
  });

  return {
    appointments,
    getAppointments,
    createAppointment,
    updateAppointment,
    isLoading,
    error
  };
}

export function useTherapistWaitingList() {
  const [waitingList, setWaitingList] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  const { execute, isLoading, error } = useApiCall(unifiedApi.therapist.getWaitingList, {
    onSuccess: (data) => {
      // API returns { waitingList: [], pagination: {}, stats: {} }
      if (data && data.waitingList) {
        setWaitingList(Array.isArray(data.waitingList) ? data.waitingList : []);
        setStats(data.stats || null);
      } else if (Array.isArray(data)) {
        // Fallback if API returns array directly
        setWaitingList(data);
      } else {
        setWaitingList([]);
      }
    },
    onError: (error) => {
      console.error('[useTherapistWaitingList] Failed to fetch waiting list:', error);
      setWaitingList([]);
      setStats(null);
    },
    showErrorToast: false
  });

  return {
    waitingList,
    stats,
    getWaitingList: execute,
    isLoading,
    error
  };
}

// Client hooks - MIGRATED to unified API
export function useClientDashboard() {
  return useApiCall(unifiedApi.client.getDashboard);
}

export function useClientProfile() {
  const { execute: getProfile, data: profile, isLoading: isLoadingProfile, error: profileError } = useApiCall(unifiedApi.client.getProfile);
  const { execute: updateProfile, isLoading: isUpdating } = useApiCall(unifiedApi.client.updateProfile, {
    showSuccessToast: true,
    successMessage: 'Profile updated successfully'
  });

  return {
    profile,
    getProfile,
    updateProfile,
    isLoading: isLoadingProfile || isUpdating,
    error: profileError
  };
}

export function useClientAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  
  const { execute: getAppointments, isLoading, error } = useApiCall(unifiedApi.client.getAppointments, {
    onSuccess: (data) => {
      setAppointments(Array.isArray(data) ? data : (data as any)?.appointments || []);
    }
  });

  const { execute: requestAppointment } = useApiCall(unifiedApi.client.requestAppointment, {
    showSuccessToast: true,
    successMessage: 'Appointment request submitted'
  });

  return { 
    appointments, 
    getAppointments,
    requestAppointment,
    isLoading, 
    error 
  };
}

export function useClientMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  
  const { execute: getMessages, isLoading, error } = useApiCall(clientApi.getMessages, {
    onSuccess: (data) => {
      setMessages(data.messages);
    }
  });

  const { execute: sendMessage } = useApiCall(clientApi.sendMessage, {
    showSuccessToast: true,
    successMessage: 'Message sent successfully'
  });

  return { 
    messages, 
    getMessages,
    sendMessage,
    isLoading, 
    error 
  };
}

// Assistant hooks
export function useAssistantDashboard() {
  return useApiCall(assistantApi.getDashboard);
}

export function useAssistantSupportTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  
  const { execute: getTickets, isLoading, error } = useApiCall(assistantApi.getSupportTickets, {
    onSuccess: (data) => {
      setTickets(data.tickets);
    }
  });

  const { execute: createTicket } = useApiCall(assistantApi.createSupportTicket, {
    showSuccessToast: true,
    successMessage: 'Support ticket created'
  });

  const { execute: updateTicket } = useApiCall(assistantApi.updateSupportTicket, {
    showSuccessToast: true,
    successMessage: 'Support ticket updated'
  });

  return { 
    tickets, 
    getTickets,
    createTicket,
    updateTicket,
    isLoading, 
    error 
  };
}

// Bookkeeper hooks
export function useBookkeeperDashboard() {
  return useApiCall(bookkeeperApi.getDashboard);
}

export function useBookkeeperInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  
  const { execute: getInvoices, isLoading, error } = useApiCall(bookkeeperApi.getInvoices, {
    onSuccess: (data) => {
      setInvoices(data.invoices);
    }
  });

  const { execute: createInvoice } = useApiCall(bookkeeperApi.createInvoice, {
    showSuccessToast: true,
    successMessage: 'Invoice created successfully'
  });

  const { execute: updateInvoiceStatus } = useApiCall(bookkeeperApi.updateInvoiceStatus, {
    showSuccessToast: true,
    successMessage: 'Invoice status updated'
  });

  const { execute: sendReminder } = useApiCall(bookkeeperApi.sendPaymentReminder, {
    showSuccessToast: true,
    successMessage: 'Payment reminder sent'
  });

  return { 
    invoices, 
    getInvoices,
    createInvoice,
    updateInvoiceStatus,
    sendReminder,
    isLoading, 
    error 
  };
}

// Common hooks
export function useMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  
  const { execute: getMessages, isLoading, error } = useApiCall(commonApi.getMessages, {
    onSuccess: (data) => {
      setMessages(data.messages);
    }
  });

  const { execute: markAsRead } = useApiCall(commonApi.markMessageRead);

  return { 
    messages, 
    getMessages,
    markAsRead,
    isLoading, 
    error 
  };
}

// Role-based API hook
export function useRoleBasedApi() {
  const { user } = useAuth();

  const apis = {
    admin: adminApi,
    therapist: therapistApi,
    substitute: therapistApi, // Substitute uses same API as therapist
    client: clientApi,
    assistant: assistantApi,
    bookkeeper: bookkeeperApi
  };

  const api = user?.role ? apis[user.role as keyof typeof apis] : null;

  return { api, role: user?.role };
}

// Main API hook that consolidates all API functions
export function useRealApi() {
  // Admin functions
  const getAdminClients = useCallback(async (params?: { 
    status?: string; 
    therapistId?: string; 
    page?: number; 
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    intakeStatus?: string;
    registrationPeriod?: string;
  }) => {
    try {
      const response = await realApiService.admin.getClients(params);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch clients');
    } catch (error) {
      console.error('[useRealApi] getAdminClients error:', error);
      throw error;
    }
  }, []);

  const getAdminClientStats = useCallback(async () => {
    try {
      const response = await realApiService.admin.getDashboard();
      if (response.success && response.data) {
        return response.data.clientStats;
      }
      throw new Error(response.message || 'Failed to fetch client stats');
    } catch (error) {
      console.error('[useRealApi] getAdminClientStats error:', error);
      throw error;
    }
  }, []);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      const response = await realApiService.admin.deleteUser(userId);
      if (response.success) {
        toast.success('User deleted successfully');
        return response;
      }
      throw new Error(response.message || 'Failed to delete user');
    } catch (error) {
      console.error('[useRealApi] deleteUser error:', error);
      toast.error('Failed to delete user');
      throw error;
    }
  }, []);

  const updateUser = useCallback(async (userId: string, updates: any) => {
    try {
      const response = await realApiService.admin.updateUser(userId, updates);
      if (response.success) {
        toast.success('User updated successfully');
        return response;
      }
      throw new Error(response.message || 'Failed to update user');
    } catch (error) {
      console.error('[useRealApi] updateUser error:', error);
      toast.error('Failed to update user');
      throw error;
    }
  }, []);

  const updateUserStatus = useCallback(async (userId: string, status: string, reason?: string) => {
    try {
      const response = await realApiService.admin.updateUserStatus(userId, status, reason);
      if (response.success) {
        toast.success('User status updated successfully');
        return response;
      }
      throw new Error(response.message || 'Failed to update user status');
    } catch (error) {
      console.error('[useRealApi] updateUserStatus error:', error);
      toast.error('Failed to update user status');
      throw error;
    }
  }, []);

  const getAdminUsers = useCallback(async (params?: { 
    page?: number; 
    limit?: number; 
    role?: string; 
    status?: string; 
    search?: string 
  }) => {
    try {
      const response = await realApiService.admin.getUsers(params);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch users');
    } catch (error) {
      console.error('[useRealApi] getAdminUsers error:', error);
      throw error;
    }
  }, []);

  const createUser = useCallback(async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    phone?: string;
  }) => {
    try {
      const response = await realApiService.admin.createUser(userData);
      if (response.success) {
        toast.success('User created successfully');
        return response;
      }
      throw new Error(response.message || 'Failed to create user');
    } catch (error) {
      console.error('[useRealApi] createUser error:', error);
      toast.error('Failed to create user');
      throw error;
    }
  }, []);

  const getAdminDashboard = useCallback(async () => {
    try {
      const response = await realApiService.admin.getDashboard();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch dashboard data');
    } catch (error) {
      console.error('[useRealApi] getAdminDashboard error:', error);
      throw error;
    }
  }, []);

  const getClient = useCallback(async (clientId: string) => {
    try {
      const response = await realApiService.admin.getClient(clientId);
      
      if (response.success && response.data) {
        // Check if response.data contains a nested 'client' object
        if (response.data.client) {
          return response.data.client;
        }
        // Otherwise return the data directly (for backward compatibility)
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch client');
    } catch (error) {
      console.error('[useRealApi] getClient error:', error);
      throw error;
    }
  }, []);

  // Client activation functions
  const sendClientActivationEmail = useCallback(async (clientId: string) => {
    try {
      const response = await realApiService.admin.sendActivationEmail(clientId);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to send activation email');
    } catch (error) {
      console.error('Failed to send activation email:', error);
      throw error;
    }
  }, []);

  const sendBulkActivationEmails = useCallback(async (clientIds: string[], options?: {
    batchSize?: number;
    delayBetweenBatches?: number;
    regeneratePasswords?: boolean;
  }) => {
    try {
      const response = await realApiService.admin.sendBulkActivationEmails(clientIds, options);
      if (response.success) {
        toast.success(`Activation emails sent to ${clientIds.length} clients`);
        return response.data;
      }
      throw new Error(response.message || 'Failed to send bulk activation emails');
    } catch (error) {
      console.error('Failed to send bulk activation emails:', error);
      toast.error('Failed to send bulk activation emails');
      throw error;
    }
  }, []);

  const getUnverifiedClients = useCallback(async (params?: { 
    limit?: number; 
    offset?: number; 
  }) => {
    try {
      const response = await realApiService.admin.getUnverifiedClients(params);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch unverified clients');
    } catch (error) {
      console.error('Failed to fetch unverified clients:', error);
      throw error;
    }
  }, []);

  const getActivationStats = useCallback(async () => {
    try {
      const response = await realApiService.admin.getActivationStats();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch activation stats');
    } catch (error) {
      console.error('Failed to fetch activation stats:', error);
      throw error;
    }
  }, []);

  const resendVerificationEmail = useCallback(async (clientId: string) => {
    try {
      const response = await realApiService.admin.resendVerificationEmail(clientId);
      if (response.success) {
        toast.success('Verification email resent successfully');
        return response.data;
      }
      throw new Error(response.message || 'Failed to resend verification email');
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      toast.error('Failed to resend verification email');
      throw error;
    }
  }, []);

  return {
    // Admin functions
    getAdminClients,
    getAdminClientStats,
    getAdminUsers,
    getAdminDashboard,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus,
    getClient,
    
    // Export hooks for direct usage
    useAdminDashboard,
    useAdminUsers,
    useAdminClients,
    useAdminTherapists,
    useAdminWaitingList,
    useAdminFinancialOverview,
    
    // Therapist hooks
    useTherapistDashboard,
    useTherapistProfile,
    useTherapistClients,
    useTherapistAppointments,
    
    // Client hooks
    useClientDashboard,
    useClientProfile,
    useClientAppointments,
    useClientMessages,
    
    // Assistant hooks
    useAssistantDashboard,
    useAssistantSupportTickets,
    
    // Bookkeeper hooks
    useBookkeeperDashboard,
    useBookkeeperInvoices,
    
    // Common hooks
    useMessages,
    
    // Client activation functions
    sendClientActivationEmail,
    sendBulkActivationEmails,
    getUnverifiedClients,
    getActivationStats,
    resendVerificationEmail,
    
    // Utility hooks
    useApiCall,
    useRoleBasedApi,
    
    // Direct API service access
    api: realApiService
  };
}