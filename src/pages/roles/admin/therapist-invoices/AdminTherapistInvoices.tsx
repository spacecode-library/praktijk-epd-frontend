import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  CurrencyEuroIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BanknotesIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { therapistInvoiceApi, TherapistInvoice, InvoiceStats } from '@/services/therapistInvoiceApi';
import { useAlert } from '@/components/ui/CustomAlert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageTransition from '@/components/ui/PageTransition';
import AnimatedMetricCard from '@/components/ui/AnimatedMetricCard';
import { formatDate, formatCurrency } from '@/utils/dateFormatters';
import InvoiceDetailModal from './components/InvoiceDetailModal';
import ApproveModal from './components/ApproveModal';
import RejectModal from './components/RejectModal';
import MarkPaidModal from './components/MarkPaidModal';

const AdminTherapistInvoices: React.FC = () => {
  const { success, error: showError } = useAlert();

  // State
  const [invoices, setInvoices] = useState<TherapistInvoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [therapistFilter, setTherapistFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modal states
  const [selectedInvoice, setSelectedInvoice] = useState<TherapistInvoice | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [statusFilter, therapistFilter, dateFrom, dateTo]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const filters: any = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (therapistFilter) filters.therapist_id = therapistFilter;
      if (dateFrom) filters.from_date = dateFrom;
      if (dateTo) filters.to_date = dateTo;

      const [invoicesData, statsData] = await Promise.all([
        therapistInvoiceApi.getAllInvoices(filters),
        therapistInvoiceApi.getAllStats()
      ]);

      setInvoices(invoicesData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load invoices:', err);
      showError('Failed to load therapist invoices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  const handleViewDetails = (invoice: TherapistInvoice) => {
    setSelectedInvoice(invoice);
    setShowDetailModal(true);
  };

  const handleApprove = (invoice: TherapistInvoice) => {
    setSelectedInvoice(invoice);
    setShowApproveModal(true);
  };

  const handleReject = (invoice: TherapistInvoice) => {
    setSelectedInvoice(invoice);
    setShowRejectModal(true);
  };

  const handleMarkPaid = (invoice: TherapistInvoice) => {
    setSelectedInvoice(invoice);
    setShowMarkPaidModal(true);
  };

  const handleApproveSuccess = () => {
    success('Invoice approved successfully');
    setShowApproveModal(false);
    loadData();
  };

  const handleRejectSuccess = () => {
    success('Invoice rejected');
    setShowRejectModal(false);
    loadData();
  };

  const handleMarkPaidSuccess = () => {
    success('Invoice marked as paid');
    setShowMarkPaidModal(false);
    loadData();
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      paid: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="w-4 h-4" />;
      case 'approved':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'rejected':
        return <XCircleIcon className="w-4 h-4" />;
      case 'paid':
        return <BanknotesIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  // Filter invoices by search query
  const filteredInvoices = invoices.filter((invoice) => {
    const query = searchQuery.toLowerCase();
    return (
      invoice.invoice_number.toLowerCase().includes(query) ||
      (invoice.therapist_name || '').toLowerCase().includes(query) ||
      (invoice.description || '').toLowerCase().includes(query)
    );
  });

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Therapist Invoice Management</h1>
              <p className="text-purple-100 mt-1">
                Review and process therapist invoice submissions
              </p>
            </div>
            <DocumentTextIcon className="w-12 h-12 text-purple-200" />
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <AnimatedMetricCard
              title="Pending Review"
              value={stats.pending_count}
              subtitle={formatCurrency(stats.pending_amount)}
              icon={ClockIcon}
              color="yellow"
              delay={0}
            />
            <AnimatedMetricCard
              title="Approved"
              value={stats.approved_count}
              subtitle={formatCurrency(stats.approved_amount)}
              icon={CheckCircleIcon}
              color="green"
              delay={100}
            />
            <AnimatedMetricCard
              title="Paid"
              value={stats.paid_count}
              subtitle={formatCurrency(stats.paid_amount)}
              icon={BanknotesIcon}
              color="blue"
              delay={200}
            />
            <AnimatedMetricCard
              title="Total Invoices"
              value={stats.total_invoices}
              subtitle={formatCurrency(stats.total_amount)}
              icon={DocumentTextIcon}
              color="purple"
              delay={300}
            />
          </div>
        )}

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FunnelIcon className="w-5 h-5 mr-2" />
              Filters & Search
            </h2>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Invoice number, therapist, description..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Active Filters Summary */}
          {(statusFilter !== 'all' || searchQuery || dateFrom || dateTo) && (
            <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600">
              <span className="font-medium">Active filters:</span>
              {statusFilter !== 'all' && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                  Status: {statusFilter}
                </span>
              )}
              {searchQuery && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                  Search: "{searchQuery}"
                </span>
              )}
              {(dateFrom || dateTo) && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                  Date range
                </span>
              )}
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setSearchQuery('');
                  setDateFrom('');
                  setDateTo('');
                }}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Invoices ({filteredInvoices.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No invoices found</p>
              {(searchQuery || statusFilter !== 'all') && (
                <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Therapist
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {invoice.invoice_number}
                            </div>
                            {invoice.description && (
                              <div className="text-xs text-gray-500 truncate max-w-xs">
                                {invoice.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{invoice.therapist_name || 'Unknown'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(invoice.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(invoice.invoice_date)}</div>
                        {invoice.due_date && (
                          <div className="text-xs text-gray-500">Due: {formatDate(invoice.due_date)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(invoice.status)}`}>
                          {getStatusIcon(invoice.status)}
                          <span className="capitalize">{invoice.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewDetails(invoice)}
                            className="text-gray-600 hover:text-gray-900"
                            title="View details"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          {invoice.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(invoice)}
                                className="text-green-600 hover:text-green-700"
                                title="Approve"
                              >
                                <CheckCircleIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleReject(invoice)}
                                className="text-red-600 hover:text-red-700"
                                title="Reject"
                              >
                                <XCircleIcon className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          {invoice.status === 'approved' && (
                            <button
                              onClick={() => handleMarkPaid(invoice)}
                              className="text-blue-600 hover:text-blue-700"
                              title="Mark as paid"
                            >
                              <BanknotesIcon className="w-5 h-5" />
                            </button>
                          )}
                          {invoice.file_url && (
                            <a
                              href={invoice.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:text-purple-700"
                              title="Download invoice"
                            >
                              <DocumentArrowDownIcon className="w-5 h-5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedInvoice && (
        <>
          <InvoiceDetailModal
            invoice={selectedInvoice}
            isOpen={showDetailModal}
            onClose={() => setShowDetailModal(false)}
          />
          <ApproveModal
            invoice={selectedInvoice}
            isOpen={showApproveModal}
            onClose={() => setShowApproveModal(false)}
            onSuccess={handleApproveSuccess}
          />
          <RejectModal
            invoice={selectedInvoice}
            isOpen={showRejectModal}
            onClose={() => setShowRejectModal(false)}
            onSuccess={handleRejectSuccess}
          />
          <MarkPaidModal
            invoice={selectedInvoice}
            isOpen={showMarkPaidModal}
            onClose={() => setShowMarkPaidModal(false)}
            onSuccess={handleMarkPaidSuccess}
          />
        </>
      )}
    </PageTransition>
  );
};

export default AdminTherapistInvoices;
