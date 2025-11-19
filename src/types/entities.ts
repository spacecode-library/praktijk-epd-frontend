// Comprehensive entity types for PraktijkEPD

import { ClientStatus, AppointmentStatus, InvoiceStatus, UserStatus, WaitingListStatus } from '@/components/ui/StatusIndicator';

// Base types
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// User and authentication related types
export interface User extends BaseEntity {
  email: string;
  role: 'admin' | 'therapist' | 'client' | 'assistant' | 'bookkeeper' | 'substitute';
  status: UserStatus;
  first_name: string;
  last_name: string;
  phone: string;
  preferred_language: 'nl' | 'en';
  two_factor_enabled: boolean;
  two_factor_setup_completed?: boolean;
  email_verified: boolean;
  last_login?: string;
}

// Client entity
export interface Client extends BaseEntity {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  status: ClientStatus;
  therapist_id?: string;
  intake_date?: string;
  discharge_date?: string;
  profile_photo_url?: string;
  photo_url?: string;
  address?: {
    street: string;
    house_number: string;
    postal_code: string;
    city: string;
    country: string;
  };
  emergency_contact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  insurance?: {
    company: string;
    policy_number: string;
    coverage_type: string;
  };
  insurance_company?: string;
  insurance_number?: string;
  bsn?: string;
  medications?: string[];
  allergies?: string[];
  therapy_goals?: string;
  intake_completed?: boolean;
  notes?: string;
  tags?: string[];
  // Hulpvragen integration - from appointment request
  hulpvragen?: string[];
  urgency_level?: 'normal' | 'urgent' | 'emergency';
  requested_therapy_type?: string;
  problem_description?: string;
  request_date?: string;
  // Session stats
  total_sessions?: number;
  last_session?: string;
  next_session?: string;
}

// Therapist entity
export interface Therapist extends BaseEntity {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: UserStatus;
  specializations: string[];
  availability: {
    [key: string]: {
      start: string;
      end: string;
      available: boolean;
    }[];
  };
  max_clients: number;
  current_clients: number;
  hourly_rate: number;
  license_number?: string;
  license_expiry?: string;
  bio?: string;
  education?: string[];
  certifications?: string[];
  languages?: string[];
  contract_status?: 'active' | 'draft' | 'expired' | 'terminated';
  contract_start_date?: string;
  contract_end_date?: string;
}

// Appointment entity
export interface Appointment extends BaseEntity {
  client_id: string;
  therapist_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  duration?: number;
  status: AppointmentStatus;
  type: 'intake' | 'regular' | 'emergency' | 'follow_up';
  location?: string;
  notes?: string;
  preparation_notes?: string;
  focus_areas?: string[];
  hulpvragen?: string[];
  session_notes?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  no_show_reason?: string;
  therapy_goals?: string;
  client?: Client;
  therapist?: Therapist;
}

// Session entity
export interface Session extends BaseEntity {
  appointment_id: string;
  client_id: string;
  therapist_id: string;
  session_date: string;
  started_at: string;
  ended_at?: string;
  duration?: number; // in minutes
  status: 'scheduled' | 'active' | 'completed' | 'cancelled' | 'no_show';
  client_present: boolean;
  location: 'office' | 'online' | 'phone';
  initial_notes?: string;
  progress_notes?: string;
  goals_discussed?: string;
  client_mood_start?: number;
  client_mood_end?: number;
  techniques_used?: string[];
  summary?: string;
  homework?: string;
  next_session_recommendation?: string;
  client?: Client;
  therapist?: Therapist;
  appointment?: Appointment;
}

// Invoice entity
export interface Invoice extends BaseEntity {
  invoice_number: string;
  client_id: string;
  therapist_id?: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  paid_date?: string;
  payment_date?: string; // Alternative field name used by backend
  total_amount: number | string; // Backend might return as string
  tax_amount: number;
  subtotal: number;
  currency: string;
  payment_method?: 'insurance' | 'bank_transfer' | 'credit_card' | 'cash' | string;
  items: InvoiceItem[];
  notes?: string;
  client?: Client;
  therapist?: Therapist;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  tax_rate: number;
  appointment_id?: string;
}

// Waiting List entity
export interface WaitingListApplication extends BaseEntity {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  status: WaitingListStatus;
  urgency_level: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  reason_for_therapy: string;
  preferred_therapist_gender?: 'male' | 'female' | 'no_preference';
  preferred_therapy_type?: string;
  availability?: string;
  insurance_info?: string;
  referral_source?: string;
  contacted_at?: string;
  intake_scheduled_at?: string;
  assigned_therapist_id?: string;
  notes?: string;
  tags?: string[];
}

