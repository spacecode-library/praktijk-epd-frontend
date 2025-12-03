import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { TherapistInvoice, therapistInvoiceApi } from '@/services/therapistInvoiceApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/utils/dateFormatters';

interface RejectModalProps {
  invoice: TherapistInvoice;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const RejectModal: React.FC<RejectModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await therapistInvoiceApi.rejectInvoice(
        invoice.id,
        rejectionReason.trim(),
        notes.trim() || undefined
      );
      onSuccess();
    } catch (err: any) {
      console.error('Failed to reject invoice:', err);
      setError(err.response?.data?.message || 'Failed to reject invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setRejectionReason('');
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
              <XCircleIcon className="w-6 h-6 mr-2 text-red-600" />
              Reject Invoice
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
            {/* Warning Message */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                You are about to reject invoice <span className="font-semibold">{invoice.invoice_number}</span> for{' '}
                <span className="font-semibold">{formatCurrency(invoice.amount)}</span> submitted by{' '}
                <span className="font-semibold">{invoice.therapist_name}</span>.
              </p>
              <p className="text-sm text-red-700 mt-2">
                The therapist will be notified with the rejection reason. Please provide clear feedback.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Rejection Reason (Required) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                maxLength={500}
                required
                placeholder="Explain why this invoice is being rejected (e.g., invalid amount, missing documentation, incorrect billing period)..."
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  error && !rejectionReason ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                {rejectionReason.length}/500 characters - This will be sent to the therapist
              </p>
            </div>

            {/* Internal Notes (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Internal Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Add any internal notes (not visible to therapist)..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
              disabled={isSubmitting || !rejectionReason.trim()}
              className="px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner />
                  <span>Rejecting...</span>
                </>
              ) : (
                <>
                  <XCircleIcon className="w-5 h-5" />
                  <span>Reject Invoice</span>
                </>
              )}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default RejectModal;
