
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Building2, Users, BarChart3, Building, Settings, Home, ChevronLeft, ChevronRight } from 'lucide-react';
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

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: Home, roles: ['admin', 'hr', 'manager', 'employee'] },
    { id: 'employees', name: 'Employees', icon: Users, roles: ['admin', 'hr', 'manager'] },
    { id: 'evaluations', name: 'Evaluations', icon: BarChart3, roles: ['admin', 'hr', 'manager', 'employee'] },
    { id: 'departments', name: 'Departments', icon: Building, roles: ['admin', 'hr'] },
    { id: 'admin', name: 'Admin Tools', icon: Settings, roles: ['admin'] },
  ];

  const filteredNavigation = navigation.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

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
          className="p-1.5 h-auto"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {filteredNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 flex-shrink-0",
                isActive ? "text-blue-600" : "text-gray-400"
              )} />
              {!isCollapsed && (
                <span className="truncate">{item.name}</span>
              )}
            </button>
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
              <p className="text-xs text-gray-500 capitalize truncate">
                {user.role} • {user.department}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
