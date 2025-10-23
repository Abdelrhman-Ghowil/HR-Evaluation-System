
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SmartEvaluationButton } from '@/components/ui/SmartEvaluationButton';
import { SmartEvaluationModal } from '@/components/ui/SmartEvaluationModal';
import { ArrowLeft, Award, Target, Users, Plus, Edit, Trash2, Save, X, BarChart3, TrendingUp } from 'lucide-react';
import { ApiObjective, ApiCompetency } from '../../types/api';
import { apiService } from '../../services/api';
import { useObjectives, useCreateObjective, useUpdateObjective, useDeleteObjective, useCompetencies, useCreateCompetency, useUpdateCompetency, useDeleteCompetency } from '../../hooks/useApi';

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  hire_date: string;
  status: 'Active' | 'Inactive';
}

interface Evaluation {
  id: string;
  employee_id: string;
  type: string;
  period: string;
  status: 'Draft' | 'Pending HoD Approval' | 'Pending HR Approval' | 'Employee Review' | 'Approved' | 'Rejected' | 'Completed';
  reviewer_id?: number;
  date: string;
  score?: number;
}

interface Objective {
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

interface Competency {
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

interface EvaluationDetailsProps {
  employee: Employee;
  evaluation: Evaluation;
  onBack: () => void;
}

const EvaluationDetails: React.FC<EvaluationDetailsProps> = ({ employee, evaluation, onBack }) => {
  // Objectives API hooks
  const { data: objectivesData, isLoading: objectivesLoading, error: objectivesError, refetch: refetchObjectives } = useObjectives(evaluation.id);
  const createObjectiveMutation = useCreateObjective();
  const updateObjectiveMutation = useUpdateObjective();
  const deleteObjectiveMutation = useDeleteObjective();

  // Convert API objectives to component objectives (temporarily remove filtering to debug)
  const objectives: Objective[] = objectivesData?.map((apiObj: ApiObjective) => ({
    id: apiObj.objective_id,
    employee_id: apiObj.employee_id, // Keep as string
    evaluation_id: evaluation.id,
    title: apiObj.title,
    description: apiObj.description,
    target: apiObj.target,
    achieved: apiObj.achieved,
    weight: apiObj.weight,
    status: apiObj.status as 'Completed' | 'In-progress' | 'Not started'
  })) || [];

  // Competencies API hooks
  const { data: competenciesData, isLoading: competenciesLoading, error: competenciesError } = useCompetencies(evaluation.id);
  const createCompetencyMutation = useCreateCompetency();
  const updateCompetencyMutation = useUpdateCompetency();
  const deleteCompetencyMutation = useDeleteCompetency();

  // Convert API competencies to component competencies and filter by evaluation_id
  const competencies: Competency[] = competenciesData?.filter((apiComp: ApiCompetency) => {
    // Include competencies that either have the correct evaluation_id or no evaluation_id (which means they belong to this evaluation)
    return apiComp.evaluation_id === evaluation.id || !apiComp.evaluation_id;
  }).map((apiComp: ApiCompetency) => ({
    id: apiComp.competence_id,
    employee_id: apiComp.employee_id,
    evaluation_id: apiComp.evaluation_id || evaluation.id,
    name: apiComp.name,
    category: apiComp.category as 'Core' | 'Leadership' | 'Functional',
    required_level: apiComp.required_level,
    actual_level: apiComp.actual_level,
    weight: apiComp.weight,
    description: apiComp.description
  })) || [];

  // Modal states
  const [isObjectiveModalOpen, setIsObjectiveModalOpen] = useState(false);
  const [isCompetencyModalOpen, setIsCompetencyModalOpen] = useState(false);
  const [isSmartEvaluationModalOpen, setIsSmartEvaluationModalOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null);
  const [editingCompetency, setEditingCompetency] = useState<Competency | null>(null);

  // Form states
  const [objectiveForm, setObjectiveForm] = useState<Partial<Objective>>({});
  const [competencyForm, setCompetencyForm] = useState<Partial<Competency>>({});

  // Error states
  const [objectiveErrors, setObjectiveErrors] = useState<Record<string, string>>({});
  const [competencyErrors, setCompetencyErrors] = useState<Record<string, string>>({});

  // Validation functions
  const validateObjective = (obj: Partial<Objective>): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!obj.title?.trim()) errors.title = 'Title is required';
    if (!obj.description?.trim()) errors.description = 'Description is required';
    if (!obj.target || obj.target < 1 || obj.target > 10) errors.target = 'Target must be between 1-10';
    if (!obj.achieved || obj.achieved < 1 || obj.achieved > 10) errors.achieved = 'Achieved must be between 1-10';
    return errors;
  };

