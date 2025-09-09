
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Building, Users, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { apiService } from '@/services/api';
import { ApiDepartment, ApiCompany, CreateDepartmentRequest, UpdateDepartmentRequest, ApiEmployee } from '@/types/api';
import { useOrganizational } from '@/contexts/OrganizationalContext';
import { useEmployees } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';

interface DepartmentListProps {
  onViewChange?: (view: string) => void;
}

const DepartmentList: React.FC<DepartmentListProps> = ({ onViewChange }) => {
  const { setDepartment } = useOrganizational();
  const { toast } = useToast();
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [companies, setCompanies] = useState<ApiCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [newDepartment, setNewDepartment] = useState<CreateDepartmentRequest>({
    name: '',
    company_id: '',
    manager: ''
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<ApiDepartment | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<ApiDepartment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch employees for manager dropdown
  const { data: employeesData } = useEmployees();
  const employees = employeesData?.results || [];

  // Fetch departments from API
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching departments from API...');
      const response = await apiService.getDepartments();
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
  }, []);

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
      
      // Only include manager if it's not empty
      if (newDepartment.manager && newDepartment.manager.trim()) {
        departmentData.manager = newDepartment.manager.trim();
      }
      
      console.log('Creating department with data:', departmentData);
      const createdDepartment = await apiService.createDepartment(departmentData);
      
      // Add the new department to the list
      setDepartments(prev => [...prev, createdDepartment]);
      
      // Reset form and close modal
      setNewDepartment({ name: '', company_id: '', manager: '' });
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
      setNewDepartment({ name: '', company_id: '', manager: '' });
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
      
      // Only include manager field if it's not 'no-manager'
      if (editingDepartment.manager && editingDepartment.manager !== 'no-manager') {
        updateData.manager = editingDepartment.manager;
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Departments</h2>
            <p className="text-gray-600">Manage organizational departments</p>
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
            <h2 className="text-2xl font-bold text-gray-900">Departments</h2>
            <p className="text-gray-600">Manage organizational departments</p>
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Departments</h2>
          <p className="text-gray-600">Manage organizational departments</p>
        </div>
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
                  <Input
                    id="manager"
                    placeholder="e.g., John Doe, jane.smith@company.com"
                    value={newDepartment.manager || ''}
                    onChange={(e) => setNewDepartment(prev => ({ ...prev, manager: e.target.value }))}
                    className={validationErrors.manager ? 'border-red-500' : ''}
                  />
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
                  value={editingDepartment?.manager || ''}
                  onValueChange={(value) => setEditingDepartment(prev => 
                    prev ? { ...prev, manager: value } : null
                  )}
                >
                  <SelectTrigger className={validationErrors.manager ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select a manager (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-manager">No Manager</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.employee_id} value={employee.name}>
                        {employee.name}
                      </SelectItem>
                    ))}
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