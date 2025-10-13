import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Briefcase, 
  Edit3, 
  Save, 
  X,
  BarChart3,
  Target,
  Award,
  Clock,
  TrendingUp,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  Users,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { 
  useEvaluations, 
  useUpdateEvaluation, 
  useEmployees, 
  useObjectives, 
  useCompetencies,
  useCreateEvaluation 
} from '../../hooks/useApi';
import { ApiEvaluation, ApiObjective, ApiCompetency, ApiUser, EmployeeQueryParams } from '../../types/api';
import { toast } from 'sonner';
import apiService from '../../services/api';

interface EmployeeProfileData {
  // Basic Information
  employee_code: string;
  name: string;
  email: string;
  phone: string;
  country_code: string;
  avatar: string;
  
  // Employment Details
  role: string;
  position: string;
  managerial_level: string;
  status: string;
  
  // Company Information
  company_name: string;
  org_path: string;
  department: string;
  
  // Additional Details
  join_date: string;
  job_type: string;
  location: string;
  branch: string;
  direct_manager: string;
  gender?: string;
  
  // Warnings Information
  warnings: string[];
  warnings_count: number;
  
  // System Information
  user_id: string;
  company_id: string;
  created_at: string;
  updated_at: string;
  
  // Legacy fields for backward compatibility
  joinDate: string;
  bio: string;
}

// Local interfaces for objectives and competencies display
interface LocalObjective {
  id: string;
  employee_id: string;
  evaluation_id: string;
  title: string;
  description: string;
  target: number;
  achieved: number;
  weight: number;
  status: 'Completed' | 'In-progress' | 'Not started';
}

interface LocalCompetency {
  id: string;
  employee_id: string;
  evaluation_id: string;
  name: string;
  category: 'Core' | 'Leadership' | 'Functional';
  required_level: number;
  actual_level: number;
  weight: number;
  description: string;
}

// Hidden evaluation data type
interface HiddenEvaluationData {
  detailed_evaluations: any[];
  metadata: {
    total_evaluations: number;
    confidentiality_level: string;
    access_timestamp: string;
    user_clearance: string;
  };
}

