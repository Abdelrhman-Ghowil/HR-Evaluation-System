
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Calendar, User, BarChart3, FileText, Target, Plus, Edit, Trash2, Loader2, Mail, Phone, MapPin, Building2, Users, Briefcase, Hash, Clock } from 'lucide-react';
import EvaluationDetails from './EvaluationDetails';
import { EmployeeInput, EvaluationInput } from '../../types/shared';
import { useEvaluations, useCreateEvaluation, useUpdateEvaluation, useDeleteEvaluation, useUsers } from '../../hooks/useApi';
import { useManagers } from '../../hooks/usemanagers';
import { ApiEvaluation } from '../../types/api';
import { 
  transformEmployeeForEvaluation, 
  transformEvaluationForDetails, 
  safeTransformData,
  formatPhoneNumber,
  generateWhatsAppUrl,
  formatDate
} from '../../utils/dataTransformers';

// Using shared types from types/shared.ts
// Employee interface is now EmployeeInput
// Evaluation interface is now EvaluationInput

interface NewEvaluation {
  type: 'Quarterly' | 'Annual' | 'Optional';
  year: number;
  quarter?: number;
  reviewer_id?: string;
  status: 'Draft';
}

interface Reviewer {
  id: string;
  name: string;
  role: 'LM' | 'HOD' | 'HR';
}

interface EmployeeDetailsProps {
  employee: EmployeeInput;
  onBack: () => void;
}

