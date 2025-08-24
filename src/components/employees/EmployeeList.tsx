
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Plus, Edit, Mail, Phone, X, Search, Filter, Upload, FileSpreadsheet, Trash2 } from 'lucide-react';
import EmployeeDetails from './EmployeeDetails';
import * as XLSX from 'xlsx';
import { apiService } from '@/services/api';
import { ApiEmployee, ApiDepartment, ApiCompany, UpdateEmployeeRequest } from '@/types/api';
import { parsePhoneNumber, formatDate } from '@/utils/dataTransformers';
import { AnyARecord } from 'dns';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  countryCode?: string;
  avatar: string;
  department: string;
  position: string;
  role: 'ADMIN' | 'HR' | 'HOD' | 'LM' | 'EMP';
  managerialLevel: 'Individual Contributor' | 'Supervisory' | 'Middle Management';
  status: 'Active' | 'Inactive';
  companyName: string;
  joinDate: string;
  company_id: string;
  departments_ids: string[];
  user_id: string;
}

const EmployeeList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [companies, setCompanies] = useState<ApiCompany[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [originalEmployee, setOriginalEmployee] = useState<Employee | null>(null);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [editValidationErrors, setEditValidationErrors] = useState<{[key: string]: string}>({});
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+966',
    avatar: '',
    department: '',
    departmentId: '',
    position: '',
    role: 'EMP' ,
    managerialLevel: 'Individual Contributor',
    status: 'Active' ,
    companyName: 'Ninja',
    companyId: '',
    joinDate: new Date().toISOString().split('T')[0],
    username: '',
    password: 'Password123',
    firstName: '',
    lastName: '',
    title: ''
  });

  // Drag and drop state
  const [isDragOver, setIsDragOver] = useState(false);

  // Clear auto-filled form data
  const clearAutoFilledData = () => {
    setNewEmployee({
      name: '',
      email: '',
      phone: '',
      countryCode: '+966',
      avatar: '',
      department: '',
      departmentId: '',
      position: '',
      role: 'EMP',
      managerialLevel: 'Individual Contributor',
      status: 'Active',
      companyName: 'Ninja',
      companyId: '',
      joinDate: new Date().toISOString().split('T')[0],
      username: '',
      password: 'Password123',
      firstName: '',
      lastName: '',
      title: ''
    });
    setValidationErrors({});
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel') {
        // Create a synthetic event to pass to handleExcelUpload
        const syntheticEvent = {
          target: { files: [file] }
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        handleExcelUpload(syntheticEvent);
      }
    }
  };

  // Transform API employee data to local Employee interface
  const transformApiEmployee = (apiEmployee: ApiEmployee): Employee => {
    const { countryCode, phone } = parsePhoneNumber(apiEmployee.phone);
    
    return {
      id: apiEmployee.employee_id,
      name: apiEmployee.name,
      email: apiEmployee.email,
      phone: phone,
      countryCode: countryCode,
      avatar: apiEmployee.avatar || '/placeholder.svg',
      department: apiEmployee.department.length > 0 ? apiEmployee.department[0] : '',
      position: apiEmployee.position,
      role: apiEmployee.role as 'ADMIN' | 'HR' | 'HOD' | 'LM' | 'EMP',
      managerialLevel: apiEmployee.managerial_level as 'Individual Contributor' | 'Supervisory' | 'Middle Management',
      status: apiEmployee.status as 'Active' | 'Inactive',
      companyName: apiEmployee.company_name,
      joinDate: apiEmployee.join_date,
      company_id: apiEmployee.company_id,
      departments_ids: [], // Will be populated from department names if needed
      user_id: apiEmployee.user_id
    };
  };

  // Fetch departments from API
  const fetchDepartments = async () => {
    try {
      console.log('Fetching departments from API...');
      const response = await apiService.getDepartments();
      console.log('Departments API Response:', response);
      
      if (response && Array.isArray(response)) {
        setDepartments(response);
        console.log(`Successfully loaded ${response.length} departments from API`);
      } else {
        console.warn('Unexpected departments API response structure:', response);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  // Fetch companies from API
  const fetchCompanies = async () => {
    try {
      console.log('Fetching companies from API...');
      const response = await apiService.getCompanies();
      console.log('Companies API Response:', response);
      
      if (response && Array.isArray(response)) {
        setCompanies(response);
        console.log(`Successfully loaded ${response.length} companies from API`);
      } else {
        console.warn('Unexpected companies API response structure:', response);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  // Fetch employees from API
  const fetchEmployees = async () => {
    try {
      console.log('Fetching employees from API...');
      const response = await apiService.getEmployees();
      console.log('API Response:', response); // Debug log
      
      // Check if response has the expected structure
      if (response && response.results && Array.isArray(response.results)) {
        const transformedEmployees = response.results.map(transformApiEmployee);
        setEmployees(transformedEmployees);
        console.log(`Successfully loaded ${transformedEmployees.length} employees from API`);
      } else if (response && Array.isArray(response)) {
        // Handle case where API returns array directly instead of paginated response
        const transformedEmployees = response.map(transformApiEmployee);
        setEmployees(transformedEmployees);
        console.log(`Successfully loaded ${transformedEmployees.length} employees from API (direct array)`);
      } else {
        console.warn('Unexpected API response structure:', response);
        console.log('Falling back to demo data due to unexpected API response structure');
        setEmployees(initialEmployees);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      if (error.response?.status === 500) {
        console.log('API server error (500) - using demo data instead');
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        console.log('Network error - API may be unavailable, using demo data instead');
      } else {
        console.log('API error - using demo data instead');
      }
      // Fallback to initial employees if API fails
      setEmployees(initialEmployees);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    fetchCompanies();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const initialEmployees: Employee[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      phone: '123-4567',
      avatar: '/placeholder.svg',
      department: 'Engineering',
      position: 'Senior Developer',
      role: 'EMP',
      managerialLevel: 'Individual Contributor',
      status: 'Active',
      companyName: 'Ninja',
      joinDate: '2022-01-15',
      company_id: '',
      departments_ids: [],
      user_id: ''
    },
    {
      id: '2',
      name: 'Michael Chen',
      email: 'michael.chen@company.com',
      phone: '234-5678',
      avatar: '/placeholder.svg',
      department: 'Human Resources',
      position: 'HR Manager',
      role: 'HR',
      managerialLevel: 'Middle Management',
      status: 'Active',
      companyName: 'Ninja',
      joinDate: '2021-03-10',
      company_id: '',
      departments_ids: [],
      user_id: ''
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@company.com',
      phone: '345-6789',
      avatar: '/placeholder.svg',
      department: 'Sales',
      position: 'Sales Manager',
      role: 'LM',
      managerialLevel: 'Supervisory',
      status: 'Active',
      companyName: 'Ninja',
      joinDate: '2020-07-22',
      company_id: '',
      departments_ids: [],
      user_id: ''
    },
    {
      id: '4',
      name: 'David Kim',
      email: 'david.kim@company.com',
      phone: '(966) 456-7890',
      avatar: '/placeholder.svg',
      department: 'Engineering',
      position: 'Frontend Developer',
      role: 'EMP',
      managerialLevel: 'Individual Contributor',
      status: 'Active',
      companyName: 'Ninja',
      joinDate: '2023-02-01',
      company_id: '',
      departments_ids: [],
      user_id: ''
    },
    {
      id: '5',
      name: 'Lisa Wang',
      email: 'lisa.wang@company.com',
      phone: '(966) 567-8901',
      avatar: '/placeholder.svg',
      department: 'Marketing',
      position: 'Marketing Specialist',
      role: 'EMP',
      managerialLevel: 'Individual Contributor',
      status: 'Inactive',
      companyName: 'Ninja',
      joinDate: '2021-11-05',
      company_id: '',
      departments_ids: [],
      user_id: ''
    }
  ];

  // Handler functions
  const handleToggleStatus = async (employeeId: string) => {
    try {
      // Find the employee to get current data
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee) {
        console.error('Employee not found');
        return;
      }
      
      // Toggle the status
      const newStatus = employee.status === 'Active' ? 'Inactive' : 'Active';
      
      // Prepare the update payload with only the status change
      const updateData: UpdateEmployeeRequest = {
        status: newStatus
      };
      
      console.log(`Updating employee ${employeeId} status to ${newStatus}`);
      
      // Call the API to update the employee status
      await apiService.updateEmployee(employeeId, updateData);
      
      console.log('Employee status updated successfully');
      
      // Update the local state
      setEmployees(prev => prev.map(emp => 
        emp.id === employeeId 
          ? { ...emp, status: newStatus }
          : emp
      ));
      
    } catch (error) {
      console.error('Error updating employee status:', error);
       // You can add error handling here, such as showing a toast notification
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setOriginalEmployee(employee); // Store original data for comparison
    setIsEditModalOpen(true);
  };

  const validateEditForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!editingEmployee?.name?.trim()) {
      errors.name = 'Full name is required';
    }
    
    if (!editingEmployee?.email?.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editingEmployee.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!editingEmployee?.phone?.trim()) {
      errors.phone = 'Phone number is required';
    }
    
    if (!editingEmployee?.department?.trim()) {
      errors.department = 'Department is required';
    }
    
    if (!editingEmployee?.position?.trim()) {
      errors.position = 'Position is required';
    }
    
    if (!editingEmployee?.companyName?.trim()) {
      errors.companyName = 'Company name is required';
    }
    
    if (!editingEmployee?.joinDate?.trim()) {
      errors.joinDate = 'Join date is required';
    }
    
    setEditValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveEdit = async () => {
    if (editingEmployee && originalEmployee && validateEditForm()) {
      try {
        // Prepare the update payload with only changed fields
        const updateData: UpdateEmployeeRequest = {};
        
        // Check if user_data fields have changed
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userDataChanges: any = {};
        
        // Only include email if it has changed
        if (editingEmployee.email !== originalEmployee.email) {
          userDataChanges.email = editingEmployee.email;
        }
        
        // Only include username if email has changed (generate from new email)
        if (editingEmployee.email !== originalEmployee.email) {
          userDataChanges.username = editingEmployee.email.split('@')[0];
        }
        
        // Check other user_data fields
        if (editingEmployee.role !== originalEmployee.role) {
          userDataChanges.role = editingEmployee.role;
        }
        
        if (editingEmployee.name !== originalEmployee.name) {
          userDataChanges.name = editingEmployee.name;
          // Split name into first and last name
          const nameParts = editingEmployee.name.split(' ');
          userDataChanges.first_name = nameParts[0] || '';
          userDataChanges.last_name = nameParts.slice(1).join(' ') || '';
        }
        
        if (editingEmployee.avatar !== originalEmployee.avatar) {
          // Send avatar as path, not URL
          userDataChanges.avatar = editingEmployee.avatar || '';
        }
        
        if (editingEmployee.position !== originalEmployee.position) {
          userDataChanges.title = editingEmployee.position;
        }
        
        // Check if phone has changed
        const originalFullPhone = originalEmployee.countryCode ? 
          `${originalEmployee.countryCode}${originalEmployee.phone}` : 
          originalEmployee.phone;
        const newFullPhone = editingEmployee.countryCode ? 
          `${editingEmployee.countryCode}${editingEmployee.phone}` : 
          editingEmployee.phone;
        
        if (newFullPhone !== originalFullPhone) {
          userDataChanges.phone = newFullPhone;
        }
        
        // Only add user_data if there are changes
        if (Object.keys(userDataChanges).length > 0) {
          updateData.user_data = userDataChanges;
        }
        
        // Check other top-level fields
        if (editingEmployee.company_id !== originalEmployee.company_id) {
          updateData.company_id = editingEmployee.company_id;
        }
        
        // Check if department has changed
        if (editingEmployee.department !== originalEmployee.department) {
          const departmentIds = departments
            .filter(dept => editingEmployee.department.includes(dept.name))
            .map(dept => dept.department_id);
          updateData.departments_ids = departmentIds.length > 0 ? departmentIds : editingEmployee.departments_ids;
        }
        
        if (editingEmployee.managerialLevel !== originalEmployee.managerialLevel) {
          updateData.managerial_level = editingEmployee.managerialLevel;
        }
        
        if (editingEmployee.status !== originalEmployee.status) {
          updateData.status = editingEmployee.status;
        }
        
        if (editingEmployee.joinDate !== originalEmployee.joinDate) {
          updateData.join_date = editingEmployee.joinDate;
        }
        
        // Only make API call if there are changes
        if (Object.keys(updateData).length === 0) {
          console.log('No changes detected, skipping API call');
          setIsEditModalOpen(false);
          setEditingEmployee(null);
          setOriginalEmployee(null);
          setEditValidationErrors({});
          return;
        }
        
        console.log('Updating employee with data:', updateData);
        
        // Call the API to update the employee
        const updatedEmployee = await apiService.updateEmployee(editingEmployee.id, updateData);
        
        console.log('Employee updated successfully:', updatedEmployee);
        
        // Update the local state with the updated employee
        setEmployees(prev => prev.map(emp => 
          emp.id === editingEmployee.id ? editingEmployee : emp
        ));
        
        setIsEditModalOpen(false);
        setEditingEmployee(null);
        setOriginalEmployee(null);
        setEditValidationErrors({});
        
      } catch (error) {
        console.error('Error updating employee:', error);
        // You can add error handling here, such as showing a toast notification
      }
    }
  };

  const validateAddForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!newEmployee.name?.trim()) {
      errors.name = 'Full name is required';
    }
    
    if (!newEmployee.email?.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmployee.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!newEmployee.phone?.trim()) {
      errors.phone = 'Phone number is required';
    }
    
    if (!newEmployee.department?.trim()) {
      errors.department = 'Department is required';
    }
    
    if (!newEmployee.position?.trim()) {
      errors.position = 'Position is required';
    }
    
    if (!newEmployee.companyName?.trim()) {
      errors.companyName = 'Company name is required';
    }
    
    if (!newEmployee.joinDate?.trim()) {
      errors.joinDate = 'Join date is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddEmployee = async () => {
    if (validateAddForm()) {
      try {
        // Generate username from name if not provided
        const username = newEmployee.username || newEmployee.name.toLowerCase().replace(/\s+/g, '');
        
        // Split name into first and last name if not provided
        const nameParts = newEmployee.name.split(' ');
        const firstName = newEmployee.firstName || nameParts[0] || '';
        const lastName = newEmployee.lastName || nameParts.slice(1).join(' ') || '';
        
        // Combine phone with country code
        const fullPhoneNumber = `${newEmployee.countryCode}${newEmployee.phone}`;
        
        const employeeData = {
          user_data: {
            username: username,
            email: newEmployee.email,
            password: newEmployee.password,
            role: newEmployee.role,
            name: newEmployee.name,
            avatar: newEmployee.avatar || '',
            first_name: firstName,
            last_name: lastName,
            title: newEmployee.position || newEmployee.title || '',
            phone: fullPhoneNumber
          },
          company_id: newEmployee.companyId,
          departments_ids: newEmployee.departmentId ? [newEmployee.departmentId] : [],
          managerial_level: newEmployee.managerialLevel,
          status: newEmployee.status,
          join_date: newEmployee.joinDate
        };
        
        await apiService.createEmployee(employeeData);
        
        // Refresh the employee list
        await fetchEmployees();
        
        // Reset form
        setNewEmployee({
          name: '',
          email: '',
          phone: '',
          countryCode: '+966',
          avatar: '',
          department: '',
          departmentId: '',
          position: '',
          role: 'EMP' as const,
          managerialLevel: 'Individual Contributor' as const,
          status: 'Active' as const,
          companyName: 'Ninja',
          companyId: '',
          joinDate: new Date().toISOString().split('T')[0],
          username: '',
          password: 'Password123',
          firstName: '',
          lastName: '',
          title: ''
        });
        setValidationErrors({});
        setIsAddModalOpen(false);
      } catch (error) {
        console.error('Error creating employee:', error);
        // You might want to show an error message to the user here
        alert('Failed to create employee. Please try again.');
      }
    }
  };

  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: (string | number | undefined)[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });


        if (jsonData.length < 2) {
          alert('Excel file must contain at least a header row and one data row.');
          return;
        }

        // Get the first row (headers) and first data row
        const headers = jsonData[0];
        const firstDataRow = jsonData[1];

        // Create a mapping object from the first data row
        const rowData: { [key: string]: string } = {};
        headers.forEach((header: string, index: string | number) => {
          rowData[header] = firstDataRow[index] || '';
        });

        // Map Excel columns to form fields
        const fullName = rowData['Full Name'] || rowData['Name'] || '';
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Find department and company IDs from the loaded data
        const departmentName = rowData['Department'] || '';
        const companyName = rowData['Company Name'] || '';
        const foundDepartment = departments.find(dept => dept.name.toLowerCase() === departmentName.toLowerCase());
        const foundCompany = companies.find(comp => comp.name.toLowerCase() === companyName.toLowerCase());
        
        const mappedData = {
          name: fullName,
          email: rowData['Email Address'] || rowData['Email'] || '',
          phone: rowData['Phone Number'] || rowData['Phone'] || '',
          avatar: rowData['Profile Image'] || rowData['Avatar'] || '',
          department: departmentName,
          position: rowData['Position'] || '',
          role: (rowData['Role'] || 'EMP') as 'ADMIN' | 'HR' | 'HOD' | 'LM' | 'EMP',
          managerialLevel: (rowData['Managerial Level'] || 'Individual Contributor') as 'Individual Contributor' | 'Supervisory' | 'Middle Management',
          companyName: companyName,
          status: (rowData['Status'] || 'Active') as 'Active' | 'Inactive',
          joinDate: rowData['Join Date'] ? new Date(rowData['Join Date']).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          countryCode: '+966',
          // New fields for API structure
          username: rowData['Username'] || fullName.toLowerCase().replace(/\s+/g, ''),
          firstName: rowData['First Name'] || firstName,
          lastName: rowData['Last Name'] || lastName,
          title: rowData['Title'] || rowData['Position'] || '',
          password: rowData['Password'] || 'Password123',
          departmentId: foundDepartment?.department_id || '',
          companyId: foundCompany?.company_id || ''
        };

        // Update the form with the imported data
        setNewEmployee(mappedData);
        
        // Clear any validation errors
        setValidationErrors({});
        
        // Reset the file input
        event.target.value = '';
        
        alert('Excel data imported successfully!');
      } catch (error) {
        console.error('Error reading Excel file:', error);
        alert('Error reading Excel file. Please make sure it\'s a valid Excel file.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('all');
  };



  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        employee.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || employee.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  if (selectedEmployee) {
    return (
      <EmployeeDetails 
        employee={{...selectedEmployee, status: selectedEmployee.status === 'Active' ? 'Active' : 'Inactive'}}
        onBack={() => setSelectedEmployee(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
          <p className="text-gray-600">Manage employee profiles and information</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Add New Employee</DialogTitle>
              <p className="text-sm text-gray-600">Fill in the employee details below or import from Excel</p>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Excel Import Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2 flex-1">Import from Excel</h3>
                </div>
                <div 
                  className={`bg-blue-50 border-2 border-dashed rounded-lg p-6 transition-colors ${
                    isDragOver ? 'border-blue-400 bg-blue-100' : 'border-blue-200'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex items-center space-x-4">
                    <FileSpreadsheet className="h-8 w-8 text-blue-600" />
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-900">Upload Excel File</h4>
                      <p className="text-sm text-blue-700">Drag and drop an Excel file here or click to browse</p>
                      <p className="text-xs text-blue-600 mt-1">
                        Expected columns: Full Name, Email Address, Phone Number, Profile Image, Department, Position, Role, Managerial Level, Company Name, Status, Join Date
                      </p>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleExcelUpload}
                        className="hidden"
                        id="excel-upload"
                      />
                      <div className="flex space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="bg-white hover:bg-blue-50 cursor-pointer"
                          onClick={() => document.getElementById('excel-upload')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Choose File
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="bg-white hover:bg-red-50 text-red-600 border-red-200 hover:border-red-300"
                          onClick={clearAutoFilledData}
                          title="Clear auto-filled data"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
                    <Input
                      id="name"
                      value={newEmployee.name || ''}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter full name"
                      className={`w-full ${validationErrors.name ? 'border-red-500' : ''}`}
                    />
                    {validationErrors.name && (
                      <p className="text-sm text-red-500">{validationErrors.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newEmployee.email || ''}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="employee@company.com"
                      className={`w-full ${validationErrors.email ? 'border-red-500' : ''}`}
                    />
                    {validationErrors.email && (
                      <p className="text-sm text-red-500">{validationErrors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                    <Input
                      id="username"
                      value={newEmployee.username || ''}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Auto-generated from name if empty"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                    <Input
                      id="firstName"
                      value={newEmployee.firstName || ''}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Auto-extracted from full name if empty"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                    <Input
                      id="lastName"
                      value={newEmployee.lastName || ''}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Auto-extracted from full name if empty"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">Title</Label>
                    <Input
                      id="title"
                      value={newEmployee.title || ''}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Professional title (optional)"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">Phone Number *</Label>
                    <div className="flex gap-2">
                      <Select 
                        value={newEmployee.countryCode || '+1'} 
                        onValueChange={(value) => setNewEmployee(prev => ({ ...prev, countryCode: value }))}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="+20">🇪🇬 +20</SelectItem>
                            <SelectItem value="+966">🇸🇦 +966</SelectItem>
                            <SelectItem value="+1">🇺🇸 +1</SelectItem>
                            <SelectItem value="+44">🇬🇧 +44</SelectItem>
                            <SelectItem value="+33">🇫🇷 +33</SelectItem>
                            <SelectItem value="+49">🇩🇪 +49</SelectItem>
                            <SelectItem value="+39">🇮🇹 +39</SelectItem>
                            <SelectItem value="+34">🇪🇸 +34</SelectItem>
                            <SelectItem value="+86">🇨🇳 +86</SelectItem>
                            <SelectItem value="+81">🇯🇵 +81</SelectItem>
                            <SelectItem value="+82">🇰🇷 +82</SelectItem>
                            <SelectItem value="+91">🇮🇳 +91</SelectItem>
                            <SelectItem value="+61">🇦🇺 +61</SelectItem>
                            <SelectItem value="+55">🇧🇷 +55</SelectItem>
                            <SelectItem value="+52">🇲🇽 +52</SelectItem>
                            <SelectItem value="+7">🇷🇺 +7</SelectItem>
                            <SelectItem value="+27">🇿🇦 +27</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id="phone"
                        value={newEmployee.phone || ''}
                        onChange={(e) => setNewEmployee(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="123-456-7890"
                        className={`flex-1 ${validationErrors.phone ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {validationErrors.phone && (
                      <p className="text-sm text-red-500">{validationErrors.phone}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avatar" className="text-sm font-medium">Profile Image</Label>
                    <div className="flex items-center space-x-4">
                      {newEmployee.avatar && (
                        <div className="relative">
                          <img 
                            src={newEmployee.avatar} 
                            alt="Preview" 
                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                            onClick={() => setNewEmployee(prev => ({ ...prev, avatar: '' }))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      <div className="flex-1">
                        <Input
                          id="avatar"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setNewEmployee(prev => ({ ...prev, avatar: event.target?.result as string }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500 mt-1">Upload an image file (JPG, PNG, GIF)</p>
                       </div>
                     </div>
                   </div>
                   </div>
                 </div>
               </div>

              {/* Work Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Work Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-sm font-medium">Department *</Label>
                    <Select 
                      value={newEmployee.departmentId} 
                      onValueChange={(value) => {
                        const selectedDept = departments.find(dept => dept.department_id === value);
                        setNewEmployee(prev => ({ 
                          ...prev, 
                          departmentId: value,
                          department: selectedDept?.name || ''
                        }));
                      }}
                    >
                      <SelectTrigger className={`w-full ${validationErrors.department ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.department_id} value={dept.department_id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {validationErrors.department && (
                      <p className="text-sm text-red-500">{validationErrors.department}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position" className="text-sm font-medium">Position *</Label>
                    <Input
                      id="position"
                      value={newEmployee.position || ''}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, position: e.target.value }))}
                      placeholder="Job title"
                      className={`w-full ${validationErrors.position ? 'border-red-500' : ''}`}
                    />
                    {validationErrors.position && (
                      <p className="text-sm text-red-500">{validationErrors.position}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-medium">Role *</Label>
                    <Select 
                      value={newEmployee.role} 
                      onValueChange={(value: Employee['role']) => 
                        setNewEmployee((prev) => ({ 
                          ...prev, 
                          role: value as typeof prev.role 
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="Head-of-Dept">Head-of-Dept</SelectItem>
            <SelectItem value="Line Manager">Line Manager</SelectItem>
                        <SelectItem value="Employee">Employee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="managerialLevel" className="text-sm font-medium">Managerial Level *</Label>
                    <Select 
                        value={newEmployee.managerialLevel} 
                        onValueChange={(value: typeof newEmployee.managerialLevel) => 
                          setNewEmployee(prev => ({ ...prev, managerialLevel: value }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select managerial weight" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Supervisory">Supervisory</SelectItem>
                        <SelectItem value="Middle Management">Middle Management</SelectItem>
                        <SelectItem value="Individual Contributor">Individual Contributor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Company Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-sm font-medium">Company Name *</Label>
                    <Select 
                      value={newEmployee.companyId} 
                      onValueChange={(value) => {
                        const selectedCompany = companies.find(company => company.company_id === value);
                        setNewEmployee(prev => ({ 
                          ...prev, 
                          companyId: value,
                          companyName: selectedCompany?.name || ''
                        }));
                      }}
                    >
                      <SelectTrigger className={`w-full ${validationErrors.companyName ? 'border-red-500' : ''}`}>
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
                    {validationErrors.companyName && (
                      <p className="text-sm text-red-500">{validationErrors.companyName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-medium">Status *</Label>
                    <Select 
                      value={newEmployee.status} 
                      onValueChange={(value: typeof newEmployee.status) => 
                        setNewEmployee(prev => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="joinDate" className="text-sm font-medium">Join Date *</Label>
                    <Input
                      id="joinDate"
                      type="date"
                      value={newEmployee.joinDate || ''}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, joinDate: e.target.value }))}
                      className={`w-full md:w-1/2 ${validationErrors.joinDate ? 'border-red-500' : ''}`}
                    />
                    {validationErrors.joinDate && (
                      <p className="text-sm text-red-500">{validationErrors.joinDate}</p>
                    )}
                  </div>
                </div>
              </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAddEmployee}>Add Employee</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Enhanced Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.department_id} value={dept.name}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Employee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id} className="hover:shadow-lg transition-all duration-200 group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4 gap-2">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={employee.avatar} alt={employee.name} />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {employee.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-lg truncate">{employee.name}</h3>
                    <p className="text-sm text-gray-600 truncate">{employee.position}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <Switch
                    checked={employee.status === 'Active'}
                    onCheckedChange={() => handleToggleStatus(employee.id)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditEmployee(employee)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex gap-2 flex-wrap min-w-0 flex-1">
                    <Badge 
                      variant={employee.status === 'Active' ? 'default' : 'secondary'}
                      className={employee.status === 'Active' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {employee.status}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {employee.role}
                    </Badge>
                    <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700">
                      {employee.managerialLevel}
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-500 flex-shrink-0 truncate max-w-[100px]">{employee.department}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <a 
                      href={`mailto:${employee.email}`}
                      className="truncate text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      {employee.email}
                    </a>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <a 
                      href={`https://wa.me/${(employee.countryCode || '+1').replace('+', '')}${employee.phone?.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-800 hover:underline transition-colors"
                    >
                      {(employee.countryCode || '+1')} {employee.phone}
                    </a>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 gap-2">
                    <span className="flex-shrink-0">Joined: {formatDate(employee.joinDate)}</span>
                    <span className="font-medium truncate">{employee.companyName}</span>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full mt-3"
                  onClick={() => setSelectedEmployee(employee)}
                >
                  View Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Employee Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Edit Employee</DialogTitle>
            <p className="text-sm text-gray-600">Update employee information below</p>
          </DialogHeader>
          {editingEmployee && (
            <div className="space-y-6 py-4">
              
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name" className="text-sm font-medium">Full Name *</Label>
                    <Input
                      id="edit-name"
                      value={editingEmployee.name}
                      onChange={(e) => setEditingEmployee(prev => prev ? { ...prev, name: e.target.value } : null)}
                      placeholder="Enter full name"
                      className={`w-full ${editValidationErrors.name ? 'border-red-500' : ''}`}
                    />
                    {editValidationErrors.name && (
                      <p className="text-sm text-red-500">{editValidationErrors.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email" className="text-sm font-medium">Email Address *</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editingEmployee.email}
                      onChange={(e) => setEditingEmployee(prev => prev ? { ...prev, email: e.target.value } : null)}
                      placeholder="employee@company.com"
                      className={`w-full ${editValidationErrors.email ? 'border-red-500' : ''}`}
                    />
                    {editValidationErrors.email && (
                      <p className="text-sm text-red-500">{editValidationErrors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone" className="text-sm font-medium">Phone Number *</Label>
                    <div className="flex gap-2">
                      <Select 
                        value={editingEmployee.countryCode || '+1'} 
                        onValueChange={(value) => setEditingEmployee(prev => prev ? { ...prev, countryCode: value } : null)}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="+966">🇸🇦 +966</SelectItem>
                          <SelectItem value="+20">🇪🇬 +20</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id="edit-phone"
                        value={editingEmployee.phone || ''}
                        onChange={(e) => setEditingEmployee(prev => prev ? { ...prev, phone: e.target.value } : null)}
                        placeholder="123-456-7890"
                        className={`flex-1 ${editValidationErrors.phone ? 'border-red-500' : ''}`}
                      />
                    {editValidationErrors.phone && (<p className="text-sm text-red-500">{editValidationErrors.phone}</p>)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-avatar" className="text-sm font-medium">Profile Image</Label>
                    <div className="flex items-center space-x-4">
                      {editingEmployee.avatar && (
                        <div className="relative">
                          <img 
                            src={editingEmployee.avatar} 
                            alt="Preview" 
                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                            onClick={() => setEditingEmployee(prev => prev ? { ...prev, avatar: '' } : null)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      <div className="flex-1">
                        <Input
                          id="edit-avatar"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setEditingEmployee(prev => prev ? { ...prev, avatar: event.target?.result as string } : null);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500 mt-1">Upload an image file (JPG, PNG, GIF)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Work Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Work Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-department" className="text-sm font-medium">Department *</Label>
                    <Select 
                      value={editingEmployee.department} 
                      onValueChange={(value) => setEditingEmployee(prev => prev ? { ...prev, department: value } : null)}>
                      <SelectTrigger className={`w-full ${editValidationErrors.department ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.department_id} value={dept.name}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {editValidationErrors.department && (
                      <p className="text-sm text-red-500">{editValidationErrors.department}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-position" className="text-sm font-medium">Position *</Label>
                    <Input
                      id="edit-position"
                      value={editingEmployee.position}
                      onChange={(e) => setEditingEmployee(prev => prev ? { ...prev, position: e.target.value } : null)}
                      placeholder="Job title"
                      className={`w-full ${editValidationErrors.position ? 'border-red-500' : ''}`}/>
                    {editValidationErrors.position && (
                      <p className="text-sm text-red-500">{editValidationErrors.position}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-role" className="text-sm font-medium">Role *</Label>
                    <Select 
                      value={editingEmployee.role}
                      onValueChange={(value) => setEditingEmployee(prev => prev ? { ...prev, role: value as 'ADMIN' | 'HR' | 'HOD' | 'LM' | 'EMP' } : null)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="Head-of-Dept">Head-of-Dept</SelectItem>
              <SelectItem value="Line Manager">Line Manager</SelectItem>
                        <SelectItem value="Employee">Employee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-managerialLevel" className="text-sm font-medium">Managerial Level *</Label>
                    <Select 
                      value={editingEmployee.managerialLevel}
                      onValueChange={(value) => setEditingEmployee(prev => prev ? { ...prev, managerialLevel: value as 'Individual Contributor' | 'Supervisory' | 'Middle Management' } : null)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select managerial weight" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Supervisory">Supervisory</SelectItem>
                        <SelectItem value="Middle Management">Middle Management</SelectItem>
                        <SelectItem value="Individual Contributor">Individual Contributor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Company Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-companyName" className="text-sm font-medium">Company Name *</Label>
                    <Input
                      id="edit-companyName"
                      value={editingEmployee.companyName || ''}
                      onChange={(e) => setEditingEmployee(prev => prev ? { ...prev, companyName: e.target.value } : null)}
                      placeholder="Company name"
                      className={`w-full ${editValidationErrors.companyName ? 'border-red-500' : ''}`}
                    />
                    {editValidationErrors.companyName && (
                      <p className="text-sm text-red-500">{editValidationErrors.companyName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-status" className="text-sm font-medium">Status *</Label>
                    <Select 
                      value={editingEmployee.status}
                      onValueChange={(value) => setEditingEmployee(prev => prev ? { ...prev, status: value as 'Active' | 'Inactive'} : null)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="edit-joinDate" className="text-sm font-medium">Join Date *</Label>
                    <Input
                      id="edit-joinDate"
                      type="date"
                      value={editingEmployee.joinDate || ''}
                      onChange={(e) => setEditingEmployee(prev => prev ? { ...prev, joinDate: e.target.value } : null)}
                      className={`w-full md:w-1/2 ${editValidationErrors.joinDate ? 'border-red-500' : ''}`}
                    />
                    {editValidationErrors.joinDate && (
                      <p className="text-sm text-red-500">{editValidationErrors.joinDate}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingEmployee(null);
                  setOriginalEmployee(null);
                  setEditValidationErrors({});
                }}>Cancel</Button>
                <Button onClick={handleSaveEdit}>Save Changes</Button>
              </div>
            </div>)}
        </DialogContent>
      </Dialog>

      {filteredEmployees.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No employees found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or add a new employee.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmployeeList;
