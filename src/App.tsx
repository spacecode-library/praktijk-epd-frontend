import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { NotificationProvider, useNotifications } from '@/components/ui/NotificationProvider';
import { PremiumNotifications } from '@/utils/premiumNotifications';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { useAuth } from '@/store/authStore';
import { UserRole, AuthenticationState } from '@/types/auth';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Layout Components (keep eager loaded)
import AuthLayout from '@/components/layout/AuthLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SimpleProtectedRoute from '@/components/auth/SimpleProtectedRoute';
import RoleRedirect from '@/components/auth/RoleRedirect';
import NetworkErrorHandler from '@/components/NetworkErrorHandler';

// Lazy load all page components
const LoginPage = React.lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('@/pages/auth/ResetPasswordPage'));
const VerifyEmailPage = React.lazy(() => import('@/pages/auth/VerifyEmailPage'));
const TwoFactorPage = React.lazy(() => import('@/pages/auth/TwoFactorPage'));
const EmailVerificationPendingPage = React.lazy(() => import('@/pages/auth/EmailVerificationPendingPage'));

// Dashboard Components
const AdminDashboard = React.lazy(() => import('@/pages/roles/admin/Dashboard'));
const ProfessionalTherapistDashboard = React.lazy(() => import('@/pages/roles/therapist/ProfessionalTherapistDashboard'));
const ClientDashboard = React.lazy(() => import('@/pages/roles/client/Dashboard'));

// Admin Components
const AgendaPage = React.lazy(() => import('@/pages/roles/admin/agenda/AgendaPage'));
const AllClients = React.lazy(() => import('@/pages/roles/admin/client-management/AllClients'));
const ClientManagement = React.lazy(() => import('@/pages/roles/admin/client-management/ClientManagement'));
const FinancialDashboard = React.lazy(() => import('@/pages/roles/admin/financial-management/FinancialDashboard'));
const WaitingListManagement = React.lazy(() => import('@/pages/roles/admin/waiting-list/WaitingListManagement'));
const WaitingListGrouped = React.lazy(() => import('@/pages/roles/admin/waiting-list/WaitingListGrouped'));
const FinancialOverview = React.lazy(() => import('@/pages/roles/admin/financial/FinancialOverview'));
const AdminReports = React.lazy(() => import('@/pages/roles/admin/reports/AdminReports'));
const TherapistStatistics = React.lazy(() => import('@/pages/roles/admin/reports/TherapistStatistics'));
const AdminSettings = React.lazy(() => import('@/pages/roles/admin/settings/AdminSettings'));
const ResourcesManagement = React.lazy(() => import('@/pages/roles/admin/resources/ResourcesManagement'));
const ChallengesManagement = React.lazy(() => import('@/pages/roles/admin/challenges/ChallengesManagement'));
const SurveysManagement = React.lazy(() => import('@/pages/roles/admin/surveys/SurveysManagement'));
const TherapiesManagement = React.lazy(() => import('@/pages/roles/admin/therapies/TherapiesManagement'));
const PsychologicalProblemsManagement = React.lazy(() => import('@/pages/roles/admin/psychological-problems/PsychologicalProblemsManagement'));
const AddressChangeManagement = React.lazy(() => import('@/pages/roles/admin/AddressChangeManagement'));
const UserManagement = React.lazy(() => import('@/pages/roles/admin/user-management/UserManagement'));
const AdminAppointmentsManagement = React.lazy(() => import('@/pages/roles/admin/appointments/AppointmentsManagement'));
const AppointmentRequests = React.lazy(() => import('@/pages/roles/admin/appointments/AppointmentRequests'));
const TherapistManagement = React.lazy(() => import('@/pages/roles/admin/therapist-management'));
const NotificationCenter = React.lazy(() => import('@/pages/roles/admin/notifications/NotificationCenter'));

