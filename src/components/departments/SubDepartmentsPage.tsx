import React, { useState, useEffect } from 'react';
import { useOrganizational } from '../../contexts/OrganizationalContext';
import { apiService } from '../../services/api';
import { ApiSubDepartment, CreateSubDepartmentRequest, UpdateSubDepartmentRequest, SubDepartmentQueryParams } from '../../types/api';
import { useToast } from '../../hooks/use-toast';
import { useDepartments } from '../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Search, Plus, Edit, Trash2, Users, Building2, UserCheck, Eye } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ConfirmationDialog } from '../ui/confirmation-dialog';

interface SubDepartmentsPageProps {
  className?: string;
  onViewChange?: (view: string) => void;
}

const SubDepartmentsPage: React.FC<SubDepartmentsPageProps> = ({ className, onViewChange }) => {
  // Error boundary state
  const [renderError, setRenderError] = useState<Error | null>(null);

  // Wrap component in error boundary
  React.useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Component error:', error);
      setRenderError(new Error(error.message));
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (renderError) {
    return (
      <div className={`space-y-6 ${className || ''}`}>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-red-600 mb-2">Something went wrong</h2>
              <p className="text-gray-600 mb-4">An error occurred while loading this page.</p>
              <Button onClick={() => setRenderError(null)} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  const { selectedDepartment, setSubDepartment } = useOrganizational();
  const { toast } = useToast();
  
  // Fetch departments for dropdown
  const { data: departmentsData, isLoading: departmentsLoading, error: departmentsError } = useDepartments();
  
  const [subDepartments, setSubDepartments] = useState<ApiSubDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSubDepartment, setEditingSubDepartment] = useState<ApiSubDepartment | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [subDepartmentToDelete, setSubDepartmentToDelete] = useState<ApiSubDepartment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    manager: ''
  });

  const isDepartmentRequired = !selectedDepartment;
  const contextMessage = selectedDepartment ? `Sub-Departments in ${selectedDepartment.name}` : 'All Sub-Departments';
  
  // Extract departments array from paginated response with error handling
  const departments = React.useMemo(() => {
    if (!departmentsData) return [];
    // Handle both paginated and direct array responses
    if (Array.isArray(departmentsData)) {
      return departmentsData;
    }
    return departmentsData.results || [];
  }, [departmentsData]);

  // Debug logging
  React.useEffect(() => {
    console.log('Departments data:', departmentsData);
    console.log('Extracted departments:', departments);
    console.log('Departments loading:', departmentsLoading);
  }, [departmentsData, departments, departmentsLoading]);

  // Load sub-departments
  const loadSubDepartments = async () => {
    try {
      setLoading(true);
      
      const params: SubDepartmentQueryParams = {};
      if (selectedDepartment) {
        params.department = selectedDepartment.department_id;
      }
      
      const response = await apiService.getSubDepartments(params);
      setSubDepartments(response.results || response);
    } catch (error) {
      console.error('Failed to load sub-departments:', error);
      setSubDepartments([]);
      toast({
        title: "Error",
        description: "Failed to load sub-departments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubDepartments();
  }, [selectedDepartment]);

  // Filter sub-departments based on search
  const filteredSubDepartments = subDepartments.filter(subDept =>
    subDept.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistics
  const totalSubDepartments = filteredSubDepartments.length;
  const totalEmployees = filteredSubDepartments.reduce((sum, subDept) => sum + (subDept.employee_count || 0), 0);
  const averageEmployees = totalSubDepartments > 0 ? Math.round(totalEmployees / totalSubDepartments) : 0;

  // Handle form submission for create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Sub-department name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const createData: CreateSubDepartmentRequest = {
        name: formData.name.trim(),
        department_id: formData.department || (selectedDepartment?.department_id || ''),
        manager: formData.manager || ''
      };

      const newSubDepartment = await apiService.createSubDepartment(createData);
      
      setSubDepartments(prev => [...prev, newSubDepartment]);
      setFormData({ name: '', department: '', manager: '' });
      setIsCreateModalOpen(false);
      
      toast({
        title: "Success",
        description: "Sub-department created successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Create failed:', error);
      toast({
        title: "Error",
        description: "Failed to create sub-department",
        variant: "destructive"
      });
    }
  };

  // Handle form submission for edit
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingSubDepartment || !formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Sub-department name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const updateData: UpdateSubDepartmentRequest = {
        name: formData.name.trim(),
        department_id: formData.department || editingSubDepartment.department,
        manager: formData.manager || editingSubDepartment.manager
      };

      const updatedSubDepartment = await apiService.updateSubDepartment(editingSubDepartment.sub_department_id, updateData);
      
      setSubDepartments(prev => 
        prev.map(subDept => 
          subDept.sub_department_id === editingSubDepartment.sub_department_id 
            ? updatedSubDepartment 
            : subDept
        )
      );
      setFormData({ name: '', department: '', manager: '' });
      setEditingSubDepartment(null);
      setIsEditModalOpen(false);
      
      toast({
        title: "Success",
        description: "Sub-department updated successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Update failed:', error);
      toast({
        title: "Error",
        description: "Failed to update sub-department",
        variant: "destructive"
      });
    }
  };

  // Handle delete - open confirmation dialog with validation
  const handleDelete = async (subDepartmentId: string) => {
    const subDepartment = subDepartments.find(sd => sd.sub_department_id === subDepartmentId);
    if (!subDepartment) return;

    // Client-side validation: check if sub-department has associated sections
    try {
      const sectionsResponse = await apiService.getSections({ sub_department: subDepartmentId });
      const sectionsCount = sectionsResponse.results?.length || 0;
      
      if (sectionsCount > 0) {
        toast({
          title: "Cannot Delete Sub-Department",
          description: `This sub-department has ${sectionsCount} section(s) assigned. Please reassign or remove sections before deleting.`,
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error('Error checking sections:', error);
      // Continue with deletion if we can't check sections
    }

    setSubDepartmentToDelete(subDepartment);
    setDeleteConfirmOpen(true);
  };

  // Confirm delete sub-department
  const confirmDeleteSubDepartment = async () => {
    if (!subDepartmentToDelete) return;

    setIsDeleting(true);
    try {
      await apiService.deleteSubDepartment(subDepartmentToDelete.sub_department_id);
      
      // Remove the sub-department from the list
      setSubDepartments(prev => prev.filter(subDept => subDept.sub_department_id !== subDepartmentToDelete.sub_department_id));
      
      toast({
        title: "Success",
        description: "Sub-Department deleted successfully",
        variant: "default",
      });
      
      console.log('Sub-Department deleted successfully:', subDepartmentToDelete.name);
    } catch (err: unknown) {
      console.error('Error deleting sub-department:', err);
      const errorMessage = (err as { message: string }).message || 'Failed to delete department. Please try again';
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setSubDepartmentToDelete(null);
    }
  };

  // Cancel delete sub-department
  const cancelDeleteSubDepartment = () => {
    setDeleteConfirmOpen(false);
    setSubDepartmentToDelete(null);
  };

  // Handle view sections
  const handleViewSections = (subDepartment: ApiSubDepartment) => {
    setSubDepartment(subDepartment);
    if (onViewChange) {
      onViewChange('sections');
    }
  };

  // Open edit modal
  const openEditModal = (subDepartment: ApiSubDepartment) => {
    setEditingSubDepartment(subDepartment);
    
    // Find the department ID that matches the department name
    const matchingDepartment = departments.find(dept => dept.name === subDepartment.department);
    const departmentId = matchingDepartment ? matchingDepartment.department_id : subDepartment.department;
    
    setFormData({
      name: subDepartment.name,
      department: departmentId,
      manager: subDepartment.manager || ''
    });
    setIsEditModalOpen(true);
  };

  // Get manager name
  const getManagerName = (managerId: string) => {
    return managerId || 'Unassigned';
  };

  // Get department name
  const getDepartmentName = (departmentId: string) => {
    if (!departmentId) return 'Unknown Department';
    const department = departments.find(dept => dept.department_id === departmentId);
    return department ? department.name : departmentId;
  };

  // Error handling UI
  if (departmentsError) {
    return (
      <div className={`space-y-6 ${className || ''}`}>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-red-600 mb-2">Error Loading Departments</h2>
              <p className="text-gray-600 mb-4">Failed to load departments data. Please try refreshing the page.</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state for departments
  if (departmentsLoading && !departmentsData) {
    return (
      <div className={`space-y-6 ${className || ''}`}>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-600 mb-2">Loading...</h2>
              <p className="text-gray-500">Loading departments data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header */}
      <div className="flex flex-col space-y-4">
        {/* Breadcrumb */}
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <span className="inline-flex items-center text-sm font-medium text-gray-700">
                <Building2 className="w-4 h-4 mr-2" />
                Organization
              </span>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-sm font-medium text-gray-500">
                  {selectedDepartment ? selectedDepartment.name : 'All Departments'}
                </span>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-sm font-medium text-blue-600">
                  {selectedDepartment ? 'Sub-Departments' : 'All Sub-Departments'}
                </span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Title and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedDepartment ? `${selectedDepartment.name} Sub-Departments` : 'All Sub-Departments'}
            </h1>
            {contextMessage && (
              <p className="text-sm text-amber-600 mt-1">{contextMessage}</p>
            )}

          </div>
          
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Sub-Department
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Sub-Department</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label htmlFor="name">Sub-Department Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter sub-department name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select 
                    value={formData.department || (selectedDepartment?.department_id || '')}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                    disabled={departmentsLoading}
                  >
                    <SelectTrigger id="department">
                      <SelectValue placeholder={departmentsLoading ? "Loading departments..." : "Select department"} />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.department_id} value={dept.department_id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                      {departments.length === 0 && !departmentsLoading && (
                        <SelectItem value="" disabled>
                          No departments available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="manager">Manager</Label>
                  <Select 
                    value={formData.manager}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, manager: value }))}
                  >
                    <SelectTrigger id="manager">
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Manager</SelectItem>
                      <SelectItem value="emp1">John Doe</SelectItem>
                      <SelectItem value="emp2">Jane Smith</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create Sub-Department
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search sub-departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sub-Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubDepartments}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average per Sub-Dept</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageEmployees}</div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-Departments Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-48"></div>
            </div>
          ))}
        </div>
      ) : filteredSubDepartments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Sub-Departments Found</h3>
            <p className="text-gray-500 text-center mb-4">
              {searchTerm 
                ? `No sub-departments match "${searchTerm}"` 
                : selectedDepartment 
                  ? `No sub-departments found in ${selectedDepartment.name}` 
                  : 'No sub-departments available'
              }
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Sub-Department
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubDepartments.map((subDepartment) => (
            <Card key={subDepartment.sub_department_id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{subDepartment.name}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {getDepartmentName(subDepartment.department)}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewSections(subDepartment)}
                      title="View Sections"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(subDepartment)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(subDepartment.sub_department_id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Employees</span>
                    <Badge variant="secondary">
                      {subDepartment.employee_count || 0}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Manager</span>
                    <span className="text-sm font-medium">
                      {getManagerName(subDepartment.manager || '')}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Created</span>
                    <span className="text-sm">
                      {new Date(subDepartment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => handleViewSections(subDepartment)}
                    variant="outline"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Sections
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sub-Department</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Sub-Department Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter sub-department name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit-department">Department</Label>
              <Select 
                value={formData.department}
                onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                disabled={departmentsLoading}
              >
                <SelectTrigger id="edit-department">
                  <SelectValue placeholder={departmentsLoading ? "Loading departments..." : "Select department"} />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.department_id} value={dept.department_id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                  {departments.length === 0 && !departmentsLoading && (
                    <SelectItem value="" disabled>
                      No departments available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-manager">Manager</Label>
              <Select 
                value={formData.manager}
                onValueChange={(value) => setFormData(prev => ({ ...prev, manager: value }))}
              >
                <SelectTrigger id="edit-manager">
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Manager</SelectItem>
                  <SelectItem value="emp1">John Doe</SelectItem>
                  <SelectItem value="emp2">Jane Smith</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Update Sub-Department
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Sub-Department"
        description={`Are you sure you want to delete "${subDepartmentToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete Sub-Department"
        cancelText="Cancel"
        onConfirm={confirmDeleteSubDepartment}
        onCancel={cancelDeleteSubDepartment}
        variant="destructive"
        loading={isDeleting}
      />
    </div>
  );
};

export default SubDepartmentsPage;