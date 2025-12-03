import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  UserGroupIcon,
  CalendarIcon,
  DocumentTextIcon,
  CurrencyEuroIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { useContractContext } from '../shared/ContractContext';
import { PremiumButton, PremiumCard } from '@/components/layout/PremiumLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAlert } from '@/components/ui/CustomAlert';
import realApiService from '@/services/realApi';

interface FormData {
  // Parties (read-only after creation)
  therapist_id: string;
  client_id: string;
  therapist_name?: string;
  client_name?: string;

  // Period
  start_date: string;
  end_date: string;

  // Contract details
  contract_type: string;
  sessions_included: string;

  // Financial
  contract_value: string;
  payment_schedule: string;

  // Renewal settings
  auto_renew: boolean;
  renewal_period_days: string;

  // Status (read-only)
  status?: string;

  // Notes
  notes: string;
}

const EditContract: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateContract, loadContracts } = useContractContext();
  const { success, error } = useAlert();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    therapist_id: '',
    client_id: '',
    start_date: '',
    end_date: '',
    contract_type: 'standard',
    sessions_included: '12',
    contract_value: '',
    payment_schedule: 'monthly',
    auto_renew: false,
    renewal_period_days: '365',
    notes: ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Load contract data
  useEffect(() => {
    const loadContract = async () => {
      if (!id) {
        error('No contract ID provided');
        navigate('/admin/contract-renewals');
        return;
      }

      setLoadingData(true);
      try {
        const response = await realApiService.contracts.admin.get(id);
        if (response.success && response.data) {
          const contract = response.data;
          setFormData({
            therapist_id: contract.therapist_id,
            client_id: contract.client_id,
            therapist_name: contract.therapist_name,
            client_name: contract.client_name,
            start_date: contract.start_date.split('T')[0],
            end_date: contract.end_date.split('T')[0],
            contract_type: contract.contract_type || 'standard',
            sessions_included: contract.sessions_included?.toString() || '12',
            contract_value: contract.contract_value?.toString() || '',
            payment_schedule: contract.payment_schedule || 'monthly',
            auto_renew: contract.auto_renew || false,
            renewal_period_days: contract.renewal_period_days?.toString() || '365',
            status: contract.status,
            notes: contract.notes || ''
          });
        } else {
          error('Failed to load contract');
          navigate('/admin/contract-renewals');
        }
      } catch (err: any) {
        error(err.message || 'Failed to load contract');
        navigate('/admin/contract-renewals');
      } finally {
        setLoadingData(false);
      }
    };

    loadContract();
  }, [id]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    // Required fields
    if (!formData.start_date) newErrors.start_date = 'Start date is required';
    if (!formData.end_date) newErrors.end_date = 'End date is required';

    // Date validation
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);

      if (endDate <= startDate) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    // Numeric validations
    const sessionsIncluded = parseInt(formData.sessions_included);
    if (!formData.sessions_included || isNaN(sessionsIncluded) || sessionsIncluded <= 0) {
      newErrors.sessions_included = 'Sessions included must be a positive number';
    }

    const renewalPeriodDays = parseInt(formData.renewal_period_days);
    if (!formData.renewal_period_days || isNaN(renewalPeriodDays) || renewalPeriodDays <= 0) {
      newErrors.renewal_period_days = 'Renewal period must be a positive number';
    }

    if (formData.contract_value) {
      const contractValue = parseFloat(formData.contract_value);
      if (isNaN(contractValue) || contractValue < 0) {
        newErrors.contract_value = 'Contract value must be a valid number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!validate()) {
      error('Please fix the errors in the form');
      return;
    }

    if (!id) {
      error('No contract ID provided');
      return;
    }

    setLoading(true);

    try {
      // Prepare data for API
      const submitData = {
        start_date: formData.start_date,
        end_date: formData.end_date,
        contract_type: formData.contract_type,
        sessions_included: parseInt(formData.sessions_included),
        auto_renew: formData.auto_renew,
        renewal_period_days: parseInt(formData.renewal_period_days),
        contract_value: formData.contract_value ? parseFloat(formData.contract_value) : undefined,
        payment_schedule: formData.payment_schedule,
        notes: formData.notes || undefined
      };

      const result = await updateContract(id, submitData);

      if (result) {
        success('Contract updated successfully');
        await loadContracts();
        navigate(`/admin/contract-renewals/${id}`);
      }
    } catch (err: any) {
      error(err.message || 'Failed to update contract');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <PremiumButton
            variant="outline"
            icon={ArrowLeftIcon}
            onClick={() => navigate(`/admin/contract-renewals/${id}`)}
          >
            Back to Details
          </PremiumButton>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Contract</h1>
            <p className="text-sm text-gray-500">Update contract details and renewal settings</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Contract Parties (Read-only) */}
        <PremiumCard className="p-6 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <UserGroupIcon className="h-5 w-5 mr-2 text-blue-500" />
            Contract Parties (Read-only)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Therapist
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600">
                {formData.therapist_name || 'N/A'}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Contract parties cannot be changed after creation
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600">
                {formData.client_name || 'N/A'}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Contract parties cannot be changed after creation
              </p>
            </div>
          </div>
        </PremiumCard>

        {/* Contract Period */}
        <PremiumCard className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2 text-green-500" />
            Contract Period
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleChange('start_date', e.target.value)}
                  className={`pl-10 w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    errors.start_date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.start_date && (
                <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                When the contract begins
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleChange('end_date', e.target.value)}
                  className={`pl-10 w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    errors.end_date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.end_date && (
                <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                When the contract expires
              </p>
            </div>
          </div>
        </PremiumCard>

        {/* Contract Type & Sessions */}
        <PremiumCard className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-purple-500" />
            Contract Type & Sessions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contract Type
              </label>
              <select
                value={formData.contract_type}
                onChange={(e) => handleChange('contract_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="standard">Standard Contract</option>
                <option value="temporary">Temporary Contract</option>
                <option value="trial">Trial Period</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Type of contract agreement
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sessions Included <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.sessions_included}
                onChange={(e) => handleChange('sessions_included', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  errors.sessions_included ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., 12"
              />
              {errors.sessions_included && (
                <p className="mt-1 text-sm text-red-600">{errors.sessions_included}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Number of therapy sessions included in this contract
              </p>
            </div>
          </div>
        </PremiumCard>

        {/* Financial Details */}
        <PremiumCard className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CurrencyEuroIcon className="h-5 w-5 mr-2 text-green-500" />
            Financial Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contract Value (EUR)
              </label>
              <div className="relative">
                <CurrencyEuroIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.contract_value}
                  onChange={(e) => handleChange('contract_value', e.target.value)}
                  className={`pl-10 w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    errors.contract_value ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 1200.00"
                />
              </div>
              {errors.contract_value && (
                <p className="mt-1 text-sm text-red-600">{errors.contract_value}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Total contract value (optional)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Schedule
              </label>
              <select
                value={formData.payment_schedule}
                onChange={(e) => handleChange('payment_schedule', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
                <option value="per_session">Per Session</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                How often payments are scheduled
              </p>
            </div>
          </div>
        </PremiumCard>

        {/* Renewal Settings */}
        <PremiumCard className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ArrowPathIcon className="h-5 w-5 mr-2 text-orange-500" />
            Renewal Settings
          </h2>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="auto_renew"
                checked={formData.auto_renew}
                onChange={(e) => handleChange('auto_renew', e.target.checked)}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="auto_renew" className="ml-2 block text-sm text-gray-700">
                Enable automatic renewal notifications
              </label>
            </div>
            <p className="text-xs text-gray-500 ml-6">
              When enabled, the system will send automated renewal reminders at 30, 14, and 7 days before expiry
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Renewal Period (Days) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.renewal_period_days}
                  onChange={(e) => handleChange('renewal_period_days', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    errors.renewal_period_days ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 365"
                />
                {errors.renewal_period_days && (
                  <p className="mt-1 text-sm text-red-600">{errors.renewal_period_days}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Duration for automatic renewal
                </p>
              </div>
            </div>
          </div>
        </PremiumCard>

        {/* Additional Notes */}
        <PremiumCard className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-500" />
            Additional Notes
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Any additional information about this contract..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Internal notes about the contract (visible to admins only)
            </p>
          </div>
        </PremiumCard>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <PremiumButton
            variant="outline"
            onClick={() => navigate(`/admin/contract-renewals/${id}`)}
          >
            Cancel
          </PremiumButton>
          <PremiumButton
            variant="danger"
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <LoadingSpinner size="small" className="mr-2" />
                Updating Contract...
              </>
            ) : (
              'Update Contract'
            )}
          </PremiumButton>
        </div>
      </div>
    </div>
  );
};

export default EditContract;
