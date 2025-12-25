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
      score: evaluationInput.score,
      objectives_score: evaluationInput.objectives_score,
      competencies_score: evaluationInput.competencies_score
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
  const code = (countryCode || '+20').replace('+', '');
  return `https://wa.me/${code}${cleanPhone}`;
};

export const formatPercent = (value: unknown, maxDecimals: number = 1): string => {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '0%';

  const rounded = Number(n.toFixed(maxDecimals));
  const isInt = Math.abs(rounded - Math.round(rounded)) < 1e-9;
  const normalized = isInt ? Math.round(rounded) : rounded;

  const s = isInt ? String(normalized) : normalized.toFixed(maxDecimals).replace(/\.?0+$/, '');
  return `${s}%`;
};

export const toUsernameSlug = (value: string): string => {
  return (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
};

export const buildUsernameBaseFromName = (fullName: string): string => {
  const cleanName = (fullName || '').trim().replace(/\s+/g, ' ');
  if (!cleanName) return '';

  const parts = cleanName.split(' ').filter(Boolean);
  const firstName = parts[0] || '';
  const lastName = parts.length > 1 ? parts[parts.length - 1] : '';

  const firstInitial = toUsernameSlug(firstName).charAt(0);
  const cleanLastName = toUsernameSlug(lastName);

  const base = parts.length > 1 ? `${firstInitial}${cleanLastName}` : toUsernameSlug(firstName);
  const normalized = base.length >= 2 ? base : toUsernameSlug(firstName).slice(0, 8);
  return normalized.slice(0, 18) || 'user';
};

export const generateUniqueUsernameFromName = (
  fullName: string,
  existingUsernames: Iterable<string>,
  preferredUsername?: string
): string => {
  const existing = new Set(
    Array.from(existingUsernames || []).map((u) => toUsernameSlug(String(u))).filter(Boolean)
  );

  const preferred = preferredUsername ? toUsernameSlug(preferredUsername) : '';
  const preferredSuffixMatch = preferred.match(/(\d{2})$/);
  const preferredSuffix = preferredSuffixMatch ? preferredSuffixMatch[1] : undefined;
  const preferredBase = preferred ? preferred.replace(/\d{2}$/, '') : '';

  const cleanName = (fullName || '').trim().replace(/\s+/g, ' ');
  const parts = cleanName ? cleanName.split(' ').filter(Boolean) : [];
  const first = parts[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1] : '';
  const firstSlug = toUsernameSlug(first);
  const lastSlug = toUsernameSlug(last);

  const baseCandidates = [
    preferredBase,
    buildUsernameBaseFromName(fullName),
    parts.length > 1 ? `${firstSlug.slice(0, 2)}${lastSlug}` : '',
    parts.length > 1 ? `${firstSlug}${lastSlug}` : '',
    firstSlug
  ]
    .map((b) => (b ? toUsernameSlug(b).slice(0, 18) : ''))
    .filter(Boolean);

  const suffixes = Array.from({ length: 100 }, (_, i) => String(i).padStart(2, '0'));
  for (let i = suffixes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [suffixes[i], suffixes[j]] = [suffixes[j], suffixes[i]];
  }
  if (preferredSuffix) {
    const idx = suffixes.indexOf(preferredSuffix);
    if (idx > 0) {
      suffixes.splice(idx, 1);
      suffixes.unshift(preferredSuffix);
    }
  }

  for (const base of baseCandidates) {
    for (const suffix of suffixes) {
      const candidate = `${base}${suffix}`;
      if (!existing.has(candidate)) return candidate;
    }
  }

  const fallbackBase = baseCandidates[0] || buildUsernameBaseFromName(fullName) || 'user';
  return `${fallbackBase}${suffixes[0] || '00'}`;
};
