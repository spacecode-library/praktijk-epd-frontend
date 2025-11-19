import React, { useEffect, useState } from 'react';
import {
  UsersIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyEuroIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BellIcon,
  CheckCircleIcon,
  UserPlusIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  QueueListIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useAuth } from '@/store/authStore';
import { useTranslation } from '@/contexts/LanguageContext';
import { useTherapistDashboard, useTherapistAppointments, useTherapistClients, useTherapistWaitingList } from '@/hooks/useRealApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusIndicator from '@/components/ui/StatusIndicator';
import PageTransition from '@/components/ui/PageTransition';
import AnimatedMetricCard from '@/components/ui/AnimatedMetricCard';
import { Appointment, Client } from '@/types/entities';
import { formatTime, formatDate, formatCurrency } from '@/utils/dateFormatters';

// Metric card component - replaced with AnimatedMetricCard

// Appointment card component
interface AppointmentCardProps {
  appointment: Appointment;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment }) => {
  const getTimeString = (time: string) => {
    return formatTime(time);
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg smooth-transition hover:bg-gray-100 hover:shadow-sm hover:translate-x-1">
      <div className="flex items-center space-x-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {new Date(appointment.appointment_date).getDate()}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(appointment.appointment_date).toLocaleDateString('en-US', { month: 'short' })}
          </p>
        </div>
        <div>
          <p className="font-medium text-gray-900">
            {appointment.client?.first_name} {appointment.client?.last_name}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <ClockIcon className="w-4 h-4 text-gray-400" />
            <p className="text-sm text-gray-600">
              {getTimeString(appointment.start_time)} - 
              {getTimeString(appointment.end_time)}
            </p>
          </div>
        </div>
      </div>
      <StatusIndicator
        type="appointment"
        status={appointment.status}
        size="sm"
      />
    </div>
  );
};

const TherapistDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  // API hooks
  const { execute: getDashboard, data: dashboardData, isLoading: isDashboardLoading } = useTherapistDashboard();
  const { appointments, getAppointments, isLoading: isAppointmentsLoading } = useTherapistAppointments();
  const { clients, getClients, isLoading: isClientsLoading } = useTherapistClients();
  const { waitingList, stats: waitingListStats, getWaitingList, isLoading: isWaitingListLoading } = useTherapistWaitingList();

  // State
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [metrics, setMetrics] = useState({
    totalClients: 0,
    todayAppointments: 0,
    weeklyAppointments: 0,
    monthlyRevenue: 0,
    completedSessions: 0,
    averageRating: 0
  });

  // Load dashboard data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load all data in parallel
        const [dashboardResult] = await Promise.all([
          getDashboard(),
          getAppointments({ status: 'scheduled' }),
          getClients({ status: 'active' }),
          getWaitingList({ status: 'all', urgency: 'all' })
        ]);

        if (dashboardResult && dashboardResult.stats) {
          setMetrics({
            totalClients: dashboardResult.stats.activeClients || clients.length || 0,
            todayAppointments: dashboardResult.stats.todayAppointments || 0,
            weeklyAppointments: dashboardResult.stats.weeklyAppointments || 0,
            monthlyRevenue: 0, // Not provided by API
            completedSessions: dashboardResult.stats.completedSessions || 0,
            averageRating: 0 // Not provided by API
          });
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }
    };

    loadData();
  }, []);

  // Filter appointments for today and upcoming
  useEffect(() => {
    if (appointments && appointments.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      
      const todayAppts = appointments.filter(apt => 
        apt.appointment_date === today && apt.status === 'scheduled'
      );
      
      const upcomingAppts = appointments.filter(apt => 
        apt.appointment_date > today && apt.status === 'scheduled'
      ).slice(0, 5);

      setTodayAppointments(todayAppts);
      setUpcomingAppointments(upcomingAppts);
    }
  }, [appointments]);

  const isLoading = isDashboardLoading || isAppointmentsLoading || isClientsLoading;

  // Process recent activities from dashboard data
  const recentActivities = React.useMemo(() => {
    if (dashboardData?.recentActivity && Array.isArray(dashboardData.recentActivity)) {
      return dashboardData.recentActivity.map((activity: any, index: number) => {
        // Map activity types to icons and colors
        const getActivityDetails = (type: string) => {
          switch (type) {
            case 'session_completed':
              return { icon: CheckCircleIcon, iconColor: 'text-green-600' };
            case 'new_appointment':
            case 'appointment_scheduled':
              return { icon: CalendarIcon, iconColor: 'text-blue-600' };
            case 'document_received':
            case 'document_uploaded':
              return { icon: DocumentTextIcon, iconColor: 'text-purple-600' };
            case 'client_registered':
            case 'new_client':
              return { icon: UserPlusIcon, iconColor: 'text-indigo-600' };
            case 'payment_received':
              return { icon: CurrencyDollarIcon, iconColor: 'text-yellow-600' };
            case 'message_received':
              return { icon: ChatBubbleLeftRightIcon, iconColor: 'text-pink-600' };
            default:
              return { icon: ClockIcon, iconColor: 'text-gray-600' };
          }
        };

        const details = getActivityDetails(activity.type || activity.activityType);
        
        return {
          id: activity.id || index,
          type: activity.type || activity.activityType,
          message: activity.message || activity.description || activity.title,
          time: activity.time || activity.timestamp || activity.createdAt,
          ...details
        };
      }).slice(0, 5); // Show only the most recent 5 activities
    }
    
    // Fallback to mock data if no real data available
    return [
      {
        id: 1,
        type: 'session_completed',
        message: 'Session completed with Emma Williams',
        time: '2 hours ago',
        icon: CheckCircleIcon,
        iconColor: 'text-green-600'
      },
      {
        id: 2,
        type: 'new_appointment',
        message: 'New appointment scheduled with John Smith',
        time: '4 hours ago',
        icon: CalendarIcon,
        iconColor: 'text-blue-600'
      },
      {
        id: 3,
        type: 'document_received',
        message: 'Insurance document received from Sarah Johnson',
        time: 'Yesterday',
        icon: DocumentTextIcon,
        iconColor: 'text-purple-600'
      }
    ];
  }, [dashboardData]);

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white animated-gradient">
          <div className="flex items-center justify-between">
            <div className="animate-fadeIn">
              <h1 className="text-2xl font-bold">
                {t('dashboard.welcome')}, {user?.first_name}
              </h1>
              <p className="text-indigo-100 mt-1">
                {t('therapist.dashboardSubtitle')}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/therapist/appointments/new"
                className="inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium rounded-lg shadow-sm text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm smooth-transition button-press"
              >
                {t('therapist.scheduleAppointment')}
              </Link>
            </div>
          </div>
        </div>

        {/* No Clients Assigned Message */}
        {!isLoading && metrics.totalClients === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 animate-slideInRight card-hover">
            <div className="flex">
              <div className="flex-shrink-0">
                <UsersIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">No Clients Assigned</h3>
                <p className="mt-2 text-sm text-blue-700">
                  You haven't been assigned any clients yet. The administrator will assign clients to you based on your specializations and availability.
                  Once assigned, you'll receive a notification and can start scheduling appointments.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <AnimatedMetricCard
            title={t('therapist.myClients')}
            value={metrics.totalClients}
            subtitle="Active clients"
            icon={UsersIcon}
            color="blue"
            delay={0}
          />
          <AnimatedMetricCard
            title={t('therapist.todayAppointments')}
            value={metrics.todayAppointments}
            subtitle={`${todayAppointments.length} scheduled`}
            icon={CalendarIcon}
            color="green"
            delay={100}
          />
          <AnimatedMetricCard
            title={t('dashboard.thisWeek') || 'This Week'}
            value={metrics.weeklyAppointments}
            subtitle={t('nav.appointments').toLowerCase()}
            icon={ClockIcon}
            color="purple"
            delay={200}
          />
          <AnimatedMetricCard
            title={t('therapist.monthlyRevenue')}
            value={`€${metrics.monthlyRevenue.toLocaleString()}`}
            subtitle="This month"
            icon={CurrencyEuroIcon}
            color="yellow"
            delay={300}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Schedule */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{t('therapist.todaySchedule')}</h2>
              <Link 
                to="/therapist/appointments" 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {t('dashboard.viewAll')}
              </Link>
            </div>
            
            {isAppointmentsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : todayAppointments.length > 0 ? (
              <div className="space-y-3">
                {todayAppointments.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">{t('therapist.noAppointmentsToday')}</p>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.recentActivity')}</h2>
              <Link 
                to="/therapist/activity" 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {t('dashboard.viewAll')}
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentActivities.map((activity: any) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <activity.icon className={`w-5 h-5 ${activity.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
            <Link
              to="/therapist/calendar"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View calendar
            </Link>
          </div>

          {isAppointmentsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : upcomingAppointments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {upcomingAppointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No upcoming appointments</p>
          )}
        </div>

        {/* My Waiting List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <QueueListIcon className="w-6 h-6 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">My Waiting List</h2>
            </div>
            <div className="flex items-center space-x-4">
              {waitingListStats && (
                <div className="flex items-center space-x-3 text-sm">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                    {waitingListStats.pendingCount || 0} Pending
                  </span>
                  {(waitingListStats.urgentCount || 0) > 0 && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full font-medium flex items-center">
                      <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                      {waitingListStats.urgentCount} Urgent
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {isWaitingListLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : waitingList && waitingList.length > 0 ? (
            <div className="space-y-3">
              {waitingList.map((request: any) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg smooth-transition hover:bg-gray-100 hover:shadow-sm"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`w-2 h-12 rounded-full ${
                      request.urgency === 'urgent' ? 'bg-red-500' :
                      request.urgency === 'high' ? 'bg-orange-500' :
                      'bg-green-500'
                    }`} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {request.client?.firstName} {request.client?.lastName}
                      </p>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <span className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {request.preferredDate ? formatDate(request.preferredDate) : 'No date specified'}
                        </span>
                        <span className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {request.preferredTime || 'Flexible'}
                        </span>
                      </div>
                      {request.problemDescription && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                          {request.problemDescription}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        request.urgency === 'urgent' ? 'bg-red-100 text-red-700' :
                        request.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {request.urgency?.toUpperCase() || 'NORMAL'}
                      </span>
                      <StatusIndicator
                        type="client"
                        status={request.status}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <QueueListIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No waiting list requests at the moment</p>
              <p className="text-sm text-gray-400 mt-1">
                New clients who prefer you as their therapist will appear here
              </p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{metrics.completedSessions}</p>
              <p className="text-sm text-gray-600 mt-1">Sessions Completed</p>
              <p className="text-xs text-green-600 mt-2">+12% from last month</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{metrics.averageRating.toFixed(1)}</p>
              <p className="text-sm text-gray-600 mt-1">Average Rating</p>
              <div className="flex justify-center mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(metrics.averageRating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{clients.length}</p>
              <p className="text-sm text-gray-600 mt-1">Total Clients</p>
              <p className="text-xs text-blue-600 mt-2">View client list</p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default TherapistDashboard;