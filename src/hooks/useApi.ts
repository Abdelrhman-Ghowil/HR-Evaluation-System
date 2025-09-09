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
  UpdateCompanyRequest,
  ApiDepartment,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  ApiSubDepartment,
  CreateSubDepartmentRequest,
  UpdateSubDepartmentRequest,
  SubDepartmentQueryParams,
  ApiEvaluation,
  CreateEvaluationRequest,
  UpdateEvaluationRequest,
  ApiObjective,
  CreateObjectiveRequest,
  UpdateObjectiveRequest,
  ApiCompetency,
  CreateCompetencyRequest,
  UpdateCompetencyRequest,
  ApiPlacement,
  CreatePlacementRequest,
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
  subDepartments: ['subDepartments'] as const,
  subDepartment: (id: string) => ['subDepartments', id] as const,
  evaluations: ['evaluations'] as const,
  evaluation: (id: string) => ['evaluations', id] as const,
  objectives: (evaluationId: string) => ['objectives', evaluationId] as const,
  competencies: (evaluationId: string) => ['competencies', evaluationId] as const,
  placements: ['placements'] as const,
  placement: (id: string) => ['placements', id] as const,
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

export const useUpdateCompany = (options?: UseMutationOptions<ApiCompany, ApiError, { companyId: string; companyData: UpdateCompanyRequest }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ companyId, companyData }) => apiService.updateCompany(companyId, companyData),
    onSuccess: (data, variables) => {
      toast.success('Company updated successfully!');
      queryClient.invalidateQueries({ queryKey: queryKeys.company(variables.companyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.companies });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to update company');
    },
    ...options,
  });
};

export const useDeleteCompany = (options?: UseMutationOptions<void, ApiError, string>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (companyId: string) => apiService.deleteCompany(companyId),
    onSuccess: () => {
      toast.success('Company deleted successfully!');
      queryClient.invalidateQueries({ queryKey: queryKeys.companies });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to delete company');
    },
    ...options,
  });
};

export const useImportCompanies = (options?: UseMutationOptions<{ success: boolean; message: string; data?: any; errors?: any[] }, ApiError, { file: File; dryRun: boolean }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ file, dryRun }) => apiService.importCompanies(file, dryRun),
    onSuccess: (data, variables) => {
      if (variables.dryRun) {
        toast.success('Import validation completed successfully!');
      } else {
        toast.success('Companies imported successfully!');
        queryClient.invalidateQueries({ queryKey: queryKeys.companies });
      }
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to import companies');
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

// Sub-Department Hooks
export const useSubDepartments = (
  params?: SubDepartmentQueryParams,
  options?: UseQueryOptions<PaginatedResponse<ApiSubDepartment>, ApiError>
) => {
  return useQuery({
    queryKey: [...queryKeys.subDepartments, params],
    queryFn: () => apiService.getSubDepartments(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useSubDepartment = (
  subDepartmentId: string,
  options?: UseQueryOptions<ApiSubDepartment, ApiError>
) => {
  return useQuery({
    queryKey: queryKeys.subDepartment(subDepartmentId),
    queryFn: () => apiService.getSubDepartment(subDepartmentId),
    enabled: !!subDepartmentId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useCreateSubDepartment = (options?: UseMutationOptions<ApiSubDepartment, ApiError, CreateSubDepartmentRequest>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (subDepartmentData: CreateSubDepartmentRequest) => apiService.createSubDepartment(subDepartmentData),
    onSuccess: () => {
      toast.success('Sub-department created successfully!');
      queryClient.invalidateQueries({ queryKey: queryKeys.subDepartments });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to create sub-department');
    },
    ...options,
  });
};

export const useUpdateSubDepartment = (options?: UseMutationOptions<ApiSubDepartment, ApiError, { subDepartmentId: string; subDepartmentData: UpdateSubDepartmentRequest }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ subDepartmentId, subDepartmentData }) => apiService.updateSubDepartment(subDepartmentId, subDepartmentData),
    onSuccess: (data, variables) => {
      toast.success('Sub-department updated successfully!');
      queryClient.invalidateQueries({ queryKey: queryKeys.subDepartment(variables.subDepartmentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.subDepartments });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to update sub-department');
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

export const useCreateObjective = (options?: UseMutationOptions<ApiObjective, ApiError, CreateObjectiveRequest>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (objectiveData: CreateObjectiveRequest) => apiService.createObjective(objectiveData),
    onSuccess: (data, variables) => {
      toast.success('Objective created successfully!');
      queryClient.invalidateQueries({ queryKey: queryKeys.objectives(variables.evaluation_id) });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to create objective');
    },
    ...options,
  });
};

export const useUpdateObjective = (options?: UseMutationOptions<ApiObjective, ApiError, { objectiveId: string; evaluationId: string; objectiveData: UpdateObjectiveRequest }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ objectiveId, objectiveData }) => apiService.updateObjective(objectiveId, objectiveData),
    onSuccess: (data, variables) => {
      toast.success('Objective updated successfully!');
      queryClient.invalidateQueries({ queryKey: queryKeys.objectives(variables.evaluationId) });
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

// Placement Hooks
export const usePlacements = (
  options?: UseQueryOptions<ApiPlacement[], ApiError>
) => {
  return useQuery({
    queryKey: queryKeys.placements,
    queryFn: () => apiService.getPlacements(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const usePlacement = (
  placementId: string,
  options?: UseQueryOptions<ApiPlacement, ApiError>
) => {
  return useQuery({
    queryKey: queryKeys.placement(placementId),
    queryFn: () => apiService.getPlacement(placementId),
    enabled: !!placementId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useCreatePlacement = (
  options?: UseMutationOptions<ApiPlacement, ApiError, CreatePlacementRequest>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreatePlacementRequest) => apiService.createPlacement(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.placements });
      toast.success('Placement created successfully');
      options?.onSuccess?.(data, data as any, undefined);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create placement');
      options?.onError?.(error, error as any, undefined);
    },
    ...options,
  });
};

export const useUpdatePlacement = (
  options?: UseMutationOptions<ApiPlacement, ApiError, { id: string; data: Partial<CreatePlacementRequest> }>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePlacementRequest> }) => 
      apiService.updatePlacement(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.placements });
      queryClient.invalidateQueries({ queryKey: queryKeys.placement(variables.id) });
      toast.success('Placement updated successfully');
      options?.onSuccess?.(data, variables, undefined);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update placement');
      options?.onError?.(error, error as any, undefined);
    },
    ...options,
  });
};

export const useDeletePlacement = (
  options?: UseMutationOptions<void, ApiError, string>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (placementId: string) => apiService.deletePlacement(placementId),
    onSuccess: (data, placementId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.placements });
      queryClient.removeQueries({ queryKey: queryKeys.placement(placementId) });
      toast.success('Placement deleted successfully');
      options?.onSuccess?.(data, placementId, undefined);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete placement');
      options?.onError?.(error, error as any, undefined);
    },
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