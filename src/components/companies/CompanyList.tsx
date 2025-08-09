import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Users, Globe, MapPin, Plus, Loader2 } from 'lucide-react';
import { apiService } from '@/services/api';
import { ApiCompany, CreateCompanyRequest } from '@/types/api';

const CompanyList = () => {
  const [companies, setCompanies] = useState<ApiCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [newCompany, setNewCompany] = useState<CreateCompanyRequest>({
    name: '',
    industry: '',
    size: 'MEDIUM',
    description: '',
    website: '',
    address: ''
  });

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
    
    if (newCompany.website && !newCompany.website.match(/^https?:\/\/.+/)) {
      errors.website = 'Website must be a valid URL (starting with http:// or https://)';
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
        size: 'Medium',
        description: '',
        website: '',
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
        size: 'Medium',
        description: '',
        website: '',
        address: ''
      });
      setValidationErrors({});
    }
    setIsAddModalOpen(open);
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
                  <SelectTrigger>
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
                <Label htmlFor="website" className="text-sm font-medium">Website</Label>
                <Input
                  id="website"
                  value={newCompany.website}
                  onChange={(e) => setNewCompany(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://www.example.com"
                  className={validationErrors.website ? 'border-red-300 focus:border-red-500' : ''}
                />
                {validationErrors.website && (
                  <p className="text-sm text-red-600">{validationErrors.website}</p>
                )}
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
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  value={newCompany.description}
                  onChange={(e) => setNewCompany(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the company"
                  rows={3}
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
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">{company.name}</CardTitle>
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
                
                {company.website && (
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 truncate"
                    >
                      {company.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                
                {company.address && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 truncate">{company.address}</span>
                  </div>
                )}
                
                {company.description && (
                  <div>
                    <p className="text-sm text-gray-600">Description</p>
                    <p className="text-sm text-gray-900 line-clamp-2">{company.description}</p>
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
    </div>
  );
};

export default CompanyList;