import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ContractProvider } from './components/shared/ContractContext';

// Lazy load components for better performance
const ListView = React.lazy(() => import('./components/ListView/ContractList'));
const DetailView = React.lazy(() => import('./components/DetailView/ContractDetails'));
const CreateView = React.lazy(() => import('./components/Forms/CreateContract'));
const EditView = React.lazy(() => import('./components/Forms/EditContract'));

const ContractRenewals: React.FC = () => {
  return (
    <ContractProvider>
      <React.Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<ListView />} />
          <Route path="/new" element={<CreateView />} />
          <Route path="/:id" element={<DetailView />} />
          <Route path="/:id/edit" element={<EditView />} />
          <Route path="*" element={<Navigate to="/admin/contract-renewals" replace />} />
        </Routes>
      </React.Suspense>
    </ContractProvider>
  );
};

export default ContractRenewals;
