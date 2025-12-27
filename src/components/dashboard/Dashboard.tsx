
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import EmployeeList from '../employees/EmployeeList';
import EvaluationList from '../evaluations/EvaluationList';
import CompanyList from '../companies/CompanyList';
import DepartmentList from '../departments/DepartmentList';
import AdminTools from '../admin/AdminTools';
import WeightsConfiguration from '../admin/WeightsConfiguration';
import UserManagement from '../admin/UserManagement';
import DashboardHome from './DashboardHome';
import ProfilePage from '../profile/ProfilePage';
import SubDepartmentsPage from '../departments/SubDepartmentsPage';
import SectionsPage from '../departments/SectionsPage';
import SubSectionsPage from '../departments/SubSectionsPage';
import ReplacementPage from '../replacements/ReplacementPage';
import { OrganizationalProvider } from '../../contexts/OrganizationalContext';
import { useAuth } from '../../hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import HelpCenter from '@/components/help/HelpCenter';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

type ActiveView =
  | 'dashboard'
  | 'employees'
  | 'evaluations'
  | 'companies'
  | 'departments'
  | 'admin'
  | 'weights-configuration'
  | 'user-management'
  | 'profile'
  | 'employee-profile'
  | 'sub-departments'
  | 'sections'
  | 'sub-sections'
  | 'replacements'
  | 'help';

type Announcement = {
  id: string;
  title: string;
  message: string;
  to?: string;
  linkText?: string;
};

const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'help-center-launch',
    title: 'New: Help Center',
    message: 'Use the help icon in the header for quick guidance anywhere.',
    to: '/help',
    linkText: 'Open Help Center',
  },
];

