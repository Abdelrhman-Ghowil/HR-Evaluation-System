// API Types for HR Evaluation System Backend Integration

// Authentication Types
export interface LoginRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: ApiUser;
}

export interface ApiUser {
  user_id: string;
  username: string;
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  name: string;
  phone?: string;
  role: UserRole;
  position?: string;
  avatar?: string;
}

export type UserRole = 'ADMIN' | 'HR' | 'HOD' | 'LM' | 'EMP';

// User Management Types
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  name: string;
  phone?: string;
  role: UserRole;
  title?: string;
  avatar?: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  phone?: string;
  role?: UserRole;
  title?: string;
  avatar?: string;
}

// Employee Types
export interface ApiEmployee {
  employee_id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: string;
  position: string;
  managerial_level: string;
  status: string;
  company_name: string;
  department: string[];
  join_date: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  company_id: string;
}

export type ManagerialLevel = 'Individual Contributor' | 'Supervisory' | 'Middle Management';
export type EmployeeStatus = 'Active' | 'Inactive';

export interface CreateEmployeeRequest {
  user_data: {
    username: string;
    email: string;
    password: string;
    role: string;
    name: string;
    avatar?: string;
    first_name: string;
    last_name: string;
    title?: string;
    phone?: string;
  };
  company_id: string;
  departments_ids: string[];
  managerial_level: string;
  status: string;
  join_date: string;
}

export interface UpdateEmployeeRequest {
  user_data?: {
    username?: string;
    email?: string;
    password?: string;
    role?: string;
    name?: string;
    avatar?: string;
    first_name?: string;
    last_name?: string;
    title?: string;
    phone?: string;
  };
  company_id?: string;
  departments_ids?: string[];
  managerial_level?: string;
  status?: string;
  join_date?: string;
}

// Company Types
export interface ApiCompany {
  company_id: string;
  name: string;
  industry?: string;
  size?: CompanySize;
  description?: string;
  website?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export type CompanySize = 'SMALL' | 'MEDIUM' | 'LARGE';

export interface CreateCompanyRequest {
  name: string;
  industry?: string;
  size?: CompanySize;
  description?: string;
  website?: string;
  address?: string;
}

// Department Types
export interface ApiDepartment {
  department_id: string;
  name: string;
  employee_count?: number;
  company: string;
  manager?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDepartmentRequest {
  name: string;
  company_id: string;
  manager?: string;
}

export interface UpdateDepartmentRequest {
  name?: string;
  employee_count?: number;
  manager?: string;
}

// Evaluation Types
export interface ApiEvaluation {
  id: string;
  employee_id: string;
  type: EvaluationType;
  status: EvaluationStatus;
  period: string;
  score?: number;
  reviewer_id?: string;
  objectives?: ApiObjective[];
  created_at: string;
  updated_at: string;
}

// Extended evaluation interface that matches the actual API response
export interface ApiEvaluationResponse {
  evaluation_id: string;
  employee: string;
  employee_id: string;
  type: EvaluationType;
  status: EvaluationStatus;
  score: string;
  reviewer: string;
  reviewer_id: string;
  period: string;
  created_at: string;
  updated_at: string;
}

export type EvaluationType = 'Annual' | 'Quarterly' | 'Optional';
export type EvaluationStatus = 
  | 'Draft' 
  | 'Pending HoD Approval' 
  | 'Pending HR Approval' 
  | 'Employee Review' 
  | 'Approved' 
  | 'Rejected' 
  | 'Completed';

export interface CreateEvaluationRequest {
  employee_id: string;
  type: EvaluationType;
  status: EvaluationStatus;
  period: string;
  score?: number;
}

export interface UpdateEvaluationRequest {
  status?: EvaluationStatus;
  score?: number;
  objectives?: CreateObjectiveRequest[];
  reviewer_id?: string;
}

// Objective Types
export interface ApiObjective {
  objective_id: string;
  evaluation_id: string;
  employee_id: string;
  title: string;
  description: string;
  target: number;
  achieved: number;
  weight: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export type ObjectiveStatus = 'Not started' | 'In-progress' | 'Completed';

export interface CreateObjectiveRequest {
  title: string;
  description: string;
  weight: number;
  target?: number;
  achieved?: number;
}

// Competency Types
export interface ApiCompetency {
  competence_id: string;
  employee_id: string;
  evaluation_id?: string;
  name: string;
  category: string;
  required_level: number;
  actual_level: number;
  weight: number;
  description: string;
  created_at: string;
  updated_at: string;
}

export type CompetencyCategory = 'Core' | 'Leadership' | 'Functional';

export interface CreateCompetencyRequest {
  employee_id: string;
  evaluation_id?: string;
  name: string;
  category: string;
  required_level: number;
  actual_level: number;
  weight: number;
  description: string;
}

export interface UpdateCompetencyRequest {
  name?: string;
  category?: string;
  required_level?: number;
  actual_level?: number;
  weight?: number;
  description?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data(data: boolean): unknown;
  data: boolean;
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

// Error Types
export interface ApiError {
  message: string;
  status: number;
  details?: Record<string, string[]>;
}

// Request Configuration
export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
}

// Auth Headers
export interface AuthHeaders {
  Authorization: string;
  'Content-Type': string;
}

// Query Parameters
export interface EmployeeQueryParams {
  company?: string;
  department?: string;
  status?: EmployeeStatus;
  role?: UserRole;
  page?: number;
  page_size?: number;
}

export interface DepartmentQueryParams {
  company?: string;
  page?: number;
  page_size?: number;
}

export interface EvaluationQueryParams {
  employee_id?: string;
  type?: EvaluationType;
  status?: EvaluationStatus;
  period?: string;
  page?: number;
  page_size?: number;
}

// Weights Configuration Types
export type WeightsConfigurationLevel = 'IC' | 'SUPERVISORY' | 'MIDDLE';

export interface WeightsConfiguration {
  level_name: string;
  core_weight: number;
  leadership_weight: number;
  functional_weight: number;
  competency_weight: number;
  objective_weight: number;
  scoring_rules?: ScoringRule[];
  created_at?: string;
  updated_at?: string;
}

export interface ScoringRule {
  min_score: number;
  max_score: number;
  grade: string;
  description: string;
}

export interface UpdateWeightsConfigurationRequest {
  core_weight: number;
  leadership_weight: number;
  functional_weight: number;
  competency_weight: number;
  objective_weight: number;
  scoring_rules: ScoringRule[];
}