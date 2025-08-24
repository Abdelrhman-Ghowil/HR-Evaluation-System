import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiService from '../services/api';
import {
  LoginRequest,
  LoginResponse,
  ApiUser,
  CreateUserRequest,
  UpdateUserRequest,
  ApiEmployee,
  CreateEmployeeRequest,
  ApiCompany,
  CreateCompanyRequest,
  ApiDepartment,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  ApiEvaluation,
  CreateEvaluationRequest,
  UpdateEvaluationRequest,
  ApiObjective,
  ApiCompetency,
  CreateCompetencyRequest,
  UpdateCompetencyRequest,
  PaginatedResponse,
  EmployeeQueryParams,
  DepartmentQueryParams,
  EvaluationQueryParams,
  ApiError
} from '../types/api';

// Query Keys
export const queryKeys = {
  users: ['users'] as const,
  user: (id: string) => ['users', id] as const,
  employees: ['employees'] as const,
  employee: (id: string) => ['employees', id] as const,
  companies: ['companies'] as const,
  company: (id: string) => ['companies', id] as const,
  departments: ['departments'] as const,
  department: (id: string) => ['departments', id] as const,
  evaluations: ['evaluations'] as const,
  evaluation: (id: string) => ['evaluations', id] as const,
  objectives: (evaluationId: string) => ['objectives', evaluationId] as const,
  competencies: (evaluationId: string) => ['competencies', evaluationId] as const,
};

// Authentication Hooks
export const useLogin = (options?: UseMutationOptions<LoginResponse, ApiError, LoginRequest>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (credentials: LoginRequest) => apiService.login(credentials),
    onSuccess: (data) => {
      toast.success('Login successful!');
      // Invalidate and refetch user-related queries
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Login failed');
    },
    ...options,
  });
};

export const useLogout = (options?: UseMutationOptions<void, ApiError, void>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiService.logout(),
    onSuccess: () => {
      toast.success('Logged out successfully');
      queryClient.clear(); // Clear all cached data
    },
    ...options,
  });
};

// User Management Hooks
export const useCreateUser = (options?: UseMutationOptions<ApiUser, ApiError, CreateUserRequest>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData: CreateUserRequest) => apiService.createUser(userData),
    onSuccess: () => {
      toast.success('User created successfully!');
      queryClient.invalidateQueries({ queryKey: queryKeys.employees });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to create user');
    },
    ...options,
  });
};

export const useUpdateUser = (options?: UseMutationOptions<ApiUser, ApiError, { userId: string; userData: UpdateUserRequest }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, userData }) => apiService.updateUser(userId, userData),
    onSuccess: (data, variables) => {
      toast.success('User updated successfully!');
      queryClient.invalidateQueries({ queryKey: queryKeys.user(variables.userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to update user');
    },
    ...options,
  });
};

