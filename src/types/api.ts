// API Types for HR Evaluation System Backend Integration

// Authentication Types
export interface LoginRequest {
  email?: string;
  username?: string;
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
  created_at?: string;
  updated_at?: string;
}

export type UserRole = 'ADMIN' | 'HR' | 'HOD' | 'LM' | 'EMP';

// My Profile API Response Types
export interface ApiMyProfile {
  // Basic info
  username: string;
  email: string;
  name: string;
  
  // Contact details
  country_code: string;
  phone: string;
  avatar?: string;
  gender: string;
  
  // Employment details
  role: UserRole;
  position: string;
  managerial_level: string;
  
  // Status info
  status: string;
  is_default_password: boolean;
  password_last_changed?: string;
  
  // Organizational info
  employee_code: string;
  job_type: string;
  location: string;
  branch: string;
  
  // Company details
  join_date: string;
  company_name: string;
  department: string;
  direct_manager: string;
  org_path: string;
}

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
  employee_code: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  country_code: string;
  warnings: string[];
  warnings_count: number;
  avatar: string;
  role: string;
  position: string;
  managerial_level: string;
  status: string;
  company_name: string;
  department: string;
  org_path: string;
  direct_manager: string;
  join_date: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  company_id: string;
  job_type: string;
  location: string;
  branch: string;
  gender:string;
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
    position?: string;
    phone?: string;
    gender?: string;
  };
  employee_code: string;
  country_code: string;
  warnings?: string[];
  warnings_count?: number;
  company_id: string;
  department_id: string;
  managerial_level: string;
  status: string;
  org_path?: string;
  direct_manager?: string;
  join_date: string;
  job_type: string;
  location: string;
  branch: string;
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
    position?: string;
    phone?: string;
    gender?: string;
  };
  employee_code?: string;
  country_code?: string;
  warnings?: string[];
  warnings_count?: number;
  company_id?: string;
  department_id?: string;
  managerial_level?: string;
  status?: string;
  org_path?: string;
  direct_manager?: string;
  join_date?: string;
  job_type?: string;
  location?: string;
  branch?: string;
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

export type CompanySize = 'Small' | 'Medium' | 'Large';

export interface CreateCompanyRequest {
  name: string;
  industry?: string;
  size?: CompanySize;
  address?: string;
}

export interface UpdateCompanyRequest {
  name?: string;
  industry?: string;
  size?: CompanySize;
  address?: string;
}

// Department Types
export interface ApiDepartment {
  department_id: string;
  name: string;
  employee_count?: number;
  company: string;
  company_id?: string; // Add company_id field that might be in API response
  manager?: string;
  manager_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDepartmentRequest {
  name: string;
  company_id: string;
  manager_id?: string;
}

export interface UpdateDepartmentRequest {
  name?: string;
  employee_count?: number;
  manager_id?: string;
}

// Placement Types
export interface ApiPlacement {
  placement_id: string;
  employee_id: string;
  employee_name: string;
  company_id: string;
  company_name: string;
  department_id: string;
  department_name: string;
  sub_department_id: string | null;
  section_id: string | null;
  sub_section_id: string | null;
  sub_department_name: string | null;
  section_name: string | null;
  sub_section_name: string | null;
  assigned_at: string;
}

export interface CreatePlacementRequest {
  employee_id: string;
  company_id: string;
  department_id: string;
  sub_department_id?: string;
  section_id?: string;
  sub_section_id?: string;
}

// Evaluation Types
export interface ApiEvaluation {
  // id: string;
  evaluation_id: string
  employee_id: string;
  type: EvaluationType;
  status: EvaluationStatus;
  period: string;
  score?: number;
  reviewer_id?: string;
  reviewer?: string;
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

export interface ApiActivityLog {
  activitylog_id: string;
  evaluation_id: string;
  activitystatus: string;
  action: string;
  actor_id: string;
  actor_name: string;
  actor_role: UserRole;
  comment?: string;
  is_rejection: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivityLogQueryParams {
  evaluation_id?: string;
}

export interface CreateActivityLogRequest {
  evaluation_id: string;
  activitystatus: string;
  action: string;
  comment?: string;
  is_rejection: boolean;
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
  evaluation_id: string;
  title: string;
  description: string;
  target: number;
  achieved: number;
  weight: number;
  status: string;
}

export interface UpdateObjectiveRequest {
  title?: string;
  description?: string;
  target?: number;
  achieved?: number;
  weight?: number;
  status?: string;
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
  company_id?: string;
  department?: string;
  status?: EmployeeStatus;
  role?: UserRole | string; // Allow string for multiple roles like "LM,HOD,HR"
  page?: number;
  page_size?: number;
}

export interface DepartmentQueryParams {
  company_id?: string;

}

export interface EvaluationQueryParams {
  employee_id?: string;
  type?: EvaluationType;
  status?: EvaluationStatus;
  period?: string;
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
}

// Organizational Structure Types
export interface ApiSubDepartment {
  sub_department_id: string;
  name: string;
  employee_count: number;
  manager?: string;
  manager_id?: string;
  department: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSubDepartmentRequest {
  name: string;
  department_id: string;
  manager: string;
}

export interface UpdateSubDepartmentRequest {
  name?: string;
  department_id?: string;
  manager_id?: string;
}

export interface ApiSection {
  section_id: string;
  department_id: string;
  name: string;
  employee_count: number;
  manager?: string;
  manager_id?: string;
  sub_department: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSectionRequest {
  name: string;
  sub_department_id: string;
  manager_id?: string;
}

export interface UpdateSectionRequest {
  name?: string;
  sub_department_id?: string;
  manager_id?: string;
}

export interface ApiSubSection {
  sub_section_id: string;
  department_id: string;
  name: string;
  employee_count: number;
  manager?: string;
  manager_id?: string;
  section: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSubSectionRequest {
  name: string;
  section_id: string;
  manager_id?: string;
}

export interface UpdateSubSectionRequest {
  name?: string;
  section_id?: string;
  manager_id?: string;
}

export interface SubDepartmentQueryParams {
  department?: string;
  page?: number;
  page_size?: number;
}

export interface SectionQueryParams {
  sub_department?: string;
  page?: number;
  page_size?: number;
}

export interface SubSectionQueryParams {
  section?: string;
  page?: number;
  page_size?: number;
}

// Import Response Types
export interface ImportResponse {
  status: 'imported';
  created: number;
  updated: number;
  validated_count?: number;
  to_create?: number;
  to_update?: number;
  message?: string;
  errors?: ApiError[];
}
