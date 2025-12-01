import React, { useEffect, useState, useMemo } from 'react';
import {
  UsersIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CalendarIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAdminWaitingListGrouped } from '@/hooks/useRealApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusIndicator from '@/components/ui/StatusIndicator';
import { formatDate, formatTime } from '@/utils/dateFormatters';

const WaitingListGrouped: React.FC = () => {
  const {
    groupedByTherapist,
    unassigned,
    stats,
    getWaitingListGrouped,
    isLoading,
    error
  } = useAdminWaitingListGrouped();

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [therapistSearchQuery, setTherapistSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Load data on mount
  useEffect(() => {
    getWaitingListGrouped({ status: statusFilter, urgency: urgencyFilter });
  }, []);

  // Apply client-side filtering for therapists
  const filteredGroupedByTherapist = useMemo(() => {
    let filtered = groupedByTherapist;

    // Search by therapist name
    if (therapistSearchQuery.trim()) {
      const query = therapistSearchQuery.toLowerCase();
      filtered = filtered.filter((group: any) =>
        group.therapistName?.toLowerCase().includes(query)
      );
    }

    // Filter requests within each therapist group
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.map((group: any) => ({
        ...group,
        requests: group.requests.filter((request: any) => {
          const fullName = `${request.client?.firstName || ''} ${request.client?.lastName || ''}`.toLowerCase();
          const email = (request.client?.email || '').toLowerCase();
          return fullName.includes(query) || email.includes(query);
        })
      })).filter((group: any) => group.requests.length > 0);
    }

    return filtered;
  }, [groupedByTherapist, searchQuery, therapistSearchQuery]);

  // Reload when backend filters change
  const handleFilterChange = () => {
    getWaitingListGrouped({ status: statusFilter, urgency: urgencyFilter });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setStatusFilter('all');
    setUrgencyFilter('all');
    setSearchQuery('');
    setTherapistSearchQuery('');
    getWaitingListGrouped({});
  };

  // Check if any filters are active
  const hasActiveFilters = statusFilter !== 'all' || urgencyFilter !== 'all' ||
    searchQuery || therapistSearchQuery;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Failed to load waiting list: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Waiting List by Therapist</h1>
            <p className="text-sm text-gray-600 mt-1">
              View workload distribution and manage assignments across therapists
            </p>
          </div>
        </div>

        {/* Search Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Therapist Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search therapists by name..."
              value={therapistSearchQuery}
              onChange={(e) => setTherapistSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {therapistSearchQuery && (
              <button
                onClick={() => setTherapistSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <XMarkIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Client Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-3 flex-1">
            <FunnelIcon className="w-5 h-5 text-gray-500" />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="scheduled">Scheduled</option>
            </select>

            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Urgency</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
            </select>

            <button
              onClick={handleFilterChange}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Apply
            </button>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center space-x-1"
              >
                <XMarkIcon className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            )}
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredGroupedByTherapist.length} therapists
          </div>
        </div>
      </div>

      {/* Overall Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalRequests || 0}</p>
              </div>
              <UserGroupIcon className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Therapists with Requests</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalTherapistsWithRequests || 0}</p>
              </div>
              <UsersIcon className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unassigned</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalUnassigned || 0}</p>
              </div>
              <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Requests/Therapist</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.averageRequestsPerTherapist || 0}</p>
              </div>
              <ChartBarIcon className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Unassigned Requests Section */}
      {unassigned && unassigned.total > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Unassigned Requests ({unassigned.total})
              </h2>
              {unassigned.urgent > 0 && (
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                  {unassigned.urgent} Urgent
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {unassigned.requests && unassigned.requests.slice(0, 5).map((request: any) => (
              <div
                key={request.id}
                className="bg-white rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {request.client?.firstName} {request.client?.lastName}
                  </p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                    {request.problemDescription}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    request.urgency === 'urgent' ? 'bg-red-100 text-red-700' :
                    request.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {request.urgency?.toUpperCase()}
                  </span>
                  <StatusIndicator type="client" status={request.status} size="sm" />
                </div>
              </div>
            ))}
            {unassigned.total > 5 && (
              <p className="text-sm text-gray-500 text-center pt-2">
                And {unassigned.total - 5} more unassigned requests...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Therapists with Grouped Requests */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Therapists ({filteredGroupedByTherapist.length})
        </h2>

        {filteredGroupedByTherapist.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No therapists with waiting list requests</p>
            <p className="text-sm text-gray-400 mt-2">
              {hasActiveFilters
                ? 'No therapists match your filters. Try adjusting your search or clearing filters.'
                : 'Requests will appear here when clients select a preferred therapist'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredGroupedByTherapist.map((therapist: any) => (
              <div
                key={therapist.therapistId}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Therapist Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <UsersIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {therapist.therapistName}
                        </h3>
                        <p className="text-sm text-gray-600">{therapist.therapistEmail}</p>
                        {therapist.specializations && therapist.specializations.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {therapist.specializations.slice(0, 3).map((spec: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Workload Stats */}
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{therapist.currentClients || 0}</p>
                        <p className="text-xs text-gray-600">Current Clients</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{therapist.availableSlots || 0}</p>
                        <p className="text-xs text-gray-600">Available Slots</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{therapist.utilizationRate || 0}%</p>
                        <p className="text-xs text-gray-600">Utilization</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600">{therapist.totalRequests || 0}</p>
                        <p className="text-xs text-gray-600">Waiting Requests</p>
                      </div>
                    </div>
                  </div>

                  {/* Request Stats Row */}
                  <div className="flex items-center space-x-4 mt-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {therapist.pendingCount || 0} Pending
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      {therapist.assignedCount || 0} Assigned
                    </span>
                    {(therapist.urgentCount || 0) > 0 && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                        {therapist.urgentCount} Urgent
                      </span>
                    )}
                    {(therapist.highPriorityCount || 0) > 0 && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                        {therapist.highPriorityCount} High Priority
                      </span>
                    )}
                  </div>
                </div>

                {/* Requests List */}
                <div className="p-4 space-y-2">
                  {therapist.requests && therapist.requests.length > 0 ? (
                    therapist.requests.map((request: any) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
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
                                {request.preferredDate ? formatDate(request.preferredDate) : 'No date'}
                              </span>
                              <span className="flex items-center">
                                <ClockIcon className="w-4 h-4 mr-1" />
                                {request.preferredTime || 'Flexible'}
                              </span>
                              {request.therapyType && (
                                <span className="text-gray-500">• {request.therapyType}</span>
                              )}
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
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">No requests for this therapist</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WaitingListGrouped;
