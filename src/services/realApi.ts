import api from './api';
import { ApiResponse } from '@/types/auth';
import therapistApi from './therapistApi';

// Request cache and debouncing to prevent 429 errors
interface CacheEntry {
  data: any;
  timestamp: number;
  expiry: number;
}

class RequestManager {
  private cache: Map<string, CacheEntry> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private lastRequestTimes: Map<string, number> = new Map();
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second between requests to same endpoint
  private readonly DEFAULT_CACHE_DURATION = 300000; // 5 minutes
  private requestCount = 0;
  private requestResetTime = Date.now();

  private getCacheKey(endpoint: string, params?: any): string {
    return `${endpoint}_${params ? JSON.stringify(params) : ''}`;
  }

  private isValidCache(entry: CacheEntry): boolean {
    return Date.now() < entry.expiry;
  }

  private shouldThrottle(endpoint: string): boolean {
    const lastRequest = this.lastRequestTimes.get(endpoint);
    if (!lastRequest) return false;
    
    // Reset request count every minute
    if (Date.now() - this.requestResetTime > 60000) {
      this.requestCount = 0;
      this.requestResetTime = Date.now();
    }
    
    // Throttle if too many requests in current window
    if (this.requestCount > 30) {
      return true;
    }
    
    return Date.now() - lastRequest < this.MIN_REQUEST_INTERVAL;
  }

  async makeRequest<T>(
    endpoint: string,
    requestFn: () => Promise<T>,
    cacheDuration: number = this.DEFAULT_CACHE_DURATION,
    params?: any
  ): Promise<T> {
    const cacheKey = this.getCacheKey(endpoint, params);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && this.isValidCache(cached)) {
      return cached.data;
    }

    // Check if request is already pending
    const pending = this.pendingRequests.get(cacheKey);
    if (pending) {
      return pending;
    }

    // Throttle requests to prevent 429 errors
    if (this.shouldThrottle(endpoint)) {
      if (cached) {
        return cached.data; // Use expired cache if available
      }
      // Wait before making request
      await new Promise(resolve => setTimeout(resolve, this.MIN_REQUEST_INTERVAL));
    }

    // Make the request
    const requestPromise = requestFn().finally(() => {
      this.pendingRequests.delete(cacheKey);
      this.lastRequestTimes.set(endpoint, Date.now());
    });

    this.pendingRequests.set(cacheKey, requestPromise);
    this.requestCount++;

    try {
      const result = await requestPromise;
      // Cache successful results
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        expiry: Date.now() + cacheDuration
      });
      return result;
    } catch (error: any) {
      // On 429 error, return cached data if available
      if (error?.response?.status === 429 && cached) {
        console.warn(`[RequestManager] Rate limited for ${endpoint}, using cached data`);
        return cached.data;
      }
      throw error;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  clearEndpointCache(endpoint: string): void {
    for (const [key] of this.cache) {
      if (key.startsWith(endpoint)) {
        this.cache.delete(key);
      }
    }
  }

  clearRelatedCache(endpoint: string): void {
    // Clear cache for related endpoints when data is mutated
    const relatedEndpoints: Record<string, string[]> = {
      '/resources': ['/resources', '/admin/dashboard', '/therapist/dashboard'],
      '/challenges': ['/challenges', '/admin/dashboard'],
      '/surveys': ['/surveys', '/admin/dashboard'],
      '/admin/users': ['/admin/users', '/admin/clients', '/admin/dashboard'],
      '/admin/clients': ['/admin/clients', '/admin/dashboard', '/therapist/clients'],
      '/appointments': ['/appointments', '/admin/appointments', '/therapist/appointments', '/client/appointments'],
      '/invoices': ['/invoices', '/bookkeeper/invoices', '/admin/financial']
    };

    const toClear = relatedEndpoints[endpoint] || [endpoint];
    toClear.forEach(ep => this.clearEndpointCache(ep));
  }
}

const requestManager = new RequestManager();

// Updated types based on actual backend responses
interface AdminDashboardData {
  kpis: {
    totalRevenue: number;
    activeClients: number;
    totalTherapists: number;
    appointmentsToday: number;
    waitingListSize: number;
    overdueInvoices: number;
    systemHealth: number;
  };
  userStats: {
    totalUsers: number;
    byRole: Record<string, number>;
    byStatus: Record<string, number>;
    activeUsers: number;
  };
  clientStats: {
    totalClients: number;
    activeClients: number;
    assignedClients: number;
    intakeCompletedClients: number;
    byStatus: Record<string, number>;
  };
  therapistStats: {
    totalTherapists: number;
    activeTherapists: number;
    averageCaseload: number;
    totalClientsAssigned: number;
    byStatus: Record<string, number>;
    byContractStatus: Record<string, number>;
  };
  appointmentStats: {
    totalAppointments: number;
    todayAppointments: number;
    upcomingAppointments: number;
    overdueAppointments: number;
    byStatus: Record<string, number>;
  };
  financialStats: {
    totalRevenue: number;
    pendingRevenue: number;
    overdueInvoices: number;
    paidInvoices: number;
    byPaymentStatus: Record<string, any>;
  };
  waitingListStats: {
    totalWaiting: number;
    averageWaitDays: number;
    byStatus: Record<string, number>;
    byUrgency: Record<string, number>;
  };
  locationStats: {
    totalLocations: number;
    activeLocations: number;
    locationsWithTherapists: number;
  };
  systemAlerts: Array<{
    type: string;
    title: string;
    message: string;
    priority: string;
    action?: string;
  }>;
  recentActivity: Array<{
    action: string;
    entityType: string;
    timestamp: string;
    user: {
      name: string;
      role: string;
    };
    data?: any;
  }>;
}

// Client type based on backend response including all CSV imported fields
interface Client {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  mobile_phone?: string;
  user_status: 'active' | 'inactive' | 'pending';
  preferred_language: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  client_status: 'active' | 'new' | 'inactive';
  date_of_birth?: string;
  gender?: string;
  insurance_company?: string;
  insurance_number?: string;
  street_address?: string;
  street_name?: string;
  house_number?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  therapy_goals?: string;
  intake_completed: boolean;
  intake_date?: string;
  assigned_therapist_id?: string;
  therapist_first_name?: string;
  therapist_last_name?: string;
  total_appointments?: string;
  completed_appointments?: string;
  unpaid_appointments?: string;
  // Additional CSV imported fields
  bsn?: string;
  initials?: string;
  name_prefix?: string;
  salutation?: string;
  mailing_street_name?: string;
  mailing_house_number?: string;
  mailing_postal_code?: string;
  mailing_city?: string;
  mailing_country?: string;
  bank_account_iban?: string;
  general_practitioner_name?: string;
  general_practitioner_phone?: string;
  general_practitioner_email?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  guardian_relation?: string;
  newsletter_subscribed?: boolean;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  medical_notes?: string;
  referral_source?: string;
  primary_complaint?: string;
  treatment_history?: string;
}

// Therapist type
interface Therapist {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  specializations: string[];
  bio?: string;
  therapy_types?: string;
  qualifications?: string;
  years_of_experience?: number;
  license_number?: string;
  max_clients_per_day?: number;
  min_session_duration?: number;
  max_session_duration?: number;
  session_rate?: number;
  accepts_insurance?: boolean;
  languages_spoken?: string[];
  emergency_available?: boolean;
  online_therapy_available?: boolean;
}

// Appointment type
interface Appointment {
  id: string;
  client_id: string;
  therapist_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  therapy_type?: string;
  location?: string;
  session_notes?: string;
  homework_assigned?: string;
  payment_status: 'pending' | 'paid' | 'failed';
  invoice_sent: boolean;
  created_at: string;
  updated_at: string;
  client_first_name?: string;
  client_last_name?: string;
  therapist_first_name?: string;
  therapist_last_name?: string;
}

// Message type
interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
  message_type?: string;
  priority_level?: string;
  sender_first_name?: string;
  sender_last_name?: string;
  sender_role?: string;
}

// Helper function to wrap API calls with request management
const managedApiCall = async <T>(
  endpoint: string,
  apiCall: () => Promise<T>,
  cacheDuration: number = 30000,
  params?: any
): Promise<T> => {
  return requestManager.makeRequest(endpoint, apiCall, cacheDuration, params);
};

