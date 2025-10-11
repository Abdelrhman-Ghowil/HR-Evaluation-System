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
  Loader2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useEvaluations, useUpdateEvaluation, useEmployees } from '../../hooks/useApi';
import { ApiEvaluation } from '../../types/api';
import { toast } from 'sonner';

interface EmployeeProfileData {
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  joinDate: string;
  bio: string;
}

const EmployeeProfile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingEvaluation, setIsEditingEvaluation] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<ApiEvaluation | null>(null);
  const [evaluationComment, setEvaluationComment] = useState('');
  
  // Hidden evaluation data storage - fetched but not displayed
  const [hiddenEvaluationData, setHiddenEvaluationData] = useState<any>(null);
  
  // Get employee data based on current user
  const { data: employeesData } = useEmployees({ user_id: user?.id });
  const currentEmployee = employeesData?.results?.[0];
  
  // Get evaluations for the current employee
  const { data: evaluationsData, isLoading: evaluationsLoading, refetch: refetchEvaluations } = useEvaluations({
    employee_id: currentEmployee?.employee_id
  }, {
    enabled: !!currentEmployee?.employee_id
  });
  
  const updateEvaluationMutation = useUpdateEvaluation();

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

  const [profileData, setProfileData] = useState<EmployeeProfileData>({
    name: user?.name || 'Employee Name',
    email: user?.email || 'employee@company.com',
    phone: user?.phone || '+1 (555) 123-4567',
    position: user?.position || currentEmployee?.position || 'Position',
    department: currentEmployee?.department || 'Department',
    joinDate: currentEmployee?.join_date || '2024-01-01',
    bio: 'Professional employee focused on delivering quality work and continuous improvement.'
  });

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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xl font-semibold">Profile Information</CardTitle>
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
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.avatar} alt={profileData.name} />
                  <AvatarFallback className="text-lg">
                    {getInitials(profileData.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{profileData.name}</h3>
                  <p className="text-gray-600">{profileData.position}</p>
                  <p className="text-sm text-gray-500">{profileData.department}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      />
                    ) : (
                      <div className="flex items-center space-x-2 mt-1">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{profileData.name}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      />
                    ) : (
                      <div className="flex items-center space-x-2 mt-1">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{profileData.email}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={editData.phone}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      />
                    ) : (
                      <div className="flex items-center space-x-2 mt-1">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{profileData.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="position">Position</Label>
                    {isEditing ? (
                      <Input
                        id="position"
                        value={editData.position}
                        onChange={(e) => setEditData({ ...editData, position: e.target.value })}
                      />
                    ) : (
                      <div className="flex items-center space-x-2 mt-1">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        <span>{profileData.position}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Department</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Briefcase className="h-4 w-4 text-gray-400" />
                      <span>{profileData.department}</span>
                    </div>
                  </div>

                  <div>
                    <Label>Join Date</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{formatDate(profileData.joinDate)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                {isEditing ? (
                  <Textarea
                    id="bio"
                    value={editData.bio}
                    onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                    rows={3}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-gray-700">{profileData.bio}</p>
                )}
              </div>
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
                      className="hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500"
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
    </div>
  );
};

export default EmployeeProfile;