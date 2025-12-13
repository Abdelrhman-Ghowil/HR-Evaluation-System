import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Users, MapPin, Plus, Loader2, Edit, Trash2, Upload, FileSpreadsheet, CheckCircle, AlertCircle, X, Search, Filter, Eye, Building, Download } from 'lucide-react';
import { apiService } from '@/services/api';
import { ApiCompany, CreateCompanyRequest, UpdateCompanyRequest, ApiDepartment, CompanySize } from '@/types/api';
import { useUpdateCompany, useDeleteCompany, useImportCompanies, useCompanies } from '@/hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const CompanyList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const canImport = user?.role === 'admin' || user?.role === 'hr';
  const [companies, setCompanies] = useState<ApiCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [selectedCompany, setSelectedCompany] = useState<ApiCompany | null>(null);
  const [newCompany, setNewCompany] = useState<CreateCompanyRequest>({
    name: '',
    industry: '',
    size: 'Medium',
    address: ''
  });
  const [editCompany, setEditCompany] = useState<UpdateCompanyRequest>({
    name: '',
    industry: '',
    size: 'Medium',
    address: ''
  });
  const [isImporting, setIsImporting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importResults, setImportResults] = useState<{ success: boolean; message: string; data?: any; errors?: any[] } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [showCompanyImportDetails, setShowCompanyImportDetails] = useState(false);

  // Normalize company size values coming from API or user input
  const normalizeCompanySize = (value: unknown): CompanySize => {
    const s = String(value ?? '').trim().toLowerCase();
    switch (s) {
      case 'small':
        return 'Small';
      case 'medium':
        return 'Medium';
      case 'large':
        return 'Large';
      default:
        return 'Medium';
    }
  };

  // View Departments modal state
  const [isViewDepartmentsModalOpen, setIsViewDepartmentsModalOpen] = useState(false);
  const [selectedCompanyForDepartments, setSelectedCompanyForDepartments] = useState<ApiCompany | null>(null);
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [departmentsError, setDepartmentsError] = useState<string | null>(null);

  // Filter state variables
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanyName, setSelectedCompanyName] = useState('all');

  // Initialize hooks
  const updateCompanyMutation = useUpdateCompany();
  const deleteCompanyMutation = useDeleteCompany();
  const importCompaniesMutation = useImportCompanies();

  // Get unique company names for dropdown filter
  const uniqueCompanyNames = useMemo(() => {
    const names = companies.map(company => company.name).filter(Boolean);
    return [...new Set(names)].sort();
  }, [companies]);

  // Filter companies based on search term and selected company name
  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      const matchesSearch = searchTerm === '' || 
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (company.industry && company.industry.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (company.address && company.address.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCompanyName = selectedCompanyName === '' || selectedCompanyName === 'all' || 
        company.name === selectedCompanyName;
      
      return matchesSearch && matchesCompanyName;
    });
  }, [companies, searchTerm, selectedCompanyName]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCompanyName('all');
  };

  // Companies via React Query
  const { data: companiesData, isLoading: companiesQueryLoading, error: companiesQueryError, refetch: refetchCompanies } = useCompanies();

  useEffect(() => {
    setLoading(!!companiesQueryLoading);
  }, [companiesQueryLoading]);

  useEffect(() => {
    if (companiesQueryError) {
      // Map query error to local error message for UI
      // @ts-ignore – error may be unknown type, ensure safe message
      const msg = companiesQueryError?.message || 'Failed to load companies. Please try again.';
      setError(msg);
    } else {
      setError(null);
    }
  }, [companiesQueryError]);

  useEffect(() => {
    if (!companiesData) return;
    let list: ApiCompany[] = [];
    if (Array.isArray(companiesData)) {
      list = companiesData as ApiCompany[];
    } else if ((companiesData as any)?.results && Array.isArray((companiesData as any).results)) {
      list = (companiesData as any).results as ApiCompany[];
    }
    // Ensure sizes are normalized to title case for UI
    setCompanies(list.map((c) => ({
      ...c,
      size: c.size ? normalizeCompanySize(c.size) : undefined,
    })));
  }, [companiesData]);

  // Handle view departments navigation
  const handleViewDepartments = (company: ApiCompany) => {
    // Navigate to departments page with company_id as query parameter
    navigate(`/departments?company_id=${company.company_id}`);
  };

  // Validation function
  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (!newCompany.name.trim()) {
      errors.name = 'Company name is required';
    }
    if (!newCompany.address.trim()) {
      errors.address = 'Address is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsCreating(true);
    setValidationErrors({});
    
    try {
      console.log('Creating company:', newCompany);
      const createdCompany = await apiService.createCompany(newCompany);
      console.log('Company created successfully:', createdCompany);
      
      await refetchCompanies();
      
      // Reset form and close modal
      setNewCompany({
        name: '',
        industry: '',
        size: 'Medium',
        address: ''
      });
      setIsAddModalOpen(false);
      
    } catch (error: any) {
      console.error('Error creating company:', error);
      
      const details = (error && error.details) || (error && error.response && error.response.data && error.response.data.details);
      if (details && typeof details === 'object') {
        const apiErrors: { [key: string]: string } = {};
        Object.keys(details).forEach((field) => {
          const val = details[field];
          if (Array.isArray(val)) {
            apiErrors[field] = String(val[0]);
          } else if (val && typeof val === 'object') {
            const first = Object.values(val)[0] as any;
            apiErrors[field] = Array.isArray(first) ? String(first[0]) : String(first);
          } else {
            apiErrors[field] = String(val);
          }
        });
        setValidationErrors(apiErrors);
        const generalMsg = apiErrors.general || apiErrors.non_field_errors || apiErrors.detail;
        toast({ title: 'Error', description: generalMsg || 'Please fix the highlighted fields.', variant: 'destructive' });
      } else {
        const message = (error && error.message) || (error && error.response && error.response.data && error.response.data.message) || 'Failed to create company. Please try again.';
        setValidationErrors({ general: message });
        toast({ title: 'Error', description: message, variant: 'destructive' });
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Handle modal close
  const handleModalClose = (open: boolean) => {
    if (!open) {
      setNewCompany({
        name: '',
        industry: '',
        size: 'Medium',
        address: ''
      });
      setValidationErrors({});
    }
    setIsAddModalOpen(open);
  };

  // Handle edit company
  const handleEditCompany = (company: ApiCompany) => {
    setSelectedCompany(company);
    setEditCompany({
      name: company.name,
      industry: company.industry || '',
      size: normalizeCompanySize(company.size),
      address: company.address || ''
    });
    setValidationErrors({});
    setIsEditModalOpen(true);
  };

  // Handle edit form submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCompany) return;
    
    if (!validateEditForm()) {
      return;
    }
    
    try {
      await updateCompanyMutation.mutateAsync({
        companyId: selectedCompany.company_id,
        companyData: editCompany
      });
      
      // Update the company in the list
      setCompanies(prev => prev.map(company => 
        company.company_id === selectedCompany.company_id 
          ? { ...company, ...editCompany }
          : company
      ));
      
      setIsEditModalOpen(false);
      setSelectedCompany(null);
    } catch (error) {
      console.error('Error updating company:', error);
    }
  };

  // Handle delete company
  const handleDeleteCompany = (company: ApiCompany) => {
    setSelectedCompany(company);
    setIsDeleteModalOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedCompany) return;
    
    try {
      await deleteCompanyMutation.mutateAsync(selectedCompany.company_id);
      
      // Remove the company from the list
      setCompanies(prev => prev.filter(company => 
        company.company_id !== selectedCompany.company_id
      ));
      
      setIsDeleteModalOpen(false);
      setSelectedCompany(null);
    } catch (error) {
      console.error('Error deleting company:', error);
    }
  };

  // Validate edit form
  const validateEditForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!editCompany.name?.trim()) {
      errors.name = 'Company name is required';
    }
    
    if (!editCompany.address?.trim()) {
      errors.address = 'Address is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle edit modal close
  const handleEditModalClose = (open: boolean) => {
    if (!open) {
      setEditCompany({
        name: '',
        industry: '',
        size: 'Medium',
        address: ''
      });
      setValidationErrors({});
      setSelectedCompany(null);
    }
    setIsEditModalOpen(open);
  };

  // Handle delete modal close
  const handleDeleteModalClose = (open: boolean) => {
    if (!open) {
      setSelectedCompany(null);
    }
    setIsDeleteModalOpen(open);
  };

  // Handle Excel and CSV file import
  const handleImportClick = () => {
    setIsImportModalOpen(true);
    setImportResults(null);
    setSelectedFile(null);
  };

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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (validateFile(file)) {
      setSelectedFile(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
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

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle test run import
  const handleTestRun = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    try {
      const result = await importCompaniesMutation.mutateAsync({ file: selectedFile, dryRun: true });
      setImportResults(result);
    } catch (error) {
      console.error('Test run failed:', error);
    } finally {
      setIsImporting(false);
    }
  };

  // Handle actual import
  const handleActualImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    try {
      const result = await importCompaniesMutation.mutateAsync({ file: selectedFile, dryRun: false });
      setImportResults(result);
      await refetchCompanies(); // Refresh the companies list using cached query
    } catch (error) {
      console.error('Import failed:', error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading companies...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Companies</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => refetchCompanies()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Companies</h2>
          <p className="text-gray-600">Manage your organization's companies</p>
        </div>
        <div className="flex gap-3">
          {canImport && (
            <>
              <Button 
                onClick={handleImportClick}
                disabled={isImporting}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {isImporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isImporting ? 'Importing...' : 'Import Excel'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </>
          )}
          <Dialog open={isAddModalOpen} onOpenChange={handleModalClose}>
             <DialogTrigger asChild>
               <Button className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700">
                 <Plus className="h-4 w-4 mr-2" />
                 Add Company
               </Button>
             </DialogTrigger>
             <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Add New Company</DialogTitle>
              <p className="text-sm text-gray-600">Create a new company in your organization</p>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 py-4">
              {validationErrors.general && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{validationErrors.general}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name" className="text-sm font-medium">Company Name *</Label>
                  <Input
                    id="company-name"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter company name"
                    className={validationErrors.name ? 'border-red-300 focus:border-red-500' : ''}
                  />
                  {validationErrors.name && (
                    <p className="text-sm text-red-600">{validationErrors.name}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="industry" className="text-sm font-medium">Industry</Label>
                  <Input
                    id="industry"
                    value={newCompany.industry}
                    onChange={(e) => setNewCompany(prev => ({ ...prev, industry: e.target.value }))}
                    placeholder="e.g., Technology, Healthcare"
                    className={validationErrors.industry ? 'border-red-300 focus:border-red-500' : ''}
                  />
                  {validationErrors.industry && (
                    <p className="text-sm text-red-600">{validationErrors.industry}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company-size" className="text-sm font-medium">Company Size</Label>
                <Select 
                  value={newCompany.size} 
                  onValueChange={(value: CompanySize) => 
                    setNewCompany(prev => ({ ...prev, size: value }))
                  }
                >
                  <SelectTrigger id="company-size" className={validationErrors.size ? 'border-red-300 focus:border-red-500' : ''}>
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Small">Small (1-50 employees)</SelectItem>
                    <SelectItem value="Medium">Medium (51-500 employees)</SelectItem>
                    <SelectItem value="Large">Large (500+ employees)</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.size && (
                  <p className="text-sm text-red-600">{validationErrors.size}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">Address *</Label>
                <Input
                  id="address"
                  value={newCompany.address}
                  onChange={(e) => setNewCompany(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Company address"
                  required
                  className={validationErrors.address ? 'border-red-300 focus:border-red-500' : ''}
                />
                {validationErrors.address && (
                  <p className="text-sm text-red-600">{validationErrors.address}</p>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => handleModalClose(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isCreating}
                  className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Company'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filter Companies</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search-companies" className="text-sm font-medium text-gray-700">
              Search Companies
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search-companies"
                type="text"
                placeholder="Search by name, industry, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Company Name Dropdown Filter */}
          <div className="space-y-2">
            <Label htmlFor="company-name-filter" className="text-sm font-medium text-gray-700">
              Company Name
            </Label>
            <Select value={selectedCompanyName} onValueChange={setSelectedCompanyName}>
              <SelectTrigger id="company-name-filter" className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Select company name..." />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                 <SelectItem value="all">All Companies</SelectItem>
                 {uniqueCompanyNames.map((name) => (
                   <SelectItem key={name} value={name}>
                     {name}
                   </SelectItem>
                 ))}
               </SelectContent>
            </Select>
          </div>

          {/* Clear Filters Button */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 opacity-0">
              Actions
            </Label>
            <Button
               onClick={clearFilters}
               variant="outline"
               className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
               disabled={!searchTerm && selectedCompanyName === 'all'}
             >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Filter Results Summary */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-600">
             Showing <span className="font-semibold text-gray-900">{filteredCompanies.length}</span> of{' '}
             <span className="font-semibold text-gray-900">{companies.length}</span> companies
             {(searchTerm || (selectedCompanyName && selectedCompanyName !== 'all')) && (
               <span className="ml-2 text-blue-600">
                 (filtered)
               </span>
             )}
           </p>
        </div>
      </div>

      {filteredCompanies.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          {companies.length === 0 ? (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No companies found</h3>
              <p className="text-gray-600 mb-4">Get started by adding your first company.</p>
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No companies match your filters</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search criteria or clear the filters.</p>
              <Button 
                onClick={clearFilters}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <Card key={company.company_id} className="hover:shadow-md transition-all duration-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg">{company.name}</CardTitle>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCompany(company)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCompany(company)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {company.industry && (
                  <div>
                    <p className="text-sm text-gray-600">Industry</p>
                    <p className="font-medium text-gray-900">{company.industry}</p>
                  </div>
                )}
                
                {company.size && (
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{company.size} company</span>
                  </div>
                )}
                
                {company.address && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 truncate">{company.address}</span>
                  </div>
                )}
                
                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <p className="text-xs text-gray-500">
                    Created: {new Date(company.created_at).toLocaleDateString()}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDepartments(company)}
                    className="w-full h-8 text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Departments
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Company Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={handleEditModalClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {validationErrors.general && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{validationErrors.general}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-company-name" className="text-sm font-medium">Company Name *</Label>
                <Input
                  id="edit-company-name"
                  value={editCompany.name}
                  onChange={(e) => setEditCompany(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter company name"
                  className={validationErrors.name ? 'border-red-300 focus:border-red-500' : ''}
                />
                {validationErrors.name && (
                  <p className="text-sm text-red-600">{validationErrors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-industry" className="text-sm font-medium">Industry</Label>
                <Input
                  id="edit-industry"
                  value={editCompany.industry}
                  onChange={(e) => setEditCompany(prev => ({ ...prev, industry: e.target.value }))}
                  placeholder="e.g., Technology, Healthcare"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-company-size" className="text-sm font-medium">Company Size</Label>
              <Select 
                value={editCompany.size} 
                onValueChange={(value: CompanySize) => 
                  setEditCompany(prev => ({ ...prev, size: value }))
                }
              >
                <SelectTrigger id="edit-company-size">
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Small">Small (1-50 employees)</SelectItem>
                  <SelectItem value="Medium">Medium (51-500 employees)</SelectItem>
                  <SelectItem value="Large">Large (500+ employees)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-address" className="text-sm font-medium">Address *</Label>
              <Input
                id="edit-address"
                value={editCompany.address}
                onChange={(e) => setEditCompany(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Company address"
                className={validationErrors.address ? 'border-red-300 focus:border-red-500' : ''}
              />
              {validationErrors.address && (
                <p className="text-sm text-red-600">{validationErrors.address}</p>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleEditModalClose(false)}
                disabled={updateCompanyMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateCompanyMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
              >
                {updateCompanyMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Company'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Company Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={handleDeleteModalClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Company</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-red-100 p-2 rounded-full">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-red-800">Confirm Deletion</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Are you sure you want to delete <strong>{selectedCompany?.name}</strong>? 
                    This action cannot be undone and will permanently remove all company data.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleDeleteModalClose(false)}
                disabled={deleteCompanyMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDeleteConfirm}
                disabled={deleteCompanyMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteCompanyMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Company'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Companies Modal */}
      {canImport && (
        <Dialog open={isImportModalOpen} onOpenChange={handleImportModalClose}>
          <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              Import Companies from Excel
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* File Upload Area */}
            <div className="space-y-3">
              <div
                className={`border border-dashed rounded-md p-4 text-center transition-colors ${
                  isDragOver
                    ? 'border-green-400 bg-green-50'
                    : selectedFile
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
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
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[220px]">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="h-8 px-2 text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <Upload className="h-6 w-6 text-gray-400" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Drag and drop Excel/CSV here</p>
                      <p className="text-xs text-gray-500">or click to browse</p>
                    </div>
                    <p className="text-xs text-gray-400">.xlsx, .xls, .csv • max 50MB</p>
                  </div>
                )}
              </div>
              
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
                <Button
                  asChild
                  variant="link"
                  size="sm"
                  className="text-indigo-700"
                >
                  <a
                    href="https://docs.google.com/spreadsheets/d/1rWkpqGAKIpdGqIvdIk6rwp6luwafNVAV/edit?usp=sharing&ouid=102577459244863862882&rtpof=true&sd=true"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Template
                  </a>
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            {selectedFile && (
              <div className="flex gap-2">
                <Button
                  onClick={handleTestRun}
                  disabled={isImporting}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {isImporting ? 'Testing...' : 'Validate'}
                </Button>
                <Button
                  onClick={handleActualImport}
                  // disabled={isImporting || !importResults?.success}
                  disabled={isImporting}
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {isImporting ? 'Importing...' : 'Import'}
                </Button>
              </div>
            )}

            {/* Results Display */}
            {importResults && (
              (() => {
                const derivedSuccess = Boolean(
                  (importResults as any).success === true ||
                  String((importResults as any).message || '').toLowerCase().includes('success') ||
                  String((importResults as any).message || '').toLowerCase().includes('imported') ||
                  String((importResults as any).data?.status || '').toLowerCase() === 'imported' ||
                  !((importResults as any).errors && (importResults as any).errors.length > 0)
                );
                return (
                  <div className={`rounded-md p-3 ${
                    derivedSuccess ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-start gap-2">
                      <div className={`p-1 rounded-full ${derivedSuccess ? 'bg-green-100' : 'bg-red-100'}`}>
                        {derivedSuccess ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 text-sm">
                        <div className="flex items-center justify-between">
                          <p className={`font-medium ${derivedSuccess ? 'text-green-800' : 'text-red-800'}`}>
                            {importResults.data?.validation_results ? 'Validation successful' : derivedSuccess ? 'Import successful' : 'Import failed'}
                          </p>
                          <div className="text-xs text-gray-700 flex gap-3">
                            {importResults.data?.imported_count !== undefined && (
                              <span>Imported: {importResults.data.imported_count}</span>
                            )}
                            {importResults.data?.skipped_count !== undefined && (
                              <span>Skipped: {importResults.data.skipped_count}</span>
                            )}
                            {importResults.data?.total_processed !== undefined && (
                              <span>Total: {importResults.data.total_processed}</span>
                            )}
                            {importResults.data?.valid_records !== undefined && (
                              <span>Valid: {importResults.data.valid_records}</span>
                            )}
                            {importResults.data?.invalid_records !== undefined && (
                              <span>Invalid: {importResults.data.invalid_records}</span>
                            )}
                          </div>
                        </div>
                        {importResults.errors && importResults.errors.length > 0 && (
                          <div className="mt-2">
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => setShowCompanyImportDetails((v) => !v)}>
                                {showCompanyImportDetails ? 'Hide details' : 'View details'}
                              </Button>
                            </div>
                            {showCompanyImportDetails && (
                              <div className="mt-2 space-y-2">
                                {importResults.data?.validation_results && (
                                  <div className="bg-gray-50 border rounded p-2">
                                    <p className="text-xs font-semibold text-gray-800">Validation Summary</p>
                                    <p className="text-xs text-gray-700 mt-1">{importResults.data.validation_results.summary}</p>
                                  </div>
                                )}
                                {importResults.data?.imported_count !== undefined && (
                                  <div className="bg-gray-50 border rounded p-2">
                                    <p className="text-xs font-semibold text-gray-800">Import Summary</p>
                                    <div className="text-[11px] text-gray-700 mt-1 space-y-1">
                                      <p>Imported: {importResults.data.imported_count}</p>
                                      <p>Skipped: {importResults.data.skipped_count || 0}</p>
                                      <p>Total: {importResults.data.total_processed}</p>
                                    </div>
                                  </div>
                                )}
                                <div className="bg-gray-50 border rounded p-2">
                                  <p className="text-xs font-semibold text-gray-800 mb-1">Errors</p>
                                  <div className="max-h-40 overflow-y-auto space-y-1">
                                    {importResults.errors.map((error, index) => (
                                      <p key={index} className="text-[11px] text-red-700">
                                        Row {error.row}: {error.message}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            )}

            {/* Help Text */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
              <h4 className="text-sm font-medium text-blue-800 mb-1">File Requirements</h4>
              <ul className="text-xs text-blue-700 space-y-0.5">
                <li>• Required columns: Company Name, Company Code, Email</li>
                <li>• Optional columns: Phone, Address, City, Country, Industry, Website, Description</li>
                <li>• First row should contain column headers</li>
                <li>• Maximum file size: 50MB</li>
                <li>• Supported formats: .xlsx, .xls, .csv</li>
              </ul>
            </div>
          </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CompanyList;
