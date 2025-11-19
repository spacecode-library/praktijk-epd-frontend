import React, { useEffect, useState, useRef } from 'react';
import {
  CalendarIcon,
  UserIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
  ClipboardDocumentCheckIcon,
  TrophyIcon,
  HeartIcon,
  ChartBarIcon,
  ExclamationCircleIcon,
  BookOpenIcon,
  PuzzlePieceIcon,
  MagnifyingGlassIcon,
  BoltIcon,
  CurrencyEuroIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useAuth } from '@/store/authStore';
import { useTranslation } from '@/contexts/LanguageContext';
import { useClientDashboard, useClientAppointments, useClientMessages } from '@/hooks/useRealApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusIndicator from '@/components/ui/StatusIndicator';
import PageTransition from '@/components/ui/PageTransition';
import AnimatedMetricCard from '@/components/ui/AnimatedMetricCard';
import { Appointment, Message, Therapist } from '@/types/entities';
import { formatDate, formatTime, formatFullDate } from '@/utils/dateFormatters';
import UnpaidInvoiceAlert from '@/components/invoices/UnpaidInvoiceAlert';
// CompletionSurvey removed - endpoint not working in production

// Progress card component - replaced with AnimatedMetricCard

// Quick action card
interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  link: string;
  color?: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ title, description, icon: Icon, link, color }) => {
  return (
    <Link 
      to={link}
      className="block bg-white rounded-xl shadow-sm border border-gray-100 p-6 card-hover smooth-transition"
    >
      <div className={`inline-flex p-3 rounded-lg ${color} mb-4 smooth-transition group-hover:scale-110`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </Link>
  );
};

const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  // API hooks
  const { execute: getDashboard, data: dashboardData, isLoading: isDashboardLoading } = useClientDashboard();
  const { appointments, getAppointments, isLoading: isAppointmentsLoading } = useClientAppointments();
  const { messages, getMessages, isLoading: isMessagesLoading } = useClientMessages();

  // State
  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [unreadMessages, setUnreadMessages] = useState<Message[]>([]);
  const [metrics, setMetrics] = useState({
    totalSessions: 0,
    completedSessions: 0,
    upcomingAppointments: 0,
    treatmentProgress: 0,
    wellnessScore: 0,
    resourcesCompleted: 0,
    totalResources: 0,
    surveysCompleted: 0,
    totalSurveys: 0,
    challengesActive: 0,
    challengesCompleted: 0
  });
  const [hasCompletedIntake, setHasCompletedIntake] = useState(true);
  const isLoadingRef = useRef(false);
  const hasMountedRef = useRef(false);

  // Load dashboard data
  useEffect(() => {
    // Prevent multiple simultaneous loads
    if (isLoadingRef.current || hasMountedRef.current) return;
    
    const loadData = async () => {
      isLoadingRef.current = true;
      hasMountedRef.current = true;
      
      try {
        // Load dashboard data first
        const dashboardResult = await getDashboard();
        
        if (dashboardResult) {
          setTherapist(dashboardResult.therapist || null);
          setMetrics({
            totalSessions: dashboardResult.totalSessions || 0,
            completedSessions: dashboardResult.completedSessions || 0,
            upcomingAppointments: dashboardResult.upcomingAppointments || 0,
            treatmentProgress: dashboardResult.treatmentProgress || 0,
            wellnessScore: dashboardResult.wellnessScore || 0,
            resourcesCompleted: dashboardResult.resourcesCompleted || 0,
            totalResources: dashboardResult.totalResources || 0,
            surveysCompleted: dashboardResult.surveysCompleted || 0,
            totalSurveys: dashboardResult.totalSurveys || 0,
            challengesActive: dashboardResult.challengesActive || 0,
            challengesCompleted: dashboardResult.challengesCompleted || 0
          });
          // Check if intake form is completed
          setHasCompletedIntake(dashboardResult.hasCompletedIntake !== false);
          
          
          // Completion survey endpoint not working - removed
        }
        
        // Add delay between API calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Load appointments separately
        try {
          await getAppointments({ page: 1, limit: 10 });
        } catch (error) {
          console.warn('Failed to load appointments:', error);
        }
        
        // Add delay between API calls
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Load messages separately and handle errors gracefully
        try {
          await getMessages({ page: 1, limit: 5 });
        } catch (error: any) {
          // Don't spam console for 403/404 errors - messages might not be available for all users
          if (error?.response?.status !== 403 && error?.response?.status !== 404) {
            console.warn('Failed to load messages:', error);
          }
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        isLoadingRef.current = false;
      }
    };

    loadData();
  }, []); // Remove dependencies to prevent re-runs

  // Process appointments and messages
  useEffect(() => {
    if (appointments && appointments.length > 0) {
      // Find next appointment
      const upcoming = appointments
        .filter(apt => apt.status === 'scheduled' && new Date(apt.appointment_date) >= new Date())
        .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());
      
      if (upcoming.length > 0) {
        setNextAppointment(upcoming[0]);
      }
    }
  }, [appointments]);

  useEffect(() => {
    if (messages && messages.length > 0) {
      const unread = messages.filter(msg => !msg.read);
      setUnreadMessages(unread);
    }
  }, [messages]);

  const isLoading = isDashboardLoading || isAppointmentsLoading || isMessagesLoading;

  // Quick actions
  const quickActions = [
    {
      title: 'Emergency Appointment',
      description: 'Book urgent appointment',
      icon: BoltIcon,
      link: '/client/appointments/new?urgent=true',
      color: 'bg-red-600'
    },
    {
      title: 'Find Therapist',
      description: 'Search for available therapists',
      icon: MagnifyingGlassIcon,
      link: '/client/therapists',
      color: 'bg-teal-600'
    },
    {
      title: t('dashboard.bookAppointment'),
      description: t('dashboard.scheduleTherapySession'),
      icon: CalendarIcon,
      link: '/client/appointments/new',
      color: 'bg-blue-600'
    },
    {
      title: t('dashboard.messageTherapist'),
      description: t('dashboard.sendSecureMessage'),
      icon: ChatBubbleLeftIcon,
      link: '/client/messages/new',
      color: 'bg-green-600'
    },
    {
      title: 'My Transactions',
      description: 'View invoices and payments',
      icon: CurrencyEuroIcon,
      link: '/client/invoices',
      color: 'bg-emerald-600'
    },
    {
      title: t('dashboard.viewResources'),
      description: t('dashboard.accessMaterials'),
      icon: BookOpenIcon,
      link: '/client/resources',
      color: 'bg-purple-600'
    },
    {
      title: t('nav.surveys') || 'Surveys',
      description: 'Complete assigned surveys',
      icon: ClipboardDocumentCheckIcon,
      link: '/client/surveys',
      color: 'bg-indigo-600'
    },
    {
      title: t('nav.challenges') || 'Challenges',
      description: 'Track your wellness challenges',
      icon: PuzzlePieceIcon,
      link: '/client/challenges',
      color: 'bg-orange-600'
    },
    {
      title: t('dashboard.progressTracking'),
      description: t('dashboard.monitorJourney'),
      icon: ChartBarIcon,
      link: '/client/session-history',
      color: 'bg-pink-600'
    }
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Unpaid Invoice Alert */}
        <UnpaidInvoiceAlert className="mb-6 animate-fadeIn" />
        
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white animated-gradient">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {t('dashboard.welcome')}, {user?.first_name}!
              </h1>
              <p className="text-blue-100 mt-1">
                {t('dashboard.yourWellnessJourney')}
              </p>
            </div>
            {nextAppointment && (
              <div className="mt-4 md:mt-0 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3">
                <p className="text-sm text-blue-100">{t('dashboard.nextAppointment')}</p>
                <p className="font-semibold">
                  {new Date(nextAppointment.appointment_date).toLocaleDateString()} at{' '}
                  {nextAppointment.start_time}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Intake Form Alert */}
        {!hasCompletedIntake && (
          <div className="card-premium bg-amber-50 border-amber-200 p-6 animate-slideInRight">
            <div className="flex items-start">
              <ExclamationCircleIcon className="w-6 h-6 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 mb-1">{t('dashboard.completeIntakeForm')}</h3>
                <p className="text-body-sm text-amber-800 mb-3">
                  {t('dashboard.intakeFormMessage')}
                </p>
                <Link
                  to="/client/intake-form"
                  className="btn-premium-primary inline-flex items-center space-x-2 text-sm"
                >
                  <DocumentTextIcon className="w-4 h-4" />
                  <span>{t('dashboard.completeIntakeForm')}</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Therapist Info */}
        {therapist && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fadeIn card-hover">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-gray-500" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-gray-900">
                  {t('nav.myTherapist')}: {therapist.first_name} {therapist.last_name}
                </h2>
                <p className="text-sm text-gray-600">
                  {t('client.specializations') || 'Specializations'}: {therapist.specializations?.join(', ') || t('client.generalTherapy') || 'General therapy'}
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <Link 
                    to="/client/therapist" 
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {t('action.view')} {t('nav.profile').toLowerCase()}
                  </Link>
                  <Link 
                    to="/client/messages/new" 
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    {t('nav.sendMessage') || 'Send message'}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Overview */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <AnimatedMetricCard
            title={t('dashboard.sessionsCompleted')}
            value={`${metrics.completedSessions}/${metrics.totalSessions}`}
            subtitle={`${metrics.totalSessions > 0 ? Math.round((metrics.completedSessions / metrics.totalSessions) * 100) : 0}% complete`}
            icon={CalendarIcon}
            color="blue"
            delay={0}
          />
          <AnimatedMetricCard
            title="Therapists Paired"
            value={therapist ? '1' : '0'}
            subtitle={therapist ? therapist.name || 'Assigned' : 'None assigned'}
            icon={UserIcon}
            color="green"
            delay={50}
          />
          <AnimatedMetricCard
            title={t('dashboard.treatmentGoals')}
            value={metrics.treatmentProgress}
            subtitle="Progress towards goals"
            icon={TrophyIcon}
            color="yellow"
            delay={100}
          />
          <AnimatedMetricCard
            title={t('dashboard.wellnessScore')}
            value={metrics.wellnessScore}
            subtitle="Overall wellness"
            icon={HeartIcon}
            color="red"
            delay={200}
          />
          <AnimatedMetricCard
            title={t('dashboard.resourcesCompleted')}
            value={`${metrics.resourcesCompleted}/${metrics.totalResources}`}
            subtitle={`${metrics.totalResources > 0 ? Math.round((metrics.resourcesCompleted / metrics.totalResources) * 100) : 0}% complete`}
            icon={BookOpenIcon}
            color="purple"
            delay={300}
          />
          <AnimatedMetricCard
            title="Surveys Completed"
            value={`${metrics.surveysCompleted}/${metrics.totalSurveys}`}
            subtitle={`${metrics.totalSurveys > 0 ? Math.round((metrics.surveysCompleted / metrics.totalSurveys) * 100) : 0}% complete`}
            icon={ClipboardDocumentCheckIcon}
            color="indigo"
            delay={400}
          />
          <AnimatedMetricCard
            title="Active Challenges"
            value={metrics.challengesActive}
            subtitle={`${metrics.challengesCompleted} completed`}
            icon={PuzzlePieceIcon}
            color="yellow"
            delay={500}
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.quickActions')}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <QuickAction key={action.title} {...action} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Appointments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.upcomingAppointments')}</h2>
              <Link 
                to="/client/appointments" 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {t('dashboard.viewAll')}
              </Link>
            </div>
            
            {isAppointmentsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : appointments && appointments.filter(apt => apt.status === 'scheduled').length > 0 ? (
              <div className="space-y-3 fade-in-stagger">
                {appointments
                  .filter(apt => apt.status === 'scheduled')
                  .slice(0, 3)
                  .map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg smooth-transition hover:bg-gray-100 hover:shadow-sm">
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(appointment.appointment_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {appointment.start_time} - {appointment.end_time}
                        </p>
                      </div>
                      <StatusIndicator
                        type="appointment"
                        status={appointment.status}
                        size="sm"
                      />
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{t('client.noUpcomingAppointments') || 'No upcoming appointments'}</p>
                <Link 
                  to="/client/appointments/new"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                >
                  {t('dashboard.bookAppointment')}
                </Link>
              </div>
            )}
          </div>

          {/* Recent Messages */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {t('nav.messages')}
                {unreadMessages.length > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {unreadMessages.length} new
                  </span>
                )}
              </h2>
              <Link 
                to="/client/messages" 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all
              </Link>
            </div>
            
            {isMessagesLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : messages && messages.length > 0 ? (
              <div className="space-y-3 fade-in-stagger">
                {messages.slice(0, 3).map((message) => (
                  <Link
                    key={message.id}
                    to={`/client/messages/${message.id}`}
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 smooth-transition hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">
                          {message.subject}
                        </p>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {message.content}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(message.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {!message.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full ml-3 mt-1 notification-badge" />
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ChatBubbleLeftIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No messages yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Wellness Tips - Only show if we have data */}
        {dashboardData?.wellnessTip && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 animate-fadeIn">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Wellness Tip</h2>
            <div className="bg-white rounded-lg p-4 card-hover">
              <p className="text-gray-700">
                {dashboardData.wellnessTip}
              </p>
              {dashboardData.wellnessTipLink && (
                <Link 
                  to={dashboardData.wellnessTipLink}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-3 inline-block smooth-transition"
                >
                  Learn more →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
      
      
    </PageTransition>
  );
};

export default ClientDashboard;