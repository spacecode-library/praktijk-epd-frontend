import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  FunnelIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useAlert } from '@/components/ui/CustomAlert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { PremiumButton } from '@/components/layout/PremiumLayout';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  therapists?: any[];
}

interface ExportField {
  key: string;
  label: string;
  category: 'basic' | 'contact' | 'medical' | 'preferences' | 'system';
}

interface ExportFilters {
  status?: string;
  therapist_id?: string;
  from_date?: string;
  to_date?: string;
  include_inactive?: boolean;
}

const AVAILABLE_FIELDS: ExportField[] = [
  // Basic Information
  { key: 'id', label: 'Client ID', category: 'basic' },
  { key: 'first_name', label: 'First Name', category: 'basic' },
  { key: 'last_name', label: 'Last Name', category: 'basic' },
  { key: 'date_of_birth', label: 'Date of Birth', category: 'basic' },
  { key: 'gender', label: 'Gender', category: 'basic' },
  { key: 'age', label: 'Age', category: 'basic' },

  // Contact Information
  { key: 'email', label: 'Email', category: 'contact' },
  { key: 'phone_number', label: 'Phone Number', category: 'contact' },
  { key: 'street_address', label: 'Street Address', category: 'contact' },
  { key: 'postal_code', label: 'Postal Code', category: 'contact' },
  { key: 'city', label: 'City', category: 'contact' },
  { key: 'country', label: 'Country', category: 'contact' },
  { key: 'emergency_contact_name', label: 'Emergency Contact Name', category: 'contact' },
  { key: 'emergency_contact_phone', label: 'Emergency Contact Phone', category: 'contact' },
  { key: 'emergency_contact_relation', label: 'Emergency Contact Relation', category: 'contact' },

  // Medical Information
  { key: 'insurance_company', label: 'Insurance Company', category: 'medical' },
  { key: 'insurance_number', label: 'Insurance Number', category: 'medical' },
  { key: 'medical_history', label: 'Medical History', category: 'medical' },
  { key: 'current_medications', label: 'Current Medications', category: 'medical' },
  { key: 'allergies', label: 'Allergies', category: 'medical' },

  // Preferences
  { key: 'preferred_therapist_name', label: 'Preferred Therapist', category: 'preferences' },
  { key: 'preferred_gender', label: 'Preferred Gender', category: 'preferences' },
  { key: 'preferred_language', label: 'Preferred Language', category: 'preferences' },
  { key: 'therapy_goals', label: 'Therapy Goals', category: 'preferences' },

  // System Information
  { key: 'status', label: 'Status', category: 'system' },
  { key: 'created_at', label: 'Registration Date', category: 'system' },
  { key: 'last_appointment_date', label: 'Last Appointment Date', category: 'system' },
  { key: 'total_appointments', label: 'Total Appointments', category: 'system' },
  { key: 'is_email_verified', label: 'Email Verified', category: 'system' },
];

const CATEGORY_LABELS = {
  basic: 'Basic Information',
  contact: 'Contact Information',
  medical: 'Medical Information',
  preferences: 'Preferences',
  system: 'System Information'
};

