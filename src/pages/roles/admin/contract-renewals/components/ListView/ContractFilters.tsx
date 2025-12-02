import React from 'react';
import { FunnelIcon } from '@heroicons/react/24/outline';
import { useContractContext } from '../shared/ContractContext';

const ContractFilters: React.FC = () => {
  const { filters, setFilters } = useContractContext();

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <FunnelIcon className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>

        {/* Status Filter */}
        <div className="flex-1 max-w-xs">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="expiring_soon">Expiring Soon</option>
            <option value="expired">Expired</option>
            <option value="renewed">Renewed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Auto-Renew Filter */}
        <div className="flex-1 max-w-xs">
          <select
            value={filters.auto_renew}
            onChange={(e) => setFilters({ auto_renew: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
          >
            <option value="all">All Contracts</option>
            <option value="true">Auto-Renew Enabled</option>
            <option value="false">Auto-Renew Disabled</option>
          </select>
        </div>

        {/* Clear Filters */}
        {(filters.status !== 'all' || filters.auto_renew !== 'all') && (
          <button
            onClick={() => setFilters({ status: 'all', auto_renew: 'all' })}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default ContractFilters;
