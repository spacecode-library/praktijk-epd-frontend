import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  BellAlertIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useContractContext } from '../shared/ContractContext';
import ListHeader from './ListHeader';
import ContractFilters from './ContractFilters';
import ContractCard from './ContractCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { PremiumButton, PremiumEmptyState, PremiumCard } from '@/components/layout/PremiumLayout';

const ContractList: React.FC = () => {
  const navigate = useNavigate();

  const {
    contracts,
    loading,
    statistics,
    selectedIds,
    selectAll,
    loadContracts,
    loadStatistics,
    toggleSelectAll,
    currentPage,
    pageSize,
    totalItems,
    setPage,
    filters
  } = useContractContext();

  useEffect(() => {
    loadContracts();
    loadStatistics();
  }, [loadContracts, loadStatistics]);

  const handleCreateNew = () => {
    navigate('/admin/contract-renewals/new');
  };

  const handleViewContract = (id: string) => {
    navigate(`/admin/contract-renewals/${id}`);
  };

  const handleEditContract = (id: string) => {
    navigate(`/admin/contract-renewals/${id}/edit`);
  };

  // Calculate pagination
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalItems);

  if (loading && contracts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contract Renewal Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage therapist-client contracts and renewal notifications
          </p>
        </div>
        <PremiumButton
          onClick={handleCreateNew}
          variant="danger"
          icon={PlusIcon}
        >
          Create Contract
        </PremiumButton>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <PremiumCard className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <DocumentTextIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Total</p>
                <p className="text-xl font-bold text-gray-900">{statistics.total_contracts}</p>
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
                <p className="text-xl font-bold text-gray-900">{statistics.active_contracts}</p>
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
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <CalendarDaysIcon className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">30 Days</p>
                <p className="text-xl font-bold text-gray-900">{statistics.expiring_30_days}</p>
              </div>
            </div>
          </PremiumCard>

          <PremiumCard className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <ClockIcon className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">14 Days</p>
                <p className="text-xl font-bold text-gray-900">{statistics.expiring_14_days}</p>
              </div>
            </div>
          </PremiumCard>

          <PremiumCard className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <BellAlertIcon className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">7 Days</p>
                <p className="text-xl font-bold text-gray-900">{statistics.expiring_7_days}</p>
              </div>
            </div>
          </PremiumCard>

          <PremiumCard className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <XCircleIcon className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Expired</p>
                <p className="text-xl font-bold text-gray-900">{statistics.expired}</p>
              </div>
            </div>
          </PremiumCard>

          <PremiumCard className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <ArrowPathIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Auto-Renew</p>
                <p className="text-xl font-bold text-gray-900">{statistics.auto_renew_enabled}</p>
              </div>
            </div>
          </PremiumCard>
        </div>
      )}

      {/* Search and Filters */}
      <ListHeader />
      <ContractFilters />

      {/* Contract List */}
      {contracts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <PremiumEmptyState
            icon={DocumentTextIcon}
            title={filters.search || filters.status !== 'all' || filters.therapist_id !== 'all'
              ? "No contracts found"
              : "No contracts yet"}
            description={filters.search || filters.status !== 'all' || filters.therapist_id !== 'all'
              ? "Try adjusting your filters to see more results"
              : "Get started by creating your first therapist-client contract"}
            action={!(filters.search || filters.status !== 'all' || filters.therapist_id !== 'all') ? {
              label: "Create Your First Contract",
              onClick: handleCreateNew
            } : undefined}
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-12 px-6 py-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Therapist
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Until Expiry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sessions
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contracts.map(contract => (
                <ContractCard
                  key={contract.id}
                  contract={contract}
                  onView={handleViewContract}
                  onEdit={handleEditContract}
                />
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex}</span> to{' '}
                    <span className="font-medium">{endIndex}</span> of{' '}
                    <span className="font-medium">{totalItems}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    {/* Page numbers - show limited range */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = currentPage - 2 + i;
                      if (page < 1 || page > totalPages) return null;
                      return (
                        <button
                          key={page}
                          onClick={() => setPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? 'z-10 bg-red-50 border-red-500 text-red-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContractList;
