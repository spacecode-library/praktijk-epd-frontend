import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  UserIcon,
  CurrencyEuroIcon,
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/store/authStore';
import { useTranslation } from '@/contexts/LanguageContext';
import { PremiumCard, PremiumButton } from '@/components/layout/PremiumLayout';
import { useAlert } from '@/components/ui/CustomAlert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { unifiedApi } from '@/services/unifiedApi';

// Types
interface TherapistInfo {
  id: string;
  name: string;
  email: string;
  status: string;
  hourlyRate: number;
  currentClients: number;
  maxClients: number;
}

interface PeriodStats {
  sessions: number;
  revenue: number;
  clients: number;
  averageDuration: number;
}

interface TherapistStatistics {
  therapist: TherapistInfo;
  overview: {
    totalSessions: number;
    totalRevenue: number;
    uniqueClients: number;
    averageSessionDuration: number;
    completionRate: number;
  };
  periods: {
    last7Days: PeriodStats;
    last30Days: PeriodStats;
    last90Days: PeriodStats;
  };
  appointmentStats: {
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    noShowAppointments: number;
    completionRate: number;
  };
  billing: {
    unbilledSessions: number;
    pendingRevenue: number;
  };
  recentActivity: {
    lastSessionDate: string | null;
    upcomingAppointments: number;
    pendingInvoices: number;
  };
}

interface TherapistListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
}