const RECOMMENDED_FIELDS = [
  'first_name',
  'last_name',
  'email',
  'phone_number',
  'date_of_birth',
  'status',
  'insurance_company',
  'insurance_number',
  'preferred_therapist_name',
  'total_appointments',
  'created_at'
];

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  therapists = []
}) => {
  const { success, error, warning } = useAlert();
  const [step, setStep] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>(RECOMMENDED_FIELDS);
  const [filters, setFilters] = useState<ExportFilters>({
    include_inactive: false
  });
  const [previewStats, setPreviewStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (isOpen && step === 3) {
      loadPreviewStats();
    }
  }, [isOpen, step, filters]);

  const loadPreviewStats = async () => {
    setLoadingStats(true);
    try {
      // Mock API call - replace with actual API
      const response = await fetch('/api/export/stats?' + new URLSearchParams(filters as any));
      const data = await response.json();
      setPreviewStats(data.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
      // Mock data for development
      setPreviewStats({
        total_clients: 150,
        active_clients: 120,
        inactive_clients: 30,
        verified_emails: 140,
        with_insurance: 130
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const handleFieldToggle = (fieldKey: string) => {
    setSelectedFields(prev =>
      prev.includes(fieldKey)
        ? prev.filter(f => f !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  const handleCategoryToggle = (category: string) => {
    const categoryFields = AVAILABLE_FIELDS
      .filter(f => f.category === category)
      .map(f => f.key);

    const allSelected = categoryFields.every(f => selectedFields.includes(f));

    if (allSelected) {
      setSelectedFields(prev => prev.filter(f => !categoryFields.includes(f)));
    } else {
      setSelectedFields(prev => [...new Set([...prev, ...categoryFields])]);
    }
  };

  const handleRecommendedFields = () => {
    setSelectedFields(RECOMMENDED_FIELDS);
  };

  const handleSelectAll = () => {
    setSelectedFields(AVAILABLE_FIELDS.map(f => f.key));
  };

  const handleDeselectAll = () => {
    setSelectedFields([]);
  };

  const handleExport = async () => {
    if (selectedFields.length === 0) {
      warning('Please select at least one field to export');
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch('/api/export/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          fields: selectedFields,
          filters
        })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the CSV blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clients-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      success('Client data exported successfully!');
      handleClose();
    } catch (err: any) {
      error(err?.message || 'Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedFields(RECOMMENDED_FIELDS);
    setFilters({ include_inactive: false });
    setPreviewStats(null);
    onClose();
  };

  const handleNext = () => {
    if (step === 1 && selectedFields.length === 0) {
      warning('Please select at least one field');
      return;
    }
    setStep(prev => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  if (!isOpen) return null;

  const groupedFields = AVAILABLE_FIELDS.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = [];
    }
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, ExportField[]>);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleClose} />

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              onClick={handleClose}
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
              <DocumentArrowDownIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Export Client Data
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Step {step} of 3: {step === 1 ? 'Select Fields' : step === 2 ? 'Apply Filters' : 'Preview & Export'}
              </p>
            </div>
          </div>

          {/* Step Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    s <= step ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300 text-gray-500'
                  }`}>
                    {s < step ? <CheckCircleIcon className="w-5 h-5" /> : s}
                  </div>
                  {s < 3 && (
                    <div className={`flex-1 h-1 mx-2 ${s < step ? 'bg-green-600' : 'bg-gray-300'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="mt-6 max-h-[500px] overflow-y-auto">
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium text-gray-900">Select Fields to Export</h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleRecommendedFields}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Recommended
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={handleSelectAll}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={handleDeselectAll}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  {selectedFields.length} field{selectedFields.length !== 1 ? 's' : ''} selected
                </div>

                {Object.entries(groupedFields).map(([category, fields]) => {
                  const allSelected = fields.every(f => selectedFields.includes(f.key));
                  return (
                    <div key={category} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900">
                          {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                        </h5>
                        <button
                          onClick={() => handleCategoryToggle(category)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {allSelected ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {fields.map((field) => (
                          <label key={field.key} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedFields.includes(field.key)}
                              onChange={() => handleFieldToggle(field.key)}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm text-gray-700">{field.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <FunnelIcon className="h-5 w-5 text-gray-400" />
                  <h4 className="text-md font-medium text-gray-900">Apply Filters (Optional)</h4>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={filters.status || ''}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred Therapist
                    </label>
                    <select
                      value={filters.therapist_id || ''}
                      onChange={(e) => setFilters({ ...filters, therapist_id: e.target.value || undefined })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">All Therapists</option>
                      {therapists.map((t: any) => (
                        <option key={t.id} value={t.id}>
                          {t.first_name} {t.last_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={filters.from_date || ''}
                      onChange={(e) => setFilters({ ...filters, from_date: e.target.value || undefined })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={filters.to_date || ''}
                      onChange={(e) => setFilters({ ...filters, to_date: e.target.value || undefined })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                  <input
                    type="checkbox"
                    id="include_inactive"
                    checked={filters.include_inactive || false}
                    onChange={(e) => setFilters({ ...filters, include_inactive: e.target.checked })}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="include_inactive" className="text-sm text-gray-700">
                    Include inactive clients
                  </label>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                  <h4 className="text-md font-medium text-gray-900">Preview & Confirm</h4>
                </div>

                {loadingStats ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : previewStats && (
                  <div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h5 className="font-medium text-blue-900 mb-2">Export Summary</h5>
                      <dl className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <dt className="text-blue-700">Total Clients:</dt>
                          <dd className="font-semibold text-blue-900">{previewStats.total_clients}</dd>
                        </div>
                        <div>
                          <dt className="text-blue-700">Active:</dt>
                          <dd className="font-semibold text-blue-900">{previewStats.active_clients}</dd>
                        </div>
                        <div>
                          <dt className="text-blue-700">Fields Selected:</dt>
                          <dd className="font-semibold text-blue-900">{selectedFields.length}</dd>
                        </div>
                        <div>
                          <dt className="text-blue-700">Format:</dt>
                          <dd className="font-semibold text-blue-900">CSV</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h6 className="text-sm font-medium text-gray-900 mb-2">Selected Fields:</h6>
                      <div className="flex flex-wrap gap-2">
                        {selectedFields.map(key => {
                          const field = AVAILABLE_FIELDS.find(f => f.key === key);
                          return (
                            <span
                              key={key}
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-700"
                            >
                              {field?.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between">
            <div>
              {step > 1 && (
                <button
                  onClick={handleBack}
                  disabled={isExporting}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ChevronLeftIcon className="w-4 h-4 mr-1" />
                  Back
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                disabled={isExporting}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              {step < 3 ? (
                <button
                  onClick={handleNext}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  Next
                  <ChevronRightIcon className="w-4 h-4 ml-1" />
                </button>
              ) : (
                <button
                  onClick={handleExport}
                  disabled={isExporting || selectedFields.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <>
                      <LoadingSpinner />
                      <span className="ml-2">Exporting...</span>
                    </>
                  ) : (
                    <>
                      <DocumentArrowDownIcon className="w-4 h-4 mr-1" />
                      Export CSV
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