// Message entity
export interface Message extends BaseEntity {
  sender_id: string;
  sender_name: string;
  sender_role: string;
  recipient_id: string;
  recipient_name: string;
  recipient_role: string;
  subject: string;
  content: string;
  read: boolean;
  read_at?: string;
  parent_message_id?: string;
  attachments?: MessageAttachment[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface MessageAttachment {
  id: string;
  filename: string;
  size: number;
  mime_type: string;
  url: string;
}

// Task entity
export interface Task extends BaseEntity {
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'waiting' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assigned_to?: string;
  assigned_by: string;
  due_date?: string;
  completed_at?: string;
  tags?: string[];
  related_entity_type?: 'client' | 'appointment' | 'invoice';
  related_entity_id?: string;
}

// Document entity
export interface Document extends BaseEntity {
  user_id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  category: 'intake' | 'treatment' | 'insurance' | 'legal' | 'other';
  description?: string;
  url: string;
  uploaded_by: string;
  shared_with?: string[];
  tags?: string[];
}

// Resource entity (educational materials)
export interface Resource extends BaseEntity {
  title: string;
  description: string;
  type: 'article' | 'video' | 'pdf' | 'exercise' | 'worksheet';
  category: string;
  url?: string;
  content?: string;
  created_by: string;
  tags?: string[];
  target_audience?: ('client' | 'therapist')[];
  language: 'nl' | 'en';
}

// Challenge entity
export interface Challenge extends BaseEntity {
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration_days: number;
  category: string;
  tasks: ChallengeTask[];
  created_by: string;
  tags?: string[];
  rewards?: string;
  instructions?: string;
  tips?: string;
}

export interface ChallengeTask {
  id: string;
  day: number;
  title: string;
  description: string;
  completed?: boolean;
  completed_at?: string;
}

// Survey entity
export interface Survey extends BaseEntity {
  title: string;
  description: string;
  type: 'intake' | 'progress' | 'satisfaction' | 'outcome';
  questions: SurveyQuestion[];
  created_by: string;
  active: boolean;
  responses_count?: number;
}

export interface SurveyQuestion {
  id: string;
  question: string;
  type: 'text' | 'number' | 'scale' | 'multiple_choice' | 'checkbox';
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
}

// Dashboard metrics
export interface DashboardMetrics {
  activeClients: number;
  totalSessions: number;
  monthlyRevenue: number;
  waitingListCount: number;
  therapistCount: number;
  upcomingAppointments: number;
  overdueInvoices: number;
  clientSatisfactionScore?: number;
  appointmentsToday?: number;
  noShowCount?: number;
  newClientsThisMonth?: number;
  sessionsToday?: number;
  pendingAddressChanges?: number;
  totalAddressChanges?: number;
  activeChallenges?: number;
  challengeParticipants?: number;
  totalResources?: number;
  resourceAssignments?: number;
  activeSurveys?: number;
  surveyResponses?: number;
  totalUsers?: number;
  activeIntegrations?: number;
  unreadNotifications?: number;
  criticalWaitingList?: number;
}

// Financial overview
export interface FinancialOverview {
  totalRevenue: number;
  outstandingAmount: number;
  paidThisMonth: number;
  projectedRevenue: number;
  revenueGrowth?: number;
  revenueByTherapist: {
    therapist_id: string;
    therapist_name: string;
    revenue: number;
  }[];
  revenueByMonth: {
    month: string;
    revenue: number;
  }[];
}

// Support ticket (for assistants)
export interface SupportTicket extends BaseEntity {
  client_id: string;
  assigned_to?: string;
  status: 'pending' | 'contacted' | 'resolved';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'appointment' | 'billing' | 'technical' | 'general';
  subject: string;
  description: string;
  resolution?: string;
  resolved_at?: string;
  client?: Client;
}

// Activity log
export interface ActivityLog extends BaseEntity {
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

// Notification
export interface Notification extends BaseEntity {
  user_id: string;
  type: 'appointment' | 'payment' | 'message' | 'task' | 'system';
  title: string;
  content: string;
  read: boolean;
  read_at?: string;
  action_url?: string;
  metadata?: Record<string, any>;
}

// Company settings
export interface CompanySettings {
  company_name: string;
  logo_url?: string;
  email: string;
  phone: string;
  address: {
    street: string;
    house_number: string;
    postal_code: string;
    city: string;
    country: string;
  };
  agb_code?: string;
  kvk_number?: string;
  bank_account?: string;
  tax_number?: string;
  email_signature?: string;
  appointment_reminder_hours?: number;
  invoice_due_days?: number;
  cancellation_policy?: string;
}