import React, { useEffect, useState } from 'react';
import {
  UserGroupIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CalendarIcon,
  FunnelIcon,
  ChartBarIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { useTherapistWaitingList } from '@/hooks/useRealApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusIndicator from '@/components/ui/StatusIndicator';
import { formatDate, formatTime } from '@/utils/dateFormatters';

const TherapistWaitingList: React.FC = () => {
  const {
    waitingList,
    stats,
    getWaitingList,
    isLoading,
    error
  } = useTherapistWaitingList();

  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');

  // Load data on mount
  useEffect(() => {
    getWaitingList({ status: statusFilter, urgency: urgencyFilter });
  }, []);

  // Reload when filters change
  const handleFilterChange = () => {
    getWaitingList({ status: statusFilter, urgency: urgencyFilter });
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Waiting List</h1>
          <p className="text-sm text-gray-600 mt-1">
            Clients who have requested appointments with you
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="scheduled">Scheduled</option>
            </select>

            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
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
          </div>
        </div>
      </div>

      {/* Statistics */}
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
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingCount || 0}</p>
              </div>
              <ClockIcon className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Urgent</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.urgentCount || 0}</p>
              </div>
              <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.highPriorityCount || 0}</p>
              </div>
              <FireIcon className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      {/* Waiting List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Waiting List Requests ({waitingList.length})
          </h2>
        </div>

        {waitingList.length === 0 ? (
          <div className="p-12 text-center">
            <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No waiting list requests</p>
            <p className="text-sm text-gray-400 mt-2">
              {statusFilter !== 'all' || urgencyFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Requests will appear here when clients request appointments with you'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {waitingList.map((request: any) => (
              <div
                key={request.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Urgency Indicator */}
                    <div className={`w-2 h-16 rounded-full flex-shrink-0 ${
                      request.urgency === 'urgent' ? 'bg-red-500' :
                      request.urgency === 'high' ? 'bg-orange-500' :
                      'bg-green-500'
                    }`} />

                    {/* Client Information */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">
                          {request.client?.firstName} {request.client?.lastName}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          request.urgency === 'urgent' ? 'bg-red-100 text-red-700' :
                          request.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {request.urgency?.toUpperCase() || 'NORMAL'}
                        </span>
                      </div>

                      {/* Client Contact */}
                      {request.client?.email && (
                        <p className="text-sm text-gray-600 mt-1">
                          {request.client.email}
                        </p>
                      )}

                      {/* Problem Description */}
                      {request.problemDescription && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700">Reason for Therapy:</p>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {request.problemDescription}
                          </p>
                        </div>
                      )}

                      {/* Appointment Preferences */}
                      <div className="flex items-center space-x-6 mt-3 text-sm text-gray-600">
                        <span className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1.5" />
                          {request.preferredDate ? formatDate(request.preferredDate) : 'No preference'}
                        </span>
                        <span className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1.5" />
                          {request.preferredTime || 'Flexible'}
                        </span>
                        {request.therapyType && (
                          <span className="text-gray-500">
                            • {request.therapyType}
                          </span>
                        )}
                      </div>

                      {/* Additional Info */}
                      <div className="flex items-center space-x-4 mt-3">
                        <StatusIndicator
                          type="client"
                          status={request.status}
                          size="sm"
                        />
                        {request.createdAt && (
                          <span className="text-xs text-gray-500">
                            Requested on {formatDate(request.createdAt)}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-3 mt-4">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                          Schedule Appointment
                        </button>
                        <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                          View Client Profile
                        </button>
                        {request.urgency === 'urgent' && (
                          <span className="text-xs text-red-600 font-medium">
                            ⚠️ Requires immediate attention
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TherapistWaitingList;