export const useUsers = (options?: UseQueryOptions<ApiUser[], ApiError>) => {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: () => apiService.getUsers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Employee Hooks
export const useEmployees = (
  params?: EmployeeQueryParams,
  options?: UseQueryOptions<PaginatedResponse<ApiEmployee>, ApiError>
) => {
  return useQuery({
    queryKey: [...queryKeys.employees, params],
    queryFn: () => apiService.getEmployees(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useEmployee = (
  employeeId: string,
  options?: UseQueryOptions<ApiEmployee, ApiError>
) => {
  return useQuery({
    queryKey: queryKeys.employee(employeeId),
    queryFn: () => apiService.getEmployee(employeeId),
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useCreateEmployee = (options?: UseMutationOptions<ApiEmployee, ApiError, CreateEmployeeRequest>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (employeeData: CreateEmployeeRequest) => apiService.createEmployee(employeeData),
    onSuccess: () => {
      toast.success('Employee created successfully!');
      queryClient.invalidateQueries({ queryKey: queryKeys.employees });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to create employee');
    },
    ...options,
  });
};

export const useUpdateEmployee = (options?: UseMutationOptions<ApiEmployee, ApiError, { employeeId: string; employeeData: Partial<CreateEmployeeRequest> }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ employeeId, employeeData }) => apiService.updateEmployee(employeeId, employeeData),
    onSuccess: (data, variables) => {
      toast.success('Employee updated successfully!');
      queryClient.invalidateQueries({ queryKey: queryKeys.employee(variables.employeeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to update employee');
    },
    ...options,
  });
};

export const useDeleteEmployee = (options?: UseMutationOptions<void, ApiError, string>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (employeeId: string) => apiService.deleteEmployee(employeeId),
    onSuccess: () => {
      toast.success('Employee deleted successfully!');
      queryClient.invalidateQueries({ queryKey: queryKeys.employees });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to delete employee');
    },
    ...options,
  });
};

// Company Hooks
export const useCompanies = (options?: UseQueryOptions<PaginatedResponse<ApiCompany>, ApiError>) => {
  return useQuery({
    queryKey: queryKeys.companies,
    queryFn: () => apiService.getCompanies(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

export const useCompany = (
  companyId: string,
  options?: UseQueryOptions<ApiCompany, ApiError>
) => {
  return useQuery({
    queryKey: queryKeys.company(companyId),
    queryFn: () => apiService.getCompany(companyId),
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000,
    ...options,
  });
};

export const useCreateCompany = (options?: UseMutationOptions<ApiCompany, ApiError, CreateCompanyRequest>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (companyData: CreateCompanyRequest) => apiService.createCompany(companyData),
    onSuccess: () => {
      toast.success('Company created successfully!');
      queryClient.invalidateQueries({ queryKey: queryKeys.companies });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to create company');
    },
    ...options,
  });
};

// Department Hooks
export const useDepartments = (
  params?: DepartmentQueryParams,
  options?: UseQueryOptions<PaginatedResponse<ApiDepartment>, ApiError>
) => {
  return useQuery({
    queryKey: [...queryKeys.departments, params],
    queryFn: () => apiService.getDepartments(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useDepartment = (
  departmentId: string,
  options?: UseQueryOptions<ApiDepartment, ApiError>
) => {
  return useQuery({
    queryKey: queryKeys.department(departmentId),
    queryFn: () => apiService.getDepartment(departmentId),
    enabled: !!departmentId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useCreateDepartment = (options?: UseMutationOptions<ApiDepartment, ApiError, CreateDepartmentRequest>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (departmentData: CreateDepartmentRequest) => apiService.createDepartment(departmentData),
    onSuccess: () => {
      toast.success('Department created successfully!');
      queryClient.invalidateQueries({ queryKey: queryKeys.departments });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to create department');
    },
    ...options,
  });
};

export const useUpdateDepartment = (options?: UseMutationOptions<ApiDepartment, ApiError, { departmentId: string; departmentData: UpdateDepartmentRequest }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ departmentId, departmentData }) => apiService.updateDepartment(departmentId, departmentData),
    onSuccess: (data, variables) => {
      toast.success('Department updated successfully!');
      queryClient.invalidateQueries({ queryKey: queryKeys.department(variables.departmentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.departments });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to update department');
    },
    ...options,
  });
};

// Evaluation Hooks
export const useEvaluations = (
  params?: EvaluationQueryParams,
  options?: UseQueryOptions<PaginatedResponse<ApiEvaluation>, ApiError>
) => {
  return useQuery({
    queryKey: [...queryKeys.evaluations, params],
    queryFn: () => apiService.getEvaluations(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

export const useEvaluation = (
  evaluationId: string,
  options?: UseQueryOptions<ApiEvaluation, ApiError>
) => {
  return useQuery({
    queryKey: queryKeys.evaluation(evaluationId),
    queryFn: () => apiService.getEvaluation(evaluationId),
    enabled: !!evaluationId,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};

export const useCreateEvaluation = (options?: UseMutationOptions<ApiEvaluation, ApiError, CreateEvaluationRequest>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (evaluationData: CreateEvaluationRequest) => apiService.createEvaluation(evaluationData),
    onSuccess: () => {
      toast.success('Evaluation created successfully!');
      queryClient.invalidateQueries({ queryKey: queryKeys.evaluations });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to create evaluation');
    },
    ...options,
  });
};

export const useUpdateEvaluation = (options?: UseMutationOptions<ApiEvaluation, ApiError, { evaluationId: string; evaluationData: UpdateEvaluationRequest }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ evaluationId, evaluationData }) => apiService.updateEvaluation(evaluationId, evaluationData),
    onSuccess: (data, variables) => {
      toast.success('Evaluation updated successfully!');
      queryClient.invalidateQueries({ queryKey: queryKeys.evaluation(variables.evaluationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.evaluations });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to update evaluation');
    },
    ...options,
  });
};

export const useDeleteEvaluation = (options?: UseMutationOptions<void, ApiError, string>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (evaluationId: string) => apiService.deleteEvaluation(evaluationId),
    onSuccess: () => {
      toast.success('Evaluation deleted successfully!');
      queryClient.invalidateQueries({ queryKey: queryKeys.evaluations });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to delete evaluation');
    },
    ...options,
  });
};

// Objective hooks
export const useObjectives = (
  evaluationId: string,
  options?: UseQueryOptions<ApiObjective[], ApiError>
) => {
  return useQuery({
    queryKey: queryKeys.objectives(evaluationId),
    queryFn: () => apiService.getObjectives(evaluationId),
    enabled: !!evaluationId,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};

export const useCreateObjective = (options?: UseMutationOptions<ApiObjective, ApiError, Omit<ApiObjective, 'objective_id' | 'created_at' | 'updated_at'>>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (objectiveData: Omit<ApiObjective, 'objective_id' | 'created_at' | 'updated_at'>) => apiService.createObjective(objectiveData),
    onSuccess: (data) => {
      toast.success('Objective created successfully!');
      if (data.evaluation_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.objectives(data.evaluation_id) });
      }
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to create objective');
    },
    ...options,
  });
};

export const useUpdateObjective = (options?: UseMutationOptions<ApiObjective, ApiError, { objectiveId: string; objectiveData: Partial<ApiObjective> }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ objectiveId, objectiveData }) => apiService.updateObjective(objectiveId, objectiveData),
    onSuccess: (data, variables) => {
      toast.success('Objective updated successfully!');
      if (data.evaluation_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.objectives(data.evaluation_id) });
      }
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to update objective');
    },
    ...options,
  });
};

