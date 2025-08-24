// Shared type definitions for the HR Evaluation system

export interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  hire_date: string;
  status: 'Active' | 'Inactive';
}

export interface EmployeeInput {
  id: string;
  name: string;
  email: string;
  phone: string;
  countryCode?: string;
  avatar: string;
  department: string;
  position: string;
  role: 'ADMIN' | 'HR' | 'HOD' | 'LM' | 'EMP';
  managerialLevel: 'Individual Contributor' | 'Supervisory' | 'Middle Management';
  status: 'Active' | 'Inactive';
  companyName: string;
  joinDate: string;
}

export interface Evaluation {
  id: string;
  employee_id: string;
  type: string;
  period: string;
  status: 'Draft' | 'Pending HoD Approval' | 'Pending HR Approval' | 'Employee Review' | 'Approved' | 'Rejected' | 'Completed';
  reviewer_id?: number;
  date: string;
  score?: number;
}

export interface EvaluationInput {
  id: string;
  type: string;
  status: 'Draft' | 'Pending HoD Approval' | 'Pending HR Approval' | 'Employee Review' | 'Approved' | 'Rejected' | 'Completed';
  score?: number;
  date: string;
  reviewer: string;
  period: string;
  reviewer_id?: number;
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