// Therapist Components
const TherapistCalendar = React.lazy(() => import('@/pages/roles/therapist/calendar/TherapistCalendar'));
const TherapistMessages = React.lazy(() => import('@/pages/roles/therapist/messages/TherapistMessages'));
const ProfessionalTherapistClients = React.lazy(() => import('@/pages/roles/therapist/clients/ProfessionalTherapistClients'));
const ClientPsychologicalBehavior = React.lazy(() => import('@/pages/roles/therapist/clients/ClientPsychologicalBehavior'));
const ProfessionalTherapistAppointments = React.lazy(() => import('@/pages/roles/therapist/appointments/ProfessionalTherapistAppointments'));
const AppointmentDetail = React.lazy(() => import('@/pages/roles/therapist/appointments/AppointmentDetail'));
const CreateAppointment = React.lazy(() => import('@/pages/roles/therapist/appointments/CreateAppointment'));
const RescheduleAppointment = React.lazy(() => import('@/pages/roles/therapist/appointments/RescheduleAppointment'));
const ProfessionalTherapistProfile = React.lazy(() => import('@/pages/roles/therapist/profile/ProfessionalTherapistProfile'));
const AvailabilityManagement = React.lazy(() => import('@/pages/roles/therapist/AvailabilityManagement'));
const TherapistSettings = React.lazy(() => import('@/pages/roles/therapist/settings/TherapistSettings'));
const ProfessionalSessionNotes = React.lazy(() => import('@/pages/roles/therapist/notes/ProfessionalSessionNotes'));
const SessionNoteForm = React.lazy(() => import('@/pages/roles/therapist/notes/SessionNoteForm'));
const SessionNoteView = React.lazy(() => import('@/pages/roles/therapist/notes/SessionNoteView'));
const SessionManagement = React.lazy(() => import('@/pages/roles/therapist/sessions/SessionManagement'));
const ProfessionalTherapistSurveys = React.lazy(() => import('@/pages/roles/therapist/surveys/ProfessionalTherapistSurveys'));
const CreateSurvey = React.lazy(() => import('@/pages/roles/therapist/surveys/CreateSurvey'));
const SurveyDetail = React.lazy(() => import('@/pages/roles/therapist/surveys/SurveyDetail'));
const EditSurvey = React.lazy(() => import('@/pages/roles/therapist/surveys/EditSurvey'));
const AssignSurvey = React.lazy(() => import('@/pages/roles/therapist/surveys/AssignSurvey'));
const SurveyResponses = React.lazy(() => import('@/pages/roles/therapist/surveys/SurveyResponses'));
const ProfessionalTherapistChallenges = React.lazy(() => import('@/pages/roles/therapist/challenges/ProfessionalTherapistChallenges'));
const CreateChallenge = React.lazy(() => import('@/pages/roles/therapist/challenges/CreateChallenge'));
const ChallengeDetail = React.lazy(() => import('@/pages/roles/therapist/challenges/ChallengeDetail'));
const EditChallenge = React.lazy(() => import('@/pages/roles/therapist/challenges/EditChallenge'));
const AssignChallenge = React.lazy(() => import('@/pages/roles/therapist/challenges/AssignChallenge'));
const ResourcesManagementInline = React.lazy(() => import('@/pages/roles/therapist/resources/ResourcesManagementInline'));
const TherapistClientProfile = React.lazy(() => import('@/pages/roles/therapist/clients/TherapistClientProfile'));
const TherapistWaitingList = React.lazy(() => import('@/pages/roles/therapist/waiting-list/TherapistWaitingList'));
const TherapistContracts = React.lazy(() => import('@/pages/roles/therapist/contracts/TherapistContracts'));
const TherapistContractDetail = React.lazy(() => import('@/pages/roles/therapist/contracts/TherapistContractDetail'));

// Client Components
const ClientAppointments = React.lazy(() => import('@/pages/roles/client/appointments/ClientAppointments'));
const BookAppointment = React.lazy(() => import('@/pages/roles/client/appointments/BookAppointment'));
const ClientMessages = React.lazy(() => import('@/pages/roles/client/messages/ClientMessages'));
const ClientProfile = React.lazy(() => import('@/pages/roles/client/profile/ClientProfile'));
const ClientDocuments = React.lazy(() => import('@/pages/roles/client/documents/ClientDocuments'));
const ClientInvoices = React.lazy(() => import('@/pages/roles/client/invoices/ClientInvoices'));
const PaymentCenter = React.lazy(() => import('@/pages/roles/client/PaymentCenter'));
const PaymentMethods = React.lazy(() => import('@/pages/roles/client/PaymentMethods'));
const SessionHistory = React.lazy(() => import('@/pages/roles/client/SessionHistory'));
const ClientResourcesImproved = React.lazy(() => import('@/pages/roles/client/resources/ClientResourcesImproved'));
const ClientResources = React.lazy(() => import('@/pages/roles/client/resources/ClientResources'));
const IntakeForm = React.lazy(() => import('@/pages/roles/client/IntakeForm'));
const ClientChallenges = React.lazy(() => import('@/pages/roles/client/challenges/ClientChallenges'));
const ClientSurveys = React.lazy(() => import('@/pages/roles/client/surveys/ClientSurveys'));
const ClientTherapist = React.lazy(() => import('@/pages/roles/client/therapist/ClientTherapist'));
const AllTherapistsClient = React.lazy(() => import('@/pages/roles/client/therapists/AllTherapists'));
const AddressChangeRequest = React.lazy(() => import('@/pages/roles/client/AddressChangeRequest'));
const ClientSettings = React.lazy(() => import('@/pages/roles/client/settings/ClientSettings'));

