import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ClockIcon,
  UserIcon,
  PlayIcon,
  StopIcon,
  DocumentTextIcon,
  CalendarIcon,
  CheckCircleIcon,
  VideoCameraIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  PencilSquareIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  UserPlusIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { therapistApi as legacyTherapistApi } from '@/services/therapistApi';
import { therapistApi } from '@/services/unifiedApi';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAlert } from '@/components/ui/CustomAlert';
import { useAuth } from '@/store/authStore';
import { PremiumCard, PremiumButton, PremiumEmptyState, StatusBadge } from '@/components/layout/PremiumLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate, formatTime } from '@/utils/dateFormatters';
import { Appointment, Session } from '@/types/entities';

interface SessionProgress {
  progressNotes: string;
  goalsDiscussed?: string;
  clientMoodStart?: number;
  clientMoodEnd?: number;
  clientMoodCurrent?: number;
  techniquesUsed?: string[];
  homework?: string;
  nextSessionPlan?: string;
}

interface ActiveSession extends Session {
  appointment: Appointment;
  startTime: Date;
  duration: number;
  expectedEndTime: Date;
  progress?: SessionProgress;
}

const SessionManagement: React.FC = () => {
  const { t } = useTranslation();
  const { success, error } = useAlert();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [sessionHistory, setSessionHistory] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'today' | 'active' | 'history'>('today');
  const [expandedAppointment, setExpandedAppointment] = useState<string | null>(null);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<{
    notes: boolean;
    progress: boolean;
    summary: boolean;
  }>({ notes: true, progress: false, summary: false });

  // Session start form state
  const [sessionStartForm, setSessionStartForm] = useState({
    location: 'office' as 'office' | 'online' | 'phone',
    initialNotes: '',
    clientPresent: true,
    moodStart: 5,
    sessionGoals: '',
    concerns: ''
  });

  // Progress form state
  const [progressForm, setProgressForm] = useState<SessionProgress>({
    progressNotes: '',
    goalsDiscussed: '',
    clientMoodStart: 5,
    clientMoodEnd: 5,
    clientMoodCurrent: 5,
    techniquesUsed: [],
    homework: '',
    nextSessionPlan: ''
  });

  // Summary form state
  const [summaryForm, setSummaryForm] = useState({
    summary: '',
    clientMoodEnd: 5,
    homework: '',
    nextSessionRecommendation: ''
  });

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Assignment state
  const [resources, setResources] = useState<any[]>([]);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>('');
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  const availableTechniques = [
    'CBT (Cognitive Behavioral Therapy)',
    'Mindfulness',
    'EMDR',
    'Psychodynamic Therapy',
    'Solution-Focused Therapy',
    'Dialectical Behavior Therapy',
    'Acceptance and Commitment Therapy',
    'Narrative Therapy',
    'Art Therapy',
    'Play Therapy'
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Update session duration timer
    if (!activeSession) return;

    const interval = setInterval(() => {
      setActiveSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          duration: Math.floor((Date.now() - prev.startTime.getTime()) / 1000)
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession?.id]);

  // Load assignment options when session is active
  useEffect(() => {
    if (activeSession) {
      loadAssignmentOptions();
    }
  }, [activeSession?.id]);

  // Auto-save functionality
  useEffect(() => {
    if (!activeSession) return;

    // Debounce auto-save
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      autoSaveProgress();
    }, 30000); // Auto-save every 30 seconds

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [progressForm, activeSession]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load startable appointments
      if (user?.id) {
        try {
          const startableResponse = await fetch(
            `https://praktijk-epd-backend-production.up.railway.app/api/schema/startable-appointments/${user.id}`
          );
          const startableData = await startableResponse.json();

          if (startableData.success && startableData.data?.appointments) {
            setAppointments(startableData.data.appointments);
            console.log(`[SessionManagement] Loaded ${startableData.data.count} startable appointments`);
          }
        } catch (err) {
          console.error('Error loading startable appointments:', err);
          const today = new Date().toISOString().split('T')[0];
          const appointmentsResponse = await legacyTherapistApi.getAppointments({
            date: today,
            status: 'scheduled'
          });

          if (appointmentsResponse.success && appointmentsResponse.data) {
            const appointmentsData = appointmentsResponse.data as any;
            setAppointments(Array.isArray(appointmentsData) ? appointmentsData : appointmentsData.appointments || []);
          }
        }
      }

      // Load session history
      try {
        const sessionsResponse = await therapistApi.getSessions({
          limit: 20
        });

        if (sessionsResponse.success && sessionsResponse.data) {
          const sessions = Array.isArray(sessionsResponse.data) ? sessionsResponse.data : (sessionsResponse.data as any)?.sessions || [];
          setSessionHistory(Array.isArray(sessions) ? sessions : []);
        }
      } catch (err) {
        console.error('Error loading session history:', err);
        setSessionHistory([]);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      error('Failed to load session data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAssignmentOptions = async () => {
    try {
      // Load resources
      const resourcesResponse = await therapistApi.getResources?.({ limit: 100 });
      if (resourcesResponse?.success && resourcesResponse.data) {
        setResources(Array.isArray(resourcesResponse.data) ? resourcesResponse.data : []);
      }

      // Load surveys
      const surveysResponse = await therapistApi.getSurveys?.({ limit: 100 });
      if (surveysResponse?.success && surveysResponse.data) {
        setSurveys(Array.isArray(surveysResponse.data) ? surveysResponse.data : []);
      }

      // Load challenges
      const challengesResponse = await therapistApi.getChallenges?.({ limit: 100 });
      if (challengesResponse?.success && challengesResponse.data) {
        setChallenges(Array.isArray(challengesResponse.data) ? challengesResponse.data : []);
      }
    } catch (err) {
      console.error('Error loading assignment options:', err);
    }
  };

  const handleAssignResource = async () => {
    if (!selectedResourceId || !activeSession?.appointment?.client_id) return;

    try {
      setIsAssigning(true);
      const response = await therapistApi.assignResource?.(selectedResourceId, activeSession.appointment.client_id);
      if (response?.success) {
        success('Resource assigned successfully');
        setSelectedResourceId('');
      } else {
        error('Failed to assign resource');
      }
    } catch (err) {
      console.error('Error assigning resource:', err);
      error('Failed to assign resource');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAssignSurvey = async () => {
    if (!selectedSurveyId || !activeSession?.appointment?.client_id) return;

    try {
      setIsAssigning(true);
      const response = await therapistApi.assignSurvey?.(selectedSurveyId, activeSession.appointment.client_id);
      if (response?.success) {
        success('Survey assigned successfully');
        setSelectedSurveyId('');
      } else {
        error('Failed to assign survey');
      }
    } catch (err) {
      console.error('Error assigning survey:', err);
      error('Failed to assign survey');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAssignChallenge = async () => {
    if (!selectedChallengeId || !activeSession?.appointment?.client_id) return;

    try {
      setIsAssigning(true);
      const response = await therapistApi.assignChallenge?.(selectedChallengeId, activeSession.appointment.client_id);
      if (response?.success) {
        success('Challenge assigned successfully');
        setSelectedChallengeId('');
      } else {
        error('Failed to assign challenge');
      }
    } catch (err) {
      console.error('Error assigning challenge:', err);
      error('Failed to assign challenge');
    } finally {
      setIsAssigning(false);
    }
  };

  const autoSaveProgress = async () => {
    if (!activeSession || isSaving) return;

    if (!activeSession.id) {
      console.error('[SessionManagement] Cannot auto-save: activeSession.id is undefined');
      return;
    }

    try {
      setIsSaving(true);
      await therapistApi.updateSessionProgress(activeSession.id, {
        progressNotes: progressForm.progressNotes,
        goalsDiscussed: progressForm.goalsDiscussed,
        clientMoodCurrent: progressForm.clientMoodCurrent,
        techniquesUsed: progressForm.techniquesUsed
      });
      setLastSaved(new Date());
    } catch (err) {
      console.error('Auto-save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const startSession = async (appointment: Appointment) => {
    if (!sessionStartForm.sessionGoals.trim()) {
      error('Please specify session goals');
      return;
    }

    try {
      const response = await therapistApi.startSession({
        appointmentId: appointment.id,
        clientPresent: sessionStartForm.clientPresent,
        location: sessionStartForm.location,
        initialNotes: sessionStartForm.initialNotes || 'Session started',
        moodStart: sessionStartForm.moodStart,
        sessionGoals: sessionStartForm.sessionGoals,
        concerns: sessionStartForm.concerns
      });

      if (response.success && response.data) {
        console.log('[SessionManagement] startSession response:', response.data);

        // Get session ID from response - try multiple locations
        const sessionId = response.data.session?.id ||
                         response.data.id ||
                         response.data.session?.session_id ||
                         response.data.sessionId;

        if (!sessionId) {
          console.error('[SessionManagement] No session ID in response:', response.data);
          error('Failed to start session: No session ID returned');
          return;
        }

        console.log('[SessionManagement] Session ID:', sessionId);

        const duration = appointment.duration || 50;
        const startTime = new Date();
        const expectedEndTime = new Date(startTime.getTime() + duration * 60 * 1000);

        setActiveSession({
          ...response.data.session,
          id: sessionId, // Explicitly set the ID
          appointment,
          startTime,
          duration: 0,
          expectedEndTime
        });

        setProgressForm({
          ...progressForm,
          clientMoodStart: sessionStartForm.moodStart,
          clientMoodCurrent: sessionStartForm.moodStart
        });

        setSelectedTab('active');
        setExpandedAppointment(null);
        success('Session started successfully');

        // Reset form
        setSessionStartForm({
          location: 'office',
          initialNotes: '',
          clientPresent: true,
          moodStart: 5,
          sessionGoals: '',
          concerns: ''
        });
      }
    } catch (err: any) {
      console.error('Error starting session:', err);
      error('Failed to start session');
    }
  };

  const endSession = async () => {
    if (!activeSession) return;

    if (!activeSession.id) {
      console.error('[SessionManagement] Cannot end session: activeSession.id is undefined');
      error('Cannot end session: Session ID is missing');
      return;
    }

    if (!summaryForm.summary) {
      error('Please provide a session summary');
      return;
    }

    try {
      const sessionEndResponse = await therapistApi.endSession(activeSession.id, {
        summary: summaryForm.summary,
        homework: summaryForm.homework || 'None',
        nextSessionGoals: summaryForm.nextSessionRecommendation || 'Continue current treatment plan',
        clientMoodEnd: summaryForm.clientMoodEnd,
        techniquesUsed: progressForm.techniquesUsed,
        progressNotes: progressForm.progressNotes,
        goalsDiscussed: progressForm.goalsDiscussed
      });

      if (sessionEndResponse.success) {
        success('Session ended successfully');

        // Check billing - backend handles preference-based invoicing
        try {
          const invoiceResponse = await therapistApi.generateInvoiceFromSession(activeSession.id, {
            appointmentId: activeSession.appointment?.id,
            clientId: activeSession.appointment?.client_id,
            sessionDuration: Math.floor(activeSession.duration / 60),
            sessionType: activeSession.appointment?.therapy_type || 'therapy',
            autoSend: true
          });

          if (invoiceResponse.success) {
            if (invoiceResponse.data?.consolidated) {
              // Client has consolidated invoicing enabled
              success(`Session recorded. Client will be billed in monthly invoice (${invoiceResponse.data.billingMonth})`);
            } else {
              // Immediate invoice generated
              success('Invoice automatically generated and sent to client');
            }
          }
        } catch (invoiceErr: any) {
          // Backend may return 409 if already billed or preference prevents immediate billing
          // This is not necessarily an error, just log it
          console.log('Billing check:', invoiceErr);
        }

        // Reset states
        setActiveSession(null);
        setProgressForm({
          progressNotes: '',
          goalsDiscussed: '',
          clientMoodStart: 5,
          clientMoodEnd: 5,
          clientMoodCurrent: 5,
          techniquesUsed: [],
          homework: '',
          nextSessionPlan: ''
        });
        setSummaryForm({
          summary: '',
          clientMoodEnd: 5,
          homework: '',
          nextSessionRecommendation: ''
        });
        setSelectedTab('today');
        await loadData();
      }
    } catch (err: any) {
      console.error('Error ending session:', err);
      error('Failed to end session');
    }
  };

  const markClientAbsent = async (appointment: Appointment) => {
    try {
      await legacyTherapistApi.updateAppointment(appointment.id, {
        status: 'cancelled',
        notes: `Client marked as no-show at ${new Date().toLocaleString()}`
      });

      success('Client marked as absent');
      await loadData();
    } catch (err) {
      console.error('Error marking client absent:', err);
      error('Failed to update appointment status');
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getRemainingTime = () => {
    if (!activeSession) return 0;
    return Math.floor((activeSession.expectedEndTime.getTime() - Date.now()) / 1000);
  };

  const getTimerColor = () => {
    const remaining = getRemainingTime();
    if (remaining < 0) return 'text-red-600 bg-red-50'; // Overtime
    if (remaining < 5 * 60) return 'text-yellow-600 bg-yellow-50'; // Less than 5 minutes
    return 'text-green-600 bg-green-50'; // On time
  };

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
      case 'online':
        return VideoCameraIcon;
      case 'phone':
        return PhoneIcon;
      case 'office':
      default:
        return BuildingOfficeIcon;
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Session Management</h1>
            <p className="text-green-100">
              Manage your therapy sessions with real-time tracking and comprehensive documentation
            </p>
          </div>
          <ClockIcon className="w-16 h-16 text-green-200" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setSelectedTab('today')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            selectedTab === 'today'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Today's Sessions ({appointments.length})
        </button>
        <button
          onClick={() => setSelectedTab('active')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            selectedTab === 'active'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Active Session
          {activeSession && (
            <span className="ml-2 w-2 h-2 bg-green-500 rounded-full inline-block animate-pulse" />
          )}
        </button>
        <button
          onClick={() => setSelectedTab('history')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            selectedTab === 'history'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Session History ({sessionHistory.length})
        </button>
      </div>

      {/* Today's Sessions */}
      {selectedTab === 'today' && (
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <PremiumEmptyState
              icon={CalendarIcon}
              title="No sessions available"
              description="You don't have any confirmed appointments ready to start"
            />
          ) : (
            appointments.map((appointment) => (
              <PremiumCard key={appointment.id}>
                {/* Appointment Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {appointment.client_first_name} {appointment.client_last_name}
                      </h3>
                      <div className="flex items-center space-x-3 text-sm text-gray-600">
                        <span>{formatDate(appointment.appointment_date)}</span>
                        <span>•</span>
                        <span>{formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</span>
                        <span>•</span>
                        <span className="capitalize">{appointment.therapy_type || 'Therapy'}</span>
                        <span>•</span>
                        <span>{appointment.duration || 50} min</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <StatusBadge status={appointment.status} size="sm" />

                    {expandedAppointment === appointment.id ? (
                      <PremiumButton
                        variant="outline"
                        size="sm"
                        icon={ChevronUpIcon}
                        onClick={() => setExpandedAppointment(null)}
                      >
                        Cancel
                      </PremiumButton>
                    ) : (
                      <>
                        <PremiumButton
                          variant="primary"
                          size="sm"
                          icon={PlayIcon}
                          onClick={() => {
                            setExpandedAppointment(appointment.id);
                            setSessionStartForm(prev => ({
                              ...prev,
                              location: (appointment.location || 'office') as any,
                              sessionGoals: appointment.notes || ''
                            }));
                          }}
                        >
                          Start Session
                        </PremiumButton>

                        <PremiumButton
                          variant="outline"
                          size="sm"
                          onClick={() => markClientAbsent(appointment)}
                        >
                          No Show
                        </PremiumButton>
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded Session Start Form - Inline */}
                {expandedAppointment === appointment.id && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-lg font-semibold mb-4">Session Setup</h4>

                    <div className="grid grid-cols-2 gap-6">
                      {/* Left Column */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Is the client present? *
                          </label>
                          <div className="flex space-x-4">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                checked={sessionStartForm.clientPresent}
                                onChange={() => setSessionStartForm(prev => ({ ...prev, clientPresent: true }))}
                                className="mr-2 text-green-600 focus:ring-green-500"
                              />
                              <span className="text-sm">Yes, client is present</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                checked={!sessionStartForm.clientPresent}
                                onChange={() => setSessionStartForm(prev => ({ ...prev, clientPresent: false }))}
                                className="mr-2 text-red-600 focus:ring-red-500"
                              />
                              <span className="text-sm">No (No-show)</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Session Location *
                          </label>
                          <select
                            value={sessionStartForm.location}
                            onChange={(e) => setSessionStartForm(prev => ({
                              ...prev,
                              location: e.target.value as 'office' | 'online' | 'phone'
                            }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          >
                            <option value="office">In Office</option>
                            <option value="online">Online Video</option>
                            <option value="phone">Phone Call</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Client's Starting Mood (1-10)
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={sessionStartForm.moodStart}
                            onChange={(e) => setSessionStartForm(prev => ({
                              ...prev,
                              moodStart: parseInt(e.target.value)
                            }))}
                            className="w-full"
                          />
                          <div className="flex justify-between text-sm text-gray-600 mt-1">
                            <span>Poor (1)</span>
                            <span className="font-semibold text-gray-900">{sessionStartForm.moodStart}</span>
                            <span>Excellent (10)</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Session Goals * <span className="text-gray-500">(Required)</span>
                          </label>
                          <textarea
                            value={sessionStartForm.sessionGoals}
                            onChange={(e) => setSessionStartForm(prev => ({ ...prev, sessionGoals: e.target.value }))}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="What are the main goals for today's session?"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Client Concerns/Issues
                          </label>
                          <textarea
                            value={sessionStartForm.concerns}
                            onChange={(e) => setSessionStartForm(prev => ({ ...prev, concerns: e.target.value }))}
                            rows={2}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Any specific concerns the client mentioned?"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Initial Notes
                          </label>
                          <textarea
                            value={sessionStartForm.initialNotes}
                            onChange={(e) => setSessionStartForm(prev => ({ ...prev, initialNotes: e.target.value }))}
                            rows={2}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Any initial observations..."
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3 mt-6">
                      {sessionStartForm.clientPresent ? (
                        <PremiumButton
                          variant="primary"
                          icon={PlayIcon}
                          onClick={() => startSession(appointment)}
                          className="flex-1"
                        >
                          Start Session Now
                        </PremiumButton>
                      ) : (
                        <PremiumButton
                          variant="danger"
                          icon={ExclamationTriangleIcon}
                          onClick={() => markClientAbsent(appointment)}
                          className="flex-1"
                        >
                          Confirm No-Show
                        </PremiumButton>
                      )}
                      <PremiumButton
                        variant="outline"
                        onClick={() => setExpandedAppointment(null)}
                        className="flex-1"
                      >
                        Cancel
                      </PremiumButton>
                    </div>
                  </div>
                )}

                {/* Appointment Notes (if not expanded) */}
                {expandedAppointment !== appointment.id && appointment.notes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">{appointment.notes}</p>
                  </div>
                )}
              </PremiumCard>
            ))
          )}
        </div>
      )}

      {/* Active Session */}
      {selectedTab === 'active' && (
        <div>
          {activeSession ? (
            <div className="space-y-6">
              {/* Session Header with Timers */}
              <PremiumCard className={`${getTimerColor()} border-2`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                      {React.createElement(getSessionTypeIcon(activeSession.appointment?.location || 'office'), {
                        className: 'w-8 h-8 text-green-600'
                      })}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Session in Progress
                      </h3>
                      <p className="text-gray-700 font-medium">
                        {activeSession.appointment?.client_first_name} {activeSession.appointment?.client_last_name}
                      </p>
                      <p className="text-sm text-gray-600 capitalize">
                        {activeSession.appointment?.therapy_type || 'Therapy Session'} • {activeSession.appointment?.location || 'Office'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 text-right">
                    <div>
                      <p className="text-3xl font-bold">
                        {formatDuration(Math.max(0, getRemainingTime()))}
                      </p>
                      <p className="text-sm font-medium">
                        {getRemainingTime() < 0 ? 'Overtime' : 'Remaining'}
                      </p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-gray-700">
                        {formatDuration(activeSession.duration)}
                      </p>
                      <p className="text-sm text-gray-600 font-medium">Elapsed</p>
                    </div>
                  </div>
                </div>

                {getRemainingTime() < 0 && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-sm font-medium text-red-900">
                      This session has exceeded its scheduled duration. Consider wrapping up soon.
                    </span>
                  </div>
                )}
              </PremiumCard>

              {/* Real-Time Notes Section - Always Expanded */}
              <PremiumCard>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleSection('notes')}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      {expandedSections.notes ? (
                        <ChevronUpIcon className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                      )}
                    </button>
                    <PencilSquareIcon className="w-6 h-6 text-green-600" />
                    <h3 className="text-lg font-semibold">Session Notes</h3>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    {isSaving && (
                      <>
                        <ArrowPathIcon className="w-4 h-4 text-gray-400 animate-spin" />
                        <span className="text-gray-600">Saving...</span>
                      </>
                    )}
                    {lastSaved && !isSaving && (
                      <span className="text-gray-500">
                        Last saved: {lastSaved.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>

                {expandedSections.notes && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Session Progress Notes (auto-saves every 30 seconds)
                      </label>
                      <textarea
                        value={progressForm.progressNotes}
                        onChange={(e) => setProgressForm({ ...progressForm, progressNotes: e.target.value })}
                        onBlur={autoSaveProgress}
                        rows={8}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                        placeholder="Document what's happening in the session...&#10;&#10;Examples:&#10;- Client discussed challenges with work-life balance&#10;- Practiced mindfulness techniques&#10;- Addressed anxiety triggers from last week"
                      />
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          {progressForm.progressNotes.length} characters
                        </span>
                        <PremiumButton
                          variant="outline"
                          size="sm"
                          onClick={autoSaveProgress}
                          disabled={isSaving}
                        >
                          {isSaving ? 'Saving...' : 'Save Now'}
                        </PremiumButton>
                      </div>
                    </div>
                  </div>
                )}
              </PremiumCard>

              {/* Client Assignments Panel - Dropdown Based */}
              <PremiumCard>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <UserPlusIcon className="w-6 h-6 text-purple-600" />
                    <h3 className="text-lg font-semibold">Assign Resources, Surveys & Challenges</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Assign resources, surveys, or challenges to {activeSession.appointment?.client_first_name} during or after this session.
                  </p>

                  {/* Resources */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <BookOpenIcon className="w-4 h-4 inline mr-2" />
                      Assign Resource
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={selectedResourceId}
                        onChange={(e) => setSelectedResourceId(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={isAssigning || resources.length === 0}
                      >
                        <option value="">Select a resource...</option>
                        {resources.map((resource) => (
                          <option key={resource.id} value={resource.id}>
                            {resource.title} ({resource.type})
                          </option>
                        ))}
                      </select>
                      <PremiumButton
                        variant="primary"
                        onClick={handleAssignResource}
                        disabled={!selectedResourceId || isAssigning}
                        className="whitespace-nowrap"
                      >
                        {isAssigning ? 'Assigning...' : 'Assign'}
                      </PremiumButton>
                    </div>
                  </div>

                  {/* Surveys */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <DocumentTextIcon className="w-4 h-4 inline mr-2" />
                      Assign Survey
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={selectedSurveyId}
                        onChange={(e) => setSelectedSurveyId(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={isAssigning || surveys.length === 0}
                      >
                        <option value="">Select a survey...</option>
                        {surveys.map((survey) => (
                          <option key={survey.id} value={survey.id}>
                            {survey.title} ({survey.type})
                          </option>
                        ))}
                      </select>
                      <PremiumButton
                        variant="primary"
                        onClick={handleAssignSurvey}
                        disabled={!selectedSurveyId || isAssigning}
                        className="whitespace-nowrap"
                      >
                        {isAssigning ? 'Assigning...' : 'Assign'}
                      </PremiumButton>
                    </div>
                  </div>

                  {/* Challenges */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <ChartBarIcon className="w-4 h-4 inline mr-2" />
                      Assign Challenge
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={selectedChallengeId}
                        onChange={(e) => setSelectedChallengeId(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={isAssigning || challenges.length === 0}
                      >
                        <option value="">Select a challenge...</option>
                        {challenges.map((challenge) => (
                          <option key={challenge.id} value={challenge.id}>
                            {challenge.title} ({challenge.duration} days)
                          </option>
                        ))}
                      </select>
                      <PremiumButton
                        variant="primary"
                        onClick={handleAssignChallenge}
                        disabled={!selectedChallengeId || isAssigning}
                        className="whitespace-nowrap"
                      >
                        {isAssigning ? 'Assigning...' : 'Assign'}
                      </PremiumButton>
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-xs text-purple-900">
                      <strong>Tip:</strong> Assignments are optional. They help track client progress between sessions. The client will be notified when you assign an item.
                    </p>
                  </div>
                </div>
              </PremiumCard>

              {/* Session Progress Panel - Collapsible */}
              <PremiumCard>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleSection('progress')}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      {expandedSections.progress ? (
                        <ChevronUpIcon className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                      )}
                    </button>
                    <ChartBarIcon className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-semibold">Session Progress Details</h3>
                  </div>
                </div>

                {expandedSections.progress && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mood at Start
                        </label>
                        <div className="text-center p-3 bg-gray-100 rounded-lg">
                          <div className="text-3xl font-bold text-gray-900">
                            {progressForm.clientMoodStart}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">out of 10</div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Mood
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={progressForm.clientMoodCurrent}
                          onChange={(e) => setProgressForm({
                            ...progressForm,
                            clientMoodCurrent: parseInt(e.target.value)
                          })}
                          onMouseUp={autoSaveProgress}
                          className="w-full mt-2"
                        />
                        <div className="text-center mt-1">
                          <span className="text-2xl font-bold text-blue-600">
                            {progressForm.clientMoodCurrent}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expected Mood at End
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={progressForm.clientMoodEnd}
                          onChange={(e) => setProgressForm({
                            ...progressForm,
                            clientMoodEnd: parseInt(e.target.value)
                          })}
                          className="w-full mt-2"
                        />
                        <div className="text-center mt-1">
                          <span className="text-2xl font-bold text-green-600">
                            {progressForm.clientMoodEnd}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Goals Being Addressed
                      </label>
                      <input
                        type="text"
                        value={progressForm.goalsDiscussed}
                        onChange={(e) => setProgressForm({ ...progressForm, goalsDiscussed: e.target.value })}
                        onBlur={autoSaveProgress}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Goals being worked on in this session"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Techniques & Interventions Used
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {availableTechniques.map((technique) => (
                          <button
                            key={technique}
                            onClick={() => {
                              const isSelected = progressForm.techniquesUsed?.includes(technique);
                              setProgressForm({
                                ...progressForm,
                                techniquesUsed: isSelected
                                  ? progressForm.techniquesUsed?.filter(t => t !== technique)
                                  : [...(progressForm.techniquesUsed || []), technique]
                              });
                            }}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                              progressForm.techniquesUsed?.includes(technique)
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {technique}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Homework to Assign
                      </label>
                      <textarea
                        value={progressForm.homework}
                        onChange={(e) => setProgressForm({ ...progressForm, homework: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Exercises or tasks for the client before next session"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Plan for Next Session
                      </label>
                      <textarea
                        value={progressForm.nextSessionPlan}
                        onChange={(e) => setProgressForm({ ...progressForm, nextSessionPlan: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Goals and topics to cover in the next session"
                      />
                    </div>
                  </div>
                )}
              </PremiumCard>

              {/* End Session Summary - Collapsible */}
              <PremiumCard className="border-2 border-red-200 bg-red-50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleSection('summary')}
                      className="p-1 hover:bg-red-100 rounded transition-colors"
                    >
                      {expandedSections.summary ? (
                        <ChevronUpIcon className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                      )}
                    </button>
                    <StopIcon className="w-6 h-6 text-red-600" />
                    <h3 className="text-lg font-semibold text-gray-900">End Session</h3>
                  </div>
                  {!expandedSections.summary && (
                    <PremiumButton
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSection('summary')}
                    >
                      Expand to End
                    </PremiumButton>
                  )}
                </div>

                {expandedSections.summary && (
                  <div className="space-y-4 bg-white p-6 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Session Summary * <span className="text-red-600">(Required)</span>
                      </label>
                      <textarea
                        value={summaryForm.summary}
                        onChange={(e) => setSummaryForm({ ...summaryForm, summary: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Provide a comprehensive summary of the session, key outcomes, and client progress..."
                      />
                      <span className="text-xs text-gray-500">{summaryForm.summary.length} characters</span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Final Client Mood (1-10)
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={summaryForm.clientMoodEnd}
                        onChange={(e) => setSummaryForm({ ...summaryForm, clientMoodEnd: parseInt(e.target.value) })}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-600 mt-1">
                        <span>Poor (1)</span>
                        <span className="font-semibold text-gray-900">{summaryForm.clientMoodEnd}</span>
                        <span>Excellent (10)</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Homework Assigned
                      </label>
                      <textarea
                        value={summaryForm.homework}
                        onChange={(e) => setSummaryForm({ ...summaryForm, homework: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Final homework assignments..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Next Session Recommendations
                      </label>
                      <textarea
                        value={summaryForm.nextSessionRecommendation}
                        onChange={(e) => setSummaryForm({ ...summaryForm, nextSessionRecommendation: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Goals and focus areas for the next session..."
                      />
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <PremiumButton
                        variant="danger"
                        icon={StopIcon}
                        onClick={endSession}
                        className="w-full"
                        disabled={!summaryForm.summary.trim()}
                      >
                        End Session & Generate Invoice
                      </PremiumButton>
                      {!summaryForm.summary.trim() && (
                        <p className="text-sm text-red-600 mt-2 text-center">
                          Please provide a session summary before ending
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </PremiumCard>
            </div>
          ) : (
            <PremiumEmptyState
              icon={PlayIcon}
              title="No active session"
              description="Start a session from today's appointments to begin tracking"
            />
          )}
        </div>
      )}

      {/* Session History */}
      {selectedTab === 'history' && (
        <div className="space-y-4">
          {sessionHistory.length === 0 ? (
            <PremiumEmptyState
              icon={ClockIcon}
              title="No session history"
              description="Your completed sessions will appear here"
            />
          ) : (
            sessionHistory.map((session: any) => (
              <div
                key={session.id}
                className="cursor-pointer"
                onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
              >
                <PremiumCard className="hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <ClockIcon className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {session.client_name || 'Unknown Client'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {formatDate(session.date || session.created_at)} • {session.duration || 'N/A'} minutes
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <StatusBadge status={session.status || 'completed'} size="sm" />
                      {expandedSession === session.id ? (
                        <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {session.summary && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">{session.summary}</p>
                    </div>
                  )}

                  {expandedSession === session.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Session Details</h4>
                          <dl className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <dt className="text-gray-600">Start Time:</dt>
                              <dd className="font-medium text-gray-900">{session.start_time || 'N/A'}</dd>
                            </div>
                            <div className="flex justify-between text-sm">
                              <dt className="text-gray-600">End Time:</dt>
                              <dd className="font-medium text-gray-900">{session.end_time || 'N/A'}</dd>
                            </div>
                            <div className="flex justify-between text-sm">
                              <dt className="text-gray-600">Location:</dt>
                              <dd className="font-medium text-gray-900 capitalize">{session.location || 'Office'}</dd>
                            </div>
                            <div className="flex justify-between text-sm">
                              <dt className="text-gray-600">Type:</dt>
                              <dd className="font-medium text-gray-900 capitalize">{session.type || 'Therapy'}</dd>
                            </div>
                          </dl>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Progress</h4>
                          <dl className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <dt className="text-gray-600">Mood Start:</dt>
                              <dd className="font-medium text-gray-900">{session.mood_start || 'N/A'}/10</dd>
                            </div>
                            <div className="flex justify-between text-sm">
                              <dt className="text-gray-600">Mood End:</dt>
                              <dd className="font-medium text-gray-900">{session.mood_end || 'N/A'}/10</dd>
                            </div>
                            <div className="flex justify-between text-sm">
                              <dt className="text-gray-600">Improvement:</dt>
                              <dd className={`font-medium ${
                                (session.mood_end || 0) > (session.mood_start || 0)
                                  ? 'text-green-600'
                                  : 'text-gray-900'
                              }`}>
                                {session.mood_end && session.mood_start
                                  ? `${session.mood_end > session.mood_start ? '+' : ''}${session.mood_end - session.mood_start}`
                                  : 'N/A'}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      </div>

                      {session.goals_discussed && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-1">Goals Discussed</h4>
                          <p className="text-sm text-gray-600">{session.goals_discussed}</p>
                        </div>
                      )}

                      {session.homework && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-1">Homework Assigned</h4>
                          <p className="text-sm text-gray-600">{session.homework}</p>
                        </div>
                      )}

                      {session.techniques_used && session.techniques_used.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Techniques Used</h4>
                          <div className="flex flex-wrap gap-2">
                            {session.techniques_used.map((technique: string, index: number) => (
                              <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                {technique}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-3 pt-2">
                        <PremiumButton
                          size="sm"
                          variant="outline"
                          icon={DocumentTextIcon}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/therapist/notes?session=${session.id}`);
                          }}
                        >
                          View Full Notes
                        </PremiumButton>
                        <PremiumButton
                          size="sm"
                          variant="outline"
                          icon={UserIcon}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/therapist/clients/${session.client_id}`);
                          }}
                        >
                          Client Profile
                        </PremiumButton>
                      </div>
                    </div>
                  )}
                </PremiumCard>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SessionManagement;