const DISMISSED_ANNOUNCEMENTS_KEY = 'hr-system:dismissed-announcements';

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user } = useAuth();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [dismissedAnnouncementIds, setDismissedAnnouncementIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(DISMISSED_ANNOUNCEMENTS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every((v) => typeof v === 'string')) return parsed;
      return [];
    } catch {
      return [];
    }
  });

  // Determine active view from URL
  const getActiveViewFromPath = (pathname: string): ActiveView => {
    switch (pathname) {
      case '/employees':
        return 'employees';
      case '/evaluations':
        return 'evaluations';
      case '/companies':
        return 'companies';
      case '/departments':
        return 'departments';
      case '/sub-departments':
        return 'sub-departments';
      case '/sections':
        return 'sections';
      case '/sub-sections':
        return 'sub-sections';
      case '/replacements':
        return 'replacements';
      case '/admin':
        return 'admin';
      case '/admin/weights-configuration':
        return 'weights-configuration';
      case '/admin/user-management':
        return 'user-management';
      case '/profile':
        return 'profile';
      case '/help':
        return 'help';
      case '/dashboard':
      case '/':
      default:
        return 'dashboard';
    }
  };

  const activeView = getActiveViewFromPath(location.pathname);

  // Role-based access control per view
  const viewAccess: Record<ActiveView, Array<'admin' | 'hr' | 'manager' | 'employee'>> = {
    dashboard: ['admin', 'hr', 'manager', 'employee'],
    employees: ['admin', 'hr', 'manager'],
    evaluations: ['admin', 'hr', 'manager'],
    companies: ['admin', 'hr'],
    departments: ['admin', 'hr'],
    'sub-departments': ['admin', 'hr', 'manager'],
    sections: ['admin', 'hr', 'manager'],
    'sub-sections': ['admin', 'hr', 'manager'],
    replacements: ['admin', 'hr'],
    admin: ['admin'],
    'weights-configuration': ['admin'],
    'user-management': ['admin'],
    profile: ['admin', 'hr', 'manager', 'employee'],
    'employee-profile': ['admin', 'hr', 'manager', 'employee'],
    help: ['admin', 'hr', 'manager', 'employee'],
  };

  // Redirect away from unauthorized routes when role changes or path changes
  useEffect(() => {
    if (!user?.role) return;
    const allowed = viewAccess[activeView] || ['admin', 'hr', 'manager', 'employee'];
    const isAllowed =
      allowed.includes(user.role) ||
      ((activeView === 'replacements' || activeView === 'departments') && user.api_role === 'HOD');
    if (!isAllowed) {
      const fallbackPath = '/';
      if (location.pathname !== fallbackPath) {
        toast({
          title: 'Access denied',
          description: 'You do not have permission to view this page.',
        });
        navigate(fallbackPath, { replace: true });
      }
    }
  }, [activeView, user?.role, user?.api_role, navigate, location.pathname]);

  const handleViewChange = (view: string) => {
    const path = view === 'dashboard' ? '/' : `/${view}`;
    navigate(path);
  };

  const handleNavigateToWeights = () => {
    navigate('/admin/weights-configuration');
  };

  const handleNavigateToUserManagement = () => {
    navigate('/admin/user-management');
  };

  const handleBackToAdmin = () => {
    navigate('/admin');
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardHome />;
      case 'employees':
        return <EmployeeList />;
      case 'evaluations':
        return <EvaluationList />;
      case 'companies':
        return <CompanyList />;
      case 'departments':
        return <DepartmentList onViewChange={handleViewChange} />;
      case 'sub-departments':
        return <SubDepartmentsPage onViewChange={handleViewChange} />;
      case 'sections':
        return <SectionsPage onViewChange={handleViewChange} />;
      case 'sub-sections':
        return <SubSectionsPage onViewChange={handleViewChange} />;
      case 'replacements':
        return <ReplacementPage />;
      case 'admin':
        return <AdminTools onNavigateToWeights={handleNavigateToWeights} onNavigateToUserManagement={handleNavigateToUserManagement} />;
      case 'weights-configuration':
        return <WeightsConfiguration onBack={handleBackToAdmin} />;
      case 'user-management':
        return <UserManagement onBack={handleBackToAdmin} />;
      case 'profile':
        return <ProfilePage />;
      case 'help':
        return <HelpCenter />;
      default:
        return <DashboardHome />;
    }
  };

  const visibleAnnouncements = useMemo(() => {
    const dismissed = new Set(dismissedAnnouncementIds);
    return ANNOUNCEMENTS.filter((a) => !dismissed.has(a.id));
  }, [dismissedAnnouncementIds]);

  const dismissAnnouncement = (id: string) => {
    setDismissedAnnouncementIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      localStorage.setItem(DISMISSED_ANNOUNCEMENTS_KEY, JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      if (!target) return false;
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || target.isContentEditable;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const isQuestionMark = event.key === '?' || (event.shiftKey && event.key === '/');
      if (isQuestionMark) {
        event.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      if (event.key.toLowerCase() === 'b') {
        setIsSidebarCollapsed((prev) => !prev);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <OrganizationalProvider>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar 
          activeView={activeView} 
          onViewChange={handleViewChange}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        
        <div className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}>
          {visibleAnnouncements.length > 0 && (
            <div className="border-b border-blue-100 bg-blue-50">
              <div className="mx-auto max-w-7xl px-6 py-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Announcement</Badge>
                      <div className="font-semibold text-blue-900 truncate">{visibleAnnouncements[0].title}</div>
                    </div>
                    <div className="text-sm text-blue-800">{visibleAnnouncements[0].message}</div>
                    {visibleAnnouncements[0].to && visibleAnnouncements[0].linkText && (
                      <button
                        type="button"
                        onClick={() => navigate(visibleAnnouncements[0].to!)}
                        className="mt-1 text-sm font-medium text-blue-900 underline underline-offset-2"
                      >
                        {visibleAnnouncements[0].linkText}
                      </button>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissAnnouncement(visibleAnnouncements[0].id)}
                    aria-label="Dismiss announcement"
                    className="text-blue-900 hover:bg-blue-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Header
            onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            activeView={activeView}
            onOpenKeyboardShortcuts={() => setShortcutsOpen(true)}
          />
          
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>

      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Use these shortcuts to move faster. Shortcuts are disabled while typing in inputs.
            </div>
            <div className="divide-y rounded-lg border bg-white">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="font-medium text-gray-900">Open this panel</div>
                <Badge variant="outline">Shift + /</Badge>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="font-medium text-gray-900">Toggle sidebar</div>
                <Badge variant="outline">B</Badge>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="font-medium text-gray-900">Go to Help Center</div>
                <Badge variant="outline">Use the Help icon</Badge>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setShortcutsOpen(false)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </OrganizationalProvider>
  );
};

export default Dashboard;
