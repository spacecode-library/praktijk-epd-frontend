import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
  ArrowPathIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { PremiumCard, PremiumButton, StatusBadge } from '@/components/layout/PremiumLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/utils/dateFormatters';
import realApiService from '@/services/realApi';
import { useAlert } from '@/components/ui/CustomAlert';

interface Contract {
  id: string;
  client_id: string;
  client_name: string;
  client_email: string;
  start_date: string;
  end_date: string;
  status: string;
  contract_type?: string;
  sessions_included?: number;
  sessions_used?: number;
  auto_renew: boolean;
  days_until_expiry: number;
  contract_value?: number;
  payment_schedule?: string;
}

const TherapistContracts: React.FC = () => {
  const navigate = useNavigate();
  const { error: showError } = useAlert();
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    expiring_soon: 0,
    expired: 0
  });

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const response = await realApiService.contracts.therapist.list();
      if (response.success && response.data) {
        setContracts(response.data.contracts || []);

        // Calculate statistics
        const contractsData = response.data.contracts || [];
        setStatistics({
          total: contractsData.length,
          active: contractsData.filter((c: Contract) => c.status === 'active').length,
          expiring_soon: contractsData.filter((c: Contract) => c.days_until_expiry <= 30 && c.days_until_expiry > 0).length,
          expired: contractsData.filter((c: Contract) => c.status === 'expired').length
        });
      }
    } catch (err: any) {
      showError(err.message || 'Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleViewContract = (id: string) => {
    navigate(`/therapist/contracts/${id}`);
  };

  const getStatusBadgeType = (status: string): 'success' | 'warning' | 'danger' | 'info' => {
    switch (status) {
      case 'active': return 'success';
      case 'expiring_soon': return 'warning';
      case 'expired': return 'danger';
      case 'renewed': return 'info';
      case 'cancelled': return 'danger';
      default: return 'info';
    }
  };

  const getDaysUntilExpiryColor = (days: number): string => {
    if (days < 0) return 'text-gray-500';
    if (days <= 7) return 'text-red-600';
    if (days <= 14) return 'text-orange-600';
    if (days <= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getDaysUntilExpiryDisplay = (days: number): string => {
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Expires today';
    if (days === 1) return '1 day';
    return `${days} days`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Contracts</h1>
        <p className="mt-1 text-sm text-gray-500">
          View your contracts with clients and renewal status
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <PremiumCard className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Total</p>
              <p className="text-xl font-bold text-gray-900">{statistics.total}</p>
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Active</p>
              <p className="text-xl font-bold text-gray-900">{statistics.active}</p>
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Expiring Soon</p>
              <p className="text-xl font-bold text-gray-900">{statistics.expiring_soon}</p>
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Expired</p>
              <p className="text-xl font-bold text-gray-900">{statistics.expired}</p>
            </div>
          </div>
        </PremiumCard>
      </div>

      {/* Contracts Grid */}
      {contracts.length === 0 ? (
        <PremiumCard className="p-12">
          <div className="text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No contracts</h3>
            <p className="mt-1 text-sm text-gray-500">
              You don't have any contracts yet.
            </p>
          </div>
        </PremiumCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contracts.map((contract) => (
            <PremiumCard key={contract.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {contract.client_name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500">{contract.client_email}</p>
                </div>
                <StatusBadge type={getStatusBadgeType(contract.status)} status={contract.status} />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Period</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(contract.start_date)} - {formatDate(contract.end_date)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Sessions</span>
                  <span className="font-medium text-gray-900">
                    {contract.sessions_used || 0} / {contract.sessions_included || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Days Until Expiry</span>
                  <span className={`font-semibold ${getDaysUntilExpiryColor(contract.days_until_expiry)}`}>
                    {getDaysUntilExpiryDisplay(contract.days_until_expiry)}
                  </span>
                </div>

                {contract.auto_renew && (
                  <div className="flex items-center text-sm text-blue-600">
                    <ArrowPathIcon className="h-4 w-4 mr-1" />
                    Auto-Renew Enabled
                  </div>
                )}

                <div className="pt-3 border-t border-gray-100">
                  <PremiumButton
                    variant="outline"
                    onClick={() => handleViewContract(contract.id)}
                    icon={EyeIcon}
                    className="w-full"
                  >
                    View Details
                  </PremiumButton>
                </div>
              </div>
            </PremiumCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default TherapistContracts;
