import React, { useState } from 'react';
import { MagnifyingGlassIcon, ArrowPathIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { useClientContext } from '../shared/ClientContext';
import { PremiumButton } from '@/components/layout/PremiumLayout';
import ExportModal from '../ExportModal';

const ListHeader: React.FC = () => {
  const { filters, setFilters, loading, loadClients, therapists } = useClientContext();
  const [showExportModal, setShowExportModal] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ search: e.target.value });
  };

  const handleRefresh = () => {
    loadClients();
  };

  return (
    <>
      <div className="flex items-center justify-between space-x-4">
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <input
              type="text"
              value={filters.search}
              onChange={handleSearchChange}
              placeholder="Search clients by name, email, or phone..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="flex space-x-2">
          <PremiumButton
            variant="primary"
            icon={DocumentArrowDownIcon}
            onClick={() => setShowExportModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Export
          </PremiumButton>

          <PremiumButton
            variant="outline"
            icon={ArrowPathIcon}
            onClick={handleRefresh}
            disabled={loading}
            className={loading ? 'animate-spin' : ''}
          >
            Refresh
          </PremiumButton>
        </div>
      </div>

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        therapists={therapists}
      />
    </>
  );
};

export default ListHeader;