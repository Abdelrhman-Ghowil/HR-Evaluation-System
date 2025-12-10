import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
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
  Shield,
  TrendingUp,
  Target,
  Users,
  Loader2,
  AlertCircle,
  BarChart3,
  FileText,
  Eye,
  EyeOff,
  Award,
  ChevronDown,
  ChevronUp,
  Building,
  UserCheck,
  Clock,
  MapIcon
} from 'lucide-react';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import { ApiEmployee, ApiEvaluation, ApiObjective, ApiCompetency, ApiMyProfile, ApiError } from '../../types/api';
import { useEvaluations, useUpdateObjective, useUpdateCompetency, useUpdateEvaluation, useCreateObjective, useDeleteObjective, useCreateCompetency, useDeleteCompetency } from '../../hooks/useApi';
import { toast } from 'sonner';
import EvaluationDetails from '../employees/EvaluationDetails';
import { 
  transformEmployeeForEvaluation, 
  transformEvaluationForDetails, 
  safeTransformData 
} from '../../utils/dataTransformers';
import { EvaluationInput } from '../../types/shared';

interface ProfileData {
  company_id: string;
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<string>(() => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'personal';
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    employee_id: '',
    company_id: '',
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab') || 'personal';
    setActiveTab(tab);
  }, [location.search]);

  // Validation functions
  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'username':
        if (!value.trim()) return 'Username is required';
        if (value.trim().length < 2) return 'Username must be at least 2 characters';
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
  const [isSelfEvalMode, setIsSelfEvalMode] = useState(false);
  const [objectiveEdits, setObjectiveEdits] = useState<Record<string, number>>({});
  const [competencyEdits, setCompetencyEdits] = useState<Record<string, number>>({});
  const [isSubmittingSelfEval, setIsSubmittingSelfEval] = useState(false);
  const [selectedSelfEvaluation, setSelectedSelfEvaluation] = useState<ApiEvaluation | null>(null);
  const [selfObjectives, setSelfObjectives] = useState<ApiObjective[]>([]);
  const [selfCompetencies, setSelfCompetencies] = useState<ApiCompetency[]>([]);
  const [selfLoadingObjectives, setSelfLoadingObjectives] = useState(false);
  const [selfLoadingCompetencies, setSelfLoadingCompetencies] = useState(false);
  const [selfEvaluations, setSelfEvaluations] = useState<ApiEvaluation[]>([]);
  const [selfEvaluationsLoading, setSelfEvaluationsLoading] = useState(false);
  const [selfEvaluationsError, setSelfEvaluationsError] = useState<string | null>(null);
  const [creatingSelfEval, setCreatingSelfEval] = useState(false);
  const [newSelfType, setNewSelfType] = useState<'Quarterly' | 'Annual' | 'Optional'>('Annual');
  const getCurrentAnnualPeriod = () => {
    const d = new Date();
    const suffix = d.getMonth() < 6 ? 'Mid' : 'End';
    return `${d.getFullYear()}-${suffix}`;
  };
  const [newSelfPeriod, setNewSelfPeriod] = useState<string>(getCurrentAnnualPeriod());
  const [isDeletingSelfId, setIsDeletingSelfId] = useState<string | null>(null);
  const [confirmSelfDeleteOpen, setConfirmSelfDeleteOpen] = useState(false);
  const [selfEvalToDelete, setSelfEvalToDelete] = useState<ApiEvaluation | null>(null);

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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // React Query: Evaluations (cached)
  const {
    data: evaluationsData,
    isLoading: evaluationsQueryLoading,
    error: evaluationsQueryError,
  } = useEvaluations(
    { status: 'Approved' },
    {
      enabled: true,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      select: (data: any) => {
        if (Array.isArray(data)) return data;
        if (data?.results && Array.isArray(data.results)) return data.results;
        return [];
      },
    }
  );

  useEffect(() => {
    setEvaluationsLoading(!!evaluationsQueryLoading);
  }, [evaluationsQueryLoading]);

  useEffect(() => {
    setEvaluations(evaluationsData || []);
  }, [evaluationsData]);

  useEffect(() => {
    setEvaluationsError(
      evaluationsQueryError ? (evaluationsQueryError as Error).message : null
    );
  }, [evaluationsQueryError]);

  useEffect(() => {
    const fetchSelfEvals = async () => {
      if (!user?.user_id) return;
      setSelfEvaluationsLoading(true);
      setSelfEvaluationsError(null);
      try {
        const data = await apiService.getSelfEvaluations();
        setSelfEvaluations(Array.isArray(data) ? data : []);
      } catch (err: any) {
        const msg = err?.message || 'Error fetching self evaluations';
        setSelfEvaluationsError(msg);
        setSelfEvaluations([]);
      } finally {
        setSelfEvaluationsLoading(false);
      }
    };
    fetchSelfEvals();
  }, [user?.user_id]);

  // React Query: My Profile (cached)
  const queryClient = useQueryClient();
  const {
    data: myProfileData,
    isLoading: myProfileLoading,
    error: myProfileError,
  } = useQuery<ApiMyProfile>({
    queryKey: ['my-profile'],
    queryFn: () => apiService.getMyProfile(),
    enabled: !!user?.user_id,
    staleTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    setLoading(!!myProfileLoading);
  }, [myProfileLoading]);

  useEffect(() => {
    if (myProfileError) {
      const message = myProfileError instanceof Error ? myProfileError.message : 'Failed to fetch profile data';
      setError(message);
    } else {
      setError(null);
    }
  }, [myProfileError]);

  useEffect(() => {
    if (myProfileData) {
      const mappedData: ProfileData = {
        employee_id: myProfileData.employee_code || '',
        employee_code: myProfileData.employee_code || '',
        name: myProfileData.name || user?.name || '',
        username: myProfileData.username || user?.username || '',
        email: myProfileData.email || user?.email || '',
        phone: myProfileData.phone || '',
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
        gender: myProfileData.gender || '',
        country_code: myProfileData.country_code || '',
        avatar: myProfileData.avatar || '',
        is_default_password: myProfileData.is_default_password || false,
        password_last_changed: myProfileData.password_last_changed || '',
        org_path: myProfileData.org_path || ''
      };
      setProfileData(mappedData);
      setEditData(mappedData);
    }
  }, [myProfileData, user]);

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

      // Sync React Query cache to prevent refetch on navigation
      queryClient.setQueryData(['my-profile'], (prev: ApiMyProfile | undefined) => ({
        ...(prev || {}),
        ...updatedProfile,
      }));

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
        const objectivesData = await apiService.getObjectives(evaluation.evaluation_id );
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
    const achievedValue = objectiveEdits[objective.objective_id] ?? objective.achieved;
    if (!objective.target || !achievedValue) return 0;
    const target = parseFloat(objective.target.toString());
    const achieved = parseFloat(achievedValue.toString());
    if (target === 0) return 0;
    return Math.min((achieved / target) * 100, 100);
  };

  const getCompetencyScore = (competency: ApiCompetency): number => {
    const actualLevel = competencyEdits[competency.competence_id] ?? competency.actual_level;
    if (!competency.required_level || !actualLevel) return 0;
    const required = parseFloat(competency.required_level.toString());
    const actual = parseFloat(actualLevel.toString());
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

  const getOverallObjectiveScoreForList = (list: ApiObjective[]): number => {
    if (list.length === 0) return 0;
    const totalWeight = list.reduce((sum, obj) => sum + (obj.weight || 0), 0);
    if (totalWeight === 0) return 0;
    const weightedScore = list.reduce((sum, obj) => {
      const score = getObjectiveScore(obj);
      const weight = obj.weight || 0;
      return sum + (score * weight / 100);
    }, 0);
    return weightedScore;
  };

  const getOverallCompetencyScoreForList = (list: ApiCompetency[]): number => {
    if (list.length === 0) return 0;
    const totalWeight = list.reduce((sum, comp) => sum + (comp.weight || 0), 0);
    if (totalWeight === 0) return 0;
    const weightedScore = list.reduce((sum, comp) => {
      const score = getCompetencyScore(comp);
      const weight = comp.weight || 0;
      return sum + (score * weight / 100);
    }, 0);
    return weightedScore;
  };

  const updateObjectiveMutation = useUpdateObjective();
  const updateCompetencyMutation = useUpdateCompetency();
  const updateEvaluationMutation = useUpdateEvaluation();
  const createObjectiveMutation = useCreateObjective();
  const deleteObjectiveMutation = useDeleteObjective();
  const createCompetencyMutation = useCreateCompetency();
  const deleteCompetencyMutation = useDeleteCompetency();
  const isEmployee = (user?.role || '').toLowerCase() === 'employee';
  const canSelfCrud = isSelfEvalMode && isEmployee;

  const [editingObjectiveId, setEditingObjectiveId] = useState<string | null>(null);
  const [objectiveFieldEdits, setObjectiveFieldEdits] = useState<Record<string, Partial<UpdateObjectiveRequest>>>({});
  const [editingCompetencyId, setEditingCompetencyId] = useState<string | null>(null);
  const [competencyFieldEdits, setCompetencyFieldEdits] = useState<Record<string, Partial<UpdateCompetencyRequest>>>({});

  const [newObjective, setNewObjective] = useState<{ title: string; description: string; target: number; achieved: number; weight: number; status: 'Not started' | 'In-progress' | 'Completed' } | null>({ title: '', description: '', target: 0, achieved: 0, weight: 10, status: 'Not started' });
  const [newCompetency, setNewCompetency] = useState<{ name: string; category: 'Core' | 'Leadership' | 'Functional'; required_level: number; actual_level: number; description: string } | null>({ name: '', category: 'Core', required_level: 5, actual_level: 0, description: '' });

  const handleSubmitSelfEvaluation = async () => {
    const evalToSubmit = selectedSelfEvaluation || selectedEvaluationForPanel;
    if (!evalToSubmit) return;
    setIsSubmittingSelfEval(true);
    try {
      const objectivesList = selectedSelfEvaluation ? selfObjectives : objectives;
      const competenciesList = selectedSelfEvaluation ? selfCompetencies : competencies;
      for (const obj of objectivesList) {
        const newAchieved = objectiveEdits[obj.objective_id];
        if (newAchieved !== undefined && newAchieved !== obj.achieved) {
          await updateObjectiveMutation.mutateAsync({ objectiveId: obj.objective_id, evaluationId: evalToSubmit.evaluation_id, objectiveData: { achieved: newAchieved } });
        }
      }
      for (const comp of competenciesList) {
        const newActual = competencyEdits[comp.competence_id];
        if (newActual !== undefined && newActual !== comp.actual_level) {
          await updateCompetencyMutation.mutateAsync({ competencyId: comp.competence_id, competencyData: { actual_level: newActual } });
        }
      }
      const objScore = getOverallObjectiveScoreForList(objectivesList);
      const compScore = getOverallCompetencyScoreForList(competenciesList);
      const newScore = Math.round((objScore + compScore) / 2);
      if (!Number.isNaN(newScore) && evalToSubmit.evaluation_id) {
        await updateEvaluationMutation.mutateAsync({ evaluationId: evalToSubmit.evaluation_id, evaluationData: { score: newScore } });
      }
      if (selectedSelfEvaluation) {
        setSelfObjectives(prev => prev.map(o => ({ ...o, achieved: objectiveEdits[o.objective_id] ?? o.achieved })));
        setSelfCompetencies(prev => prev.map(c => ({ ...c, actual_level: competencyEdits[c.competence_id] ?? c.actual_level })));
      } else {
        setObjectives(prev => prev.map(o => ({ ...o, achieved: objectiveEdits[o.objective_id] ?? o.achieved })));
        setCompetencies(prev => prev.map(c => ({ ...c, actual_level: competencyEdits[c.competence_id] ?? c.actual_level })));
      }
      setObjectiveEdits({});
      setCompetencyEdits({});
      setIsSelfEvalMode(false);
      toast.success('Self evaluation submitted');
    } catch (e) {
      toast.error('Failed to submit self evaluation');
    } finally {
      setIsSubmittingSelfEval(false);
    }
  };

  useEffect(() => {
    const pending = evaluations.filter(e => e.status === 'Employee Review');
    setSelectedSelfEvaluation(pending.length > 0 ? pending[0] : null);
  }, [evaluations]);

  useEffect(() => {
    const eid = selectedSelfEvaluation?.evaluation_id;
    if (!eid) {
      setSelfObjectives([]);
      setSelfCompetencies([]);
      return;
    }
    setSelfLoadingObjectives(true);
    setSelfLoadingCompetencies(true);
    apiService.getObjectives(eid)
      .then(data => setSelfObjectives(data || []))
      .catch(() => setSelfObjectives([]))
      .finally(() => setSelfLoadingObjectives(false));
    apiService.getCompetencies(eid)
      .then(data => setSelfCompetencies(data || []))
      .catch(() => setSelfCompetencies([]))
      .finally(() => setSelfLoadingCompetencies(false));
  }, [selectedSelfEvaluation?.evaluation_id]);

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
      await apiService.changePassword({
        old_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        new_password_confirm: passwordData.confirmPassword
      });
      toast.success('Password changed successfully. Please log in again.');
      await logout();
      navigate('/');

    } catch (error) {
      const apiError = error as ApiError;
      const details = (apiError?.details || {}) as Record<string, unknown>;
      if (apiError?.status === 400) {
        if (details && 'old_password' in details) {
          setPasswordErrors(prev => ({ ...prev, currentPassword: 'Error: Current Password Incorrect' }));
        } else if (details && 'new_password' in details) {
          const val = (details as Record<string, unknown>)['new_password'];
          const msg = Array.isArray(val) ? String(val[0]) : String(val || 'Error: Password too weak');
          setPasswordErrors(prev => ({ ...prev, newPassword: msg }));
        } else {
          setPasswordErrors(prev => ({ ...prev, general: apiError?.message || 'Password change failed' }));
        }
      } else {
        setPasswordErrors(prev => ({ ...prev, general: apiError?.message || 'Password change failed. Please try again.' }));
      }
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white border shadow-sm">
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
            <TabsTrigger value="self-review" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Self Review
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

          <TabsContent value="self-review" className="space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Self Evaluation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap items-end gap-4 p-4 bg-gray-50 rounded-lg border">
                  <div className="space-y-2">
                    <Label>Period</Label>
                    <Input value={newSelfPeriod} disabled placeholder="2025-Q1" className="w-40" />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Input value={newSelfType} disabled className="w-40" />
                  </div>
                  <div className="ml-auto">
                    <Button
                      onClick={async () => {
                        if (!newSelfPeriod || !newSelfType) return;
                        setCreatingSelfEval(true);
                        try {
                          const created = await apiService.createSelfEvaluation({ period: newSelfPeriod, type: newSelfType });
                          toast.success('Self evaluation created');
                          const refreshed = await apiService.getSelfEvaluations();
                          setSelfEvaluations(Array.isArray(refreshed) ? refreshed : []);
                          setIsSelfEvalMode(true);
                          setSelectedSelfEvaluation(created);
                        } catch (err: any) {
                          toast.error(err?.message || 'Failed to create self evaluation');
                        } finally {
                          setCreatingSelfEval(false);
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={creatingSelfEval}
                    >
                      {creatingSelfEval ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Self Evaluation'
                      )}
                    </Button>
                  </div>
                </div>
                {selfEvaluationsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Loading self evaluations...</span>
                  </div>
                ) : selfEvaluationsError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <p className="text-red-600 font-medium">Error loading self evaluations</p>
                    <p className="text-red-500 text-sm mt-2">{selfEvaluationsError}</p>
                  </div>
                ) : selfEvaluations.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No self evaluations found</p>
                    <p className="text-gray-500 text-sm mt-2">Your self evaluations will appear here when available.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selfEvaluations.map((evaluation) => (
                      <Card 
                        key={evaluation.evaluation_id} 
                        className="hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500 cursor-pointer"
                        onClick={() => { setIsSelfEvalMode(true); handleEvaluationClick(evaluation); }}
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
                              <Badge className={getStatusBadgeClass(evaluation.status)}>
                                {evaluation.status}
                              </Badge>
                              {evaluation.score && (
                                <div className="text-right">
                                  <p className="text-lg font-bold text-gray-900">{evaluation.score}</p>
                                  <p className="text-xs text-gray-500">Score</p>
                                </div>
                              )}
                              <Button variant="outline" size="sm" className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); setSelfEvalToDelete(evaluation); setConfirmSelfDeleteOpen(true); }}
                                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={isDeletingSelfId === evaluation.evaluation_id}
                              >
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                  <path d="M10 11v6" />
                                  <path d="M14 11v6" />
                                  <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                                </svg>
                                Delete
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

          <AlertDialog open={confirmSelfDeleteOpen} onOpenChange={setConfirmSelfDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Self Evaluation</AlertDialogTitle>
                <AlertDialogDescription>
                  {selfEvalToDelete ? (
                    <span>
                      This action will permanently delete the self evaluation for {selfEvalToDelete.period} ({selfEvalToDelete.type}).
                    </span>
                  ) : (
                    <span>Are you sure you want to delete this self evaluation?</span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => { setSelfEvalToDelete(null); }}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    if (!selfEvalToDelete) return;
                    try {
                      setIsDeletingSelfId(selfEvalToDelete.evaluation_id);
                      await apiService.deleteEvaluation(selfEvalToDelete.evaluation_id);
                      toast.success('Self evaluation deleted');
                      const refreshed = await apiService.getSelfEvaluations();
                      setSelfEvaluations(Array.isArray(refreshed) ? refreshed : []);
                    } catch (err: any) {
                      toast.error(err?.message || 'Failed to delete self evaluation');
                    } finally {
                      setIsDeletingSelfId(null);
                      setConfirmSelfDeleteOpen(false);
                      setSelfEvalToDelete(null);
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

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
                        onClick={() => { setIsSelfEvalMode(false); handleEvaluationClick(evaluation); }}
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
                        <div className="relative">
                          <Input 
                            id="current-password" 
                            type={showCurrentPassword ? 'text' : 'password'} 
                            value={passwordData.currentPassword}
                            onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                            className={`${passwordErrors.currentPassword ? 'border-red-500' : ''} pr-10`}
                            disabled={isChangingPassword}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                            disabled={isChangingPassword}
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                        {passwordErrors.currentPassword && (
                          <p className="text-red-600 text-sm mt-1">{passwordErrors.currentPassword}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="new-password">New Password *</Label>
                        <div className="relative">
                          <Input 
                            id="new-password" 
                            type={showNewPassword ? 'text' : 'password'} 
                            value={passwordData.newPassword}
                            onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                            className={`${passwordErrors.newPassword ? 'border-red-500' : ''} pr-10`}
                            disabled={isChangingPassword}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                            disabled={isChangingPassword}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
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
                        <div className="relative">
                          <Input 
                            id="confirm-password" 
                            type={showConfirmPassword ? 'text' : 'password'} 
                            value={passwordData.confirmPassword}
                            onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                            className={`${passwordErrors.confirmPassword ? 'border-red-500' : ''} pr-10`}
                            disabled={isChangingPassword}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                            disabled={isChangingPassword}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
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
                    {canSelfCrud && selectedEvaluationForPanel && (
                      <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50">
                        <CardContent className="p-3">
                          <Accordion type="single" collapsible>
                            <AccordionItem value="add-objective">
                              <AccordionTrigger>
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-2">
                                    <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
                                      <Target className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="font-semibold text-gray-900">Add Objective</div>
                                  </div>
                                  <Badge>{selectedEvaluationForPanel.period}</Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                      <Button variant="outline" size="sm" onClick={() => setNewObjective({ title: 'Increase KPI', description: 'Improve quarterly KPI performance', target: 10, achieved: 0, weight: 10, status: 'Not started' })} className="rounded-full">Increase KPI</Button>
                                      <Button variant="outline" size="sm" onClick={() => setNewObjective({ title: 'Reduce Incidents', description: 'Lower monthly incident rate', target: 10, achieved: 0, weight: 10, status: 'Not started' })} className="rounded-full">Reduce Incidents</Button>
                                      <Button variant="outline" size="sm" onClick={() => setNewObjective({ title: 'Improve Quality', description: 'Enhance deliverable quality benchmarks', target: 10, achieved: 0, weight: 10, status: 'Not started' })} className="rounded-full">Improve Quality</Button>
                                    </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <Label>Title</Label>
                                      <Input value={newObjective?.title ?? ''} onChange={(e) => setNewObjective(prev => ({ ...(prev || { title: '', description: '', target: 0, achieved: 0, weight: 10, status: 'Not started' }), title: e.target.value }))} />
                                    </div>
                                    <div className="space-y-1">
                                      <Label>Target</Label>
                                      <Input type="number" min={0} max={10} value={newObjective?.target ?? 0} onChange={(e) => setNewObjective(prev => ({ ...(prev || { title: '', description: '', target: 0, achieved: 0, weight: 10, status: 'Not started' }), target: Math.min(parseFloat(e.target.value) || 0, 10) }))} />
                                    </div>
                                    <div className="space-y-1">
                                      <Label>Achieved</Label>
                                      <Input type="number" min={0} max={10} value={newObjective?.achieved ?? 0} onChange={(e) => setNewObjective(prev => ({ ...(prev || { title: '', description: '', target: 0, achieved: 0, weight: 10, status: 'Not started' }), achieved: Math.min(parseFloat(e.target.value) || 0, 10) }))} />
                                    </div>
                                    <div className="space-y-1">
                                      <Label>Weight (%)</Label>
                                      <Input type="number" min={10} max={40} value={newObjective?.weight ?? 10} onChange={(e) => setNewObjective(prev => ({ ...(prev || { title: '', description: '', target: 0, achieved: 0, weight: 10, status: 'Not started' }), weight: Math.max(10, Math.min(parseFloat(e.target.value) || 10, 40)) }))} />
                                    </div>
                                    <div className="space-y-1">
                                      <Label>Status</Label>
                                      <Select value={newObjective?.status ?? 'Not started'} onValueChange={(v) => setNewObjective(prev => ({ ...(prev || { title: '', description: '', target: 0, achieved: 0, weight: 10, status: 'Not started' }), status: v as any }))}>
                                        <SelectTrigger className="w-40">
                                          <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Not started">Not started</SelectItem>
                                          <SelectItem value="In-progress">In-progress</SelectItem>
                                          <SelectItem value="Completed">Completed</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                      <Label>Description</Label>
                                      <Textarea rows={2} value={newObjective?.description ?? ''} onChange={(e) => setNewObjective(prev => ({ ...(prev || { title: '', description: '', target: 0, achieved: 0, weight: 10, status: 'Not started' }), description: e.target.value }))} />
                                    </div>
                                  </div>
                                  <div>
                                    <div className="rounded-lg border bg-white p-3">
                                      <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-600">Preview</div>
                                        <Badge variant="outline" className="text-blue-700 border-blue-200">{newObjective?.status}</Badge>
                                      </div>
                                      <div className="mt-2 flex items-center gap-6">
                                        <div>
                                          <div className="text-xs text-gray-500">Target</div>
                                          <div className="text-lg font-semibold text-gray-900">{newObjective?.target ?? 0}</div>
                                        </div>
                                        <div>
                                          <div className="text-xs text-gray-500">Achieved</div>
                                          <div className="text-lg font-semibold text-gray-900">{newObjective?.achieved ?? 0}</div>
                                        </div>
                                        <div className="flex-1">
                                          <div className="text-xs text-gray-500 mb-1">Progress</div>
                                          <div className="w-full h-2 bg-gray-200 rounded">
                                            <div
                                              className="h-2 rounded bg-gradient-to-r from-blue-600 to-indigo-600"
                                              style={{ width: `${Math.min(((newObjective?.achieved ?? 0) / Math.max(newObjective?.target ?? 1, 1)) * 100, 100)}%` }}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex justify-end">
                                    <Button
                                      onClick={async () => {
                                        if (!selectedEvaluationForPanel || !newObjective || !newObjective.title) { toast.error('Provide title'); return; }
                                        try {
                                          const payload = {
                                            evaluation_id: selectedEvaluationForPanel.evaluation_id,
                                            title: newObjective.title,
                                            description: newObjective.description,
                                            target: newObjective.target,
                                            achieved: newObjective.achieved,
                                            weight: newObjective.weight,
                                            status: newObjective.status,
                                          };
                                          const created = await createObjectiveMutation.mutateAsync(payload as any);
                                          setObjectives(prev => [created, ...prev]);
                                          setNewObjective({ title: '', description: '', target: 0, achieved: 0, weight: 10, status: 'Not started' });
                                          toast.success('Objective added');
                                        } catch (err: any) {
                                          toast.error(err?.message || 'Failed to add objective');
                                        }
                                      }}
                                      className="bg-blue-600 hover:bg-blue-700"
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add Objective
                                    </Button>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </CardContent>
                      </Card>
                    )}
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
                          const achievedValue = objectiveEdits[objective.objective_id] ?? objective.achieved;
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
                                    {canSelfCrud && (
                                      <div className="flex items-center gap-2 justify-end mt-2">
                                        {editingObjectiveId === objective.objective_id ? (
                                          <Button
                                            onClick={async () => {
                                              try {
                                                const data = objectiveFieldEdits[objective.objective_id] || {};
                                                const achievedChanged = objectiveEdits[objective.objective_id];
                                                const updateData: any = { ...data };
                                                if (achievedChanged !== undefined) updateData.achieved = achievedChanged;
                                                if (Object.keys(updateData).length === 0) { setEditingObjectiveId(null); return; }
                                                const updated = await updateObjectiveMutation.mutateAsync({ objectiveId: objective.objective_id, evaluationId: objective.evaluation_id, objectiveData: updateData });
                                                setObjectives(prev => prev.map(o => o.objective_id === objective.objective_id ? { ...o, ...updated } : o));
                                                setEditingObjectiveId(null);
                                                setObjectiveFieldEdits(prev => ({ ...prev, [objective.objective_id]: {} }));
                                                toast.success('Objective updated');
                                              } catch (err: any) {
                                                toast.error(err?.message || 'Failed to update objective');
                                              }
                                            }}
                                            className="bg-green-600 hover:bg-green-700"
                                          >
                                            <Save className="h-4 w-4 mr-2" />
                                            Save
                                          </Button>
                                        ) : (
                                          <Button onClick={() => setEditingObjectiveId(objective.objective_id)} variant="outline">
                                            <Edit3 className="h-4 w-4 mr-2" />
                                            Edit
                                          </Button>
                                        )}
                                        <Button
                                          variant="outline"
                                          onClick={async () => {
                                            try {
                                              await deleteObjectiveMutation.mutateAsync({ objectiveId: objective.objective_id, evaluationId: objective.evaluation_id });
                                              setObjectives(prev => prev.filter(o => o.objective_id !== objective.objective_id));
                                              toast.success('Objective deleted');
                                            } catch (err: any) {
                                              toast.error(err?.message || 'Failed to delete objective');
                                            }
                                          }}
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {canSelfCrud && editingObjectiveId === objective.objective_id && (
                                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                      <Label>Title</Label>
                                      <Input defaultValue={objective.title} onChange={(e) => setObjectiveFieldEdits(prev => ({ ...prev, [objective.objective_id]: { ...prev[objective.objective_id], title: e.target.value } }))} />
                                    </div>
                                    <div className="space-y-1">
                                      <Label>Target</Label>
                                      <Input type="number" min={0} max={10} defaultValue={objective.target} onChange={(e) => setObjectiveFieldEdits(prev => ({ ...prev, [objective.objective_id]: { ...prev[objective.objective_id], target: Math.min(parseFloat(e.target.value) || 0, 10) } }))} />
                                    </div>
                                    <div className="space-y-1">
                                      <Label>Weight (%)</Label>
                                      <Input type="number" min={10} max={40} defaultValue={objective.weight} onChange={(e) => setObjectiveFieldEdits(prev => ({ ...prev, [objective.objective_id]: { ...prev[objective.objective_id], weight: Math.max(10, Math.min(parseFloat(e.target.value) || 10, 40)) } }))} />
                                    </div>
                                    
                                    <div className="md:col-span-3 space-y-1">
                                      <Label>Description</Label>
                                      <Textarea rows={2} defaultValue={objective.description} onChange={(e) => setObjectiveFieldEdits(prev => ({ ...prev, [objective.objective_id]: { ...prev[objective.objective_id], description: e.target.value } }))} />
                                    </div>
                                    <div className="space-y-1">
                                      <Label>Status</Label>
                                      <Select value={(objective.status as any) ?? 'Not started'} onValueChange={(v) => setObjectiveFieldEdits(prev => ({ ...prev, [objective.objective_id]: { ...prev[objective.objective_id], status: v } }))}>
                                        <SelectTrigger className="w-40">
                                          <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Not started">Not started</SelectItem>
                                          <SelectItem value="In-progress">In-progress</SelectItem>
                                          <SelectItem value="Completed">Completed</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="competencies" className="space-y-4">
                    {canSelfCrud && selectedEvaluationForPanel && (
                      <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50">
                        <CardContent className="p-3">
                          <Accordion type="single" collapsible>
                            <AccordionItem value="add-competency">
                              <AccordionTrigger>
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-2">
                                    <div className="p-2 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg">
                                      <Award className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="font-semibold text-gray-900">Add Competency</div>
                                  </div>
                                  <Badge>{selectedEvaluationForPanel.period}</Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-3">
                                  <div className="flex flex-wrap gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setNewCompetency({ name: 'Communication', category: 'Core', required_level: 5, actual_level: 0, description: 'Improve communication effectiveness' })} className="rounded-full">Communication</Button>
                                    <Button variant="outline" size="sm" onClick={() => setNewCompetency({ name: 'Leadership', category: 'Leadership', required_level: 6, actual_level: 0, description: 'Develop leadership capabilities' })} className="rounded-full">Leadership</Button>
                                    <Button variant="outline" size="sm" onClick={() => setNewCompetency({ name: 'Functional Expertise', category: 'Functional', required_level: 7, actual_level: 0, description: 'Strengthen functional knowledge' })} className="rounded-full">Functional Expertise</Button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <Label>Name</Label>
                                      <Input value={newCompetency?.name ?? ''} onChange={(e) => setNewCompetency(prev => ({ ...(prev || { name: '', category: 'Core', required_level: 5, actual_level: 0, weight: 10, description: '' }), name: e.target.value }))} />
                                    </div>
                                    <div className="space-y-1">
                                      <Label>Category</Label>
                                      <Select value={newCompetency?.category ?? 'Core'} onValueChange={(v) => setNewCompetency(prev => ({ ...(prev || { name: '', category: 'Core', required_level: 5, actual_level: 0, weight: 10, description: '' }), category: v as any }))}>
                                        <SelectTrigger className="w-40">
                                          <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Core">Core</SelectItem>
                                          <SelectItem value="Leadership">Leadership</SelectItem>
                                          <SelectItem value="Functional">Functional</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-1">
                                      <Label>Required Level</Label>
                                      <Input type="range" min={0} max={10} value={newCompetency?.required_level ?? 5} onChange={(e) => setNewCompetency(prev => ({ ...(prev || { name: '', category: 'Core', required_level: 5, actual_level: 0, weight: 10, description: '' }), required_level: parseFloat(e.target.value) || 0 }))} />
                                      <div className="text-xs text-gray-600">{newCompetency?.required_level ?? 5}/10</div>
                                    </div>
                                    <div className="space-y-1">
                                      <Label>Actual Level</Label>
                                      <Input type="range" min={0} max={10} value={newCompetency?.actual_level ?? 0} onChange={(e) => setNewCompetency(prev => ({ ...(prev || { name: '', category: 'Core', required_level: 5, actual_level: 0, weight: 10, description: '' }), actual_level: parseFloat(e.target.value) || 0 }))} />
                                      <div className="text-xs text-gray-600">{newCompetency?.actual_level ?? 0}/10</div>
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                      <Label>Description</Label>
                                      <Textarea rows={2} value={newCompetency?.description ?? ''} onChange={(e) => setNewCompetency(prev => ({ ...(prev || { name: '', category: 'Core', required_level: 5, actual_level: 0, description: '' }), description: e.target.value }))} />
                                    </div>
                                  </div>
                                  <div>
                                    <div className="rounded-lg border bg-white p-3">
                                      <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-600">Preview</div>
                                        <Badge 
                                          variant="outline" 
                                          className={
                                            (newCompetency?.category === 'Core') ? 'text-blue-700 border-blue-200' :
                                            (newCompetency?.category === 'Leadership') ? 'text-purple-700 border-purple-200' :
                                            'text-orange-700 border-orange-200'
                                          }
                                        >
                                          {newCompetency?.category}
                                        </Badge>
                                      </div>
                                      <div className="mt-2 flex items-center gap-6">
                                        <div>
                                          <div className="text-xs text-gray-500">Required</div>
                                          <div className="text-lg font-semibold text-gray-900">{newCompetency?.required_level ?? 0}/10</div>
                                        </div>
                                        <div>
                                          <div className="text-xs text-gray-500">Actual</div>
                                          <div className="text-lg font-semibold text-gray-900">{newCompetency?.actual_level ?? 0}/10</div>
                                        </div>
                                        <div className="flex-1">
                                          <div className="text-xs text-gray-500 mb-1">Progress</div>
                                          <div className="w-full h-2 bg-gray-200 rounded">
                                            <div
                                              className="h-2 rounded bg-gradient-to-r from-green-600 to-emerald-600"
                                              style={{ width: `${Math.min(((newCompetency?.actual_level ?? 0) / Math.max(newCompetency?.required_level ?? 1, 1)) * 100, 100)}%` }}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex justify-end">
                                    <Button
                                      onClick={async () => {
                                        if (!selectedEvaluationForPanel || !newCompetency || !newCompetency.name) { toast.error('Provide name'); return; }
                                        try {
                                          const payload = {
                                            evaluation_id: selectedEvaluationForPanel.evaluation_id,
                                            employee_id: profileData.employee_id,
                                            name: newCompetency.name,
                                            category: newCompetency.category,
                                            required_level: newCompetency.required_level,
                                            actual_level: newCompetency.actual_level,
                                            weight: 0,
                                            description: newCompetency.description,
                                          };
                                          const created = await createCompetencyMutation.mutateAsync(payload as any);
                                          setCompetencies(prev => [created, ...prev]);
                                          setNewCompetency({ name: '', category: 'Core', required_level: 5, actual_level: 0, description: '' });
                                          toast.success('Competency added');
                                        } catch (err: any) {
                                          toast.error(err?.message || 'Failed to add competency');
                                        }
                                      }}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add Competency
                                    </Button>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </CardContent>
                      </Card>
                    )}
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
                                      {!isSelfEvalMode && (
                                        <div className="text-sm">
                                          <span className="text-gray-500">Weight:</span>
                                          <span className="font-medium ml-1">{competency.weight}%</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-lg font-bold text-green-600">{score.toFixed(1)}%</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {competency.actual_level >= competency.required_level ? 'Meets Requirement' : 'Below Requirement'}
                                    </div>
                                    {canSelfCrud && (
                                      <div className="flex items-center gap-2 justify-end mt-2">
                                        {editingCompetencyId === competency.competence_id ? (
                                          <Button
                                            onClick={async () => {
                                              try {
                                                const data = competencyFieldEdits[competency.competence_id] || {};
                                                const updated = await updateCompetencyMutation.mutateAsync({ competencyId: competency.competence_id, competencyData: data });
                                                setCompetencies(prev => prev.map(c => c.competence_id === competency.competence_id ? { ...c, ...updated } : c));
                                                setEditingCompetencyId(null);
                                                setCompetencyFieldEdits(prev => ({ ...prev, [competency.competence_id]: {} }));
                                                toast.success('Competency updated');
                                              } catch (err: any) {
                                                toast.error(err?.message || 'Failed to update competency');
                                              }
                                            }}
                                            className="bg-green-600 hover:bg-green-700"
                                          >
                                            <Save className="h-4 w-4 mr-2" />
                                            Save
                                          </Button>
                                        ) : (
                                          <Button onClick={() => setEditingCompetencyId(competency.competence_id)} variant="outline">
                                            <Edit3 className="h-4 w-4 mr-2" />
                                            Edit
                                          </Button>
                                        )}
                                        <Button
                                          variant="outline"
                                          onClick={async () => {
                                            try {
                                              await deleteCompetencyMutation.mutateAsync({ competencyId: competency.competence_id, evaluationId: selectedEvaluationForPanel?.evaluation_id || '' });
                                              setCompetencies(prev => prev.filter(c => c.competence_id !== competency.competence_id));
                                              toast.success('Competency deleted');
                                            } catch (err: any) {
                                              toast.error(err?.message || 'Failed to delete competency');
                                            }
                                          }}
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {canSelfCrud && editingCompetencyId === competency.competence_id && (
                                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                      <Label>Name</Label>
                                      <Input defaultValue={competency.name} onChange={(e) => setCompetencyFieldEdits(prev => ({ ...prev, [competency.competence_id]: { ...prev[competency.competence_id], name: e.target.value } }))} />
                                    </div>
                                    <div className="space-y-1">
                                      <Label>Category</Label>
                                      <Select value={(competency.category as any) ?? 'Core'} onValueChange={(v) => setCompetencyFieldEdits(prev => ({ ...prev, [competency.competence_id]: { ...prev[competency.competence_id], category: v } }))}>
                                        <SelectTrigger className="w-40">
                                          <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Core">Core</SelectItem>
                                          <SelectItem value="Leadership">Leadership</SelectItem>
                                          <SelectItem value="Functional">Functional</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-1">
                                      <Label>Required</Label>
                                      <Input type="number" min={0} max={10} defaultValue={competency.required_level} onChange={(e) => setCompetencyFieldEdits(prev => ({ ...prev, [competency.competence_id]: { ...prev[competency.competence_id], required_level: Math.min(parseFloat(e.target.value) || 0, 10) } }))} />
                                    </div>
                                    <div className="space-y-1">
                                      <Label>Actual</Label>
                                      <Input type="number" min={0} max={10} defaultValue={competency.actual_level} onChange={(e) => setCompetencyFieldEdits(prev => ({ ...prev, [competency.competence_id]: { ...prev[competency.competence_id], actual_level: Math.min(parseFloat(e.target.value) || 0, 10) } }))} />
                                    </div>
                                    
                                    <div className="md:col-span-3 space-y-1">
                                      <Label>Description</Label>
                                      <Textarea rows={2} defaultValue={competency.description} onChange={(e) => setCompetencyFieldEdits(prev => ({ ...prev, [competency.competence_id]: { ...prev[competency.competence_id], description: e.target.value } }))} />
                                    </div>
                                  </div>
                                )}
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
