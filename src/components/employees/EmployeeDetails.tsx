import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, Calendar, User, BarChart3, FileText, Target, Plus, Edit, Trash2, 
  Loader2, Mail, Phone, MapPin, Building2, Users, Briefcase, Hash, Clock,
  ChevronRight, ChevronDown, AlertTriangle, CheckCircle2, TrendingUp, Shield, Star
} from 'lucide-react';
import EvaluationDetails from './EvaluationDetails';
import { EmployeeInput, EvaluationInput } from '../../types/shared';
import { useEvaluations, useCreateEvaluation, useUpdateEvaluation, useDeleteEvaluation, useUsers, useSelfEvaluations } from '../../hooks/useApi';
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

interface NewEvaluation {
  type: 'Quarterly' | 'Annual' | 'Optional';
  year: number;
  quarter?: number;
  reviewer_id?: string;
  status: 'Draft';
}

interface Reviewer {
  reviewer_id: string;
  name: string;
  role: 'LM' | 'HOD' | 'HR';
}

interface EmployeeDetailsProps {
  employee: EmployeeInput;
  onBack: () => void;
}

// ─── Reusable Sub-Components ───────────────────────────────────────────────

const InfoItem = ({ icon: Icon, label, value, href, color = 'gray' }: { 
  icon: any; label: string; value: string; href?: string; color?: string 
}) => (
  <div className="flex items-start gap-3 py-3">
    <div className={`mt-0.5 p-2 rounded-lg bg-${color}-50 shrink-0`}>
      <Icon className={`h-4 w-4 text-${color}-500`} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer"
          className={`text-sm font-medium text-${color}-600 hover:text-${color}-800 hover:underline transition-colors truncate block`}>
          {value}
        </a>
      ) : (
        <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
      )}
    </div>
  </div>
);

