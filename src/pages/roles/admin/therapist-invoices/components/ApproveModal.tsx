import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { TherapistInvoice, therapistInvoiceApi } from '@/services/therapistInvoiceApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/utils/dateFormatters';

interface ApproveModalProps {
  invoice: TherapistInvoice;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ApproveModal: React.FC<ApproveModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);
      await therapistInvoiceApi.approveInvoice(invoice.id, notes || undefined);
      onSuccess();
    } catch (err: any) {
      console.error('Failed to approve invoice:', err);
      setError(err.response?.data?.message || 'Failed to approve invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setNotes('');
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg w-full bg-white rounded-xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Dialog.Title className="text-xl font-bold text-gray-900 flex items-center">
              <CheckCircleIcon className="w-6 h-6 mr-2 text-green-600" />
              Approve Invoice
            </Dialog.Title>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Confirmation Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                You are about to approve invoice <span className="font-semibold">{invoice.invoice_number}</span> for{' '}
                <span className="font-semibold">{formatCurrency(invoice.amount)}</span> submitted by{' '}
                <span className="font-semibold">{invoice.therapist_name}</span>.
              </p>
              <p className="text-sm text-green-700 mt-2">
                Once approved, the therapist will be notified and the invoice will be queued for payment processing.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Notes (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Add any internal notes about this approval..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                {notes.length}/500 characters
              </p>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner />
                  <span>Approving...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  <span>Approve Invoice</span>
                </>
              )}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default ApproveModal;
