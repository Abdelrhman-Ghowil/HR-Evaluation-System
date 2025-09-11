import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Edit, Trash2, Users, Building, Award } from 'lucide-react';
import { toast } from 'sonner';
import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
  useCompanies,
  useDepartments,
  useEvaluations,
  useCreateEvaluation
} from '../../hooks/useApi';
import {
  CreateEmployeeRequest,
  CreateEvaluationRequest,
  EmployeeStatus,
  ManagerialLevel,
  EvaluationType,
  EvaluationStatus
} from '../../types/api';

const ApiIntegrationExample = () => {
  const [selectedTab, setSelectedTab] = useState<'employees' | 'companies' | 'evaluations'>('employees');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);

  // API Hooks
  const { data: employeesData, isLoading: employeesLoading, error: employeesError } = useEmployees();
  const { data: companiesData, isLoading: companiesLoading } = useCompanies();
  const { data: departmentsData, isLoading: departmentsLoading } = useDepartments();
  const { data: evaluationsData, isLoading: evaluationsLoading } = useEvaluations();
  
  const createEmployeeMutation = useCreateEmployee();
  const updateEmployeeMutation = useUpdateEmployee();
  const deleteEmployeeMutation = useDeleteEmployee();
  const createEvaluationMutation = useCreateEvaluation();

  // Form state
  const [employeeForm, setEmployeeForm] = useState<Partial<CreateEmployeeRequest>>({
    user_id: '',
    company: '',
    managerial_level: 'IC',
    status: 'ACTIVE',
    join_date: new Date().toISOString().split('T')[0]
  });

  const [evaluationForm, setEvaluationForm] = useState<Partial<CreateEvaluationRequest>>({
    employee_id: '',
    type: 'ANNUAL',
    status: 'DRAFT',
    period: '2024-Q1'
  });

  const handleCreateEmployee = async () => {
    if (!employeeForm.user_id || !employeeForm.company) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createEmployeeMutation.mutateAsync(employeeForm as CreateEmployeeRequest);
      setShowCreateForm(false);
      setEmployeeForm({
        user_id: '',
        company: '',
        managerial_level: 'IC',
        status: 'ACTIVE',
        join_date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Failed to create employee:', error);
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteEmployeeMutation.mutateAsync(employeeId);
      } catch (error) {
        console.error('Failed to delete employee:', error);
      }
    }
  };

  const handleCreateEvaluation = async () => {
    if (!evaluationForm.employee_id) {
      toast.error('Please select an employee');
      return;
    }

    try {
      await createEvaluationMutation.mutateAsync(evaluationForm as CreateEvaluationRequest);
      setEvaluationForm({
        employee_id: '',
        type: 'ANNUAL',
        status: 'DRAFT',
        period: '2024-Q1'
      });
    } catch (error) {
      console.error('Failed to create evaluation:', error);
    }
  };

  const renderEmployeesTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Employees ({employeesData?.results?.length || 0})
        </h3>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Employee</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="user_id">User ID</Label>
                <Input
                  id="user_id"
                  value={employeeForm.user_id}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, user_id: e.target.value })}
                  placeholder="Enter user UUID"
                />
              </div>
              <div>
                <Label htmlFor="company">Company ID</Label>
                <Input
                  id="company"
                  value={employeeForm.company}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, company: e.target.value })}
                  placeholder="Enter company UUID"
                />
              </div>
              <div>
                <Label htmlFor="managerial_level">Managerial Level</Label>
                <Select
                  value={employeeForm.managerial_level}
                  onValueChange={(value: ManagerialLevel) => setEmployeeForm({ ...employeeForm, managerial_level: value })}
                >
                  <SelectTrigger id="managerial_level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IC">Individual Contributor</SelectItem>
                    <SelectItem value="SUPERVISORY">Supervisory</SelectItem>
                    <SelectItem value="MIDDLE">Middle Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={employeeForm.status}
                  onValueChange={(value: EmployeeStatus) => setEmployeeForm({ ...employeeForm, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="join_date">Join Date</Label>
                <Input
                  id="join_date"
                  type="date"
                  value={employeeForm.join_date}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, join_date: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateEmployee} disabled={createEmployeeMutation.isPending}>
                {createEmployeeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Employee
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {employeesLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : employeesError ? (
        <div className="text-red-600 p-4 bg-red-50 rounded-lg">
          Error loading employees: {employeesError.message}
        </div>
      ) : (
        <div className="grid gap-4">
          {employeesData?.results?.map((employee) => (
            <Card key={employee.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{employee.user?.name || 'Unknown'}</h4>
                    <p className="text-sm text-gray-600">{employee.user?.email}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant={employee.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {employee.status}
                      </Badge>
                      <Badge variant="outline">{employee.managerial_level}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDeleteEmployee(employee.id)}
                      disabled={deleteEmployeeMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )) || (
            <div className="text-center p-8 text-gray-500">
              No employees found. Create your first employee above.
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderCompaniesTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Building className="h-5 w-5" />
        Companies ({companiesData?.results?.length || 0})
      </h3>
      {companiesLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4">
          {companiesData?.results?.map((company) => (
            <Card key={company.id}>
              <CardContent className="p-4">
                <h4 className="font-semibold">{company.name}</h4>
                <p className="text-sm text-gray-600">{company.industry}</p>
                {company.size && <Badge variant="outline">{company.size}</Badge>}
              </CardContent>
            </Card>
          )) || (
            <div className="text-center p-8 text-gray-500">
              No companies found.
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderEvaluationsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Award className="h-5 w-5" />
          Evaluations ({evaluationsData?.results?.length || 0})
        </h3>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Evaluation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employee_id">Employee ID</Label>
              <Input
                id="employee_id"
                value={evaluationForm.employee_id}
                onChange={(e) => setEvaluationForm({ ...evaluationForm, employee_id: e.target.value })}
                placeholder="Enter employee UUID"
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={evaluationForm.type}
                onValueChange={(value: EvaluationType) => setEvaluationForm({ ...evaluationForm, type: value })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANNUAL">Annual</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="PROBATION">Probation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="period">Period</Label>
              <Input
                id="period"
                value={evaluationForm.period}
                onChange={(e) => setEvaluationForm({ ...evaluationForm, period: e.target.value })}
                placeholder="e.g., 2024-Q1"
              />
            </div>
          </div>
          <Button onClick={handleCreateEvaluation} disabled={createEvaluationMutation.isPending}>
            {createEvaluationMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Evaluation
          </Button>
        </CardContent>
      </Card>

      {evaluationsLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4">
          {evaluationsData?.results?.map((evaluation) => (
            <Card key={evaluation.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{evaluation.type} Evaluation</h4>
                    <p className="text-sm text-gray-600">Period: {evaluation.period}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{evaluation.status}</Badge>
                      {evaluation.score && <Badge>Score: {evaluation.score}</Badge>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )) || (
            <div className="text-center p-8 text-gray-500">
              No evaluations found.
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Integration Example</CardTitle>
          <CardDescription>
            This component demonstrates how to use the API service with React Query hooks for CRUD operations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-1 mb-6">
            <Button
              variant={selectedTab === 'employees' ? 'default' : 'outline'}
              onClick={() => setSelectedTab('employees')}
            >
              Employees
            </Button>
            <Button
              variant={selectedTab === 'companies' ? 'default' : 'outline'}
              onClick={() => setSelectedTab('companies')}
            >
              Companies
            </Button>
            <Button
              variant={selectedTab === 'evaluations' ? 'default' : 'outline'}
              onClick={() => setSelectedTab('evaluations')}
            >
              Evaluations
            </Button>
          </div>

          {selectedTab === 'employees' && renderEmployeesTab()}
          {selectedTab === 'companies' && renderCompaniesTab()}
          {selectedTab === 'evaluations' && renderEvaluationsTab()}
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiIntegrationExample;