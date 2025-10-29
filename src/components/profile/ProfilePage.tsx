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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Award,
  ChevronDown,
  ChevronUp,
  Building,
  UserCheck,
  Clock,
  MapIcon
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import { ApiEmployee, ApiEvaluation, ApiObjective, ApiCompetency, ApiMyProfile } from '../../types/api';
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
  employee_code: string;
  name: string;
  username: string;
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
  // New fields from my-profile API
  country_code?: string;
  avatar?: string;
  is_default_password?: boolean;
  password_last_changed?: string;
  org_path?: string;
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

  // Form validation state
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [isFormValid, setIsFormValid] = useState(true);

  // Collapsible sections state for Work Information
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    organizationalInfo: true,
    employmentDetails: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Validation functions
  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'username':
        if (!value.trim()) return 'Username is required';
        if (value.trim().length < 3) return 'Username must be at least 3 characters';
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return '';
      case 'phone':
        if (value && !/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
          return 'Please enter a valid phone number';
        }
        return '';
      default:
        return '';
    }
  };

  const validateForm = (data: ProfileData): boolean => {
    const errors: {[key: string]: string} = {};
    
    // Validate required fields
    errors.name = validateField('name', data.name);
    errors.username = validateField('username', data.username || '');
    errors.email = validateField('email', data.email);
    errors.phone = validateField('phone', data.phone);

    // Remove empty errors
    Object.keys(errors).forEach(key => {
      if (!errors[key]) delete errors[key];
    });

    setValidationErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    setIsFormValid(isValid);
    return isValid;
  };

  const handleFieldChange = (field: string, value: string) => {
    const newEditData = { ...editData, [field]: value };
    setEditData(newEditData);
    
    // Real-time validation
    const fieldError = validateField(field, value);
    setValidationErrors(prev => ({
      ...prev,
      [field]: fieldError
    }));
  };

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

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    general: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

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
        console.log('Fetching my profile data');
        
        // Use the new my-profile API endpoint
        const myProfileData = await apiService.getMyProfile();
        console.log('My profile data received:', myProfileData);
      
        // Map API response to ProfileData
        const mappedData: ProfileData = {
          employee_id: myProfileData.employee_code || '', // Using employee_code as employee_id
          employee_code: myProfileData.employee_code || '',
          name: myProfileData.name || user.name || '',
          username: myProfileData.username || user.username || '',
          email: myProfileData.email || user.email || '',
          phone: myProfileData.phone || '', // Store only the phone number without country code
          role: myProfileData.role || '',
          position: myProfileData.position || '',
          managerial_level: myProfileData.managerial_level || '',
          status: myProfileData.status || '',
          company_name: myProfileData.company_name || '',
          department: myProfileData.department || '',
          direct_manager: myProfileData.direct_manager || '',
          join_date: myProfileData.join_date || '',
          job_type: myProfileData.job_type || '',
          location: myProfileData.location || '',
          branch: myProfileData.branch || '',
          gender: '', // Not available in new API, keeping empty for backward compatibility
          // New fields from my-profile API
          country_code: myProfileData.country_code || '',
          avatar: myProfileData.avatar || '',
          is_default_password: myProfileData.is_default_password || false,
          password_last_changed: myProfileData.password_last_changed || '',
          org_path: myProfileData.org_path || ''
        };
        
        setProfileData(mappedData);
        setEditData(mappedData);
        console.log('Profile data successfully updated:', mappedData);
      } catch (err) {
        console.error('Error fetching my profile data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile data';
        console.error('Detailed error:', errorMessage);
        setError(errorMessage);
        
        // Fallback to user data if available
        if (user) {
          console.log('Using fallback user data:', user);
          const fallbackData: ProfileData = {
            employee_id: '',
            employee_code: '',
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

  const handleSave = async () => {
    // Validate form before saving
    if (!validateForm(editData)) {
      console.log('Form validation failed');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Prepare the data for PATCH request with only the specified fields
      const updateData = {
        phone: editData.phone || '', // Send only the phone number without country code
        country_code: editData.country_code || '',
        avatar: editData.avatar || '',
        position: editData.position || '',
        gender: editData.gender || '',
        location: editData.location || ''
      };

      console.log('Updating profile with data:', updateData);

      // Call the API to update the profile
      const updatedProfile = await apiService.updateMyProfile(updateData);
      console.log('Profile updated successfully:', updatedProfile);

      // Update local state with the response
      const mappedData: ProfileData = {
        ...profileData,
        phone: updatedProfile.phone || '', // Store only the phone number without country code
        country_code: updatedProfile.country_code || '',
        avatar: updatedProfile.avatar || '',
        position: updatedProfile.position || '',
        gender: editData.gender || '', // Keep local gender value as it's not in API response
        location: updatedProfile.location || ''
      };

      setProfileData(mappedData);
      setEditData(mappedData);
      setIsEditing(false);

      // Show success message (you can add a toast notification here)
      console.log('Profile updated successfully!');

    } catch (err) {
      console.error('Error updating profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
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

  // Password validation functions
  const validatePasswordStrength = (password: string): string | null => {
  const minLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (!minLength)
    return "Password is too short (less than 8 characters)";
  else if (!hasUppercase)
    return "Password does not contain any uppercase letter (A–Z)";
  else if (!hasNumber)
    return "Password does not include any numeric digit (0–9)";
  else return null; // ✅ strong password
};

  // const validatePasswordStrength = (password: string): boolean => {
  //   const minLength = password.length >= 8;
  //   const hasUppercase = /[A-Z]/.test(password);
  //   const hasNumber = /\d/.test(password);

  //   // return minLength && hasUppercase && hasNumber;
  // };

  const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
    if (password.length === 0) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[a-z]/.test(password)) score += 25;
    if (/\d/.test(password)) score += 25;
    
    if (score < 50) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score < 75) return { score, label: 'Fair', color: 'bg-yellow-500' };
    if (score < 100) return { score, label: 'Good', color: 'bg-blue-500' };
    return { score, label: 'Strong', color: 'bg-green-500' };
  };

  // Password change handlers
  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    
    // Clear specific field errors when user starts typing
    if (passwordErrors[field as keyof typeof passwordErrors]) {
      setPasswordErrors(prev => ({ ...prev, [field]: '', general: '' }));
    }
    
    // Clear success message when user starts editing
    if (passwordChangeSuccess) {
      setPasswordChangeSuccess(false);
    }
  };

  const validatePasswordForm = (): boolean => {
    const errors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      general: ''
    };

    // Validate current password
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    // Validate new password strength
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (validatePasswordStrength(passwordData.newPassword)) {
      errors.newPassword = validatePasswordStrength(passwordData.newPassword);
    }

    // Validate password confirmation
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Error: Passwords do not match';
    }

    setPasswordErrors(errors);
    return !Object.values(errors).some(error => error !== '');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    setIsChangingPassword(true);
    setPasswordErrors(prev => ({ ...prev, general: '' }));

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}api/accounts/users/change-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          old_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
          new_password_confirm: passwordData.confirmPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific error cases
        if (response.status === 400) {
          if (errorData.old_password) {
            setPasswordErrors(prev => ({ ...prev, currentPassword: 'Error: Current Password Incorrect' }));
          } else if (errorData.new_password) {
            setPasswordErrors(prev => ({ ...prev, newPassword: errorData.new_password[0] || 'Error: Password too weak' }));
          } else {
            setPasswordErrors(prev => ({ ...prev, general: errorData.detail || 'Password change failed' }));
          }
        } else {
          setPasswordErrors(prev => ({ ...prev, general: 'Password change failed. Please try again.' }));
        }
        return;
      }

      // Success
      setPasswordChangeSuccess(true);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordErrors({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        general: ''
      });

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setPasswordChangeSuccess(false);
      }, 5000);

    } catch (error) {
      console.error('Password change error:', error);
      setPasswordErrors(prev => ({ 
        ...prev, 
        general: 'Network error. Please check your connection and try again.' 
      }));
    } finally {
      setIsChangingPassword(false);
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
          <TabsContent value="personal" className="space-y-8">
            <div className="grid grid-cols-1 gap-8">
              <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-950/30 transition-all duration-300 hover:shadow-2xl">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                      <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    Personal Information
                  </CardTitle>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">
                    Manage your personal details and contact information
                  </p>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Basic Information Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Basic Information</h3>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-3 group">
                        <Label htmlFor="name" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          Full Name
                          <span className="text-red-500">*</span>
                          <Badge variant="secondary" className="text-xs">Read Only</Badge>
                        </Label>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200 opacity-75">
                          <p className="text-gray-900 dark:text-white font-medium text-base">
                            {profileData.name || (
                              <span className="text-gray-500 dark:text-gray-400 italic">Not specified</span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3 group">
                        <Label htmlFor="username" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          Username
                          <span className="text-red-500">*</span>
                          <Badge variant="secondary" className="text-xs">Read Only</Badge>
                        </Label>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200 opacity-75">
                          <p className="text-gray-900 dark:text-white font-medium text-base">
                            {profileData.username || (
                              <span className="text-gray-500 dark:text-gray-400 italic">Not specified</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Contact Information</h3>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-3 group">
                        <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Mail className="h-4 w-4 text-blue-500" />
                          Email Address
                          <span className="text-red-500">*</span>
                          <Badge variant="secondary" className="text-xs">Read Only</Badge>
                        </Label>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200 opacity-75">
                          <p className="text-gray-900 dark:text-white font-medium text-base break-all">
                            {profileData.email || (
                              <span className="text-gray-500 dark:text-gray-400 italic">Not specified</span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3 group">
                        <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Phone className="h-4 w-4 text-green-500" />
                          Phone Number
                        </Label>
                        {isEditing ? (
                          <div className="space-y-4">
                            {/* Country Code Field */}
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Country Code</Label>
                              <Select
                                value={editData.country_code || ''}
                                onValueChange={(value) => setEditData({...editData, country_code: value})}
                              >
                                <SelectTrigger className="pl-4 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200 bg-white dark:bg-gray-800">
                                  <SelectValue placeholder="Select country code" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="+1">+1 (United States)</SelectItem>
                                  <SelectItem value="+20">+20 (Egypt)</SelectItem>
                                  <SelectItem value="+44">+44 (United Kingdom)</SelectItem>
                                  <SelectItem value="+49">+49 (Germany)</SelectItem>
                                  <SelectItem value="+33">+33 (France)</SelectItem>
                                  <SelectItem value="+39">+39 (Italy)</SelectItem>
                                  <SelectItem value="+34">+34 (Spain)</SelectItem>
                                  <SelectItem value="+31">+31 (Netherlands)</SelectItem>
                                  <SelectItem value="+41">+41 (Switzerland)</SelectItem>
                                  <SelectItem value="+43">+43 (Austria)</SelectItem>
                                  <SelectItem value="+32">+32 (Belgium)</SelectItem>
                                  <SelectItem value="+45">+45 (Denmark)</SelectItem>
                                  <SelectItem value="+46">+46 (Sweden)</SelectItem>
                                  <SelectItem value="+47">+47 (Norway)</SelectItem>
                                  <SelectItem value="+358">+358 (Finland)</SelectItem>
                                  <SelectItem value="+351">+351 (Portugal)</SelectItem>
                                  <SelectItem value="+30">+30 (Greece)</SelectItem>
                                  <SelectItem value="+48">+48 (Poland)</SelectItem>
                                  <SelectItem value="+420">+420 (Czech Republic)</SelectItem>
                                  <SelectItem value="+36">+36 (Hungary)</SelectItem>
                                  <SelectItem value="+91">+91 (India)</SelectItem>
                                  <SelectItem value="+86">+86 (China)</SelectItem>
                                  <SelectItem value="+81">+81 (Japan)</SelectItem>
                                  <SelectItem value="+82">+82 (South Korea)</SelectItem>
                                  <SelectItem value="+65">+65 (Singapore)</SelectItem>
                                  <SelectItem value="+60">+60 (Malaysia)</SelectItem>
                                  <SelectItem value="+62">+62 (Indonesia)</SelectItem>
                                  <SelectItem value="+66">+66 (Thailand)</SelectItem>
                                  <SelectItem value="+63">+63 (Philippines)</SelectItem>
                                  <SelectItem value="+84">+84 (Vietnam)</SelectItem>
                                  <SelectItem value="+61">+61 (Australia)</SelectItem>
                                  <SelectItem value="+64">+64 (New Zealand)</SelectItem>
                                  <SelectItem value="+27">+27 (South Africa)</SelectItem>
                                  <SelectItem value="+234">+234 (Nigeria)</SelectItem>
                                  <SelectItem value="+254">+254 (Kenya)</SelectItem>
                                  <SelectItem value="+212">+212 (Morocco)</SelectItem>
                                  <SelectItem value="+213">+213 (Algeria)</SelectItem>
                                  <SelectItem value="+216">+216 (Tunisia)</SelectItem>
                                  <SelectItem value="+218">+218 (Libya)</SelectItem>
                                  <SelectItem value="+249">+249 (Sudan)</SelectItem>
                                  <SelectItem value="+966">+966 (Saudi Arabia)</SelectItem>
                                  <SelectItem value="+971">+971 (UAE)</SelectItem>
                                  <SelectItem value="+974">+974 (Qatar)</SelectItem>
                                  <SelectItem value="+965">+965 (Kuwait)</SelectItem>
                                  <SelectItem value="+973">+973 (Bahrain)</SelectItem>
                                  <SelectItem value="+968">+968 (Oman)</SelectItem>
                                  <SelectItem value="+962">+962 (Jordan)</SelectItem>
                                  <SelectItem value="+961">+961 (Lebanon)</SelectItem>
                                  <SelectItem value="+963">+963 (Syria)</SelectItem>
                                  <SelectItem value="+964">+964 (Iraq)</SelectItem>
                                  <SelectItem value="+98">+98 (Iran)</SelectItem>
                                  <SelectItem value="+90">+90 (Turkey)</SelectItem>
                                  <SelectItem value="+92">+92 (Pakistan)</SelectItem>
                                  <SelectItem value="+880">+880 (Bangladesh)</SelectItem>
                                  <SelectItem value="+94">+94 (Sri Lanka)</SelectItem>
                                  <SelectItem value="+977">+977 (Nepal)</SelectItem>
                                  <SelectItem value="+55">+55 (Brazil)</SelectItem>
                                  <SelectItem value="+54">+54 (Argentina)</SelectItem>
                                  <SelectItem value="+56">+56 (Chile)</SelectItem>
                                  <SelectItem value="+57">+57 (Colombia)</SelectItem>
                                  <SelectItem value="+51">+51 (Peru)</SelectItem>
                                  <SelectItem value="+58">+58 (Venezuela)</SelectItem>
                                  <SelectItem value="+52">+52 (Mexico)</SelectItem>
                                  <SelectItem value="+1">+1 (Canada)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {/* Phone Number Field */}
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Phone Number</Label>
                              <Input
                                id="phone"
                                value={editData.phone?.replace(/^\+\d+/, '') || ''}
                                onChange={(e) => {
                                  const phoneOnly = e.target.value.replace(/[^\d]/g, '');
                                  setEditData({...editData, phone: phoneOnly});
                                }}
                                className={`pl-4 pr-4 py-3 border-2 rounded-lg focus:ring-2 transition-all duration-200 bg-white dark:bg-gray-800 ${
                                  validationErrors.phone 
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-800' 
                                    : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-200 dark:focus:ring-blue-800'
                                }`}
                                placeholder="Enter phone number (digits only)"
                                aria-describedby={validationErrors.phone ? "phone-error" : undefined}
                              />
                              {validationErrors.phone && (
                                <div className="flex items-center gap-2 mt-2 text-red-600 dark:text-red-400">
                                  <AlertCircle className="h-4 w-4" />
                                  <span className="text-sm" id="phone-error">{validationErrors.phone}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Preview of complete phone number */}
                            {(editData.country_code || editData.phone) && (
                              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                                <Label className="text-xs font-medium text-blue-700 dark:text-blue-300">Complete Phone Number:</Label>
                                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mt-1">
                                  {(editData.country_code || '') + (editData.phone?.replace(/^\+\d+/, '') || '')}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200 group-hover:bg-gray-100 dark:group-hover:bg-gray-700/50">
                            <p className="text-gray-900 dark:text-white font-medium text-base">
                              {(profileData.country_code && profileData.phone) ? 
                                `${profileData.country_code}${profileData.phone?.replace(/^\+\d+/, '') || ''}` :
                                profileData.phone || (
                                  <span className="text-gray-500 dark:text-gray-400 italic">Not specified</span>
                                )}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Additional Information Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Additional Information</h3>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-3 group">
                        <Label htmlFor="gender" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Gender
                        </Label>
                        {isEditing ? (
                          <div className="relative">
                            <Select
                              value={editData.gender || ''}
                              onValueChange={(value) => setEditData({...editData, gender: value})}
                            >
                              <SelectTrigger className="pl-4 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200 bg-white dark:bg-gray-800">
                                <SelectValue placeholder="Select your gender" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200 group-hover:bg-gray-100 dark:group-hover:bg-gray-700/50">
                            <p className="text-gray-900 dark:text-white font-medium text-base">
                              {profileData.gender || (
                                <span className="text-gray-500 dark:text-gray-400 italic">Not specified</span>
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-3 group">
                        <Label htmlFor="location" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-purple-500" />
                          Location
                        </Label>
                        {isEditing ? (
                          <div className="relative">
                            <Input
                              id="location"
                              value={editData.location}
                              onChange={(e) => setEditData({...editData, location: e.target.value})}
                              className="pl-4 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200 bg-white dark:bg-gray-800"
                              placeholder="Enter your location (optional)"
                            />
                          </div>
                        ) : (
                          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200 group-hover:bg-gray-100 dark:group-hover:bg-gray-700/50">
                            <p className="text-gray-900 dark:text-white font-medium text-base">
                              {profileData.location || (
                                <span className="text-gray-500 dark:text-gray-400 italic">Not specified</span>
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Professional Tab */}
          <TabsContent value="professional" className="space-y-8">
            <div className="grid grid-cols-1 gap-8">
              <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-green-50/30 dark:from-gray-900 dark:to-green-950/30 transition-all duration-300 hover:shadow-2xl">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white">
                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                      <Briefcase className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    Work Information
                  </CardTitle>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">
                    Your professional details and organizational information
                  </p>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Basic Work Information Section */}
                  <div className="space-y-4">
                    <button
                      onClick={() => toggleSection('basicInfo')}
                      className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-700 hover:from-blue-100 hover:to-blue-150 dark:hover:from-blue-800/30 dark:hover:to-blue-700/30 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500 rounded-lg">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Basic Information</h3>
                      </div>
                      {expandedSections.basicInfo ? (
                        <ChevronUp className="h-5 w-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200" />
                      )}
                    </button>
                    
                    {expandedSections.basicInfo && (
                      <div className="overflow-hidden">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 transform transition-all duration-500 ease-out animate-in slide-in-from-top-4 fade-in">
                          <div className="space-y-3 group">
                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                              Employee Code
                            </Label>
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 group-hover:bg-gray-100 dark:group-hover:bg-gray-700/50 group-hover:shadow-md group-hover:scale-[1.02]">
                              <p className="text-gray-900 dark:text-white font-medium text-base">
                                {profileData.employee_code || (
                                  <span className="text-gray-500 dark:text-gray-400 italic">Not specified</span>
                                )}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-3 group">
                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              Position
                            </Label>
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 group-hover:bg-gray-100 dark:group-hover:bg-gray-700/50 group-hover:shadow-md group-hover:scale-[1.02]">
                              <p className="text-gray-900 dark:text-white font-medium text-base">
                                {profileData.position || (
                                  <span className="text-gray-500 dark:text-gray-400 italic">Not specified</span>
                                )}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-3 group">
                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                              Role
                            </Label>
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 group-hover:bg-gray-100 dark:group-hover:bg-gray-700/50 group-hover:shadow-md group-hover:scale-[1.02]">
                              <p className="text-gray-900 dark:text-white font-medium text-base">
                                {profileData.role || (
                                  <span className="text-gray-500 dark:text-gray-400 italic">Not specified</span>
                                )}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-3 group">
                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <UserCheck className="h-4 w-4 text-orange-500" />
                              Status
                            </Label>
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 group-hover:bg-gray-100 dark:group-hover:bg-gray-700/50 group-hover:shadow-md group-hover:scale-[1.02]">
                              {profileData.status ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 px-3 py-1 text-sm font-medium transition-all duration-200 hover:scale-105">
                                  {profileData.status}
                                </Badge>
                              ) : (
                                <span className="text-gray-500 dark:text-gray-400 italic">Not specified</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Organizational Information Section */}
                  <div className="space-y-4">
                    <button
                      onClick={() => toggleSection('organizationalInfo')}
                      className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-700 hover:from-green-100 hover:to-green-150 dark:hover:from-green-800/30 dark:hover:to-green-700/30 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500 rounded-lg">
                          <Building className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Organizational Information</h3>
                      </div>
                      {expandedSections.organizationalInfo ? (
                        <ChevronUp className="h-5 w-5 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-200" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-200" />
                      )}
                    </button>
                    
                    {expandedSections.organizationalInfo && (
                      <div className="overflow-hidden">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 transform transition-all duration-500 ease-out animate-in slide-in-from-top-4 fade-in">
                          <div className="space-y-3 group">
                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <Building className="h-4 w-4 text-blue-500" />
                              Company
                            </Label>
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 group-hover:bg-gray-100 dark:group-hover:bg-gray-700/50 group-hover:shadow-md group-hover:scale-[1.02]">
                              <p className="text-gray-900 dark:text-white font-medium text-base">
                                {profileData.company_name || (
                                  <span className="text-gray-500 dark:text-gray-400 italic">Not specified</span>
                                )}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-3 group">
                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <Users className="h-4 w-4 text-green-500" />
                              Department
                            </Label>
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 group-hover:bg-gray-100 dark:group-hover:bg-gray-700/50 group-hover:shadow-md group-hover:scale-[1.02]">
                              <p className="text-gray-900 dark:text-white font-medium text-base">
                                {profileData.department || (
                                  <span className="text-gray-500 dark:text-gray-400 italic">Not specified</span>
                                )}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-3 group">
                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <Target className="h-4 w-4 text-purple-500" />
                              Managerial Level
                            </Label>
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 group-hover:bg-gray-100 dark:group-hover:bg-gray-700/50 group-hover:shadow-md group-hover:scale-[1.02]">
                              <p className="text-gray-900 dark:text-white font-medium text-base">
                                {profileData.managerial_level || (
                                  <span className="text-gray-500 dark:text-gray-400 italic">Not specified</span>
                                )}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-3 group">
                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <User className="h-4 w-4 text-orange-500" />
                              Direct Manager
                            </Label>
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 group-hover:bg-gray-100 dark:group-hover:bg-gray-700/50 group-hover:shadow-md group-hover:scale-[1.02]">
                              <p className="text-gray-900 dark:text-white font-medium text-base">
                                {profileData.direct_manager || (
                                  <span className="text-gray-500 dark:text-gray-400 italic">Not specified</span>
                                )}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-3 group">
                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-red-500" />
                              Branch
                            </Label>
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 group-hover:bg-gray-100 dark:group-hover:bg-gray-700/50 group-hover:shadow-md group-hover:scale-[1.02]">
                              <p className="text-gray-900 dark:text-white font-medium text-base">
                                {profileData.branch || (
                                  <span className="text-gray-500 dark:text-gray-400 italic">Not specified</span>
                                )}
                              </p>
                            </div>
                          </div>
                          
                          {profileData.org_path && (
                            <div className="space-y-3 group lg:col-span-2">
                              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <MapIcon className="h-4 w-4 text-indigo-500" />
                                Organizational Path
                              </Label>
                              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 group-hover:bg-gray-100 dark:group-hover:bg-gray-700/50 group-hover:shadow-md group-hover:scale-[1.02]">
                                <p className="text-gray-900 dark:text-white font-medium text-base break-all">
                                  {profileData.org_path}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Employment Details Section */}
                  <div className="space-y-4">
                    <button
                      onClick={() => toggleSection('employmentDetails')}
                      className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-700 hover:from-purple-100 hover:to-purple-150 dark:hover:from-purple-800/30 dark:hover:to-purple-700/30 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500 rounded-lg">
                          <Clock className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Employment Details</h3>
                      </div>
                      {expandedSections.employmentDetails ? (
                        <ChevronUp className="h-5 w-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-200" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-200" />
                      )}
                    </button>
                    
                    {expandedSections.employmentDetails && (
                      <div className="overflow-hidden">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 transform transition-all duration-500 ease-out animate-in slide-in-from-top-4 fade-in">
                          <div className="space-y-3 group">
                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-blue-500" />
                              Join Date
                            </Label>
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 group-hover:bg-gray-100 dark:group-hover:bg-gray-700/50 group-hover:shadow-md group-hover:scale-[1.02]">
                              <p className="text-gray-900 dark:text-white font-medium text-base">
                                {profileData.join_date ? formatDate(profileData.join_date) : (
                                  <span className="text-gray-500 dark:text-gray-400 italic">Not specified</span>
                                )}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-3 group">
                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-green-500" />
                              Job Type
                            </Label>
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 group-hover:bg-gray-100 dark:group-hover:bg-gray-700/50 group-hover:shadow-md group-hover:scale-[1.02]">
                              <p className="text-gray-900 dark:text-white font-medium text-base">
                                {profileData.job_type || (
                                  <span className="text-gray-500 dark:text-gray-400 italic">Not specified</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
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
                        key={evaluation.evaluation_id } 
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
                {/* Password Status Information */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Password Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Default Password Status</Label>
                      <div className="flex items-center gap-2">
                        {profileData.is_default_password ? (
                          <>
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                            <Badge className="bg-amber-100 text-amber-800">Using Default Password</Badge>
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 text-green-500" />
                            <Badge className="bg-green-100 text-green-800">Custom Password Set</Badge>
                          </>
                        )}
                      </div>
                    </div>
                    {profileData.password_last_changed && (
                      <div className="space-y-2">
                        <Label>Last Password Change</Label>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <p className="text-gray-900">{formatDate(profileData.password_last_changed)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {profileData.is_default_password && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-800">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Security Recommendation: Please change your default password for better security.</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Change Password</h3>
                    <p className="text-gray-600 text-sm mb-4">Update your password to keep your account secure</p>
                    
                    {/* Success Message */}
                    {passwordChangeSuccess && (
                      <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2 text-green-800">
                          <Award className="h-5 w-5" />
                          <span className="font-medium">Password Changed Successfully</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPasswordChangeSuccess(false)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {/* General Error Message */}
                    {passwordErrors.general && (
                      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 text-red-800">
                          <AlertCircle className="h-5 w-5" />
                          <span className="font-medium">{passwordErrors.general}</span>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="current-password">Current Password *</Label>
                        <Input 
                          id="current-password" 
                          type="password" 
                          value={passwordData.currentPassword}
                          onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                          className={passwordErrors.currentPassword ? 'border-red-500' : ''}
                          disabled={isChangingPassword}
                        />
                        {passwordErrors.currentPassword && (
                          <p className="text-red-600 text-sm mt-1">{passwordErrors.currentPassword}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="new-password">New Password *</Label>
                        <Input 
                          id="new-password" 
                          type="password" 
                          value={passwordData.newPassword}
                          onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                          className={passwordErrors.newPassword ? 'border-red-500' : ''}
                          disabled={isChangingPassword}
                        />
                        {passwordErrors.newPassword && (
                          <p className="text-red-600 text-sm mt-1">{passwordErrors.newPassword}</p>
                        )}
                        
                        {/* Password Strength Meter */}
                        {passwordData.newPassword && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600">Password Strength:</span>
                              <span className={`font-medium ${
                                getPasswordStrength(passwordData.newPassword).score < 50 ? 'text-red-600' :
                                getPasswordStrength(passwordData.newPassword).score < 75 ? 'text-yellow-600' :
                                getPasswordStrength(passwordData.newPassword).score < 100 ? 'text-blue-600' :
                                'text-green-600'
                              }`}>
                                {getPasswordStrength(passwordData.newPassword).label}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrength(passwordData.newPassword).color}`}
                                style={{ width: `${getPasswordStrength(passwordData.newPassword).score}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Password must be at least 8 characters with uppercase letter and number
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="confirm-password">Confirm New Password *</Label>
                        <Input 
                          id="confirm-password" 
                          type="password" 
                          value={passwordData.confirmPassword}
                          onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                          className={passwordErrors.confirmPassword ? 'border-red-500' : ''}
                          disabled={isChangingPassword}
                        />
                        {passwordErrors.confirmPassword && (
                          <p className="text-red-600 text-sm mt-1">{passwordErrors.confirmPassword}</p>
                        )}
                      </div>

                      <Button 
                        type="submit"
                        className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Updating Password...
                          </>
                        ) : (
                          'Update Password'
                        )}
                      </Button>
                    </form>
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
