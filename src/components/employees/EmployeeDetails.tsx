
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Calendar, User, BarChart3, FileText, Target, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import EvaluationDetails from './EvaluationDetails';
import { EmployeeInput, EvaluationInput } from '../../types/shared';
import { useEvaluations } from '../../hooks/useApi';
import { ApiEvaluationResponse } from '../../types/api';
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
  reviewer_id: string;
  status: 'Draft';
}

interface Reviewer {
  id: string;
  name: string;
  role: 'Line Manager' | 'Head-of-Dept' | 'HR';
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
    reviewer_id: '',
    status: 'Draft'
  });

  // Fetch evaluations from API
  console.log('Fetching evaluations for employee ID:', employee.id);
  const { data: evaluationsData, isLoading: evaluationsLoading, error: evaluationsError } = useEvaluations({
    employee_id: employee.id
  });
  
  console.log('Evaluations loading:', evaluationsLoading);
  console.log('Evaluations error:', evaluationsError);
  console.log('Full evaluationsData object:', JSON.stringify(evaluationsData, null, 2));

  // Transform API data to match the expected format
  const transformApiEvaluation = (apiEval: ApiEvaluationResponse): EvaluationInput => {
    console.log('Transforming API evaluation:', apiEval);
    
    // Parse score safely
    let score: number | undefined;
    if (apiEval.score) {
      const parsedScore = parseFloat(apiEval.score);
      score = isNaN(parsedScore) ? undefined : parsedScore;
    }
    
    const transformed = {
      id: apiEval.evaluation_id,
      type: apiEval.type,
      period: apiEval.period,
      status: apiEval.status,
      score: score,
      reviewer: apiEval.reviewer,
      date: new Date(apiEval.created_at).toISOString().split('T')[0]
    };
    
    console.log('Transformed evaluation:', transformed);
    return transformed;
  };

  // Get evaluation list from API data
  const evaluationList = useMemo(() => {
    console.log('=== EVALUATION DATA DEBUG ===');
    console.log('Raw evaluationsData:', evaluationsData);
    console.log('evaluationsData type:', typeof evaluationsData);
    console.log('evaluationsData.results:', evaluationsData?.results);
    console.log('evaluationsData.results type:', typeof evaluationsData?.results);
    console.log('evaluationsData.results length:', evaluationsData?.results?.length);
    
    // Handle different possible response structures
    let dataToTransform: ApiEvaluationResponse[] = [];
    
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
    
    console.log('Data to transform:', dataToTransform);
    console.log('Data to transform length:', dataToTransform.length);
    
    if (!dataToTransform || dataToTransform.length === 0) {
       console.log('No evaluation data to transform');
       
       // Temporary: Add mock data for testing if no API data is available
       console.log('Adding temporary mock data for testing...');
       const mockEvaluation: EvaluationInput = {
         id: 'mock-1',
         type: 'Quarterly',
         period: '2024 Q1',
         status: 'Completed',
         score: 85,
         reviewer: 'John Manager',
         date: '2024-03-15'
       };
       return [mockEvaluation];
     }
    
    try {
      const transformed = dataToTransform.map(transformApiEvaluation);
      console.log('Transformed evaluations:', transformed);
      console.log('Transformed evaluations length:', transformed.length);
      return transformed;
    } catch (error) {
      console.error('Error transforming evaluations:', error);
      console.error('Error details:', error);
      return [];
    }
  }, [evaluationsData]);

  // Mock reviewers data - in real app, this would come from API
  const reviewers: Reviewer[] = [
    { id: '1', name: 'Michael Chen', role: 'Line Manager' },
  { id: '2', name: 'Emily Rodriguez', role: 'Head-of-Dept' },
  { id: '3', name: 'Sarah Johnson', role: 'HR' },
  { id: '4', name: 'David Kim', role: 'Line Manager' },
  { id: '5', name: 'Lisa Wang', role: 'Head-of-Dept' }
  ];

  // Generate year options (current year ± 3)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);

  // Generate quarter options for Optional type
  const quarterOptions = Array.from({ length: 6 }, (_, i) => i + 1);

  // Helper function to generate evaluation records
  const generateEvaluationRecords = () => {
    const records: Partial<EvaluationInput>[] = [];
    const baseRecord = {
      reviewer: reviewers.find(r => r.id === newEvaluation.reviewer_id)?.name || '',
      date: new Date().toISOString().split('T')[0],
      status: 'Draft' as const,
      type: newEvaluation.type
    };

    if (newEvaluation.type === 'Quarterly') {
      // Generate 4 quarterly records
      for (let q = 1; q <= 4; q++) {
        records.push({
          ...baseRecord,
          id: `${Date.now()}-Q${q}`,
          period: `${newEvaluation.year}-Q${q}`,
          type: 'Quarterly Review'
        });
      }
    } else if (newEvaluation.type === 'Annual') {
      // Generate 2 annual records
      records.push(
        {
          ...baseRecord,
          id: `${Date.now()}-Mid`,
          period: `${newEvaluation.year}-Mid`,
          type: 'Mid-Year Review'
        },
        {
          ...baseRecord,
          id: `${Date.now()}-End`,
          period: `${newEvaluation.year}-End`,
          type: 'Annual Review'
        }
      );
    } else if (newEvaluation.type === 'Optional' && newEvaluation.quarter) {
      // Generate 1 optional record
      records.push({
        ...baseRecord,
        id: `${Date.now()}-Q${newEvaluation.quarter}`,
        period: `${newEvaluation.year}-Q${newEvaluation.quarter}`,
        type: 'Optional Review'
      });
    }

    return records;
  };

  const handleCreateEvaluation = () => {
    const records = generateEvaluationRecords();
    console.log('Creating evaluation records:', records);
    // TODO: Implement API call to create evaluations
    // This would use useCreateEvaluation hook and call the API
    
    // Reset form and close modal
    setNewEvaluation({
      type: 'Quarterly',
      year: new Date().getFullYear(),
      reviewer_id: '',
      status: 'Draft'
    });
    setIsAddEvaluationOpen(false);
  };

  const handleEditEvaluation = (evaluation: EvaluationInput) => {
    setEditingEvaluation(evaluation);
    setIsEditEvaluationOpen(true);
  };

  const handleUpdateEvaluation = () => {
    if (!editingEvaluation) return;

    // TODO: Implement API call to update evaluation
    // This would use useUpdateEvaluation hook and call the API
    console.log('Updating evaluation:', editingEvaluation);
    
    setIsEditEvaluationOpen(false);
    setEditingEvaluation(null);
  };

  const handleDeleteEvaluation = (evaluationId: string) => {
    // TODO: Implement API call to delete evaluation
    // This would use useDeleteEvaluation hook and call the API
    console.log('Deleting evaluation:', evaluationId);
  };

  const isFormValid = () => {
    if (!newEvaluation.reviewer_id) return false;
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
                             editingEvaluation.period && 
                             editingEvaluation.reviewer_id;
    
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
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={employee.avatar} alt={employee.name} />
              <AvatarFallback className="bg-blue-600 text-white text-xl">
                {employee.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">{employee.name}</CardTitle>
              <p className="text-lg text-gray-600">{employee.position}</p>
              <p className="text-sm text-gray-500 mb-2">{employee.companyName}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {/* <Badge variant={employee.status === 'Active' ? 'Active' : 'Inactive'}>
                  {employee.status}
                </Badge> */}
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {employee.role}
                </Badge>
                <span className="text-sm text-gray-500">{employee.department}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <a 
                href={`mailto:${employee.email}`}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                {employee.email}
              </a>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Phone</p>
              <a 
                href={generateWhatsAppUrl(employee.phone, employee.countryCode)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-600 hover:text-green-800 hover:underline transition-colors"
              >
                {formatPhoneNumber(employee.phone, employee.countryCode)}
              </a>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Managerial Level</p>
              <Badge variant="outline" className="w-fit">
                {employee.managerialLevel}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Join Date</p>
              <p className="text-sm">{formatDate(employee.joinDate)}</p>
            </div>
          </div>
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
                      <SelectTrigger>
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
                      <SelectTrigger>
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
                        <SelectTrigger>
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
                      value={newEvaluation.reviewer_id}
                      onValueChange={(value) => 
                        setNewEvaluation(prev => ({ ...prev, reviewer_id: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select reviewer" />
                      </SelectTrigger>
                      <SelectContent>
                        {reviewers.map(reviewer => (
                          <SelectItem key={reviewer.id} value={reviewer.id}>
                            {reviewer.name} ({reviewer.role})
                          </SelectItem>
                        ))}
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
                    disabled={!isFormValid()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Create Evaluation{newEvaluation.type === 'Quarterly' ? 's' : newEvaluation.type === 'Annual' ? 's' : ''}
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
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(evaluation.date)}
                        </div>
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
                       <SelectTrigger>
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
                   value={editingEvaluation.reviewer_id?.toString() || ''}
                   onValueChange={(value) => {
const reviewer = reviewers.find(r => r.id === value);
                     setEditingEvaluation({
                       ...editingEvaluation,
                       reviewer_id: parseInt(value),
                       reviewer: reviewer?.name || ''
                     });
                   }}
                 >
                   <SelectTrigger className="col-span-3">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     {reviewers.map((reviewer) => (
                       <SelectItem key={reviewer.id} value={reviewer.id.toString()}>
                         {reviewer.name} ({reviewer.role})
                       </SelectItem>
                     ))}
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
              
              {editingEvaluation.score !== undefined && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-score" className="text-right">
                    Score
                  </Label>
                  <Input
                    id="edit-score"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={editingEvaluation.score}
                    onChange={(e) => setEditingEvaluation({
                      ...editingEvaluation,
                      score: parseFloat(e.target.value) || 0
                    })}
                    className="col-span-3"
                  />
                </div>
              )}
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
                 {!editingEvaluation.reviewer_id && <li>• Reviewer selection is required</li>}

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
                disabled={!isEditFormValid()}
                className={!isEditFormValid() ? 'opacity-50 cursor-not-allowed' : ''}
              >
                Update Evaluation
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeDetails;
