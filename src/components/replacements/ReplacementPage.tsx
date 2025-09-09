import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, UserCheck, Building, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '../../hooks/use-toast';
import { usePlacements, useCreatePlacement, useUpdatePlacement, useDeletePlacement, useCompanies, useDepartments, useSubDepartments } from '../../hooks/useApi';
import { ApiPlacement, CreatePlacementRequest, ApiCompany, ApiDepartment, ApiSubDepartment, ApiSection, ApiSubSection } from '../../types/api';
import HierarchicalDropdown from './HierarchicalDropdown';
import { apiService } from '../../services/api';



const ReplacementPage: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingPlacement, setEditingPlacement] = useState<ApiPlacement | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [newPlacement, setNewPlacement] = useState<CreatePlacementRequest>({
    employee_id: '',
    company_id: '',
    department_id: '',
    sub_department_id: '',
    section_id: '',
    sub_section_id: ''
  });
  const [sections, setSections] = useState<ApiSection[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState<boolean>(false);
  const [subSections, setSubSections] = useState<ApiSubSection[]>([]);
  const [subSectionsLoading, setSubSectionsLoading] = useState<boolean>(false);

  // API Hooks
  const { data: placements = [], isLoading: loading, error } = usePlacements();
  const { data: companiesData, isLoading: companiesLoading } = useCompanies();
  const { data: departmentsData, isLoading: departmentsLoading } = useDepartments(
    selectedCompanyId ? { company: selectedCompanyId } : undefined,
    { enabled: !!selectedCompanyId }
  );
  const { data: subDepartmentsData, isLoading: subDepartmentsLoading, error: subDepartmentsError } = useSubDepartments(
    selectedDepartmentId ? { department: selectedDepartmentId } : undefined,
    { enabled: !!selectedDepartmentId }
  );

  // Handle sub-departments API error
  useEffect(() => {
    if (subDepartmentsError) {
      toast({
        title: "Error loading sub departments",
        description: "Failed to load sub departments. Please try again.",
        variant: "destructive"
      });
    }
  }, [subDepartmentsError, toast]);
  const createPlacementMutation = useCreatePlacement();
  const updatePlacementMutation = useUpdatePlacement();
  const deletePlacementMutation = useDeletePlacement();

  // Extract data arrays from API responses
  const companies = Array.isArray(companiesData) ? companiesData : (companiesData?.results || []);
  const departments = Array.isArray(departmentsData) ? departmentsData : (departmentsData?.results || []);
  const subDepartments = Array.isArray(subDepartmentsData) ? subDepartmentsData : (subDepartmentsData?.results || []);

  // Set selected company when editing placement
  useEffect(() => {
    if (editingPlacement && showEditForm) {
      setSelectedCompanyId(editingPlacement.company_id);
      setSelectedDepartmentId(editingPlacement.department_id || '');
    } else if (!showEditForm) {
      setSelectedCompanyId('');
      setSelectedDepartmentId('');
    }
  }, [editingPlacement, showEditForm]);

  // Handle department change with cascading resets
  const handleDepartmentChange = (departmentId: string) => {
    if (editingPlacement) {
      setEditingPlacement({
        ...editingPlacement,
        department_id: departmentId,
        sub_department_id: '',
        sub_department_name: 'Not assigned',
        section_id: '',
        section_name: 'Not assigned',
        sub_section_id: '',
        sub_section_name: 'Not assigned'
      });
      setSelectedDepartmentId(departmentId);
      setSections([]);
    }
  };

  // Handle sub-department change
  const handleSubDepartmentChange = (subDepartmentId: string) => {
     if (editingPlacement) {
       const selectedSubDept = subDepartments.find(sd => sd.sub_department_id === subDepartmentId);
       setEditingPlacement({
         ...editingPlacement,
         sub_department_id: subDepartmentId,
         sub_department_name: selectedSubDept?.name || 'Not assigned',
         section_id: '',
         section_name: 'Not assigned',
         sub_section_id: '',
         sub_section_name: 'Not assigned'
       });
       setSections([]);
     }
   };

   const handleSectionChange = (sectionId: string) => {
    if (editingPlacement) {
      const selectedSection = sections.find(s => s.section_id === sectionId);
      setEditingPlacement({
        ...editingPlacement,
        section_id: sectionId,
        section_name: selectedSection?.name || 'Not assigned',
        sub_section_id: '',
        sub_section_name: 'Not assigned'
      });
      // Clear sub-sections when section changes
     setSubSections([]);
   }
 };

 const handleSubSectionChange = (subSectionId: string) => {
   if (editingPlacement) {
     const selectedSubSection = subSections.find(ss => ss.sub_section_id === subSectionId);
     setEditingPlacement({
       ...editingPlacement,
       sub_section_id: subSectionId,
       sub_section_name: selectedSubSection?.name || 'Not assigned'
     });
   }
 };

   useEffect(() => {
     const loadSections = async () => {
       if (!editingPlacement?.sub_department_id) {
         setSections([]);
         return;
       }
       try {
         setSectionsLoading(true);
         const response: any = await apiService.getSections({ sub_department: editingPlacement.sub_department_id });
         let sectionsData: any[] = [];
         if (Array.isArray(response)) {
           sectionsData = response;
         } else if (response && typeof response === 'object') {
           if (Array.isArray(response.results)) {
             sectionsData = response.results;
           } else if ((response as any).section_id) {
             sectionsData = [response];
           } else {
             sectionsData = [];
           }
         }
         setSections(sectionsData);
       } catch (e) {
         console.error('Error loading sections:', e);
         setSections([]);
         toast({
           title: 'Error loading sections',
           description: 'Failed to load sections. Please try again.',
           variant: 'destructive'
         });
       } finally {
         setSectionsLoading(false);
       }
     };
     loadSections();
   }, [editingPlacement?.sub_department_id]);

  // Load sub-sections when section is selected
  useEffect(() => {
    const loadSubSections = async () => {
      if (!editingPlacement?.section_id) {
        setSubSections([]);
        return;
      }
      try {
        setSubSectionsLoading(true);
        const response: any = await apiService.getSubSections({ section: editingPlacement.section_id });
        let subSectionsData: any[] = [];
        if (Array.isArray(response)) {
          subSectionsData = response;
        } else if (response && typeof response === 'object') {
          if (Array.isArray(response.results)) {
            subSectionsData = response.results;
          } else if ((response as any).sub_section_id) {
            subSectionsData = [response];
          } else {
            subSectionsData = [];
          }
        }
        setSubSections(subSectionsData);
      } catch (e) {
        console.error('Error loading sub-sections:', e);
        setSubSections([]);
        toast({
          title: 'Error loading sub-sections',
          description: 'Failed to load sub-sections. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setSubSectionsLoading(false);
      }
    };
    loadSubSections();
  }, [editingPlacement?.section_id]);

  // Debug logging
  console.log('Placements API Response:', placements);
  console.log('Placements Array:', placements);
  console.log('Loading state:', loading);
  console.log('Error state:', error);



  const handleCreatePlacement = () => {
    const payload = {
      employee_id: newPlacement.employee_id,
      company_id: newPlacement.company_id,
      department_id: newPlacement.department_id,
      ...(newPlacement.sub_department_id && { sub_department_id: newPlacement.sub_department_id }),
      ...(newPlacement.section_id && { section_id: newPlacement.section_id }),
      ...(newPlacement.sub_section_id && { sub_section_id: newPlacement.sub_section_id })
    };

    createPlacementMutation.mutate(payload, {
      onSuccess: () => {
        setShowCreateForm(false);
        setNewPlacement({
          employee_id: '',
          company_id: '',
          department_id: '',
          sub_department_id: '',
          section_id: '',
          sub_section_id: ''
        });
      }
    });
  };

  const handleEditPlacement = () => {
    if (!editingPlacement) return;

    const payload = {
      employee_id: editingPlacement.employee_id,
      company_id: editingPlacement.company_id,
      department_id: editingPlacement.department_id,
      ...(editingPlacement.sub_department_id && { sub_department_id: editingPlacement.sub_department_id }),
      ...(editingPlacement.section_id && { section_id: editingPlacement.section_id }),
      ...(editingPlacement.sub_section_id && { sub_section_id: editingPlacement.sub_section_id })
    };

    updatePlacementMutation.mutate(
      { id: editingPlacement.placement_id, data: payload },
      {
        onSuccess: () => {
          setShowEditForm(false);
          setEditingPlacement(null);
          setSelectedCompanyId('');
          toast({
            title: "Success",
            description: "Placement updated successfully",
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: "Failed to update placement",
            variant: "destructive",
          });
        }
      }
    );
  };

  const handleCompanyChange = (companyId: string) => {
    if (editingPlacement) {
      setEditingPlacement({
        ...editingPlacement,
        company_id: companyId,
        company_name: companies.find(c => c.company_id === companyId)?.name || '',
        department_id: '', // Reset department when company changes
        department_name: ''
      });
    }
    setSelectedCompanyId(companyId);
  };



  const handleDeletePlacement = (placementId: string) => {
    if (!confirm('Are you sure you want to delete this placement?')) return;
    deletePlacementMutation.mutate(placementId);
  };

  const filteredPlacements = placements.filter(placement =>
    placement.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    placement.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    placement.department_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <UserCheck className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Replacements</h1>
            <p className="text-gray-600">Manage employee placements and assignments</p>
          </div>
        </div>
        
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Placement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Placement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <HierarchicalDropdown
                values={{
                  employee_id: newPlacement.employee_id || '',
                  company_id: newPlacement.company_id || '',
                  department_id: newPlacement.department_id || '',
                  sub_department_id: newPlacement.sub_department_id || '',
                  section_id: newPlacement.section_id || '',
                  sub_section_id: newPlacement.sub_section_id || ''
                }}
                onChange={(field, value) => {
                  setNewPlacement(prev => ({ ...prev, [field]: value }));
                }}
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePlacement}>
                  Create Placement
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by employee, company, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placements Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Placements ({filteredPlacements.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading placements...</p>
            </div>
          ) : filteredPlacements.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No placements found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium text-gray-700">Employee</th>
                    <th className="text-left p-3 font-medium text-gray-700">Company</th>
                    <th className="text-left p-3 font-medium text-gray-700">Department</th>
                    <th className="text-left p-3 font-medium text-gray-700">Sub-Department</th>
                    <th className="text-left p-3 font-medium text-gray-700">Section</th>
                    <th className="text-left p-3 font-medium text-gray-700">Sub-Section</th>
                    <th className="text-left p-3 font-medium text-gray-700">Assigned At</th>
                    <th className="text-left p-3 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlacements.map((placement) => (
                    <tr key={placement.placement_id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium text-gray-900">{placement.employee_name}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-gray-900">{placement.company_name}</div>
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary">{placement.department_name}</Badge>
                      </td>
                      <td className="p-3">
                        {placement.sub_department_name ? (
                          <Badge variant="outline">{placement.sub_department_name}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {placement.section_name ? (
                          <Badge variant="outline">{placement.section_name}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {placement.sub_section_name ? (
                          <Badge variant="outline">{placement.sub_section_name}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-gray-600">{formatDate(placement.assigned_at)}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const companyName = companies.find(c => c.company_id === placement.company_id)?.name || '';
                              setEditingPlacement({
                                ...placement,
                                company_name: companyName
                              });
                              setSelectedCompanyId(placement.company_id);
                              setShowEditForm(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePlacement(placement.placement_id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Placement Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Placement</DialogTitle>
          </DialogHeader>
          {editingPlacement && (
            <div className="space-y-4">
                <div>
                   <Label htmlFor="employee_name">Employee</Label>
                   <Input
                     id="employee_name"
                     value={editingPlacement.employee_name || ''}
                     readOnly
                     className="bg-gray-50 cursor-not-allowed"
                     placeholder="Employee name"
                   />
                 </div>
                <div>
                   <Label htmlFor="company_select">Company</Label>
                   {editingPlacement.company_id && editingPlacement.company_name ? (
                     <div className="flex items-center justify-between p-2 border rounded-md bg-gray-50">
                       <span className="text-sm font-medium">{editingPlacement.company_name}</span>
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => {
                           setEditingPlacement({...editingPlacement, company_id: '', company_name: ''});
                           setSelectedCompanyId('');
                         }}
                         className="text-blue-600 hover:text-blue-700"
                       >
                         Change
                       </Button>
                     </div>
                   ) : (
                     <Select
                       value={editingPlacement.company_id || ''}
                       onValueChange={handleCompanyChange}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder="Select a company" />
                       </SelectTrigger>
                       <SelectContent>
                         {companiesLoading ? (
                           <SelectItem value="loading" disabled>Loading companies...</SelectItem>
                         ) : (
                           companies.map((company: ApiCompany) => (
                             <SelectItem key={company.company_id} value={company.company_id}>
                               {company.name}
                             </SelectItem>
                           ))
                         )}
                       </SelectContent>
                     </Select>
                   )}
                 </div>
                <div>
                   <Label htmlFor="department_select">Department</Label>
                   {editingPlacement.department_id && editingPlacement.department_name ? (
                     <div className="flex items-center justify-between p-2 border rounded-md bg-gray-50">
                       <span className="text-sm font-medium">{editingPlacement.department_name}</span>
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => {
                           setEditingPlacement({...editingPlacement, department_id: '', department_name: ''});
                           setSelectedDepartmentId('');
                         }}
                         className="text-blue-600 hover:text-blue-700"
                       >
                         Change
                       </Button>
                     </div>
                   ) : (
                     <Select
                       value={editingPlacement.department_id || ''}
                       onValueChange={handleDepartmentChange}
                       disabled={!selectedCompanyId || departmentsLoading}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder={selectedCompanyId ? "Select a department" : "Select a company first"} />
                       </SelectTrigger>
                       <SelectContent>
                         {departmentsLoading ? (
                           <SelectItem value="loading" disabled>Loading departments...</SelectItem>
                         ) : departments.length === 0 ? (
                           <SelectItem value="no-departments" disabled>No departments available</SelectItem>
                         ) : (
                           departments.map((department: ApiDepartment) => (
                             <SelectItem key={department.department_id} value={department.department_id}>
                               {department.name}
                             </SelectItem>
                           ))
                         )}
                       </SelectContent>
                     </Select>
                   )}
                 </div>
                 <div>
                   <Label htmlFor="sub_department_select">Sub Department</Label>
                   <Select
                     value={editingPlacement.sub_department_id || ''}
                     onValueChange={handleSubDepartmentChange}
                     disabled={!selectedDepartmentId || subDepartmentsLoading}
                   >
                     <SelectTrigger>
                       <SelectValue placeholder={selectedDepartmentId ? "Select a sub department" : "Select a department first"} />
                     </SelectTrigger>
                     <SelectContent>
                       {subDepartmentsLoading ? (
                         <SelectItem value="loading" disabled>Loading sub departments...</SelectItem>
                       ) : subDepartments.length === 0 ? (
                         <SelectItem value="no-subdepartments" disabled>No sub departments found</SelectItem>
                       ) : (
                         subDepartments.map((subDepartment: ApiSubDepartment) => (
                           <SelectItem key={subDepartment.sub_department_id} value={subDepartment.sub_department_id}>
                             {subDepartment.name}
                           </SelectItem>
                         ))
                       )}
                     </SelectContent>
                   </Select>
                 </div>
                 <div>
                   <Label htmlFor="section_select">Section</Label>
                   <Select
                     value={editingPlacement.section_id || ''}
                     onValueChange={handleSectionChange}
                     disabled={!editingPlacement?.sub_department_id || sectionsLoading}
                   >
                     <SelectTrigger id="section_select">
                       <SelectValue placeholder={editingPlacement?.sub_department_id ? "Select a section" : "Select a sub department first"} />
                     </SelectTrigger>
                     <SelectContent>
                       {sectionsLoading ? (
                         <SelectItem value="loading" disabled>Loading sections...</SelectItem>
                       ) : sections.length === 0 ? (
                         <SelectItem value="no-sections" disabled>No sections found</SelectItem>
                       ) : (
                         sections.map((section: ApiSection) => (
                           <SelectItem key={section.section_id} value={section.section_id}>
                             {section.name}
                           </SelectItem>
                         ))
                       )}
                     </SelectContent>
                   </Select>
                 </div>
                 <div>
                   <Label htmlFor="sub_section_id">Sub Section</Label>
                   <Select
                     value={editingPlacement.sub_section_id || ''}
                     onValueChange={handleSubSectionChange}
                     disabled={!editingPlacement.section_id || subSectionsLoading}
                   >
                     <SelectTrigger>
                       <SelectValue 
                         placeholder={
                           !editingPlacement.section_id 
                             ? "Select a section first" 
                             : subSectionsLoading 
                             ? "Loading sub-sections..." 
                             : subSections.length === 0 
                             ? "No sub-sections found" 
                             : "Select sub-section"
                         }
                       />
                     </SelectTrigger>
                     <SelectContent>
                       {subSections.map((subSection) => (
                         <SelectItem key={subSection.sub_section_id} value={subSection.sub_section_id}>
                           {subSection.name}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEditForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditPlacement}>
                  Update Placement
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReplacementPage;