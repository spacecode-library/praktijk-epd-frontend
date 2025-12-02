import React from 'react';
import { EyeIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useContractContext, Contract } from '../shared/ContractContext';
import { StatusBadge } from '@/components/layout/PremiumLayout';

interface ContractCardProps {
  contract: Contract;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
}

const ContractCard: React.FC<ContractCardProps> = ({ contract, onView, onEdit }) => {
  const { selectedIds, toggleSelectContract } = useContractContext();
  const isSelected = selectedIds.has(contract.id);

  const getStatusBadgeType = (status: string): 'success' | 'warning' | 'danger' | 'info' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'expiring_soon':
        return 'warning';
      case 'expired':
      case 'cancelled':
        return 'danger';
      default:
        return 'info';
    }
  };

  const getDaysUntilExpiryDisplay = (days: number): string => {
    if (days < 0) return 'Expired';
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    return `${Math.floor(days)} days`;
  };

  const getDaysUntilExpiryColor = (days: number): string => {
    if (days < 0) return 'text-gray-500';
    if (days <= 7) return 'text-red-600 font-semibold';
    if (days <= 14) return 'text-orange-600 font-semibold';
    if (days <= 30) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <tr className={`hover:bg-gray-50 ${isSelected ? 'bg-red-50' : ''}`}>
      {/* Checkbox */}
      <td className="w-12 px-6 py-4">
        <input
          type="checkbox"
          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
          checked={isSelected}
          onChange={() => toggleSelectContract(contract.id)}
        />
      </td>

      {/* Therapist */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div>
            <div className="text-sm font-medium text-gray-900">
              {contract.therapist_name}
            </div>
            <div className="text-sm text-gray-500">
              {contract.therapist_email}
            </div>
          </div>
        </div>
      </td>

      {/* Client */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div>
            <div className="text-sm font-medium text-gray-900">
              {contract.client_name}
            </div>
            <div className="text-sm text-gray-500">
              {contract.client_email}
            </div>
          </div>
        </div>
      </td>

      {/* Start Date */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatDate(contract.start_date)}
      </td>

      {/* End Date */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatDate(contract.end_date)}
      </td>

      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge
          type={getStatusBadgeType(contract.status)}
          status={contract.status.replace(/_/g, ' ')}
        />
      </td>

      {/* Days Until Expiry */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`text-sm ${getDaysUntilExpiryColor(contract.days_until_expiry)}`}>
          {getDaysUntilExpiryDisplay(contract.days_until_expiry)}
        </span>
      </td>

      {/* Sessions */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {contract.sessions_included ? (
          <span>
            {contract.sessions_used} / {contract.sessions_included}
          </span>
        ) : (
          <span className="text-gray-400">N/A</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => onView(contract.id)}
            className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
            title="View Contract"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onEdit(contract.id)}
            className="text-gray-600 hover:text-gray-900 p-1 rounded-md hover:bg-gray-50"
            title="Edit Contract"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default ContractCard;
