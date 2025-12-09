import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Edit, Trash2, Eye, UserCheck, Building, Users, FileSpreadsheet, Upload, Loader2, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '../../hooks/use-toast';
import { usePlacements, useCreatePlacement, useUpdatePlacement, useDeletePlacement, useCompanies, useDepartments, useSubDepartments, queryKeys } from '../../hooks/useApi';
import { ApiPlacement, CreatePlacementRequest, ApiCompany, ApiDepartment, ApiSubDepartment, ApiSection, ApiSubSection } from '../../types/api';
import HierarchicalDropdown from './HierarchicalDropdown';
import { apiService } from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';



const ReplacementPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const canImport = user?.role === 'admin' || user?.role === 'hr';
  const canEditPlacement = user?.role === 'admin' || user?.role === 'hr';

  // API Hooks
  // Use global React Query defaults to retain cached data across navigation
  const { data: placements = [], isLoading: loading, error } = usePlacements();
  const { data: companiesData, isLoading: companiesLoading } = useCompanies();
  const { data: departmentsData, isLoading: departmentsLoading } = useDepartments(
    selectedCompanyId ? { company_id: selectedCompanyId } : undefined
  );
  const { data: subDepartmentsData, isLoading: subDepartmentsLoading, error: subDepartmentsError } = useSubDepartments(
    selectedDepartmentId ? { department: selectedDepartmentId } : undefined
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
  const updatePlacementMutation = useUpdatePlacement({
    onSuccess: () => {
      // Override default behavior to prevent automatic query invalidation
      // Manual cache updates are handled in handleEditPlacement
    },
    onError: () => {
      // Override default error handling to prevent duplicate toast messages
    }
  });
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
        const response: unknown = await apiService.getSections({ sub_department: editingPlacement.sub_department_id });
          let sectionsData: ApiSection[] = [];
        if (Array.isArray(response)) {
          sectionsData = response;
        } else if (response && typeof response === 'object') {
          const responseObj = response as { results?: ApiSection[] };
          if (Array.isArray(responseObj.results)) {
            sectionsData = responseObj.results;
          } else if (response && typeof response === 'object' && 'section_id' in response) {
            sectionsData = [response as ApiSection];
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
  }, [editingPlacement?.sub_department_id, toast]);

  // Load sub-sections when section is selected
  useEffect(() => {
    const loadSubSections = async () => {
      if (!editingPlacement?.section_id) {
        setSubSections([]);
        return;
      }
      try {
        setSubSectionsLoading(true);
        const response: unknown = await apiService.getSubSections({ section: editingPlacement.section_id });
          let subSectionsData: ApiSubSection[] = [];
        if (Array.isArray(response)) {
          subSectionsData = response;
        } else if (response && typeof response === 'object') {
          const responseObj = response as { results?: ApiSubSection[] };
          if (Array.isArray(responseObj.results)) {
            subSectionsData = responseObj.results;
          } else if (response && typeof response === 'object' && 'sub_section_id' in response) {
            subSectionsData = [response as ApiSubSection];
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
  }, [editingPlacement?.section_id, toast]);

  // Debug logging
  console.log('Placements API Response:', placements);
  console.log('Placements Array:', placements);
  console.log('Loading state:', loading);
  console.log('Error state:', error);

  // Prefill search term from URL query parameters (e.g., ?employee=John Doe)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const prefill = params.get('employee') || params.get('q') || '';
    if (prefill && prefill !== searchTerm) {
      setSearchTerm(prefill);
    }
  }, [location.search]);

  // Clear filter and remove related URL params
  const clearSearchFilter = () => {
    setSearchTerm('');
    const params = new URLSearchParams(location.search);
    params.delete('employee');
    params.delete('q');
    navigate({ pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : '' }, { replace: true });
  };



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
      { id: editingPlacement.employee_id, data: payload },
      {
        onSuccess: (updatedPlacement) => {
          // Manually update the cache to preserve position
          queryClient.setQueryData(queryKeys.placements, (oldData: ApiPlacement[] | undefined) => {
            if (!oldData) return oldData;
            
            return oldData.map(placement => 
              placement.employee_id === editingPlacement.employee_id 
                ? { ...placement, ...updatedPlacement }
                : placement
            );
          });

          // Update the individual placement cache
          queryClient.setQueryData(queryKeys.placement(editingPlacement.employee_id), updatedPlacement);

          // Invalidate and refetch placements to ensure latest media (images) are loaded
          queryClient.invalidateQueries({ queryKey: queryKeys.placements });
          queryClient.invalidateQueries({ queryKey: queryKeys.placement(editingPlacement.employee_id) });
          // Proactively refetch active queries so the UI updates immediately
          queryClient.refetchQueries({ queryKey: queryKeys.placements, type: 'active' });
          queryClient.refetchQueries({ queryKey: queryKeys.placement(editingPlacement.employee_id), type: 'active' });

          setShowEditForm(false);
          setEditingPlacement(null);
          setSelectedCompanyId('');
          toast({
            title: "Success",
            description: "Placement updated successfully",
          });
        },
        onError: (error) => {
          // Error handling without toast message
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
    (placement.employee_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (placement.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (placement.department_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // File handling functions
  const validateFile = (file: File): boolean => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'application/csv' // .csv alternative
    ];
    
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file.');
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

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && validateFile(file)) {
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
      if (validateFile(file)) {
        setSelectedFile(file);
        setUploadStatus('idle');
        setUploadMessage('');
      }
    }
  };

  const handleFileUpload = async (dryRun: boolean = false) => {
    if (!selectedFile) return;
    
    setUploadStatus('uploading');
    setUploadMessage(dryRun ? 'Validating file...' : 'Uploading file...');
    
    try {
      const response = await apiService.importPlacements(selectedFile, dryRun);
      const derivedSuccess = Boolean(
        (response as any)?.success === true ||
        String((response as any)?.message || '').toLowerCase().includes('success') ||
        String((response as any)?.message || '').toLowerCase().includes('imported') ||
        String((response as any)?.data?.status || '').toLowerCase() === 'imported' ||
        !((response as any)?.errors) ||
        (Array.isArray((response as any)?.errors) && (response as any).errors.length === 0)
      );
      
      if (derivedSuccess) {
        setUploadStatus('success');
        setUploadMessage((response as any)?.message || (dryRun ? 'File validation completed successfully!' : 'File uploaded successfully!'));
        if (!dryRun) {
          setSelectedFile(null);
          setTimeout(() => {
            setIsImportModalOpen(false);
            setUploadStatus('idle');
            setUploadMessage('');
          }, 2000);
        }
      } else {
        setUploadStatus('error');
        setUploadMessage((response as any)?.message || 'Failed to process file. Please try again.');
      }
      
    } catch (error: unknown) {
      setUploadStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file. Please try again.';
      setUploadMessage(errorMessage);
    }
  };

  const resetImportModal = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setUploadMessage('');
    setIsDragOver(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
        
        <div className="flex gap-3">
          {canImport && (
            <Button 
              variant="outline" 
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
              onClick={() => setIsImportModalOpen(true)}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Import Excel
            </Button>
          )}
          {/* Add Placement button removed as requested */}
        </div>
      </div>

      {/* Import Excel Modal */}
      {canImport && (
        <Dialog open={isImportModalOpen} onOpenChange={(open) => {
          setIsImportModalOpen(open);
          if (!open) resetImportModal();
        }}>
          <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-blue-600" />
              Import Placement File
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-2">
              Upload an Excel (.xlsx, .xls) or CSV file to import employee placements. You can validate your file first before importing.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            {/* File Upload Area */}
            <div
              className={`border border-dashed rounded-md p-4 text-center transition-all duration-200 cursor-pointer ${
                isDragOver
                  ? 'border-blue-500 bg-blue-50'
                  : selectedFile
                  ? 'border-green-500 bg-green-50'
                  : uploadStatus === 'error'
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleFileSelect}
            >
              {selectedFile ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[220px]">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type.includes('sheet') ? 'Excel' : 'CSV'}</p>
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
                    className="h-8 px-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-center">
                    <div className={`p-2 rounded-full ${isDragOver ? 'bg-blue-100' : 'bg-gray-100'}`}> 
                      <Upload className={`h-6 w-6 ${isDragOver ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {isDragOver ? 'Drop your file here' : 'Drag and drop Excel/CSV here'}
                    </p>
                    <p className="text-xs text-gray-500">or click to browse</p>
                  </div>
                  <p className="text-xs text-gray-400">.xlsx, .xls, .csv • max 50MB</p>
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
            <div className="flex items-center justify-between rounded-md border p-2">
              <div className="flex items-center gap-2 text-xs">
                <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
                <span className="text-gray-700">Download Excel template</span>
              </div>
              <Button asChild variant="link" size="sm" className="text-indigo-700">
                <a
                  href="https://docs.google.com/spreadsheets/d/1rYIqOMGAfAC8Ae60P5cPNa1kDB7gWJ5_/edit?gid=1553600812#gid=1553600812"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Template
                </a>
              </Button>
            </div>
            
            {/* File Requirements */}
            <div className="bg-gray-50 rounded-md p-2 border">
              <h4 className="text-sm font-medium text-gray-900 mb-1 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                File Requirements
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
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
                  Required columns: Employee ID, Company, Department
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  UTF-8 encoding recommended
                </div>
              </div>
            </div>

            {/* Upload Status */}
            {uploadMessage && (
              <div className={`p-3 rounded-md border-l-4 ${
                uploadStatus === 'success' 
                  ? 'bg-green-50 border-green-400 border border-green-200' 
                  : uploadStatus === 'error'
                  ? 'bg-red-50 border-red-400 border border-red-200'
                  : 'bg-blue-50 border-blue-400 border border-blue-200'
              }`}>
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0">
                    {uploadStatus === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                    {uploadStatus === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {uploadStatus === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
                  </div>
                  <div className="flex-1 text-sm">
                    <p className={`${
                      uploadStatus === 'success' 
                        ? 'text-green-800' 
                        : uploadStatus === 'error'
                        ? 'text-red-800'
                        : 'text-blue-800'
                    }`}>
                      {uploadStatus === 'uploading' ? 'Processing…' : 
                       uploadStatus === 'success' ? 'Success' : 'Error'}
                    </p>
                    <p className={`${
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
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t">
              <Button 
                variant="outline" 
                onClick={resetImportModal}
                disabled={uploadStatus === 'uploading'}
                size="sm"
                className="order-3 sm:order-1"
              >
                Cancel
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleFileUpload(true)}
                disabled={!selectedFile || uploadStatus === 'uploading'}
                size="sm"
                className="order-2 sm:order-2"
              >
                {uploadStatus === 'uploading' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Validating…
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Validate
                  </>
                )}
              </Button>
              <Button 
                onClick={() => handleFileUpload(false)}
                disabled={!selectedFile || uploadStatus === 'uploading'}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 order-1 sm:order-3"
              >
                {uploadStatus === 'uploading' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </>
                )}
              </Button>
            </div>
          </div>
          </DialogContent>
        </Dialog>
      )}

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
            {searchTerm && (
              <Button
                type="button"
                variant="outline"
                onClick={clearSearchFilter}
                className="whitespace-nowrap"
                aria-label="Clear search filter"
              >
                Clear Filter
              </Button>
            )}
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
                        <div className="font-medium text-gray-900">{placement.employee_name || 'N/A'}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-gray-900">{placement.company_name || 'N/A'}</div>
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary">{placement.department_name || 'N/A'}</Badge>
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
                          {canEditPlacement && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const companyName = placement.company_name || companies.find(c => c.company_id === placement.company_id)?.name || '';
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
                          )}
                          {/* <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePlacement(placement.placement_id)}
                            className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button> */}
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
                <div className="p-2 border rounded-md bg-gray-50">
                  <span className="text-sm font-medium">{editingPlacement.company_name || 'No company assigned'}</span>
                </div>
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
                    disabled={!editingPlacement.company_id || departmentsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={editingPlacement.company_id ? "Select a department" : "Select a company first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentsLoading ? (
                        <SelectItem value="loading" disabled>Loading departments...</SelectItem>
                      ) : !editingPlacement.company_id ? (
                        <SelectItem value="no-company" disabled>Select a company first</SelectItem>
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
                <Button 
                  variant="outline" 
                  onClick={() => setShowEditForm(false)}
                  disabled={updatePlacementMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleEditPlacement}
                  disabled={updatePlacementMutation.isPending}
                >
                  {updatePlacementMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Placement'
                  )}
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
