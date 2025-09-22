
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
import { Users, Plus, Edit, Mail, Phone, X, Search, Filter, Trash2, FileSpreadsheet, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import EmployeeDetails from './EmployeeDetails';
import { apiService } from '@/services/api';
import { ApiEmployee, ApiDepartment, ApiCompany, CreateEmployeeRequest, ImportResponse } from '@/types/api';
import { parsePhoneNumber, formatDate } from '@/utils/dataTransformers';


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
  status: 'Active' | 'Inactive';
  companyName: string;
  orgPath: string;
  directManager: string;
  joinDate: string;
  company_id: string;
  departments_ids: string[];
  user_id: string;
  jobType: string;
  location: string;
  branch: string;
  gender?: string;
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
    employeeCode: '',
    warnings: [] as string[],
    warnings_count: 0,
    avatar: '',
    department: '',
    departmentId: '',
    position: '',
    role: 'EMP' ,
    managerialLevel: 'Individual Contributor',
    status: 'Active' ,
    companyName: 'Ninja',
    companyId: '',
    directManager: '',
    joinDate: new Date().toISOString().split('T')[0],
    jobType: 'Full-time',
    location: '',
    branch: 'Office',
    gender: '',
    username: '',
    password: 'Password123',
    firstName: '',
    lastName: ''
  });

  // Import functionality state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResponse | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Clear auto-filled form data
  const clearAutoFilledData = () => {
    setNewEmployee({
      name: '',
      email: '',
      phone: '',
      countryCode: '+966',
      employeeCode: '',
      warnings: [] as string[],
      warnings_count: 0,
      avatar: '',
      department: '',
      departmentId: '',
      position: '',
      role: 'EMP',
      managerialLevel: 'Individual Contributor',
      status: 'Active',
      companyName: 'Ninja',
      companyId: '',
      directManager: '',
      joinDate: new Date().toISOString().split('T')[0],
      jobType: 'Full-time',
      location: '',
      branch: 'Office',
      username: '',
      password: 'Password123',
      firstName: '',
      lastName: ''
    });
    setValidationErrors({});
  };





  // Transform API employee data to local Employee interface
  const transformApiEmployee = (apiEmployee: ApiEmployee): Employee => {
    const { countryCode, phone } = parsePhoneNumber(apiEmployee.phone);
    
    return {
      id: apiEmployee.employee_id,
      employeeCode: apiEmployee.employee_code,
      name: apiEmployee.name,
      email: apiEmployee.email,
      phone: phone,
      countryCode: apiEmployee.country_code || countryCode,
      warnings: apiEmployee.warnings || [],
      warningsCount: apiEmployee.warnings_count || 0,
      avatar: apiEmployee.avatar || '/placeholder.svg',
      department: apiEmployee.department && apiEmployee.department.length > 0 ? (Array.isArray(apiEmployee.department) ? apiEmployee.department.join(', ') : apiEmployee.department) : '',
      position: apiEmployee.position,
      role: apiEmployee.role as 'ADMIN' | 'HR' | 'HOD' | 'LM' | 'EMP',
      managerialLevel: apiEmployee.managerial_level as 'Individual Contributor' | 'Supervisory' | 'Middle Management',
      status: apiEmployee.status as 'Active' | 'Inactive',
      companyName: apiEmployee.company_name,
      orgPath: apiEmployee.org_path || '',
      directManager: apiEmployee.direct_manager || '',
      joinDate: apiEmployee.join_date,
      company_id: apiEmployee.company_id,
      departments_ids: [], // Will be populated from department names if needed
      user_id: apiEmployee.user_id,
      jobType: apiEmployee.job_type || '',
      location: apiEmployee.location || '',
      branch: apiEmployee.branch || ''
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

  // File validation function
  const validateFile = (file: File): boolean => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'application/csv' // .csv (alternative MIME type)
    ];
    
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid Excel or CSV file (.xlsx, .xls, or .csv)');
      return false;
    }
    
    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      alert('File size must be less than 50MB');
      return false;
    }
    
    return true;
  };

  // Drag and drop handlers
  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file && validateFile(file)) {
      setSelectedFile(file);
    }
  }, []);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle dry run validation
  const handleDryRun = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    try {
      const result = await apiService.importEmployees(selectedFile, true);
      setImportResults(result);
    } catch (error: any) {
      console.error('Dry run failed:', error);
      setImportResults({  
        status: 'imported',
        created: 0,
        updated: 0,
        message: error?.message || 'Validation failed. Please try again.',
        errors: error?.details?.errors || []
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Handle actual import
  const handleActualImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    try {
      const result = await apiService.importEmployees(selectedFile, false);
      setImportResults(result);
      
      if (result.status === 'imported' && (result.created > 0 || result.updated > 0)) {
        fetchEmployees(); // Refresh the employees list
      }
    } catch (error: any) {
      console.error('Import failed:', error);
      setImportResults({
        status: 'imported',
        created: 0,
        updated: 0,
        message: error?.message || 'Import failed. Please try again.',
        errors: error?.details?.errors || []
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Handle import modal close
  const handleImportModalClose = () => {
    setIsImportModalOpen(false);
    setImportResults(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
        console.error('API returned unexpected structure - no fallback data available');
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      if (error.response?.status === 500) {
        console.error('API server error (500) - no employees available');
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        console.error('Network error - API may be unavailable, no employees available');
      } else {
        console.error('API error - no employees available');
      }
      // Set empty array instead of fallback data
      setEmployees([]);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    fetchCompanies();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // Removed initialEmployees array - using API data exclusively

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
        const updateData: Partial<CreateEmployeeRequest> = {
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
        const updateData: Partial<CreateEmployeeRequest> = {};
        
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
        
        // Check if gender has changed
        if (editingEmployee.gender !== originalEmployee.gender) {
          userDataChanges.gender = editingEmployee.gender || '';
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
        
        // Check new employee fields
        if (editingEmployee.employeeCode !== originalEmployee.employeeCode) {
          updateData.employee_code = editingEmployee.employeeCode;
        }
        
        if (editingEmployee.directManager !== originalEmployee.directManager) {
          updateData.direct_manager = editingEmployee.directManager;
        }
        
        if (editingEmployee.jobType !== originalEmployee.jobType) {
          updateData.job_type = editingEmployee.jobType;
        }
        
        if (editingEmployee.location !== originalEmployee.location) {
          updateData.location = editingEmployee.location;
        }
        
        if (editingEmployee.branch !== originalEmployee.branch) {
          updateData.branch = editingEmployee.branch;
        }
        
        // Check warnings fields
        if (JSON.stringify(editingEmployee.warnings || []) !== JSON.stringify(originalEmployee.warnings || [])) {
          updateData.warnings = editingEmployee.warnings || [];
        }
        
        if ((editingEmployee.warnings_count || 0) !== (originalEmployee.warnings_count || 0)) {
          updateData.warnings_count = editingEmployee.warnings_count || editingEmployee.warnings?.length || 0;
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
            title: newEmployee.position || '',
            phone: fullPhoneNumber,
            gender: newEmployee.gender || ''
          },
          company_id: newEmployee.companyId,
          departments_ids: newEmployee.departmentId ? [newEmployee.departmentId] : [],
          managerial_level: newEmployee.managerialLevel,
          status: newEmployee.status,
          join_date: newEmployee.joinDate,
          employee_code: newEmployee.employeeCode,
          country_code: newEmployee.countryCode,
          warnings: newEmployee.warnings,
          warnings_count: newEmployee.warnings_count,
  
          direct_manager: newEmployee.directManager,
          job_type: newEmployee.jobType,
          location: newEmployee.location,
          branch: newEmployee.branch
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
          employeeCode: '',
          warnings: [] as string[],
          avatar: '',
          department: '',
          departmentId: '',
          position: '',
          role: 'EMP' as const,
          managerialLevel: 'Individual Contributor' as const,
          status: 'Active' as const,
          companyName: 'Ninja',
          companyId: '',
    
          directManager: '',
          joinDate: new Date().toISOString().split('T')[0],
          jobType: 'Full-time',
          location: '',
          branch: 'Office',
          username: '',
          password: 'Password123',
          firstName: '',
          lastName: '',
          gender: '',
    
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
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
            onClick={() => setIsImportModalOpen(true)}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Import Excel/CSV
          </Button>
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
              <p className="text-sm text-gray-600">Fill in the employee details below</p>
            </DialogHeader>
            <div className="space-y-6 py-4">

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
                    <Label htmlFor="gender" className="text-sm font-medium">Gender</Label>
                    <Select 
                      value={newEmployee.gender || ''} 
                      onValueChange={(value) => setNewEmployee(prev => ({ ...prev, gender: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <div className="space-y-2">
                    <Label htmlFor="employeeCode" className="text-sm font-medium">Employee Code</Label>
                    <Input
                      id="employeeCode"
                      value={newEmployee.employeeCode || ''}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, employeeCode: e.target.value }))}
                      placeholder="Employee ID/Code"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobType" className="text-sm font-medium">Job Type</Label>
                    <Select 
                      value={newEmployee.jobType} 
                      onValueChange={(value) => setNewEmployee(prev => ({ ...prev, jobType: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select job type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Full-time Remote">Full-time Remote</SelectItem>
                        <SelectItem value="Part-time Remote">Part-time Remote</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-medium">Location</Label>
                    <Input
                      id="location"
                      value={newEmployee.location || ''}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Work location"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branch" className="text-sm font-medium">Branch</Label>
                    <Select 
                      value={newEmployee.branch} 
                      onValueChange={(value) => setNewEmployee(prev => ({ ...prev, branch: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Office">Office</SelectItem>
                        <SelectItem value="Store">Store</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="directManager" className="text-sm font-medium">Direct Manager</Label>
                    <Input
                      id="directManager"
                      value={newEmployee.directManager || ''}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, directManager: e.target.value }))}
                      placeholder="Manager's name"
                      className="w-full"
                    />
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

                  {/* Warnings Section */}
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-medium">Warnings</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Add a warning..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const value = e.currentTarget.value.trim();
                              if (value) {
                                setNewEmployee(prev => ({
                                  ...prev,
                                  warnings: [...prev.warnings, value],
                                  warnings_count: prev.warnings.length + 1
                                }));
                                e.currentTarget.value = '';
                              }
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            const input = e.currentTarget.parentElement?.querySelector('input');
                            const value = input?.value.trim();
                            if (value) {
                              setNewEmployee(prev => ({
                                ...prev,
                                warnings: [...prev.warnings, value],
                                warnings_count: prev.warnings.length + 1
                              }));
                              if (input) input.value = '';
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                      
                      {/* Display warnings */}
                      {newEmployee.warnings.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-sm text-gray-600">
                            Warnings ({newEmployee.warnings_count}):
                          </div>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {newEmployee.warnings.map((warning, index) => (
                              <div key={index} className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
                                <span className="text-sm text-yellow-800">{warning}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setNewEmployee(prev => ({
                                      ...prev,
                                      warnings: prev.warnings.filter((_, i) => i !== index),
                                      warnings_count: prev.warnings.length - 1
                                    }));
                                  }}
                                  className="h-6 w-6 p-0 text-yellow-600 hover:text-yellow-800"
                                >
                                  ×
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
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
                    {employee.warningsCount > 0 && (
                        <div className="relative group">
                          {/* Compact glow effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-orange-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          {/* Compact modern badge */}
                          <Badge 
                            variant="outline" 
                            className="relative bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 border-amber-300/60 text-[10px] font-semibold shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 px-1.5 py-0.5"
                          >
                            <div className="flex items-center space-x-1">
                              <div className="w-1 h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full animate-pulse"></div>
                              <span>{employee.warningsCount}</span>
                            </div>
                          </Badge>
                        </div>
                      )}
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
                  <div className="space-y-2">
                    <Label htmlFor="edit-gender" className="text-sm font-medium">Gender</Label>
                    <Select 
                      value={editingEmployee.gender || ''} 
                      onValueChange={(value) => setEditingEmployee(prev => prev ? { ...prev, gender: value } : null)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Select 
                      value={editingEmployee.company_id || ''} 
                      onValueChange={(value) => {
                        const selectedCompany = companies.find(company => company.company_id === value);
                        setEditingEmployee(prev => prev ? { 
                          ...prev, 
                          company_id: value,
                          companyName: selectedCompany?.name || ''
                        } : null);
                      }}
                    >
                      <SelectTrigger className={`w-full ${editValidationErrors.companyName ? 'border-red-500' : ''}`}>
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
                  <div className="space-y-2">
                    <Label htmlFor="edit-employeeCode" className="text-sm font-medium">Employee Code</Label>
                    <Input
                      id="edit-employeeCode"
                      value={editingEmployee.employeeCode || ''}
                      onChange={(e) => setEditingEmployee(prev => prev ? { ...prev, employeeCode: e.target.value } : null)}
                      placeholder="Enter employee code"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-jobType" className="text-sm font-medium">Job Type</Label>
                    <Select 
                      value={editingEmployee.jobType || 'Full-time'}
                      onValueChange={(value) => setEditingEmployee(prev => prev ? { ...prev, jobType: value } : null)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select job type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Full-time Remote">Full-time Remote</SelectItem>
                        <SelectItem value="Part-time Remote">Part-time Remote</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-location" className="text-sm font-medium">Location</Label>
                    <Input
                      id="edit-location"
                      value={editingEmployee.location || ''}
                      onChange={(e) => setEditingEmployee(prev => prev ? { ...prev, location: e.target.value } : null)}
                      placeholder="Enter location"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-branch" className="text-sm font-medium">Branch</Label>
                    <Select 
                      value={editingEmployee.branch || 'Office'}
                      onValueChange={(value) => setEditingEmployee(prev => prev ? { ...prev, branch: value } : null)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Office">Office</SelectItem>
                        <SelectItem value="Store">Store</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-directManager" className="text-sm font-medium">Direct Manager</Label>
                    <Input
                      id="edit-directManager"
                      value={editingEmployee.directManager || ''}
                      onChange={(e) => setEditingEmployee(prev => prev ? { ...prev, directManager: e.target.value } : null)}
                      placeholder="Enter direct manager"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Warnings Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Warnings</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Add a warning..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const value = e.currentTarget.value.trim();
                          if (value) {
                            setEditingEmployee(prev => prev ? {
                              ...prev,
                              warnings: [...(prev.warnings || []), value],
                              warnings_count: (prev.warnings || []).length + 1
                            } : null);
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        const input = e.currentTarget.parentElement?.querySelector('input');
                        const value = input?.value.trim();
                        if (value) {
                          setEditingEmployee(prev => prev ? {
                            ...prev,
                            warnings: [...(prev.warnings || []), value],
                            warnings_count: (prev.warnings || []).length + 1
                          } : null);
                          if (input) input.value = '';
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  
                  {/* Display warnings */}
                  {editingEmployee.warnings && editingEmployee.warnings.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">
                        Warnings ({editingEmployee.warnings_count || editingEmployee.warnings.length}):
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {editingEmployee.warnings.map((warning, index) => (
                          <div key={index} className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
                            <span className="text-sm text-yellow-800">{warning}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingEmployee(prev => prev ? {
                                  ...prev,
                                  warnings: prev.warnings?.filter((_, i) => i !== index) || [],
                                  warnings_count: (prev.warnings?.length || 1) - 1
                                } : null);
                              }}
                              className="h-6 w-6 p-0 text-yellow-600 hover:text-yellow-800"
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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

      {/* Import Modal */}
      <Dialog open={isImportModalOpen} onOpenChange={handleImportModalClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Import Employees from Excel
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* File Upload Area */}
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver
                    ? 'border-green-400 bg-green-50'
                    : selectedFile
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {selectedFile ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <div className="bg-green-100 p-3 rounded-full">
                        <FileSpreadsheet className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <div className="bg-gray-100 p-3 rounded-full">
                        <Upload className="h-8 w-8 text-gray-400" />
                      </div>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        Drag and drop your Excel or CSV file here
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        or click to browse files
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleFileSelect}
                      className="bg-white hover:bg-gray-50"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Action Buttons */}
            {selectedFile && (
              <div className="flex gap-3">
                <Button
                  onClick={handleDryRun}
                  disabled={isImporting}
                  variant="outline"
                  className="flex-1 border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:border-blue-300"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Test Run (Validate Only)
                </Button>
                <Button
                  onClick={handleActualImport}
                  disabled={isImporting}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {isImporting ? 'Importing...' : 'Import Employees'}
                </Button>
              </div>
            )}

            {/* Results Display */}
            {importResults && (
              <div className={`rounded-lg p-4 ${
                (importResults.created > 0 || importResults.updated > 0 || importResults.validated_count) ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-1 rounded-full ${
                    (importResults.created > 0 || importResults.updated > 0 || importResults.validated_count) ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {(importResults.created > 0 || importResults.updated > 0 || importResults.validated_count) ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    {importResults.validated_count !== undefined ? (
                      <div>
                        <p className="font-medium text-green-800">
                          Validation completed successfully!
                        </p>
                        <div className="mt-2 bg-gray-50 p-3 rounded border">
                          <pre className="text-sm text-gray-700 font-mono">
{JSON.stringify({
  status: importResults.status,
  validated_count: importResults.validated_count,
  to_create: importResults.to_create || 0,
  to_update: importResults.to_update || 0
}, null, 2)}
                          </pre>
                        </div>
                      </div>
                    ) : (importResults.created > 0 || importResults.updated > 0) ? (
                      <div>
                        <p className="font-medium text-green-800">
                          Import completed successfully!
                        </p>
                        <div className="mt-2 flex gap-4 text-sm text-green-700">
                          <span>Created: {importResults.created}</span>
                          <span>Updated: {importResults.updated}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="font-medium text-red-800">
                        {importResults.message || 'Import failed'}
                      </p>
                    )}
                    {importResults.errors && importResults.errors.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {importResults.errors.slice(0, 5).map((error, index) => (
                          <p key={index} className="text-sm text-red-600">
                            • {error}
                          </p>
                        ))}
                        {importResults.errors.length > 5 && (
                          <p className="text-sm text-red-600">
                            ... and {importResults.errors.length - 5} more errors
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
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