// Assistant Components
const AssistantMessages = React.lazy(() => import('@/pages/roles/assistant/messages/AssistantMessages'));

// Bookkeeper Components
const BookkeeperDashboard = React.lazy(() => import('@/pages/roles/bookkeeper/Dashboard'));
const BookkeeperFinancialDashboard = React.lazy(() => import('@/pages/roles/bookkeeper/financial/FinancialDashboard'));
const InvoiceManagement = React.lazy(() => import('@/pages/roles/bookkeeper/invoices/InvoiceManagement'));
const Reports = React.lazy(() => import('@/pages/roles/bookkeeper/reports/Reports'));
const BookkeeperMessages = React.lazy(() => import('@/pages/roles/bookkeeper/messages/BookkeeperMessages'));
const BookkeeperSettings = React.lazy(() => import('@/pages/roles/bookkeeper/settings/BookkeeperSettings'));

// Onboarding
const OnboardingPage = React.lazy(() => import('@/pages/Onboarding'));

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Component to initialize notification system
const NotificationInitializer: React.FC = () => {
  const { addNotification, removeNotification, clearAll } = useNotifications();
  
  useEffect(() => {
    // Initialize PremiumNotifications with the notification methods
    PremiumNotifications.init({
      addNotification,
      removeNotification,
      clearAll
    });
  }, [addNotification, removeNotification, clearAll]);
  
  return null;
};

