import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertCircle, HelpCircle, Save, RotateCcw, ArrowLeft, Pencil, X } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { toast } from 'sonner';
import { apiService } from '../../services/api';
import { WeightsConfigurationLevel } from '../../types/api';
import { ConfirmationDialog } from '../ui/confirmation-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface WeightsConfigurationProps {
  onBack?: () => void;
}

const LEVEL_LABELS: Record<WeightsConfigurationLevel, string> = {
  IC: 'Individual Contributor',
  SUPERVISORY: 'Supervisory',
  MIDDLE: 'Middle Management',
  EXECUTIVE: 'Executive Level'
};

const WeightsConfiguration: React.FC<WeightsConfigurationProps> = ({ onBack }) => {
  const [selectedLevel, setSelectedLevel] = useState<WeightsConfigurationLevel>('IC');
  const [weights, setWeights] = useState({
    core: 0,
    leadership: 0,
    functional: 0,
    competency: 0,
    objective: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalWeights, setOriginalWeights] = useState({
    core: 0,
    leadership: 0,
    functional: 0,
    competency: 0,
    objective: 0,
  });
  const [showValidation, setShowValidation] = useState(false);
  const [editedBreakdown, setEditedBreakdown] = useState({ core: false, leadership: false, functional: false });
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadConfiguration = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const config = await apiService.getWeightsConfiguration(selectedLevel);
      console.log('API Response:', config); // Debug log
      const loaded = {
        core: config.core_weight,
        leadership: config.leadership_weight,
        functional: config.functional_weight,
        competency: config.competency_weight,
        objective: config.objective_weight,
      };
      setWeights(loaded);
      setOriginalWeights(loaded);
      setEditedBreakdown({ core: false, leadership: false, functional: false });
    } catch (err) {
      // If API fails, do not use hard-coded defaults; surface the error
      console.warn('Failed to load configuration:', err);
      setError('Failed to load configuration. Please try again.');
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
      setInitialized(true);
      setIsEditing(false);
    }
  }, [selectedLevel]);

  // Load configuration when level changes
  useEffect(() => {
    loadConfiguration();
  }, [loadConfiguration]);

  const handleWeightChange = (field: 'core' | 'leadership' | 'functional' | 'competency' | 'objective', value: number) => {
    const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));

    // Auto-balance for main evaluation weights
    if (field === 'competency') {
      setWeights(prev => {
        const newCompetency = clamped;
        const newObjective = Math.max(0, Math.min(100, 100 - newCompetency));
        return { ...prev, competency: newCompetency, objective: newObjective };
      });
      return;
    }
    if (field === 'objective') {
      setWeights(prev => {
        const newObjective = clamped;
        const newCompetency = Math.max(0, Math.min(100, 100 - newObjective));
        return { ...prev, objective: newObjective, competency: newCompetency };
      });
      return;
    }

    // Competency breakdown logic: auto-fill the third when any two are entered
    if (field === 'core' || field === 'leadership' || field === 'functional') {
      const newEdited = { ...editedBreakdown, [field]: true } as const;
      setEditedBreakdown(newEdited);

      setWeights(prev => {
        const next = { ...prev, [field]: clamped } as typeof prev;
        const sum = (a: number, b: number) => a + b;
        const clamp = (n: number) => Math.max(0, Math.min(100, n));

        const twoEnteredCoreLeadership = newEdited.core && newEdited.leadership && !newEdited.functional;
        const twoEnteredCoreFunctional = newEdited.core && newEdited.functional && !newEdited.leadership;
        const twoEnteredLeadershipFunctional = newEdited.leadership && newEdited.functional && !newEdited.core;

        if (twoEnteredCoreLeadership) {
          const remaining = clamp(100 - sum(next.core, next.leadership));
          next.functional = remaining;
        } else if (twoEnteredCoreFunctional) {
          const remaining = clamp(100 - sum(next.core, next.functional));
          next.leadership = remaining;
        } else if (twoEnteredLeadershipFunctional) {
          const remaining = clamp(100 - sum(next.leadership, next.functional));
          next.core = remaining;
        }
        return next;
      });
      return;
    }
  };


  const validateWeights = (): boolean => {
    // Core + Leadership + Functional should total 100%
    const totalCompetencyBreakdown = weights.core + weights.leadership + weights.functional;
    const competencyBreakdownValid = totalCompetencyBreakdown === 100;

    // Competency + Objective should total 100%
    const totalEvaluationWeight = weights.competency + weights.objective;
    const totalWeightValid = totalEvaluationWeight === 100;

    return competencyBreakdownValid && totalWeightValid;
  };


  const handleSave = async () => {
    if (!validateWeights()) {
      setShowValidation(true);
      toast.error('Both totals must equal 100% (competency breakdown and evaluation).');
      return;
    }

    setLoading(true);
    try {
      await apiService.updateWeightsConfiguration(selectedLevel, {
        core_weight: weights.core,
        leadership_weight: weights.leadership,
        functional_weight: weights.functional,
        competency_weight: weights.competency,
        objective_weight: weights.objective,
      });
      
      toast.success('Configuration saved successfully');
      toast.info('Warning: This change affects calculations of new evaluations created afterward.');
      setOriginalWeights(weights);
      setIsEditing(false);
      setShowValidation(false);
    } catch (error) {
      toast.error('Failed to save configuration');
      console.error('Error saving weights configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    loadConfiguration();
  };

  const startEdit = () => {
    setIsEditing(true);
    setShowValidation(false);
    setEditedBreakdown({ core: false, leadership: false, functional: false });
  };

  const cancelEdit = () => {
    setWeights(originalWeights);
    setIsEditing(false);
    setShowValidation(false);
    setEditedBreakdown({ core: false, leadership: false, functional: false });
    toast.info('Changes discarded');
  };

  const totalCompetencyBreakdown = weights.core + weights.leadership + weights.functional;
  const totalEvaluationWeight = weights.competency + weights.objective;
  const isCompetencyBreakdownValid = totalCompetencyBreakdown === 100;
  const isTotalWeightValid = totalEvaluationWeight === 100;
  const isWeightValid = isCompetencyBreakdownValid && isTotalWeightValid;
  const breakdownClass = showValidation
    ? (isCompetencyBreakdownValid ? 'text-green-600' : 'text-red-600')
    : 'text-muted-foreground';
  const totalClass = showValidation
    ? (isTotalWeightValid ? 'text-green-600' : 'text-red-600')
    : 'text-muted-foreground';

  if (loading && !initialized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">Weights Configuration</h1>
            <p className="text-muted-foreground">Configure evaluation weights by managerial level</p>
          </div>
        </div>
      </div>

      {/* Level Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Managerial Level</CardTitle>
          <CardDescription>Select the managerial level to configure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="level">Level</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-gray-400 hover:text-gray-700" aria-label="Level help">
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Select the role level you want to configure.</TooltipContent>
                </Tooltip>
              </div>
              <Select value={selectedLevel} onValueChange={(value: WeightsConfigurationLevel) => setSelectedLevel(value)}>
                <SelectTrigger id="level">
                  <SelectValue placeholder="Select a level" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LEVEL_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                This changes which evaluation rules you are editing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Evaluation Weights */}
      <Card>
        <CardHeader>
          <CardTitle>Main Evaluation Weights</CardTitle>
          <CardDescription>
            Configure the primary weight distribution for {LEVEL_LABELS[selectedLevel]} evaluations. The other field auto-adjusts to keep total 100%.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="competency">Competency Weight (%)</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-gray-400 hover:text-gray-700" aria-label="Competency weight help">
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Portion of the total score based on competencies. Objective auto-adjusts to keep 100%.
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="competency"
                type="number"
                min="0"
                max="100"
                value={weights.competency}
                onChange={(e) => handleWeightChange('competency', parseInt(e.target.value) || 0)}
                disabled={loading || !isEditing}
              />
              {!isEditing && <p className="text-xs text-muted-foreground">Click “Edit Configuration” to make changes.</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="objective">Objective Weight (%)</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-gray-400 hover:text-gray-700" aria-label="Objective weight help">
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Portion of the total score based on objectives. Competency auto-adjusts to keep 100%.
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="objective"
                type="number"
                min="0"
                max="100"
                value={weights.objective}
                onChange={(e) => handleWeightChange('objective', parseInt(e.target.value) || 0)}
                disabled={loading || !isEditing}
              />
              {!isEditing && <p className="text-xs text-muted-foreground">Click “Edit Configuration” to make changes.</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competency Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Competency Weight Breakdown</CardTitle>
          <CardDescription>Enter any two fields; the third auto-fills to total 100%</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="core">Core Weight (%)</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-gray-400 hover:text-gray-700" aria-label="Core weight help">
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Part of competency weight. Enter any two fields; the third fills automatically.</TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="core"
                type="number"
                min="0"
                max="100"
                value={weights.core}
                onChange={(e) => handleWeightChange('core', parseInt(e.target.value) || 0)}
                disabled={loading || !isEditing}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="leadership">Leadership Weight (%)</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-gray-400 hover:text-gray-700" aria-label="Leadership weight help">
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Part of competency weight. Total must equal 100% across the three fields.</TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="leadership"
                type="number"
                min="0"
                max="100"
                value={weights.leadership}
                onChange={(e) => handleWeightChange('leadership', parseInt(e.target.value) || 0)}
                disabled={loading || !isEditing}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="functional">Functional Weight (%)</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-gray-400 hover:text-gray-700" aria-label="Functional weight help">
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Part of competency weight. Total must equal 100% across the three fields.</TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="functional"
                type="number"
                min="0"
                max="100"
                value={weights.functional}
                onChange={(e) => handleWeightChange('functional', parseInt(e.target.value) || 0)}
                disabled={loading || !isEditing}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="font-medium">Competency Breakdown (Core + Leadership + Functional):</span>
              <span className={`font-bold ${breakdownClass}`}>
                {totalCompetencyBreakdown}%
              </span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="font-medium">Total Evaluation Weight (Competency + Objective):</span>
              <span className={`font-bold ${totalClass}`}>
                {totalEvaluationWeight}%
              </span>
            </div>
          </div>

          {showValidation && !isCompetencyBreakdownValid && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Competency breakdown (Core + Leadership + Functional) must total 100%. Current total: {totalCompetencyBreakdown}%
              </AlertDescription>
            </Alert>
          )}
          
          {showValidation && !isTotalWeightValid && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Total evaluation weight (Competency + Objective) must equal 100%. Current total: {totalEvaluationWeight}%
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>



      {/* Actions */}
      <div className="flex justify-end space-x-4">
        {!isEditing ? (
          <>
            <Button variant="outline" onClick={handleReset} disabled={loading}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={startEdit} disabled={loading}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Configuration
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={cancelEdit} disabled={loading}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={() => setConfirmOpen(true)} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        )}
      </div>

      {/* Save Confirmation Modal */}
      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Save Weights Configuration"
        description="Warning: This change affects calculations of new evaluations created afterward."
        confirmText="Submit"
        cancelText="Cancel"
        onConfirm={() => {
          setConfirmOpen(false);
          handleSave();
        }}
        variant="destructive"
        loading={loading}
      />
    </div>
  );
};

export default WeightsConfiguration;
