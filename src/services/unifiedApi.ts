// Unified API Service
// Consolidates functionality from realApi.ts, therapistApi.ts, and endpoints.ts
// Uses centralized response normalization and data transformation
//
// MIGRATION STATUS:
// ✅ Core endpoints implemented (80% complete)
// ✅ Smart pairing and assignment APIs added
// ✅ Session management with invoice automation
// ✅ Real therapist availability integration  
// ✅ Extended therapist APIs (surveys, challenges, resources)
// ✅ Enhanced client and admin endpoints
// 🔄 Legacy imports being replaced throughout codebase
//
// TO DEPRECATE:
// - realApi.ts (legacy - use adminApi, clientApi, therapistApi instead)
// - therapistApi.ts (legacy - use therapistApi from this file)
// - endpoints.ts (legacy - all endpoints consolidated here)

import api from './api';
import { normalizeApiResponse, responseHandlers } from '../utils/apiResponseNormalizer';
import { normalizeAppointmentList, normalizeClientList, normalizeTherapistList } from '../utils/dataMappers';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  error?: string;
}

// Simple request cache for performance optimization
class RequestCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  private getKey(endpoint: string, params?: any): string {
    return `${endpoint}_${params ? JSON.stringify(params) : ''}`;
  }

  get<T>(endpoint: string, params?: any): T | null {
    const key = this.getKey(endpoint, params);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  set(endpoint: string, data: any, params?: any, ttl: number = this.DEFAULT_TTL): void {
    const key = this.getKey(endpoint, params);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

const cache = new RequestCache();

// Unified API client with consistent error handling and response normalization
class UnifiedApiClient {
  
  // Generic request method with caching and normalization
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    params?: any,
    options: { cache?: boolean; normalize?: boolean; entityKey?: string } = {}
  ): Promise<ApiResponse<T>> {
    try {
      const { cache: useCache = true, normalize = true, entityKey } = options;
      
      // Check cache for GET requests
      if (method === 'GET' && useCache) {
        const cached = cache.get<ApiResponse<T>>(endpoint, params);
        if (cached) {
          return cached;
        }
      }
      
      // Make request
      const response = await api.request({
        method: method.toLowerCase() as any,
        url: endpoint,
        data,
        params
      });
      
      // Normalize response if requested
      const result = normalize 
        ? normalizeApiResponse<T>(response, entityKey)
        : { success: true, data: response.data };
      
      // Cache successful GET responses
      if (method === 'GET' && useCache && result.success) {
        cache.set(endpoint, result, params);
      }
      
      return result;
      
    } catch (error: any) {
      return {
        success: false,
        data: null as any,
        error: error.response?.data?.message || error.message || 'Request failed',
        message: error.response?.data?.message || 'An error occurred'
      };
    }
  }

  // ADMIN ENDPOINTS
  admin = {
    // Dashboard
    getDashboard: () => this.request<any>('GET', '/admin/dashboard'),
    
    // Users
    getUsers: (params?: any) => this.request<any[]>('GET', '/admin/users', undefined, params, { entityKey: 'users' }),
    createUser: (userData: any) => this.request<any>('POST', '/admin/users', userData),
    updateUser: (userId: string, userData: any) => this.request<any>('PUT', `/admin/users/${userId}`, userData),
    deleteUser: (userId: string) => this.request<any>('DELETE', `/admin/users/${userId}`),
    
    // Waiting List
    getWaitingList: (params?: any) => this.request<any[]>('GET', '/admin/waiting-list', undefined, params, { entityKey: 'waitingList' }),
    getWaitingListGrouped: (params?: any) => this.request<any>('GET', '/admin/waiting-list/grouped', undefined, params),
    updateWaitingListEntry: (id: string, updates: any) => this.request<any>('PUT', `/admin/waiting-list/${id}`, updates),

    // Appointments
    getAppointments: (params?: any) => this.request<any[]>('GET', '/admin/appointments', undefined, params, { entityKey: 'appointments' }),
    createAppointment: (appointmentData: any) => this.request<any>('POST', '/admin/appointments', appointmentData),
    updateAppointment: (id: string, updates: any) => this.request<any>('PUT', `/admin/appointments/${id}`, updates),
    deleteAppointment: (id: string) => this.request<any>('DELETE', `/admin/appointments/${id}`),
    
    // Therapists
    getTherapists: (params?: any) => this.request<any[]>('GET', '/admin/therapists', undefined, params, { entityKey: 'therapists' }),
    updateTherapistProfile: (therapistId: string, profileData: any) => this.request<any>('PUT', `/admin/therapists/${therapistId}/profile`, profileData),
    
    // Invoices
    getInvoices: (params?: any) => this.request<any[]>('GET', '/admin/invoices', undefined, params, { entityKey: 'invoices' }),
    
    // Smart Pairing
    getSmartPairingRecommendations: (params: {
      clientId: string;
      appointmentDate?: string;
      appointmentTime?: string;
      problemCategory?: string;
      preferredGender?: string;
      preferredLanguage?: string;
      maxDistance?: number;
    }) => this.request<any>('GET', '/admin/smart-pairing-recommendations', undefined, params),
    
    // Therapist Assignment
    assignTherapist: (clientId: string, assignmentData: {
      therapistId: string;
      assignmentDate?: string;
      notes?: string;
    }) => this.request<any>('POST', `/admin/clients/${clientId}/assign-therapist`, assignmentData),
    
    // Financial
    getFinancialOverview: (period?: string) => this.request<any>('GET', '/admin/financial/overview', undefined, { period }),
    
    // System settings
    getSettings: () => this.request<any>('GET', '/admin/settings'),
    updateSettings: (settings: any) => this.request<any>('PUT', '/admin/settings', settings),
    
    // Reports
    getReports: (params?: any) => this.request<any[]>('GET', '/admin/reports', undefined, params),
    generateReport: (reportType: string, params?: any) => this.request<any>('POST', '/admin/reports/generate', { reportType, ...params }),
    
    // Bulk operations
    bulkDeleteUsers: (userIds: string[]) => this.request<any>('DELETE', '/admin/users/bulk', { userIds }),
    bulkUpdateUsers: (updates: any[]) => this.request<any>('PUT', '/admin/users/bulk', { updates }),
    
    // Audit logs
    getAuditLogs: (params?: any) => this.request<any[]>('GET', '/admin/audit-logs', undefined, params),
    
    // System health
    getSystemHealth: () => this.request<any>('GET', '/admin/system/health'),
  };

  // THERAPIST ENDPOINTS
  therapist = {
    // Dashboard
    getDashboard: () => this.request<any>('GET', '/therapist/dashboard'),
    
    // Profile
    getProfile: () => this.request<any>('GET', '/therapist/profile'),
    updateProfile: (profileData: any) => this.request<any>('PUT', '/therapist/profile', profileData),
    
    // Appointments
    getAppointments: (params?: any) => this.request<any[]>('GET', '/therapist/appointments', undefined, params, { entityKey: 'appointments' }),
    
    // Clients
    getClients: (params?: any) => this.request<any[]>('GET', '/therapist/clients', undefined, params, { entityKey: 'clients' }),
    getClientProfile: (clientId: string) => this.request<any>('GET', `/therapist/clients/${clientId}`),

    // Waiting List
    getWaitingList: (params?: any) => this.request<any>('GET', '/therapist/waiting-list', undefined, params),

    // Sessions
    getSessions: (params?: any) => this.request<any[]>('GET', '/therapist/sessions', undefined, params, { entityKey: 'sessions' }),
    createSessionNote: (sessionData: any) => this.request<any>('POST', '/therapist/sessions', sessionData),
    updateSessionNote: (sessionId: string, updates: any) => this.request<any>('PUT', `/therapist/sessions/${sessionId}`, updates),
    startSession: (sessionData: any) => this.request<any>('POST', '/sessions/start', sessionData),
    endSession: (sessionId: string, sessionData: any) => this.request<any>('POST', `/sessions/${sessionId}/end`, sessionData),
    updateSessionProgress: (sessionId: string, progressData: any) => this.request<any>('PUT', `/sessions/${sessionId}/progress`, progressData),

    // Invoices - Generate from session
    generateInvoiceFromSession: (sessionId: string, invoiceData?: any) => this.request<any>('POST', `/sessions/${sessionId}/generate-invoice`, invoiceData),
    
    // Availability
    getAvailability: (params?: any) => this.request<any[]>('GET', '/therapist/availability', undefined, params),
    updateAvailability: (availabilityData: any) => this.request<any>('PUT', '/therapist/availability', availabilityData),
    getAvailableSlots: (date: string) => this.request<any[]>('GET', '/appointments/available-slots', undefined, { date }),
    
    // Session Notes
    getSessionNotes: (params?: any) => this.request<any[]>('GET', '/session-notes', undefined, params),
    getSessionNote: (noteId: string) => this.request<any>('GET', `/session-notes/${noteId}`),
    deleteSessionNote: (noteId: string) => this.request<any>('DELETE', `/session-notes/${noteId}`),
    
    // Surveys
    getSurveys: () => this.request<{surveys: any[]}>('GET', '/surveys'),
    getSurvey: (id: string) => this.request<any>('GET', `/surveys/${id}`),
    getSurveyResponses: (surveyId: string) => this.request<any[]>('GET', `/surveys/${surveyId}/responses`),
    createSurvey: (data: any) => this.request<any>('POST', '/surveys', data),
    updateSurvey: (id: string, data: any) => this.request<any>('PUT', `/surveys/${id}`, data),
    deleteSurvey: (id: string) => this.request<any>('DELETE', `/surveys/${id}`),
    assignSurvey: (surveyId: string, clientId: string, data?: any) => this.request<any>('POST', `/surveys/${surveyId}/assign`, { clientId, ...data }),
    
    // Challenges
    getChallenges: () => this.request<{challenges: any[]}>('GET', '/challenges'),
    createChallenge: (data: any) => this.request<any>('POST', '/challenges', data),
    updateChallenge: (id: string, data: any) => this.request<any>('PUT', `/challenges/${id}`, data),
    deleteChallenge: (id: string) => this.request<any>('DELETE', `/challenges/${id}`),
    assignChallenge: (challengeId: string, clientId: string, data?: any) => this.request<any>('POST', `/challenges/${challengeId}/assign`, { clientId, ...data }),
    
    // Resources
    getResources: () => this.request<{resources: any[]}>('GET', '/resources'),
    createResource: (data: any) => this.request<any>('POST', '/resources', data),
    updateResource: (id: string, data: any) => this.request<any>('PUT', `/resources/${id}`, data),
    deleteResource: (id: string) => this.request<any>('DELETE', `/resources/${id}`),
    assignResource: (resourceId: string, clientId: string, data?: any) => this.request<any>('POST', `/resources/${resourceId}/assign`, { clientId, ...data }),
    
    // Calendar
    getCalendarAppointments: (params?: any) => this.request<any[]>('GET', '/appointments/calendar', undefined, params),
    
    // Metrics and performance tracking
    getMetrics: (params?: any) => this.request<any>('GET', '/therapist/metrics', undefined, params),
    
    // Psychological problems for therapist profiles
    getPsychologicalProblems: () => this.request<any[]>('GET', '/therapist/psychological-problems'),
  };

  // CLIENT ENDPOINTS
  client = {
    // Dashboard
    getDashboard: () => this.request<any>('GET', '/client/dashboard'),
    
    // Profile
    getProfile: () => this.request<any>('GET', '/client/profile'),
    updateProfile: (profileData: any) => this.request<any>('PUT', '/client/profile', profileData),
    
    // Appointments
    getAppointments: (params?: any) => this.request<any[]>('GET', '/client/appointments', undefined, params, { entityKey: 'appointments' }),
    requestAppointment: (requestData: any) => this.request<any>('POST', '/client/appointment-request', requestData),
    
    // Intake
    submitIntakeForm: (intakeData: any) => this.request<any>('POST', '/client/intake', intakeData),
    
    // Therapist availability
    getTherapistAvailability: (therapistId: string, params?: any) => this.request<any[]>('GET', `/client/therapists/${therapistId}/availability`, undefined, params),
    
    // Invoices
    getInvoices: (params?: any) => this.request<any[]>('GET', '/client/invoices', undefined, params),
    getInvoice: (invoiceId: string) => this.request<any>('GET', `/client/invoices/${invoiceId}`),
    
    // Documents
    getDocuments: (params?: any) => this.request<any[]>('GET', '/client/documents', undefined, params),
    uploadDocument: (documentData: FormData) => this.request<any>('POST', '/client/documents', documentData),
    
    // Therapist information
    getTherapist: () => this.request<any>('GET', '/client/therapist'),
    getTherapists: (params?: any) => this.request<any[]>('GET', '/client/therapists', undefined, params),
    
    // Resources
    getClientResources: (params?: any) => this.request<any[]>('GET', '/client/resources', undefined, params),
    
    // Surveys
    getClientSurveys: (params?: any) => this.request<any[]>('GET', '/client/surveys', undefined, params),
    submitSurveyResponse: (surveyId: string, responses: any) => this.request<any>('POST', `/client/surveys/${surveyId}/responses`, responses),
    
    // Challenges
    getClientChallenges: (params?: any) => this.request<any[]>('GET', '/client/challenges', undefined, params),
  };

  // PUBLIC ENDPOINTS
  public = {
    getHulpvragen: () => this.request<any[]>('GET', '/public/psychological-problems', undefined, undefined, { entityKey: 'data' }),
    getTherapists: (params?: any) => this.request<any[]>('GET', '/public/therapists', undefined, params, { entityKey: 'therapists' }),
  };

  // UTILITY METHODS
  
  // Clear cache
  clearCache(): void {
    cache.clear();
  }
  
  // Bulk operations with data normalization
  async getAppointmentsNormalized(endpoint: string, params?: any): Promise<ApiResponse<any[]>> {
    const response = await this.request<any[]>('GET', endpoint, undefined, params, { entityKey: 'appointments' });
    
    if (response.success && Array.isArray(response.data)) {
      response.data = normalizeAppointmentList(response.data);
    }
    
    return response;
  }
  
  async getClientsNormalized(endpoint: string, params?: any): Promise<ApiResponse<any[]>> {
    const response = await this.request<any[]>('GET', endpoint, undefined, params, { entityKey: 'clients' });
    
    if (response.success && Array.isArray(response.data)) {
      response.data = normalizeClientList(response.data);
    }
    
    return response;
  }
  
  async getTherapistsNormalized(endpoint: string, params?: any): Promise<ApiResponse<any[]>> {
    const response = await this.request<any[]>('GET', endpoint, undefined, params, { entityKey: 'therapists' });
    
    if (response.success && Array.isArray(response.data)) {
      response.data = normalizeTherapistList(response.data);
    }
    
    return response;
  }
}

// Export singleton instance
export const unifiedApi = new UnifiedApiClient();

// Export specific modules for easy migration
export const adminApi = unifiedApi.admin;
export const therapistApi = unifiedApi.therapist;
export const clientApi = unifiedApi.client;
export const publicApi = unifiedApi.public;

export default unifiedApi;