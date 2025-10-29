
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Building, Users, Plus, Eye, Edit, Trash2, FileSpreadsheet, Upload, Loader2, CheckCircle, AlertCircle, ArrowLeft, Home } from 'lucide-react';
import { apiService } from '@/services/api';
import { ApiDepartment, ApiCompany, CreateDepartmentRequest, UpdateDepartmentRequest, ApiEmployee } from '@/types/api';
import { useOrganizational } from '@/contexts/OrganizationalContext';
import { useEmployees } from '@/hooks/useApi';
import { useManagers } from '@/hooks/usemanagers';
import { useToast } from '@/hooks/use-toast';

interface DepartmentListProps {
  onViewChange?: (view: string) => void;
}

const DepartmentList: React.FC<DepartmentListProps> = ({ onViewChange }) => {
  const { setDepartment } = useOrganizational();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const companyIdFromUrl = searchParams.get('company_id');
  
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [companies, setCompanies] = useState<ApiCompany[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<ApiCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [newDepartment, setNewDepartment] = useState<CreateDepartmentRequest>({
    name: '',
    company_id: '',
    manager_id: ''
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<ApiDepartment | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<ApiDepartment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Import Excel state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch employees for manager dropdown - replaced with useManagers hook
  // const { data: employeesData } = useEmployees();
  // const employees = employeesData?.results || [];

  // Get company_id from the selected company in the edit form
  const selectedCompanyId = editingDepartment?.company_id || 
    (editingDepartment?.company ? 
      companies.find(c => c.name === editingDepartment.company)?.company_id : 
      undefined);

  // Get company_id from the selected company in the add form
  const newDepartmentCompanyId = newDepartment.company_id;

  // Fetch managers (employees with roles LM, HOD, HR) for the selected company
  const { data: managers = [], isLoading: managersLoading } = useManagers(selectedCompanyId);
  
  // Fetch managers for the add department form
  const { data: newDepartmentManagers = [], isLoading: newDepartmentManagersLoading } = useManagers(newDepartmentCompanyId);

  // Fetch departments from API
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching departments from API...');
      
      let response;
      if (companyIdFromUrl) {
        // Fetch departments for specific company
        console.log(`Fetching departments for company ID: ${companyIdFromUrl}`);
        response = await apiService.getDepartmentsByCompany(companyIdFromUrl);
      } else {
        // Fetch all departments
        response = await apiService.getDepartments();
      }
      
      console.log('Departments API Response:', response);
      
      // Handle both paginated response and direct array response
      if (response && Array.isArray(response.results)) {
        // Standard paginated response
        setDepartments(response.results);
        console.log(`Successfully loaded ${response.results.length} departments from API`);
      } else if (Array.isArray(response)) {
        // Direct array response
        setDepartments(response);
        console.log(`Successfully loaded ${response.length} departments from API`);
      } else {
        console.error('Invalid departments response format:', response);
        setError('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError('Failed to load departments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch companies from API
  const fetchCompanies = async () => {
    try {
      const response = await apiService.getCompanies();
      if (response && Array.isArray(response.results)) {
        setCompanies(response.results);
      } else if (Array.isArray(response)) {
        setCompanies(response);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchCompanies();
  }, [companyIdFromUrl]);

  // Set selected company when companies are loaded and companyIdFromUrl is present
  useEffect(() => {
    if (companyIdFromUrl && companies.length > 0) {
      const company = companies.find(c => c.company_id === companyIdFromUrl);
      setSelectedCompany(company || null);
    }
  }, [companyIdFromUrl, companies]);

  // Validation function
  const validateDepartmentForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!newDepartment.name.trim()) {
      errors.name = 'Department name is required';
    }
    
    if (!newDepartment.company_id) {
      errors.company = 'Company is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle create department
  const handleCreateDepartment = async () => {
    if (!validateDepartmentForm()) {
      return;
    }

    try {
      setIsCreating(true);
      
      // Clean up the data before sending
      const departmentData: CreateDepartmentRequest = {
        name: newDepartment.name.trim(),
        company_id: newDepartment.company_id
      };
      
      // Only include manager_id if it's not empty
      // Send the employee_id as the manager_id value
      if (newDepartment.manager_id && newDepartment.manager_id.trim()) {
        // Find the selected manager to get their employee_id
        const selectedManager = newDepartmentManagers.find(m => m.user_id === newDepartment.manager_id);
        if (selectedManager) {
          departmentData.manager_id = selectedManager.employee_id;
        }
      }
      
      console.log('Creating department with data:', departmentData);
      const createdDepartment = await apiService.createDepartment(departmentData);
      
      // Add the new department to the list
      setDepartments(prev => [...prev, createdDepartment]);
      
      // Reset form and close modal
      setNewDepartment({ name: '', company_id: '', manager_id: '' });
      setValidationErrors({});
      setIsAddModalOpen(false);
      
      console.log('Department created successfully:', createdDepartment);
    } catch (err: unknown) {
      console.error('Error creating department:', err);
      
      // Handle specific API errors
      if ((err as { details: unknown }).details && typeof (err as { details: unknown }).details === 'object') {
        const apiErrors: {[key: string]: string} = {};
        Object.keys((err as { details: unknown }).details).forEach(field => {
          if (Array.isArray((err as { details: unknown }).details[field])) {
            apiErrors[field] = (err as { details: unknown }).details[field][0];
          } else {
            apiErrors[field] = (err as { details: unknown }).details[field];
          }
        });
        setValidationErrors(apiErrors);
      } else {
        const errorMessage = (err as { message: string }).message || 'Failed to create department. Please try again.';
        setValidationErrors({ general: errorMessage });
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Reset form when modal closes
  const handleModalClose = (open: boolean) => {
    setIsAddModalOpen(open);
    if (!open) {
      setNewDepartment({ name: '', company_id: '', manager_id: '' });
      setValidationErrors({});
    }
  };

  // Handle edit department
  const handleEditDepartment = (department: ApiDepartment) => {
    // Convert empty manager to "no-manager" for the dropdown
    const departmentForEdit = {
      ...department,
      manager: department.manager || 'no-manager'
    };
    setEditingDepartment(departmentForEdit);
    setIsEditModalOpen(true);
  };

  // Handle update department
  const handleUpdateDepartment = async () => {
    if (!editingDepartment) return;

    setIsUpdating(true);
    setValidationErrors({});

    try {
      const updateData: UpdateDepartmentRequest = {
        name: editingDepartment.name
      };
      
      // Only include manager_id field if it's not 'no-manager'
      // Send the employee_id as the manager_id value
      if (editingDepartment.manager && editingDepartment.manager !== 'no-manager') {
        updateData.manager_id = editingDepartment.manager; // This should be the employee_id from the dropdown
      }

      const updatedDepartment = await apiService.updateDepartment(editingDepartment.department_id, updateData);
      
      // Update the department in the list
      setDepartments(prev => prev.map(dept => 
        dept.department_id === editingDepartment.department_id ? updatedDepartment : dept
      ));
      
      // Close modal and reset state
      setIsEditModalOpen(false);
      setEditingDepartment(null);
      
      console.log('Department updated successfully:', updatedDepartment);
    } catch (err: unknown) {
      console.error('Error updating department:', err);
      
      // Handle specific API errors
      if ((err as { details: unknown }).details && typeof (err as { details: unknown }).details === 'object') {
        const apiErrors: {[key: string]: string} = {};
        Object.keys((err as { details: unknown }).details).forEach(field => {
          if (Array.isArray((err as { details: unknown }).details[field])) {
            apiErrors[field] = (err as { details: unknown }).details[field][0];
          } else {
            apiErrors[field] = (err as { details: unknown }).details[field];
          }
        });
        setValidationErrors(apiErrors);
      } else {
        const errorMessage = (err as { message: string }).message || 'Failed to update department. Please try again.';
        setValidationErrors({ general: errorMessage });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete department - open confirmation dialog
  const handleDeleteDepartment = (department: ApiDepartment) => {
    // Client-side validation: check if department has associated records
    if (department.employee_count && department.employee_count > 0) {
      toast({
        title: "Cannot Delete Department",
        description: `This department has ${department.employee_count} employee(s) assigned. Please reassign or remove employees before deleting.`,
        variant: "destructive",
      });
      return;
    }

    setDepartmentToDelete(department);
    setDeleteConfirmOpen(true);
  };

  // Confirm delete department
  const confirmDeleteDepartment = async () => {
    if (!departmentToDelete) return;

    setIsDeleting(true);
    try {
      await apiService.deleteDepartment(departmentToDelete.department_id);
      
      // Remove the department from the list
      setDepartments(prev => prev.filter(dept => dept.department_id !== departmentToDelete.department_id));
      
      toast({
        title: "Success",
        description: "Department deleted successfully",
        variant: "default",
      });
      
      console.log('Department deleted successfully:', departmentToDelete.name);
    } catch (err: unknown) {
      console.error('Error deleting department:', err);
      const errorMessage = (err as { message: string }).message || 'Failed to delete department. Please try again.';
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setDepartmentToDelete(null);
    }
  };

  // Cancel delete department
  const cancelDeleteDepartment = () => {
    setDeleteConfirmOpen(false);
    setDepartmentToDelete(null);
  };

  // Reset edit form when modal closes
  const handleEditModalClose = (open: boolean) => {
    setIsEditModalOpen(open);
    if (!open) {
      setEditingDepartment(null);
      setValidationErrors({});
    }
  };

  // File handling functions for import
  const validateFile = (file: File): string | null => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'application/csv' // .csv alternative
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return 'Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file.';
    }
    
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return 'File size must be less than 50MB.';
    }
    
    return null;
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const error = validateFile(file);
      if (error) {
        setUploadStatus('error');
        setUploadMessage(error);
        return;
      }
      setSelectedFile(file);
      setUploadStatus('idle');
      setUploadMessage('');
    }
  };

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
      const error = validateFile(file);
      if (error) {
        setUploadStatus('error');
        setUploadMessage(error);
        return;
      }
      setSelectedFile(file);
      setUploadStatus('idle');
      setUploadMessage('');
    }
  };

  const handleFileUpload = async (dryRun: boolean = false) => {
    if (!selectedFile) return;

    setUploadStatus('uploading');
    setUploadMessage(dryRun ? 'Validating file...' : 'Uploading file...');

    try {
      const response = await apiService.importHierarchy(selectedFile, dryRun);
      setUploadStatus('success');
      
      if (dryRun) {
        setUploadMessage('File validation completed successfully! No errors found.');
      } else {
        setUploadMessage('Hierarchy imported successfully!');
        // Refresh the departments list
        await fetchDepartments();
        
        // Close modal after a short delay
        setTimeout(() => {
          resetImportModal();
        }, 2000);
      }
    } catch (error: unknown) {
      console.error('Error uploading file:', error);
      setUploadStatus('error');
      const errorMessage = (error as { message?: string }).message || (dryRun ? 'File validation failed. Please check your file format.' : 'Failed to import hierarchy. Please try again.');
      setUploadMessage(errorMessage);
    }
  };

  const resetImportModal = () => {
    setIsImportModalOpen(false);
    setSelectedFile(null);
    setIsDragOver(false);
    setUploadStatus('idle');
    setUploadMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedCompany ? `${selectedCompany.name} - Departments` : 'Departments'}
            </h2>
            <p className="text-gray-600">
              {selectedCompany ? `Manage departments for ${selectedCompany.name}` : 'Manage organizational departments'}
            </p>
          </div>
          <Button className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Department
          </Button>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading departments...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedCompany ? `${selectedCompany.name} - Departments` : 'Departments'}
            </h2>
            <p className="text-gray-600">
              {selectedCompany ? `Manage departments for ${selectedCompany.name}` : 'Manage organizational departments'}
            </p>
          </div>
          <Button className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Department
          </Button>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchDepartments} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm" aria-label="Breadcrumb">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/companies')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 p-2"
        >
          <Home className="h-4 w-4" />
          Companies
        </Button>
        {selectedCompany ? (
          <>
            <span className="text-gray-400">/</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/departments?company_id=${selectedCompany.company_id}`)}
              className="text-gray-600 hover:text-gray-900 p-2"
            >
              {selectedCompany.name}
            </Button>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">Departments</span>
          </>
        ) : (
          <>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">Departments</span>
          </>
        )}
      </nav>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedCompany ? `${selectedCompany.name} - Departments` : 'Departments'}
            </h2>
            {selectedCompany && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/companies')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Return to Companies
              </Button>
            )}
          </div>
          <p className="text-gray-600">
            {selectedCompany ? `Manage departments for ${selectedCompany.name}` : 'Manage organizational departments'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Import Hierarchy
          </Button>
          <Dialog open={isAddModalOpen} onOpenChange={handleModalClose}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Add New Department</DialogTitle>
                <p className="text-sm text-gray-600">Create a new department for your organization</p>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {validationErrors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-600">{validationErrors.general}</p>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="department-name" className="text-sm font-medium">Department Name *</Label>
                    <Input
                      id="department-name"
                      placeholder="e.g., Human Resources, Engineering, Marketing"
                      value={newDepartment.name}
                      onChange={(e) => setNewDepartment(prev => ({ ...prev, name: e.target.value }))}
                      className={validationErrors.name ? 'border-red-500' : ''}
                    />
                    {validationErrors.name && (
                      <p className="text-sm text-red-500">{validationErrors.name}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-sm font-medium">Company *</Label>
                    <Select
                      value={newDepartment.company_id}
                      onValueChange={(value) => setNewDepartment(prev => ({ ...prev, company_id: value }))}
                    >
                      <SelectTrigger className={validationErrors.company ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select a company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.company_id} value={company.company_id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {validationErrors.company && (
                      <p className="text-sm text-red-500">{validationErrors.company}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="manager" className="text-sm font-medium">Manager (Optional)</Label>
                    <Select
                      value={newDepartment.manager_id || 'no-manager'}
                      onValueChange={(value) => setNewDepartment(prev => ({ 
                        ...prev, 
                        manager_id: value === 'no-manager' ? '' : value 
                      }))}
                    >
                      <SelectTrigger className={validationErrors.manager ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select a manager (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {newDepartmentManagersLoading ? (
                          <SelectItem value="loading" disabled>Loading managers...</SelectItem>
                        ) : (
                          <>
                            <SelectItem value="no-manager">No Manager</SelectItem>
                            {Array.isArray(newDepartmentManagers) && newDepartmentManagers.map((manager) => (
                            <SelectItem key={manager.employee_id} value={manager.user_id}>
                              {manager.name} ({manager.role})
                            </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    {validationErrors.manager && (
                      <p className="text-sm text-red-500">{validationErrors.manager}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => handleModalClose(false)} disabled={isCreating}>
                  Cancel
                </Button>
                <Button onClick={handleCreateDepartment} disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Department'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Import Excel Modal */}
      <Dialog open={isImportModalOpen} onOpenChange={(open) => {
        setIsImportModalOpen(open);
        if (!open) resetImportModal();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-blue-600" />
              Import Hierarchy File
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-2">
              Upload an Excel (.xlsx, .xls) or CSV file to import organizational hierarchy. You can validate your file first before importing.
            </p>
          </DialogHeader>
          <div className="space-y-6">
            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
                isDragOver
                  ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-lg'
                  : selectedFile
                  ? 'border-green-500 bg-green-50 shadow-md'
                  : uploadStatus === 'error'
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleFileSelect}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {selectedFile ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="bg-green-100 p-4 rounded-full animate-pulse">
                      <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="text-lg font-medium text-gray-900 truncate max-w-xs">
                            {selectedFile.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type.includes('sheet') ? 'Excel' : 'CSV'} File
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setUploadStatus('idle');
                          setUploadMessage('');
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileSelect();
                    }}
                    className="bg-white hover:bg-gray-50 border-dashed"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Different File
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-center">
                    <div className={`p-4 rounded-full transition-colors ${
                      isDragOver ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Upload className={`h-12 w-12 transition-colors ${
                        isDragOver ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xl font-medium text-gray-900">
                      {isDragOver ? 'Drop your file here' : 'Drag and drop your file here'}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      or click to browse files from your computer
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <Button
                      onClick={handleFileSelect}
                      className="bg-blue-600 hover:bg-blue-700 px-6 py-2"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Browse Files
                    </Button>
                    <p className="text-xs text-gray-400">
                      Supported formats: .xlsx, .xls, .csv (Max 50MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* File Requirements */}
            <div className="bg-gray-50 rounded-lg p-4 border">
              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                File Requirements
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Excel (.xlsx, .xls) or CSV files
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Maximum file size: 50MB
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Required columns: Company, Department, Manager
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  UTF-8 encoding recommended
                </div>
              </div>
            </div>

            {/* Upload Status */}
            {uploadMessage && (
              <div className={`p-4 rounded-lg border-l-4 ${
                uploadStatus === 'success' 
                  ? 'bg-green-50 border-green-400 border border-green-200' 
                  : uploadStatus === 'error'
                  ? 'bg-red-50 border-red-400 border border-red-200'
                  : 'bg-blue-50 border-blue-400 border border-blue-200'
              }`}>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {uploadStatus === 'uploading' && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
                    {uploadStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                    {uploadStatus === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      uploadStatus === 'success' 
                        ? 'text-green-800' 
                        : uploadStatus === 'error'
                        ? 'text-red-800'
                        : 'text-blue-800'
                    }`}>
                      {uploadStatus === 'uploading' ? 'Processing...' : 
                       uploadStatus === 'success' ? 'Success!' : 'Error'}
                    </p>
                    <p className={`text-sm mt-1 ${
                      uploadStatus === 'success' 
                        ? 'text-green-700' 
                        : uploadStatus === 'error'
                        ? 'text-red-700'
                        : 'text-blue-700'
                    }`}>
                      {uploadMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={resetImportModal}
              disabled={uploadStatus === 'uploading'}
              className="order-3 sm:order-1"
            >
              Cancel
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleFileUpload(true)}
              disabled={!selectedFile || uploadStatus === 'uploading'}
              className="border-amber-500 text-amber-700 hover:bg-amber-50 hover:border-amber-600 order-2 sm:order-2 transition-all duration-200"
            >
              {uploadStatus === 'uploading' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Test Run (Validate Only)
                </>
              )}
            </Button>
            <Button 
              onClick={() => handleFileUpload(false)}
              disabled={!selectedFile || uploadStatus === 'uploading'}
              className="bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 order-1 sm:order-3"
            >
              {uploadStatus === 'uploading' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Hierarchy
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {departments.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No departments found</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((department) => (
            <Card key={department.department_id} className="hover:shadow-md transition-all duration-200">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="bg-teal-100 p-2 rounded-lg">
                    <Building className="h-6 w-6 text-teal-600" />
                  </div>
                  <CardTitle>{department.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {department.employee_count || 0} employees
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Manager</p>
                  <p className="font-medium text-gray-900">{department.manager || 'Not assigned'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Company</p>
                  <p className="font-medium text-gray-900">{department.company}</p>
                </div>
                <div className="pt-3 border-t space-y-2">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 flex items-center gap-2"
                      onClick={() => handleEditDepartment(department)}
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteDepartment(department)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                  {onViewChange && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full flex items-center gap-2"
                      onClick={() => {
                        setDepartment(department);
                        onViewChange('sub-departments');
                      }}
                    >
                      <Eye className="h-4 w-4" />
                      View Sub-Departments
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Department Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={handleEditModalClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {validationErrors.general && (
              <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                {validationErrors.general}
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <div className="col-span-3">
                <Input
                  id="edit-name"
                  value={editingDepartment?.name || ''}
                  onChange={(e) => setEditingDepartment(prev => 
                    prev ? { ...prev, name: e.target.value } : null
                  )}
                  className={validationErrors.name ? 'border-red-500' : ''}
                  placeholder="Enter department name"
                />
                {validationErrors.name && (
                  <p className="text-red-600 text-sm mt-1">{validationErrors.name}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-company" className="text-right">
                Company
              </Label>
              <div className="col-span-3">
                <Select
                  value={editingDepartment?.company || ''}
                  onValueChange={(value) => setEditingDepartment(prev => 
                    prev ? { ...prev, company: value } : null
                  )}
                >
                  <SelectTrigger className={validationErrors.company ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.company_id} value={company.name}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.company && (
                  <p className="text-red-600 text-sm mt-1">{validationErrors.company}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-manager" className="text-right">
                Manager
              </Label>
              <div className="col-span-3">
                <Select
                  value={editingDepartment?.manager || 'no-manager'}
                  onValueChange={(value) => setEditingDepartment(prev => 
                    prev ? { 
                      ...prev, 
                      manager: value === 'no-manager' ? '' : value
                    } : null
                  )}
                >
                  <SelectTrigger className={validationErrors.manager ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select a manager (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {managersLoading ? (
                      <SelectItem value="loading" disabled>Loading managers...</SelectItem>
                    ) : (
                      <>
                        <SelectItem value="no-manager">No Manager</SelectItem>
                        {Array.isArray(managers) && managers.map((manager) => (
                          <SelectItem key={manager.employee_id} value={manager.user_id}>
                            {manager.name} ({manager.role})
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                {validationErrors.manager && (
                  <p className="text-red-600 text-sm mt-1">{validationErrors.manager}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => handleEditModalClose(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateDepartment}
              disabled={isUpdating || !editingDepartment?.name.trim()}
            >
              {isUpdating ? 'Updating...' : 'Update Department'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Department"
        description={`Are you sure you want to delete the department "${departmentToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete Department"
        cancelText="Cancel"
        onConfirm={confirmDeleteDepartment}
        onCancel={cancelDeleteDepartment}
        variant="destructive"
        loading={isDeleting}
      />
    </div>
  );
};

export default DepartmentList;