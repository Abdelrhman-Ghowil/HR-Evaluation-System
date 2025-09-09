import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Users, MapPin, Plus, Loader2, Edit, Trash2, Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from 'lucide-react';
import { apiService } from '@/services/api';
import { ApiCompany, CreateCompanyRequest, UpdateCompanyRequest } from '@/types/api';
import { useUpdateCompany, useDeleteCompany, useImportCompanies } from '@/hooks/useApi';

const CompanyList = () => {
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
    size: 'MEDIUM',
    address: ''
  });
  const [editCompany, setEditCompany] = useState<UpdateCompanyRequest>({
    name: '',
    industry: '',
    size: 'MEDIUM',
    address: ''
  });
  const [isImporting, setIsImporting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importResults, setImportResults] = useState<{ success: boolean; message: string; data?: any; errors?: any[] } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Initialize hooks
  const updateCompanyMutation = useUpdateCompany();
  const deleteCompanyMutation = useDeleteCompany();
  const importCompaniesMutation = useImportCompanies();

  // Fetch companies from API
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching companies from API...');
      const response = await apiService.getCompanies();
      console.log('Companies API Response:', response);
      
      // Handle both paginated response and direct array response
      if (response && Array.isArray(response.results)) {
        // Standard paginated response
        setCompanies(response.results);
        console.log(`Successfully loaded ${response.results.length} companies from API`);
      } else if (Array.isArray(response)) {
        // Direct array response
        setCompanies(response);
        console.log(`Successfully loaded ${response.length} companies from API`);
      } else {
        console.error('Invalid companies response format:', response);
        setError('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError('Failed to load companies. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Validation function
  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (!newCompany.name.trim()) {
      errors.name = 'Company name is required';
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
      
      // Add the new company to the list
      setCompanies(prev => [...prev, createdCompany]);
      
      // Reset form and close modal
      setNewCompany({
        name: '',
        industry: '',
        size: 'MEDIUM',
        address: ''
      });
      setIsAddModalOpen(false);
      
    } catch (error: any) {
      console.error('Error creating company:', error);
      
      if (error.details) {
        // Handle field-specific validation errors from API
        setValidationErrors(error.details);
      } else {
        setValidationErrors({ general: error.message || 'Failed to create company. Please try again.' });
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
        size: 'MEDIUM',
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
      size: company.size || 'MEDIUM',
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
        size: 'MEDIUM',
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

  // Handle Excel file import
  const handleImportClick = () => {
    setIsImportModalOpen(true);
    setImportResults(null);
    setSelectedFile(null);
  };

  const validateFile = (file: File): boolean => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];
    
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid Excel file (.xlsx or .xls)');
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
      fetchCompanies(); // Refresh the companies list
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
          <Button onClick={fetchCompanies} variant="outline">
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
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
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
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company-size" className="text-sm font-medium">Company Size</Label>
                <Select 
                  value={newCompany.size} 
                  onValueChange={(value: 'SMALL' | 'MEDIUM' | 'LARGE') => 
                    setNewCompany(prev => ({ ...prev, size: value }))
                  }
                >
                  <SelectTrigger id="company-size">
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SMALL">Small (1-50 employees)</SelectItem>
                    <SelectItem value="MEDIUM">Medium (51-500 employees)</SelectItem>
                    <SelectItem value="LARGE">Large (500+ employees)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">Address</Label>
                <Input
                  id="address"
                  value={newCompany.address}
                  onChange={(e) => setNewCompany(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Company address"
                />
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

      {companies.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No companies found</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first company.</p>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
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
                
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Created: {new Date(company.created_at).toLocaleDateString()}
                  </p>
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
                onValueChange={(value: 'SMALL' | 'MEDIUM' | 'LARGE') => 
                  setEditCompany(prev => ({ ...prev, size: value }))
                }
              >
                <SelectTrigger id="edit-company-size">
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SMALL">Small (1-50 employees)</SelectItem>
                  <SelectItem value="MEDIUM">Medium (51-500 employees)</SelectItem>
                  <SelectItem value="LARGE">Large (500+ employees)</SelectItem>
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
      <Dialog open={isImportModalOpen} onOpenChange={handleImportModalClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              Import Companies from Excel
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
                        Drag and drop your Excel file here
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
                    <p className="text-xs text-gray-400">
                      Supports .xlsx and .xls files up to 50MB
                    </p>
                  </div>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Action Buttons */}
            {selectedFile && (
              <div className="flex gap-3">
                <Button
                  onClick={handleTestRun}
                  disabled={isImporting}
                  variant="outline"
                  className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {isImporting ? 'Testing...' : 'Test Run (Validate Only)'}
                </Button>
                <Button
                  onClick={handleActualImport}
                  // disabled={isImporting || !importResults?.success}
                  disabled={isImporting}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {isImporting ? 'Importing...' : 'Import Companies'}
                </Button>
              </div>
            )}

            {/* Results Display */}
            {importResults && (
              <div className={`rounded-lg p-4 ${
                importResults.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-1 rounded-full ${
                    importResults.success ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {importResults.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium ${
                      importResults.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {importResults.success ? 'Success!' : 'Error'}
                    </h4>
                    <p className={`text-sm mt-1 ${
                      importResults.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {importResults.message}
                    </p>
                    
                    {/* Display validation results for dry run */}
                    {importResults.data?.validation_results && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium text-green-800">
                          Validation Summary:
                        </p>
                        <p className="text-sm text-green-700">
                          {importResults.data.validation_results.summary}
                        </p>
                        {importResults.data.total_records && (
                          <div className="text-xs text-green-600 space-y-1">
                            <p>Total Records: {importResults.data.total_records}</p>
                            <p>Valid Records: {importResults.data.valid_records}</p>
                            <p>Invalid Records: {importResults.data.invalid_records}</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Display import results */}
                    {importResults.data?.imported_count !== undefined && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium text-green-800">
                          Import Summary:
                        </p>
                        <div className="text-xs text-green-600 space-y-1">
                          <p>Imported: {importResults.data.imported_count} companies</p>
                          <p>Skipped: {importResults.data.skipped_count || 0} companies</p>
                          <p>Total Processed: {importResults.data.total_processed}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Display errors if any */}
                    {importResults.errors && importResults.errors.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-red-800 mb-2">Errors:</p>
                        <div className="max-h-32 overflow-y-auto">
                          {importResults.errors.map((error, index) => (
                            <p key={index} className="text-xs text-red-700 mb-1">
                              Row {error.row}: {error.message}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Help Text */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Excel File Requirements:</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Required columns: Company Name, Company Code, Email</li>
                <li>• Optional columns: Phone, Address, City, Country, Industry, Website, Description</li>
                <li>• First row should contain column headers</li>
                <li>• Maximum file size: 50MB</li>
                <li>• Supported formats: .xlsx, .xls</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyList;