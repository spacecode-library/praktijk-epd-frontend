import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProfessionalDashboardLayout from '@/components/layout/ProfessionalDashboardLayout';

// Dashboard Components
import ProfessionalAdminDashboard from './ProfessionalAdminDashboard';
import AdminDashboard from './AdminDashboard';
import EnhancedDashboard from './EnhancedDashboard';

// Client Management
import AllClients from './client-management/AllClients';
import EnhancedClientList from './client-management/EnhancedClientList';
import ClientManagement from './client-management'; // New modular client management

// User Management
import UserManagement from './user-management/UserManagement';

// Therapist Management
import TherapistManagement from './therapist-management'; // New modular therapist management

// Appointments Management
import AppointmentsManagement from './appointments/AppointmentsManagement';
import AppointmentRequests from './appointments/AppointmentRequests';
import AppointmentAssignments from './appointments/AppointmentAssignments';

// Session Management
import SessionProgress from './sessions/SessionProgress';

// Financial Management
import FinancialOverview from './financial/FinancialOverview';
import FinancialDashboard from './financial-management/FinancialDashboard';

// Inline Management Components (No Modals)
import AddressChangeManagementInline from './address-change/AddressChangeManagementInline';
import ChallengesManagementInline from './challenges/ChallengesManagementInline';
import ResourcesManagementInline from './resources/ResourcesManagementInline';
import SurveysManagementInline from './surveys/SurveysManagementInline';

// Contract Renewal Management
import ContractRenewals from './contract-renewals';

// Therapist Invoices
import AdminTherapistInvoices from './therapist-invoices/AdminTherapistInvoices';

// Notifications
import NotificationCenter from './notifications/NotificationCenter';

// Other Components
import AdminSettings from './settings/AdminSettings';
import AdminReports from './reports/AdminReports';
import AgendaPage from './agenda/AgendaPage';
import CompanySettings from './company-settings/CompanySettings';

// Navigation items for admin sidebar
const adminNavigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: 'HomeIcon',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100'
  },
  {
    name: 'User Management',
    href: '/admin/users',
    icon: 'UserGroupIcon',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    name: 'Client Management',
    href: '/admin/clients',
    icon: 'UserGroupIcon',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    name: 'Therapist Management',
    href: '/admin/therapists',
    icon: 'UsersIcon',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  {
    name: 'Appointments',
    href: '/admin/appointments',
    icon: 'CalendarDaysIcon',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100'
  },
  {
    name: 'Appointment Requests',
    href: '/admin/appointment-requests',
    icon: 'ClockIcon',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    badge: 'New'
  },
  {
    name: 'Assign Therapists',
    href: '/admin/appointment-assignments',
    icon: 'UserGroupIcon',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    badge: 'Smart'
  },
  {
    name: 'Session Progress',
    href: '/admin/sessions',
    icon: 'ChartBarIcon',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    badge: 'New'
  },
  {
    name: 'Financial Overview',
    href: '/admin/financial',
    icon: 'CurrencyEuroIcon',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  {
    name: 'Therapist Invoices',
    href: '/admin/therapist-invoices',
    icon: 'DocumentTextIcon',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    badge: 'New'
  },
  {
    name: 'Contract Renewals',
    href: '/admin/contract-renewals',
    icon: 'DocumentTextIcon',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    badge: 'New'
  },
  {
    name: 'Agenda',
    href: '/admin/agenda',
    icon: 'CalendarIcon',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  {
    name: 'Address Changes',
    href: '/admin/address-changes',
    icon: 'HomeIcon',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    badge: 'New'
  },
  {
    name: 'Challenges',
    href: '/admin/challenges',
    icon: 'TrophyIcon',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    badge: 'New'
  },
  {
    name: 'Resources',
    href: '/admin/resources',
    icon: 'BookOpenIcon',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    badge: 'New'
  },
  {
    name: 'Surveys',
    href: '/admin/surveys',
    icon: 'ClipboardDocumentCheckIcon',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
    badge: 'New'
  },
  {
    name: 'Reports',
    href: '/admin/reports',
    icon: 'DocumentChartBarIcon',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  },
  {
    name: 'Notifications',
    href: '/admin/notifications',
    icon: 'BellIcon',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    badge: 'New'
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: 'Cog6ToothIcon',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  }
];

const AdminRouter: React.FC = () => {
  return (
    <ProfessionalDashboardLayout>
      <Routes>
        {/* Dashboard Routes */}
        <Route path="/" element={<ProfessionalAdminDashboard />} />
        <Route path="/dashboard" element={<ProfessionalAdminDashboard />} />
        <Route path="/dashboard-legacy" element={<AdminDashboard />} />
        <Route path="/dashboard-enhanced" element={<EnhancedDashboard />} />
        
        {/* User Management */}
        <Route path="/users" element={<UserManagement />} />
        
        {/* Client Management - Using new modular system */}
        <Route path="/clients/*" element={<ClientManagement />} />
        <Route path="/clients-enhanced" element={<EnhancedClientList />} />
        <Route path="/clients-legacy" element={<AllClients />} />
        
        {/* Therapist Management - Using new modular system only */}
        <Route path="/therapists/*" element={<TherapistManagement />} />
        
        {/* Appointments Management */}
        <Route path="/appointments" element={<AppointmentsManagement />} />
        <Route path="/appointment-requests" element={<AppointmentRequests />} />
        <Route path="/appointment-assignments" element={<AppointmentAssignments />} />
        <Route path="/sessions" element={<SessionProgress />} />
        
        {/* Financial Management */}
        <Route path="/financial" element={<FinancialOverview />} />
        <Route path="/financial/dashboard" element={<FinancialDashboard />} />
        <Route path="/financial/invoices" element={<div>Invoices Page (To be implemented)</div>} />
        <Route path="/financial/invoices/new" element={<div>New Invoice Page (To be implemented)</div>} />

        {/* Therapist Invoice Management */}
        <Route path="/therapist-invoices" element={<AdminTherapistInvoices />} />

        {/* Contract Renewal Management */}
        <Route path="/contract-renewals/*" element={<ContractRenewals />} />

        {/* Inline Management Components (No Modals) */}
        <Route path="/address-changes" element={<AddressChangeManagementInline />} />
        <Route path="/challenges" element={<ChallengesManagementInline />} />
        <Route path="/resources" element={<ResourcesManagementInline />} />
        <Route path="/surveys" element={<SurveysManagementInline />} />
        
        {/* Other Pages */}
        <Route path="/agenda" element={<AgendaPage />} />
        <Route path="/reports" element={<AdminReports />} />
        <Route path="/settings" element={<AdminSettings />} />
        <Route path="/company-settings" element={<CompanySettings />} />
        <Route path="/notifications" element={<NotificationCenter />} />

        {/* Catch all redirect */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </ProfessionalDashboardLayout>
  );
};

export default AdminRouter;