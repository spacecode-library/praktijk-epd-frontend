import React, { useState, useRef } from 'react';
import { Dialog } from '@headlessui/react';
import {
  XMarkIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { therapistInvoiceApi } from '@/services/therapistInvoiceApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface UploadInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  invoice_number: string;
  amount: string;
  invoice_date: string;
  due_date: string;
  description: string;
  notes: string;
}

interface FormErrors {
  invoice_number?: string;
  amount?: string;
  invoice_date?: string;
  due_date?: string;
  invoice_file?: string;
}

const UploadInvoiceModal: React.FC<UploadInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    invoice_number: '',
    amount: '',
    invoice_date: '',
    due_date: '',
    description: '',
    notes: ''
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          invoice_file: 'Only PDF and image files (JPG, PNG) are allowed'
        }));
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          invoice_file: 'File size must be less than 10MB'
        }));
        return;
      }

      setSelectedFile(file);
      setErrors(prev => ({ ...prev, invoice_file: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.invoice_number.trim()) {
      newErrors.invoice_number = 'Invoice number is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.invoice_date) {
      newErrors.invoice_date = 'Invoice date is required';
    }

    if (formData.due_date && formData.invoice_date) {
      if (new Date(formData.due_date) < new Date(formData.invoice_date)) {
        newErrors.due_date = 'Due date cannot be before invoice date';
      }
    }

    if (!selectedFile) {
      newErrors.invoice_file = 'Invoice file is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      await therapistInvoiceApi.uploadInvoice({
        invoice_number: formData.invoice_number.trim(),
        amount: parseFloat(formData.amount),
        invoice_date: formData.invoice_date,
        due_date: formData.due_date || undefined,
        description: formData.description.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        invoice_file: selectedFile!
      });

      setUploadSuccess(true);

      // Wait a moment to show success message, then close and refresh
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);
    } catch (error: any) {
      console.error('Upload failed:', error);
      setUploadError(
        error.response?.data?.message ||
        'Failed to upload invoice. Please try again.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setFormData({
        invoice_number: '',
        amount: '',
        invoice_date: '',
        due_date: '',
        description: '',
        notes: ''
      });
      setSelectedFile(null);
      setErrors({});
      setUploadSuccess(false);
      setUploadError(null);
      onClose();
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Dialog.Title className="text-xl font-bold text-gray-900">
              Upload Invoice
            </Dialog.Title>
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Success State */}
          {uploadSuccess ? (
            <div className="p-8 text-center">
              <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Invoice Uploaded Successfully!
              </h3>
              <p className="text-gray-600">
                Your invoice has been submitted for review.
              </p>
            </div>
          ) : (
            <>
              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Error Alert */}
                {uploadError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                    <ExclamationCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-red-900">Upload Failed</h4>
                      <p className="text-sm text-red-700 mt-1">{uploadError}</p>
                    </div>
                  </div>
                )}

                {/* Invoice Number & Amount */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Invoice Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="invoice_number"
                      value={formData.invoice_number}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                        errors.invoice_number ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="INV-2024-001"
                      disabled={isUploading}
                    />
                    {errors.invoice_number && (
                      <p className="text-sm text-red-600 mt-1">{errors.invoice_number}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (€) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0.01"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                        errors.amount ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="1250.00"
                      disabled={isUploading}
                    />
                    {errors.amount && (
                      <p className="text-sm text-red-600 mt-1">{errors.amount}</p>
                    )}
                  </div>
                </div>

                {/* Invoice Date & Due Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Invoice Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="invoice_date"
                      value={formData.invoice_date}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                        errors.invoice_date ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={isUploading}
                    />
                    {errors.invoice_date && (
                      <p className="text-sm text-red-600 mt-1">{errors.invoice_date}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      name="due_date"
                      value={formData.due_date}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                        errors.due_date ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={isUploading}
                    />
                    {errors.due_date && (
                      <p className="text-sm text-red-600 mt-1">{errors.due_date}</p>
                    )}
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice File <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <button
                      type="button"
                      onClick={handleFileButtonClick}
                      disabled={isUploading}
                      className={`w-full px-4 py-6 border-2 border-dashed rounded-lg transition-colors flex flex-col items-center space-y-2 ${
                        errors.invoice_file
                          ? 'border-red-300 bg-red-50'
                          : selectedFile
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-300 hover:border-red-400 hover:bg-gray-50'
                      } ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {selectedFile ? (
                        <>
                          <DocumentTextIcon className="w-12 h-12 text-green-600" />
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <p className="text-xs text-gray-500">Click to change file</p>
                        </>
                      ) : (
                        <>
                          <DocumentArrowUpIcon className="w-12 h-12 text-gray-400" />
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-700">
                              Click to upload invoice file
                            </p>
                            <p className="text-xs text-gray-500">
                              PDF, JPG, or PNG (max 10MB)
                            </p>
                          </div>
                        </>
                      )}
                    </button>
                    {errors.invoice_file && (
                      <p className="text-sm text-red-600">{errors.invoice_file}</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    maxLength={1000}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Brief description of services provided..."
                    disabled={isUploading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.description.length}/1000 characters
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={2}
                    maxLength={2000}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Any additional notes for the admin..."
                    disabled={isUploading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.notes.length}/2000 characters
                  </p>
                </div>
              </form>

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isUploading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isUploading}
                  className="px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isUploading ? (
                    <>
                      <LoadingSpinner />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <DocumentArrowUpIcon className="w-5 h-5" />
                      <span>Upload Invoice</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default UploadInvoiceModal;