const EmployeeDetails = ({ employee, onBack }: EmployeeDetailsProps) => {
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationInput | null>(null);
  const [isAddEvaluationOpen, setIsAddEvaluationOpen] = useState(false);
  const [isEditEvaluationOpen, setIsEditEvaluationOpen] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<EvaluationInput | null>(null);
  const [newEvaluation, setNewEvaluation] = useState<NewEvaluation>({
    type: 'Quarterly',
    year: new Date().getFullYear(),
    status: 'Draft'
  });
  const [isCreatingEvaluation, setIsCreatingEvaluation] = useState(false);
  const [isUpdatingEvaluation, setIsUpdatingEvaluation] = useState(false);

  // Fetch evaluations from API
  console.log('Fetching evaluations for employee ID:', employee.id);
  const { data: evaluationsData, isLoading: evaluationsLoading, error: evaluationsError } = useEvaluations({
    employee_id: employee.id
  });
  
  // Create evaluation mutation
  const createEvaluationMutation = useCreateEvaluation();
  
  // Delete evaluation mutation
  const deleteEvaluationMutation = useDeleteEvaluation();
  
  // Fetch users for reviewer dropdown
  const { data: usersData, isLoading: usersLoading, error: usersError } = useUsers();
  
  // Get company ID from employee for manager filtering
  const employeeCompanyId = employee.company_id || employee.company;
  
  // Fetch managers (employees with roles LM, HOD, HR) for the employee's company
  const { data: managers = [], isLoading: managersLoading, error: managersError } = useManagers(employeeCompanyId);
  
  console.log('Evaluations loading:', evaluationsLoading);
  console.log('Evaluations error:', evaluationsError);
  console.log('Full evaluationsData object:', JSON.stringify(evaluationsData, null, 2));
  console.log('Employee company ID:', employeeCompanyId);
  console.log('Managers data:', managers);

  // Transform API data to match the expected format
  const transformApiEvaluation = (apiEval: any): EvaluationInput => {
    // Handle both ApiEvaluation (id) and ApiEvaluationResponse (evaluation_id) formats
    const evaluationId = apiEval.id || apiEval.evaluation_id;
    
    // Parse score safely
    let score: number | undefined;
    if (apiEval.score !== undefined) {
      // Handle both number and string scores
      score = typeof apiEval.score === 'string' ? parseFloat(apiEval.score) : apiEval.score;
    }
    
    // Parse reviewer_id safely
    let reviewer_id: number | undefined;
    if (apiEval.reviewer_id) {
      const parsedReviewerId = parseInt(apiEval.reviewer_id, 10);
      reviewer_id = isNaN(parsedReviewerId) ? undefined : parsedReviewerId;
    }
    
    return {
      id: evaluationId,
      type: apiEval.type,
      period: apiEval.period,
      status: apiEval.status,
      score: score,
      reviewer: reviewer_id ? 'Unknown' : undefined,
      reviewer_id: reviewer_id,
      date: new Date(apiEval.created_at).toISOString().split('T')[0]
    };
  };

  // Get evaluation list from API data
  const evaluationList = useMemo(() => {
    // Handle different possible response structures
    let dataToTransform: any[] = [];
    
    if (evaluationsData?.results && Array.isArray(evaluationsData.results)) {
      dataToTransform = evaluationsData.results;
    } else if (Array.isArray(evaluationsData)) {
      // Handle case where API returns array directly
      dataToTransform = evaluationsData;
    } else if (evaluationsData && typeof evaluationsData === 'object') {
      // Handle case where API returns object with data property
      if (evaluationsData.data && Array.isArray(evaluationsData.data)) {
        dataToTransform = evaluationsData.data;
      }
    }
    
    if (!dataToTransform || dataToTransform.length === 0) {
       return [];
     }
    
    try {
      return dataToTransform.map(transformApiEvaluation);
    } catch (error) {
      console.error('Error transforming evaluations:', error);
      return [];
    }
  }, [evaluationsData]);

  // Transform users data to reviewers format
  const reviewers: Reviewer[] = useMemo(() => {
    if (!usersData) {
      return [];
    }
    
    // Handle different response formats
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let usersArray: any[] = [];
    if (usersData.results && Array.isArray(usersData.results)) {
      usersArray = usersData.results;
    } else if (Array.isArray(usersData)) {
      usersArray = usersData;
    } else {
      return [];
    }
    
    return usersArray
      .filter(user => user && user.user_id) // Filter out invalid users
      .map(user => ({
        id: user.user_id.toString(), // Ensure ID is a string
        name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Unknown User',
        role: user.role === 'HR' ? 'HR' : user.role === 'HOD' ? 'HOD' : 'LM'
      }));
  }, [usersData, usersLoading, usersError]);

  // Generate year options (current year ± 3)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);

  // Generate quarter options for Optional type
  const quarterOptions = Array.from({ length: 6 }, (_, i) => i + 1);

  // Helper function to generate evaluation records
  const generateEvaluationRecords = () => {
    const records: Partial<EvaluationInput>[] = [];
    const baseRecord = {
      reviewer: newEvaluation.reviewer_id ? 
        managers.find(m => m.id === newEvaluation.reviewer_id)?.name || 'To be assigned' : 
        'To be assigned',
      date: new Date().toISOString().split('T')[0],
      status: 'Draft' as const,
      type: newEvaluation.type
    };

    if (newEvaluation.type === 'Quarterly') {
      // Generate 4 quarterly records (Q1, Q2, Q3, Q4)
      for (let q = 1; q <= 4; q++) {
        records.push({
          ...baseRecord,
          id: `${Date.now()}-Q${q}`,
          period: `${newEvaluation.year}-Q${q}`,
          type: 'Quarterly'
        });
      }
    } else if (newEvaluation.type === 'Annual') {
      // Generate 2 annual records (Mid-Year, End-Year)
      records.push(
        {
          ...baseRecord,
          id: `${Date.now()}-Mid`,
          period: `${newEvaluation.year}-Mid`,
          type: 'Annual'
        },
        {
          ...baseRecord,
          id: `${Date.now()}-End`,
          period: `${newEvaluation.year}-End`,
          type: 'Annual'
        }
      );
    } else if (newEvaluation.type === 'Optional' && newEvaluation.quarter) {
      // Generate 1 optional record for selected quarter
      records.push({
        ...baseRecord,
        id: `${Date.now()}-Q${newEvaluation.quarter}`,
        period: `${newEvaluation.year}-Q${newEvaluation.quarter}`,
        type: 'Optional'
      });
    }

    return records;
  };

  const handleCreateEvaluation = async () => {
    const records = generateEvaluationRecords();
    console.log('Creating evaluation records:', records);
    
    setIsCreatingEvaluation(true);
    
    try {
      // Create each evaluation record via API
      for (const record of records) {
        const evaluationData = {
          employee_id: employee.id,
          type: record.type as 'Quarterly' | 'Annual' | 'Optional',
          status: "Draft" as const,
          period: record.period,
          score: null,
          reviewer_id: null
        };
        
        await createEvaluationMutation.mutateAsync(evaluationData);
      }
      
      console.log('Successfully created all evaluation records');
    } catch (error) {
      console.error('Error creating evaluations:', error);
    } finally {
      setIsCreatingEvaluation(false);
    }
    
    // Reset form and close modal
    setNewEvaluation({
      type: 'Quarterly',
      year: new Date().getFullYear(),
      status: 'Draft'
    });
    setIsAddEvaluationOpen(false);
  };

  const handleEditEvaluation = (evaluation: EvaluationInput) => {
    setEditingEvaluation(evaluation);
    setIsEditEvaluationOpen(true);
  };

  // Update evaluation mutation
  const updateEvaluationMutation = useUpdateEvaluation();

  const handleUpdateEvaluation = async () => {
    if (!editingEvaluation) return;

    setIsUpdatingEvaluation(true);

    try {
      const updateData = {
        type: editingEvaluation.type,
        period: editingEvaluation.period,
        status: editingEvaluation.status, // Send status as-is without transformation
        reviewer_id: editingEvaluation.reviewer_id?.toString() || null
        // Note: score field is intentionally excluded to make it non-editable
      };
      
      await updateEvaluationMutation.mutateAsync({
        evaluationId: editingEvaluation.id,
        evaluationData: updateData
      });
      
      console.log('Successfully updated evaluation:', editingEvaluation.id);
    } catch (error) {
      console.error('Error updating evaluation:', error);
    } finally {
      setIsUpdatingEvaluation(false);
    }
    
    setIsEditEvaluationOpen(false);
    setEditingEvaluation(null);
  };

  const handleDeleteEvaluation = async (evaluationId: string) => {
    try {
      await deleteEvaluationMutation.mutateAsync(evaluationId);
      console.log('Successfully deleted evaluation:', evaluationId);
    } catch (error) {
      console.error('Error deleting evaluation:', error);
    }
  };

  const isFormValid = () => {
    if (newEvaluation.type === 'Optional' && !newEvaluation.quarter) return false;
    return true;
  };

  // Status transition validation
  const getValidStatusTransitions = (currentStatus: string): string[] => {
    const transitions: Record<string, string[]> = {
      'Draft': ['Pending HoD Approval', 'Rejected'],
      'Pending HoD Approval': ['Pending HR Approval', 'Rejected', 'Draft'],
      'Pending HR Approval': ['Employee Review', 'Rejected', 'Pending HoD Approval'],
      'Employee Review': ['Approved', 'Rejected'],
      'Approved': ['Completed'],
      'Rejected': ['Draft'],
      'Completed': [] // Final state
    };
    return transitions[currentStatus] || [];
  };

  const isValidStatusTransition = (fromStatus: string, toStatus: string): boolean => {
    if (fromStatus === toStatus) return true;
    return getValidStatusTransitions(fromStatus).includes(toStatus);
  };

  const isEditFormValid = (): boolean => {
    if (!editingEvaluation) return false;
    
    // Basic field validation
    const hasRequiredFields = editingEvaluation.type && 
                             editingEvaluation.period;
    
    if (!hasRequiredFields) return false;
    
    // Status transition validation
    const originalEvaluation = evaluationList.find(e => e.id === editingEvaluation.id);
    if (originalEvaluation) {
      return isValidStatusTransition(originalEvaluation.status, editingEvaluation.status);
    }
    
    return true;
  };



  if (selectedEvaluation) {
    // Transform employee data with error handling
    const employeeResult = safeTransformData(
      employee,
      transformEmployeeForEvaluation,
      'Failed to transform employee data'
    );

    if (!employeeResult.success) {
      return (
        <div className="p-4 text-red-600">
          <h3 className="font-semibold mb-2">Error Loading Employee Data</h3>
          <p>{employeeResult.success === false ? employeeResult.error : ''}</p>
          <Button 
            variant="outline" 
            onClick={onBack}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Employees
          </Button>
        </div>
      );
    }

    // Transform evaluation data with error handling
    const evaluationResult = safeTransformData(
      { evaluation: selectedEvaluation, employeeId: employeeResult.data.id },
      ({ evaluation, employeeId }) => transformEvaluationForDetails(evaluation, employeeId),
      'Failed to transform evaluation data'
    );

    if (!evaluationResult.success) {
      return (
        <div className="p-4 text-red-600">
          <h3 className="font-semibold mb-2">Error Loading Evaluation Data</h3>
          <p>{evaluationResult.success === false ? evaluationResult.error : ''}</p> 
          <Button 
            variant="outline" 
            onClick={() => setSelectedEvaluation(null)}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Evaluations
          </Button>
        </div>
      );
    }

    return (
      <EvaluationDetails 
        evaluation={evaluationResult.data}
        employee={employeeResult.data}
        onBack={() => setSelectedEvaluation(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Employees
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employee Profile</h2>
          <p className="text-gray-600">View employee details and evaluations</p>
        </div>
      </div>

      {/* Employee Info Card */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-6">
          <div className="flex items-start space-x-6">
            <div className="relative">
              <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg">
                <AvatarImage src={employee.avatar} alt={employee.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl font-semibold">
                  {employee.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full h-6 w-6 flex items-center justify-center">
                <div className="bg-white rounded-full h-3 w-3"></div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-3xl font-bold text-gray-900 mb-2">{employee.name}</CardTitle>
                  <p className="text-xl text-gray-700 font-medium mb-1">{employee.position}</p>
                  <div className="flex items-center space-x-2 mb-3">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 font-medium">{employee.companyName}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center space-x-1">
                      <Hash className="h-3 w-3 text-gray-500" />
                      <span className="text-sm text-gray-600 font-mono">{employee.employeeCode}</span>
                    </div>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                      {employee.role}
                    </Badge>
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                      {employee.status}
                    </Badge>
                    <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-md">{employee.department}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Contact Information Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-500" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                <Mail className="h-5 w-5 text-blue-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-700">Email Address</p>
                  <a 
                    href={`mailto:${employee.email}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline transition-colors font-medium truncate block"
                  >
                    {employee.email}
                  </a>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                <Phone className="h-5 w-5 text-green-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-700">Phone Number</p>
                  <a 
                    href={generateWhatsAppUrl(employee.phone, employee.countryCode)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-800 hover:underline transition-colors font-medium"
                  >
                    {formatPhoneNumber(employee.phone, employee.countryCode)}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-indigo-500" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employee.gender && (
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-500 mb-1">Gender</p>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-indigo-500" />
                    <span className="text-sm font-medium text-gray-900">{employee.gender}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Work Information Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-purple-500" />
              Work Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-500 mb-1">Managerial Level</p>
                <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-200">
                  {employee.managerialLevel}
                </Badge>
              </div>
              {employee.jobType && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-500 mb-1">Job Type</p>
                  <div className="flex items-center space-x-2">
                    <Briefcase className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">{employee.jobType}</span>
                  </div>
                </div>
              )}
              {employee.location && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-500 mb-1">Location</p>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-600" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">{employee.location}</span>
                      {employee.branch && (
                        <p className="text-xs text-gray-600">{employee.branch}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Organization Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building2 className="h-5 w-5 mr-2 text-orange-500" />
              Organization Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm font-medium text-gray-500 mb-1">Join Date</p>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-gray-900">{formatDate(employee.joinDate)}</span>
                </div>
              </div>
              {employee.orgPath && (
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-500 mb-1">Organization Path</p>
                  <p className="text-sm text-gray-900 font-mono text-xs">{employee.orgPath}</p>
                </div>
              )}
              {employee.directManager && (
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-500 mb-1">Direct Manager</p>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium text-gray-900">{employee.directManager}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warnings Section - Compact Creative Design */}
      <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
        {/* Compact animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-100/20 via-transparent to-orange-100/20"></div>
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-200/30 to-yellow-300/20 rounded-full -translate-y-10 translate-x-10 blur-xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-orange-200/20 to-amber-300/30 rounded-full translate-y-8 -translate-x-8 blur-lg animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <CardHeader className="relative pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Compact icon with layered effects */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/40 to-orange-500/40 rounded-xl blur-md animate-pulse"></div>
                <div className="relative p-2 bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 rounded-xl shadow-lg border border-amber-300/50">
                  <FileText className="h-4 w-4 text-white drop-shadow-lg" />
                </div>
              </div>
              
              <div className="flex flex-col">
                <CardTitle className="text-lg font-bold text-amber-900 tracking-wide">
                  Employee Warnings
                </CardTitle>
                <p className="text-xs text-amber-700/80 font-medium mt-0.5">
                  Active disciplinary records
                </p>
              </div>
            </div>
            
            {/* Compact count badge */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/40 to-orange-500/40 rounded-full blur-md animate-pulse"></div>
              <Badge className="relative bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg border-2 border-amber-300/50 hover:scale-110 transition-transform duration-300">
                {employee.warnings_count || employee.warnings?.length || 0}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="relative space-y-3">
          {employee.warnings && employee.warnings.length > 0 ? (
            <>
              {/* Compact warnings list */}
              <div className="space-y-2">
                {employee.warnings.map((warning, index) => (
                  <div 
                    key={index} 
                    className="relative group p-3 bg-white/70 backdrop-blur-sm border border-amber-200/60 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]"
                  >
                    {/* Compact decorative line */}
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-400 to-orange-500 rounded-r-full"></div>
                    
                    <div className="ml-3 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-1.5 mb-1.5">
                          <div className="w-1.5 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full animate-pulse"></div>
                          <span className="text-xs font-semibold text-amber-900">
                            Warning #{index + 1}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{warning}</p>
                      </div>
                      
                      {/* Compact severity indicator */}
                      <div className="ml-3 flex flex-col items-center space-y-0.5">
                        <div className="w-2 h-2 bg-gradient-to-br from-red-400 to-orange-500 rounded-full shadow-sm"></div>
                        <span className="text-[10px] text-amber-600 font-medium">High</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Compact summary footer */}
              <div className="mt-4 p-3 bg-white/50 backdrop-blur-sm border border-amber-200/40 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-lg">
                      <FileText className="h-3 w-3 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-amber-900">
                        Total Active Warnings
                      </p>
                      <p className="text-[10px] text-amber-700/80">
                        Requires attention
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xl font-bold text-amber-900">
                      {employee.warnings_count || employee.warnings.length}
                    </div>
                    <div className="text-[10px] text-amber-600 font-medium">
                      Record{(employee.warnings_count || employee.warnings.length) !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Compact no warnings state */
            <div className="text-center py-6">
              <div className="relative inline-block mb-3">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400/30 to-emerald-500/30 rounded-full blur-lg animate-pulse"></div>
                <div className="relative p-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-lg">
                  <FileText className="h-6 w-6 text-white drop-shadow-lg" />
                </div>
              </div>
              
              <h3 className="text-base font-bold text-green-800 mb-1.5">
                Clean Record
              </h3>
              <p className="text-sm text-green-700/80 font-medium mb-3">
                No active warnings or disciplinary actions
              </p>
              
              <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200/60 rounded-full">
                <div className="w-1.5 h-1.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-green-800">
                  Excellent Standing
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Evaluations Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Evaluation History</CardTitle>
              <p className="text-gray-600">Click on an evaluation to view detailed competencies and objectives</p>
            </div>
            <Dialog open={isAddEvaluationOpen} onOpenChange={setIsAddEvaluationOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Evaluation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Evaluation</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Evaluation Type */}
                  <div className="space-y-2">
                    <Label htmlFor="type">Evaluation Type</Label>
                    <Select
                      value={newEvaluation.type}
                      onValueChange={(value: 'Quarterly' | 'Annual' | 'Optional') => 
                        setNewEvaluation(prev => ({ ...prev, type: value, quarter: undefined }))
                      }
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select evaluation type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Quarterly">Quarterly</SelectItem>
                        <SelectItem value="Annual">Annual</SelectItem>
                        <SelectItem value="Optional">Optional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Year Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Select
                      value={newEvaluation.year.toString()}
                      onValueChange={(value) => 
                        setNewEvaluation(prev => ({ ...prev, year: parseInt(value) }))
                      }
                    >
                      <SelectTrigger id="year">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quarter Selection (only for Optional type) */}
                  {newEvaluation.type === 'Optional' && (
                    <div className="space-y-2">
                      <Label htmlFor="quarter">Quarter/Period</Label>
                      <Select
                        value={newEvaluation.quarter?.toString() || ''}
                        onValueChange={(value) => 
                          setNewEvaluation(prev => ({ ...prev, quarter: parseInt(value) }))
                        }
                      >
                        <SelectTrigger id="quarter">
                          <SelectValue placeholder="Select quarter" />
                        </SelectTrigger>
                        <SelectContent>
                          {quarterOptions.map(quarter => (
                            <SelectItem key={quarter} value={quarter.toString()}>
                              Q{quarter}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Reviewer Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="reviewer">Reviewer</Label>
                    <Select
                      value={newEvaluation.reviewer_id || ''}
                      onValueChange={(value) => setNewEvaluation({
                        ...newEvaluation,
                        reviewer_id: value
                      })}
                      disabled={managersLoading || managers.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          managersLoading ? "Loading managers..." :
                          managers.length === 0 ? "No managers available" :
                          "Select a reviewer"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {managersError ? (
                          <SelectItem value="error" disabled>
                            Error loading managers
                          </SelectItem>
                        ) : managers.length === 0 ? (
                          <SelectItem value="no-managers" disabled>
                            No managers found for this company
                          </SelectItem>
                        ) : (
                          managers.map((manager) => (
                            <SelectItem key={manager.employee_id} value={manager.user_id}>
                              {manager.name} ({manager.role})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>



                  {/* Info about what will be created */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium mb-1">
                      This will create:
                    </p>
                    <p className="text-sm text-blue-700">
                      {newEvaluation.type === 'Quarterly' && '4 quarterly evaluation records (Q1, Q2, Q3, Q4)'}
                      {newEvaluation.type === 'Annual' && '2 annual evaluation records (Mid-Year, End-Year)'}
                      {newEvaluation.type === 'Optional' && newEvaluation.quarter && `1 optional evaluation record (Q${newEvaluation.quarter})`}
                      {newEvaluation.type === 'Optional' && !newEvaluation.quarter && 'Please select a quarter'}
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddEvaluationOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateEvaluation}
                    disabled={!isFormValid() || isCreatingEvaluation}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isCreatingEvaluation ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Creating...</span>
                      </div>
                    ) : (
                      `Create Evaluation${newEvaluation.type === 'Quarterly' ? 's' : newEvaluation.type === 'Annual' ? 's' : ''}`
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>


          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {evaluationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading evaluations...</span>
              </div>
            ) : evaluationsError ? (
              <div className="text-center py-8">
                <p className="text-red-600">Failed to load evaluations</p>
                <p className="text-sm text-gray-500 mt-1">{evaluationsError.message}</p>
              </div>
            ) : evaluationList.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No evaluations found</p>
                <p className="text-sm text-gray-500 mt-1">Add an evaluation to get started</p>
              </div>
            ) : (
              evaluationList.map((evaluation) => (
              <Card 
                key={evaluation.id} 
                className="hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center space-x-4 cursor-pointer flex-1"
                      onClick={() => setSelectedEvaluation(evaluation)}
                    >
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <BarChart3 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{evaluation.type}</h3>
                        <p className="text-sm text-gray-600">{evaluation.period}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <Badge 
                        variant={
                          evaluation.status === 'Completed' ? 'default' : 
                          evaluation.status === 'Employee Review' ? 'secondary' : 'outline'
                        }
                        className={
                          evaluation.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          evaluation.status === 'Employee Review' ? 'bg-yellow-100 text-yellow-800' :
                          evaluation.status === 'Pending HoD Approval' ? 'bg-orange-100 text-orange-800' :
                          evaluation.status === 'Pending HR Approval' ? 'bg-purple-100 text-purple-800' :
                          evaluation.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                          evaluation.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                          evaluation.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }
                      >
                        {evaluation.status}
                      </Badge>
                      
                      {evaluation.score && (
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">{evaluation.score}</div>
                          <div className="text-xs text-gray-500">Score</div>
                        </div>
                      )}
                      
                      <div className="text-right space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="h-4 w-4 mr-1" />
                          {evaluation.reviewer}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditEvaluation(evaluation);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEvaluation(evaluation.id);
                          }}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Evaluation Modal */}
      <Dialog open={isEditEvaluationOpen} onOpenChange={setIsEditEvaluationOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
          <DialogTitle>Edit Evaluation</DialogTitle>
              <p className="text-sm text-gray-500">
                Update the evaluation details below. Status transitions follow the workflow: Draft → Pending HoD Approval → Pending HR Approval → Employee Review → Approved → Completed.
              </p>
        </DialogHeader>
          
          {editingEvaluation && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-type" className="text-right">
                  Type
                </Label>
                <Select
                  value={editingEvaluation.type}
                  onValueChange={(value) => setEditingEvaluation({
                    ...editingEvaluation,
                    type: value as 'Quarterly' | 'Annual' | 'Optional'
                  })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                   <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Annual">Annual</SelectItem>
                   <SelectItem value="Optional">Optional</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-period" className="text-right">
                  Period
                </Label>
                <Input
                  id="edit-period"
                  value={editingEvaluation.period}
                  onChange={(e) => setEditingEvaluation({
                    ...editingEvaluation,
                    period: e.target.value
                  })}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                   <Label htmlFor="edit-status" className="text-right">
                     Status
                   </Label>
                   <div className="col-span-3 space-y-2">
                     <Select
                       value={editingEvaluation.status}
                       onValueChange={(value) => setEditingEvaluation({
                         ...editingEvaluation,
                         status: value as 'Draft' | 'Pending HoD Approval' | 'Pending HR Approval' | 'Employee Review' | 'Approved' | 'Rejected' | 'Completed'
                       })}
                     >
                       <SelectTrigger id="edit-status">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         {(() => {
                           const originalEvaluation = evaluationList.find(e => e.id === editingEvaluation.id);
                           const currentStatus = originalEvaluation?.status || editingEvaluation.status;
                           const validTransitions = [currentStatus, ...getValidStatusTransitions(currentStatus)];
                           
                           return [
                             { value: 'Draft', label: 'Draft' },
                             { value: 'Pending HoD Approval', label: 'Pending HoD Approval' },
                             { value: 'Pending HR Approval', label: 'Pending HR Approval' },
                             { value: 'Employee Review', label: 'Employee Review' },
                             { value: 'Approved', label: 'Approved' },
                             { value: 'Rejected', label: 'Rejected' },
                             { value: 'Completed', label: 'Completed' }
                           ].map(status => (
                             <SelectItem 
                               key={status.value} 
                               value={status.value}
                               disabled={!validTransitions.includes(status.value)}
                             >
                               {status.label}
                             </SelectItem>
                           ));
                         })()} 
                       </SelectContent>
                     </Select>
                     {(() => {
                       const originalEvaluation = evaluationList.find(e => e.id === editingEvaluation.id);
                       if (originalEvaluation && !isValidStatusTransition(originalEvaluation.status, editingEvaluation.status)) {
                         return (
                           <p className="text-sm text-red-600">
                             Invalid status transition from {originalEvaluation.status} to {editingEvaluation.status}
                           </p>
                         );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="edit-reviewer" className="text-right">
                   Reviewer
                 </Label>
                 <Select
                   value={editingEvaluation.reviewer_id || ''}
                   onValueChange={(value) => setEditingEvaluation({
                     ...editingEvaluation,
                     reviewer_id: value
                   })}
                   disabled={managersLoading || managers.length === 0}
                 >
                   <SelectTrigger className="col-span-3">
                     <SelectValue placeholder={
                       managersLoading ? "Loading managers..." :
                       managers.length === 0 ? "No managers available" :
                       "Select a reviewer"
                     } />
                   </SelectTrigger>
                   <SelectContent>
                     {managersError ? (
                       <SelectItem value="error" disabled>
                         Error loading managers
                       </SelectItem>
                     ) : managers.length === 0 ? (
                       <SelectItem value="no-managers" disabled>
                         No managers found for this company
                       </SelectItem>
                     ) : (
                       managers.map((manager) => (
                         <SelectItem key={manager.user_id} value={manager.user_id}>
                           {manager.name} ({manager.role})
                         </SelectItem>
                       ))
                     )}
                   </SelectContent>
                 </Select>
               </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-date" className="text-right">
                  Date
                </Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editingEvaluation.date}
                  onChange={(e) => setEditingEvaluation({
                    ...editingEvaluation,
                    date: e.target.value
                  })}
                  className="col-span-3"
                />
              </div>
              
              {/* Score field removed - made non-editable as requested */}
            </div>
          )}
          
          {!isEditFormValid() && editingEvaluation && (
             <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
               <p className="text-sm text-yellow-800">
                 <strong>Validation Requirements:</strong>
               </p>
               <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                 {!editingEvaluation.type && <li>• Evaluation type is required</li>}
                 {!editingEvaluation.period && <li>• Period is required</li>}

                 {(() => {
                   const originalEvaluation = evaluationList.find(e => e.id === editingEvaluation.id);
                   if (originalEvaluation && !isValidStatusTransition(originalEvaluation.status, editingEvaluation.status)) {
                     return <li>• Invalid status transition from "{originalEvaluation.status}" to "{editingEvaluation.status}"</li>;
                   }
                   return null;
                 })()}
               </ul>
             </div>
           )}
           
           <DialogFooter>
             <Button 
               variant="outline" 
               onClick={() => setIsEditEvaluationOpen(false)}
             >
               Cancel
             </Button>
             <Button 
                onClick={handleUpdateEvaluation}
                disabled={!isEditFormValid() || isUpdatingEvaluation}
                className={!isEditFormValid() || isUpdatingEvaluation ? 'opacity-50 cursor-not-allowed' : ''}
              >
                {isUpdatingEvaluation ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Updating...</span>
                  </div>
                ) : (
                  'Update Evaluation'
                )}
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeDetails;
