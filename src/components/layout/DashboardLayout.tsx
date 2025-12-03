import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  CalendarIcon,
  UsersIcon,
  ChatBubbleLeftIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  BookOpenIcon,
  PuzzlePieceIcon,
  ClipboardDocumentCheckIcon,
  HeartIcon,
  ClockIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/store/authStore';
import { useTranslation, LanguageSwitcher } from '@/contexts/LanguageContext';
import { UserRole } from '@/types/auth';
import { ROLE_COLORS } from '@/types/auth';
import NotificationBell from '@/components/notifications/NotificationBell';
import { therapistApi } from '@/services/therapistApi';
import ProfilePhotoUpload from '@/components/profile/ProfilePhotoUpload';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  nameKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  current?: boolean;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clientCount, setClientCount] = useState<number | null>(null);
  const [notificationCounts, setNotificationCounts] = useState<{
    clients: number;
    appointments: number;
    messages: number;
    total: number;
  } | null>(null);
  const { user, logout, getDisplayName, getRoleColor } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  // Load client count and notification counts for therapists
  useEffect(() => {
    if (user?.role === UserRole.THERAPIST || user?.role === UserRole.SUBSTITUTE) {
      loadClientCount();
      loadNotificationCounts();

      // Refresh notification counts every 30 seconds
      const interval = setInterval(() => {
        loadNotificationCounts();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const loadClientCount = async () => {
    try {
      const response = await therapistApi.getClients();
      if (response.success && response.data) {
        const clients = response.data || [];
        setClientCount((clients as any[]).length);
      }
    } catch (error) {
      console.error('Error loading client count:', error);
      setClientCount(0);
    }
  };

  const loadNotificationCounts = async () => {
    try {
      const response = await therapistApi.getNotificationCounts();
      if (response.success && response.data) {
        setNotificationCounts(response.data);
      }
    } catch (error) {
      console.error('Error loading notification counts:', error);
    }
  };

  // Navigation items based on user role
  const getNavigationItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      {
        name: 'Dashboard',
        nameKey: 'nav.dashboard',
        href: getDashboardPath(),
        icon: HomeIcon,
        roles: [UserRole.ADMIN, UserRole.THERAPIST, UserRole.CLIENT, UserRole.ASSISTANT, UserRole.BOOKKEEPER, UserRole.SUBSTITUTE],
      },
      {
        name: 'Calendar',
        nameKey: 'nav.calendar',
        href: user?.role === UserRole.THERAPIST || user?.role === UserRole.SUBSTITUTE ? '/therapist/calendar' : user?.role === UserRole.CLIENT ? '/client/appointments?view=calendar' : `${getRoleBasePath()}/agenda`,
        icon: CalendarIcon,
        roles: [UserRole.ADMIN, UserRole.THERAPIST, UserRole.CLIENT, UserRole.ASSISTANT, UserRole.SUBSTITUTE],
      },
    ];

    // Role-specific navigation
    const roleSpecificItems: NavItem[] = [];

    if (user?.role === UserRole.ADMIN) {
      roleSpecificItems.push(
        {
          name: 'Users',
          nameKey: 'nav.users',
          href: '/admin/users',
          icon: UserGroupIcon,
          roles: [UserRole.ADMIN],
        },
        {
          name: 'Appointments',
          nameKey: 'nav.appointments',
          href: '/admin/appointments',
          icon: CalendarIcon,
          roles: [UserRole.ADMIN],
        },
        {
          name: 'Appointment Requests',
          nameKey: 'nav.appointmentRequests',
          href: '/admin/appointment-requests',
          icon: ClipboardDocumentListIcon,
          roles: [UserRole.ADMIN],
        },
        {
          name: 'Clients',
          nameKey: 'nav.clients',
          href: '/admin/clients',
          icon: UsersIcon,
          roles: [UserRole.ADMIN],
        },
        {
          name: 'Therapists',
          nameKey: 'nav.therapists',
          href: '/admin/therapists',
          icon: UserGroupIcon,
          roles: [UserRole.ADMIN],
        },
        {
          name: 'Waiting List',
          nameKey: 'nav.waitingList',
          href: '/admin/waiting-list',
          icon: ClipboardDocumentListIcon,
          roles: [UserRole.ADMIN],
        },
        {
          name: 'Financial',
          nameKey: 'nav.financial',
          href: '/admin/financial',
          icon: CurrencyDollarIcon,
          roles: [UserRole.ADMIN],
        },
        {
          name: 'Reports',
          nameKey: 'nav.reports',
          href: '/admin/reports',
          icon: ChartBarIcon,
          roles: [UserRole.ADMIN],
        },
        {
          name: 'Notifications',
          nameKey: 'nav.notifications',
          href: '/admin/notifications',
          icon: BellIcon,
          roles: [UserRole.ADMIN],
        },
        {
          name: 'Resources',
          nameKey: 'nav.resources',
          href: '/admin/resources',
          icon: BookOpenIcon,
          roles: [UserRole.ADMIN],
        },
        {
          name: 'Challenges',
          nameKey: 'nav.challenges',
          href: '/admin/challenges',
          icon: PuzzlePieceIcon,
          roles: [UserRole.ADMIN],
        },
        {
          name: 'Surveys',
          nameKey: 'nav.surveys',
          href: '/admin/surveys',
          icon: ClipboardDocumentCheckIcon,
          roles: [UserRole.ADMIN],
        },
        {
          name: 'Therapieën',
          nameKey: 'nav.therapies',
          href: '/admin/therapies',
          icon: HeartIcon,
          roles: [UserRole.ADMIN],
        },
        {
          name: 'Hulpvragen',
          nameKey: 'nav.psychologicalProblems',
          href: '/admin/psychological-problems',
          icon: PuzzlePieceIcon,
          roles: [UserRole.ADMIN],
        }
      );
    }

    if (user?.role === UserRole.THERAPIST || user?.role === UserRole.SUBSTITUTE) {
      roleSpecificItems.push(
        {
          name: 'My Clients',
          nameKey: 'nav.myClients',
          href: '/therapist/clients',
          icon: UsersIcon,
          roles: [UserRole.THERAPIST, UserRole.SUBSTITUTE],
        },
        {
          name: 'Appointments',
          nameKey: 'nav.appointments',
          href: '/therapist/appointments',
          icon: CalendarIcon,
          roles: [UserRole.THERAPIST, UserRole.SUBSTITUTE],
        },
        {
          name: 'Sessions',
          nameKey: 'nav.sessions',
          href: '/therapist/sessions',
          icon: ClockIcon,
          roles: [UserRole.THERAPIST, UserRole.SUBSTITUTE],
        },
        {
          name: 'Session Notes',
          nameKey: 'nav.sessionNotes',
          href: '/therapist/notes',
          icon: DocumentTextIcon,
          roles: [UserRole.THERAPIST, UserRole.SUBSTITUTE],
        },
        {
          name: 'Challenges',
          nameKey: 'nav.challenges',
          href: '/therapist/challenges',
          icon: PuzzlePieceIcon,
          roles: [UserRole.THERAPIST, UserRole.SUBSTITUTE],
        },
        {
          name: 'Surveys',
          nameKey: 'nav.surveys',
          href: '/therapist/surveys',
          icon: ClipboardDocumentCheckIcon,
          roles: [UserRole.THERAPIST, UserRole.SUBSTITUTE],
        },
        {
          name: 'Resources',
          nameKey: 'nav.resources',
          href: '/therapist/resources',
          icon: BookOpenIcon,
          roles: [UserRole.THERAPIST, UserRole.SUBSTITUTE],
        }
      );
    }

    if (user?.role === UserRole.CLIENT) {
      roleSpecificItems.push(
        {
          name: 'My Appointments',
          nameKey: 'nav.myAppointments',
          href: '/client/appointments',
          icon: CalendarIcon,
          roles: [UserRole.CLIENT],
        },
        {
          name: 'My Therapist',
          nameKey: 'nav.myTherapist',
          href: '/client/therapist',
          icon: UserCircleIcon,
          roles: [UserRole.CLIENT],
        },
        {
          name: 'Payments',
          nameKey: 'nav.payments',
          href: '/client/payment-center',
          icon: CurrencyDollarIcon,
          roles: [UserRole.CLIENT],
        },
        {
          name: 'Payment Methods',
          nameKey: 'nav.paymentMethods',
          href: '/client/payment-methods',
          icon: ShieldCheckIcon,
          roles: [UserRole.CLIENT],
        },
        {
          name: 'Challenges',
          nameKey: 'nav.challenges',
          href: '/client/challenges',
          icon: PuzzlePieceIcon,
          roles: [UserRole.CLIENT],
        },
        {
          name: 'Resources',
          nameKey: 'nav.resources',
          href: '/client/resources',
          icon: BookOpenIcon,
          roles: [UserRole.CLIENT],
        },
        {
          name: 'Surveys',
          nameKey: 'nav.surveys',
          href: '/client/surveys',
          icon: ClipboardDocumentCheckIcon,
          roles: [UserRole.CLIENT],
        }
      );
    }

    if (user?.role === UserRole.BOOKKEEPER) {
      roleSpecificItems.push(
        {
          name: 'Financial',
          nameKey: 'nav.financial',
          href: '/bookkeeper/financial',
          icon: CurrencyDollarIcon,
          roles: [UserRole.BOOKKEEPER],
        },
        {
          name: 'Invoices',
          nameKey: 'nav.invoices',
          href: '/bookkeeper/invoices',
          icon: ClipboardDocumentListIcon,
          roles: [UserRole.BOOKKEEPER],
        },
        {
          name: 'Reports',
          nameKey: 'nav.reports',
          href: '/bookkeeper/reports',
          icon: ChartBarIcon,
          roles: [UserRole.BOOKKEEPER],
        }
      );
    }

    if (user?.role === UserRole.ASSISTANT) {
      roleSpecificItems.push(
        {
          name: 'Client Support',
          nameKey: 'nav.clientSupport',
          href: '/assistant/client-support',
          icon: UsersIcon,
          roles: [UserRole.ASSISTANT],
        },
        {
          name: 'Scheduling',
          nameKey: 'nav.scheduling',
          href: '/assistant/scheduling',
          icon: CalendarIcon,
          roles: [UserRole.ASSISTANT],
        }
      );
    }

    // Common items for all roles
    const commonItems: NavItem[] = [
      {
        name: 'Messages',
        nameKey: 'nav.messages',
        href: `${getRoleBasePath()}/messages`,
        icon: ChatBubbleLeftIcon,
        roles: [UserRole.ADMIN, UserRole.THERAPIST, UserRole.CLIENT, UserRole.ASSISTANT, UserRole.BOOKKEEPER, UserRole.SUBSTITUTE],
      },
    ];

    // Settings (available to all)
    const settingsItems: NavItem[] = [
      {
        name: 'Settings',
        nameKey: 'nav.settings',
        href: `${getRoleBasePath()}/settings`,
        icon: Cog6ToothIcon,
        roles: [UserRole.ADMIN, UserRole.THERAPIST, UserRole.CLIENT, UserRole.ASSISTANT, UserRole.BOOKKEEPER, UserRole.SUBSTITUTE],
      },
    ];

    return [...baseItems, ...roleSpecificItems, ...commonItems, ...settingsItems].filter(item =>
      item.roles.includes(user?.role || UserRole.CLIENT)
    );
  };

  const getDashboardPath = (): string => {
    if (!user) return '/';
    return `${getRoleBasePath()}/dashboard`;
  };

  const getRoleBasePath = (): string => {
    if (!user) return '';
    switch (user.role) {
      case UserRole.ADMIN:
        return '/admin';
      case UserRole.THERAPIST:
      case UserRole.SUBSTITUTE:
        return '/therapist';
      case UserRole.CLIENT:
        return '/client';
      case UserRole.ASSISTANT:
        return '/assistant';
      case UserRole.BOOKKEEPER:
        return '/bookkeeper';
      default:
        return '/';
    }
  };

  const navigationItems = getNavigationItems().map(item => ({
    ...item,
    current: location.pathname === item.href || location.pathname.startsWith(item.href + '/'),
  }));

  const roleColors = user?.role ? ROLE_COLORS[user.role] : ROLE_COLORS[UserRole.CLIENT];
  
  // Color mapping for different roles
  const getLogoColorClass = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-gradient-to-r from-blue-600 to-blue-700';
      case UserRole.THERAPIST:
        return 'bg-gradient-to-r from-green-600 to-green-700';
      case UserRole.CLIENT:
        return 'bg-gradient-to-r from-purple-600 to-purple-700';
      case UserRole.ASSISTANT:
        return 'bg-gradient-to-r from-indigo-600 to-indigo-700';
      case UserRole.BOOKKEEPER:
        return 'bg-gradient-to-r from-orange-600 to-orange-700';
      default:
        return 'bg-gradient-to-r from-gray-600 to-gray-700';
    }
  };

  const getActiveColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return '#3B82F6';
      case UserRole.THERAPIST:
        return '#10B981';
      case UserRole.CLIENT:
        return '#8B5CF6';
      case UserRole.ASSISTANT:
        return '#6366F1';
      case UserRole.BOOKKEEPER:
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div className={`fixed inset-0 bg-gray-600 transition-opacity ${sidebarOpen ? 'opacity-75' : 'opacity-0'}`} onClick={() => setSidebarOpen(false)} />
        
        <div className={`fixed inset-y-0 left-0 w-64 bg-white shadow-xl transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
              <Link to={getDashboardPath()} className="flex items-center space-x-2">
                <img 
                  src="https://res.cloudinary.com/dizbrnm2l/image/upload/v1755154559/PraktijkEPD-3-logoo_jlagdx.svg"
                  alt="PraktijkEPD Logo"
                  className="w-8 h-8"
                />
                <span className="text-lg font-semibold text-gray-900">PraktijkEPD</span>
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            {/* Scrollable navigation */}
            <div className="flex flex-col flex-1 min-h-0">
              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      item.current
                        ? 'text-white'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    style={item.current ? { backgroundColor: getActiveColor(user?.role || UserRole.CLIENT) } : undefined}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    <span className="flex-1">{t(item.nameKey)}</span>
                    {/* Red dot indicators for therapists */}
                    {(user?.role === UserRole.THERAPIST || user?.role === UserRole.SUBSTITUTE) && notificationCounts && (
                      <>
                        {item.href === '/therapist/clients' && notificationCounts.clients > 0 && (
                          <span className="ml-auto bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-semibold">
                            {notificationCounts.clients > 9 ? '9+' : notificationCounts.clients}
                          </span>
                        )}
                        {item.href === '/therapist/appointments' && notificationCounts.appointments > 0 && (
                          <span className="ml-auto bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-semibold">
                            {notificationCounts.appointments > 9 ? '9+' : notificationCounts.appointments}
                          </span>
                        )}
                        {item.href.includes('/messages') && notificationCounts.messages > 0 && (
                          <span className="ml-auto bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-semibold">
                            {notificationCounts.messages > 9 ? '9+' : notificationCounts.messages}
                          </span>
                        )}
                      </>
                    )}
                    {/* Red dot for no clients assigned */}
                    {(user?.role === UserRole.THERAPIST || user?.role === UserRole.SUBSTITUTE) &&
                     item.href === '/therapist/clients' &&
                     clientCount === 0 &&
                     (!notificationCounts || notificationCounts.clients === 0) && (
                      <span className="ml-2 h-2 w-2 bg-red-600 rounded-full animate-pulse" title="No clients assigned" />
                    )}
                  </Link>
                ))}
              </nav>
              
              {/* Bottom section with user info and logout */}
              <div className="flex-shrink-0 border-t border-gray-200 p-4">
                <div className="flex items-center mb-3">
                  <div className="flex-shrink-0">
                    <ProfilePhotoUpload
                      userId={user?.id}
                      currentPhotoUrl={user?.profile_photo_url}
                      size="xsmall"
                      editable={false}
                    />
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {getDisplayName()}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.role}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                  {t('auth.logout')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-6 border-b border-gray-200">
            <Link to={getDashboardPath()} className="flex items-center space-x-2">
              <img 
                src="https://res.cloudinary.com/dizbrnm2l/image/upload/v1755154559/PraktijkEPD-3-logoo_jlagdx.svg"
                alt="PraktijkEPD Logo"
                className="w-8 h-8"
              />
              <span className="text-lg font-semibold text-gray-900">PraktijkEPD</span>
            </Link>
          </div>
          
          {/* Scrollable navigation */}
          <div className="flex flex-col flex-1 min-h-0">
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    item.current
                      ? 'text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  style={item.current ? { backgroundColor: getActiveColor(user?.role || UserRole.CLIENT) } : undefined}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span className="flex-1">{t(item.nameKey)}</span>
                  {/* Red dot indicators for therapists */}
                  {(user?.role === UserRole.THERAPIST || user?.role === UserRole.SUBSTITUTE) && notificationCounts && (
                    <>
                      {item.href === '/therapist/clients' && notificationCounts.clients > 0 && (
                        <span className="ml-auto bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-semibold">
                          {notificationCounts.clients > 9 ? '9+' : notificationCounts.clients}
                        </span>
                      )}
                      {item.href === '/therapist/appointments' && notificationCounts.appointments > 0 && (
                        <span className="ml-auto bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-semibold">
                          {notificationCounts.appointments > 9 ? '9+' : notificationCounts.appointments}
                        </span>
                      )}
                      {item.href.includes('/messages') && notificationCounts.messages > 0 && (
                        <span className="ml-auto bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-semibold">
                          {notificationCounts.messages > 9 ? '9+' : notificationCounts.messages}
                        </span>
                      )}
                    </>
                  )}
                  {/* Red dot for no clients assigned */}
                  {(user?.role === UserRole.THERAPIST || user?.role === UserRole.SUBSTITUTE) &&
                   item.href === '/therapist/clients' &&
                   clientCount === 0 &&
                   (!notificationCounts || notificationCounts.clients === 0) && (
                    <span className="ml-2 h-2 w-2 bg-red-600 rounded-full animate-pulse" title="No clients assigned" />
                  )}
                </Link>
              ))}
            </nav>
            
            {/* Bottom section with user info and logout */}
            <div className="flex-shrink-0 border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ProfilePhotoUpload
                    userId={user?.id}
                    currentPhotoUrl={user?.profile_photo_url}
                    size="small"
                    editable={false}
                  />
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {getDisplayName()}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.role}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="mt-3 w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                {t('auth.logout')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top navigation */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-gray-600"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-4 ml-auto">
              {/* Notifications */}
              <NotificationBell />

              {/* Language switcher */}
              <LanguageSwitcher />

              {/* User menu */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{getDisplayName()}</p>
                  <p className={`text-xs ${getRoleColor()}`}>
                    {t(`role.${user?.role?.toLowerCase() || 'client'}`)}
                  </p>
                </div>
                
                <div className="relative group">
                  <button className="flex items-center text-gray-400 hover:text-gray-600">
                    <ProfilePhotoUpload
                      userId={user?.id}
                      currentPhotoUrl={user?.profile_photo_url}
                      size="xsmall"
                      editable={false}
                    />
                  </button>
                  
                  {/* Dropdown menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      <Link
                        to={`${getRoleBasePath()}/profile`}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <UserCircleIcon className="w-4 h-4 mr-3" />
                        {t('nav.profile')}
                      </Link>
                      <Link
                        to={`${getRoleBasePath()}/settings`}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Cog6ToothIcon className="w-4 h-4 mr-3" />
                        {t('nav.settings')}
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                        {t('auth.logout')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;