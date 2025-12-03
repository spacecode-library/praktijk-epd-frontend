import React from 'react';
import { Dialog } from '@headlessui/react';
import {
  XMarkIcon,
  DocumentTextIcon,
  UserIcon,
  CurrencyEuroIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BanknotesIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { TherapistInvoice } from '@/services/therapistInvoiceApi';
import { formatDate, formatCurrency } from '@/utils/dateFormatters';

interface InvoiceDetailModalProps {
  invoice: TherapistInvoice;
  isOpen: boolean;
  onClose: () => void;
}

const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  isOpen,
  onClose
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'paid':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="w-5 h-5" />;
      case 'approved':
        return <CheckCircleIcon className="w-5 h-5" />;
      case 'rejected':
        return <XCircleIcon className="w-5 h-5" />;
      case 'paid':
        return <BanknotesIcon className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-3xl w-full bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Dialog.Title className="text-xl font-bold text-gray-900 flex items-center">
              <DocumentTextIcon className="w-6 h-6 mr-2 text-purple-600" />
              Invoice Details
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Status Badge */}
            <div className="flex items-center justify-center">
              <span className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(invoice.status)}`}>
                {getStatusIcon(invoice.status)}
                <span className="capitalize">{invoice.status}</span>
              </span>
            </div>

            {/* Invoice Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Invoice Information</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Invoice Number</p>
                      <p className="text-sm font-medium text-gray-900">{invoice.invoice_number}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CurrencyEuroIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Amount</p>
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(invoice.amount)}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CalendarIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Invoice Date</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(invoice.invoice_date)}</p>
                    </div>
                  </div>
                  {invoice.due_date && (
                    <div className="flex items-start">
                      <ClockIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Due Date</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(invoice.due_date)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Therapist Information</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <UserIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Therapist</p>
                      <p className="text-sm font-medium text-gray-900">{invoice.therapist_name || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CalendarIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Submitted</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(invoice.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {invoice.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                  {invoice.description}
                </p>
              </div>
            )}

            {/* Notes */}
            {invoice.notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                  {invoice.notes}
                </p>
              </div>
            )}

            {/* Review Information */}
            {(invoice.reviewed_by || invoice.rejection_reason) && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Review Information</h3>
                <div className="space-y-3">
                  {invoice.reviewed_by_name && (
                    <div className="flex items-start">
                      <UserIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Reviewed By</p>
                        <p className="text-sm font-medium text-gray-900">{invoice.reviewed_by_name}</p>
                      </div>
                    </div>
                  )}
                  {invoice.reviewed_at && (
                    <div className="flex items-start">
                      <CalendarIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Review Date</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(invoice.reviewed_at)}</p>
                      </div>
                    </div>
                  )}
                  {invoice.rejection_reason && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Rejection Reason</p>
                      <p className="text-sm text-red-700 bg-red-50 rounded-lg p-3">
                        {invoice.rejection_reason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Information */}
            {invoice.status === 'paid' && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Payment Information</h3>
                <div className="space-y-3">
                  {invoice.paid_date && (
                    <div className="flex items-start">
                      <CalendarIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Paid Date</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(invoice.paid_date)}</p>
                      </div>
                    </div>
                  )}
                  {invoice.payment_reference && (
                    <div className="flex items-start">
                      <BanknotesIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Payment Reference</p>
                        <p className="text-sm font-medium text-gray-900">{invoice.payment_reference}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Invoice File */}
            {invoice.file_url && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Invoice File</h3>
                <a
                  href={invoice.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  <span>View/Download Invoice</span>
                </a>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default InvoiceDetailModal;
