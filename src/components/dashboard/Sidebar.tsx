
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Building2, Users, BarChart3, Building, Settings, Home, ChevronLeft, ChevronRight, User, ChevronDown, UserCheck, BookOpen, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  onViewChange, 
  isCollapsed, 
  onToggleCollapse 
}) => {
  const { user } = useAuth();
  const [isDepartmentsOpen, setIsDepartmentsOpen] = useState(false);

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: Home, roles: ['admin', 'hr', 'manager', 'employee'] },
    { id: 'ramadan', name: 'رمضان 🌙', icon: Moon, roles: ['admin', 'hr', 'manager', 'employee'] },
    { id: 'competencies-dictionary', name: 'Competencies Dictionary', icon: BookOpen, roles: ['admin', 'hr', 'manager'] },
    { id: 'employees', name: 'Employees', icon: Users, roles: ['admin', 'hr', 'manager'] },
    { id: 'companies', name: 'Companies', icon: Building, roles: ['admin', 'hr'] },
    { id: 'departments', name: 'Departments', icon: Building2, roles: ['admin', 'hr', 'manager'] },
    { id: 'replacements', name: 'Replacements', icon: UserCheck, roles: ['admin', 'hr', 'manager'] },
    { id: 'profile', name: 'Profile', icon: User, roles: ['admin', 'hr', 'manager','employee'] },
    { id: 'admin', name: 'Admin Tools', icon: Settings, roles: ['admin'] },
  ];

  const departmentSubItems = [
    { id: 'sub-departments', name: 'Sub-Departments', roles: ['admin', 'hr', 'manager'] },
    { id: 'sections', name: 'Sections', roles: ['admin', 'hr', 'manager'] },
    { id: 'sub-sections', name: 'Sub-Sections', roles: ['admin', 'hr', 'manager'] },
  ];

  const filteredNavigation = navigation.filter(item => {
    if (!user?.role) return false;
    if (item.id === 'replacements') {
      return user.role === 'admin' || user.role === 'hr' || user.api_role === 'HOD';
    }
    if (item.id === 'departments') {
      return user.api_role === 'HOD';
    }
    return item.roles.includes(user.role);
  });

  const lmAdditionalNav = (user?.role === 'manager' && user?.api_role !== 'HOD')
    ? [
        { id: 'sub-departments', name: 'Sub-Departments', icon: Building2, roles: ['manager'] },
        { id: 'sections', name: 'Sections', icon: Building2, roles: ['manager'] },
        { id: 'sub-sections', name: 'Sub-Sections', icon: Building2, roles: ['manager'] },
      ]
    : [];

  const finalNavigation = [...filteredNavigation, ...lmAdditionalNav];

  return (
    <div className={cn(
      "fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-sm z-10 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed ? (
          <div className="flex items-center space-x-2">
            <img 
              src="/logo.png" 
              alt="Company Logo" 
              className="h-8 w-auto"
            />
            <span className="font-bold text-gray-900">HR System</span>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="Company Logo" 
              className="h-6 w-auto"
            />
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleCollapse();
            }
          }}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!isCollapsed}
          className="p-1.5 h-auto focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2" role="navigation" aria-label="Main navigation">
        {finalNavigation.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          const isDepartments = item.id === 'departments';
          
          return (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (isDepartments) {
                    setIsDepartmentsOpen(!isDepartmentsOpen);
                  }
                  onViewChange(item.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (isDepartments) {
                      setIsDepartmentsOpen(!isDepartmentsOpen);
                    }
                    onViewChange(item.id);
                  }
                }}
                tabIndex={0}
                aria-label={`Navigate to ${item.name}`}
                aria-expanded={isDepartments ? isDepartmentsOpen : undefined}
                aria-haspopup={isDepartments ? 'true' : undefined}
                className={cn(
                  "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                  isActive || (isDepartments && ['sub-departments', 'sections', 'sub-sections'].includes(activeView))
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActive || (isDepartments && ['sub-departments', 'sections', 'sub-sections'].includes(activeView)) ? "text-blue-600" : "text-gray-400"
                )} />
                {!isCollapsed && (
                  <>
                    <span className="truncate flex-1 text-left">{item.name}</span>
                    {isDepartments && (
                      <ChevronDown className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        isDepartmentsOpen ? "rotate-180" : ""
                      )} />
                    )}
                  </>
                )}
              </button>
              
              {/* Department Sub-items */}
              {isDepartments && isDepartmentsOpen && !isCollapsed && user?.role && ['admin', 'hr', 'manager'].includes(user.role) && (
                <div className="ml-8 mt-1 space-y-1" role="menu" aria-label="Department sub-menu">
                  {departmentSubItems.filter(subItem => 
                    user?.role && subItem.roles.includes(user.role)
                  ).map((subItem) => {
                    const isSubActive = activeView === subItem.id;
                    
                    return (
                      <button
                        key={subItem.id}
                        onClick={() => onViewChange(subItem.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onViewChange(subItem.id);
                          }
                        }}
                        tabIndex={0}
                        role="menuitem"
                        aria-label={`Navigate to ${subItem.name}`}
                        className={cn(
                          "w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                          isSubActive
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        <span className="truncate">{subItem.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User info */}
      {!isCollapsed && user && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-xs font-medium text-white">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {(() => {
                  if (!user?.api_role) return user?.role || '';
                  switch (user.api_role) {
                    case 'LM':
                      return 'Line Manager';
                    case 'HOD':
                      return 'HoD';
                    case 'HR':
                      return 'HR';
                    case 'ADMIN':
                      return 'Admin';
                    case 'EMP':
                      return 'Employee';
                    default:
                      return user.role;
                  }
                })()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
