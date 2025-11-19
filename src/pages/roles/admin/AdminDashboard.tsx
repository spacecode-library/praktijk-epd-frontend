import React, { useEffect, useState } from 'react';
import { 
  UsersIcon, 
  CalendarIcon, 
  CurrencyEuroIcon, 
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  UserGroupIcon,
  BanknotesIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useAuth } from '@/store/authStore';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAdminDashboard, useAdminWaitingList, useAdminFinancialOverview } from '@/hooks/useRealApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusIndicator from '@/components/ui/StatusIndicator';
import PageTransition from '@/components/ui/PageTransition';
import AnimatedMetricCard from '@/components/ui/AnimatedMetricCard';
import { DashboardMetrics, WaitingListApplication, FinancialOverview } from '@/types/entities';
import { formatDate, formatCurrency, formatFullDate } from '@/utils/dateFormatters';

// Metric card component - replaced with AnimatedMetricCard

// Quick action button
interface QuickActionProps {
  icon: React.ComponentType<any>;
  label: string;
  onClick: () => void;
  color?: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon: Icon, label, onClick, color }) => {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center p-4 rounded-lg ${color} smooth-transition hover:scale-105 hover:shadow-lg button-press`}
    >
      <Icon className="w-6 h-6 text-white mb-2" />
      <span className="text-sm font-medium text-white">{label}</span>
    </button>
  );
};

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  // API hooks
  const { execute: getDashboard, data: dashboardData, isLoading: isDashboardLoading } = useAdminDashboard();
  const { getWaitingList, waitingList, isLoading: isWaitingListLoading } = useAdminWaitingList();
  const { execute: getFinancialOverview, data: financialData, isLoading: isFinancialLoading } = useAdminFinancialOverview();

  // State
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [financial, setFinancial] = useState<FinancialOverview | null>(null);
  const [recentWaitingList, setRecentWaitingList] = useState<WaitingListApplication[]>([]);
  const [previousMetrics, setPreviousMetrics] = useState<DashboardMetrics | null>(null);

  // Load dashboard data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load all data in parallel
        const [dashboardResult, financialResult] = await Promise.all([
          getDashboard(),
          getFinancialOverview()
        ]);
        
        // Also load waiting list
        await getWaitingList();

        if (dashboardResult) {
          setMetrics(dashboardResult);
        }
        if (financialResult) {
          setFinancial(financialResult);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }
    };

    loadData();
  }, []);

  // Update recent waiting list when data changes
  useEffect(() => {
    if (waitingList && waitingList.length > 0) {
      setRecentWaitingList(waitingList.slice(0, 5));
    }
  }, [waitingList]);

  const isLoading = isDashboardLoading || isFinancialLoading || isWaitingListLoading;

  // Quick actions
  const quickActions = [
    {
      icon: UserGroupIcon,
      label: 'Add Client',
      onClick: () => window.location.href = '/admin/clients/new',
      color: 'bg-blue-600'
    },
    {
      icon: CalendarIcon,
      label: 'Schedule',
      onClick: () => window.location.href = '/admin/agenda',
      color: 'bg-green-600'
    },
    {
      icon: BanknotesIcon,
      label: 'New Invoice',
      onClick: () => window.location.href = '/admin/financial/invoices/new',
      color: 'bg-purple-600'
    },
    {
      icon: ClipboardDocumentListIcon,
      label: 'Reports',
      onClick: () => window.location.href = '/admin/reports',
      color: 'bg-orange-600'
    }
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white animated-gradient">
          <div className="flex items-center justify-between">
            <div className="animate-fadeIn">
              <h1 className="text-2xl font-bold">
                Welcome back, {user?.first_name || 'Admin'}
              </h1>
              <p className="text-blue-100 mt-1">
                Here's what's happening in your practice today
              </p>
            </div>
            <div className="text-sm text-blue-100">
              {formatFullDate(new Date())}
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <AnimatedMetricCard
            title="Active Clients"
            value={metrics?.activeClients || 0}
            subtitle={metrics && metrics.activeClients > 0 ? `${metrics.activeClients} active` : "No active clients"}
            icon={UsersIcon}
            color="blue"
            delay={0}
            trend={metrics && previousMetrics ? {
              value: ((metrics.activeClients - (previousMetrics?.activeClients || 0)) / (previousMetrics?.activeClients || 1)) * 100,
              isPositive: metrics.activeClients > (previousMetrics?.activeClients || 0)
            } : undefined}
          />
          <AnimatedMetricCard
            title="Monthly Revenue"
            value={`€${financial?.totalRevenue?.toLocaleString() || '0'}`}
            subtitle={financial && financial.totalRevenue > 0 ? "Year to date" : "No revenue"}
            icon={CurrencyEuroIcon}
            color="green"
            delay={100}
          />
          <AnimatedMetricCard
            title="Today's Appointments"
            value={metrics?.appointmentsToday || 0}
            subtitle={metrics && (metrics.appointmentsToday || 0) > 0 ? "scheduled" : "No appointments"}
            icon={CalendarIcon}
            color="purple"
            delay={200}
          />
          <AnimatedMetricCard
            title="Waiting List"
            value={metrics?.waitingListCount || waitingList?.length || 0}
            subtitle={(metrics?.waitingListCount ?? 0) > 5 ? "High demand" : "Normal capacity"}
            icon={ClockIcon}
            color={(metrics?.waitingListCount ?? 0) > 5 ? "red" : "yellow"}
            delay={300}
          />
          <AnimatedMetricCard
            title="No-Show Appointments"
            value={metrics?.noShowCount || 0}
            subtitle={(metrics?.noShowCount ?? 0) > 3 ? "Requires attention" : "Normal"}
            icon={ExclamationTriangleIcon}
            color={(metrics?.noShowCount ?? 0) > 3 ? "red" : "orange"}
            delay={400}
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <QuickAction key={index} {...action} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Waiting List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
              <Link 
                to="/admin/waiting-list" 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all
              </Link>
            </div>
            
            {isWaitingListLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : recentWaitingList.length > 0 ? (
              <div className="space-y-3 fade-in-stagger">
                {recentWaitingList.map((application) => (
                  <div key={application.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg smooth-transition hover:bg-gray-100 hover:shadow-sm">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {application.first_name} {application.last_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Applied {new Date(application.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <StatusIndicator
                        type="waiting_list"
                        status={application.status}
                        size="sm"
                      />
                      {application.urgency_level === 'critical' && (
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-600 pulse" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No pending applications</p>
            )}
          </div>

          {/* Financial Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Financial Summary</h2>
              <Link 
                to="/admin/financial" 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View details
              </Link>
            </div>
            
            {isFinancialLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Revenue (Month)</span>
                  <span className="font-semibold text-gray-900">
                    €{financial?.totalRevenue?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Outstanding Amount</span>
                  <span className="font-semibold text-orange-600">
                    €{financial?.outstandingAmount?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Paid This Month</span>
                  <span className="font-semibold text-green-600">
                    €{financial?.paidThisMonth?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">Projected Revenue</span>
                    <span className="font-bold text-lg text-gray-900">
                      €{financial?.projectedRevenue?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Today's Schedule Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
            <Link 
              to="/admin/agenda" 
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View full agenda
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{metrics?.upcomingAppointments || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Total Appointments</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{metrics?.therapistCount || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Active Therapists</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-3xl font-bold text-purple-600">{metrics?.overdueInvoices || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Overdue Invoices</p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default AdminDashboard;