const TherapistStatistics: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { success, error: showError } = useAlert();

  // State
  const [therapists, setTherapists] = useState<TherapistListItem[]>([]);
  const [selectedTherapist, setSelectedTherapist] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<TherapistStatistics | null>(null);
  const [isLoadingTherapists, setIsLoadingTherapists] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30' | '90'>('30');

  // Load therapists on mount
  useEffect(() => {
    loadTherapists();
  }, []);

  const loadTherapists = async () => {
    try {
      setIsLoadingTherapists(true);
      const response = await unifiedApi.admin.getTherapists({ limit: 100 });
      if (response.success && response.data) {
        const therapistList = Array.isArray(response.data) ? response.data : response.data.therapists || [];
        setTherapists(therapistList);

        // Auto-select first therapist
        if (therapistList.length > 0) {
          setSelectedTherapist(therapistList[0].id);
          loadStatistics(therapistList[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load therapists:', err);
      showError('Failed to load therapists');
    } finally {
      setIsLoadingTherapists(false);
    }
  };

  const loadStatistics = async (therapistId: string) => {
    try {
      setIsLoadingStats(true);
      const response = await unifiedApi.admin.getTherapistStatistics(therapistId);
      if (response.success && response.data) {
        setStatistics(response.data);
      }
    } catch (err) {
      console.error('Failed to load statistics:', err);
      showError('Failed to load therapist statistics');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleTherapistSelect = (therapistId: string) => {
    setSelectedTherapist(therapistId);
    loadStatistics(therapistId);
  };

  // Filter therapists by search query
  const filteredTherapists = therapists.filter((therapist) => {
    const fullName = `${therapist.firstName} ${therapist.lastName}`.toLowerCase();
    const email = therapist.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  // Get selected period stats
  const getPeriodStats = (): PeriodStats | null => {
    if (!statistics) return null;
    switch (selectedPeriod) {
      case '7':
        return statistics.periods.last7Days;
      case '30':
        return statistics.periods.last30Days;
      case '90':
        return statistics.periods.last90Days;
      default:
        return statistics.periods.last30Days;
    }
  };

  const periodStats = getPeriodStats();

  if (isLoadingTherapists) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Therapist Statistics</h1>
        <p className="text-sm text-gray-600 mt-1">
          View detailed performance metrics and statistics for therapists
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Therapist List Sidebar */}
        <div className="lg:col-span-1">
          <PremiumCard>
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Therapists</h2>

              {/* Search */}
              <div className="relative mb-4">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search therapists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>

              {/* Therapist List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredTherapists.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No therapists found
                  </p>
                ) : (
                  filteredTherapists.map((therapist) => (
                    <button
                      key={therapist.id}
                      onClick={() => handleTherapistSelect(therapist.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedTherapist === therapist.id
                          ? 'bg-blue-50 border-2 border-blue-500 text-blue-900'
                          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium">
                        {therapist.firstName} {therapist.lastName}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {therapist.email}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </PremiumCard>
        </div>

        {/* Statistics Content */}
        <div className="lg:col-span-3">
          {isLoadingStats ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          ) : !statistics ? (
            <PremiumCard>
              <div className="p-12 text-center">
                <ChartBarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a therapist to view statistics</p>
              </div>
            </PremiumCard>
          ) : (
            <div className="space-y-6">
              {/* Therapist Info Card */}
              <PremiumCard>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {statistics.therapist.name}
                      </h2>
                      <p className="text-sm text-gray-600">{statistics.therapist.email}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        statistics.therapist.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {statistics.therapist.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Hourly Rate</p>
                      <p className="text-lg font-semibold text-gray-900">
                        €{statistics.therapist.hourlyRate?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Current Clients</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {statistics.therapist.currentClients || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Max Clients</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {statistics.therapist.maxClients || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </PremiumCard>

              {/* Period Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Time Period:</span>
                <button
                  onClick={() => setSelectedPeriod('7')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedPeriod === '7'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => setSelectedPeriod('30')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedPeriod === '30'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Last 30 Days
                </button>
                <button
                  onClick={() => setSelectedPeriod('90')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedPeriod === '90'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Last 90 Days
                </button>
              </div>

              {/* Overview Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <PremiumCard>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600">Total Sessions</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {periodStats?.sessions || 0}
                        </p>
                      </div>
                      <CalendarIcon className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>
                </PremiumCard>

                <PremiumCard>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600">Revenue</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          €{periodStats?.revenue?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <CurrencyEuroIcon className="w-8 h-8 text-green-500" />
                    </div>
                  </div>
                </PremiumCard>

                <PremiumCard>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600">Clients Served</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {periodStats?.clients || 0}
                        </p>
                      </div>
                      <UserIcon className="w-8 h-8 text-purple-500" />
                    </div>
                  </div>
                </PremiumCard>

                <PremiumCard>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600">Avg Duration</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {periodStats?.averageDuration?.toFixed(0) || 0}m
                        </p>
                      </div>
                      <ClockIcon className="w-8 h-8 text-orange-500" />
                    </div>
                  </div>
                </PremiumCard>

                <PremiumCard>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600">Completion Rate</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {statistics.overview.completionRate?.toFixed(1) || 0}%
                        </p>
                      </div>
                      <CheckCircleIcon className="w-8 h-8 text-teal-500" />
                    </div>
                  </div>
                </PremiumCard>
              </div>

              {/* Appointment Statistics */}
              <PremiumCard>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Statistics (Last 30 Days)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-600">
                        {statistics.appointmentStats.totalAppointments}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600">
                        {statistics.appointmentStats.completedAppointments}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Completed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-yellow-600">
                        {statistics.appointmentStats.cancelledAppointments}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Cancelled</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-red-600">
                        {statistics.appointmentStats.noShowAppointments}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">No-Show</p>
                    </div>
                  </div>
                </div>
              </PremiumCard>

              {/* Billing & Recent Activity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PremiumCard>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Unbilled Sessions</span>
                        <span className="text-lg font-semibold text-gray-900">
                          {statistics.billing.unbilledSessions}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Pending Revenue</span>
                        <span className="text-lg font-semibold text-orange-600">
                          €{statistics.billing.pendingRevenue?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>
                </PremiumCard>

                <PremiumCard>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Last Session</span>
                        <span className="text-sm font-medium text-gray-900">
                          {statistics.recentActivity.lastSessionDate
                            ? new Date(statistics.recentActivity.lastSessionDate).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Upcoming Appointments</span>
                        <span className="text-lg font-semibold text-blue-600">
                          {statistics.recentActivity.upcomingAppointments}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Pending Invoices</span>
                        <span className="text-lg font-semibold text-orange-600">
                          {statistics.recentActivity.pendingInvoices}
                        </span>
                      </div>
                    </div>
                  </div>
                </PremiumCard>
              </div>

              {/* All-Time Overview */}
              <PremiumCard>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">All-Time Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {statistics.overview.totalSessions}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Total Sessions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        €{statistics.overview.totalRevenue?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Total Revenue</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {statistics.overview.uniqueClients}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Unique Clients</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {statistics.overview.averageSessionDuration?.toFixed(0) || 0}m
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Avg Session</p>
                    </div>
                  </div>
                </div>
              </PremiumCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TherapistStatistics;
