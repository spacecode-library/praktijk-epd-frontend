import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CurrencyEuroIcon,
  CalendarIcon,
  BanknotesIcon,
  TrashIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/store/authStore';
import { useTranslation } from '@/contexts/LanguageContext';
import { therapistInvoiceApi, TherapistInvoice, InvoiceStats } from '@/services/therapistInvoiceApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import UploadInvoiceModal from './components/UploadInvoiceModal';

const TherapistInvoices: React.FC = () => {
  const { user, getDisplayName } = useAuth();
  const { t } = useTranslation();

  // State management
  const [invoices, setInvoices] = useState<TherapistInvoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Load invoices data
  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      const [invoicesData, statsData] = await Promise.all([
        therapistInvoiceApi.getMyInvoices(),
        therapistInvoiceApi.getMyStats()
      ]);

      setInvoices(invoicesData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'approved': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircleIcon className="w-4 h-4" />;
      case 'approved': return <CheckCircleIcon className="w-4 h-4" />;
      case 'pending': return <ClockIcon className="w-4 h-4" />;
      case 'rejected': return <ExclamationTriangleIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const handleDelete = async (invoiceId: string) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    try {
      await therapistInvoiceApi.deleteInvoice(invoiceId);
      await loadInvoices(); // Reload data
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      alert('Failed to delete invoice. Please try again.');
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    // Search filter
    if (searchTerm) {
      const matchesSearch =
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.description && invoice.description.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filterStatus !== 'all' && invoice.status !== filterStatus) {
      return false;
    }

    // Period filter
    if (filterPeriod !== 'all') {
      const invoiceDate = new Date(invoice.invoice_date);
      const now = new Date();

      switch (filterPeriod) {
        case 'this_month':
          if (invoiceDate.getMonth() !== now.getMonth() || invoiceDate.getFullYear() !== now.getFullYear()) {
            return false;
          }
          break;
        case 'last_month':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
          if (invoiceDate.getMonth() !== lastMonth.getMonth() || invoiceDate.getFullYear() !== lastMonth.getFullYear()) {
            return false;
          }
          break;
        case 'this_year':
          if (invoiceDate.getFullYear() !== now.getFullYear()) {
            return false;
          }
          break;
      }
    }

    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-rose-600 rounded-xl shadow-sm p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">My Invoices</h1>
            <p className="text-red-100 mt-1">
              Upload and track your invoices for payment
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-white text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors font-medium"
            >
              <DocumentArrowUpIcon className="w-5 h-5" />
              <span>Upload Invoice</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-4xl font-extrabold text-gray-900 mb-1">€{stats.paid_amount.toLocaleString()}</div>
                <div className="text-sm font-medium text-gray-600 mb-2">Paid Amount</div>
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                  <span>{stats.paid_count} invoices</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center opacity-10">
                <CurrencyEuroIcon className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-4xl font-extrabold text-gray-900 mb-1">€{stats.approved_amount.toLocaleString()}</div>
                <div className="text-sm font-medium text-gray-600 mb-2">Approved</div>
                <div className="flex items-center text-sm text-blue-600">
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                  <span>{stats.approved_count} invoices</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center opacity-10">
                <CheckCircleIcon className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-4xl font-extrabold text-gray-900 mb-1">€{stats.pending_amount.toLocaleString()}</div>
                <div className="text-sm font-medium text-gray-600 mb-2">Pending</div>
                <div className="flex items-center text-sm text-yellow-600">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  <span>{stats.pending_count} invoices</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center opacity-10">
                <ClockIcon className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-4xl font-extrabold text-gray-900 mb-1">€{stats.total_amount.toLocaleString()}</div>
                <div className="text-sm font-medium text-gray-600 mb-2">Total</div>
                <div className="flex items-center text-sm text-purple-600">
                  <BanknotesIcon className="w-4 h-4 mr-1" />
                  <span>{stats.total_invoices} invoices</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center opacity-10">
                <BanknotesIcon className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search invoices or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="all">All Periods</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            My Invoices ({filteredInvoices.length})
          </h2>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterStatus !== 'all' || filterPeriod !== 'all'
                ? "Try adjusting your search or filters"
                : "Upload your first invoice to get started"}
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Upload Invoice
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredInvoices.map((invoice) => (
              <div key={invoice.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Invoice #{invoice.invoice_number}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                        {getStatusIcon(invoice.status)}
                        <span className="ml-1 capitalize">{invoice.status}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <p><strong>Invoice Date:</strong> {new Date(invoice.invoice_date).toLocaleDateString()}</p>
                        {invoice.due_date && <p><strong>Due Date:</strong> {new Date(invoice.due_date).toLocaleDateString()}</p>}
                      </div>
                      <div>
                        <p><strong>Amount:</strong> <span className="font-semibold text-gray-900">€{invoice.amount.toLocaleString()}</span></p>
                        <p><strong>Submitted:</strong> {new Date(invoice.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        {invoice.reviewed_at && (
                          <p><strong>Reviewed:</strong> {new Date(invoice.reviewed_at).toLocaleDateString()}</p>
                        )}
                        {invoice.reviewed_by_name && (
                          <p><strong>By:</strong> {invoice.reviewed_by_name}</p>
                        )}
                      </div>
                    </div>

                    {invoice.description && (
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Description:</strong> {invoice.description}
                      </p>
                    )}

                    {invoice.notes && (
                      <p className="text-sm text-blue-600 mb-2">
                        <strong>Notes:</strong> {invoice.notes}
                      </p>
                    )}

                    {invoice.rejection_reason && (
                      <p className="text-sm text-red-600 mb-2">
                        <strong>Rejection Reason:</strong> {invoice.rejection_reason}
                      </p>
                    )}

                    {invoice.paid_date && (
                      <p className="text-sm text-green-600 mt-2">
                        <strong>Paid on:</strong> {new Date(invoice.paid_date).toLocaleDateString()}
                        {invoice.payment_reference && ` (Ref: ${invoice.payment_reference})`}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <a
                      href={invoice.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-600 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                      title="View Invoice"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </a>
                    {invoice.status === 'pending' && (
                      <button
                        onClick={() => handleDelete(invoice.id)}
                        className="p-2 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50"
                        title="Delete"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <UploadInvoiceModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={loadInvoices}
      />
    </div>
  );
};

export default TherapistInvoices;
