import React, { useState, useEffect } from 'react';
import { Plus, Search, Users, Building2, Edit, Trash2, Eye, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ConfirmationDialog } from '../ui/confirmation-dialog';
import { useOrganizational } from '../../contexts/OrganizationalContext';
import { apiService } from '../../services/api';
import { ApiSection, CreateSectionRequest, UpdateSectionRequest } from '../../types/api';
import { useToast } from '../../hooks/use-toast';
import { useSubDepartments, useDepartments } from '../../hooks/useApi';
import { useManagers } from '../../hooks/usemanagers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';

interface SectionsPageProps {
  onViewChange: (view: string) => void;
}

const SectionsPage: React.FC<SectionsPageProps> = ({ onViewChange }) => {
  const { selectedDepartment, selectedSubDepartment, setSection } = useOrganizational();
  const { toast } = useToast();
  const { data: subDepartmentsData, isLoading: subDepartmentsLoading } = useSubDepartments();
  const { data: departmentsData, isLoading: departmentsLoading } = useDepartments();
  
  // State for selected company ID and department ID for manager filtering
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  
  // Fetch managers for the selected company and/or department
  const { data: managersData = [], isLoading: managersLoading, error: managersError } = useManagers(selectedCompanyId, selectedDepartmentId);
  
  // Ensure managers is always an array
  const managers = React.useMemo(() => {
    return Array.isArray(managersData) ? managersData : [];
  }, [managersData]);
  
  const [sections, setSections] = useState<ApiSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingSection, setEditingSection] = useState<(ApiSection & { sub_department_id?: string }) | null>(null);
  const [newSection, setNewSection] = useState<CreateSectionRequest>({
    name: '',
    sub_department_id: '',
    manager_id: ''
  });
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<ApiSection | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get sub-departments list from API response with proper array handling
  const subDepartments = React.useMemo(() => {
    if (!subDepartmentsData) return [];
    // Handle both paginated response and direct array response
    if (Array.isArray(subDepartmentsData)) {
      return subDepartmentsData;
    }
    return subDepartmentsData.results || [];
  }, [subDepartmentsData]);

  // Get departments list from API response with proper array handling
  const departments = React.useMemo(() => {
    if (!departmentsData) return [];
    // Handle both paginated response and direct array response
    if (Array.isArray(departmentsData)) {
      return departmentsData;
    }
    return departmentsData.results || [];
  }, [departmentsData]);

  // Update selectedCompanyId and selectedDepartmentId when newSection.sub_department_id changes
  React.useEffect(() => {
    if (newSection.sub_department_id) {
      const selectedSubDept = subDepartments.find(subDept => subDept.sub_department_id === newSection.sub_department_id);
      if (selectedSubDept) {
        // Find the department that contains this sub-department
        // selectedSubDept.department contains the department name, we need to find the department ID
        const department = departments.find(dept => dept.name === selectedSubDept.department);
        const departmentId = department?.department_id || '';
        if (departmentId !== selectedDepartmentId) {
          setSelectedDepartmentId(departmentId);
        }
        // Set company ID if available
        if (selectedSubDept.company_id && selectedSubDept.company_id !== selectedCompanyId) {
          setSelectedCompanyId(selectedSubDept.company_id);
        }
      }
    } else {
      // Clear department ID when no sub-department is selected
      setSelectedDepartmentId('');
    }
  }, [newSection.sub_department_id, subDepartments, departments, selectedCompanyId, selectedDepartmentId]);

  // Load sections when component mounts - autonomous operation
  useEffect(() => {
    loadSections();
  }, [selectedSubDepartment]); // Still react to sub-department changes for filtering

  const loadSections = async () => {
    try {
      setLoading(true);
      // Load sections autonomously - filter by sub-department if selected
      const params = selectedSubDepartment?.sub_department_id 
        ? { sub_department: selectedSubDepartment.sub_department_id }
        : {};
      const response = await apiService.getSections(params);
      
      // Normalize API response - handle single object, array
      let sectionsData: any[] = [];
      
      if (Array.isArray(response)) {
        // Direct array response
        sectionsData = response;
      } else if (response && typeof response === 'object') {
        if (response.results && Array.isArray(response.results)) {
          // response with results array
          sectionsData = response.results;
        } else if (response.section_id || response.id) {
          // Single section object
          sectionsData = [response];
        } else {
          // Empty or invalid response
          sectionsData = [];
        }
      }
      
      // Map API fields to UI expected format
      const normalizedSections = sectionsData.map((section: any) => ({
        ...section,
        id: section.section_id || section.id,
        manager: section.manager_id || section.manager || 'Unassigned'
      }));
      
      setSections(normalizedSections);
    } catch (error) {
      console.error('Error loading sections:', error);
      setSections([]);
      toast({
        title: 'Error',
        description: 'Failed to load sections',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSection.sub_department_id) {
      toast({
        title: 'Error',
        description: 'Please select a sub-department',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Find the selected manager to get the user_id
      const selectedManager = managers.find(m => m.employee_id === newSection.manager_id);
      
      const sectionData: CreateSectionRequest = {
        name: newSection.name,
        sub_department_id: newSection.sub_department_id,
        manager_id: selectedManager ? selectedManager.user_id : (newSection.manager_id === "no-manager" ? '' : newSection.manager_id || '')
      };

      await apiService.createSection(sectionData);
      
      setShowCreateForm(false);
      setNewSection({ name: '', sub_department_id: '', manager_id: '' });
      loadSections();
      
      toast({
        title: 'Success',
        description: 'Section created successfully.'
      });
    } catch (error) {
      console.error('Error creating section:', error);
      toast({
        title: 'Error',
        description: 'Failed to create section',
        variant: 'destructive'
      });
    }
  };

  const handleEditSection = (section: ApiSection) => {
    // Find the sub-department ID by matching the sub-department name
    const subDepartment = subDepartments.find(sd => sd.name === section.sub_department);
    const sectionWithId = {
      ...section,
      sub_department_id: subDepartment?.sub_department_id || section.sub_department
    };
    
    // Update selectedCompanyId and selectedDepartmentId for manager filtering
    if (subDepartment) {
      // subDepartment.department contains the department name, we need to find the department ID
      const department = departments.find(dept => dept.name === subDepartment.department);
      const departmentId = department?.department_id || '';
      if (departmentId !== selectedDepartmentId) {
        setSelectedDepartmentId(departmentId);
      }
      if (subDepartment.company_id && subDepartment.company_id !== selectedCompanyId) {
        setSelectedCompanyId(subDepartment.company_id);
      }
    }
    
    setEditingSection(sectionWithId);
    setShowEditForm(true);
  };

  const handleUpdateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection || !editingSection.sub_department_id) {
      toast({
        title: 'Error',
        description: 'Please select a sub-department',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Find the selected manager to get the user_id
      const selectedManager = managers.find(m => m.employee_id === editingSection.manager);
      
      const updateData: UpdateSectionRequest = {
        name: editingSection.name,
        sub_department_id: editingSection.sub_department_id,
        manager_id: selectedManager ? selectedManager.user_id : (editingSection.manager === "no-manager" ? undefined : editingSection.manager || '')
      };

      await apiService.updateSection(editingSection.section_id, updateData);
      
      setShowEditForm(false);
      setEditingSection(null);
      loadSections();
      
      toast({
        title: 'Success',
        description: 'Section updated successfully.'
      });
    } catch (error) {
      console.error('Error updating section:', error);
      toast({
        title: 'Error',
        description: 'Failed to update section',
        variant: 'destructive'
      });
    }
  };

  // Check if section has associated sub-sections
  const checkSectionHasSubSections = async (sectionId: string) => {
    try {
      const response = await apiService.getSubSections({ section: sectionId });
      const subSectionsCount = Array.isArray(response) ? response.length : 
        (response?.results ? response.results.length : 0);
      return subSectionsCount > 0;
    } catch (error) {
      console.error('Error checking sub-sections:', error);
      return false;
    }
  };

  const handleDeleteSection = async (section: ApiSection) => {
    // Client-side validation: check if section has associated sub-sections
    const hasSubSections = await checkSectionHasSubSections(section.section_id);
    if (hasSubSections) {
      toast({
        title: 'Cannot Delete Section',
        description: 'This section has associated sub-sections that must be removed first.',
        variant: 'destructive'
      });
      return;
    }

    setSectionToDelete(section);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteSection = async () => {
    if (!sectionToDelete) return;

    setIsDeleting(true);
    try {
      await apiService.deleteSection(sectionToDelete.section_id);
      loadSections();
      toast({
        title: 'Success',
        description: 'Section deleted successfully.'
      });
    } catch (error) {
      console.error('Error deleting section:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete section. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
      setSectionToDelete(null);
    }
  };

  const cancelDeleteSection = () => {
    setShowDeleteConfirmation(false);
    setSectionToDelete(null);
  };

  const handleViewSubSections = (section: ApiSection) => {
    setSection(section);
    onViewChange('sub-sections');
  };

  // Get manager name
  const getManagerName = (managerId: string) => {
    return managerId || 'Unassigned';
  };

  // Filter sections based on search term
  const filteredSections = sections.filter(section =>
    section.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate statistics
  const totalEmployees = sections.reduce((sum, section) => sum + section.employee_count, 0);
  const averageSize = sections.length > 0 ? Math.round(totalEmployees / sections.length) : 0;

  // Show loading state or sections directly - autonomous operation
  const contextMessage = selectedSubDepartment 
    ? `Sections in ${selectedSubDepartment.name}`
    : 'All Sections - Independent View';

  // Error handling UI
  if (managersError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-red-600 mb-2">
                Error Loading Managers
              </h2>
              <p className="text-gray-600 mb-4">
                Failed to load managers data. Manager selection may be limited.
              </p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb - Dynamic based on context */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-4">
          <li>
            <button
              onClick={() => onViewChange('departments')}
              className="text-gray-400 hover:text-gray-500"
            >
              Departments
            </button>
          </li>
          {selectedDepartment && (
            <>
              <li>
                <span className="text-gray-400">/</span>
              </li>
              <li>
                <button
                  onClick={() => onViewChange('sub-departments')}
                  className="text-gray-400 hover:text-gray-500"
                >
                  {selectedDepartment.name}
                </button>
              </li>
            </>
          )}
          {selectedSubDepartment && (
            <>
              <li>
                <span className="text-gray-400">/</span>
              </li>
              <li>
                <span className="text-gray-900 font-medium">{selectedSubDepartment.name}</span>
              </li>
            </>
          )}
          {!selectedSubDepartment && (
            <>
              <li>
                <span className="text-gray-400">/</span>
              </li>
              <li>
                <span className="text-gray-900 font-medium">All Sections</span>
              </li>
            </>
          )}
        </ol>
      </nav>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sections</h1>
          <p className="text-gray-600">{contextMessage}</p>
          {!selectedSubDepartment && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Independent Navigation:</strong> You can manage sections directly without selecting a parent sub-department. 
                Use the sidebar to navigate between organizational levels.
              </p>
            </div>
          )}
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Section
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sections</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sections.length}</div>
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
            <CardTitle className="text-sm font-medium">Average Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageSize}</div>
          </CardContent>
        </Card>

      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search sections..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Create New Section</h2>
            <form onSubmit={handleCreateSection} className="space-y-4">
              <div>
                <Label htmlFor="name">Section Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={newSection.name}
                  onChange={(e) => setNewSection({ ...newSection, name: e.target.value })}
                  placeholder="Enter section name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="sub_department">Sub-Department *</Label>
                <Select 
                  value={newSection.sub_department_id}
                  onValueChange={(value) => setNewSection({ ...newSection, sub_department_id: value })}
                  disabled={subDepartmentsLoading}
                >
                  <SelectTrigger id="sub_department">
                    <SelectValue placeholder={subDepartmentsLoading ? "Loading sub-departments..." : "Select sub-department"} />
                  </SelectTrigger>
                  <SelectContent>
                    {subDepartments.map((subDept) => (
                      <SelectItem key={subDept.sub_department_id} value={subDept.sub_department_id}>
                        {subDept.name}
                      </SelectItem>
                    ))}
                    {subDepartments.length === 0 && !subDepartmentsLoading && (
                      <SelectItem value="no-sub-department" disabled>
                        No sub-departments available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {subDepartmentsLoading && (
                  <p className="text-sm text-gray-500 mt-1">Loading sub-departments...</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="manager">Manager</Label>
                <Select 
                  value={newSection.manager_id}
                  onValueChange={(value) => setNewSection({ ...newSection, manager_id: value })}
                  disabled={!newSection.sub_department_id || managersLoading}
                >
                  <SelectTrigger id="manager">
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-manager">No Manager</SelectItem>
                    {managersLoading ? (
                      <SelectItem value="loading" disabled>Loading managers...</SelectItem>
                    ) : managersError ? (
                      <SelectItem value="error" disabled>Error loading managers</SelectItem>
                    ) : managers.length === 0 ? (
                      <SelectItem value="no-managers" disabled>No managers available</SelectItem>
                    ) : (
                      managers.map((manager) => (
                        <SelectItem key={manager.employee_id} value={manager.user_id}>
                          {manager.name} - ({manager.role})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewSection({ name: '', sub_department_id: '', manager_id: '' });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Section</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {showEditForm && editingSection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Edit Section</h2>
            <form onSubmit={handleUpdateSection} className="space-y-4">
              <div>
                <Label htmlFor="edit_name">Section Name *</Label>
                <Input
                  id="edit_name"
                  type="text"
                  value={editingSection.name}
                  onChange={(e) => setEditingSection({ ...editingSection, name: e.target.value })}
                  placeholder="Enter section name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="edit_sub_department">Sub-Department *</Label>
                <Select 
                  value={editingSection.sub_department_id}
                  onValueChange={(value) => setEditingSection({ ...editingSection, sub_department_id: value })}
                  disabled={subDepartmentsLoading}
                >
                  <SelectTrigger id="edit_sub_department">
                    <SelectValue placeholder={subDepartmentsLoading ? "Loading sub-departments..." : "Select sub-department"} />
                  </SelectTrigger>
                  <SelectContent>
                    {subDepartments.map((subDept) => (
                      <SelectItem key={subDept.sub_department_id} value={subDept.sub_department_id}>
                        {subDept.name}
                      </SelectItem>
                    ))}
                    {subDepartments.length === 0 && !subDepartmentsLoading && (
                      <SelectItem value="no-sub-department" disabled>
                        No sub-departments available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {subDepartmentsLoading && (
                  <p className="text-sm text-gray-500 mt-1">Loading sub-departments...</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="edit_manager">Manager</Label>
                <Select 
                  value={editingSection.manager_id}
                  onValueChange={(value) => setEditingSection({ ...editingSection, manager_id: value })}
                  disabled={!editingSection.sub_department_id || managersLoading}
                >
                  <SelectTrigger id="edit_manager">
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-manager">No Manager</SelectItem>
                    {managersLoading ? (
                      <SelectItem value="loading" disabled>Loading managers...</SelectItem>
                    ) : managersError ? (
                      <SelectItem value="error" disabled>Error loading managers</SelectItem>
                    ) : managers.length === 0 ? (
                      <SelectItem value="no-managers" disabled>No managers available</SelectItem>
                    ) : (
                      managers.map((manager) => (
                        <SelectItem key={manager.employee_id} value={manager.user_id}>
                          {manager.name} - ({manager.role})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingSection(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Update Section</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sections Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-500">Loading sections...</div>
        </div>
      ) : filteredSections.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No sections found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating a new section.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSections.map((section) => (
            <Card key={section.section_id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{section.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Sub-Department: {section.sub_department}
                    </p>
                    <p className="text-sm text-gray-600">
                      Manager: {getManagerName(section.manager)}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleEditSection(section)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleDeleteSection(section)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Employees:</span>
                    <span className="font-medium">{section.employee_count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">
                      {new Date(section.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => handleViewSubSections(section)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Sub-Sections
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        onConfirm={confirmDeleteSection}
        onCancel={cancelDeleteSection}
        title="Delete Section"
        message={`Are you sure you want to delete the section "${sectionToDelete?.name}"? This action cannot be undone and will permanently remove the section from the system.`}
        confirmText="Delete Section"
        cancelText="Cancel"
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
};

export default SectionsPage;