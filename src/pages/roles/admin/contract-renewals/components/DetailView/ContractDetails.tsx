import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  UserGroupIcon,
  CalendarIcon,
  DocumentTextIcon,
  CurrencyEuroIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useContractContext } from '../shared/ContractContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { PremiumButton, PremiumCard, StatusBadge } from '@/components/layout/PremiumLayout';
import { formatDate } from '@/utils/dateFormatters';
import { useAlert } from '@/components/ui/CustomAlert';
import realApiService from '@/services/realApi';

interface ContractData {
  id: string;
  therapist_id: string;
  client_id: string;
  therapist_name: string;
  therapist_email: string;
  client_name: string;
  client_email: string;
  start_date: string;
  end_date: string;
  status: string;
  contract_type?: string;
  sessions_included?: number;
  sessions_used?: number;
  contract_value?: number;
  payment_schedule?: string;
  auto_renew: boolean;
  renewal_period_days?: number;
  days_until_expiry: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const ContractDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { deleteContract, loadContracts } = useContractContext();
  const { success, error, confirm } = useAlert();
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<ContractData | null>(null);

  useEffect(() => {
    if (id) {
      loadContract();
    }
  }, [id]);

  const loadContract = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const response = await realApiService.contracts.admin.get(id);
      if (response.success && response.data) {
        setContract(response.data);
      } else {
        error('Failed to load contract');
        navigate('/admin/contract-renewals');
      }
    } catch (err: any) {
      error(err.message || 'Failed to load contract');
      navigate('/admin/contract-renewals');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm(
      'Are you sure you want to delete this contract?',
      'This action cannot be undone. All contract data will be permanently deleted.'
    );

    if (confirmed && id) {
      const result = await deleteContract(id);
      if (result) {
        success('Contract deleted successfully');
        await loadContracts();
        navigate('/admin/contract-renewals');
      }
    }
  };

  const handleRenew = () => {
    // Navigate to renew page (to be implemented)
    success('Renew functionality coming soon');
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

  if (loading || !contract) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <PremiumButton
            variant="outline"
            icon={ArrowLeftIcon}
            onClick={() => navigate('/admin/contract-renewals')}
          >
            Back to Contracts
          </PremiumButton>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contract Details</h1>
            <p className="text-sm text-gray-500">
              {contract.therapist_name} - {contract.client_name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {contract.status !== 'expired' && contract.status !== 'cancelled' && (
            <PremiumButton
              variant="outline"
              icon={ArrowPathIcon}
              onClick={handleRenew}
            >
              Renew Contract
            </PremiumButton>
          )}
          <PremiumButton
            variant="danger"
            icon={PencilIcon}
            onClick={() => navigate(`/admin/contract-renewals/${id}/edit`)}
          >
            Edit Contract
          </PremiumButton>
          <PremiumButton
            variant="outline"
            icon={TrashIcon}
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700"
          >
            Delete
          </PremiumButton>
        </div>
      </div>

      {/* Contract Info Card */}
      <PremiumCard className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-xl font-semibold text-gray-900">
                Contract #{contract.id.slice(0, 8)}
              </h2>
              <StatusBadge type={getStatusBadgeType(contract.status)} status={contract.status} />
              {contract.auto_renew && (
                <div className="flex items-center text-sm text-blue-600">
                  <ArrowPathIcon className="h-4 w-4 mr-1" />
                  Auto-Renew Enabled
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Created: {formatDate(contract.created_at)} • Last Updated: {formatDate(contract.updated_at)}
            </p>
          </div>
          {contract.days_until_expiry >= 0 && contract.days_until_expiry <= 30 && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Expiry Warning</p>
              <p className={`text-lg font-semibold ${getDaysUntilExpiryColor(contract.days_until_expiry)}`}>
                {getDaysUntilExpiryDisplay(contract.days_until_expiry)}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contract Parties */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Contract Parties</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Therapist</p>
                <p className="text-sm font-medium text-gray-900">{contract.therapist_name}</p>
                <p className="text-xs text-gray-500">{contract.therapist_email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Client</p>
                <p className="text-sm font-medium text-gray-900">{contract.client_name}</p>
                <p className="text-xs text-gray-500">{contract.client_email}</p>
              </div>
            </div>
          </div>

          {/* Contract Period */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Contract Period</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Start Date</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(contract.start_date)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">End Date</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(contract.end_date)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Duration</p>
                <p className="text-sm font-medium text-gray-900">
                  {Math.ceil((new Date(contract.end_date).getTime() - new Date(contract.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>
            </div>
          </div>
        </div>
      </PremiumCard>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <PremiumCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Sessions</p>
              <p className="text-2xl font-bold text-gray-900">
                {contract.sessions_used || 0} / {contract.sessions_included || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${contract.sessions_included ? (contract.sessions_used || 0) / contract.sessions_included * 100 : 0}%`
                }}
              />
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Days Until Expiry</p>
              <p className={`text-2xl font-bold ${getDaysUntilExpiryColor(contract.days_until_expiry)}`}>
                {contract.days_until_expiry < 0 ? Math.abs(contract.days_until_expiry) : contract.days_until_expiry}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              contract.days_until_expiry <= 7 ? 'bg-red-100' : contract.days_until_expiry <= 14 ? 'bg-orange-100' : contract.days_until_expiry <= 30 ? 'bg-yellow-100' : 'bg-green-100'
            }`}>
              <ClockIcon className={`w-6 h-6 ${
                contract.days_until_expiry <= 7 ? 'text-red-600' : contract.days_until_expiry <= 14 ? 'text-orange-600' : contract.days_until_expiry <= 30 ? 'text-yellow-600' : 'text-green-600'
              }`} />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {contract.days_until_expiry < 0 ? 'Overdue' : 'Remaining'}
          </p>
        </PremiumCard>

        <PremiumCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Contract Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {contract.contract_value ? `€${contract.contract_value.toFixed(2)}` : 'N/A'}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CurrencyEuroIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500 capitalize">
            {contract.payment_schedule ? contract.payment_schedule.replace('_', ' ') : 'N/A'}
          </p>
        </PremiumCard>

        <PremiumCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Renewal Period</p>
              <p className="text-2xl font-bold text-gray-900">
                {contract.renewal_period_days || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">Days</p>
        </PremiumCard>
      </div>

      {/* Contract Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contract Information */}
        <PremiumCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-500" />
            Contract Information
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Contract Type</p>
              <p className="text-sm font-medium text-gray-900 capitalize">
                {contract.contract_type ? contract.contract_type.replace('_', ' ') : 'Standard'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Sessions Included</p>
              <p className="text-sm font-medium text-gray-900">
                {contract.sessions_included || 0} sessions
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Sessions Used</p>
              <p className="text-sm font-medium text-gray-900">
                {contract.sessions_used || 0} sessions
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Sessions Remaining</p>
              <p className="text-sm font-medium text-gray-900">
                {(contract.sessions_included || 0) - (contract.sessions_used || 0)} sessions
              </p>
            </div>
          </div>
        </PremiumCard>

        {/* Renewal Settings */}
        <PremiumCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ArrowPathIcon className="h-5 w-5 mr-2 text-orange-500" />
            Renewal Settings
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Auto-Renewal</p>
              <p className="text-sm font-medium text-gray-900 flex items-center">
                {contract.auto_renew ? (
                  <>
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                    Enabled
                  </>
                ) : (
                  <>
                    <ExclamationTriangleIcon className="h-4 w-4 text-gray-400 mr-1" />
                    Disabled
                  </>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Renewal Period</p>
              <p className="text-sm font-medium text-gray-900">
                {contract.renewal_period_days || 365} days
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Notification Schedule</p>
              <p className="text-sm font-medium text-gray-900">
                30, 14, and 7 days before expiry
              </p>
            </div>
          </div>
        </PremiumCard>
      </div>

      {/* Notes */}
      {contract.notes && (
        <PremiumCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-500" />
            Additional Notes
          </h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{contract.notes}</p>
        </PremiumCard>
      )}
    </div>
  );
};

export default ContractDetails;