// Component that renders routes and uses auth monitor
const AppRoutes: React.FC = () => {
  const { 
    isAuthenticated, 
    authenticationState, 
    refreshAuth, 
    user, 
    requiresTwoFactor, 
    twoFactorSetupRequired 
  } = useAuth();
  
  // Removed useAuthMonitor - it was causing infinite loops
  
  return (
    <div className="App">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <LoadingSpinner size="large" />
        </div>
      }>
        <Routes>
        {/* Auth routes - Only render when on auth paths */}
        <Route 
          path="/auth/*" 
          element={
            <AuthLayout>
              <Routes>
                <Route 
                  path="login" 
                  element={
                    authenticationState === AuthenticationState.AUTHENTICATED_COMPLETE ? (
                      <RoleRedirect />
                    ) : (
                      <LoginPage />
                    )
                  } 
                />
                <Route 
                  path="register" 
                  element={
                    authenticationState === AuthenticationState.AUTHENTICATED_COMPLETE ? (
                      <RoleRedirect />
                    ) : (
                      <RegisterPage />
                    )
                  } 
                />
                <Route path="forgot-password" element={<ForgotPasswordPage />} />
                <Route path="reset-password/:token" element={<ResetPasswordPage />} />
                <Route path="verify-email/:token" element={<VerifyEmailPage />} />
                <Route 
                  path="email-verification-pending" 
                  element={<EmailVerificationPendingPage />} 
                />
                <Route 
                  path="2fa" 
                  element={
                    requiresTwoFactor || twoFactorSetupRequired ? (
                      <TwoFactorPage />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  } 
                />
                <Route path="*" element={<Navigate to="/auth/login" replace />} />
              </Routes>
            </AuthLayout>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin/*"
          element={
            <SimpleProtectedRoute roles={[UserRole.ADMIN]}>
              <DashboardLayout>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="agenda" element={<AgendaPage />} />
                  <Route path="clients" element={<AllClients />} />
                  <Route path="clients/:clientId" element={<ClientManagement />} />
                  <Route path="therapists/*" element={<TherapistManagement />} />
                  <Route path="waiting-list" element={<WaitingListManagement />} />
                  <Route path="waiting-list/grouped" element={<WaitingListGrouped />} />
                  <Route path="financial" element={<FinancialOverview />} />
                  <Route path="financial-dashboard" element={<FinancialDashboard />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="reports/therapist-statistics" element={<TherapistStatistics />} />
                  <Route path="notifications" element={<NotificationCenter />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="resources" element={<ResourcesManagement />} />
                  <Route path="challenges" element={<ChallengesManagement />} />
                  <Route path="surveys" element={<SurveysManagement />} />
                  <Route path="therapies" element={<TherapiesManagement />} />
                  <Route path="psychological-problems" element={<PsychologicalProblemsManagement />} />
                  <Route path="address-changes" element={<AddressChangeManagement />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="appointments" element={<AdminAppointmentsManagement />} />
                  <Route path="appointment-requests" element={<AppointmentRequests />} />
                  <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                </Routes>
              </DashboardLayout>
            </SimpleProtectedRoute>
          }
        />

        {/* Therapist routes */}
        <Route
          path="/therapist/*"
          element={
            <SimpleProtectedRoute roles={[UserRole.THERAPIST, UserRole.SUBSTITUTE]}>
              <DashboardLayout>
                <Routes>
                  <Route path="dashboard" element={<ProfessionalTherapistDashboard />} />
                  <Route path="calendar" element={<TherapistCalendar />} />
                  <Route path="messages" element={<TherapistMessages />} />
                  <Route path="waiting-list" element={<TherapistWaitingList />} />
                  <Route path="appointments" element={<ProfessionalTherapistAppointments />} />
                  <Route path="appointments/new" element={<CreateAppointment />} />
                  <Route path="appointments/:id" element={<AppointmentDetail />} />
                  <Route path="appointments/:appointmentId/reschedule" element={<RescheduleAppointment />} />
                  <Route path="clients" element={<ProfessionalTherapistClients />} />
                  <Route path="clients/:clientId/psychological-behaviors" element={<ClientPsychologicalBehavior />} />
                  <Route path="clients/:clientId" element={<TherapistClientProfile />} />
                  {/* <Route path="client/:clientId" element={<ClientOverview />} /> */}
                  {/* <Route path="billing" element={<TherapistBilling />} /> */}
                  <Route path="profile" element={<ProfessionalTherapistProfile />} />
                  <Route path="availability" element={<AvailabilityManagement />} />
                  <Route path="settings" element={<TherapistSettings />} />
                  {/* <Route path="reports" element={<TherapistReports />} /> */}
                  <Route path="notes" element={<ProfessionalSessionNotes />} />
                  <Route path="notes/new" element={<SessionNoteForm />} />
                  <Route path="notes/:noteId" element={<SessionNoteView />} />
                  <Route path="notes/:noteId/edit" element={<SessionNoteForm />} />
                  <Route path="sessions" element={<SessionManagement />} />
                  {/* Survey Routes */}
                  <Route path="surveys" element={<ProfessionalTherapistSurveys />} />
                  <Route path="surveys/new" element={<CreateSurvey />} />
                  <Route path="surveys/:surveyId" element={<SurveyDetail />} />
                  <Route path="surveys/:surveyId/edit" element={<EditSurvey />} />
                  <Route path="surveys/:surveyId/assign" element={<AssignSurvey />} />
                  <Route path="surveys/:surveyId/responses" element={<SurveyResponses />} />
                  {/* Challenge Routes */}
                  <Route path="challenges" element={<ProfessionalTherapistChallenges />} />
                  <Route path="challenges/new" element={<CreateChallenge />} />
                  <Route path="challenges/:challengeId" element={<ChallengeDetail />} />
                  <Route path="challenges/:challengeId/edit" element={<EditChallenge />} />
                  <Route path="challenges/:challengeId/assign" element={<AssignChallenge />} />
                  {/* Resources Route */}
                  <Route path="resources" element={<ResourcesManagementInline />} />
                  {/* Contract Routes */}
                  <Route path="contracts" element={<TherapistContracts />} />
                  <Route path="contracts/:id" element={<TherapistContractDetail />} />
                  <Route path="*" element={<Navigate to="/therapist/dashboard" replace />} />
                </Routes>
              </DashboardLayout>
            </SimpleProtectedRoute>
          }
        />

        {/* Client routes */}
        <Route
          path="/client/*"
          element={
            <SimpleProtectedRoute roles={[UserRole.CLIENT]}>
              <DashboardLayout>
                <Routes>
                  <Route path="dashboard" element={<ClientDashboard />} />
                  <Route path="appointments" element={<ClientAppointments />} />
                  <Route path="appointments/new" element={<BookAppointment />} />
                  <Route path="messages" element={<ClientMessages />} />
                  <Route path="profile" element={<ClientProfile />} />
                  <Route path="documents" element={<ClientDocuments />} />
                  {/* <Route path="billing" element={<ClientBilling />} /> */}
                  <Route path="invoices" element={<ClientInvoices />} />
                  {/* <Route path="billing-history" element={<ClientBillingHistory />} /> */}
                  <Route path="payment-center" element={<PaymentCenter />} />
                  <Route path="payment-methods" element={<PaymentMethods />} />
                  <Route path="session-history" element={<SessionHistory />} />
                  {/* <Route path="therapy-journey" element={<TherapyJourney />} /> */}
                  <Route path="resources" element={<ClientResourcesImproved />} />
                  <Route path="resources-old" element={<ClientResources />} />
                  <Route path="intake" element={<IntakeForm />} />
                  <Route path="challenges" element={<ClientChallenges />} />
                  <Route path="surveys" element={<ClientSurveys />} />
                  <Route path="therapist" element={<ClientTherapist />} />
                  <Route path="therapists" element={<AllTherapistsClient />} />
                  {/* <Route path="progress" element={<ClientProgress />} /> */}
                  <Route path="address-change" element={<AddressChangeRequest />} />
                  {/* <Route path="questionnaires" element={<ClientQuestionnaires />} /> */}
                  {/* <Route path="notes" element={<ClientNotes />} /> */}
                  <Route path="settings" element={<ClientSettings />} />
                  <Route path="*" element={<Navigate to="/client/dashboard" replace />} />
                </Routes>
              </DashboardLayout>
            </SimpleProtectedRoute>
          }
        />

        {/* Assistant routes */}
        <Route
          path="/assistant/*"
          element={
            <SimpleProtectedRoute roles={[UserRole.ASSISTANT]}>
              <DashboardLayout>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="agenda" element={<AgendaPage />} />
                  <Route path="messages" element={<AssistantMessages />} />
                  <Route path="*" element={<Navigate to="/assistant/dashboard" replace />} />
                </Routes>
              </DashboardLayout>
            </SimpleProtectedRoute>
          }
        />

        {/* Bookkeeper routes */}
        <Route
          path="/bookkeeper/*"
          element={
            <SimpleProtectedRoute roles={[UserRole.BOOKKEEPER]}>
              <DashboardLayout>
                <Routes>
                  <Route path="dashboard" element={<BookkeeperDashboard />} />
                  <Route path="agenda" element={<BookkeeperFinancialDashboard />} />
                  <Route path="financial" element={<BookkeeperFinancialDashboard />} />
                  <Route path="invoices" element={<InvoiceManagement />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="messages" element={<BookkeeperMessages />} />
                  <Route path="settings" element={<BookkeeperSettings />} />
                  <Route path="*" element={<Navigate to="/bookkeeper/dashboard" replace />} />
                </Routes>
              </DashboardLayout>
            </SimpleProtectedRoute>
          }
        />

        {/* Onboarding route */}
        <Route
          path="/onboarding"
          element={
            <SimpleProtectedRoute>
              <OnboardingPage />
            </SimpleProtectedRoute>
          }
        />

        {/* Root route - redirect based on auth status */}
        <Route
          path="/"
          element={
            authenticationState === AuthenticationState.AUTHENTICATED_COMPLETE ? (
              <RoleRedirect />
            ) : (
              <Navigate to="/auth/login" replace />
            )
          }
        />

        {/* Catch all route */}
        <Route
          path="*"
          element={
            authenticationState === AuthenticationState.AUTHENTICATED_COMPLETE ? (
              <RoleRedirect />
            ) : (
              <Navigate to="/auth/login" replace />
            )
          }
        />
      </Routes>
      </Suspense>
    </div>
  );
};

const App: React.FC = () => {
  const { 
    isAuthenticated, 
    authenticationState, 
    refreshAuth, 
    user, 
    requiresTwoFactor, 
    twoFactorSetupRequired 
  } = useAuth();

  // Initialize authentication on app load
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const persistedUser = localStorage.getItem('user');
      
      // If we have a token and either no user or the auth state suggests we should refresh
      if (token && (!user || authenticationState === AuthenticationState.IDLE)) {
        try {
          await refreshAuth();
        } catch (error) {
          console.error('Auth initialization failed:', error);
        }
      }
    };

    // Add a small delay to prevent immediate API calls that might fail
    const timer = setTimeout(() => {
      initAuth();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []); // Remove dependencies to prevent infinite loops

  // Add a loading timeout
  const [loadingTimeout, setLoadingTimeout] = React.useState(false);
  
  React.useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (authenticationState === AuthenticationState.AUTHENTICATING) {
      // Set a 3-second timeout for authentication
      timeout = setTimeout(() => {
        setLoadingTimeout(true);
      }, 3000);
    } else {
      setLoadingTimeout(false);
    }
    
    return () => clearTimeout(timeout);
  }, [authenticationState]);

  // Show loading screen while initializing
  if (authenticationState === AuthenticationState.AUTHENTICATING && !loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <NetworkErrorHandler>
            <LanguageProvider>
              <NotificationInitializer />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#fff',
                    color: '#363636',
                  },
                }}
              />
              <Router>
                <AppRoutes />
              </Router>
            </LanguageProvider>
          </NetworkErrorHandler>
        </NotificationProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;