import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  Edit3, 
  Save, 
  X,
  Camera,
  Shield,
  TrendingUp,
  Target,
  Users,
  Loader2,
  AlertCircle,
  BarChart3,
  FileText,
  Eye,
  Award
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import { ApiEmployee, ApiEvaluation, ApiObjective, ApiCompetency } from '../../types/api';
import { useEvaluations } from '../../hooks/useApi';
import EvaluationDetails from '../employees/EvaluationDetails';
import { 
  transformEmployeeForEvaluation, 
  transformEvaluationForDetails, 
  safeTransformData 
} from '../../utils/dataTransformers';
import { EvaluationInput } from '../../types/shared';

interface ProfileData {
  employee_id: string;
  employee_code?: string;
  name: string;
  username?: string;
  email: string;
  phone: string;
  role?: string;
  position: string;
  managerial_level?: string;
  status?: string;
  company_name?: string;
  department: string;
  direct_manager?: string;
  join_date: string;
  job_type?: string;
  location: string;
  branch?: string;
  gender?: string;
}

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    employee_id: '',
    employee_code: '',
    name: '',
    username: '',
    email: '',
    phone: '',
    role: '',
    position: '',
    managerial_level: '',
    status: '',
    company_name: '',
    department: '',
    direct_manager: '',
    join_date: '',
    job_type: '',
    location: '',
    branch: '',
    gender: ''
  });

  const [editData, setEditData] = useState<ProfileData>(profileData);

  // Evaluation data state
  const [evaluations, setEvaluations] = useState<ApiEvaluation[]>([]);
  const [evaluationsLoading, setEvaluationsLoading] = useState(false);
  const [evaluationsError, setEvaluationsError] = useState<string | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<ApiEvaluation | null>(null);
  const [showEvaluationDetails, setShowEvaluationDetails] = useState(false);

  // Evaluation panel dialog state
  const [showEvaluationPanel, setShowEvaluationPanel] = useState(false);
  const [selectedEvaluationForPanel, setSelectedEvaluationForPanel] = useState<ApiEvaluation | null>(null);
  const [objectives, setObjectives] = useState<ApiObjective[]>([]);
  const [competencies, setCompetencies] = useState<ApiCompetency[]>([]);
  const [isLoadingObjectives, setIsLoadingObjectives] = useState(false);
  const [isLoadingCompetencies, setIsLoadingCompetencies] = useState(false);

  // Fetch evaluations data
  useEffect(() => {
    const fetchEvaluations = async () => {
      if (!user?.user_id) return;

      try {
        setEvaluationsLoading(true);
        setEvaluationsError(null);
        console.log('Fetching evaluations for user_id:', user.user_id);
        
        const evaluationsData = await apiService.getEvaluations({ user_id: user.user_id });
        console.log('Evaluations data received:', evaluationsData);
        
        setEvaluations(evaluationsData || []);
      } catch (err) {
        console.error('Error fetching evaluations:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch evaluations';
        setEvaluationsError(errorMessage);
      } finally {
        setEvaluationsLoading(false);
      }
    };

    if (user?.user_id) {
      fetchEvaluations();
    }
  }, [user?.user_id]);

  // Fetch employee data on component mount
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!user?.user_id) {
        setError('User ID not available');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('Fetching employee data for user_id:', user?.user_id);
        const employeeData = await apiService.getEmployeeByUserId(user?.user_id);
        console.log('Employee data received:', employeeData[0]);
      
        // Map API response to ProfileData
        const mappedData: ProfileData = {
          employee_id: employeeData[0].employee_id , 
          employee_code: employeeData[0].employee_code,
          name: employeeData[0].name || user.name || '',
          username: employeeData[0].username,
          email: employeeData[0].email || user.email || '',
          phone: employeeData[0].phone || '',
          role: employeeData[0].role,
          position: employeeData[0].position || '',
          managerial_level: employeeData[0].managerial_level,
          status: employeeData[0].status,
          company_name: employeeData[0].company_name,
          department: employeeData[0].department || '',
          direct_manager: employeeData[0].direct_manager,
          join_date: employeeData[0].join_date || '',
          job_type: employeeData[0].job_type,
          location: employeeData[0].location || '',
          branch: employeeData[0].branch,
          gender: employeeData[0].gender
        };
        
        setProfileData(mappedData);
        setEditData(mappedData);
        console.log('Profile data successfully updated:', mappedData);
      } catch (err) {
        console.error('Error fetching employee data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch employee data';
        console.error('Detailed error:', errorMessage);
        setError(errorMessage);
        
        // Fallback to user data if available
        if (user) {
          console.log('Using fallback user data:', user);
          const fallbackData: ProfileData = {
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            position: user.position || '',
            department: '',
            location: '',
            join_date: ''
          };
          setProfileData(fallbackData);
          setEditData(fallbackData);
          console.log('Fallback data applied:', fallbackData);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [user]);

  const handleEdit = () => {
    setEditData(profileData);
    setIsEditing(true);
  };

  const handleSave = () => {
    setProfileData(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(profileData);
    setIsEditing(false);
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

  // Helper function to get status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Employee Review':
        return 'bg-yellow-100 text-yellow-800';
      case 'Pending HoD Approval':
        return 'bg-orange-100 text-orange-800';
      case 'Pending HR Approval':
        return 'bg-purple-100 text-purple-800';
      case 'Approved':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle evaluation card click
  const handleEvaluationClick = async (evaluation: ApiEvaluation) => {
    try {
      // Set the selected evaluation for the panel
      setSelectedEvaluationForPanel(evaluation);
      setShowEvaluationPanel(true);

      console.log('evaluation:',evaluation);

      // Fetch objectives
      setIsLoadingObjectives(true);
      try {
        const objectivesData = await apiService.getObjectives(evaluation.evaluation_id || evaluation.id);
        setObjectives(objectivesData || []);
      } catch (err) {
        console.error('Error fetching objectives:', err);
        setObjectives([]);
      } finally {
        setIsLoadingObjectives(false);
      }

      // Fetch competencies
      setIsLoadingCompetencies(true);
      try {
        const competenciesData = await apiService.getCompetencies(evaluation.evaluation_id || evaluation.id);
        setCompetencies(competenciesData || []);
      } catch (err) {
        console.error('Error fetching competencies:', err);
        setCompetencies([]);
      } finally {
        setIsLoadingCompetencies(false);
      }
    } catch (err) {
      console.error('Error handling evaluation click:', err);
    }
  };

  // Handle close evaluation details
  const handleCloseEvaluationDetails = () => {
    setShowEvaluationDetails(false);
    setSelectedEvaluation(null);
  };

  // Score calculation functions
  const getObjectiveScore = (objective: ApiObjective): number => {
    if (!objective.target || !objective.achieved) return 0;
    const target = parseFloat(objective.target.toString());
    const achieved = parseFloat(objective.achieved.toString());
    if (target === 0) return 0;
    return Math.min((achieved / target) * 100, 100);
  };

  const getCompetencyScore = (competency: ApiCompetency): number => {
    if (!competency.required_level || !competency.actual_level) return 0;
    const required = parseFloat(competency.required_level.toString());
    const actual = parseFloat(competency.actual_level.toString());
    if (required === 0) return 0;
    return Math.min((actual / required) * 100, 100);
  };

  const getOverallObjectiveScore = (): number => {
    if (objectives.length === 0) return 0;
    const totalWeight = objectives.reduce((sum, obj) => sum + (obj.weight || 0), 0);
    if (totalWeight === 0) return 0;
    
    const weightedScore = objectives.reduce((sum, obj) => {
      const score = getObjectiveScore(obj);
      const weight = obj.weight || 0;
      return sum + (score * weight / 100);
    }, 0);
    
    return weightedScore;
  };

  const getOverallCompetencyScore = (): number => {
    if (competencies.length === 0) return 0;
    const totalWeight = competencies.reduce((sum, comp) => sum + (comp.weight || 0), 0);
    if (totalWeight === 0) return 0;
    
    const weightedScore = competencies.reduce((sum, comp) => {
      const score = getCompetencyScore(comp);
      const weight = comp.weight || 0;
      return sum + (score * weight / 100);
    }, 0);
    
    return weightedScore;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Employee Review':
        return 'bg-yellow-100 text-yellow-800';
      case 'Pending HoD Approval':
        return 'bg-orange-100 text-orange-800';
      case 'Pending HR Approval':
        return 'bg-purple-100 text-purple-800';
      case 'Approved':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600 mt-1">Manage your personal information and preferences</p>
          </div>
          {!loading && !isEditing ? (
            <Button onClick={handleEdit} className="bg-blue-600 hover:bg-blue-700">
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : !loading && isEditing ? (
            <div className="flex gap-2">
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button onClick={handleCancel} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          ) : null}
        </div>

        {/* Loading State */}
        {loading && (
          <Card className="p-8">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-lg text-gray-600">Loading employee data...</span>
            </div>
          </Card>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Error loading employee data</span>
              </div>
              <p className="text-red-600 mt-2">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Main Content - Only show when not loading */}
        {!loading && (
        <>
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                  <AvatarImage src="/placeholder.svg" alt={profileData.name} />
                  <AvatarFallback className="text-2xl font-bold bg-white text-blue-600">
                    {getInitials(profileData.name)}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button 
                    size="sm" 
                    className="absolute -bottom-2 -right-2 rounded-full h-10 w-10 bg-white text-blue-600 hover:bg-gray-100"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold mb-2">{profileData.name}</h2>
                <p className="text-blue-100 text-lg mb-2">{profileData.position || 'Position not specified'}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <Briefcase className="h-4 w-4" />
                    <span>{profileData.department || 'Department not specified'}</span>
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{profileData.location || 'Location not specified'}</span>
                  </div>
                </div>
                
                {/* Additional employee info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4 pt-4 border-t border-blue-400">
                  {profileData.status && (
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <Badge className="bg-white text-blue-600">{profileData.status}</Badge>
                    </div>
                  )}
                  {profileData.role && (
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <Shield className="h-4 w-4" />
                      <span>{profileData.role}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white border shadow-sm">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="professional" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Professional
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      {isEditing ? (
                        <Input
                          id="name"
                          value={editData.name}
                          onChange={(e) => setEditData({...editData, name: e.target.value})}
                        />
                      ) : (
                        <p className="text-gray-900 font-medium">{profileData.name || 'Not specified'}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      {isEditing ? (
                        <Input
                          id="username"
                          value={editData.username || ''}
                          onChange={(e) => setEditData({...editData, username: e.target.value})}
                        />
                      ) : (
                        <p className="text-gray-900">{profileData.username || 'Not specified'}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        {isEditing ? (
                          <Input
                            id="email"
                            type="email"
                            value={editData.email}
                            onChange={(e) => setEditData({...editData, email: e.target.value})}
                          />
                        ) : (
                          <p className="text-gray-900">{profileData.email || 'Not specified'}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {isEditing ? (
                          <Input
                            id="phone"
                            value={editData.phone}
                            onChange={(e) => setEditData({...editData, phone: e.target.value})}
                          />
                        ) : (
                          <p className="text-gray-900">{profileData.phone || 'Not specified'}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      {isEditing ? (
                        <Input
                          id="gender"
                          value={editData.gender || ''}
                          onChange={(e) => setEditData({...editData, gender: e.target.value})}
                        />
                      ) : (
                        <p className="text-gray-900">{profileData.gender || 'Not specified'}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        {isEditing ? (
                          <Input
                            id="location"
                            value={editData.location}
                            onChange={(e) => setEditData({...editData, location: e.target.value})}
                          />
                        ) : (
                          <p className="text-gray-900">{profileData.location || 'Not specified'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Professional Tab */}
          <TabsContent value="professional" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-green-600" />
                    Work Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Employee Code</Label>
                      <p className="text-gray-900 font-medium">{profileData.employee_code || 'Not specified'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <p className="text-gray-900 font-medium">{profileData.position || 'Not specified'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <p className="text-gray-900 font-medium">{profileData.role || 'Not specified'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <p className="text-gray-900 font-medium">{profileData.department || 'Not specified'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Managerial Level</Label>
                      <p className="text-gray-900 font-medium">{profileData.managerial_level || 'Not specified'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      {profileData.status ? (
                        <Badge className="bg-green-100 text-green-800">{profileData.status}</Badge>
                      ) : (
                        <p className="text-gray-500">Not specified</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <p className="text-gray-900 font-medium">{profileData.company_name || 'Not specified'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Direct Manager</Label>
                      <p className="text-gray-900 font-medium">{profileData.direct_manager || 'Not specified'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Join Date</Label>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <p className="text-gray-900">{profileData.join_date ? formatDate(profileData.join_date) : 'Not specified'}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Job Type</Label>
                      <p className="text-gray-900 font-medium">{profileData.job_type || 'Not specified'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Branch</Label>
                      <p className="text-gray-900 font-medium">{profileData.branch || 'Not specified'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            {/* Performance Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-blue-600 p-3 rounded-full">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-blue-900">
                    {evaluations.length > 0
                      ? (evaluations.reduce((sum, evaluation) => sum + (evaluation.score || 0), 0) / evaluations.length).toFixed(1)
                      : 'N/A'
                    }
                  </h3>
                  <p className="text-blue-700 font-medium">Overall Rating</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-green-600 p-3 rounded-full">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-green-900">
                    {evaluations.filter(evaluation => evaluation.status === 'Completed').length}
                  </h3>
                  <p className="text-green-700 font-medium">Completed Evaluations</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-purple-600 p-3 rounded-full">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-purple-900">
                    {evaluations.filter(evaluation => evaluation.status === 'Employee Review' || evaluation.status === 'Pending HR Approval').length}
                  </h3>
                  <p className="text-purple-700 font-medium">Pending Reviews</p>
                </CardContent>
              </Card>
            </div>

            {/* My Evaluations Section */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  My Evaluations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {evaluationsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Loading evaluations...</span>
                  </div>
                ) : evaluationsError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <p className="text-red-600 font-medium">Error loading evaluations</p>
                    <p className="text-red-500 text-sm mt-2">{evaluationsError}</p>
                  </div>
                ) : evaluations.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No evaluations found</p>
                    <p className="text-gray-500 text-sm mt-2">Your evaluations will appear here once they are created.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {evaluations.map((evaluation) => (
                      <Card 
                        key={evaluation.id} 
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
                                {evaluation.reviewer && (
                                  <p className="text-xs text-gray-500">Reviewer: {evaluation.reviewer}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                              <Badge 
                                className={getStatusBadgeClass(evaluation.status)}
                              >
                                {evaluation.status}
                              </Badge>
                              
                              {evaluation.score && (
                                <div className="text-right">
                                  <p className="text-lg font-bold text-gray-900">{evaluation.score}</p>
                                  <p className="text-xs text-gray-500">Score</p>
                                </div>
                              )}
                              
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </Button>
                            </div>
                          </div>
                          
                          {evaluation.created_at && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="flex items-center text-xs text-gray-500">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(evaluation.created_at)}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Change Password</h3>
                    <p className="text-gray-600 text-sm mb-4">Update your password to keep your account secure</p>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input id="current-password" type="password" />
                      </div>
                      <div>
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" />
                      </div>
                      <div>
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input id="confirm-password" type="password" />
                      </div>
                      <Button className="bg-red-600 hover:bg-red-700">
                        Update Password
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </>
        )}

        {/* EvaluationDetails Modal */}
        {showEvaluationDetails && selectedEvaluation && (
          <EvaluationDetails
            employee={transformEmployeeForEvaluation(profileData)}
            evaluation={transformEvaluationForDetails(selectedEvaluation, profileData)}
            onBack={handleCloseEvaluationDetails}
          />
        )}

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
                      <div className="text-2xl font-bold text-blue-600">{getOverallObjectiveScore().toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">Objectives Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{getOverallCompetencyScore().toFixed(1)}%</div>
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
                            <Card key={objective.objective_id} className="border-l-4 border-l-blue-500">
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
                            <Card key={competency.competence_id} className="border-l-4 border-l-green-500">
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
    </div>
  );
};

export default ProfilePage;