  const validateCompetency = (comp: Partial<Competency>): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!comp.name?.trim()) errors.name = 'Name is required';
    if (!comp.description?.trim()) errors.description = 'Description is required';
    if (!comp.required_level || comp.required_level < 1 || comp.required_level > 10) errors.required_level = 'Required level must be between 1-10';
    if (!comp.actual_level || comp.actual_level < 1 || comp.actual_level > 10) errors.actual_level = 'Actual level must be between 1-10';
    return errors;
  };

  // Handlers for objectives
  const handleAddObjective = () => {
    setEditingObjective(null);
    setObjectiveForm({
      employee_id: employee.id,
      evaluation_id: evaluation.id,
      title: '',
      description: '',
      target: 10,
      achieved: 1,
      status: 'Not started'
    });
    setObjectiveErrors({});
    setIsObjectiveModalOpen(true);
  };

  const handleEditObjective = (objective: Objective) => {
    setEditingObjective(objective);
    setObjectiveForm(objective);
    setObjectiveErrors({});
    setIsObjectiveModalOpen(true);
  };

  const handleSaveObjective = async () => {
    const errors = validateObjective(objectiveForm);
    if (Object.keys(errors).length > 0) {
      setObjectiveErrors(errors);
      return;
    }

    try {
       if (editingObjective) {
         // Update existing objective using evaluation_id endpoint
         const updateData = {
           title: objectiveForm.title!,
           description: objectiveForm.description!,
           target: objectiveForm.target!,
           achieved: objectiveForm.achieved!,
           status: objectiveForm.status!
         };
         await updateObjectiveMutation.mutateAsync({
           objectiveId: editingObjective.id,
           evaluationId: evaluation.id,
           objectiveData: updateData
         });
         // Explicitly refetch objectives to ensure UI updates immediately
         await refetchObjectives();
       } else {
         // Create new objective
         const createData = {
           evaluation_id: evaluation.id,
           title: objectiveForm.title!,
           description: objectiveForm.description!,
           target: objectiveForm.target!,
           achieved: objectiveForm.achieved!,
           status: objectiveForm.status!,
           weight: objectiveForm.weight!
         };
         await createObjectiveMutation.mutateAsync(createData);
         // Explicitly refetch objectives to ensure UI updates immediately
         await refetchObjectives();
       }

      setIsObjectiveModalOpen(false);
      setObjectiveForm({});
      setObjectiveErrors({});
    } catch (err) {
      console.error('Error saving objective:', err);
      setObjectiveErrors({ general: 'Failed to save objective. Please try again.' });
    }
  };

  const handleDeleteObjective = async (id: string) => {
     try {
       await deleteObjectiveMutation.mutateAsync({
        objectiveId: id,
        evaluationId: evaluation.id
       });
     } catch (err) {
       console.error('Error deleting objective:', err);
       // Error handling is managed by the React Query hook
     }
   };

  // Handlers for competencies
  const handleAddCompetency = () => {
    setEditingCompetency(null);
    setCompetencyForm({
      employee_id: employee.id,
      evaluation_id: evaluation.id,
      name: '',
      category: 'Core',
      required_level: 10,
      actual_level: 1,
      description: ''
    });
    setCompetencyErrors({});
    setIsCompetencyModalOpen(true);
  };

  const handleEditCompetency = (competency: Competency) => {
    setEditingCompetency(competency);
    setCompetencyForm(competency);
    setCompetencyErrors({});
    setIsCompetencyModalOpen(true);
  };

  const handleSaveCompetency = async () => {
    const errors = validateCompetency(competencyForm);
    if (Object.keys(errors).length > 0) {
      setCompetencyErrors(errors);
      return;
    }

    try {
      if (editingCompetency) {
        // Update existing competency
        await updateCompetencyMutation.mutateAsync({
          competencyId: editingCompetency.id,
          competencyData: {
            name: competencyForm.name!,
            category: competencyForm.category!,
            required_level: competencyForm.required_level!,
            actual_level: competencyForm.actual_level!,
            description: competencyForm.description!
          }
        });
      } else {
        // Create new competency
        await createCompetencyMutation.mutateAsync({
          employee_id: employee.id,
          evaluation_id: evaluation.id,
          name: competencyForm.name!,
          category: competencyForm.category!,
          required_level: competencyForm.required_level!,
          actual_level: competencyForm.actual_level!,
          description: competencyForm.description!
        });
      }

      setIsCompetencyModalOpen(false);
      setCompetencyForm({});
      setCompetencyErrors({});
    } catch (err) {
      console.error('Error saving competency:', err);
      setCompetencyErrors({ general: 'Failed to save competency. Please try again.' });
    }
  };

  const handleDeleteCompetency = async (id: string) => {
    try {
      await deleteCompetencyMutation.mutateAsync({
        competencyId: id,
        evaluationId: evaluation.id
      });
    } catch (err) {
      console.error('Error deleting competency:', err);
    }
  };



  // Smart Evaluation handlers
  const handleSmartEvaluationSelect = (option: 'upload-excel' | 'saved-template' | 'ai-prombot') => {
    // Handle the selected option
    console.log('Selected option:', option);
    // TODO: Implement specific logic for each option
    switch (option) {
      case 'upload-excel':
        // Handle Excel upload
        break;
      case 'saved-template':
        // Handle saved template
        break;
      case 'ai-prombot':
        // Handle AI prombot
        break;
    }
  };

  // Score calculation functions
  const getObjectiveScore = (objective: Objective): number => {
    return (objective.achieved / objective.target) * 100;
  };

  const getCompetencyScore = (competency: Competency): number => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="w-fit bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Evaluation Details
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {employee.name} • {evaluation.type} • {evaluation.period}
            </p>
          </div>
          <SmartEvaluationButton 
            onClick={() => setIsSmartEvaluationModalOpen(true)}
            className="w-full sm:w-auto"
          />
        </div>

        {/* Evaluation Summary */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl shadow-blue-100/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <Award className="h-5 w-5 text-white" />
              </div>
              Evaluation Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {/* Overall Score */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 lg:p-6 text-center border border-blue-100">
                <div className="flex items-center justify-center mb-2">
                  <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
                </div>
                <div className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {evaluation.score || 'N/A'}
                </div>
                <div className="text-xs lg:text-sm text-gray-600 font-medium">Overall Score</div>
              </div>
              
              {/* Objectives Score */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 lg:p-6 text-center border border-green-100">
                <div className="flex items-center justify-center mb-2">
                  <Target className="h-5 w-5 text-green-600 mr-2" />
                </div>
                <div className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {getOverallObjectiveScore()}
                </div>
                <div className="text-xs lg:text-sm text-gray-600 font-medium">Objectives</div>
              </div>
              
              {/* Competencies Score */}
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 lg:p-6 text-center border border-purple-100">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-5 w-5 text-purple-600 mr-2" />
                </div>
                <div className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                  {getOverallCompetencyScore()}
                </div>
                <div className="text-xs lg:text-sm text-gray-600 font-medium">Competencies</div>
              </div>
              
              {/* Status */}
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 lg:p-6 text-center border border-gray-100">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="h-5 w-5 text-gray-600 mr-2" />
                </div>
                <Badge 
                  variant={evaluation.status === 'Completed' || evaluation.status === 'Approved' ? 'default' : 'secondary'}
                  className={`text-xs lg:text-sm px-3 py-1.5 font-medium ${
                    evaluation.status === 'Draft' ? 'bg-gray-100 text-gray-800 border-gray-200' :
                    evaluation.status === 'Pending HoD Approval' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                    evaluation.status === 'Pending HR Approval' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                    evaluation.status === 'Employee Review' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                    evaluation.status === 'Approved' ? 'bg-green-100 text-green-800 border-green-200' :
                    evaluation.status === 'Rejected' ? 'bg-red-100 text-red-800 border-red-200' :
                    evaluation.status === 'Completed' ? 'bg-purple-100 text-purple-800 border-purple-200' : ''
                  }`}
                >
                  {evaluation.status}
                </Badge>
                <div className="text-xs lg:text-sm text-gray-600 font-medium mt-2">Status</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Objectives and Competencies */}
        <Tabs defaultValue="objectives" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg">
            <TabsTrigger 
              value="objectives" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white transition-all duration-200"
            >
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Objectives</span>
              <span className="sm:hidden">Obj.</span>
              <Badge variant="secondary" className="ml-1 bg-white/20 text-current border-0">
                {objectives.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="competencies" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-600 data-[state=active]:text-white transition-all duration-200"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Competencies</span>
              <span className="sm:hidden">Comp.</span>
              <Badge variant="secondary" className="ml-1 bg-white/20 text-current border-0">
                {competencies.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Objectives Tab */}
          <TabsContent value="objectives" className="space-y-4 sm:space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl shadow-green-100/50">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                        <Target className="h-5 w-5 text-white" />
                      </div>
                      Objectives & Goals
                    </CardTitle>
                    <p className="text-gray-600 mt-1">Performance objectives and achievements</p>
                  </div>
                  <Button 
                    onClick={handleAddObjective} 
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Objective
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 sm:space-y-6">
                  {objectivesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-500">Loading objectives...</p>
                    </div>
                  ) : objectivesError ? (
                    <div className="text-center py-8 text-red-500">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">Error loading objectives</p>
                      <p className="text-sm text-gray-500 mt-1">{objectivesError?.message || 'An error occurred'}</p>
                    </div>
                  ) : objectives.length > 0 ? (
                    objectives.map((objective) => {
                      const score = getObjectiveScore(objective);
                      return (
                        <div key={objective.id} className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-200 group">
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 text-lg mb-2 truncate">{objective.title}</h4>
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{objective.description}</p>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={`font-medium ${
                                    objective.status === 'Completed' ? 'bg-green-100 text-green-800 border-green-200' :
                                    objective.status === 'In-progress' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                    'bg-gray-100 text-gray-800 border-gray-200'
                                  }`}
                                >
                                  {objective.status}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 lg:flex-col lg:items-end">
                              <div className="text-center lg:text-right">
                                <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                  {score.toFixed(1)}
                                </div>
                                <div className="text-xs text-gray-500 font-medium">Score</div>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditObjective(objective)}
                                  className="hover:bg-blue-50 hover:border-blue-200 transition-colors"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteObjective(objective.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                            <div className="bg-blue-50 rounded-lg p-3">
                              <p className="text-xs font-medium text-blue-700 mb-1">Target</p>
                              <p className="text-lg font-bold text-blue-900">{objective.target}<span className="text-sm text-blue-600">/10</span></p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3">
                              <p className="text-xs font-medium text-green-700 mb-1">Achieved</p>
                              <p className="text-lg font-bold text-green-900">{objective.achieved}<span className="text-sm text-green-600">/10</span></p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No objectives found for this evaluation</p>
                      <p className="text-sm">Click "Add Objective" to get started</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Competencies Tab */}
          <TabsContent value="competencies" className="space-y-4 sm:space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl shadow-purple-100/50">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      Competency Assessment
                    </CardTitle>
                    <p className="text-gray-600 mt-1">Required vs Actual competency levels</p>
                  </div>
                  <Button 
                    onClick={handleAddCompetency} 
                    className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Competency
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {competenciesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading competencies...</p>
                  </div>
                ) : competenciesError ? (
                  <div className="text-center py-8 text-red-500">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Error loading competencies</p>
                    <p className="text-sm text-gray-500 mt-1">Please try refreshing the page</p>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    {competencies.map((competency) => {
                    const score = getCompetencyScore(competency);
                    return (
                      <div key={competency.id} className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-200 group">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-lg mb-2 truncate">{competency.name}</h4>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{competency.description}</p>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`font-medium ${
                                  competency.category === 'Core' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                  competency.category === 'Leadership' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                  'bg-orange-100 text-orange-800 border-orange-200'
                                }`}
                              >
                                {competency.category}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 lg:flex-col lg:items-end">
                            <div className="text-center lg:text-right">
                              <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                                {score.toFixed(1)}
                              </div>
                              <div className="text-xs text-gray-500 font-medium">Score</div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditCompetency(competency)}
                                className="hover:bg-blue-50 hover:border-blue-200 transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCompetency(competency.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                          <div className="bg-amber-50 rounded-lg p-3">
                            <p className="text-xs font-medium text-amber-700 mb-1">Required Level</p>
                            <p className="text-lg font-bold text-amber-900">{competency.required_level}<span className="text-sm text-amber-600">/10</span></p>
                          </div>
                          <div className="bg-emerald-50 rounded-lg p-3">
                            <p className="text-xs font-medium text-emerald-700 mb-1">Actual Level</p>
                            <p className="text-lg font-bold text-emerald-900">{competency.actual_level}<span className="text-sm text-emerald-600">/10</span></p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                
                    {competencies.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No competencies added yet</p>
                        <p className="text-sm">Click "Add Competency" to get started</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Objective Modal */}
        <Dialog open={isObjectiveModalOpen} onOpenChange={setIsObjectiveModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
            <DialogHeader className="pb-6 border-b border-gray-100">
              <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
                {editingObjective ? 'Edit Objective' : 'Add New Objective'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  Title
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={objectiveForm.title || ''}
                  onChange={(e) => setObjectiveForm(prev => ({ ...prev, title: e.target.value }))}
                  className={`transition-all duration-200 ${objectiveErrors.title ? 'border-red-500 focus:ring-red-500' : 'focus:ring-green-500 focus:border-green-500'}`}
                  placeholder="Enter objective title"
                />
                {objectiveErrors.title && (
                  <p className="text-sm text-red-600 flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {objectiveErrors.title}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  Description
                  <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={objectiveForm.description || ''}
                  onChange={(e) => setObjectiveForm(prev => ({ ...prev, description: e.target.value }))}
                  className={`transition-all duration-200 resize-none ${objectiveErrors.description ? 'border-red-500 focus:ring-red-500' : 'focus:ring-green-500 focus:border-green-500'}`}
                  rows={3}
                  placeholder="Describe the objective in detail"
                />
                {objectiveErrors.description && (
                  <p className="text-sm text-red-600 flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {objectiveErrors.description}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    Target (1-10)
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="target"
                    type="number"
                    min="1"
                    max="10"
                    value={objectiveForm.target || 1}
                    onChange={(e) => setObjectiveForm(prev => ({ ...prev, target: parseInt(e.target.value) || 1 }))}
                    className={`transition-all duration-200 ${objectiveErrors.target ? 'border-red-500 focus:ring-red-500' : 'focus:ring-green-500 focus:border-green-500'}`}
                  />
                  {objectiveErrors.target && (
                    <p className="text-sm text-red-600 flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      {objectiveErrors.target}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="achieved" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    Achieved (1-10)
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="achieved"
                    type="number"
                    min="1"
                    max="10"
                    value={objectiveForm.achieved || 1}
                    onChange={(e) => setObjectiveForm(prev => ({ ...prev, achieved: parseInt(e.target.value) || 1 }))}
                    className={`transition-all duration-200 ${objectiveErrors.achieved ? 'border-red-500 focus:ring-red-500' : 'focus:ring-green-500 focus:border-green-500'}`}
                  />
                  {objectiveErrors.achieved && (
                    <p className="text-sm text-red-600 flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      {objectiveErrors.achieved}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  Status
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={objectiveForm.status || 'Not started'}
                  onValueChange={(value) => setObjectiveForm(prev => ({ ...prev, status: value as 'Completed' | 'In-progress' | 'Not started' }))}
                >
                  <SelectTrigger className="transition-all duration-200 focus:ring-green-500 focus:border-green-500">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not started">Not Started</SelectItem>
                    <SelectItem value="In-progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter className="pt-6 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  onClick={() => setIsObjectiveModalOpen(false)}
                  className="w-full sm:w-auto hover:bg-gray-50 transition-all duration-200"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveObjective}
                  className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingObjective ? 'Update' : 'Create'} Objective
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Competency Modal */}
        <Dialog open={isCompetencyModalOpen} onOpenChange={setIsCompetencyModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
            <DialogHeader className="pb-6 border-b border-gray-100">
              <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg shadow-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                {editingCompetency ? 'Edit Competency' : 'Add New Competency'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  Name
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={competencyForm.name || ''}
                  onChange={(e) => setCompetencyForm(prev => ({ ...prev, name: e.target.value }))}
                  className={`transition-all duration-200 ${competencyErrors.name ? 'border-red-500 focus:ring-red-500' : 'focus:ring-purple-500 focus:border-purple-500'}`}
                  placeholder="Enter competency name"
                />
                {competencyErrors.name && (
                  <p className="text-sm text-red-600 flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {competencyErrors.name}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  Category
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={competencyForm.category || 'Core'}
                  onValueChange={(value) => setCompetencyForm(prev => ({ ...prev, category: value as 'Core' | 'Leadership' | 'Functional' }))}
                >
                  <SelectTrigger className="transition-all duration-200 focus:ring-purple-500 focus:border-purple-500">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Core">Core</SelectItem>
                    <SelectItem value="Leadership">Leadership</SelectItem>
                    <SelectItem value="Functional">Functional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="required_level" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    Required Level (1-10)
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="required_level"
                    type="number"
                    min="1"
                    max="10"
                    value={competencyForm.required_level || 1}
                    onChange={(e) => setCompetencyForm(prev => ({ ...prev, required_level: parseInt(e.target.value) || 1 }))}
                    className={`transition-all duration-200 ${competencyErrors.required_level ? 'border-red-500 focus:ring-red-500' : 'focus:ring-purple-500 focus:border-purple-500'}`}
                  />
                  {competencyErrors.required_level && (
                    <p className="text-sm text-red-600 flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      {competencyErrors.required_level}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="actual_level" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    Actual Level (1-10)
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="actual_level"
                    type="number"
                    min="1"
                    max="10"
                    value={competencyForm.actual_level || 1}
                    onChange={(e) => setCompetencyForm(prev => ({ ...prev, actual_level: parseInt(e.target.value) || 1 }))}
                    className={`transition-all duration-200 ${competencyErrors.actual_level ? 'border-red-500 focus:ring-red-500' : 'focus:ring-purple-500 focus:border-purple-500'}`}
                  />
                  {competencyErrors.actual_level && (
                    <p className="text-sm text-red-600 flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      {competencyErrors.actual_level}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="comp_description" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  Description
                  <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="comp_description"
                  value={competencyForm.description || ''}
                  onChange={(e) => setCompetencyForm(prev => ({ ...prev, description: e.target.value }))}
                  className={`transition-all duration-200 resize-none ${competencyErrors.description ? 'border-red-500 focus:ring-red-500' : 'focus:ring-purple-500 focus:border-purple-500'}`}
                  rows={3}
                  placeholder="Describe the competency requirements"
                />
                {competencyErrors.description && (
                  <p className="text-sm text-red-600 flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {competencyErrors.description}
                  </p>
                )}
              </div>
            </div>
            
            <DialogFooter className="pt-6 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCompetencyModalOpen(false)}
                  className="w-full sm:w-auto hover:bg-gray-50 transition-all duration-200"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveCompetency}
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingCompetency ? 'Update' : 'Create'} Competency
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Smart Evaluation Modal */}
        <SmartEvaluationModal
          isOpen={isSmartEvaluationModalOpen}
          onClose={() => setIsSmartEvaluationModalOpen(false)}
          onSelect={handleSmartEvaluationSelect}
        />
      </div>
    </div>
  );
};

export default EvaluationDetails;