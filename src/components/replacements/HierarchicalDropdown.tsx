import React from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { useEmployees, useCompanies, useDepartments, useSubDepartments } from '../../hooks/useApi';

interface HierarchicalDropdownProps {
  values: {
    employee_id: string;
    company_id: string;
    department_id: string;
    sub_department_id: string;
    section_id: string;
    sub_section_id: string;
  };
  onChange: (field: string, value: string) => void;
}

const HierarchicalDropdown: React.FC<HierarchicalDropdownProps> = ({ values, onChange }) => {
  // API Hooks
  const { data: employeesData, isLoading: employeesLoading } = useEmployees();
  const { data: companiesData, isLoading: companiesLoading } = useCompanies();
  const { data: departmentsData, isLoading: departmentsLoading } = useDepartments();
  const { data: subDepartmentsData, isLoading: subDepartmentsLoading } = useSubDepartments();

  // Extract data arrays from API responses
  const employees = employeesData?.results || [];
  const companies = companiesData?.results || [];
  const departments = departmentsData?.results || [];
  const subDepartments = subDepartmentsData?.results || [];

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="employee_id">Employee *</Label>
        <Select
          value={values.employee_id}
          onValueChange={(value) => onChange('employee_id', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select employee" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((employee) => (
              <SelectItem key={employee.employee_id} value={employee.employee_id}>
                {employee.user?.name}({employee.user?.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="company_id">Company *</Label>
        <Select
          value={values.company_id}
          onValueChange={(value) => onChange('company_id', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select company" />
          </SelectTrigger>
          <SelectContent>
            {companies.map((company) => (
              <SelectItem key={company.company_id} value={company.company_id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="department_id">Department *</Label>
        <Select
          value={values.department_id}
          onValueChange={(value) => onChange('department_id', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((department) => (
              <SelectItem key={department.department_id} value={department.department_id}>
                {department.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="sub_department_id">Sub Department</Label>
        <Select
          value={values.sub_department_id}
          onValueChange={(value) => onChange('sub_department_id', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select sub department" />
          </SelectTrigger>
          <SelectContent>
            {subDepartments.map((subDepartment) => (
              <SelectItem key={subDepartment.sub_department_id} value={subDepartment.sub_department_id}>
                {subDepartment.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="section_id">Section</Label>
        <Input
          id="section_id"
          value={values.section_id}
          onChange={(e) => onChange('section_id', e.target.value)}
          placeholder="Enter section ID (optional)"
        />
      </div>
      
      <div>
        <Label htmlFor="sub_section_id">Sub Section</Label>
        <Input
          id="sub_section_id"
          value={values.sub_section_id}
          onChange={(e) => onChange('sub_section_id', e.target.value)}
          placeholder="Enter sub section ID (optional)"
        />
      </div>
    </div>
  );
};

export default HierarchicalDropdown;