const EvaluationCard = ({ evaluation, onSelect, onEdit, onDelete, isDeleting }: {
  evaluation: EvaluationInput;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) => {
  const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
    'Completed': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    'Approved': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    'Pending HoD Approval': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    'Pending HR Approval': { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500' },
    'Employee Review': { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500' },
    'Draft': { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' },
    'Rejected': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    'Self Evaluation': { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  };
  const status = statusConfig[evaluation.status] || statusConfig['Draft'];

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-emerald-600';
    if (score >= 3) return 'text-blue-600';
    if (score >= 2) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="group relative bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${status.dot} rounded-l-xl`} />
      <div className="flex items-center p-4 pl-5">
        <div className="flex items-center gap-4 flex-1 cursor-pointer min-w-0" onClick={onSelect}>
          <div className="shrink-0 p-2.5 rounded-xl bg-gray-50 group-hover:bg-blue-50 transition-colors">
            {evaluation.type === 'Annual' ? (
              <Star className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
            ) : evaluation.type === 'Quarterly' ? (
              <BarChart3 className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
            ) : (
              <Target className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-gray-900 truncate">{evaluation.type}</h4>
              <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-blue-400 transition-colors shrink-0" />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{evaluation.period}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {evaluation.status}
          </span>
          {evaluation.score != null && evaluation.score > 0 && (
            <div className="text-center min-w-[48px]">
              <p className={`text-lg font-bold ${getScoreColor(evaluation.score)} leading-none`}>
                {typeof evaluation.score === 'number' ? evaluation.score.toFixed(1) : evaluation.score}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">Score</p>
            </div>
          )}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
              disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────

const EmployeeDetails = ({ employee, onBack }: EmployeeDetailsProps) => {
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationInput | null>(null);
  const [isEditEvaluationOpen, setIsEditEvaluationOpen] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<EvaluationInput | null>(null);
  const [newEvaluation, setNewEvaluation] = useState<NewEvaluation>({
    type: 'Annual',
    year: new Date().getFullYear(),
    status: 'Draft'
  });
  const [isCreatingEvaluation, setIsCreatingEvaluation] = useState(false);
  const [isUpdatingEvaluation, setIsUpdatingEvaluation] = useState(false);
  const [warningsExpanded, setWarningsExpanded] = useState(false);
  const [personalExpanded, setPersonalExpanded] = useState(false);
  const [workExpanded, setWorkExpanded] = useState(false);

  const { data: evaluationsData, isLoading: evaluationsLoading, error: evaluationsError } = useEvaluations({
    employee_id: employee.id
  });
  const { data: selfEvaluationsData, isLoading: selfEvaluationsLoading, error: selfEvaluationsError } = useSelfEvaluations(employee.id);
  const createEvaluationMutation = useCreateEvaluation();
  const deleteEvaluationMutation = useDeleteEvaluation();
  const [deletingEvaluationId, setDeletingEvaluationId] = useState<string | null>(null);
  const { data: usersData, isLoading: usersLoading, error: usersError } = useUsers();
  const employeeCompanyId = employee.company_id;
  const { data: managers = [], isLoading: managersLoading, error: managersError } = useManagers(employeeCompanyId);

  // ── Data Transforms ──────────────────────────────────────────────────────

  const transformApiEvaluation = (apiEval: ApiEvaluation): EvaluationInput => {
    const evaluationId = apiEval.id || apiEval.evaluation_id;
    let score: number | undefined;
    if (apiEval.score !== undefined) {
      score = typeof apiEval.score === 'string' ? parseFloat(apiEval.score) : apiEval.score;
    }
    const reviewer_id = apiEval.reviewer_id;
    let objectives_score: number | undefined;
    let competencies_score: number | undefined;
    const objScoreRaw = (apiEval as any).objectives_score;
    const compScoreRaw = (apiEval as any).competencies_score;
    if (objScoreRaw !== undefined) {
      objectives_score = typeof objScoreRaw === 'string' ? parseFloat(objScoreRaw) : objScoreRaw;
    }
    if (compScoreRaw !== undefined) {
      competencies_score = typeof compScoreRaw === 'string' ? parseFloat(compScoreRaw) : compScoreRaw;
    }
    return {
      id: evaluationId,
      evaluation_id: evaluationId,
      type: apiEval.type,
      period: apiEval.period,
      status: apiEval.status,
      score,
      objectives_score,
      competencies_score,
      reviewer: apiEval.reviewer || 'Unknown',
      reviewer_id: reviewer_id?.toString(),
      date: new Date(apiEval.created_at).toISOString().split('T')[0]
    };
  };

  const evaluationList = useMemo(() => {
    let dataToTransform: any[] = [];
    if (evaluationsData?.results && Array.isArray(evaluationsData.results)) {
      dataToTransform = evaluationsData.results;
    } else if (Array.isArray(evaluationsData)) {
      dataToTransform = evaluationsData;
    } else if (evaluationsData && typeof evaluationsData === 'object') {
      if (evaluationsData.data && Array.isArray(evaluationsData.data)) {
        dataToTransform = evaluationsData.data;
      }
    }
    if (!dataToTransform || dataToTransform.length === 0) return [];
    try {
      return dataToTransform.map(transformApiEvaluation);
    } catch (error) {
      console.error('Error transforming evaluations:', error);
      return [];
    }
  }, [evaluationsData]);

  const selfEvaluationList = useMemo(() => {
    let dataToTransform: any[] = [];
    if (selfEvaluationsData && Array.isArray(selfEvaluationsData)) {
      dataToTransform = selfEvaluationsData;
    } else if (selfEvaluationsData && typeof selfEvaluationsData === 'object') {
      if ((selfEvaluationsData as any).results && Array.isArray((selfEvaluationsData as any).results)) {
        dataToTransform = (selfEvaluationsData as any).results;
      } else if ((selfEvaluationsData as any).data && Array.isArray((selfEvaluationsData as any).data)) {
        dataToTransform = (selfEvaluationsData as any).data;
      }
    }
    if (!dataToTransform || dataToTransform.length === 0) return [];
    try {
      return dataToTransform.map(transformApiEvaluation);
    } catch {
      return [];
    }
  }, [selfEvaluationsData]);

  const isEditingSelfEvaluation = useMemo(() => {
    if (!editingEvaluation) return false;
    return (
      selfEvaluationList.some(e => e.id === editingEvaluation.id) ||
      editingEvaluation.type === 'Self Evaluation' ||
      editingEvaluation.status === 'Self Evaluation'
    );
  }, [editingEvaluation, selfEvaluationList]);

  const reviewers: Reviewer[] = useMemo(() => {
    if (!usersData) return [];
    let usersArray: any[] = [];
    if (usersData.results && Array.isArray(usersData.results)) {
      usersArray = usersData.results;
    } else if (Array.isArray(usersData)) {
      usersArray = usersData;
    } else {
      return [];
    }
    return usersArray
      .filter(user => user && user.user_id)
      .map(user => ({
        id: user.user_id.toString(),
        name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Unknown User',
        role: user.role === 'HR' ? 'HR' : user.role === 'HOD' ? 'HOD' : 'LM'
      }));
  }, [usersData, usersLoading, usersError]);

  // ── Year & Period Helpers ────────────────────────────────────────────────

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);
  const quarterOptions = Array.from({ length: 6 }, (_, i) => i + 1);
  const [ratingYear, setRatingYear] = useState<number>(currentYear);

  const getYearFromPeriod = (period: string) => {
    const m = period?.match(/^(\d{4})/);
    return m ? parseInt(m[1], 10) : null;
  };

  const yearEvaluations = useMemo(() => {
    return evaluationList.filter(e => getYearFromPeriod(e.period) === ratingYear);
  }, [evaluationList, ratingYear]);

  // ── CRUD Handlers ────────────────────────────────────────────────────────

  const generateEvaluationRecords = () => {
    const records: Partial<EvaluationInput>[] = [];
    const baseRecord = {
      reviewer: newEvaluation.reviewer_id
        ? managers.find(m => m.id === newEvaluation.reviewer_id)?.name || 'To be assigned'
        : 'To be assigned',
      date: new Date().toISOString().split('T')[0],
      status: 'Draft' as const,
      type: newEvaluation.type
    };

    if (newEvaluation.type === 'Quarterly') {
      for (let q = 1; q <= 4; q++) {
        records.push({ ...baseRecord, id: `${Date.now()}-Q${q}`, period: `${newEvaluation.year}-Q${q}`, type: 'Quarterly' });
      }
    } else if (newEvaluation.type === 'Annual') {
      records.push(
        { ...baseRecord, id: `${Date.now()}-Mid`, period: `${newEvaluation.year}-Mid`, type: 'Annual' },
        { ...baseRecord, id: `${Date.now()}-End`, period: `${newEvaluation.year}-End`, type: 'Annual' }
      );
    } else if (newEvaluation.type === 'Optional' && newEvaluation.quarter) {
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
    setIsCreatingEvaluation(true);
    try {
      for (const record of records) {
        await createEvaluationMutation.mutateAsync({
          employee_id: employee.id,
          type: record.type as 'Quarterly' | 'Annual' | 'Optional',
          status: 'Draft' as const,
          period: record.period,
          score: null,
          reviewer_id: null
        });
      }
    } catch (error) {
      console.error('Error creating evaluations:', error);
    } finally {
      setIsCreatingEvaluation(false);
    }
    setNewEvaluation({ type: 'Annual', year: new Date().getFullYear(), status: 'Draft' });
  };

  const handleEditEvaluation = (evaluation: EvaluationInput) => {
    setEditingEvaluation(evaluation);
    setIsEditEvaluationOpen(true);
  };

  const updateEvaluationMutation = useUpdateEvaluation();

  const handleUpdateEvaluation = async () => {
    if (!editingEvaluation) return;
    setIsUpdatingEvaluation(true);
    try {
      const updateData: { status?: Exclude<EvaluationInput['status'], 'Self Evaluation'>; reviewer_id?: string } = {
        reviewer_id: editingEvaluation.reviewer_id || undefined
      };
      if (editingEvaluation.status !== 'Self Evaluation') {
        updateData.status = editingEvaluation.status;
      }
      await updateEvaluationMutation.mutateAsync({
        evaluationId: editingEvaluation.id,
        evaluationData: updateData
      });
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
      setDeletingEvaluationId(evaluationId);
      await deleteEvaluationMutation.mutateAsync(evaluationId);
    } catch (error) {
      console.error('Error deleting evaluation:', error);
    } finally {
      setDeletingEvaluationId(null);
    }
  };

  // ── Validation ───────────────────────────────────────────────────────────

  const isFormValid = () => {
    if (newEvaluation.type === 'Optional' && !newEvaluation.quarter) return false;
    return true;
  };

  const getValidStatusTransitions = (currentStatus: string): string[] => {
    const transitions: Record<string, string[]> = {
      'Draft': ['Pending HoD Approval', 'Rejected'],
      'Pending HoD Approval': ['Pending HR Approval', 'Rejected', 'Draft'],
      'Pending HR Approval': ['Employee Review', 'Rejected', 'Pending HoD Approval'],
      'Employee Review': ['Approved', 'Rejected'],
      'Approved': ['Completed'],
      'Rejected': ['Draft'],
      'Completed': []
    };
    return transitions[currentStatus] || [];
  };

  const isValidStatusTransition = (fromStatus: string, toStatus: string): boolean => {
    if (fromStatus === toStatus) return true;
    return getValidStatusTransitions(fromStatus).includes(toStatus);
  };

  const isEditFormValid = (): boolean => {
    if (!editingEvaluation) return false;
    if (!editingEvaluation.type || !editingEvaluation.period) return false;
    const originalEvaluation = evaluationList.find(e => e.id === editingEvaluation.id);
    if (originalEvaluation) {
      return isValidStatusTransition(originalEvaluation.status, editingEvaluation.status);
    }
    return true;
  };

  // ── Evaluation Details View ──────────────────────────────────────────────

  if (selectedEvaluation) {
    const employeeResult = safeTransformData(employee, transformEmployeeForEvaluation, 'Failed to transform employee data');
    if (!employeeResult.success) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="p-4 bg-red-50 rounded-full mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Error Loading Employee Data</h3>
          <p className="text-sm text-gray-500 mb-6">{employeeResult.success === false ? employeeResult.error : ''}</p>
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Employees
          </Button>
        </div>
      );
    }

    const evaluationResult = safeTransformData(
      { evaluation: selectedEvaluation, employeeId: employeeResult.data.id },
      ({ evaluation, employeeId }) => transformEvaluationForDetails(evaluation, employeeId),
      'Failed to transform evaluation data'
    );
    if (!evaluationResult.success) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="p-4 bg-red-50 rounded-full mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Error Loading Evaluation Data</h3>
          <p className="text-sm text-gray-500 mb-6">{evaluationResult.success === false ? evaluationResult.error : ''}</p>
          <Button variant="outline" onClick={() => setSelectedEvaluation(null)}>
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

  // ── Computed Values ──────────────────────────────────────────────────────
  const warningsCount = employee.warningsCount || employee.warnings?.length || 0;
  const hasWarnings = warningsCount > 0;

  // ── Main Render ──────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">

      {/* ─── Top Navigation ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-gray-500 hover:text-gray-900 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </Button>
        <div className="h-4 w-px bg-gray-200" />
        <p className="text-sm text-gray-400">Employee Profile</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <div className="space-y-4">
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm shrink-0">
                <AvatarFallback className="bg-[#2563EB] text-white text-lg font-bold">
                  {employee.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-gray-900 truncate">{employee.name}</h1>
                <p className="text-sm text-gray-500 truncate">{employee.position}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-white border-gray-200 text-gray-600 font-mono text-xs gap-1">
                <Hash className="h-3 w-3" />{employee.employeeCode}
              </Badge>
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50">{employee.role}</Badge>
              <Badge className={`border ${
                employee.status === 'Active' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}>
                {employee.status}
              </Badge>
            </div>

            <div className="mt-4 border-t border-gray-100 pt-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Personal Details</h3>
                <button
                  onClick={() => setPersonalExpanded(!personalExpanded)}
                  className="sm:hidden flex items-center gap-1 text-xs text-gray-500 font-medium"
                >
                  <span>{personalExpanded ? 'Collapse' : 'View details'}</span>
                  <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${personalExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>
              <div
                className={`divide-y divide-gray-100 overflow-hidden transition-all duration-300 ease-in-out ${
                  personalExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                } sm:max-h-none sm:opacity-100`}
              >
                <InfoItem icon={Mail} label="Email" value={employee.email} href={`mailto:${employee.email}`} color="blue" />
                <InfoItem icon={Phone} label="Phone" 
                  value={formatPhoneNumber(employee.phone, employee.countryCode)} 
                  href={generateWhatsAppUrl(employee.phone, employee.countryCode)} color="green" />
                {employee.gender && (
                  <InfoItem icon={User} label="Gender" value={employee.gender} color="indigo" />
                )}
                <InfoItem icon={Calendar} label="Join Date" value={formatDate(employee.joinDate)} color="amber" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Work Information</h3>
              <button
                onClick={() => setWorkExpanded(!workExpanded)}
                className="sm:hidden flex items-center gap-1 text-xs text-gray-500 font-medium"
              >
                <span>{workExpanded ? 'Collapse' : 'View details'}</span>
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${workExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
            <div
              className={`divide-y divide-gray-100 overflow-hidden transition-all duration-300 ease-in-out ${
                workExpanded ? 'max-h-[700px] opacity-100' : 'max-h-0 opacity-0'
              } sm:max-h-none sm:opacity-100`}
            >
              <InfoItem icon={Building2} label="Company" value={employee.companyName} color="purple" />
              <InfoItem icon={Briefcase} label="Department" value={employee.department} color="violet" />
              <InfoItem icon={Shield} label="Managerial Level" value={employee.managerialLevel} color="slate" />
              {employee.jobType && (
                <InfoItem icon={Briefcase} label="Job Type" value={employee.jobType} color="gray" />
              )}
              {employee.directManager && (
                <InfoItem icon={Users} label="Direct Manager" value={employee.directManager} color="orange" />
              )}
              {employee.location && (
                <InfoItem icon={MapPin} label="Location" 
                  value={employee.branch ? `${employee.location} · ${employee.branch}` : employee.location} 
                  color="rose" />
              )}
              {employee.orgPath && (
                <InfoItem icon={Building2} label="Org Path" value={employee.orgPath} color="gray" />
              )}
            </div>
          </div>

          <div
            className={`rounded-2xl border p-4 transition-all duration-300 ${
              hasWarnings
                ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
                : 'bg-white border-emerald-100'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Warning History</p>
                <p className={`text-sm font-semibold ${hasWarnings ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {hasWarnings ? `${warningsCount} warning${warningsCount === 1 ? '' : 's'}` : 'No warnings'}
                </p>
              </div>
              <Badge className={`${hasWarnings ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                {hasWarnings ? 'Required' : 'Clean'}
              </Badge>
            </div>
            {hasWarnings && (
              <div className="mt-2 flex justify-end">
                <button
                  onClick={() => setWarningsExpanded(!warningsExpanded)}
                  className="flex items-center gap-1 text-xs text-[rgb(217_119_6/var(--tw-text-opacity,1))] font-medium"
                >
                  <span>{warningsExpanded ? 'Collapse' : 'View details'}</span>
                  <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${warningsExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}
          </div>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              warningsExpanded && hasWarnings ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/80 to-orange-50/50 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <h4 className="text-sm font-semibold text-amber-900">Active Warnings</h4>
                </div>
              </div>
              <div className="space-y-2">
                {(employee.warnings || []).map((warning, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white/70 border border-amber-100/80 backdrop-blur-sm"
                  >
                    <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-amber-200/60 text-amber-800 text-xs font-bold mt-0.5">
                      {index + 1}
                    </span>
                    <p className="text-sm text-gray-700 leading-relaxed">{warning}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative overflow-hidden rounded-2xl bg-white border border-blue-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Overall Rating</p>
                  <p className="text-3xl font-bold text-blue-700 tracking-tight">
                    {yearEvaluations.length > 0
                      ? (yearEvaluations.reduce((sum, e) => sum + (e.score || 0), 0) / yearEvaluations.length).toFixed(1)
                      : 'N/A'}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-50">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
              </div>
              <div className="mt-3">
                <Select value={ratingYear.toString()} onValueChange={(v) => setRatingYear(parseInt(v))}>
                  <SelectTrigger className="h-7 w-20 text-xs border-blue-200 bg-blue-50/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-blue-50 opacity-50" />
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-white border border-emerald-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Completed</p>
                  <p className="text-3xl font-bold text-emerald-700 tracking-tight">
                    {evaluationList.filter(e => e.status === 'Completed').length}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-emerald-50 opacity-50" />
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-white border border-violet-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Pending Review</p>
                  <p className="text-3xl font-bold text-violet-700 tracking-tight">
                    {evaluationList.filter(e => e.status === 'Employee Review' || e.status === 'Pending HR Approval').length}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-violet-50">
                  <Clock className="h-5 w-5 text-violet-500" />
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-violet-50 opacity-50" />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Evaluation History</h3>
                <p className="text-xs text-gray-400 mt-0.5">Click any evaluation to view details</p>
              </div>

              <Button
                size="sm"
                onClick={handleCreateEvaluation}
                disabled={!isFormValid() || isCreatingEvaluation}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg gap-1.5 shadow-sm"
              >
                {isCreatingEvaluation ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" />Creating...</>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    New Evaluation
                  </>
                )}
              </Button>
            </div>

            <div className="p-4 sm:p-6">
              {evaluationsLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Loader2 className="h-8 w-8 animate-spin mb-3" />
                  <p className="text-sm">Loading evaluations…</p>
                </div>
              ) : evaluationsError ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="p-3 bg-red-50 rounded-full mb-3">
                    <AlertTriangle className="h-6 w-6 text-red-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">Failed to load evaluations</p>
                  <p className="text-xs text-gray-400 mt-1">{evaluationsError.message}</p>
                </div>
              ) : evaluationList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <div className="p-4 bg-gray-50 rounded-2xl mb-4">
                    <BarChart3 className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">No evaluations yet</p>
                  <p className="text-xs text-gray-400 mt-1">Create one to get started</p>
                </div>
              ) : (
                <Tabs defaultValue="managerEval" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-50 p-1 rounded-xl h-11">
                    <TabsTrigger value="selfEval" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm gap-2">
                      Self Evaluation
                      <span className="text-[10px] bg-gray-200 data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700 px-1.5 py-0.5 rounded-full font-semibold">
                        {selfEvaluationList.length}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="managerEval" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm gap-2">
                      Manager Evaluation
                      <span className="text-[10px] bg-gray-200 data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700 px-1.5 py-0.5 rounded-full font-semibold">
                        {evaluationList.filter(e => e.status !== 'Self Evaluation').length}
                      </span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="selfEval" className="mt-4 space-y-2.5">
                    {selfEvaluationsLoading ? (
                      <div className="flex items-center justify-center py-12 text-gray-400">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span className="text-sm">Loading…</span>
                      </div>
                    ) : selfEvaluationsError ? (
                      <div className="text-center py-12">
                        <p className="text-sm text-red-500">Failed to load self evaluations</p>
                      </div>
                    ) : selfEvaluationList.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">No self evaluations</p>
                      </div>
                    ) : (
                      selfEvaluationList.map(evaluation => (
                        <EvaluationCard
                          key={evaluation.id}
                          evaluation={evaluation}
                          onSelect={() => setSelectedEvaluation(evaluation)}
                          onEdit={() => handleEditEvaluation(evaluation)}
                          onDelete={() => handleDeleteEvaluation(evaluation.id)}
                          isDeleting={deletingEvaluationId === evaluation.id}
                        />
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="managerEval" className="mt-4 space-y-2.5">
                    {evaluationList.filter(e => e.status !== 'Self Evaluation').length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">No manager evaluations</p>
                      </div>
                    ) : (
                      evaluationList.filter(e => e.status !== 'Self Evaluation').map(evaluation => (
                        <EvaluationCard
                          key={evaluation.id}
                          evaluation={evaluation}
                          onSelect={() => setSelectedEvaluation(evaluation)}
                          onEdit={() => handleEditEvaluation(evaluation)}
                          onDelete={() => handleDeleteEvaluation(evaluation.id)}
                          isDeleting={deletingEvaluationId === evaluation.id}
                        />
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Edit Evaluation Modal ──────────────────────────────────────── */}
      <Dialog open={isEditEvaluationOpen} onOpenChange={setIsEditEvaluationOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg">Edit Evaluation</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              Status flow: Draft → HoD Approval → HR Approval → Employee Review → Approved → Completed
            </p>
          </DialogHeader>

          {editingEvaluation && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</Label>
                  <Input value={editingEvaluation.type} disabled className="rounded-lg bg-gray-50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Period</Label>
                  <Input value={editingEvaluation.period} disabled className="rounded-lg bg-gray-50" />
                </div>
              </div>

              {!isEditingSelfEvaluation && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</Label>
                  <Input value={editingEvaluation.status} disabled className="rounded-lg bg-gray-50" />
                </div>
              )}

              {!isEditFormValid() && (
                <div className="flex items-start gap-2.5 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <div className="text-sm text-amber-800">
                    {!editingEvaluation.type && <p>• Type is required</p>}
                    {!editingEvaluation.period && <p>• Period is required</p>}
                    {(() => {
                      const orig = evaluationList.find(e => e.id === editingEvaluation.id);
                      if (orig && !isValidStatusTransition(orig.status, editingEvaluation.status)) {
                        return <p>• Invalid transition: {orig.status} → {editingEvaluation.status}</p>;
                      }
                      return null;
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsEditEvaluationOpen(false)} className="rounded-lg">Cancel</Button>
            <Button onClick={handleUpdateEvaluation} disabled={!isEditFormValid() || isUpdatingEvaluation}
              className="bg-indigo-600 hover:bg-indigo-700 rounded-lg gap-2">
              {isUpdatingEvaluation ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Updating…</>
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
