import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertCircle, Save, RotateCcw, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { toast } from 'sonner';
import { apiService } from '../../services/api';
import { WeightsConfiguration as WeightsConfigType, WeightsConfigurationLevel, ScoringRule } from '../../types/api';

interface WeightsConfigurationProps {
  onBack?: () => void;
}

const LEVEL_LABELS: Record<WeightsConfigurationLevel, string> = {
  IC: 'Individual Contributor',
  SUPERVISORY: 'Supervisory',
  MIDDLE: 'Middle Management'
};

const WeightsConfiguration: React.FC<WeightsConfigurationProps> = ({ onBack }) => {
  const [selectedLevel, setSelectedLevel] = useState<WeightsConfigurationLevel>('IC');
  const [weights, setWeights] = useState({
    core: 40,
    leadership: 0,
    functional: 60,
    competency: 40,
    objective: 60,
  });
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>([
    { min_score: 90, max_score: 100, grade: 'A+', description: 'Exceptional Performance' },
    { min_score: 80, max_score: 89, grade: 'A', description: 'Excellent Performance' },
    { min_score: 70, max_score: 79, grade: 'B', description: 'Good Performance' },
    { min_score: 60, max_score: 69, grade: 'C', description: 'Satisfactory Performance' },
    { min_score: 0, max_score: 59, grade: 'D', description: 'Needs Improvement' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const loadConfiguration = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const config = await apiService.getWeightsConfiguration(selectedLevel);
      console.log('API Response:', config); // Debug log
      setWeights({
        core: config.core_weight,
        leadership: config.leadership_weight,
        functional: config.functional_weight,
        competency: config.competency_weight,
        objective: config.objective_weight,
      });
      setScoringRules(config.scoring_rules || [
        { min_score: 90, max_score: 100, grade: 'A+', description: 'Exceptional Performance' },
        { min_score: 80, max_score: 89, grade: 'A', description: 'Excellent Performance' },
        { min_score: 70, max_score: 79, grade: 'B', description: 'Good Performance' },
        { min_score: 60, max_score: 69, grade: 'C', description: 'Satisfactory Performance' },
        { min_score: 0, max_score: 59, grade: 'D', description: 'Needs Improvement' },
      ]);
    } catch (err) {
      // If API fails, use default values instead of showing error
      console.warn('Failed to load configuration, using defaults:', err);
      setWeights({
        core: 40,
        leadership: 0,
        functional: 60,
        competency: 40,
        objective: 60,
      });
      setScoringRules([
        { min_score: 90, max_score: 100, grade: 'A+', description: 'Exceptional Performance' },
        { min_score: 80, max_score: 89, grade: 'A', description: 'Excellent Performance' },
        { min_score: 70, max_score: 79, grade: 'B', description: 'Good Performance' },
        { min_score: 60, max_score: 69, grade: 'C', description: 'Satisfactory Performance' },
        { min_score: 0, max_score: 59, grade: 'D', description: 'Needs Improvement' },
      ]);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [selectedLevel]);

  // Load configuration when level changes
  useEffect(() => {
    loadConfiguration();
  }, [loadConfiguration]);

  const handleWeightChange = (field: 'core' | 'leadership' | 'functional' | 'competency' | 'objective', value: number) => {
    setWeights(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleScoringRuleChange = (index: number, field: keyof ScoringRule, value: string | number) => {
    setScoringRules(prev => prev.map((rule, i) => 
      i === index ? { ...rule, [field]: value } : rule
    ));
  };

  const addScoringRule = () => {
    setScoringRules(prev => [...prev, {
      min_score: 0,
      max_score: 0,
      grade: '',
      description: ''
    }]);
  };

  const removeScoringRule = (index: number) => {
    setScoringRules(prev => prev.filter((_, i) => i !== index));
  };

  const validateWeights = (): boolean => {
    // Core + Leadership + Functional should equal Competency Weight
    const totalCompetencyBreakdown = weights.core + weights.leadership + weights.functional;
    const competencyWeightValid = totalCompetencyBreakdown === weights.competency;
    
    // Competency + Objective should equal 100%
    const totalEvaluationWeight = weights.competency + weights.objective;
    const totalWeightValid = totalEvaluationWeight === 100;
    
    return competencyWeightValid && totalWeightValid;
  };

  const validateScoringRules = (): boolean => {
    for (let i = 0; i < scoringRules.length; i++) {
      const rule = scoringRules[i];
      if (rule.min_score >= rule.max_score) return false;
      if (!rule.grade.trim() || !rule.description.trim()) return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateWeights()) {
      toast.error('Weights must total 100%');
      return;
    }

    if (!validateScoringRules()) {
      toast.error('Invalid scoring rules configuration');
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
        scoring_rules: scoringRules
      });
      
      toast.success('Configuration saved successfully');
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

  const totalCompetencyBreakdown = weights.core + weights.leadership + weights.functional;
  const totalEvaluationWeight = weights.competency + weights.objective;
  const isCompetencyBreakdownValid = totalCompetencyBreakdown === weights.competency;
  const isTotalWeightValid = totalEvaluationWeight === 100;
  const isWeightValid = isCompetencyBreakdownValid && isTotalWeightValid;

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
            <p className="text-muted-foreground">Configure evaluation weights and scoring rules by managerial level</p>
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
              <Label htmlFor="level">Level</Label>
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
          <CardDescription>Configure the primary weight distribution for {LEVEL_LABELS[selectedLevel]} evaluations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="competency">Competency Weight (%)</Label>
              <Input
                id="competency"
                type="number"
                min="0"
                max="100"
                value={weights.competency}
                onChange={(e) => handleWeightChange('competency', parseInt(e.target.value) || 0)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="objective">Objective Weight (%)</Label>
              <Input
                id="objective"
                type="number"
                min="0"
                max="100"
                value={weights.objective}
                onChange={(e) => handleWeightChange('objective', parseInt(e.target.value) || 0)}
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competency Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Competency Weight Breakdown</CardTitle>
          <CardDescription>Break down the competency weight into specific categories</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="core">Core Weight (%)</Label>
              <Input
                id="core"
                type="number"
                min="0"
                max="100"
                value={weights.core}
                onChange={(e) => handleWeightChange('core', parseInt(e.target.value) || 0)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leadership">Leadership Weight (%)</Label>
              <Input
                id="leadership"
                type="number"
                min="0"
                max="100"
                value={weights.leadership}
                onChange={(e) => handleWeightChange('leadership', parseInt(e.target.value) || 0)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="functional">Functional Weight (%)</Label>
              <Input
                id="functional"
                type="number"
                min="0"
                max="100"
                value={weights.functional}
                onChange={(e) => handleWeightChange('functional', parseInt(e.target.value) || 0)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="font-medium">Competency Breakdown (Core + Leadership + Functional):</span>
              <span className={`font-bold ${isCompetencyBreakdownValid ? 'text-green-600' : 'text-red-600'}`}>
                {totalCompetencyBreakdown}% / {weights.competency}%
              </span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="font-medium">Total Evaluation Weight (Competency + Objective):</span>
              <span className={`font-bold ${isTotalWeightValid ? 'text-green-600' : 'text-red-600'}`}>
                {totalEvaluationWeight}%
              </span>
            </div>
          </div>

          {!isCompetencyBreakdownValid && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Competency breakdown (Core + Leadership + Functional) must equal Competency Weight. Current: {totalCompetencyBreakdown}% ≠ {weights.competency}%
              </AlertDescription>
            </Alert>
          )}
          
          {!isTotalWeightValid && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Total evaluation weight (Competency + Objective) must equal 100%. Current total: {totalEvaluationWeight}%
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Scoring Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Scoring Rules</CardTitle>
              <CardDescription>Define grade boundaries and descriptions</CardDescription>
            </div>
            <Button onClick={addScoringRule} size="sm" disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scoringRules?.map((rule, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label>Min Score</Label>
                  <Input
                    type="number"
                    value={rule.min_score}
                    onChange={(e) => handleScoringRuleChange(index, 'min_score', parseInt(e.target.value) || 0)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Score</Label>
                  <Input
                    type="number"
                    value={rule.max_score}
                    onChange={(e) => handleScoringRuleChange(index, 'max_score', parseInt(e.target.value) || 0)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Grade</Label>
                  <Input
                    value={rule.grade}
                    onChange={(e) => handleScoringRuleChange(index, 'grade', e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={rule.description}
                    onChange={(e) => handleScoringRuleChange(index, 'description', e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeScoringRule(index)}
                    disabled={loading || scoringRules.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={handleReset} disabled={loading}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
        <Button onClick={handleSave} disabled={loading || !isWeightValid}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
};

export default WeightsConfiguration;