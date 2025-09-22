
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Phone, MoreHorizontal, MapPin, Briefcase, AlertTriangle, Building2, Users, Calendar, Hash, Wifi } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/utils/dataTransformers';

interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  warnings: string[];
  warningsCount: number;
  avatar: string;
  department: string;
  position: string;
  role: 'ADMIN' | 'HR' | 'HOD' | 'LM' | 'EMP';
  managerialLevel: 'Individual Contributor' | 'Supervisory' | 'Middle Management';
  status: 'active' | 'inactive' | 'default_active';
  companyName: string;
  orgPath: string;
  directManager: string;
  joinDate: string;
  jobType: string;
  location: string;
  branch: string;
}

interface EmployeeCardProps {
  employee: Employee;
  onViewProfile: (employee: Employee) => void;
}

const EmployeeCard = ({ employee, onViewProfile }: EmployeeCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'default_active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getJobTypeIcon = (jobType: string) => {
    switch (jobType.toLowerCase()) {
      case 'full-time':
        return <Briefcase className="h-3 w-3" />;
      case 'part-time':
        return <Users className="h-3 w-3" />;
      case 'full-time remote':
        return <Wifi className="h-3 w-3" />;
      case 'part-time remote':
        return <Wifi className="h-3 w-3" />;
      default:
        return <Briefcase className="h-3 w-3" />;
    }
  };

  return (
    <Card className="hover:shadow-xl transition-all duration-300 group border-0 shadow-md hover:scale-[1.02]">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="h-14 w-14 ring-2 ring-blue-100">
                <AvatarImage src={employee.avatar} alt={employee.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                  {employee.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              {employee.warningsCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold">
                  {employee.warningsCount}
                </div>
              )}
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900 mb-1">{employee.name}</CardTitle>
              <p className="text-sm font-medium text-gray-700 mb-1">{employee.position}</p>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Hash className="h-3 w-3" />
                  <span>{employee.employeeCode}</span>
                </div>
                <Badge 
                  variant="outline"
                  className={`text-xs px-2 py-0.5 ${getStatusColor(employee.status)}`}
                >
                  {employee.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-100">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onViewProfile(employee)} className="cursor-pointer">
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">Edit Employee</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">View Evaluations</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600 cursor-pointer">Deactivate</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Department and Role Section */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">{employee.department}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {employee.role}
          </Badge>
        </div>
        
        {/* Contact Information */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <Mail className="h-4 w-4 text-blue-500" />
            <span className="truncate font-medium">{employee.email}</span>
          </div>
          {employee.phone && (
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <Phone className="h-4 w-4 text-green-500" />
              <span className="font-medium">{employee.countryCode} {employee.phone}</span>
            </div>
          )}
        </div>

        {/* Warnings Section - Compact Modern Design */}
        {employee.warningsCount > 0 && (
          <div className="relative overflow-hidden p-2.5 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border border-amber-200/60 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 group">
            {/* Animated background pattern */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-100/20 to-yellow-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Compact decorative elements */}
            <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-amber-200/30 to-yellow-200/30 rounded-full -translate-y-6 translate-x-6 blur-lg"></div>
            <div className="absolute bottom-0 left-0 w-10 h-10 bg-gradient-to-tr from-orange-200/20 to-amber-200/20 rounded-full translate-y-5 -translate-x-5 blur-md"></div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {/* Compact icon with pulse animation */}
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-400/30 rounded-full animate-pulse"></div>
                  <div className="relative p-1.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full shadow-md">
                    <AlertTriangle className="h-3 w-3 text-white drop-shadow-sm" />
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-amber-900 tracking-wide">
                    Warning{employee.warningsCount !== 1 ? 's' : ''}
                  </span>
                  <span className="text-[10px] text-amber-700/80 font-medium">
                    Attention needed
                  </span>
                </div>
              </div>
              
              {/* Compact badge with glow effect */}
              <div className="relative">
                <div className="absolute inset-0 bg-amber-400/40 rounded-full blur-sm animate-pulse"></div>
                <div className="relative px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-md border border-amber-300/50">
                  {employee.warningsCount}
                </div>
              </div>
            </div>
            
            {/* Compact progress indicator */}
            <div className="mt-2 flex items-center space-x-0.5">
              {Array.from({ length: Math.min(employee.warningsCount, 4) }).map((_, i) => (
                <div 
                  key={i} 
                  className="h-1 w-4 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full shadow-sm"
                  style={{ 
                    animationDelay: `${i * 0.1}s`,
                    animation: 'pulse 2s infinite'
                  }}
                ></div>
              ))}
              {employee.warningsCount > 4 && (
                <span className="text-[10px] text-amber-600 font-medium ml-1">+{employee.warningsCount - 4}</span>
              )}
            </div>
          </div>
        )}

        {/* Work Details */}
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
           {employee.location && (
             <div className="flex items-center space-x-2 text-sm text-gray-600 p-2 bg-blue-50 rounded-md">
               <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
               <div className="min-w-0">
                 <div className="font-medium truncate">{employee.location}</div>
                 <div className="text-xs text-gray-500 truncate">{employee.branch}</div>
               </div>
             </div>
           )}
           {employee.jobType && (
             <div className="flex items-center space-x-2 text-sm text-gray-600 p-2 bg-purple-50 rounded-md">
               {getJobTypeIcon(employee.jobType)}
               <span className="font-medium truncate">{employee.jobType}</span>
             </div>
           )}
         </div>

        {/* Footer Information */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>Joined {formatDate(employee.joinDate)}</span>
          </div>
          {employee.directManager && (
            <div className="text-xs text-gray-500">
              Manager: <span className="font-medium">{employee.directManager}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeCard;
