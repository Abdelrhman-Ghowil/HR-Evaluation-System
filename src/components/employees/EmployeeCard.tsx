
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Phone, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/utils/dataTransformers';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  countryCode?: string;
  avatar: string;
  department: string;
  position: string;
  role: 'Admin' | 'HR' | 'Head-of-Dept' | 'Line Manager' | 'Employee';
  managerialLevel: 'Individual Contributor' | 'Supervisory' | 'Middle Management';
  status: 'active' | 'inactive' | 'default_active';
  companyName: string;
  joinDate: string;
}

interface EmployeeCardProps {
  employee: Employee;
  onViewProfile: (employee: Employee) => void;
}

const EmployeeCard = ({ employee, onViewProfile }: EmployeeCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-all duration-200 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={employee.avatar} alt={employee.name} />
              <AvatarFallback className="bg-blue-600 text-white">
                {employee.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{employee.name}</CardTitle>
              <p className="text-sm text-gray-600">{employee.position}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewProfile(employee)}>
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem>Edit Employee</DropdownMenuItem>
              <DropdownMenuItem>View Evaluations</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">Deactivate</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge 
            variant={employee.status === 'active' ? 'default' : 'secondary'}
            className={employee.status === 'active' ? 'bg-green-100 text-green-800' : ''}
          >
            {employee.status}
          </Badge>
          <span className="text-sm text-gray-500">{employee.department}</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Mail className="h-4 w-4" />
            <span className="truncate">{employee.email}</span>
          </div>
          {employee.phone && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Phone className="h-4 w-4" />
              <span>{employee.phone}</span>
            </div>
          )}
          <div className="text-xs text-gray-500">
            Joined: {formatDate(employee.joinDate)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeCard;
