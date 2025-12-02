import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { realApiService } from '@/services/realApi';
import { useAlert } from '@/components/ui/CustomAlert';
import { handleApiError } from '@/utils/apiErrorHandler';

// Contract interface matching backend response
export interface Contract {
  id: string;
  therapist_id: string;
  client_id: string;
  therapist_name: string;
  therapist_email: string;
  client_name: string;
  client_email: string;
  start_date: string;
  end_date: string;
  contract_type: 'standard' | 'temporary' | 'trial';
  sessions_included?: number;
  sessions_used: number;
  status: 'active' | 'expiring_soon' | 'expired' | 'renewed' | 'cancelled';
  auto_renew: boolean;
  renewal_period_days: number;
  contract_value?: number;
  payment_schedule?: 'monthly' | 'quarterly' | 'annually' | 'per_session';
  notes?: string;
  days_until_expiry: number;
  created_at: string;
  updated_at: string;
}

export interface ContractStatistics {
  total_contracts: number;
  active_contracts: number;
  expiring_soon: number;
  expired: number;
  expiring_30_days: number;
  expiring_14_days: number;
  expiring_7_days: number;
  auto_renew_enabled: number;
}

export interface ContractFilters {
  search: string;
  status: string;
  therapist_id: string;
  auto_renew: string;
}

interface ContractContextValue {
  // Data
  contracts: Contract[];
  selectedContract: Contract | null;
  contractDetails: any | null;
  statistics: ContractStatistics | null;
  loading: boolean;
  error: string | null;

  // Filters and Pagination
  filters: ContractFilters;
  setFilters: (filters: Partial<ContractFilters>) => void;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  setPage: (page: number) => void;

  // Selection
  selectedIds: Set<string>;
  selectAll: boolean;
  toggleSelectAll: () => void;
  toggleSelectContract: (id: string) => void;

  // Actions
  loadContracts: () => Promise<void>;
  loadContractDetails: (contractId: string) => Promise<void>;
  loadStatistics: () => Promise<void>;
  createContract: (data: any) => Promise<boolean>;
  updateContract: (contractId: string, data: any) => Promise<boolean>;
  deleteContract: (contractId: string) => Promise<boolean>;
  renewContract: (contractId: string, data: { new_end_date: string; renewal_reason?: string; renewal_notes?: string }) => Promise<boolean>;
}

const ContractContext = createContext<ContractContextValue | undefined>(undefined);

export const useContractContext = () => {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error('useContractContext must be used within ContractProvider');
  }
  return context;
};

export const ContractProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { success, error: errorAlert } = useAlert();

  // Memoize alert functions
  const stableErrorAlert = useCallback(errorAlert, [errorAlert]);
  const stableSuccessAlert = useCallback(success, [success]);

  // State
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [contractDetails, setContractDetails] = useState<any | null>(null);
  const [statistics, setStatistics] = useState<ContractStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters and Pagination
  const [filtersState, setFiltersState] = useState<ContractFilters>({
    search: '',
    status: 'all',
    therapist_id: 'all',
    auto_renew: 'all'
  });

  const filters = useMemo(() => filtersState, [
    filtersState.search,
    filtersState.status,
    filtersState.therapist_id,
    filtersState.auto_renew
  ]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Load contracts
  const loadContracts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page: currentPage,
        limit: pageSize
      };

      if (filters.search) params.search = filters.search;
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.therapist_id !== 'all') params.therapist_id = filters.therapist_id;
      if (filters.auto_renew !== 'all') params.auto_renew = filters.auto_renew === 'true';

      const response = await realApiService.contracts.admin.list(params);

      if (response.success && response.data) {
        setContracts(response.data.contracts || []);
        setTotalItems(response.data.pagination?.totalItems || 0);
      } else {
        throw new Error(response.message || 'Failed to load contracts');
      }
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      stableErrorAlert(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filters, stableErrorAlert]);

  // Load contract details
  const loadContractDetails = useCallback(async (contractId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await realApiService.contracts.admin.get(contractId);

      if (response.success && response.data) {
        setContractDetails(response.data);
        setSelectedContract(response.data.contract);
      } else {
        throw new Error(response.message || 'Failed to load contract details');
      }
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      stableErrorAlert(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [stableErrorAlert]);

  // Load statistics
  const loadStatistics = useCallback(async () => {
    try {
      const response = await realApiService.contracts.admin.getStats();

      if (response.success && response.data) {
        setStatistics(response.data);
      }
    } catch (err: any) {
      console.error('Failed to load statistics:', err);
    }
  }, []);

  // Create contract
  const createContract = useCallback(async (data: any): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await realApiService.contracts.admin.create(data);

      if (response.success) {
        stableSuccessAlert('Contract created successfully');
        await loadContracts();
        await loadStatistics();
        return true;
      } else {
        throw new Error(response.message || 'Failed to create contract');
      }
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      stableErrorAlert(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadContracts, loadStatistics, stableSuccessAlert, stableErrorAlert]);

  // Update contract
  const updateContract = useCallback(async (contractId: string, data: any): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await realApiService.contracts.admin.update(contractId, data);

      if (response.success) {
        stableSuccessAlert('Contract updated successfully');
        await loadContracts();
        await loadStatistics();
        return true;
      } else {
        throw new Error(response.message || 'Failed to update contract');
      }
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      stableErrorAlert(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadContracts, loadStatistics, stableSuccessAlert, stableErrorAlert]);

  // Delete contract
  const deleteContract = useCallback(async (contractId: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await realApiService.contracts.admin.delete(contractId);

      if (response.success) {
        stableSuccessAlert('Contract deleted successfully');
        await loadContracts();
        await loadStatistics();
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete contract');
      }
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      stableErrorAlert(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadContracts, loadStatistics, stableSuccessAlert, stableErrorAlert]);

  // Renew contract
  const renewContract = useCallback(async (
    contractId: string,
    data: { new_end_date: string; renewal_reason?: string; renewal_notes?: string }
  ): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await realApiService.contracts.admin.renew(contractId, data);

      if (response.success) {
        stableSuccessAlert('Contract renewed successfully');
        await loadContracts();
        await loadStatistics();
        return true;
      } else {
        throw new Error(response.message || 'Failed to renew contract');
      }
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      stableErrorAlert(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadContracts, loadStatistics, stableSuccessAlert, stableErrorAlert]);

  // Selection handlers
  const toggleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedIds(new Set());
      setSelectAll(false);
    } else {
      setSelectedIds(new Set(contracts.map(c => c.id)));
      setSelectAll(true);
    }
  }, [selectAll, contracts]);

  const toggleSelectContract = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      setSelectAll(newSet.size === contracts.length && contracts.length > 0);
      return newSet;
    });
  }, [contracts.length]);

  // Update setFilters to reset page
  const setFilters = useCallback((newFilters: Partial<ContractFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Load contracts when filters or page changes
  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  // Load statistics on mount
  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const value: ContractContextValue = {
    contracts,
    selectedContract,
    contractDetails,
    statistics,
    loading,
    error,
    filters,
    setFilters,
    currentPage,
    pageSize,
    totalItems,
    setPage,
    selectedIds,
    selectAll,
    toggleSelectAll,
    toggleSelectContract,
    loadContracts,
    loadContractDetails,
    loadStatistics,
    createContract,
    updateContract,
    deleteContract,
    renewContract
  };

  return (
    <ContractContext.Provider value={value}>
      {children}
    </ContractContext.Provider>
  );
};
