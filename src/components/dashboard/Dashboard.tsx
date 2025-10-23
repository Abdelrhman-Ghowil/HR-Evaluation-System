
import React, { useState } from 'react';
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

type ActiveView = 'dashboard' | 'employees' | 'evaluations' | 'companies' | 'departments' | 'admin' | 'weights-configuration' | 'user-management' | 'profile' | 'employee-profile' | 'sub-departments' | 'sections' | 'sub-sections' | 'replacements';

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
      case '/dashboard':
      case '/':
      default:
        return 'dashboard';
    }
  };

  const activeView = getActiveViewFromPath(location.pathname);

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
      default:
        return <DashboardHome />;
    }
  };

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
          <Header onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
          
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </OrganizationalProvider>
  );
};

export default Dashboard;