// Real API service that connects to the verified backend
export const realApiService = {
  // Health check
  health: {
    check: async (): Promise<{ status: string; timestamp: string; uptime: number; environment: string }> => {
      const response = await api.get('/health', { baseURL: 'https://praktijk-epd-backend-production.up.railway.app' });
      return response.data;
    }
  },

  // Admin endpoints (✅ All verified working)
  admin: {
    // Dashboard data (✅ WORKING)
    getDashboard: async (): Promise<ApiResponse<AdminDashboardData>> => {
      return managedApiCall('/admin/dashboard', async () => {
        const response = await api.get('/admin/dashboard');
        return response.data;
      }, 60000); // Cache for 1 minute
    },

    // Financial overview (✅ WORKING) 
    getFinancialOverview: async (): Promise<ApiResponse<any>> => {
      return managedApiCall('/admin/financial/overview', async () => {
        const response = await api.get('/admin/financial/overview');
        return response.data;
      }, 60000); // Cache for 1 minute
    },

    // Users management (✅ WORKING)
    getUsers: async (params?: { 
      page?: number; 
      limit?: number; 
      role?: string; 
      status?: string; 
      search?: string 
    }): Promise<ApiResponse<{ users: any[]; pagination: any }>> => {
      const response = await api.get('/admin/users', { params });
      return response.data;
    },

    createUser: async (userData: {
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      phone?: string;
    }): Promise<ApiResponse<{ userId: string; temporaryPassword?: string }>> => {
      const response = await api.post('/admin/users', userData);
      if (response.data.success) {
        requestManager.clearRelatedCache('/admin/users');
      }
      return response.data;
    },

    updateUser: async (userId: string, updates: any): Promise<ApiResponse<any>> => {
      const response = await api.put(`/admin/users/${userId}`, updates);
      if (response.data.success) {
        requestManager.clearRelatedCache('/admin/users');
      }
      return response.data;
    },

    // Client management (✅ WORKING)
    getClients: async (params?: { 
      status?: string; 
      therapistId?: string; 
      page?: number; 
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: string;
      intakeStatus?: string;
      registrationPeriod?: string;
    }): Promise<ApiResponse<{ clients: Client[]; pagination: any }>> => {
      const response = await api.get('/admin/clients', { params });
      return response.data;
    },

    getClient: async (clientId: string): Promise<ApiResponse<any>> => {
      const response = await api.get(`/admin/clients/${clientId}`);
      return response.data;
    },
    createClient: async (data: any): Promise<ApiResponse<any>> => {
      const response = await api.post('/admin/clients', data);
      return response.data;
    },
    updateClient: async (clientId: string, data: any): Promise<ApiResponse<any>> => {
      const response = await api.put(`/admin/clients/${clientId}`, data);
      return response.data;
    },
    deleteClient: async (clientId: string): Promise<ApiResponse<any>> => {
      const response = await api.delete(`/admin/clients/${clientId}`);
      return response.data;
    },

    // Client activation management (✅ NEW)
    sendActivationEmail: async (clientId: string): Promise<ApiResponse<any>> => {
      const response = await api.post(`/admin/activate-client/${clientId}`, {
        sendEmail: true,
        regeneratePassword: false
      });
      return response.data;
    },

    sendBulkActivationEmails: async (clientIds: string[], options?: {
      batchSize?: number;
      delayBetweenBatches?: number;
      regeneratePasswords?: boolean;
    }): Promise<ApiResponse<any>> => {
      const response = await api.post('/admin/activate-clients/bulk', {
        clientIds,
        sendEmails: true,
        batchSize: options?.batchSize || 10,
        delayBetweenBatches: options?.delayBetweenBatches || 2000,
        regeneratePasswords: options?.regeneratePasswords || false
      }, {
        timeout: 300000 // 5 minutes timeout for bulk operations
      });
      return response.data;
    },

    getUnverifiedClients: async (params?: { 
      limit?: number; 
      offset?: number; 
    }): Promise<ApiResponse<{ 
      clients: Client[]; 
      stats: any; 
      pagination: { 
        limit: number; 
        offset: number; 
        total: number; 
      } 
    }>> => {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());
      
      const url = `/admin/clients/unverified${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(url);
      return response.data;
    },

    getActivationStats: async (): Promise<ApiResponse<any>> => {
      const response = await api.get('/admin/activation-stats');
      return response.data;
    },

    resendVerificationEmail: async (clientId: string): Promise<ApiResponse<any>> => {
      const response = await api.post(`/admin/resend-verification/${clientId}`);
      return response.data;
    },

    // Therapist management (✅ WORKING)
    getTherapists: async (params?: any): Promise<ApiResponse<{ therapists: Therapist[]; pagination?: any }>> => {
      const response = await api.get('/admin/therapists', { params });
      return response.data;
    },

    // Get therapist by ID (Admin)
    getTherapistById: async (therapistId: string): Promise<ApiResponse<Therapist>> => {
      // Using the /admin/users/:id endpoint since backend doesn't have specific therapist endpoint
      const response = await api.get(`/admin/users/${therapistId}`);
      return response.data;
    },

    // Update therapist profile (Admin)
    updateTherapistProfile: async (therapistId: string, profileData: {
      licenseNumber?: string;
      specializations?: string[];
      therapyTypes?: string[];
      languages?: string[];
      bio?: string;
      qualifications?: string[];
      hourlyRate?: number;
      maxClientsPerDay?: number;
      sessionDuration?: number;
      breakBetweenSessions?: number;
      contractStatus?: string;
      contractStartDate?: string;
      contractEndDate?: string;
      maxClients?: number;
      yearsOfExperience?: number;
      onlineTherapy?: boolean;
      inPersonTherapy?: boolean;
      acceptingNewClients?: boolean;
      streetAddress?: string;
      postalCode?: string;
      city?: string;
      country?: string;
      kvkNumber?: string;
      bigNumber?: string;
    }): Promise<ApiResponse> => {
      const response = await api.put(`/admin/therapists/${therapistId}/profile`, profileData);
      return response.data;
    },

    // Upload therapist photo file (Admin)
    uploadTherapistPhoto: async (therapistId: string, file: File): Promise<ApiResponse<{ photoUrl: string }>> => {
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await api.post(`/admin/therapists/${therapistId}/photo/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },

    // Update therapist photo URL (Admin)
    updateTherapistPhoto: async (therapistId: string, photoUrl: string): Promise<ApiResponse<{ photoUrl: string }>> => {
      const response = await api.put(`/admin/therapists/${therapistId}/photo`, { photoUrl });
      return response.data;
    },

    // Delete therapist photo (Admin)
    deleteTherapistPhoto: async (therapistId: string): Promise<ApiResponse> => {
      const response = await api.delete(`/admin/therapists/${therapistId}/photo`);
      return response.data;
    },

    // Get therapist hulpvragen expertise (Admin)
    getTherapistHulpvragen: async (therapistId: string): Promise<ApiResponse<{
      therapist: { id: string; name: string };
      expertise: Array<{
        problem_category: string;
        expertise_level: number;
        years_experience: number;
        success_rate?: number;
        problem_name: string;
        problem_description: string;
        problem_name_en?: string;
        problem_description_en?: string;
      }>;
      availableHulpvragen: Array<{
        name: string;
        name_en?: string;
        description: string;
        description_en?: string;
        category: string;
        is_active: boolean;
      }>;
    }>> => {
      const response = await api.get(`/admin/therapists/${therapistId}/hulpvragen`);
      return response.data;
    },

    // Update therapist hulpvragen expertise (Admin)
    updateTherapistHulpvragen: async (therapistId: string, hulpvragenExpertise: Array<{
      problem_category: string;
      expertise_level: number;
      years_experience?: number;
      success_rate?: number;
    }>): Promise<ApiResponse<{ therapistId: string; updatedExpertise: number }>> => {
      const response = await api.put(`/admin/therapists/${therapistId}/hulpvragen`, { hulpvragenExpertise });
      return response.data;
    },

    // Auto-matching system management (Admin)
    getAutoMatchingStatus: async (): Promise<ApiResponse<{
      autoMatchingEnabled: boolean;
      statistics: {
        pendingRequests: number;
        totalAssignments: number;
        recentAssignments: number;
      };
      todayStats: {
        processed: number;
        assigned: number;
        lastRunAt: string | null;
      };
      weeklyStats: Array<{
        date: string;
        processed: number;
        assigned: number;
      }>;
    }>> => {
      const response = await api.get('/admin/auto-matching-status');
      return response.data;
    },

    toggleAutoMatching: async (enabled: boolean): Promise<ApiResponse<{ autoMatchingEnabled: boolean }>> => {
      const response = await api.post('/admin/toggle-auto-matching', { enabled });
      return response.data;
    },

    processAutoAssignments: async (): Promise<ApiResponse<{
      processed: number;
      assigned: number;
      minThreshold: number;
      assignments: Array<{
        requestId: string;
        clientName: string;
        therapistName: string;
        score: number;
        hulpvragen: string[];
      }>;
    }>> => {
      const response = await api.post('/admin/process-auto-assignments');
      return response.data;
    },

    // Waiting list (✅ WORKING)
    getWaitingList: async (params?: any): Promise<ApiResponse<{ waitingList: any[]; total: number }>> => {
      const response = await api.get('/admin/waiting-list', { params });
      return response.data;
    },

    // Appointments (✅ WORKING)
    getAppointments: async (params?: any): Promise<ApiResponse<{ appointments: Appointment[]; pagination?: any }>> => {
      const response = await api.get('/admin/appointments', { params });
      return response.data;
    },

    // Appointment Requests (NEW)
    getAppointmentRequests: async (params?: {
      status?: string;
      urgency?: string;
      page?: number;
      limit?: number;
    }): Promise<ApiResponse<{ requests: any[]; pagination: any }>> => {
      const response = await api.get('/admin/appointment-requests', { params });
      return response.data;
    },

    // Smart Pairing Recommendations (NEW)
    getSmartPairingRecommendations: async (params: {
      clientId: string;
      appointmentDate: string;
      appointmentTime: string;
    }): Promise<ApiResponse<{ recommendations: any[]; totalTherapistsEvaluated: number }>> => {
      const response = await api.get('/admin/smart-pairing-recommendations', { params });
      return response.data;
    },

    // Assign therapist to appointment request (NEW)
    assignAppointmentRequest: async (requestId: string, data: {
      therapistId: string;
    }): Promise<ApiResponse<any>> => {
      const response = await api.put(`/admin/appointment-requests/${requestId}/assign`, data);
      if (response.data.success) {
        requestManager.clearRelatedCache('/admin/appointment-requests');
        requestManager.clearRelatedCache('/admin/appointments');
      }
      return response.data;
    },

    // Reports (✅ WORKING)
    getReports: async (reportType: string, params?: any): Promise<ApiResponse<any>> => {
      const response = await api.get('/admin/reports', { params: { reportType, ...params } });
      return response.data;
    },
    
    // Therapies Management
    getTherapies: async (): Promise<ApiResponse<any[]>> => {
      const response = await api.get('/admin/therapies');
      return response.data;
    },
    
    createTherapy: async (data: any): Promise<ApiResponse<{ id: string }>> => {
      const response = await api.post('/admin/therapies', data);
      if (response.data.success) {
        requestManager.clearRelatedCache('/admin/therapies');
      }
      return response.data;
    },
    
    updateTherapy: async (id: string, data: any): Promise<ApiResponse<any>> => {
      const response = await api.put(`/admin/therapies/${id}`, data);
      if (response.data.success) {
        requestManager.clearRelatedCache('/admin/therapies');
      }
      return response.data;
    },
    
    deleteTherapy: async (id: string): Promise<ApiResponse<any>> => {
      const response = await api.delete(`/admin/therapies/${id}`);
      if (response.data.success) {
        requestManager.clearRelatedCache('/admin/therapies');
      }
      return response.data;
    },
    
    // Psychological Problems Management
    getPsychologicalProblems: async (): Promise<ApiResponse<any[]>> => {
      const response = await api.get('/admin/psychological-problems');
      return response.data;
    },
    
    createPsychologicalProblem: async (data: any): Promise<ApiResponse<{ id: string }>> => {
      const response = await api.post('/admin/psychological-problems', data);
      if (response.data.success) {
        requestManager.clearRelatedCache('/admin/psychological-problems');
      }
      return response.data;
    },
    
    updatePsychologicalProblem: async (id: string, data: any): Promise<ApiResponse<any>> => {
      const response = await api.put(`/admin/psychological-problems/${id}`, data);
      if (response.data.success) {
        requestManager.clearRelatedCache('/admin/psychological-problems');
      }
      return response.data;
    },
    
    deletePsychologicalProblem: async (id: string): Promise<ApiResponse<any>> => {
      const response = await api.delete(`/admin/psychological-problems/${id}`);
      if (response.data.success) {
        requestManager.clearRelatedCache('/admin/psychological-problems');
      }
      return response.data;
    },
    
    // Resources Management
    getResources: async (): Promise<ApiResponse<any[]>> => {
      const response = await api.get('/admin/resources');
      return response.data;
    },
    
    createResource: async (data: any): Promise<ApiResponse<any>> => {
      const response = await api.post('/admin/resources', data);
      if (response.data.success) {
        requestManager.clearRelatedCache('/admin/resources');
      }
      return response.data;
    },
    
    updateResource: async (id: string, data: any): Promise<ApiResponse<any>> => {
      const response = await api.put(`/admin/resources/${id}`, data);
      if (response.data.success) {
        requestManager.clearRelatedCache('/admin/resources');
      }
      return response.data;
    },
    
    deleteResource: async (id: string): Promise<ApiResponse<void>> => {
      const response = await api.delete(`/admin/resources/${id}`);
      if (response.data.success) {
        requestManager.clearRelatedCache('/admin/resources');
      }
      return response.data;
    },

    // Therapist Assignment (legacy)
    assignTherapist: async (data: {
      clientId: string;
      therapistId: string;
      appointmentRequestId?: string;
      notes?: string;
    }): Promise<ApiResponse<any>> => {
      const response = await api.post('/admin/assign-therapist', data);
      return response.data;
    },

    // Sessions Management
    getSessions: async (params?: {
      startDate?: string;
      endDate?: string;
      therapistId?: string;
      clientId?: string;
    }): Promise<ApiResponse<{ sessions: any[] }>> => {
      const response = await api.get('/admin/sessions', { params });
      return response.data;
    },

    getSessionStatistics: async (): Promise<ApiResponse<any>> => {
      const response = await api.get('/admin/sessions/statistics');
      return response.data;
    },

    // User Management
    updateUserStatus: async (userId: string, status: string, reason?: string): Promise<ApiResponse> => {
      const response = await api.put(`/admin/users/${userId}/status`, { status, reason });
      return response.data;
    },

    updateUserRole: async (userId: string, role: string, reason?: string): Promise<ApiResponse> => {
      const response = await api.put(`/admin/users/${userId}/role`, { role, reason });
      return response.data;
    },

    deleteUser: async (userId: string, permanent: boolean = false): Promise<ApiResponse> => {
      const response = await api.delete(`/admin/users/${userId}`, {
        params: { permanent }
      });
      return response.data;
    },

    getUserById: async (userId: string): Promise<ApiResponse<any>> => {
      const response = await api.get(`/admin/users/${userId}`);
      return response.data;
    },

    searchUsers: async (params: { query?: string; role?: string; status?: string }): Promise<ApiResponse<any[]>> => {
      const response = await api.get('/admin/users/search', { params });
      return response.data;
    },

    exportUsers: async (format: 'csv' | 'json' = 'json'): Promise<any> => {
      const response = await api.get('/admin/export/users', { 
        params: { format },
        responseType: format === 'csv' ? 'blob' : 'json'
      });
      return response.data;
    },

    // Appointment Management

    getSessionProgress: async (params?: any): Promise<ApiResponse<any[]>> => {
      const response = await api.get('/admin/session-progress', { params });
      return response.data;
    },

    // Waiting List Management
    assignFromWaitingList: async (id: string, therapistId: string, notes?: string): Promise<ApiResponse> => {
      const response = await api.post(`/admin/waiting-list/${id}/assign`, { therapistId, notes });
      return response.data;
    },

    updateWaitingListStatus: async (applicationId: string, status: string, notes?: string): Promise<ApiResponse> => {
      const response = await api.put(`/admin/waiting-list/${applicationId}/status`, { status, notes });
      return response.data;
    },

    // System Management
    getSystemSettings: async (): Promise<ApiResponse<any>> => {
      const response = await api.get('/admin/system/settings');
      return response.data;
    },

    updateSystemSettings: async (settings: any): Promise<ApiResponse> => {
      const response = await api.put('/admin/system/settings', { settings });
      return response.data;
    },

    getAuditLogs: async (params?: any): Promise<ApiResponse<any[]>> => {
      const response = await api.get('/admin/audit-logs', { params });
      return response.data;
    },

    createBackup: async (options?: { includeFiles?: boolean; includeDatabase?: boolean }): Promise<ApiResponse> => {
      const response = await api.post('/admin/backup', options);
      return response.data;
    },

    // Statistics & Analytics
    getGlobalStatistics: async (): Promise<ApiResponse<any>> => {
      const response = await api.get('/admin/statistics/global');
      return response.data;
    },

    getUserReport: async (params?: any): Promise<ApiResponse<any>> => {
      const response = await api.get('/admin/reports/users', { params });
      return response.data;
    },

    getAppointmentReport: async (params?: any): Promise<ApiResponse<any>> => {
      const response = await api.get('/admin/reports/appointments', { params });
      return response.data;
    },

    // Service Tests
    testMoneybirdConnection: async (): Promise<ApiResponse<any>> => {
      const response = await api.get('/admin/services/moneybird/test');
      return response.data;
    },

    testMollieConnection: async (): Promise<ApiResponse<any>> => {
      const response = await api.get('/admin/services/mollie/test');
      return response.data;
    }
  },

  // Contract Renewal Management
  contracts: {
    // Admin contract endpoints
    admin: {
      list: async (params?: {
        page?: number;
        limit?: number;
        status?: string;
        therapist_id?: string;
        client_id?: string;
        auto_renew?: boolean;
        search?: string;
      }): Promise<ApiResponse<{ contracts: any[]; pagination: any }>> => {
        const response = await api.get('/contracts/admin', { params });
        return response.data;
      },

      getStats: async (): Promise<ApiResponse<{
        total_contracts: number;
        active_contracts: number;
        expiring_soon: number;
        expired: number;
        expiring_30_days: number;
        expiring_14_days: number;
        expiring_7_days: number;
        auto_renew_enabled: number;
      }>> => {
        return managedApiCall('/contracts/admin/stats', async () => {
          const response = await api.get('/contracts/admin/stats');
          return response.data;
        }, 60000); // Cache for 1 minute
      },

      get: async (contractId: string): Promise<ApiResponse<{
        contract: any;
        history: any[];
      }>> => {
        const response = await api.get(`/contracts/admin/${contractId}`);
        return response.data;
      },

      create: async (data: {
        therapist_id: string;
        client_id: string;
        start_date: string;
        end_date: string;
        contract_type?: 'standard' | 'temporary' | 'trial';
        sessions_included?: number;
        auto_renew?: boolean;
        renewal_period_days?: number;
        contract_value?: number;
        payment_schedule?: 'monthly' | 'quarterly' | 'annually' | 'per_session';
        notes?: string;
      }): Promise<ApiResponse<any>> => {
        const response = await api.post('/contracts/admin', data);
        if (response.data.success) {
          requestManager.clearRelatedCache('/contracts/admin');
        }
        return response.data;
      },

      update: async (contractId: string, data: any): Promise<ApiResponse<any>> => {
        const response = await api.put(`/contracts/admin/${contractId}`, data);
        if (response.data.success) {
          requestManager.clearRelatedCache('/contracts/admin');
        }
        return response.data;
      },

      delete: async (contractId: string): Promise<ApiResponse<any>> => {
        const response = await api.delete(`/contracts/admin/${contractId}`);
        if (response.data.success) {
          requestManager.clearRelatedCache('/contracts/admin');
        }
        return response.data;
      },

      renew: async (contractId: string, data: {
        new_end_date: string;
        renewal_reason?: string;
        renewal_notes?: string;
      }): Promise<ApiResponse<any>> => {
        const response = await api.post(`/contracts/admin/${contractId}/renew`, data);
        if (response.data.success) {
          requestManager.clearRelatedCache('/contracts/admin');
        }
        return response.data;
      }
    },

    // Therapist contract endpoints
    therapist: {
      list: async (params?: {
        page?: number;
        limit?: number;
        status?: string;
      }): Promise<ApiResponse<{ contracts: any[]; pagination: any }>> => {
        const response = await api.get('/contracts/therapist', { params });
        return response.data;
      },

      get: async (contractId: string): Promise<ApiResponse<{
        contract: any;
        history: any[];
      }>> => {
        const response = await api.get(`/contracts/therapist/${contractId}`);
        return response.data;
      }
    }
  },

  // Therapist endpoints - using the new implementation with correct backend paths
  therapist: therapistApi,

  // Session management
  sessions: {
    start: async (data: any): Promise<ApiResponse<any>> => {
      const response = await api.post('/sessions/start', data);
      return response.data;
    },
    
    end: async (sessionId: string, data: any): Promise<ApiResponse<any>> => {
      const response = await api.post(`/sessions/${sessionId}/end`, data);
      return response.data;
    },
    
    updateProgress: async (sessionId: string, data: any): Promise<ApiResponse<any>> => {
      const response = await api.put(`/sessions/${sessionId}/progress`, data);
      return response.data;
    },
    
    getActive: async (): Promise<ApiResponse<any>> => {
      const response = await api.get('/sessions/active');
      return response.data;
    },
    
    getHistory: async (params?: any): Promise<ApiResponse<any>> => {
      const response = await api.get('/sessions', { params });
      return response.data;
    },

    // Additional session endpoints
    getStatistics: async (therapistId: string, params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<{
      totalSessions: number;
      completedSessions: number;
      cancelledSessions: number;
      noShows: number;
      averageSessionDuration: number;
      clientRetentionRate: number;
    }>> => {
      const response = await api.get(`/therapists/${therapistId}/session-stats`, { params });
      return response.data;
    },

    getClientSummary: async (clientId: string): Promise<ApiResponse<{
      totalSessions: number;
      lastSessionDate: string;
      averageMoodImprovement: number;
      commonThemes: string[];
      progressSummary: string;
    }>> => {
      const response = await api.get(`/clients/${clientId}/session-summary`);
      return response.data;
    }
  },

  // Old therapist implementation (kept for reference)
  therapist_old: {
    // Dashboard (✅ WORKING)
    getDashboard: async (): Promise<ApiResponse<{
      stats: {
        activeClients: number;
        todayAppointments: number;
        weeklyAppointments: number;
        completedSessions: number;
      };
      upcomingAppointments: Appointment[];
      recentClients: Client[];
    }>> => {
      const response = await api.get('/therapist/dashboard');
      return response.data;
    },

    // Profile (✅ WORKING)
    getProfile: async (): Promise<ApiResponse<Therapist>> => {
      const response = await api.get('/therapist/profile');
      return response.data;
    },

    updateProfile: async (data: {
      bio?: string;
      specializations?: string[];
      maxClientsPerDay?: number;
      [key: string]: any;
    }): Promise<ApiResponse<Therapist>> => {
      const response = await api.put('/therapist/profile', data);
      return response.data;
    },

    // Clients (✅ WORKING)
    getClients: async (params?: { status?: string }): Promise<ApiResponse<Client[]>> => {
      const response = await api.get('/therapist/clients', { params });
      return response.data;
    },

    getClient: async (clientId: string): Promise<ApiResponse<Client>> => {
      const response = await api.get(`/therapist/clients/${clientId}`);
      return response.data;
    },

    // Appointments (✅ WORKING)
    getAppointments: async (params?: { 
      date?: string; 
      status?: string;
      page?: number;
      limit?: number;
    }): Promise<ApiResponse<Appointment[]>> => {
      const response = await api.get('/therapist/appointments', { params });
      return response.data;
    },

    createAppointment: async (appointmentData: {
      clientId: string;
      appointmentDate: string;
      startTime: string;
      endTime: string;
      therapyType?: string;
      location?: string;
      notes?: string;
    }): Promise<ApiResponse<Appointment>> => {
      const response = await api.post('/therapist/appointments', appointmentData);
      return response.data;
    },

    updateAppointment: async (appointmentId: string, updates: {
      status?: string;
      notes?: string;
      [key: string]: any;
    }): Promise<ApiResponse<Appointment>> => {
      const response = await api.put(`/therapist/appointments/${appointmentId}`, updates);
      return response.data;
    },

    deleteAppointment: async (appointmentId: string): Promise<ApiResponse<any>> => {
      const response = await api.delete(`/therapist/appointments/${appointmentId}`);
      return response.data;
    },

    // Schedule (✅ WORKING)
    getSchedule: async (params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<any>> => {
      const response = await api.get('/therapist/schedule', { params });
      return response.data;
    },

    // Availability (✅ WORKING)
    getAvailability: async (): Promise<ApiResponse<any>> => {
      const response = await api.get('/therapist/availability');
      return response.data;
    },
    
    // Get available therapies (from admin)
    getAvailableTherapies: async (): Promise<ApiResponse<any[]>> => {
      const response = await api.get('/therapist/available-therapies');
      return response.data;
    },
    
    // Get available psychological problems (from admin)
    getAvailablePsychologicalProblems: async (): Promise<ApiResponse<any[]>> => {
      const response = await api.get('/therapist/available-psychological-problems');
      return response.data;
    },

    // Challenges
    getChallenges: async (): Promise<ApiResponse<{ challenges: any[] }>> => {
      const response = await api.get('/challenges');
      return response.data;
    },

    createChallenge: async (data: any): Promise<ApiResponse<any>> => {
      const response = await api.post('/challenges', data);
      return response.data;
    },

    updateChallenge: async (id: string, data: any): Promise<ApiResponse<any>> => {
      const response = await api.put(`/challenges/${id}`, data);
      return response.data;
    },

    deleteChallenge: async (id: string): Promise<ApiResponse<any>> => {
      const response = await api.delete(`/challenges/${id}`);
      return response.data;
    },

    assignChallenge: async (challengeId: string, clientId: string, data?: any): Promise<ApiResponse<any>> => {
      const response = await api.post(`/challenges/${challengeId}/assign`, { clientId, ...data });
      return response.data;
    },

    // Surveys
    getSurveys: async (): Promise<ApiResponse<{ surveys: any[] }>> => {
      const response = await api.get('/surveys');
      return response.data;
    },

    createSurvey: async (data: any): Promise<ApiResponse<any>> => {
      const response = await api.post('/surveys', data);
      return response.data;
    },

    updateSurvey: async (id: string, data: any): Promise<ApiResponse<any>> => {
      const response = await api.put(`/surveys/${id}`, data);
      return response.data;
    },

    deleteSurvey: async (id: string): Promise<ApiResponse<any>> => {
      const response = await api.delete(`/surveys/${id}`);
      return response.data;
    },

    assignSurvey: async (surveyId: string, clientId: string, data?: any): Promise<ApiResponse<any>> => {
      const response = await api.post(`/surveys/${surveyId}/assign`, { clientId, ...data });
      return response.data;
    },

    // Resources
    getResources: async (): Promise<ApiResponse<{ resources: any[] }>> => {
      const response = await api.get('/resources');
      return response.data;
    }
  },

  // Client endpoints (✅ All verified working)
  client: {
    // Dashboard (✅ WORKING)
    getDashboard: async (): Promise<ApiResponse<{
      profile: {
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
        status: string;
        intake_completed: boolean;
        therapy_goals: string;
      };
      metrics: {
        totalSessions: number;
        completedSessions: number;
        unreadMessages: number;
        nextAppointment: any;
      };
      upcomingAppointments: Appointment[];
      recentMessages: Message[];
      therapist: Therapist;
      progress: {
        total_sessions: string;
        completed_sessions: string;
        therapy_start_date: string | null;
        last_session_date: string | null;
      };
      pendingInvoices: any[];
    }>> => {
      const response = await api.get('/client/dashboard');
      return response.data;
    },

    // Profile (✅ WORKING)
    getProfile: async (): Promise<ApiResponse<Client>> => {
      const response = await api.get('/client/profile');
      return response.data;
    },

    updateProfile: async (data: {
      phone?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      [key: string]: any;
    }): Promise<ApiResponse<any>> => {
      const response = await api.put('/client/profile', data);
      return response.data;
    },

    // Appointments (✅ WORKING)
    getAppointments: async (params?: {
      status?: string;
      from?: string;
      to?: string;
      page?: number;
      limit?: number;
    }): Promise<ApiResponse<Appointment[]>> => {
      const response = await api.get('/client/appointments', { params });
      return response.data;
    },

    requestAppointment: async (data: {
      preferredDate: string;
      preferredTime: string;
      therapyType: string;
      urgencyLevel?: string;
      reason: string;
      appointmentType?: string;
      duration?: number;
      hulpvragen?: string[];
      problemDescription?: string;
    }): Promise<ApiResponse<{ id: string; status: string }>> => {
      const response = await api.post('/client/appointment-request', data);
      return response.data;
    },

    // Therapist Selection & Booking (✅ NEW)
    getAvailableTherapists: async (params?: {
      date?: string;
      time?: string;
      city?: string;
      specialization?: string;
    }): Promise<ApiResponse> => {
      const response = await api.get('/client/therapists/available', { params });
      return response.data;
    },

    bookWithTherapist: async (data: {
      therapistId: string;
      appointmentDate: string;
      appointmentTime: string;
      hulpvragen?: string[];
      problemDescription?: string;
      therapyType?: string;
      urgencyLevel?: string;
      appointmentType?: string;
      duration?: number;
    }): Promise<ApiResponse> => {
      const response = await api.post('/client/appointments/book-with-therapist', data);
      return response.data;
    },

    // Therapist info (✅ WORKING)
    getTherapist: async (): Promise<ApiResponse<Therapist>> => {
      const response = await api.get('/client/therapist');
      return response.data;
    },

    // Messages (✅ WORKING)
    getMessages: async (params?: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
    }): Promise<ApiResponse<{ messages: Message[]; total: number }>> => {
      const response = await api.get('/client/messages', { params });
      return response.data;
    },

    sendMessage: async (data: {
      recipient_id: string;
      subject: string;
      content: string;
      priority_level?: string;
    }): Promise<ApiResponse<{ id: string }>> => {
      const response = await api.post('/client/messages', data);
      return response.data;
    },

    // Intake form (✅ WORKING)
    submitIntakeForm: async (data: {
      reasonForTherapy: string;
      therapyGoals: string[] | string;
      medicalHistory?: string;
      medications?: string;
      previousTherapy?: boolean;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
    }): Promise<ApiResponse<any>> => {
      const response = await api.post('/client/intake-form', data);
      return response.data;
    },

    // Psychological problems (for hulpvragen selection) (✅ WORKING)
    getPsychologicalProblems: async (): Promise<ApiResponse<any[]>> => {
      const response = await api.get('/public/psychological-problems');
      return response.data;
    },

    // Preferences (✅ WORKING)
    getPreferences: async (): Promise<ApiResponse<{
      communicationMethod: string;
      appointmentReminders: boolean;
      reminderTime?: number;
      language: string;
      timezone: string;
    }>> => {
      const response = await api.get('/client/preferences');
      return response.data;
    },

    updatePreferences: async (data: any): Promise<ApiResponse<any>> => {
      const response = await api.put('/client/preferences', data);
      return response.data;
    },

    // Challenges
    getChallenges: async (): Promise<ApiResponse<{ challenges: any[] }>> => {
      const response = await api.get('/client/challenges');
      return response.data;
    },

    // Surveys
    getSurveys: async (): Promise<ApiResponse<{ surveys: any[] }>> => {
      const response = await api.get('/client/surveys');
      return response.data;
    },

    submitSurveyResponse: async (surveyId: string, responses: any): Promise<ApiResponse<any>> => {
      const response = await api.post(`/client/surveys/${surveyId}/respond`, { responses });
      return response.data;
    },

    // Resources
    getResources: async (): Promise<ApiResponse<{ resources: any[] }>> => {
      const response = await api.get('/client/resources');
      return response.data;
    },

    // Invoices (✅ WORKING)
    getInvoices: async (params?: { status?: string }): Promise<ApiResponse<any[]>> => {
      const response = await api.get('/client/invoices', { params });
      return response.data;
    },

    // Session history (✅ WORKING)
    getSessionHistory: async (params?: any): Promise<ApiResponse<any[]>> => {
      const response = await api.get('/client/sessions', { params });
      return response.data;
    },

    // Book appointment directly with therapist (for direct booking flow)
    bookAppointment: async (data: {
      therapistId: string;
      date: string;
      time: string;
      therapyType: string;
      notes?: string;
    }): Promise<ApiResponse<any>> => {
      const response = await api.post('/client/appointments/book', data);
      return response.data;
    },

    // Submit completion survey
    submitCompletionSurvey: async (surveyId: string, data: {
      overallRating: number;
      wouldRecommend: boolean;
      responses: Record<string, any>;
      additionalFeedback?: string;
    }): Promise<ApiResponse<any>> => {
      const response = await api.post(`/client/completion-survey/${surveyId}/submit`, data);
      return response.data;
    },

    // Get all therapists (for client self-booking)
    getTherapists: async (params?: { status?: string }): Promise<ApiResponse<{ therapists: Array<Therapist & { profile_photo_url?: string }> }>> => {
      const response = await api.get('/client/therapists', { params });
      return response.data;
    },

    // Get assigned therapist with photo
    getAssignedTherapist: async (): Promise<ApiResponse<Therapist & { profile_photo_url?: string }>> => {
      const response = await api.get('/client/assigned-therapist');
      return response.data;
    },

    // Medical history
    getMedicalHistory: async (): Promise<ApiResponse<{
      currentMedications: string[];
      allergies: string[];
      previousTherapy: boolean;
      previousTherapyDetails: string;
      medicalConditions: string[];
      hospitalizations: string[];
    }>> => {
      const response = await api.get('/client/medical-history');
      return response.data;
    },

    updateMedicalHistory: async (data: any): Promise<ApiResponse<any>> => {
      const response = await api.put('/client/medical-history', data);
      return response.data;
    },

    // Therapy goals
    getTherapyGoals: async (): Promise<ApiResponse<{
      goals: Array<{
        id: string;
        goal: string;
        status: 'active' | 'completed' | 'paused';
        progress: number;
        createdAt: string;
        targetDate: string;
      }>;
    }>> => {
      const response = await api.get('/client/therapy-goals');
      return response.data;
    },

    updateTherapyGoals: async (data: any): Promise<ApiResponse<any>> => {
      const response = await api.put('/client/therapy-goals', data);
      return response.data;
    },

    // Emergency contact
    updateEmergencyContact: async (data: {
      name: string;
      relationship: string;
      phone: string;
      alternatePhone?: string;
      email?: string;
    }): Promise<ApiResponse<any>> => {
      const response = await api.put('/client/emergency-contact', data);
      return response.data;
    }
  },

  // Resources endpoints (✅ All verified working)
  resources: {
    // Get all resources (✅ WORKING)
    getResources: async (params?: any): Promise<ApiResponse<any>> => {
      const response = await api.get('/resources', { params });
      return response.data;
    },
    
    // Get specific resource (✅ WORKING)
    getResourceById: async (id: string): Promise<ApiResponse<any>> => {
      const response = await api.get(`/resources/${id}`);
      return response.data;
    },
    
    // Create resource (✅ WORKING)
    createResource: async (data: {
      title: string;
      description: string;
      type: string;
      category: string;
      contentBody?: string;
      contentUrl?: string;
      difficulty: string;
      tags: string[];
      isPublic: boolean;
      durationMinutes?: number;
    }): Promise<ApiResponse<{ id: string }>> => {
      const response = await api.post('/resources', data);
      // Clear cache after successful creation
      if (response.data.success) {
        requestManager.clearRelatedCache('/resources');
      }
      return response.data;
    },
    
    // Update resource (✅ WORKING)
    updateResource: async (id: string, data: any): Promise<ApiResponse<any>> => {
      const response = await api.put(`/resources/${id}`, data);
      // Clear cache after successful update
      if (response.data.success) {
        requestManager.clearRelatedCache('/resources');
      }
      return response.data;
    },
    
    // Delete resource (✅ WORKING)
    deleteResource: async (id: string): Promise<ApiResponse<any>> => {
      const response = await api.delete(`/resources/${id}`);
      // Clear cache after successful deletion
      if (response.data.success) {
        requestManager.clearRelatedCache('/resources');
      }
      return response.data;
    },
    
    // Assign resource (✅ WORKING)
    assignResource: async (id: string, data: {
      clientId: string;
      dueDate?: string;
      priority?: string;
      notes?: string;
    }): Promise<ApiResponse<any>> => {
      const response = await api.post(`/resources/${id}/assign`, data);
      return response.data;
    },

    // Get client resources (✅ WORKING)
    getClientResources: async (): Promise<ApiResponse<any>> => {
      const response = await api.get('/client/resources');
      return response.data;
    },
    
    // Track resource engagement
    trackEngagement: async (resourceId: string, action: 'view' | 'complete' | { action: string; timeSpent?: number; completed?: boolean; rating?: number }): Promise<ApiResponse<any>> => {
      const data = typeof action === 'string' ? { action } : action;
      const response = await api.post(`/resources/${resourceId}/track`, data);
      return response.data;
    },
    
    // Update progress
    updateProgress: async (resourceId: string, data: { isFavorite?: boolean }): Promise<ApiResponse<any>> => {
      const response = await api.put(`/resources/${resourceId}/progress`, data);
      return response.data;
    }
  },

  // Challenges endpoints (✅ All verified working)
  challenges: {
    // Get all challenges (✅ WORKING)
    getChallenges: async (params?: any): Promise<ApiResponse<any>> => {
      const response = await api.get('/challenges', { params });
      return response.data;
    },
    
    // Get specific challenge (✅ WORKING)
    getChallengeById: async (id: string): Promise<ApiResponse<any>> => {
      const response = await api.get(`/challenges/${id}`);
      return response.data;
    },
    
    // Create challenge (✅ WORKING)
    createChallenge: async (data: {
      title: string;
      description: string;
      category: string;
      difficulty: string;
      duration: number;
      targetValue: number;
      targetUnit: string;
      isPublic: boolean;
      milestones?: any[];
      rewards?: any;
      instructions?: string[];
      tips?: string[];
    }): Promise<ApiResponse<{ id: string }>> => {
      const response = await api.post('/challenges', data);
      if (response.data.success) {
        requestManager.clearRelatedCache('/challenges');
      }
      return response.data;
    },
    
    // Update challenge (✅ WORKING)
    updateChallenge: async (id: string, data: any): Promise<ApiResponse<any>> => {
      const response = await api.put(`/challenges/${id}`, data);
      if (response.data.success) {
        requestManager.clearRelatedCache('/challenges');
      }
      return response.data;
    },
    
    // Delete challenge (✅ WORKING)
    deleteChallenge: async (id: string): Promise<ApiResponse<any>> => {
      const response = await api.delete(`/challenges/${id}`);
      if (response.data.success) {
        requestManager.clearRelatedCache('/challenges');
      }
      return response.data;
    },
    
    // Join challenge (✅ WORKING)
    joinChallenge: async (id: string): Promise<ApiResponse<any>> => {
      const response = await api.post(`/challenges/${id}/join`);
      return response.data;
    },
    
    // Update progress (✅ WORKING)
    updateProgress: async (id: string, data: {
      progressData: any;
      progressPercentage: number;
      milestoneReached?: any;
    }): Promise<ApiResponse<any>> => {
      const response = await api.post(`/challenges/${id}/progress`, data);
      return response.data;
    },

    // Start challenge check-in
    startCheckIn: async (challengeId: string, date: string, moodBefore?: number): Promise<ApiResponse<{ checkinId: string; timerStarted: boolean }>> => {
      const response = await api.post(`/client/challenges/${challengeId}/check-in`, { 
        date,
        moodBefore: moodBefore || 5 
      });
      return response.data;
    },

    // Complete challenge check-in
    completeCheckIn: async (challengeId: string, checkInId: string, data: { 
      notes?: string; 
      moodAfter?: number;
      anxietyAfter?: number;
      duration?: number;
      difficulty?: string;
      completed?: boolean;
    }): Promise<ApiResponse<any>> => {
      const response = await api.put(`/client/challenges/${challengeId}/check-in/complete`, { 
        checkInId,
        ...data 
      });
      return response.data;
    },

    // Stop challenge check-in without completion
    stopCheckIn: async (challengeId: string, checkInId: string): Promise<ApiResponse<any>> => {
      const response = await api.post(`/client/challenges/${challengeId}/check-in/stop`, { 
        checkInId
      });
      return response.data;
    }
  },

  // Surveys endpoints (✅ All verified working)
  surveys: {
    // Get all surveys (✅ WORKING)
    getSurveys: async (params?: any): Promise<ApiResponse<any>> => {
      const response = await api.get('/surveys', { params });
      return response.data;
    },
    
    // Get specific survey (✅ WORKING)
    getSurveyById: async (id: string): Promise<ApiResponse<any>> => {
      const response = await api.get(`/surveys/${id}`);
      return response.data;
    },
    
    // Create survey (✅ WORKING)
    createSurvey: async (data: {
      title: string;
      description: string;
      type: string;
      questions: Array<{
        id: string;
        text: string;
        type: string;
        required: boolean;
        scale?: { min: number; max: number };
        options?: string[];
      }>;
    }): Promise<ApiResponse<{ id: string }>> => {
      const response = await api.post('/surveys', data);
      return response.data;
    },
    
    // Update survey (✅ WORKING)
    updateSurvey: async (id: string, data: any): Promise<ApiResponse<any>> => {
      const response = await api.put(`/surveys/${id}`, data);
      return response.data;
    },
    
    // Delete survey (✅ WORKING)
    deleteSurvey: async (id: string): Promise<ApiResponse<any>> => {
      const response = await api.delete(`/surveys/${id}`);
      return response.data;
    },
    
    // Submit response (✅ WORKING)
    submitResponse: async (id: string, data: {
      responses: Record<string, any>;
    }): Promise<ApiResponse<any>> => {
      const response = await api.post(`/surveys/${id}/respond`, data);
      return response.data;
    },
    
    // Submit survey (alternative endpoint)
    submit: async (id: string, data: {
      responses: any[];
      completedAt: string;
    }): Promise<ApiResponse<any>> => {
      const response = await api.post(`/surveys/${id}/submit`, data);
      return response.data;
    },
    
    // Get survey responses
    getResponses: async (id: string): Promise<ApiResponse<{ responses: any[] }>> => {
      const response = await api.get(`/surveys/${id}/responses`);
      return response.data;
    },
    
    // Save survey progress
    saveProgress: async (id: string, data: {
      responses: any[];
      currentQuestionIndex: number;
    }): Promise<ApiResponse<any>> => {
      const response = await api.post(`/surveys/${id}/progress`, data);
      return response.data;
    }
  },

  // Assistant endpoints
  assistant: {
    // Dashboard
    getDashboard: async (): Promise<ApiResponse<any>> => {
      return managedApiCall('/assistant/dashboard', async () => {
        const response = await api.get('/assistant/dashboard');
        return response.data;
      }, 60000);
    },

    // Appointments
    getAppointments: async (params?: { date?: string; status?: string }): Promise<ApiResponse<Appointment[]>> => {
      return managedApiCall('/assistant/appointments', async () => {
        const response = await api.get('/assistant/appointments', { params });
        return response.data;
      }, 30000);
    },

    // Clients
    getClients: async (params?: { status?: string }): Promise<ApiResponse<{ clients: Client[] }>> => {
      return managedApiCall('/assistant/clients', async () => {
        const response = await api.get('/assistant/clients', { params });
        return response.data;
      }, 60000);
    },

    // Messages
    getMessages: async (): Promise<ApiResponse<Message[]>> => {
      return managedApiCall('/assistant/messages', async () => {
        const response = await api.get('/assistant/messages');
        return response.data;
      }, 30000);
    },

    sendMessage: async (messageData: any): Promise<ApiResponse<{ id: string }>> => {
      const response = await api.post('/assistant/messages', messageData);
      return response.data;
    }
  },

  // Bookkeeper endpoints
  bookkeeper: {
    // Dashboard
    getDashboard: async (): Promise<ApiResponse<any>> => {
      return managedApiCall('/bookkeeper/dashboard', async () => {
        const response = await api.get('/bookkeeper/dashboard');
        return response.data;
      });
    },

    // Invoices
    getInvoices: async (params?: { status?: string; clientId?: string; page?: number; limit?: number }): Promise<ApiResponse<any>> => {
      return managedApiCall('/bookkeeper/invoices', async () => {
        const response = await api.get('/bookkeeper/invoices', { params });
        return response.data;
      }, 30000, params);
    },

    createInvoice: async (invoiceData: any): Promise<ApiResponse<any>> => {
      const response = await api.post('/bookkeeper/invoices', invoiceData);
      return response.data;
    },

    updateInvoice: async (invoiceId: string, updates: any): Promise<ApiResponse<any>> => {
      const response = await api.put(`/bookkeeper/invoices/${invoiceId}`, updates);
      return response.data;
    },

    deleteInvoice: async (invoiceId: string): Promise<ApiResponse<any>> => {
      const response = await api.delete(`/bookkeeper/invoices/${invoiceId}`);
      return response.data;
    },

    markInvoicePaid: async (invoiceId: string): Promise<ApiResponse<any>> => {
      const response = await api.put(`/bookkeeper/invoices/${invoiceId}/status`, { status: 'paid' });
      return response.data;
    },

    // Reports
    getReports: async (reportType: string, params?: any): Promise<ApiResponse<any>> => {
      return managedApiCall(`/bookkeeper/reports/${reportType}`, async () => {
        const response = await api.get('/bookkeeper/reports', { params: { reportType, ...params } });
        return response.data;
      }, 30000, params);
    },

    // Financial Overview
    getFinancialOverview: async (period?: string): Promise<ApiResponse<any>> => {
      return managedApiCall('/bookkeeper/financial-overview', async () => {
        const response = await api.get('/bookkeeper/financial-overview', { params: { period } });
        return response.data;
      }, 30000, { period });
    },

    // Messages
    getMessages: async (params?: { page?: number; limit?: number }): Promise<ApiResponse<any>> => {
      return managedApiCall('/bookkeeper/messages', async () => {
        const response = await api.get('/bookkeeper/messages', { params });
        return response.data;
      }, 30000, params);
    },

    sendMessage: async (messageData: any): Promise<ApiResponse<any>> => {
      const response = await api.post('/bookkeeper/messages', messageData);
      return response.data;
    },

    // Export
    exportInvoices: async (format: 'csv' | 'pdf', params?: any): Promise<any> => {
      const response = await api.get('/bookkeeper/export/invoices', { 
        params: { format, ...params },
        responseType: 'blob'
      });
      return response.data;
    },

    exportPayments: async (format: 'csv' | 'pdf', params?: any): Promise<any> => {
      const response = await api.get('/bookkeeper/export/payments', { 
        params: { format, ...params },
        responseType: 'blob'
      });
      return response.data;
    },

    // Clients
    getClients: async (params?: { page?: number; limit?: number; search?: string; hasOutstandingBalance?: boolean }): Promise<ApiResponse<any>> => {
      return managedApiCall('/bookkeeper/clients', async () => {
        const response = await api.get('/bookkeeper/clients', { params });
        return response.data;
      }, 30000, params);
    },

    // Therapists
    getTherapists: async (params?: { page?: number; limit?: number; search?: string; includeRevenue?: boolean }): Promise<ApiResponse<any>> => {
      return managedApiCall('/bookkeeper/therapists', async () => {
        const response = await api.get('/bookkeeper/therapists', { params });
        return response.data;
      }, 30000, params);
    },

    // Client Balances
    getClientBalances: async (params?: { clientId?: string; includeZeroBalance?: boolean; sortBy?: string; sortOrder?: string }): Promise<ApiResponse<any>> => {
      return managedApiCall('/bookkeeper/clients/balances', async () => {
        const response = await api.get('/bookkeeper/clients/balances', { params });
        return response.data;
      }, 30000, params);
    },

    // Payments
    getPayments: async (params?: { page?: number; limit?: number; startDate?: string; endDate?: string; paymentMethod?: string; clientId?: string }): Promise<ApiResponse<any>> => {
      return managedApiCall('/bookkeeper/payments', async () => {
        const response = await api.get('/bookkeeper/payments', { params });
        return response.data;
      }, 30000, params);
    },

    processPayment: async (paymentData: { invoiceId: string; amount: number; paymentMethod: string; paymentDate: string; reference?: string; notes?: string }): Promise<ApiResponse<any>> => {
      const response = await api.post('/bookkeeper/payments', paymentData);
      requestManager.clearRelatedCache('/invoices');
      return response.data;
    },

    // Financial Reports
    getFinancialReports: async (params?: { reportType?: string; startDate?: string; endDate?: string; groupBy?: string }): Promise<ApiResponse<any>> => {
      return managedApiCall('/bookkeeper/reports', async () => {
        const response = await api.get('/bookkeeper/reports', { params });
        return response.data;
      }, 60000, params);
    },

    // Analytics
    getRevenueTrends: async (params?: { period?: string; startDate?: string; endDate?: string; therapistId?: string }): Promise<ApiResponse<any>> => {
      return managedApiCall('/bookkeeper/analytics/revenue-trends', async () => {
        const response = await api.get('/bookkeeper/analytics/revenue-trends', { params });
        return response.data;
      }, 60000, params);
    },

    getCollectionEfficiency: async (params?: { startDate?: string; endDate?: string; clientId?: string }): Promise<ApiResponse<any>> => {
      return managedApiCall('/bookkeeper/analytics/collection-efficiency', async () => {
        const response = await api.get('/bookkeeper/analytics/collection-efficiency', { params });
        return response.data;
      }, 60000, params);
    },

    // Bulk Actions
    sendBulkReminders: async (data: { invoiceIds: string[]; reminderType: string; message?: string }): Promise<ApiResponse<any>> => {
      const response = await api.post('/bookkeeper/bulk-actions/send-reminders', data);
      return response.data;
    },

    markBulkOverdue: async (data?: { dryRun?: boolean }): Promise<ApiResponse<any>> => {
      const response = await api.post('/bookkeeper/bulk-actions/mark-overdue', data);
      requestManager.clearRelatedCache('/invoices');
      return response.data;
    },

    // Specific Report Endpoints
    getRevenueReport: async (): Promise<ApiResponse<any>> => {
      return managedApiCall('/bookkeeper/reports/revenue', async () => {
        const response = await api.get('/bookkeeper/reports/revenue');
        return response.data;
      });
    },

    getOutstandingReport: async (): Promise<ApiResponse<any>> => {
      return managedApiCall('/bookkeeper/reports/outstanding', async () => {
        const response = await api.get('/bookkeeper/reports/outstanding');
        return response.data;
      });
    },

    getTaxReport: async (): Promise<ApiResponse<any>> => {
      return managedApiCall('/bookkeeper/reports/tax', async () => {
        const response = await api.get('/bookkeeper/reports/tax');
        return response.data;
      });
    }
  },

  // Invoices endpoints (generic)
  invoices: {
    getAll: async (params?: { status?: string; page?: number; limit?: number }): Promise<ApiResponse<any>> => {
      return managedApiCall('/invoices', async () => {
        const response = await api.get('/invoices', { params });
        return response.data;
      }, 30000, params);
    },

    getById: async (id: string): Promise<ApiResponse<any>> => {
      return managedApiCall(`/invoices/${id}`, async () => {
        const response = await api.get(`/invoices/${id}`);
        return response.data;
      });
    },

    create: async (invoiceData: any): Promise<ApiResponse<any>> => {
      const response = await api.post('/invoices', invoiceData);
      return response.data;
    },

    update: async (id: string, updates: any): Promise<ApiResponse<any>> => {
      const response = await api.put(`/invoices/${id}`, updates);
      return response.data;
    },

    delete: async (id: string): Promise<ApiResponse<any>> => {
      const response = await api.delete(`/invoices/${id}`);
      return response.data;
    }
  },

  // Clients endpoints (generic)
  clients: {
    getAll: async (params?: { status?: string; page?: number; limit?: number }): Promise<ApiResponse<any>> => {
      return managedApiCall('/therapist/clients', async () => {
        const response = await api.get('/therapist/clients', { params });
        return response.data;
      }, 30000, params);
    },

    getById: async (id: string): Promise<ApiResponse<any>> => {
      return managedApiCall(`/clients/${id}`, async () => {
        const response = await api.get(`/clients/${id}`);
        return response.data;
      });
    },

    create: async (clientData: any): Promise<ApiResponse<any>> => {
      const response = await api.post('/clients', clientData);
      return response.data;
    },

    update: async (id: string, updates: any): Promise<ApiResponse<any>> => {
      const response = await api.put(`/clients/${id}`, updates);
      return response.data;
    },

    delete: async (id: string): Promise<ApiResponse<any>> => {
      const response = await api.delete(`/clients/${id}`);
      return response.data;
    }
  },

  // Therapists endpoints (redirected to admin endpoints)
  therapists: {
    getAll: async (params?: { status?: string; page?: number; limit?: number }): Promise<ApiResponse<any>> => {
      // Use client endpoint that doesn't require admin privileges
      return realApiService.client.getTherapists(params);
    },

    getById: async (id: string): Promise<ApiResponse<any>> => {
      // For now, return a not implemented error since we don't have a single therapist endpoint
      throw new Error('Get therapist by ID not implemented. Use admin.getTherapists() instead.');
    },

    create: async (therapistData: any): Promise<ApiResponse<any>> => {
      // Use admin create user endpoint
      return realApiService.admin.createUser({
        ...therapistData,
        role: 'therapist'
      });
    },

    update: async (id: string, updates: any): Promise<ApiResponse<any>> => {
      // Use admin update user endpoint
      return realApiService.admin.updateUser(id, updates);
    },

    delete: async (id: string): Promise<ApiResponse<any>> => {
      // Soft delete by changing status
      return realApiService.admin.updateUser(id, { status: 'inactive' });
    }
  },

  // Appointments endpoints (generic)
  appointments: {
    getAll: async (params?: { startDate?: string; endDate?: string; status?: string; page?: number; limit?: number }): Promise<ApiResponse<any>> => {
      return managedApiCall('/appointments', async () => {
        const response = await api.get('/appointments', { params });
        return response.data;
      }, 30000, params);
    },

    getById: async (id: string): Promise<ApiResponse<any>> => {
      return managedApiCall(`/appointments/${id}`, async () => {
        const response = await api.get(`/appointments/${id}`);
        return response.data;
      });
    },

    create: async (appointmentData: any): Promise<ApiResponse<any>> => {
      const response = await api.post('/appointments', appointmentData);
      return response.data;
    },

    update: async (id: string, updates: any): Promise<ApiResponse<any>> => {
      const response = await api.put(`/appointments/${id}`, updates);
      return response.data;
    },

    delete: async (id: string): Promise<ApiResponse<any>> => {
      const response = await api.delete(`/appointments/${id}`);
      return response.data;
    },
    getAvailableSlots: async (params: { therapistId: string; date: string }): Promise<ApiResponse<{ slots: { time: string; available: boolean }[] }>> => {
      const response = await api.get('/appointments/available-slots', { params });
      return response.data;
    },

    // Recurring appointments
    createRecurringPattern: async (appointmentId: string, data: {
      pattern: 'weekly' | 'biweekly' | 'monthly';
      endDate: string;
      exceptions?: string[];
    }): Promise<ApiResponse<any>> => {
      const response = await api.post(`/appointments/${appointmentId}/recurring`, data);
      return response.data;
    },

    // No-show policy
    applyNoShowPolicy: async (appointmentId: string, data: {
      reason: string;
      applyFee: boolean;
      feeAmount?: number;
      notifyClient: boolean;
    }): Promise<ApiResponse<any>> => {
      const response = await api.post(`/appointments/${appointmentId}/no-show-policy`, data);
      return response.data;
    },

    // Appointment preparation
    updatePreparation: async (appointmentId: string, data: {
      preparationNotes: string;
      reviewPreviousSession: boolean;
      focusAreas: string[];
    }): Promise<ApiResponse<any>> => {
      const response = await api.put(`/appointments/${appointmentId}/preparation`, data);
      return response.data;
    }
  },

  // Messages endpoints
  messages: {
    getAll: async (): Promise<ApiResponse<{ messages: Message[] }>> => {
      const response = await api.get('/messages');
      return response.data;
    },

    getInbox: async (userId: string): Promise<ApiResponse<{ messages: Message[] }>> => {
      const response = await api.get(`/messages/conversation/${userId}`);
      return response.data;
    },

    send: async (messageData: any): Promise<ApiResponse<Message>> => {
      const response = await api.post('/messages', messageData);
      return response.data;
    },

    markAsRead: async (messageId: string): Promise<ApiResponse> => {
      const response = await api.put(`/messages/${messageId}/read`);
      return response.data;
    }
  },

  // Notifications endpoints
  notifications: {
    getNotifications: async (params?: { limit?: number; unreadOnly?: boolean }): Promise<ApiResponse<{ notifications: any[]; unreadCount: number }>> => {
      const response = await api.get('/notifications', { params });
      return response.data;
    },

    markAsRead: async (notificationId: string): Promise<ApiResponse> => {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    },

    markAllAsRead: async (): Promise<ApiResponse> => {
      const response = await api.put('/notifications/mark-all-read');
      return response.data;
    },

    deleteNotification: async (notificationId: string): Promise<ApiResponse> => {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    },

    getPreferences: async (): Promise<ApiResponse<any>> => {
      const response = await api.get('/notifications/preferences');
      return response.data;
    },

    updatePreferences: async (preferences: any): Promise<ApiResponse> => {
      const response = await api.put('/notifications/preferences', preferences);
      return response.data;
    }
  },

  // Billing endpoints
  billing: {
    // Treatment codes
    getTreatmentCodes: async (): Promise<ApiResponse<any>> => {
      const response = await api.get('/billing/treatment-codes');
      return response.data;
    },
    
    createTreatmentCode: async (data: any): Promise<ApiResponse<any>> => {
      const response = await api.post('/billing/treatment-codes', data);
      return response.data;
    },
    
    updateTreatmentCode: async (id: string, data: any): Promise<ApiResponse<any>> => {
      const response = await api.put(`/billing/treatment-codes/${id}`, data);
      return response.data;
    },
    
    deleteTreatmentCode: async (id: string): Promise<ApiResponse<any>> => {
      const response = await api.delete(`/billing/treatment-codes/${id}`);
      return response.data;
    },

    // Invoices
    getInvoices: async (params?: any): Promise<ApiResponse<any>> => {
      const response = await api.get('/billing/invoices', { params });
      return response.data;
    },
    
    createInvoice: async (data: any): Promise<ApiResponse<any>> => {
      const response = await api.post('/billing/invoices', data);
      return response.data;
    },
    
    getInvoiceById: async (id: string): Promise<ApiResponse<any>> => {
      const response = await api.get(`/billing/invoices/${id}`);
      return response.data;
    },
    
    updateInvoice: async (id: string, data: any): Promise<ApiResponse<any>> => {
      const response = await api.put(`/billing/invoices/${id}`, data);
      return response.data;
    },
    
    sendInvoice: async (id: string): Promise<ApiResponse<any>> => {
      const response = await api.post(`/billing/invoices/${id}/send`);
      return response.data;
    },

    // Session billing
    createSessionBilling: async (data: {
      appointment_id: string;
      client_id: string;
      duration_minutes: number;
      treatment_code_id: string;
      notes?: string;
      deductible_applied: boolean;
      deductible_amount?: number;
      create_invoice: boolean;
      send_invoice: boolean;
    }): Promise<ApiResponse<any>> => {
      const response = await api.post('/billing/sessions', data);
      return response.data;
    },

    // Payment methods
    getPaymentMethods: async (clientId: string): Promise<ApiResponse<any>> => {
      const response = await api.get(`/billing/clients/${clientId}/payment-methods`);
      return response.data;
    },
    
    addPaymentMethod: async (clientId: string, data: any): Promise<ApiResponse<any>> => {
      const response = await api.post(`/billing/clients/${clientId}/payment-methods`, data);
      return response.data;
    },
    
    updatePaymentMethod: async (clientId: string, methodId: string, data: any): Promise<ApiResponse<any>> => {
      const response = await api.put(`/billing/clients/${clientId}/payment-methods/${methodId}`, data);
      return response.data;
    },
    
    deletePaymentMethod: async (clientId: string, methodId: string): Promise<ApiResponse<any>> => {
      const response = await api.delete(`/billing/clients/${clientId}/payment-methods/${methodId}`);
      return response.data;
    },
    
    setDefaultPaymentMethod: async (clientId: string, methodId: string): Promise<ApiResponse<any>> => {
      const response = await api.put(`/billing/clients/${clientId}/payment-methods/${methodId}/default`);
      return response.data;
    },

    // Payment preferences
    getPaymentPreferences: async (clientId: string): Promise<ApiResponse<any>> => {
      const response = await api.get(`/billing/clients/${clientId}/preferences`);
      return response.data;
    },
    
    updatePaymentPreferences: async (clientId: string, preferences: any): Promise<ApiResponse<any>> => {
      const response = await api.put(`/billing/clients/${clientId}/preferences`, preferences);
      return response.data;
    },

    // Manual invoice generation
    generateManualInvoice: async (data: {
      client_id: string;
      therapist_id: string;
      items: Array<{
        description: string;
        quantity: number;
        unit_price: number;
        vat_rate: number;
      }>;
      notes?: string;
      due_date?: string;
      send_immediately: boolean;
    }): Promise<ApiResponse<any>> => {
      const response = await api.post('/billing/invoices/manual', data);
      return response.data;
    },

    // Reports
    getRevenueReport: async (params?: any): Promise<ApiResponse<any>> => {
      const response = await api.get('/billing/reports/revenue', { params });
      return response.data;
    },
    
    getTaxReport: async (params?: any): Promise<ApiResponse<any>> => {
      const response = await api.get('/billing/reports/tax', { params });
      return response.data;
    },

    // Client billing
    getClientInvoices: async (clientId: string, params?: any): Promise<ApiResponse<any>> => {
      const response = await api.get(`/billing/clients/${clientId}/invoices`, { params });
      return response.data;
    },
    
    getClientBalance: async (clientId: string): Promise<ApiResponse<any>> => {
      const response = await api.get(`/billing/clients/${clientId}/balance`);
      return response.data;
    },

    // Payment processing
    processPayment: async (invoiceId: string, data: {
      payment_method_id: string;
      amount: number;
      payment_date?: string;
    }): Promise<ApiResponse<any>> => {
      const response = await api.post(`/billing/invoices/${invoiceId}/payment`, data);
      return response.data;
    },

    // SEPA setup
    setupSepa: async (clientId: string, data: {
      iban: string;
      account_holder: string;
      mandate_text: string;
    }): Promise<ApiResponse<any>> => {
      const response = await api.post(`/billing/clients/${clientId}/sepa/setup`, data);
      return response.data;
    },
    
    revokeSepaMandate: async (clientId: string, mandateId: string): Promise<ApiResponse<any>> => {
      const response = await api.delete(`/billing/clients/${clientId}/sepa/${mandateId}`);
      return response.data;
    }
  },

  // Common endpoints available to all authenticated users
  common: {
    // Health check
    healthCheck: async (): Promise<any> => {
      const response = await api.get('/health');
      return response.data;
    }
  },

  // Profile photo endpoints
  profile: {
    // Upload profile photo
    uploadPhoto: async (file: File): Promise<ApiResponse<{ photoUrl: string }>> => {
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await api.post('/profile/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    },

    // Get profile photo
    getPhoto: async (userId: string): Promise<ApiResponse<{ photoUrl: string | null }>> => {
      const response = await api.get(`/profile/photo/${userId}`);
      return response.data;
    },

    // Delete profile photo
    deletePhoto: async (): Promise<ApiResponse> => {
      const response = await api.delete('/profile/photo');
      return response.data;
    }
  }
};

// Helper function to check if an endpoint is available
export const checkEndpointAvailability = async (endpoint: string): Promise<{
  available: boolean;
  status?: number;
  error?: string;
}> => {
  try {
    const response = await api.get(endpoint);
    return {
      available: true,
      status: response.status
    };
  } catch (error: any) {
    return {
      available: false,
      status: error.response?.status || 0,
      error: error.message || 'Unknown error'
    };
  }
};

// Cache management utilities
export const cacheUtils = {
  clearAll: () => requestManager.clearCache(),
  clearEndpoint: (endpoint: string) => requestManager.clearEndpointCache(endpoint)
};

// Export default for backward compatibility
export default realApiService;