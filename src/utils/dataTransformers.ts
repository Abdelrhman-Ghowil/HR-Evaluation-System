// Data transformation utilities for type-safe conversions

import { Employee, EmployeeInput, Evaluation, EvaluationInput } from '../types/shared';

/**
 * Safely converts string ID to number with validation
 * For UUID strings, we'll use a hash-based approach to generate a numeric ID
 */
export const safeParseId = (id: string | number): number => {
  if (typeof id === 'number') return id;
  
  // First try to parse as integer (for backward compatibility)
  const parsed = parseInt(id, 10);
  if (!isNaN(parsed)) {
    return parsed;
  }
  
  // If it's a UUID or other string format, generate a hash-based numeric ID
  if (typeof id === 'string' && id.trim()) {
    // Simple hash function to convert string to number
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  throw new Error(`Invalid ID format: ${id}`);
};

/**
 * Transforms EmployeeInput to Employee for EvaluationDetails component
 */
export const transformEmployeeForEvaluation = (employeeInput: EmployeeInput): Employee => {
  try {
    return {
      id: employeeInput.id, // Keep as string since we updated the Employee interface
      name: employeeInput.name,
      position: employeeInput.position,
      department: employeeInput.department,
      email: employeeInput.email,
      phone: employeeInput.phone,
      hire_date: employeeInput.joinDate,
      status: employeeInput.status
    };
  } catch (error) {
    console.error('Error transforming employee data:', error);
    throw new Error('Failed to transform employee data for evaluation');
  }
};

/**
 * Transforms EvaluationInput to Evaluation for EvaluationDetails component
 */
export const transformEvaluationForDetails = (evaluationInput: EvaluationInput, employeeId: string): Evaluation => {
  try {
    return {
      id: evaluationInput.id,
      employee_id: employeeId,
      type: evaluationInput.type,
      period: evaluationInput.period,
      status: evaluationInput.status,
      reviewer_id: evaluationInput.reviewer_id,
      reviewer: evaluationInput.reviewer,
      date: evaluationInput.date,
      score: evaluationInput.score  
    };
  } catch (error) {
    console.error('Error transforming evaluation data:', error);
    throw new Error('Failed to transform evaluation data');
  }
};

/**
 * Validates required fields for employee data
 */
export const validateEmployeeData = (employee: EmployeeInput): string[] => {
  const errors: string[] = [];
  
  if (!employee.id?.trim()) errors.push('Employee ID is required');
  if (!employee.name?.trim()) errors.push('Employee name is required');
  if (!employee.email?.trim()) errors.push('Employee email is required');
  if (!employee.position?.trim()) errors.push('Employee position is required');
  if (!employee.department?.trim()) errors.push('Employee department is required');
  if (!employee.joinDate) errors.push('Employee join date is required');
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (employee.email && !emailRegex.test(employee.email)) {
    errors.push('Invalid email format');
  }
  
  return errors;
};

/**
 * Validates required fields for evaluation data
 */
export const validateEvaluationData = (evaluation: EvaluationInput): string[] => {
  const errors: string[] = [];
  
  if (!evaluation.id?.trim()) errors.push('Evaluation ID is required');
  if (!evaluation.type?.trim()) errors.push('Evaluation type is required');
  if (!evaluation.period?.trim()) errors.push('Evaluation period is required');
  if (!evaluation.status) errors.push('Evaluation status is required');
  
  return errors;
};

/**
 * Safe data transformation with error handling
 */
export const safeTransformData = <T, R>(
  data: T,
  transformer: (data: T) => R,
  errorMessage: string
): { success: true; data: R } | { success: false; error: string } => {
  try {
    const result = transformer(data);
    return { success: true, data: result };
  } catch (error) {
    console.error(errorMessage, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : errorMessage 
    };
  }
};

/**
 * Formats date for display in dd/mm/yyyy format
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Formats phone number with country code
 */
export const formatPhoneNumber = (phone: string, countryCode?: string): string => {
  const cleanPhone = phone?.replace(/[^0-9]/g, '') || '';
  const code = countryCode || '+1';
  return `${code} ${cleanPhone}`;
};

/**
 * Parses a full phone number into country code and phone number
 * Assumes format like "+966123456789" or "966123456789"
 */
export const parsePhoneNumber = (fullPhone: string): { countryCode: string; phone: string } => {
  if (!fullPhone) {
    return { countryCode: '+1', phone: '' };
  }

  // Remove any non-digit characters except +
  const cleaned = fullPhone.replace(/[^+0-9]/g, '');
  
  // If it starts with +, extract country code
  if (cleaned.startsWith('+')) {
    // Common country codes and their lengths
    const countryCodePatterns = [
      { code: '+966', length: 4 }, // Saudi Arabia
      { code: '+20', length: 3 },  // Egypt
      { code: '+1', length: 2 },   // US/Canada
      { code: '+44', length: 3 },  // UK
      { code: '+971', length: 4 }, // UAE
    ];
    
    for (const pattern of countryCodePatterns) {
      if (cleaned.startsWith(pattern.code)) {
        return {
          countryCode: pattern.code,
          phone: cleaned.substring(pattern.length)
        };
      }
    }
    
    // Fallback: assume first 2-4 digits are country code
    const countryCode = cleaned.substring(0, Math.min(4, cleaned.length - 7));
    const phone = cleaned.substring(countryCode.length);
    return { countryCode, phone };
  }
  
  // If no +, try to detect common country codes
  if (cleaned.startsWith('966')) {
    return { countryCode: '+966', phone: cleaned.substring(3) };
  }
  if (cleaned.startsWith('20')) {
    return { countryCode: '+20', phone: cleaned.substring(2) };
  }
  
  // Default to +1 if no country code detected
  return { countryCode: '+1', phone: cleaned };
};

/**
 * Generates WhatsApp URL for phone number
 */
export const generateWhatsAppUrl = (phone: string, countryCode?: string): string => {
  const cleanPhone = phone?.replace(/[^0-9]/g, '') || '';
  const code = (countryCode || '+1').replace('+', '');
  return `https://wa.me/${code}${cleanPhone}`;
};