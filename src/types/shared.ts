// Shared type definitions for the HR Evaluation system

export interface Employee {
  id: string;
  employee_id: string; 
  name: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  hire_date: string;
  status: 'Active' | 'Inactive';
  warnings: string[];
  warnings_count: number;
}

export interface EmployeeInput {
  id: string;
  employee_id: string; 
  company_id: string;
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  warnings: string[];
  warningsCount: number;
  avatar: string;
  department: string;
  position: string;
  role: 'ADMIN' | 'HR' | 'HOD' | 'LM' | 'EMP';
  managerialLevel: 'Individual Contributor' | 'Supervisory' | 'Middle Management' | 'Executive';
  status: 'Active' | 'Inactive';
  companyName: string;
  orgPath: string;
  directManager: string;
  joinDate: string;
  jobType: string;
  location: string;
  branch: string;
  gender: string;
}

export interface Evaluation {
  id: string;
  evaluation_id: string;
  employee_id: string;
  type: string;
  period: string;
  status: 'Draft' | 'Pending HoD Approval' | 'Pending HR Approval' | 'Employee Review' | 'Approved' | 'Rejected' | 'Completed';
  reviewer_id?: string;
  reviewer?: string;
  date: string;
  score?: number;
  objectives_score?: number;
  competencies_score?: number;
}

export interface EvaluationInput {
  id: string;
  evaluation_id: string;
  type: string;
  status: 'Draft' | 'Pending HoD Approval' | 'Pending HR Approval' | 'Employee Review' | 'Approved' | 'Rejected' | 'Completed' | 'Self Evaluation' ;
  score?: number;
  date: string;
  reviewer: string;
  reviewer_id?: string;
  period: string;
  objectives_score?: number;
  competencies_score?: number;
}

export interface Objective {
  id: number;
  employee_id: string;
  evaluation_id: string;
  title: string;
  description: string;
  target: number;
  achieved: number;
  weight: number;
  status: 'completed' | 'in-progress' | 'not-started';
}

export interface Competency {
  id: number;
  employee_id: string;
  evaluation_id: string;
  name: string;
  category: 'Core' | 'Leadership' | 'Functional';
  required_level: number;
  actual_level: number;
  weight: number;
  description: string;
}

export interface Reviewer {
  id: string;
  name: string;
  role: 'LM' | 'HOD' | 'HR';
}

// Utility types for form handling
export type ObjectiveFormData = Partial<Omit<Objective, 'id'>>;
export type CompetencyFormData = Partial<Omit<Competency, 'id'>>;

// Status transition types
export type EvaluationStatus = Evaluation['status'];
export type ObjectiveStatus = Objective['status'];
export type CompetencyCategory = Competency['category'];

// Validation error types
export interface ValidationErrors {
  [key: string]: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form state types
export interface FormState<T> {
  data: T;
  errors: ValidationErrors;
  isSubmitting: boolean;
  isDirty: boolean;
}