export const useDeleteObjective = (options?: UseMutationOptions<void, ApiError, { objectiveId: string; evaluationId: string }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ objectiveId }) => apiService.deleteObjective(objectiveId),
    onSuccess: (_, variables) => {
      toast.success('Objective deleted successfully!');
      queryClient.invalidateQueries({ queryKey: queryKeys.objectives(variables.evaluationId) });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to delete objective');
    },
    ...options,
  });
};

// Competency hooks
export const useCompetencies = (
  evaluationId: string,
  options?: UseQueryOptions<ApiCompetency[], ApiError>
) => {
  return useQuery({
    queryKey: queryKeys.competencies(evaluationId),
    queryFn: () => apiService.getCompetencies(evaluationId),
    enabled: !!evaluationId,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};

export const useCreateCompetency = (options?: UseMutationOptions<ApiCompetency, ApiError, CreateCompetencyRequest>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (competencyData: CreateCompetencyRequest) => apiService.createCompetency(competencyData),
    onSuccess: (data) => {
      toast.success('Competency created successfully!');
      if (data.evaluation_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.competencies(data.evaluation_id) });
      }
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to create competency');
    },
    ...options,
  });
};

export const useUpdateCompetency = (options?: UseMutationOptions<ApiCompetency, ApiError, { competencyId: string; competencyData: UpdateCompetencyRequest }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ competencyId, competencyData }) => apiService.updateCompetency(competencyId, competencyData),
    onSuccess: (data, variables) => {
      toast.success('Competency updated successfully!');
      if (data.evaluation_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.competencies(data.evaluation_id) });
      }
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to update competency');
    },
    ...options,
  });
};

export const useDeleteCompetency = (options?: UseMutationOptions<void, ApiError, { competencyId: string; evaluationId: string }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ competencyId }) => apiService.deleteCompetency(competencyId),
    onSuccess: (_, variables) => {
      toast.success('Competency deleted successfully!');
      queryClient.invalidateQueries({ queryKey: queryKeys.competencies(variables.evaluationId) });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to delete competency');
    },
    ...options,
  });
};

// Utility hook for checking authentication status
export const useAuthStatus = () => {
  return {
    isAuthenticated: apiService.isAuthenticated(),
    token: apiService.getToken(),
  };
};