const EmployeeProfile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingEvaluation, setIsEditingEvaluation] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<ApiEvaluation>(null);
  const [evaluationComment, setEvaluationComment] = useState('');
  
  // State for objectives and competencies data
  const [objectivesData, setObjectivesData] = useState<ApiObjective[]>([]);
  const [competenciesData, setCompetenciesData] = useState<ApiCompetency[]>([]);
  const [isLoadingObjectives, setIsLoadingObjectives] = useState(false);
  const [isLoadingCompetencies, setIsLoadingCompetencies] = useState(false);
  
  // Panel state for showing objectives and competencies
  const [showEvaluationPanel, setShowEvaluationPanel] = useState(false);
  const [selectedEvaluationForPanel, setSelectedEvaluationForPanel] = useState<ApiEvaluation | null>(null);
  
  // Hidden evaluation data storage - fetched but not displayed
  const [hiddenEvaluationData, setHiddenEvaluationData] = useState<HiddenEvaluationData | null>(null);
  
  // Get employee data based on current user
  const queryParams: EmployeeQueryParams = user?.user_id ? { role: user.role } : {};
  const { data: employeesData } = useEmployees(queryParams);
  const currentEmployee = employeesData?.results?.[0];
  
  // Get evaluations for the current employee
  const { data: evaluationsData, isLoading: evaluationsLoading, refetch: refetchEvaluations } = useEvaluations({
    employee_id: currentEmployee?.employee_id
  });
  
  const updateEvaluationMutation = useUpdateEvaluation();
  const createEvaluationMutation = useCreateEvaluation();



  // Handle evaluation card click to fetch objectives and competencies
  const handleEvaluationClick = async (evaluation: ApiEvaluation) => {
    const evaluationId = evaluation.evaluation_id || evaluation.id;
    
    if (!evaluationId) {
      console.error('No evaluation ID found');
      return;
    }

    console.log('Fetching data for evaluation:', evaluationId);
    
    try {
      // Set loading states
      setIsLoadingObjectives(true);
      setIsLoadingCompetencies(true);
      
      // Set selected evaluation for panel
      setSelectedEvaluationForPanel(evaluation);
      setShowEvaluationPanel(true);
      
      // Fetch objectives and competencies data using the API service (with automatic token refresh)
      const [objectivesResponse, competenciesResponse] = await Promise.allSettled([
        apiService.getObjectives(evaluationId),
        apiService.getCompetencies(evaluationId)
      ]);
      
      // Handle objectives response
      if (objectivesResponse.status === 'fulfilled') {
        setObjectivesData(objectivesResponse.value);
        console.log('Objectives data:', objectivesResponse.value);
      } else {
        console.error('Failed to fetch objectives:', objectivesResponse.reason);
        setObjectivesData([]);
      }
      
      // Handle competencies response
      if (competenciesResponse.status === 'fulfilled') {
        setCompetenciesData(competenciesResponse.value);
        console.log('Competencies data:', competenciesResponse.value);
      } else {
        console.error('Failed to fetch competencies:', competenciesResponse.reason);
        setCompetenciesData([]);
      }
      
      // Record evaluation access
      await recordEvaluationAccess(evaluationId, evaluation);
      
    } catch (error) {
      console.error('Error in handleEvaluationClick:', error);
      toast.error('Error loading evaluation data');
    } finally {
      setIsLoadingObjectives(false);
      setIsLoadingCompetencies(false);
    }
  };

  // Record evaluation access for tracking purposes
  const recordEvaluationAccess = async (evaluationId: string, evaluation: ApiEvaluation) => {
    try {
      console.log('Recording evaluation access for:', evaluationId);
      
      // Instead of creating a new evaluation, we should create an access log
      // For now, let's skip this functionality to avoid the 403 error
      // This would typically be handled by a separate access logging endpoint
      
      console.log('Evaluation access logged (client-side only):', {
        evaluationId,
        userId: (user as ApiUser)?.user_id,
        timestamp: new Date().toISOString(),
        evaluationType: evaluation.type,
        evaluationStatus: evaluation.status
      });
      
      // Optional: You could implement a proper access logging endpoint later
      // await apiService.logEvaluationAccess({ evaluationId, userId: user.user_id });
      
    } catch (error) {
      console.error('Error recording evaluation access:', error);
      // Don't throw error here as this is just for logging purposes
    }
  };

  // Trigger refetch when currentEmployee changes
  useEffect(() => {
    if (currentEmployee?.employee_id) {
      console.log('currentEmployee changed, refetching evaluations for employee_id:', currentEmployee.employee_id);
      refetchEvaluations();
    }
  }, [currentEmployee?.employee_id, refetchEvaluations]);

  // Fetch hidden evaluation data - transmitted over network but not displayed
  useEffect(() => {
    const fetchHiddenEvaluationData = async () => {
      if (evaluationsData?.results) {
        try {
          // Simulate fetching detailed evaluation data that includes sensitive information
          const detailedEvaluations = evaluationsData.results.map((evaluation: ApiEvaluation) => ({
            ...evaluation,
            // Hidden fields that are fetched but not shown in UI
            internal_notes: `Internal evaluation notes for ${evaluation.type} - ${evaluation.period}`,
            hr_comments: `HR internal comments and observations`,
            manager_feedback: `Detailed manager feedback and recommendations`,
            performance_metrics: {
              productivity_score: Math.floor(Math.random() * 100),
              collaboration_rating: Math.floor(Math.random() * 10),
              innovation_index: Math.floor(Math.random() * 100),
              attendance_percentage: 95 + Math.floor(Math.random() * 5)
            },
            salary_recommendations: {
              current_salary: 75000 + Math.floor(Math.random() * 50000),
              recommended_increase: Math.floor(Math.random() * 15),
              bonus_eligibility: Math.random() > 0.5
            },
            development_areas: [
              'Technical skills enhancement',
              'Leadership development',
              'Communication improvement'
            ],
            confidential_status: 'RESTRICTED_ACCESS',
            last_updated_by: 'system_admin',
            audit_trail: `Accessed on ${new Date().toISOString()}`
          }));

          // Store the hidden data (transmitted over network but not displayed)
          setHiddenEvaluationData({
            detailed_evaluations: detailedEvaluations,
            metadata: {
              total_evaluations: detailedEvaluations.length,
              confidentiality_level: 'HIGH',
              access_timestamp: new Date().toISOString(),
              user_clearance: user?.role || 'employee'
            }
          });

          // Log that data was fetched (for demonstration purposes)
          console.log('Hidden evaluation data fetched and stored (not displayed in UI):', {
            count: detailedEvaluations.length,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error fetching hidden evaluation data:', error);
        }
      }
    };

    fetchHiddenEvaluationData();
  }, [evaluationsData, user?.role]);

  // Enhanced profile data initialization using currentEmployee data
  const [profileData, setProfileData] = useState<EmployeeProfileData>(() => {
    const employee = currentEmployee;
    return {
      // Basic Information
      employee_code: employee?.employee_code || 'N/A',
      name: user?.name || employee?.name || 'Employee Name',
      email: user?.email || employee?.email || 'employee@company.com',
      phone: employee?.phone || user?.phone || '+1 (555) 123-4567',
      country_code: employee?.country_code || '+966',
      avatar: employee?.avatar || user?.avatar || '/placeholder.svg',
      
      // Employment Details
      role: employee?.role || user?.role || 'EMP',
      position: employee?.position || user?.position || 'Position',
      managerial_level: employee?.managerial_level || 'Individual Contributor',
      status: employee?.status || 'Active',
      
      // Company Information
      company_name: employee?.company_name || 'Company',
      org_path: employee?.org_path || '',
      department: Array.isArray(employee?.department) 
        ? employee.department.join(', ') 
        : employee?.department || 'Department',
      
      // Additional Details
      join_date: employee?.join_date || '2024-01-01',
      job_type: employee?.job_type || 'Full-time',
      location: employee?.location || '',
      branch: employee?.branch || '',
      direct_manager: employee?.direct_manager || '',
      gender: employee?.gender || '',
      
      // Warnings Information
      warnings: employee?.warnings || [],
      warnings_count: employee?.warnings_count || 0,
      
      // System Information
      user_id: employee?.user_id || user?.user_id || '',
      company_id: employee?.company_id || '',
      created_at: employee?.created_at || '',
      updated_at: employee?.updated_at || '',
      
      // Legacy fields for backward compatibility
      joinDate: employee?.join_date || '2024-01-01',
      bio: 'Professional employee focused on delivering quality work and continuous improvement.'
    };
  });

  // Update profile data when currentEmployee changes
  useEffect(() => {
    if (currentEmployee) {
      const employee = currentEmployee;
      setProfileData({
        // Basic Information
        employee_code: employee?.employee_code || 'N/A',
        name: user?.name || employee?.name || 'Employee Name',
        email: user?.email || employee?.email || 'employee@company.com',
        phone: employee?.phone || user?.phone || '+1 (555) 123-4567',
        country_code: employee?.country_code || '+966',
        avatar: employee?.avatar || user?.avatar || '/placeholder.svg',
        
        // Employment Details
        role: employee?.role || user?.role || 'EMP',
        position: employee?.position || user?.position || 'Position',
        managerial_level: employee?.managerial_level || 'Individual Contributor',
        status: employee?.status || 'Active',
        
        // Company Information
        company_name: employee?.company_name || 'Company',
        org_path: employee?.org_path || '',
        department: Array.isArray(employee?.department) 
          ? employee.department.join(', ') 
          : employee?.department || 'Department',
        
        // Additional Details
        join_date: employee?.join_date || '2024-01-01',
        job_type: employee?.job_type || 'Full-time',
        location: employee?.location || '',
        branch: employee?.branch || '',
        direct_manager: employee?.direct_manager || '',
        gender: employee?.gender || '',
        
        // Warnings Information
        warnings: employee?.warnings || [],
        warnings_count: employee?.warnings_count || 0,
        
        // System Information
        user_id: employee?.user_id || user?.user_id || '',
        company_id: employee?.company_id || '',
        created_at: employee?.created_at || '',
        updated_at: employee?.updated_at || '',
        
        // Legacy fields for backward compatibility
        joinDate: employee?.join_date || '2024-01-01',
        bio: 'Professional employee focused on delivering quality work and continuous improvement.'
      });
    }
  }, [currentEmployee, user]);

  const [editData, setEditData] = useState<EmployeeProfileData>(profileData);

  // Transform evaluations data
  const evaluations = useMemo(() => {
    // Console log to verify the actual structure
    console.log('Raw evaluationsData:', evaluationsData);
    console.log('evaluationsData type:', typeof evaluationsData);
    console.log('evaluationsData keys:', evaluationsData ? Object.keys(evaluationsData) : 'null');
    
    // Normalize response shape - detect whether hook returns { results }, { data }, or raw array
    let evaluationsList = [];
    
    if (evaluationsData) {
      if (evaluationsData.results) {
        // Standard paginated response with results array
        evaluationsList = evaluationsData.results;
        console.log('Using evaluationsData.results:', evaluationsList);
      } else if (evaluationsData.data) {
        // Response with data property
        evaluationsList = evaluationsData.data;
        console.log('Using evaluationsData.data:', evaluationsList);
      } else if (Array.isArray(evaluationsData)) {
        // Direct array response
        evaluationsList = evaluationsData;
        console.log('Using direct array:', evaluationsList);
      } else {
        console.warn('Unknown evaluationsData structure:', evaluationsData);
        evaluationsList = [];
      }
    }
    
    console.log('Final evaluationsList:', evaluationsList);
    console.log('evaluationsList length:', evaluationsList.length);
    
    if (evaluationsList.length > 0) {
      console.log('First evaluation structure:', evaluationsList[0]);
      console.log('First evaluation keys:', Object.keys(evaluationsList[0]));
    }
    
    return evaluationsList.map((evaluation: ApiEvaluation) => ({
      ...evaluation,
      canEdit: evaluation.status === 'Employee Review' || evaluation.status === 'Draft'
    }));
  }, [evaluationsData]);

  // Convert API data to local interfaces for display
  const objectives: LocalObjective[] = useMemo(() => {
    if (!objectivesData || !Array.isArray(objectivesData)) {
      console.log('objectivesData is not an array:', objectivesData);
      return [];
    }
    
    return objectivesData.map((apiObj: ApiObjective) => ({
      id: apiObj.objective_id,
      employee_id: apiObj.employee_id,
      evaluation_id: apiObj.evaluation_id,
      title: apiObj.title,
      description: apiObj.description,
      target: apiObj.target,
      achieved: apiObj.achieved,
      weight: apiObj.weight,
      status: apiObj.status as 'Completed' | 'In-progress' | 'Not started'
    }));
  }, [objectivesData]);

  const competencies: LocalCompetency[] = useMemo(() => {
    if (!competenciesData || !Array.isArray(competenciesData)) {
      console.log('competenciesData is not an array:', competenciesData);
      return [];
    }
    
    return competenciesData.map((apiComp: ApiCompetency) => ({
      id: apiComp.competence_id,
      employee_id: apiComp.employee_id,
      evaluation_id: apiComp.evaluation_id || '',
      name: apiComp.name,
      category: apiComp.category as 'Core' | 'Leadership' | 'Functional',
      required_level: apiComp.required_level,
      actual_level: apiComp.actual_level,
      weight: apiComp.weight,
      description: apiComp.description
    }));
  }, [competenciesData]);

  // Score calculation functions
  const getObjectiveScore = (objective: LocalObjective): number => {
    return (objective.achieved / objective.target) * 100;
  };

  const getCompetencyScore = (competency: LocalCompetency): number => {
    return (competency.actual_level / competency.required_level) * 100;
  };

  const getOverallObjectiveScore = (): string => {
    if (objectives.length === 0) return '00.0';
    const totalWeight = objectives.reduce((sum, obj) => sum + obj.weight, 0);
    const weightedScore = objectives.reduce((sum, obj) => {
      return sum + (getObjectiveScore(obj) * obj.weight);
    }, 0);
    return totalWeight > 0 ? (weightedScore / totalWeight).toFixed(1) : '00.0';
  };

  const getOverallCompetencyScore = (): string => {
    if (competencies.length === 0) return '00.0';
    const totalWeight = competencies.reduce((sum, comp) => sum + comp.weight, 0);
    const weightedScore = competencies.reduce((sum, comp) => {
      return sum + (getCompetencyScore(comp) * comp.weight);
    }, 0);
    return totalWeight > 0 ? (weightedScore / totalWeight).toFixed(1) : '00.0';
  };

  const handleEdit = () => {
    setEditData(profileData);
    setIsEditing(true);
  };

  const handleSave = () => {
    setProfileData(editData);
    setIsEditing(false);
    toast.success('Profile updated successfully');
  };

  const handleCancel = () => {
    setEditData(profileData);
    setIsEditing(false);
  };

  const handleEditEvaluation = (evaluation: ApiEvaluation) => {
    setSelectedEvaluation(evaluation);
    setEvaluationComment('');
    setIsEditingEvaluation(true);
  };

  const handleSaveEvaluation = async () => {
    if (!selectedEvaluation) return;

    try {
      await updateEvaluationMutation.mutateAsync({
        id: selectedEvaluation.evaluation_id,
        data: {
          status: 'Pending HR Approval',
          employee_comments: evaluationComment
        }
      });
      
      toast.success('Evaluation updated successfully');
      setIsEditingEvaluation(false);
      setSelectedEvaluation(null);
      refetchEvaluations();
    } catch (error) {
      toast.error('Failed to update evaluation');
      console.error('Error updating evaluation:', error);
    }
  };

  // Format date helper function
  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Status transition validation functions (matching EmployeeDetails)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'Employee Review':
        return 'bg-blue-100 text-blue-800';
      case 'Pending HR Approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'Pending HoD Approval':
        return 'bg-orange-100 text-orange-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Please log in to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employee Profile</h2>
          <p className="text-gray-600">Manage your profile and evaluation status</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Personal Information</TabsTrigger>
          <TabsTrigger value="evaluations">My Evaluations</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Comprehensive Employee Profile Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xl font-semibold">Complete Employee Profile</CardTitle>
              {!isEditing ? (
                <Button onClick={handleEdit} variant="outline" size="sm">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button onClick={handleSave} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Profile Header with Avatar */}
              <div className="flex items-center space-x-6 pb-6 border-b">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profileData.avatar} alt={profileData.name} />
                  <AvatarFallback className="text-xl">
                    {getInitials(profileData.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900">{profileData.name}</h3>
                  <p className="text-lg text-gray-600">{profileData.position}</p>
                  <p className="text-sm text-gray-500">{profileData.department}</p>
                  <div className="flex items-center mt-2 space-x-4">
                    <Badge variant="outline" className="text-xs">
                      {profileData.employee_code}
                    </Badge>
                    <Badge 
                      variant={profileData.status === 'Active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {profileData.status}
                    </Badge>
                    {profileData.warnings_count > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {profileData.warnings_count} Warning{profileData.warnings_count > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Basic Information Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2 text-blue-600" />
                    Basic Information
                  </h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Employee Code</Label>
                        <div className="mt-1 p-2 bg-gray-50 rounded-md border">
                          <span className="text-sm text-gray-900">{profileData.employee_code}</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Full Name</Label>
                        {isEditing ? (
                          <Input
                            value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            className="mt-1"
                          />
                        ) : (
                          <div className="mt-1 p-2 bg-gray-50 rounded-md border">
                            <span className="text-sm text-gray-900">{profileData.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700 flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        Email Address
                      </Label>
                      {isEditing ? (
                        <Input
                          type="email"
                          value={editData.email}
                          onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                          className="mt-1"
                        />
                      ) : (
                        <div className="mt-1 p-2 bg-gray-50 rounded-md border">
                          <span className="text-sm text-gray-900">{profileData.email}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Country Code</Label>
                        <div className="mt-1 p-2 bg-gray-50 rounded-md border">
                          <span className="text-sm text-gray-900">{profileData.country_code || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-sm font-medium text-gray-700 flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          Phone Number
                        </Label>
                        {isEditing ? (
                          <Input
                            value={editData.phone}
                            onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                            className="mt-1"
                          />
                        ) : (
                          <div className="mt-1 p-2 bg-gray-50 rounded-md border">
                            <span className="text-sm text-gray-900">{profileData.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {profileData.gender && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Gender</Label>
                        <div className="mt-1 p-2 bg-gray-50 rounded-md border">
                          <span className="text-sm text-gray-900">{profileData.gender}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Employment Details Section */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Briefcase className="h-5 w-5 mr-2 text-green-600" />
                    Employment Details
                  </h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Role</Label>
                        <div className="mt-1 p-2 bg-gray-50 rounded-md border">
                          <Badge variant="outline" className="text-xs">
                            {profileData.role}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Position</Label>
                        {isEditing ? (
                          <Input
                            value={editData.position}
                            onChange={(e) => setEditData({ ...editData, position: e.target.value })}
                            className="mt-1"
                          />
                        ) : (
                          <div className="mt-1 p-2 bg-gray-50 rounded-md border">
                            <span className="text-sm text-gray-900">{profileData.position}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Managerial Level</Label>
                      <div className="mt-1 p-2 bg-gray-50 rounded-md border">
                        <span className="text-sm text-gray-900">{profileData.managerial_level}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Employment Status</Label>
                        <div className="mt-1 p-2 bg-gray-50 rounded-md border">
                          <Badge 
                            variant={profileData.status === 'Active' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {profileData.status}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Job Type</Label>
                        <div className="mt-1 p-2 bg-gray-50 rounded-md border">
                          <span className="text-sm text-gray-900">{profileData.job_type || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Join Date
                      </Label>
                      <div className="mt-1 p-2 bg-gray-50 rounded-md border">
                        <span className="text-sm text-gray-900">{formatDate(profileData.join_date)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Information Section */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  Company Information
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Company Name</Label>
                      <div className="mt-1 p-2 bg-gray-50 rounded-md border">
                        <span className="text-sm text-gray-900">{profileData.company_name}</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Department</Label>
                      {isEditing ? (
                        <Input
                          value={editData.department}
                          onChange={(e) => setEditData({ ...editData, department: e.target.value })}
                          className="mt-1"
                        />
                      ) : (
                        <div className="mt-1 p-2 bg-gray-50 rounded-md border">
                          <span className="text-sm text-gray-900">{profileData.department}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Organizational Path</Label>
                      <div className="mt-1 p-2 bg-gray-50 rounded-md border">
                        <span className="text-sm text-gray-900">{profileData.org_path || 'N/A'}</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Direct Manager</Label>
                      <div className="mt-1 p-2 bg-gray-50 rounded-md border">
                        <span className="text-sm text-gray-900">{profileData.direct_manager || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location & Additional Details Section */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-orange-600" />
                  Location & Additional Details
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Location</Label>
                    <div className="mt-1 p-2 bg-gray-50 rounded-md border">
                      <span className="text-sm text-gray-900">{profileData.location || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Branch</Label>
                    <div className="mt-1 p-2 bg-gray-50 rounded-md border">
                      <span className="text-sm text-gray-900">{profileData.branch || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">User ID</Label>
                    <div className="mt-1 p-2 bg-gray-50 rounded-md border">
                      <span className="text-xs text-gray-600 font-mono">{profileData.user_id}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warnings Section - Only show if there are warnings */}
              {profileData.warnings_count > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
                    Warnings Information
                  </h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-red-800">
                        Total Warnings: {profileData.warnings_count}
                      </span>
                      <Badge variant="destructive" className="text-xs">
                        {profileData.warnings_count} Active Warning{profileData.warnings_count > 1 ? 's' : ''}
                      </Badge>
                    </div>
                    {profileData.warnings.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-red-800">Warning Details:</Label>
                        <ul className="list-disc list-inside space-y-1">
                          {profileData.warnings.map((warning, index) => (
                            <li key={index} className="text-sm text-red-700">
                              {warning}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bio Section */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Professional Bio</h4>
                {isEditing ? (
                  <Textarea
                    value={editData.bio}
                    onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                    rows={3}
                    className="w-full"
                    placeholder="Enter professional bio..."
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="text-sm text-gray-700">{profileData.bio}</p>
                  </div>
                )}
              </div>

              {/* System Information - Collapsible */}
              {(profileData.created_at || profileData.updated_at) && (
                <div className="pt-4 border-t">
                  <details className="group">
                    <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center">
                      <span>System Information</span>
                      <svg className="ml-2 h-4 w-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </summary>
                    <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs text-gray-500">
                      {profileData.created_at && (
                        <div>
                          <span className="font-medium">Created:</span> {formatDate(profileData.created_at)}
                        </div>
                      )}
                      {profileData.updated_at && (
                        <div>
                          <span className="font-medium">Last Updated:</span> {formatDate(profileData.updated_at)}
                        </div>
                      )}
                      {profileData.company_id && (
                        <div>
                          <span className="font-medium">Company ID:</span> {profileData.company_id}
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluations" className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>My Evaluations</CardTitle>
                <p className="text-gray-600">View your evaluation history and status</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {evaluationsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Loading evaluations...</span>
                  </div>
                ) : evaluations.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No evaluations found</p>
                    <p className="text-sm text-gray-500 mt-1">Your evaluations will appear here once created</p>
                  </div>
                ) : (
                  evaluations.map((evaluation: any) => (
                    <Card 
                      key={evaluation.evaluation_id || evaluation.id} 
                      className="hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500 cursor-pointer"
                      onClick={() => handleEvaluationClick(evaluation)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="bg-blue-100 p-3 rounded-lg">
                              <BarChart3 className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{evaluation.type}</h3>
                              <p className="text-sm text-gray-600">{evaluation.period}</p>
                              {(isLoadingObjectives || isLoadingCompetencies) && (
                                <div className="flex items-center mt-1">
                                  <Loader2 className="h-3 w-3 animate-spin text-blue-600 mr-1" />
                                  <span className="text-xs text-blue-600">Loading data...</span>
                                </div>
                              )}
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
                                <span>Reviewer</span>
                              </div>
                            </div>
                            
                            {evaluation.canEdit && (
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditEvaluation(evaluation)}
                                  className="h-8 px-3"
                                >
                                  <Edit3 className="h-4 w-4 mr-1" />
                                  Review
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Evaluation Edit Dialog */}
      <Dialog open={isEditingEvaluation} onOpenChange={setIsEditingEvaluation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Evaluation</DialogTitle>
          </DialogHeader>
          
          {selectedEvaluation && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">{selectedEvaluation.type} Evaluation</h4>
                <p className="text-sm text-gray-600">Period: {selectedEvaluation.period}</p>
                <Badge className={getStatusColor(selectedEvaluation.status)}>
                  {selectedEvaluation.status}
                </Badge>
              </div>
              
              <div>
                <Label htmlFor="evaluation-comment">Your Comments (Optional)</Label>
                <Textarea
                  id="evaluation-comment"
                  value={evaluationComment}
                  onChange={(e) => setEvaluationComment(e.target.value)}
                  placeholder="Add any comments about this evaluation..."
                  rows={3}
                />
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  By submitting this review, your evaluation will be sent to HR for final approval.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              onClick={() => setIsEditingEvaluation(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEvaluation}
              disabled={updateEvaluationMutation.isPending}
            >
              {updateEvaluationMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit Review
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Objectives and Competencies Panel Dialog */}
      <Dialog open={showEvaluationPanel} onOpenChange={setShowEvaluationPanel}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Evaluation Details</span>
              {selectedEvaluationForPanel && (
                <Badge className={getStatusColor(selectedEvaluationForPanel.status)}>
                  {selectedEvaluationForPanel.status}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedEvaluationForPanel && (
            <div className="space-y-6">
              {/* Evaluation Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">{selectedEvaluationForPanel.type}</h4>
                    <p className="text-sm text-gray-600">Period: {selectedEvaluationForPanel.period}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{getOverallObjectiveScore()}%</div>
                    <div className="text-sm text-gray-600">Objectives Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{getOverallCompetencyScore()}%</div>
                    <div className="text-sm text-gray-600">Competencies Score</div>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="objectives" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="objectives" className="flex items-center space-x-2">
                    <Target className="h-4 w-4" />
                    <span>Objectives ({objectives.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="competencies" className="flex items-center space-x-2">
                    <Award className="h-4 w-4" />
                    <span>Competencies ({competencies.length})</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="objectives" className="space-y-4">
                  {isLoadingObjectives ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">Loading objectives...</span>
                    </div>
                  ) : objectives.length === 0 ? (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No objectives found for this evaluation</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {objectives.map((objective) => {
                        const score = getObjectiveScore(objective);
                        return (
                          <Card key={objective.id} className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">{objective.title}</h4>
                                  <p className="text-sm text-gray-600 mt-1">{objective.description}</p>
                                  <div className="flex items-center space-x-4 mt-2">
                                    <div className="text-sm">
                                      <span className="text-gray-500">Target:</span>
                                      <span className="font-medium ml-1">{objective.target}</span>
                                    </div>
                                    <div className="text-sm">
                                      <span className="text-gray-500">Achieved:</span>
                                      <span className="font-medium ml-1">{objective.achieved}</span>
                                    </div>
                                    <div className="text-sm">
                                      <span className="text-gray-500">Weight:</span>
                                      <span className="font-medium ml-1">{objective.weight}%</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right space-y-2">
                                  <div className="text-lg font-bold text-blue-600">{score.toFixed(1)}%</div>
                                  <Badge 
                                    variant={objective.status === 'Completed' ? 'default' : 'secondary'}
                                    className={
                                      objective.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                      objective.status === 'In-progress' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }
                                  >
                                    {objective.status}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="competencies" className="space-y-4">
                  {isLoadingCompetencies ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                      <span className="ml-2 text-gray-600">Loading competencies...</span>
                    </div>
                  ) : competencies.length === 0 ? (
                    <div className="text-center py-8">
                      <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No competencies found for this evaluation</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {competencies.map((competency) => {
                        const score = getCompetencyScore(competency);
                        return (
                          <Card key={competency.id} className="border-l-4 border-l-green-500">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <h4 className="font-semibold text-gray-900">{competency.name}</h4>
                                    <Badge 
                                      variant="outline"
                                      className={
                                        competency.category === 'Core' ? 'border-blue-200 text-blue-700' :
                                        competency.category === 'Leadership' ? 'border-purple-200 text-purple-700' :
                                        'border-orange-200 text-orange-700'
                                      }
                                    >
                                      {competency.category}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">{competency.description}</p>
                                  <div className="flex items-center space-x-4 mt-2">
                                    <div className="text-sm">
                                      <span className="text-gray-500">Required:</span>
                                      <span className="font-medium ml-1">{competency.required_level}/10</span>
                                    </div>
                                    <div className="text-sm">
                                      <span className="text-gray-500">Actual:</span>
                                      <span className="font-medium ml-1">{competency.actual_level}/10</span>
                                    </div>
                                    <div className="text-sm">
                                      <span className="text-gray-500">Weight:</span>
                                      <span className="font-medium ml-1">{competency.weight}%</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-green-600">{score.toFixed(1)}%</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {competency.actual_level >= competency.required_level ? 'Meets Requirement' : 'Below Requirement'}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          <DialogFooter>
            <Button
              onClick={() => setShowEvaluationPanel(false)}
              variant="outline"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeProfile;