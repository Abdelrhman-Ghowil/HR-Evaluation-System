import React, { useState, useEffect } from 'react';
import { Plus, Search, Users, Building2, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { useOrganizational } from '../../contexts/OrganizationalContext';
import { apiService } from '../../services/api';
import { ApiSubSection, ApiSection, CreateSubSectionRequest } from '../../types/api';
import { useToast } from '../../hooks/use-toast';
import { useSubDepartments, useDepartments } from '../../hooks/useApi';
import { useManagers } from '../../hooks/usemanagers';
import { useAuth } from '../../hooks/useAuth';

interface SubSectionsPageProps {
  onViewChange: (view: string) => void;
}

const SubSectionsPage: React.FC<SubSectionsPageProps> = ({ onViewChange }) => {
  const { selectedDepartment, selectedSubDepartment, selectedSection } = useOrganizational();
  const { toast } = useToast();
  const { user } = useAuth();
  const canManageSubSections = user?.role === 'admin' || user?.role === 'hr';
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
  
  const [subSections, setSubSections] = useState<ApiSubSection[]>([]);
  const [sections, setSections] = useState<ApiSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingSubSection, setEditingSubSection] = useState<ApiSubSection | null>(null);
  const [newSubSection, setNewSubSection] = useState<CreateSubSectionRequest>({
    name: '',
    section_id: '',
    manager_id: ''
  });

  const handleOpenCreateForm = () => {
    setNewSubSection(prev => ({
      ...prev,
      section_id: selectedSection?.section_id || prev.section_id
    }));
    setShowCreateForm(true);
  };

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

  // Load sub-sections and sections when component mounts - autonomous operation
  useEffect(() => {
    loadSubSections();
    loadSections();
  }, [selectedSection?.section_id]); // Still react to section changes for filtering

  // Update selectedCompanyId and selectedDepartmentId when newSubSection.section changes
  React.useEffect(() => {
    if (newSubSection.section_id) {
      const selectedSectionData = sections.find(section => section.section_id === newSubSection.section_id);
      if (selectedSectionData) {
        // Find the sub-department that contains this section
        const subDepartment = subDepartments.find(subDept => subDept.name === selectedSectionData.sub_department);
        if (subDepartment) {
          // Find the department that contains this sub-department
          const department = departments.find(dept => dept.name === subDepartment.department);
          const departmentId = department?.department_id || '';
          
          // Only update if values are actually different to prevent loops
          setSelectedDepartmentId(prev => prev !== departmentId ? departmentId : prev);
          
          // Set company ID if available
          if (subDepartment.company_id) {
            setSelectedCompanyId(prev => prev !== subDepartment.company_id ? subDepartment.company_id : prev);
          }
        }
      }
    } else {
      // Clear department ID when no section is selected
      setSelectedDepartmentId(prev => prev !== '' ? '' : prev);
    }
  }, [newSubSection.section_id, sections, subDepartments, departments]);

  // Handle manager loading for edit form when editingSubSection changes
  React.useEffect(() => {
    if (editingSubSection && editingSubSection.section) {
      console.log('Edit form: useEffect triggered for editingSubSection:', editingSubSection);
      
      // Find the selected section to get sub-department info for manager loading
      const selectedSectionData = sections.find(section => section.section_id === editingSubSection.section || section.name === editingSubSection.section);
      console.log('Edit form: Found section for manager loading:', selectedSectionData);
      
      if (selectedSectionData) {
        // Find the sub-department that contains this section
        const subDepartment = subDepartments.find(subDept => subDept.name === selectedSectionData.sub_department);
        console.log('Edit form: Found sub-department for manager loading:', subDepartment);
        
        if (subDepartment) {
          // Find the department ID for manager filtering
          const department = departments.find(dept => dept.name === subDepartment.department);
          const departmentId = department?.department_id || '';
          console.log('Edit form: Department ID for manager loading:', departmentId);
          
          // Update company and department IDs for manager filtering - only if different
          if (subDepartment.company_id) {
            console.log('Edit form: Setting company ID for manager loading:', subDepartment.company_id);
            setSelectedCompanyId(prev => prev !== subDepartment.company_id ? subDepartment.company_id : prev);
          }
          
          if (departmentId) {
            console.log('Edit form: Setting department ID for manager loading:', departmentId);
            setSelectedDepartmentId(prev => prev !== departmentId ? departmentId : prev);
          }
        }
      }
    }
  }, [editingSubSection?.section, sections, subDepartments, departments]);

  // When managers finish loading for edit form, ensure manager is a valid user_id
  React.useEffect(() => {
    if (!showEditForm || !editingSubSection) return;
    if (managersLoading) return;

    const currentValue = editingSubSection.manager || '';
    const isValidUserId = managers.some(m => m.user_id === currentValue);
    if (isValidUserId) return;

    const mappedUserId = (
      managers.find(m => m.user_id === editingSubSection.manager_id)?.user_id ||
      managers.find(m => (m as any).employee_id === editingSubSection.manager_id)?.user_id ||
      managers.find(m => m.name === editingSubSection.manager)?.user_id ||
      ''
    );

    setEditingSubSection(prev => prev ? { ...prev, manager: mappedUserId } : null);
  }, [showEditForm, managersLoading, managers, editingSubSection?.manager_id, editingSubSection?.manager]);

  const loadSubSections = async () => {
    try {
      setLoading(true);
      // Load sub-sections autonomously - filter by section if selected
      const params = selectedSection?.section_id 
        ? { section: selectedSection.section_id }
        : {};
      const response = await apiService.getSubSections(params);
      
      // Normalize API response - handle single object, array, or paginated response
      let subSectionsData: any[] = [];
      
      if (Array.isArray(response)) {
        // Direct array response
        subSectionsData = response;
      } else if (response && typeof response === 'object') {
        if (response.results && Array.isArray(response.results)) {
          // Paginated response with results array
          subSectionsData = response.results;
        } else if (response.sub_section_id) {
          // Single sub-section object
          subSectionsData = [response];
        } else {
          // Empty or invalid response
          subSectionsData = [];
        }
      }
      
      // Map API fields to UI expected format
      const normalizedSubSections = subSectionsData.map((subSection: any) => ({
        ...subSection,
        id: subSection.sub_section_id || subSection.id,
        manager: subSection.manager || 'Unassigned'
      }));
      
      setSubSections(normalizedSubSections);
    } catch (error) {
      console.error('Error loading sub-sections:', error);
      setSubSections([]);
      toast({
        title: 'Error',
        description: 'Failed to load sub-sections',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async () => {
    try {
      setSectionsLoading(true);
      const response = await apiService.getSections();
      
      // Normalize API response - handle single object, array, or paginated response
      let sectionsData: any[] = [];
      
      if (Array.isArray(response)) {
        // Direct array response
        sectionsData = response;
      } else if (response && typeof response === 'object') {
        if (response.results && Array.isArray(response.results)) {
          // Paginated response with results array
          sectionsData = response.results;
        } else if (response.section_id) {
          // Single section object
          sectionsData = [response];
        } else {
          // Empty or invalid response
          sectionsData = [];
        }
      }
      
      setSections(sectionsData);
    } catch (error) {
      console.error('Error loading sections:', error);
      setSections([]);
      toast({
        title: 'Error',
        description: 'Failed to load sections',
        variant: 'destructive'
      });
    } finally {
      setSectionsLoading(false);
    }
  };

  const handleCreateSubSection = async () => {
    if (!canManageSubSections) {
      toast({ title: 'Unauthorized', description: 'You do not have permission to manage sub-sections.', variant: 'destructive' });
      return;
    }
    if (!newSubSection.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Sub-section name is required.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const subSectionData = {
        name: newSubSection.name,
        section_id: selectedSection?.section_id || newSubSection.section_id,
        manager_id: newSubSection.manager_id || null
      };

      const response = await apiService.createSubSection(subSectionData);
      setSubSections(prev => [...prev, response]);
      setShowCreateForm(false);
      setNewSubSection({ name: '', section_id: '', manager_id: '' });
      
      toast({
        title: 'Success',
        description: 'Sub-section created successfully.',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error creating sub-section:', error);
      toast({
        title: 'Error',
        description: 'Failed to create sub-section',
        variant: 'destructive'
      });
    }
  };

  const handleEditSubSectionClick = (subSection: ApiSubSection) => {
    if (!canManageSubSections) {
      toast({ title: 'Unauthorized', description: 'You do not have permission to edit sub-sections.', variant: 'destructive' });
      return;
    }
    // Find the section ID by matching the section name
    const section = sections.find(s => s.name === subSection.section);
    // Resolve manager to Select-friendly user_id for prefill
    const managerUserId = (
      managers.find(m => m.user_id === subSection.manager_id)?.user_id ||
      managers.find(m => (m as any).employee_id === subSection.manager_id)?.user_id ||
      managers.find(m => m.name === subSection.manager)?.user_id ||
      ''
    );
    const subSectionWithId = {
      ...subSection,
      section: section?.section_id || subSection.section,
      manager: managerUserId
    };
    setEditingSubSection(subSectionWithId);
    setShowEditForm(true);
  };

  const handleEditSubSection = async () => {
    if (!canManageSubSections) {
      toast({ title: 'Unauthorized', description: 'You do not have permission to update sub-sections.', variant: 'destructive' });
      return;
    }
    if (!editingSubSection || !editingSubSection.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Sub-section name is required.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await apiService.updateSubSection(editingSubSection.sub_section_id, {
        name: editingSubSection.name,
        section_id: editingSubSection.section,
        manager_id: editingSubSection.manager || null
      });
      
      setSubSections(prev => 
        prev.map(subSec => 
          subSec.sub_section_id === editingSubSection.sub_section_id ? response : subSec
        )
      );
      setShowEditForm(false);
      setEditingSubSection(null);
      
      toast({
        title: 'Success',
        description: 'Sub-section updated successfully.',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error updating sub-section:', error);
      toast({
        title: 'Error',
        description: 'Failed to update sub-section',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteSubSection = async (subSectionId: string) => {
    if (!canManageSubSections) {
      toast({ title: 'Unauthorized', description: 'You do not have permission to delete sub-sections.', variant: 'destructive' });
      return;
    }
    if (!confirm('Are you sure you want to delete this sub-section?')) {
      return;
    }

    try {
      await apiService.deleteSubSection(subSectionId);
      setSubSections(prev => 
        prev.filter(subSec => subSec.sub_section_id !== subSectionId)
      );
      
      toast({
        title: 'Success',
        description: 'Sub-section deleted successfully.',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error deleting sub-section:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete sub-section',
        variant: 'destructive'
      });
    }
  };

  // Helper function to get section name by section ID or name
  const getSectionName = (sectionIdentifier: string) => {
    const section = sections.find(s => 
      s.section_id === sectionIdentifier || s.name === sectionIdentifier
    );
    return section ? section.name : sectionIdentifier;
  };

  // Filter sub-sections based on search term
  const filteredSubSections = subSections.filter(subSec =>
    subSec.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate statistics
  const totalEmployees = subSections.reduce((sum, subSec) => sum + subSec.employee_count, 0);
  const averageSize = subSections.length > 0 ? Math.round(totalEmployees / subSections.length) : 0;

  // Context message based on section selection
  const contextMessage = selectedSection 
    ? `Sub-sections in ${selectedSection.name}`
    : 'All Sub-Sections - Independent View';

  return (
    <div className="space-y-6">
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-4">
          <li>
            <button
              onClick={() => onViewChange('companies')}
              className="text-gray-400 hover:text-gray-500"
            >
              Companies
            </button>
          </li>
          {selectedDepartment && (
            <>
              <li>
                <span className="text-gray-400">/</span>
              </li>
              <li>
                <button
                  onClick={() => {
                    onViewChange('departments');
                    if (selectedDepartment.company_id) {
                      window.location.href = `/departments?company_id=${selectedDepartment.company_id}`;
                    }
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  {selectedDepartment.company}
                </button>
              </li>
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
                <button
                  onClick={() => onViewChange('sections')}
                  className="text-gray-400 hover:text-gray-500"
                >
                  {selectedSubDepartment.name}
                </button>
              </li>
            </>
          )}
          {selectedSection && (
            <>
              <li>
                <span className="text-gray-400">/</span>
              </li>
              <li>
                <span className="text-gray-900 font-medium">{selectedSection.name}</span>
              </li>
              <li>
                <span className="text-gray-400">/</span>
              </li>
              <li>
                <span className="text-gray-900 font-medium">Sub-Sections</span>
              </li>
            </>
          )}
          {!selectedSection && (
            <>
              <li>
                <span className="text-gray-400">/</span>
              </li>
              <li>
                <span className="text-gray-900 font-medium">All Sub-Sections</span>
              </li>
            </>
          )}
        </ol>
      </nav>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sub-Sections</h1>
          <p className="text-gray-600">{contextMessage}</p>
        </div>
        {canManageSubSections && (
        <Button onClick={handleOpenCreateForm} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Sub-Section
        </Button>
        )}
      </div>

      {/* Independent Navigation Info */}
      {!selectedSection && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Building2 className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Independent Sub-Sections View
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>You are viewing all sub-sections. Select a section to filter sub-sections by that section.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sub-Sections</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subSections.length}</div>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sub-Sections</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subSections.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search sub-sections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Sub-Sections Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-32"></div>
            </div>
          ))}
        </div>
      ) : filteredSubSections.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No sub-sections found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating a new sub-section.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubSections.map((subSection) => (
            <Card key={subSection.sub_section_id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{subSection.name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    {canManageSubSections && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSubSectionClick(subSection)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSubSection(subSection.sub_section_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Section</span>
                    <span className="text-sm font-medium">{getSectionName(subSection.section)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Employees</span>
                    <Badge variant="secondary">{subSection.employee_count}</Badge>
                  </div>
                  {subSection.manager && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Manager</span>
                      <span className="text-sm">{subSection.manager}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Sub-Section Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Create New Sub-Section</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sub-Section Name
                </label>
                <Input
                  value={newSubSection.name}
                  onChange={(e) => setNewSubSection(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter sub-section name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section <span className="text-red-500">*</span>
                </label>
                <Select
                  value={newSubSection.section_id}
                  onValueChange={(value) => setNewSubSection(prev => ({ ...prev, section_id: value }))}
                  disabled={!!selectedSection || sectionsLoading}
                >
                  <SelectTrigger disabled={!!selectedSection || sectionsLoading}>
                    <SelectValue placeholder={selectedSection ? selectedSection.name : "Select a section"} />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((section) => (
                      <SelectItem key={section.section_id} value={section.section_id}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="manager-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Manager
                </Label>
                <Select
                  value={newSubSection.manager_id}
                  onValueChange={(value) => {
                    console.log('Create form: Manager selected:', value);
                    setNewSubSection(prev => ({ ...prev, manager_id: value }));
                  }}
                  disabled={managersLoading || managersData.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      managersLoading 
                        ? "Loading managers..." 
                        : managersData.length === 0 
                          ? "No managers available" 
                          : "Select a manager"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {managersData.map((manager) => (
                      <SelectItem key={manager.user_id} value={manager.user_id}>
                        {manager.name} - {manager.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {managersData.length === 0 && !managersLoading && (
                  <p className="text-sm text-gray-500 mt-1">
                    No managers available for the selected section
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewSubSection({ name: '', section: '', manager: '' });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateSubSection}>
                Create Sub-Section
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sub-Section Modal */}
      {showEditForm && editingSubSection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Edit Sub-Section</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sub-Section Name
                </label>
                <Input
                  value={editingSubSection.name}
                  onChange={(e) => setEditingSubSection(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="Enter sub-section name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section <span className="text-red-500">*</span>
                </label>
                <Select
                  value={editingSubSection.section}
                  onValueChange={(value) => setEditingSubSection(prev => prev ? { ...prev, section: value } : null)}
                  disabled={sectionsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((section) => (
                      <SelectItem key={section.section_id} value={section.section_id}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-manager-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Manager
                </Label>
                <Select
                  value={editingSubSection.manager || ''}
                  onValueChange={(value) => {
                    console.log('Edit form: Manager selected:', value);
                    setEditingSubSection(prev => prev ? { ...prev, manager: value } : null);
                  }}
                  disabled={managersLoading || managersData.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      managersLoading 
                        ? "Loading managers..." 
                        : managersData.length === 0 
                          ? "No managers available" 
                          : "Select a manager"
                    } />
                  </SelectTrigger>
                  <SelectContent>Sub-Sections
                    {managersData.map((manager) => (
                      <SelectItem key={manager.user_id} value={manager.user_id}>
                        {manager.name} - {manager.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {managersData.length === 0 && !managersLoading && (
                  <p className="text-sm text-gray-500 mt-1">
                    No managers available for the selected section
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditForm(false);
                  setEditingSubSection(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleEditSubSection}>
                Update Sub-Section
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubSectionsPage;
