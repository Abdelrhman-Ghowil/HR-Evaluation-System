
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Plus, Edit, Mail, Phone, X, Search, Filter, Trash2, FileSpreadsheet, Upload, Loader2, CheckCircle, AlertCircle, Copy, Download } from 'lucide-react';
import EmployeeDetails from './EmployeeDetails';
import { apiService } from '@/services/api';
import { useEmployees } from '@/hooks/useApi';
import { ApiEmployee, ApiDepartment, ApiCompany, CreateEmployeeRequest, ImportResponse, ApiError } from '@/types/api';
import { parsePhoneNumber, formatDate } from '@/utils/dataTransformers';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '@/hooks/use-toast';


interface Employee {
  id: string;
  employee_id: string;
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
  managerialLevel: 'Individual Contributor' | 'Supervisory' | 'Middle Management';
  status: 'Active' | 'Inactive';
  companyName: string;
  orgPath: string;
  directManager: string;
  joinDate: string;
  company_id: string;
  department_id: string;
  user_id: string;
  jobType: string;
  location: string;
  branch: string;
  gender?: string;
}

const EmployeeList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const canImport = user?.role === 'admin' || user?.role === 'hr';
  const canAddEmployee = user?.role === 'admin' || user?.role === 'hr';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [companies, setCompanies] = useState<ApiCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefreshing, setAutoRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createErrorItems, setCreateErrorItems] = useState<string[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editErrorItems, setEditErrorItems] = useState<string[]>([]);
  const [originalEmployee, setOriginalEmployee] = useState<Employee | null>(null);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [editValidationErrors, setEditValidationErrors] = useState<{[key: string]: string}>({});
  const [statusUpdatingEmployees, setStatusUpdatingEmployees] = useState<Set<string>>(new Set());
  const [lastCreatedEmployeeId, setLastCreatedEmployeeId] = useState<string | null>(null);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+966',
    employeeCode: '',
    warnings: [] as string[],
    warnings_count: 0,
    department: '',
    departmentId: '',
    position: '',
    role: 'EMP' as 'ADMIN' | 'HR' | 'HOD' | 'LM' | 'EMP',
    managerialLevel: 'Individual Contributor',
    status: 'Active' as 'Active' | 'Inactive',
    companyName: 'Ninja',
    companyId: '',
    directManager: '',
    joinDate: new Date().toISOString().split('T')[0],
    jobType: 'Full-time',
    location: '',
    branch: 'Office',
    gender: '',
    username: '',
    password: 'Password123',
    firstName: '',
    lastName: ''
  });

  // Import functionality state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResponse | null>(null);
  const [errorView, setErrorView] = useState<'summary' | 'fields' | 'rows' | 'raw'>('summary');
  const [errorFilter, setErrorFilter] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [showImportDetails, setShowImportDetails] = useState(false);
  React.useEffect(() => {
    if (!isAddModalOpen) return;
    const keys = Object.keys(validationErrors || {});
    if (keys.length === 0) return;
    const map: Record<string, string> = {
      name: 'name',
      email: 'email',
      phone: 'phone',
      companyName: 'companyName',
      department: 'department',
      position: 'position',
      employeeCode: 'employeeCode',
      joinDate: 'joinDate',
    };
    const k = keys[0];
    const id = map[k] || k;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (el as HTMLElement).focus();
    }
  }, [validationErrors, isAddModalOpen]);

  React.useEffect(() => {
    if (!isEditModalOpen) return;
    const keys = Object.keys(editValidationErrors || {});
    if (keys.length === 0) return;
    const map: Record<string, string> = {
      name: 'edit-name',
      email: 'edit-email',
      phone: 'edit-phone',
      companyName: 'edit-companyName',
      position: 'edit-position',
      employeeCode: 'edit-employeeCode',
      joinDate: 'edit-joinDate',
    };
    const k = keys[0];
    const id = map[k] || k;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (el as HTMLElement).focus();
    }
  }, [editValidationErrors, isEditModalOpen]);

  // React Query: Employees caching
  const employeeQueryParams = React.useMemo(() => {
    const apiRole = user?.api_role;
    if (apiRole === 'HOD') return { role: 'EMP,LM' };
    if (apiRole === 'LM') return { role: 'EMP' };
    return undefined;
  }, [user?.api_role]);
  const {
    data: employeesData,
    isLoading: employeesQueryLoading,
    error: employeesQueryError,
    refetch: refetchEmployees,
  } = useEmployees(employeeQueryParams);

  // Map query error to local error UI
  useEffect(() => {
    if (employeesQueryError) {
      const err = employeesQueryError as unknown as { message?: string };
      setLastError(err?.message || 'Failed to load employee data');
    }
  }, [employeesQueryError]);

  // Derive local employees state from cached query data (handles array or paginated)
  useEffect(() => {
    if (!employeesData) return;

    let apiEmployees: ApiEmployee[] = [];
    const anyData = employeesData as unknown as { results?: ApiEmployee[] } | ApiEmployee[];
    if (Array.isArray(anyData)) {
      apiEmployees = anyData as ApiEmployee[];
    } else if (anyData && Array.isArray((anyData as { results?: ApiEmployee[] }).results)) {
      apiEmployees = (anyData as { results?: ApiEmployee[] }).results || [];
    }

    const transformed = apiEmployees.map(transformApiEmployee);
    setEmployees(transformed);
  }, [employeesData]);

  // Drive loading UI from React Query state
  useEffect(() => {
    setLoading(!!employeesQueryLoading);
  }, [employeesQueryLoading]);

  // Persist selected employee in URL so refresh keeps user on profile
  const handleOpenEmployeeDetails = React.useCallback((employee: Employee) => {
    setSelectedEmployee(employee);
    try {
      const url = new URL(window.location.href);
      const idToUse = employee.employee_id || employee.id;
      url.searchParams.set('employee', String(idToUse));
      window.history.replaceState(null, '', url.toString());
    } catch {}
  }, []);

  const handleBackToList = React.useCallback(() => {
    setSelectedEmployee(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('employee');
      window.history.replaceState(null, '', url.toString());
    } catch {}
  }, []);

  // Rehydrate selected employee from URL after data loads (supports refresh/deep link)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const eid = params.get('employee');
      if (eid && !selectedEmployee && employees && employees.length > 0) {
        const match = employees.find(e => String(e.employee_id) === eid || String(e.id) === eid);
        if (match) {
          setSelectedEmployee(match);
        }
      }
    } catch {}
  }, [employees, selectedEmployee]);

  // Keep state in sync with browser navigation (back/forward)
  useEffect(() => {
    const onPopState = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const eid = params.get('employee');
        if (!eid) {
          setSelectedEmployee(null);
        } else if (employees && employees.length > 0) {
          const match = employees.find(e => String(e.employee_id) === eid || String(e.id) === eid);
          setSelectedEmployee(match || null);
        }
      } 
      catch {}
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [employees]);

  // Build a map of field -> messages from nested error.details
  const fieldErrors = React.useMemo(() => {
    const map: Record<string, string[]> = {};
    (importResults?.errors || []).forEach((err) => {
      const walk = (obj: any, base = '') => {
        if (!obj || typeof obj !== 'object') return;
        Object.entries(obj).forEach(([k, v]) => {
          const path = base ? `${base}.${k}` : k;
          if (Array.isArray(v)) {
            map[path] = (map[path] || []).concat(v.map((x) => String(x)));
          } else if (typeof v === 'object' && v !== null) {
            walk(v, path);
          } else {
            map[path] = (map[path] || []).concat(String(v));
          }
        });
      };
      if (err && typeof err === 'object' && (err as ApiError).details) {
        walk((err as ApiError).details as Record<string, any>);
      } else if (err && typeof err === 'object' && (err as ApiError).message) {
        map['general'] = (map['general'] || []).concat((err as ApiError).message);
      } else if (typeof err === 'string') {
        map['general'] = (map['general'] || []).concat(String(err));
      }
    });
    return map;
  }, [importResults?.errors]);

  // Build user-friendly row-level messages: "Row X – Field: Message"
  const rowErrors = React.useMemo(() => {
    type RowMsg = { row: number; field?: string; message: string };
    const list: RowMsg[] = [];
    const errs = importResults?.errors || [];

    const isRowKey = (key: string) => {
      return /^(row[_\s-]?\d+|\d+)$/.test(key.trim());
    };
    const parseRowNumber = (key: string | number): number => {
      if (typeof key === 'number') return key;
      const m = String(key).match(/\d+/);
      return m ? parseInt(m[0], 10) : 0;
    };
    const toMessages = (value: any): string[] => {
      if (!value) return [];
      if (Array.isArray(value)) return value.map((v) => String(v));
      if (typeof value === 'object') {
        if ('message' in value && typeof value.message === 'string') return [value.message];
        // Flatten nested values
        const msgs: string[] = [];
        Object.values(value).forEach((v) => msgs.push(...toMessages(v)));
        return msgs.length ? msgs : [JSON.stringify(value)];
      }
      return [String(value)];
    };

    errs.forEach((err) => {
      const details = (err as ApiError)?.details as any;
      if (!details || typeof details !== 'object') {
        // Fallback: attach general message without row
        const msg = (err as ApiError)?.message || (typeof err === 'string' ? err : 'Import error');
        if (msg) list.push({ row: 0, message: String(msg) });
        return;
      }

      // Shape 1: { rows: { 1: { field: [msg] }, 2: {...} } }
      const rowBuckets = details.rows || details.by_row || details.row_errors || null;
      if (rowBuckets && typeof rowBuckets === 'object') {
        Object.entries(rowBuckets).forEach(([rowKey, rowVal]) => {
          const rowNum = parseRowNumber(rowKey);
          if (rowVal && typeof rowVal === 'object' && !Array.isArray(rowVal)) {
            Object.entries(rowVal).forEach(([field, val]) => {
              const msgs = toMessages(val);
              msgs.forEach((m) => list.push({ row: rowNum, field, message: m }));
            });
          } else {
            const msgs = toMessages(rowVal);
            msgs.forEach((m) => list.push({ row: rowNum, message: m }));
          }
        });
        return; // handled
      }

      // Shape 2: top-level row keys: { row_1: { field: [msg] }, row_2: {...} }
      const topEntries = Object.entries(details);
      const topRowLike = topEntries.filter(([k]) => isRowKey(k));
      if (topRowLike.length > 0) {
        topRowLike.forEach(([rowKey, rowVal]) => {
          const rowNum = parseRowNumber(rowKey);
          if (rowVal && typeof rowVal === 'object' && !Array.isArray(rowVal)) {
            Object.entries(rowVal).forEach(([field, val]) => {
              const msgs = toMessages(val);
              msgs.forEach((m) => list.push({ row: rowNum, field, message: m }));
            });
          } else {
            const msgs = toMessages(rowVal);
            msgs.forEach((m) => list.push({ row: rowNum, message: m }));
          }
        });
        return; // handled
      }

      // Shape 3: field -> row/object mapping: { department: { 1: [msg] }, email: { 2: [msg] } }
      const fieldRowMapCandidates = topEntries.filter(([, v]) => v && typeof v === 'object');
      if (fieldRowMapCandidates.length > 0) {
        fieldRowMapCandidates.forEach(([field, value]) => {
          if (value && typeof value === 'object') {
            Object.entries(value).forEach(([maybeRow, val]) => {
              if (isRowKey(maybeRow)) {
                const rowNum = parseRowNumber(maybeRow);
                const msgs = toMessages(val);
                msgs.forEach((m) => list.push({ row: rowNum, field, message: m }));
              }
            });
          }
        });
      }
    });

    // Sort by row asc, then field
    return list.sort((a, b) => (a.row - b.row) || String(a.field || '').localeCompare(String(b.field || '')));
  }, [importResults?.errors]);

  const copyErrors = () => {
    try {
      const text = JSON.stringify(importResults?.errors || [], null, 2);
      navigator.clipboard?.writeText(text);
    } catch {}
  };

  const downloadErrors = () => {
    try {
      const text = JSON.stringify(importResults?.errors || [], null, 2);
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'employee-import-errors.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  // Clear auto-filled form data
  const clearAutoFilledData = () => {
    setNewEmployee({
      name: '',
      email: '',
      phone: '',
      countryCode: '+966',
      employeeCode: '',
      warnings: [] as string[],
      warnings_count: 0,
      department: '',
      departmentId: '',
      position: '',
      role: 'EMP',
      managerialLevel: 'Individual Contributor',
      status: 'Active',
      companyName: 'Ninja',
      companyId: '',
      directManager: '',
      joinDate: new Date().toISOString().split('T')[0],
      jobType: 'Full-time',
      location: '',
      branch: 'Office',
      gender: '',
      username: '',
      password: 'Password123',
      firstName: '',
      lastName: ''
    });
    setValidationErrors({});
  };

  // Utility functions for name processing
  const processFullName = (fullName: string) => {
    // Clean and normalize the input
    const cleanName = fullName.trim().replace(/\s+/g, ' ');
    
    if (!cleanName) {
      return { firstName: '', lastName: '', username: '' };
    }

    // Split the name into parts
    const nameParts = cleanName.split(' ').filter(part => part.length > 0);
    
    let firstName = '';
    let lastName = '';
    let username = '';

    if (nameParts.length === 1) {
      // Single word name - use as first name
      firstName = nameParts[0];
      lastName = '';
      // Generate username from first name only
      username = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
    } else if (nameParts.length === 2) {
      // Two words - first and last name
      firstName = nameParts[0];
      lastName = nameParts[1];
      // Generate username: first initial + last name
      const firstInitial = firstName.charAt(0).toLowerCase();
      const cleanLastName = lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
      username = firstInitial + cleanLastName;
    } else {
      // Multiple words - first word as first name, rest as last name
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
      // Generate username: first initial + first word of last name
      const firstInitial = firstName.charAt(0).toLowerCase();
      const lastNameFirstWord = nameParts[1].toLowerCase().replace(/[^a-z0-9]/g, '');
      username = firstInitial + lastNameFirstWord;
    }

    // Ensure username is not empty and has reasonable length
    if (username.length < 2) {
      username = firstName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8);
    }
    
    // Limit username length to 20 characters
    username = username.substring(0, 20);

    return { firstName, lastName, username };
  };

  // Handle name input change with auto-population
  const handleNameChange = (fullName: string) => {
    const { firstName, lastName, username } = processFullName(fullName);
    
    setNewEmployee(prev => ({
      ...prev,
      name: fullName,
      // Only auto-populate if fields are empty or were previously auto-populated
      firstName: prev.firstName === '' || prev.firstName === processFullName(prev.name).firstName ? firstName : prev.firstName,
      lastName: prev.lastName === '' || prev.lastName === processFullName(prev.name).lastName ? lastName : prev.lastName,
      username: prev.username === '' || prev.username === processFullName(prev.name).username ? username : prev.username
    }));
  };





  // Map country code '966.0' to '+966'
  const normalizeCountryCodeValue = (code?: string): string => {
    if (!code) return '';
    const val = String(code).trim();
    if (val === '966.0'||val === '966') return '+966';
    return val;
  };

  // Transform API employee data to local Employee interface
  const transformApiEmployee = (apiEmployee: ApiEmployee): Employee => {
    const { countryCode, phone } = parsePhoneNumber(apiEmployee.phone);
    
    return {
      id: apiEmployee.employee_id,
      employee_id: apiEmployee.employee_id,
      employeeCode: apiEmployee.employee_code,
      name: apiEmployee.name,
      email: apiEmployee.email,
      phone: phone,
      countryCode: normalizeCountryCodeValue(apiEmployee.country_code || countryCode),
      warnings: apiEmployee.warnings || [],
      warningsCount: apiEmployee.warnings_count || 0,
      avatar: apiEmployee.avatar || '/placeholder.svg',
      department: apiEmployee.department && apiEmployee.department.length > 0 ? (Array.isArray(apiEmployee.department) ? apiEmployee.department.join(', ') : apiEmployee.department) : '',
      position: apiEmployee.position,
      role: apiEmployee.role as 'ADMIN' | 'HR' | 'HOD' | 'LM' | 'EMP',
      managerialLevel: apiEmployee.managerial_level as 'Individual Contributor' | 'Supervisory' | 'Middle Management',
      status: apiEmployee.status as 'Active' | 'Inactive',
      companyName: apiEmployee.company_name,
      orgPath: apiEmployee.org_path || '',
      directManager: apiEmployee.direct_manager || '',
      joinDate: apiEmployee.join_date,
      company_id: apiEmployee.company_id,
      department_id: '',
      user_id: apiEmployee.user_id,
      jobType: apiEmployee.job_type || '',
      location: apiEmployee.location || '',
      branch: apiEmployee.branch || '',
      gender: apiEmployee.gender || '',
    };
  };

  // Fetch departments from API
  const fetchDepartments = async (companyId?: string) => {
    try {
      console.log('Fetching departments from API...', companyId ? `for company: ${companyId}` : 'all departments');
      
      let response;
      if (companyId && companyId !== 'all') {
        // Fetch departments for specific company
        response = await apiService.getDepartmentsByCompany(companyId);
      } else {
        // Fetch all departments
        response = await apiService.getDepartments();
      }
      
      console.log('Departments API Response:', response);
      
      // Handle both paginated response and direct array response
      if (response && Array.isArray(response.results)) {
        setDepartments(response.results);
        console.log(`Successfully loaded ${response.results.length} departments from API`);
      } else if (response && Array.isArray(response)) {
        setDepartments(response);
        console.log(`Successfully loaded ${response.length} departments from API`);
      } else {
        console.warn('Unexpected departments API response structure:', response);
        setDepartments([]);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  // File validation function
  const validateFile = (file: File): boolean => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'application/csv' // .csv (alternative MIME type)
    ];
    
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid Excel or CSV file (.xlsx, .xls, or .csv)');
      return false;
    }
    
    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      alert('File size must be less than 50MB');
      return false;
    }
    
    return true;
  };

  // Drag and drop handlers
  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file && validateFile(file)) {
      setSelectedFile(file);
      // Clear previous results and error view when a new file is dropped
      setImportResults(null);
      setErrorView('summary');
      setErrorFilter('');
    }
  }, []);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (validateFile(file)) {
      setSelectedFile(file);
      // Clear previous results and error view when a new file is selected
      setImportResults(null);
      setErrorView('summary');
      setErrorFilter('');
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    // Clear messages and views when file is removed
    setImportResults(null);
    setErrorView('summary');
    setErrorFilter('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle dry run validation
  const handleDryRun = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    try {
      const result = await apiService.importEmployees(selectedFile, true);
      setImportResults(result);
    } catch (error: unknown) {
      console.error('Dry run failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Validation failed. Please try again.';
      const apiErr = error as ApiError;
      const normalizedErrors: ApiError[] = [apiErr];
      setImportResults({  
        status: 'imported',
        created: 0,
        updated: 0,
        message: errorMessage,
        errors: normalizedErrors
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Handle actual import
  const handleActualImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    try {
      const result = await apiService.importEmployees(selectedFile, false);
      setImportResults(result);
      
      if (result.status === 'imported' && (result.created > 0 || result.updated > 0)) {
        await refetchEmployees();
        handleImportModalClose();
        toast({ title: 'Success', description: 'Employees imported successfully.' });
      }
    } catch (error: unknown) {
      console.error('Import failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Import failed. Please try again.';
      const apiErr = error as ApiError;
      const normalizedErrors: ApiError[] = [apiErr];
      setImportResults({
        status: 'imported',
        created: 0,
        updated: 0,
        message: errorMessage,
        errors: normalizedErrors
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Handle import modal close
  const handleImportModalClose = () => {
    setIsImportModalOpen(false);
    setImportResults(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Fetch companies from API
  const fetchCompanies = async () => {
    try {
      console.log('Fetching companies from API...');
      const response = await apiService.getCompanies();
      console.log('Companies API Response:', response);
      
      if (response && Array.isArray(response)) {
        setCompanies(response);
        console.log(`Successfully loaded ${response.length} companies from API`);
      } else {
        console.warn('Unexpected companies API response structure:', response);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  // Employees now load via React Query (useEmployees); legacy fetchEmployees removed.

  // Initialize data - only run once on mount
  useEffect(() => {
    const initializeData = async () => {
      // Fetch all data in parallel for better performance
      await Promise.allSettled([
        fetchDepartments(),
        fetchCompanies()
      ]);
    };
    
    initializeData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // Fetch departments when a specific company is selected (avoid duplicate fetch for 'all')
  useEffect(() => {
    if (selectedCompany && selectedCompany !== 'all') {
      const selectedCompanyData = companies.find(company => company.name === selectedCompany);
      const companyId = selectedCompanyData?.company_id;
      fetchDepartments(companyId);
      setSelectedDepartment('all');
    }
  }, [selectedCompany, companies]);

  // Fetch departments for create form when company is selected
  useEffect(() => {
    if (newEmployee.companyId) {
      fetchDepartments(newEmployee.companyId);
    }
  }, [newEmployee.companyId]);

  // Fetch departments for edit form when company is selected
  useEffect(() => {
    if (editingEmployee?.company_id) {
      fetchDepartments(editingEmployee.company_id);
    }
  }, [editingEmployee?.company_id]);

  // Auto-refresh mechanism when no employees are found
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;
    
    // Only start auto-refresh if not loading and no employees found
    if (!loading && !autoRefreshing && employees.length === 0) {
      console.log('No employees found, starting auto-refresh mechanism...');
      
      // Start auto-refresh every 10 seconds
      refreshInterval = setInterval(async () => {
        console.log('Auto-refreshing employee data...');
        setAutoRefreshing(true);
        try {
          await refetchEmployees();
        } finally {
          setAutoRefreshing(false);
        }
      }, 10000);
    }
    
    // Cleanup interval on unmount or when employees are found
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [loading, autoRefreshing, employees.length]);

  // Removed initialEmployees array - using API data exclusively

  // Handler functions
  const handleToggleStatus = async (employeeId: string) => {
    try {
      // Find the employee to get current data
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee) {
        console.error('Employee not found');
        return;
      }
      
      // Add employee to loading state
      setStatusUpdatingEmployees(prev => new Set(prev).add(employeeId));
      
      // Toggle the status
      const newStatus = employee.status === 'Active' ? 'Inactive' : 'Active';
      
      // Prepare the update payload with only the status change
        const updateData: Partial<CreateEmployeeRequest> = {
          status: newStatus
        };
      
      console.log(`Updating employee ${employeeId} status to ${newStatus}`);
      
      // Call the API to update the employee status
      await apiService.updateEmployee(employeeId, updateData);
      
      console.log('Employee status updated successfully');
      
      // Update the local state
      setEmployees(prev => prev.map(emp => 
        emp.id === employeeId 
          ? { ...emp, status: newStatus }
          : emp
      ));
      
    } catch (error) {
      console.error('Error updating employee status:', error);
       // You can add error handling here, such as showing a toast notification
    } finally {
      // Remove employee from loading state
      setStatusUpdatingEmployees(prev => {
        const newSet = new Set(prev);
        newSet.delete(employeeId);
        return newSet;
      });
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setOriginalEmployee(employee); // Store original data for comparison
    setIsEditModalOpen(true);
  };

  // Navigate to Replacements page with employee prefilled in search
  const goToPlacementForEmployee = () => {
    if (!editingEmployee) return;
    const employeeName = editingEmployee.name || '';
    const target = `/replacements?employee=${encodeURIComponent(employeeName)}`;
    navigate(target);
  };

  const validateEditForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!editingEmployee?.name?.trim()) {
      errors.name = 'Full name is required';
    }
    
    if (!editingEmployee?.email?.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editingEmployee.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!editingEmployee?.phone?.trim()) {
      errors.phone = 'Phone number is required';
    }
    
    // Department is read-only in edit; changes happen via placement dialog
    
    if (!editingEmployee?.position?.trim()) {
      errors.position = 'Position is required';
    }
    
    if (!editingEmployee?.companyName?.trim()) {
      errors.companyName = 'Company name is required';
    }
    
    if (!editingEmployee?.joinDate?.trim()) {
      errors.joinDate = 'Join date is required';
    }
    if (!editingEmployee?.employeeCode?.trim()) {
      errors.employeeCode = 'Employee code is required and unique.';
    }
    
    setEditValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveEdit = async () => {
    if (editingEmployee && originalEmployee && validateEditForm()) {
      try {
        setEditError(null);
        setEditErrorItems([]);
        // Prepare the update payload with only changed fields
        const updateData: Partial<CreateEmployeeRequest> = {};
        
        // Check if user_data fields have changed
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userDataChanges: any = {};
        
        // Only include email if it has changed
        if (editingEmployee.email !== originalEmployee.email) {
          userDataChanges.email = editingEmployee.email;
        }
        
        // Only include username if email has changed (generate from new email)
        if (editingEmployee.email !== originalEmployee.email) {
          userDataChanges.username = editingEmployee.email.split('@')[0];
        }
        
        // Check other user_data fields
        if (editingEmployee.role !== originalEmployee.role) {
          userDataChanges.role = editingEmployee.role;
        }
        
        if (editingEmployee.name !== originalEmployee.name) {
          userDataChanges.name = editingEmployee.name;
          // Split name into first and last name
          const nameParts = editingEmployee.name.split(' ');
          userDataChanges.first_name = nameParts[0] || '';
          userDataChanges.last_name = nameParts.slice(1).join(' ') || '';
        }
        
        
        
        if (editingEmployee.position !== originalEmployee.position) {
          userDataChanges.position = editingEmployee.position;
        }
        
        // Check if phone has changed
        const originalFullPhone = originalEmployee.countryCode ? 
          `${originalEmployee.countryCode}${originalEmployee.phone}` : 
          originalEmployee.phone;
        const newFullPhone = editingEmployee.countryCode ? 
          `${editingEmployee.countryCode}${editingEmployee.phone}` : 
          editingEmployee.phone;
        
        if (newFullPhone !== originalFullPhone) {
          userDataChanges.phone = editingEmployee.phone;
          userDataChanges.countryCode = editingEmployee.countryCode;
        }
        
        // Check if gender has changed
        if (editingEmployee.gender !== originalEmployee.gender) {
          userDataChanges.gender = editingEmployee.gender || '';
        }
        
        // Only add user_data if there are changes
        if (Object.keys(userDataChanges).length > 0) {
          updateData.user_data = userDataChanges;
        }
        
        // Check other top-level fields
        if (editingEmployee.company_id !== originalEmployee.company_id) {
          updateData.company_id = editingEmployee.company_id;
        }
        
        // Check if department has changed
        if (editingEmployee.department !== originalEmployee.department) {
          const deptMatch = departments.find(dept => dept.name === editingEmployee.department);
          if (deptMatch && deptMatch.department_id) {
            updateData.department_id = deptMatch.department_id;
          }
        }
        
        if (editingEmployee.managerialLevel !== originalEmployee.managerialLevel) {
          updateData.managerial_level = editingEmployee.managerialLevel;
        }
        
        if (editingEmployee.status !== originalEmployee.status) {
          updateData.status = editingEmployee.status;
        }
        
        if (editingEmployee.joinDate !== originalEmployee.joinDate) {
          updateData.join_date = editingEmployee.joinDate;
        }
        
        // Check new employee fields
        if (editingEmployee.employeeCode !== originalEmployee.employeeCode) {
          updateData.employee_code = editingEmployee.employeeCode;
        }
        
        if (editingEmployee.directManager !== originalEmployee.directManager) {
          updateData.direct_manager = editingEmployee.directManager;
        }
        
        if (editingEmployee.jobType !== originalEmployee.jobType) {
          updateData.job_type = editingEmployee.jobType;
        }
        
        if (editingEmployee.location !== originalEmployee.location) {
          updateData.location = editingEmployee.location;
        }
        
        if (editingEmployee.branch !== originalEmployee.branch) {
          updateData.branch = editingEmployee.branch;
        }
        
        // Check warnings fields
        if (JSON.stringify(editingEmployee.warnings || []) !== JSON.stringify(originalEmployee.warnings || [])) {
          updateData.warnings = editingEmployee.warnings || [];
        }
        
        if ((editingEmployee.warningsCount || 0) !== (originalEmployee.warningsCount || 0)) {
          updateData.warnings_count = editingEmployee.warningsCount || editingEmployee.warnings?.length || 0;
        }
        
        // Only make API call if there are changes
        if (Object.keys(updateData).length === 0) {
          console.log('No changes detected, skipping API call');
          setIsEditModalOpen(false);
          setEditingEmployee(null);
          setOriginalEmployee(null);
          setEditValidationErrors({});
          return;
        }
        
        console.log('Updating employee with data:', updateData);
        
        // Call the API to update the employee
        const updatedEmployee = await apiService.updateEmployee(editingEmployee.id, updateData);
        
        console.log('Employee updated successfully:', updatedEmployee);
        
        // Update the local state with the updated employee
        setEmployees(prev => prev.map(emp => 
          emp.id === editingEmployee.id ? editingEmployee : emp
        ));
        
        setIsEditModalOpen(false);
        setEditingEmployee(null);
        setOriginalEmployee(null);
        setEditValidationErrors({});
        setEditError(null);
        setEditErrorItems([]);
        
      } catch (error) {
        const apiError = error as ApiError;
        const fieldMessages: Record<string, string[]> = {};
        const normalizeField = (path: string) => {
          const parts = path.split('.').filter(Boolean);
          const key = parts[parts.length - 1];
          if (key === 'first_name' || key === 'last_name') return 'name';
          if (key === 'employee_code') return 'employeeCode';
          if (key === 'company_id') return 'companyName';
          if (key === 'department_id') return 'department';
          if (key === 'managerial_level') return 'managerialLevel';
          if (key === 'join_date') return 'joinDate';
          if (key === 'country_code') return 'countryCode';
          if (key === 'non_field_errors') return 'general';
          return key;
        };
        const toMessages = (value: unknown): string[] => {
          if (!value) return [];
          if (Array.isArray(value)) return (value as unknown[]).map(v => String(v));
          if (typeof value === 'object') {
            const rec = value as Record<string, unknown>;
            if ('message' in rec && typeof rec.message === 'string') return [String(rec.message)];
            return [JSON.stringify(value)];
          }
          return [String(value)];
        };
        const walk = (obj: Record<string, unknown>, base = '') => {
          if (!obj || typeof obj !== 'object') return;
          Object.entries(obj).forEach(([k, v]) => {
            const path = base ? `${base}.${k}` : k;
            if (v && typeof v === 'object' && !Array.isArray(v)) {
              walk(v as Record<string, unknown>, path);
            } else {
              const field = normalizeField(path);
              const msgs = toMessages(v);
              if (msgs.length) fieldMessages[field] = (fieldMessages[field] || []).concat(msgs);
            }
          });
        };
        if (apiError?.details) {
          walk(apiError.details as Record<string, unknown>);
        }
        const firstMessages: { [key: string]: string } = {};
        Object.entries(fieldMessages).forEach(([k, v]) => {
          if (v.length) firstMessages[k] = v[0];
        });
        setEditValidationErrors(firstMessages);
        const items = Object.entries(fieldMessages).flatMap(([field, msgs]) => msgs.map(m => `${field}: ${m}`));
        setEditErrorItems(items);
        const message = apiError?.message || items[0] || 'Failed to update employee. Please review the fields and try again.';
        setEditError(message);
      }
    }
  };

  const validateAddForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!newEmployee.name?.trim()) {
      errors.name = 'Full name is required';
    }
    
    if (!newEmployee.email?.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmployee.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!newEmployee.phone?.trim()) {
      errors.phone = 'Phone number is required';
    }
    
    // if (!newEmployee.department?.trim()) {
    //   errors.department = 'Department is required';
    // }
    
    if (!newEmployee.position?.trim()) {
      errors.position = 'Position is required';
    }
    
    if (!newEmployee.companyName?.trim()) {
      errors.companyName = 'Company name is required';
    }
    
    if (!newEmployee.joinDate?.trim()) {
      errors.joinDate = 'Join date is required';
    }
    if (!newEmployee.employeeCode?.trim()) {
      errors.employeeCode = 'Employee code is required and unique.';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddEmployee = async () => {
    if (validateAddForm()) {
      try {
        setCreateError(null);
        setIsCreating(true);
        // Generate username from name if not provided
        const username = newEmployee.username || newEmployee.name.toLowerCase().replace(/\s+/g, '');
        
        // Split name into first and last name if not provided
        const nameParts = newEmployee.name.split(' ');
        const firstName = newEmployee.firstName || nameParts[0] || '';
        const lastName = newEmployee.lastName || nameParts.slice(1).join(' ') || '';
        
        // Combine phone with country code
        const fullPhoneNumber = `${newEmployee.countryCode}${newEmployee.phone}`;
        
        const employeeData = {
          user_data: {
            username: username,
            email: newEmployee.email,
            password: newEmployee.password,
            role: newEmployee.role,
            name: newEmployee.name,
            first_name: firstName,
            last_name: lastName,
            position: newEmployee.position || '',
            phone: fullPhoneNumber,
            gender: newEmployee.gender || ''
          },
          company_id: newEmployee.companyId,
          department_id: newEmployee.departmentId,
          managerial_level: newEmployee.managerialLevel,
          status: newEmployee.status,
          join_date: newEmployee.joinDate,
          employee_code: newEmployee.employeeCode,
          country_code: newEmployee.countryCode,
          warnings: newEmployee.warnings,
          warnings_count: newEmployee.warnings_count,

          direct_manager: newEmployee.directManager,
          job_type: newEmployee.jobType,
          location: newEmployee.location,
          branch: newEmployee.branch
        };
        
        const createdApi = await apiService.createEmployee(employeeData);
        const createdLocal = transformApiEmployee(createdApi);
        setEmployees(prev => [createdLocal, ...prev.filter(e => (e.employee_id || e.id) !== createdLocal.employee_id)]);
        setLastCreatedEmployeeId(createdLocal.employee_id);
        
        // Refresh the employee list via cached query
        await refetchEmployees();
        
        // Reset form
        setNewEmployee({
          name: '',
          email: '',
          phone: '',
          countryCode: '+966',
          employeeCode: '',
          warnings: [] as string[],
          warnings_count: 0,
          department: '',
          departmentId: '',
          position: '',
          role: 'EMP' as const,
          managerialLevel: 'Individual Contributor' as const,
          status: 'Active' as const,
          companyName: 'Ninja',
          companyId: '',
          directManager: '',
          joinDate: new Date().toISOString().split('T')[0],
          jobType: 'Full-time',
          location: '',
          branch: 'Office',
          username: '',
          password: 'Password123',
          firstName: '',
          lastName: '',
          gender: '',
        });
        setValidationErrors({});
        setCreateErrorItems([]);
        setIsAddModalOpen(false);
        setIsCreating(false);
      } catch (error) {
        const apiError = error as ApiError;
        const fieldMessages: Record<string, string[]> = {};
        const normalizeField = (path: string) => {
          const parts = path.split('.').filter(Boolean);
          const key = parts[parts.length - 1];
          if (key === 'first_name') return 'firstName';
          if (key === 'last_name') return 'lastName';
          if (key === 'employee_code') return 'employeeCode';
          if (key === 'company_id') return 'companyName';
          if (key === 'department_id') return 'department';
          if (key === 'managerial_level') return 'managerialLevel';
          if (key === 'join_date') return 'joinDate';
          if (key === 'country_code') return 'countryCode';
          if (key === 'non_field_errors') return 'general';
          return key;
        };
        const toMessages = (value: unknown): string[] => {
          if (!value) return [];
          if (Array.isArray(value)) return (value as unknown[]).map(v => String(v));
          if (typeof value === 'object') {
            const rec = value as Record<string, unknown>;
            if ('message' in rec && typeof rec.message === 'string') return [String(rec.message)];
            return [JSON.stringify(value)];
          }
          return [String(value)];
        };
        const walk = (obj: Record<string, unknown>, base = '') => {
          if (!obj || typeof obj !== 'object') return;
          Object.entries(obj).forEach(([k, v]) => {
            const path = base ? `${base}.${k}` : k;
            if (v && typeof v === 'object' && !Array.isArray(v)) {
              walk(v as Record<string, unknown>, path);
            } else {
              const field = normalizeField(path);
              const msgs = toMessages(v);
              if (msgs.length) fieldMessages[field] = (fieldMessages[field] || []).concat(msgs);
            }
          });
        };
        if (apiError?.details) {
          walk(apiError.details as Record<string, unknown>);
        }
        const firstMessages: { [key: string]: string } = {};
        Object.entries(fieldMessages).forEach(([k, v]) => {
          if (v.length) firstMessages[k] = v[0];
        });
        setValidationErrors(firstMessages);
        const items = Object.entries(fieldMessages).flatMap(([field, msgs]) => msgs.map(m => `${field}: ${m}`));
        setCreateErrorItems(items);
        const message = apiError?.message || items[0] || 'Failed to create employee. Please try again.';
        setCreateError(message);
        setIsCreating(false);
      }
    }
  };



  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('all');
    setSelectedCompany('all');
  };



  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        employee.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || employee.department === selectedDepartment;
    const matchesCompany = selectedCompany === 'all' || employee.companyName === selectedCompany;
    return matchesSearch && matchesDepartment && matchesCompany;
  });

  const displayEmployees = React.useMemo(() => {
    if (!lastCreatedEmployeeId) return filteredEmployees;
    const arr = filteredEmployees.slice();
    arr.sort((a, b) => {
      const aIsNew = String(a.employee_id || a.id) === String(lastCreatedEmployeeId);
      const bIsNew = String(b.employee_id || b.id) === String(lastCreatedEmployeeId);
      if (aIsNew && !bIsNew) return -1;
      if (!aIsNew && bIsNew) return 1;
      return 0;
    });
    return arr;
  }, [filteredEmployees, lastCreatedEmployeeId]);

  if (selectedEmployee) {
    return (
      <EmployeeDetails 
        employee={{...selectedEmployee, status: selectedEmployee.status === 'Active' ? 'Active' : 'Inactive'}}
        onBack={handleBackToList} 
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading employees...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
          <p className="text-gray-600">Manage employee profiles and information</p>
        </div>
        <div className="flex gap-3">
          {canImport && (
            <Button 
              variant="outline" 
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
              onClick={() => setIsImportModalOpen(true)}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Import Excel/CSV
            </Button>
          )}
          {canAddEmployee && (
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Add New Employee</DialogTitle>
                <p className="text-sm text-gray-600">Fill in the employee details below</p>
              </DialogHeader>
            <div className="space-y-6 py-4">
              {createError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{createError}</p>
                  {createErrorItems && createErrorItems.length > 0 && (
                    <ul className="mt-2 list-disc list-inside text-sm text-red-600">
                      {createErrorItems.map((item, idx) => (
                        <li key={`create-error-item-${idx}`}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
                    <Input
                      id="name"
                      value={newEmployee.name || ''}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Enter full name"
                      className={`w-full ${validationErrors.name ? 'border-red-500' : ''}`}
                      aria-describedby={validationErrors.name ? "name-error" : "name-help"}
                    />
                    <p id="name-help" className="text-xs text-gray-500">
                      First name, last name, and username will be auto-populated
                    </p>
                    {validationErrors.name && (
                      <p id="name-error" className="text-sm text-red-500" role="alert">{validationErrors.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newEmployee.email || ''}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="employee@company.com"
                      className={`w-full ${validationErrors.email ? 'border-red-500' : ''}`}
                    />
                    {validationErrors.email && (
                      <p className="text-sm text-red-500">{validationErrors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                    <Input
                      id="username"
                      value={newEmployee.username || ''}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Auto-generated from name"
                      className="w-full"
                      aria-describedby="username-help"
                    />
                    <p id="username-help" className="text-xs text-gray-500">
                      Auto-generated from full name, can be manually overridden
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                    <Input
                      id="firstName"
                      value={newEmployee.firstName || ''}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Auto-extracted from full name"
                      className="w-full bg-gray-50 cursor-not-allowed"
                      aria-describedby="firstName-help"
                      disabled
                    />
                    <p id="firstName-help" className="text-xs text-gray-500">
                      Auto-extracted from full name (read-only)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                    <Input
                      id="lastName"
                      value={newEmployee.lastName || ''}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Auto-extracted from full name"
                      className="w-full bg-gray-50 cursor-not-allowed"
                      aria-describedby="lastName-help"
                      disabled
                    />
                    <p id="lastName-help" className="text-xs text-gray-500">
                      Auto-extracted from full name (read-only)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-sm font-medium">Gender</Label>
                    <Select 
                      value={newEmployee.gender || ''} 
                      onValueChange={(value) => setNewEmployee(prev => ({ ...prev, gender: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">Phone Number *</Label>
                    <div className="flex gap-2">
                      <Select 
                        value={newEmployee.countryCode || '+1'} 
                        onValueChange={(value) => setNewEmployee(prev => ({ ...prev, countryCode: value }))}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="+20">🇪🇬 +20</SelectItem>
                            <SelectItem value="+966">🇸🇦 +966</SelectItem>
                            <SelectItem value="+1">🇺🇸 +1</SelectItem>
                            <SelectItem value="+44">🇬🇧 +44</SelectItem>
                            <SelectItem value="+33">🇫🇷 +33</SelectItem>
                            <SelectItem value="+49">🇩🇪 +49</SelectItem>
                            <SelectItem value="+39">🇮🇹 +39</SelectItem>
                            <SelectItem value="+34">🇪🇸 +34</SelectItem>
                            <SelectItem value="+86">🇨🇳 +86</SelectItem>
                            <SelectItem value="+81">🇯🇵 +81</SelectItem>
                            <SelectItem value="+82">🇰🇷 +82</SelectItem>
                            <SelectItem value="+91">🇮🇳 +91</SelectItem>
                            <SelectItem value="+61">🇦🇺 +61</SelectItem>
                            <SelectItem value="+55">🇧🇷 +55</SelectItem>
                            <SelectItem value="+52">🇲🇽 +52</SelectItem>
                            <SelectItem value="+7">🇷🇺 +7</SelectItem>
                            <SelectItem value="+27">🇿🇦 +27</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id="phone"
                        value={newEmployee.phone || ''}
                        onChange={(e) => setNewEmployee(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="123-456-7890"
                        className={`flex-1 ${validationErrors.phone ? 'border-red-500' : ''}`}
                      />
                    </div>
                  {validationErrors.phone && (
                    <p className="text-sm text-red-500">{validationErrors.phone}</p>
                  )}
                  </div>
                   </div>
                 </div>
               </div>

              {/* Work Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Work Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-sm font-medium">Company Name *</Label>
                    <Select 
                      value={newEmployee.companyId} 
                      onValueChange={(value) => {
                        const selectedCompany = companies.find(company => company.company_id === value);
                        setNewEmployee(prev => ({ 
                          ...prev, 
                          companyId: value,
                          companyName: selectedCompany?.name || '',
                          // Reset department when company changes
                          departmentId: '',
                          department: ''
                        }));
                      }}
                    >
                      <SelectTrigger id="companyName" className={`w-full ${validationErrors.companyName ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.company_id} value={company.company_id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {validationErrors.companyName && (
                      <p className="text-sm text-red-500">{validationErrors.companyName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-sm font-medium">Department *</Label>
                    <Select 
                      value={newEmployee.departmentId} 
                      onValueChange={(value) => {
                        const selectedDept = departments.find(dept => dept.department_id === value);
                        setNewEmployee(prev => ({ 
                          ...prev, 
                          departmentId: value,
                          department: selectedDept?.name || ''
                        }));
                      }}
                    >
                      <SelectTrigger id="department" className={`w-full ${validationErrors.department ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.length > 0 ? (
                          departments.map((dept) => (
                            <SelectItem key={dept.department_id} value={dept.department_id}>
                              {dept.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-department" disabled>
                            No departments for selected company 
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {validationErrors.department && (
                      <p className="text-sm text-red-500">{validationErrors.department}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position" className="text-sm font-medium">Position *</Label>
                    <Input
                      id="position"
                      value={newEmployee.position || ''}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, position: e.target.value }))}
                      placeholder="Job title"
                      className={`w-full ${validationErrors.position ? 'border-red-500' : ''}`}
                    />
                    {validationErrors.position && (
                      <p className="text-sm text-red-500">{validationErrors.position}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-medium">Role *</Label>
                    <Select 
                      value={newEmployee.role} 
                      onValueChange={(value: Employee['role']) => 
                        setNewEmployee((prev) => ({ 
                          ...prev, 
                          role: value as typeof prev.role 
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Employee *" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="Head-of-Dept">Head-of-Dept</SelectItem>
                        <SelectItem value="Line Manager">Line Manager</SelectItem>
                        <SelectItem value="Employee">Employee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="managerialLevel" className="text-sm font-medium">Managerial Level *</Label>
                    <Select 
                        value={newEmployee.managerialLevel} 
                        onValueChange={(value: typeof newEmployee.managerialLevel) => 
                          setNewEmployee(prev => ({ ...prev, managerialLevel: value }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select managerial weight" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Supervisory">Supervisory</SelectItem>
                        <SelectItem value="Middle Management">Middle Management</SelectItem>
                        <SelectItem value="Individual Contributor">Individual Contributor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Company Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-medium">Status *</Label>
                    <Select 
                      value={newEmployee.status} 
                      onValueChange={(value: typeof newEmployee.status) => 
                        setNewEmployee(prev => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employeeCode" className="text-sm font-medium">Employee Code</Label>
                    <Input
                      id="employeeCode"
                      value={newEmployee.employeeCode || ''}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, employeeCode: e.target.value }))}
                      placeholder="Employee ID/Code"
                      className={`w-full ${validationErrors.employeeCode ? 'border-red-500' : ''}`}
                      required
                    />
                    {validationErrors.employeeCode && (
                      <p className="text-sm text-red-500">{validationErrors.employeeCode}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobType" className="text-sm font-medium">Job Type</Label>
                    <Select 
                      value={newEmployee.jobType} 
                      onValueChange={(value) => setNewEmployee(prev => ({ ...prev, jobType: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select job type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Full-time Remote">Full-time Remote</SelectItem>
                        <SelectItem value="Part-time Remote">Part-time Remote</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-medium">Location</Label>
                    <Input
                      id="location"
                      value={newEmployee.location || ''}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Work location"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branch" className="text-sm font-medium">Branch</Label>
                    <Select 
                      value={newEmployee.branch} 
                      onValueChange={(value) => setNewEmployee(prev => ({ ...prev, branch: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Office">Office</SelectItem>
                        <SelectItem value="Store">Store</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                
                  <div className="space-y-2">
                    <Label htmlFor="joinDate" className="text-sm font-medium">Join Date *</Label>
                    <Input
                      id="joinDate"
                      type="date"
                      value={newEmployee.joinDate || ''}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, joinDate: e.target.value }))}
                      className={`w-full ${validationErrors.joinDate ? 'border-red-500' : ''}`}/>
                    {validationErrors.joinDate && (
                      <p className="text-sm text-red-500">{validationErrors.joinDate}</p>
                    )}
                  </div>

                  {/* Warnings Section */}
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-medium">Warnings</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Add a warning..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const value = e.currentTarget.value.trim();
                              if (value) {
                                setNewEmployee(prev => ({
                                  ...prev,
                                  warnings: [...prev.warnings, value],
                                  warnings_count: prev.warnings.length + 1
                                }));
                                e.currentTarget.value = '';
                              }
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            const input = e.currentTarget.parentElement?.querySelector('input');
                            const value = input?.value.trim();
                            if (value) {
                              setNewEmployee(prev => ({
                                ...prev,
                                warnings: [...prev.warnings, value],
                                warnings_count: prev.warnings.length + 1
                              }));
                              if (input) input.value = '';
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                      
                      {/* Display warnings */}
                      {newEmployee.warnings.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-sm text-gray-600">
                            Warnings ({newEmployee.warnings_count}):
                          </div>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {newEmployee.warnings.map((warning, index) => (
                              <div key={index} className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
                                <span className="text-sm text-yellow-800">{warning}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setNewEmployee(prev => ({
                                      ...prev,
                                      warnings: prev.warnings.filter((_, i) => i !== index),
                                      warnings_count: prev.warnings.length - 1
                                    }));
                                  }}
                                  className="h-6 w-6 p-0 text-yellow-600 hover:text-yellow-800"
                                >
                                  ×
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsAddModalOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddEmployee}
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Employee'
                )}
              </Button>
            </div>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.department_id} value={dept.name}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.company_id} value={company.name}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Employee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayEmployees.map((employee) => (
          <Card key={employee.id} className="hover:shadow-lg transition-all duration-200 group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4 gap-2">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={employee.avatar} alt={employee.name} />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {employee.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-lg truncate">{employee.name}</h3>
                    <p className="text-sm text-gray-600 truncate">{employee.position}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {statusUpdatingEmployees.has(employee.id) ? (
                    <div className="flex items-center justify-center w-11 h-6">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <Switch
                      checked={employee.status === 'Active'}
                      onCheckedChange={() => handleToggleStatus(employee.id)}
                    />
                  )}
                  {(user?.role === 'admin' || user?.role === 'hr' || user?.api_role === 'HOD') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditEmployee(employee)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex gap-2 flex-wrap min-w-0 flex-1">
                    <Badge 
                      variant={employee.status === 'Active' ? 'default' : 'secondary'}
                      className={employee.status === 'Active' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {employee.status}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {employee.role}
                    </Badge>
                    <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700">
                      {employee.managerialLevel}
                    </Badge>
                    {employee.warningsCount > 0 && (
                        <div className="relative group">
                          {/* Compact glow effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-orange-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          {/* Compact modern badge */}
                          <Badge 
                            variant="outline" 
                            className="relative bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 border-amber-300/60 text-[10px] font-semibold shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 px-1.5 py-0.5"
                          >
                            <div className="flex items-center space-x-1">
                              <div className="w-1 h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full animate-pulse"></div>
                              <span>{employee.warningsCount}</span>
                            </div>
                          </Badge>
                        </div>
                      )}
                  </div>
                  <span className="text-sm text-gray-500 flex-shrink-0 truncate max-w-[100px]">{employee.department}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <a 
                      href={`mailto:${employee.email}`}
                      className="truncate text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      {employee.email}
                    </a>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <a 
                      href={`https://wa.me/${(employee.countryCode || '+1').replace('+', '')}${employee.phone?.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-800 hover:underline transition-colors"
                    >
                      {(employee.countryCode || '+1')} {employee.phone}
                    </a>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 gap-2">
                    <span className="flex-shrink-0">Joined: {formatDate(employee.joinDate)}</span>
                    <span className="font-medium truncate">{employee.companyName}</span>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full mt-3"
                  onClick={() => handleOpenEmployeeDetails(employee)}
                >
                  View Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Employee Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Edit Employee</DialogTitle>
            <p className="text-sm text-gray-600">Update employee information below</p>
          </DialogHeader>
          {editingEmployee && (
            <div className="space-y-6 py-4">
              {editError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{editError}</p>
                  {editErrorItems && editErrorItems.length > 0 && (
                    <ul className="mt-2 list-disc list-inside text-sm text-red-600">
                      {editErrorItems.map((item, idx) => (
                        <li key={`edit-error-item-${idx}`}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name" className="text-sm font-medium">Full Name *</Label>
                    <Input
                      id="edit-name"
                      value={editingEmployee.name}
                      onChange={(e) => setEditingEmployee(prev => prev ? { ...prev, name: e.target.value } : null)}
                      placeholder="Enter full name"
                      className={`w-full ${editValidationErrors.name ? 'border-red-500' : ''}`}
                    />
                    {editValidationErrors.name && (
                      <p className="text-sm text-red-500">{editValidationErrors.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email" className="text-sm font-medium">Email Address *</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editingEmployee.email}
                      onChange={(e) => setEditingEmployee(prev => prev ? { ...prev, email: e.target.value } : null)}
                      placeholder="employee@company.com"
                      className={`w-full ${editValidationErrors.email ? 'border-red-500' : ''}`}
                    />
                    {editValidationErrors.email && (
                      <p className="text-sm text-red-500">{editValidationErrors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone" className="text-sm font-medium">Phone Number *</Label>
                    <div className="flex gap-2">
                      <Select 
                        value={editingEmployee.countryCode || '+1'} 
                        onValueChange={(value) => setEditingEmployee(prev => prev ? { ...prev, countryCode: value } : null)}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="+966">🇸🇦 +966</SelectItem>
                          <SelectItem value="+20">🇪🇬 +20</SelectItem>
                          <SelectItem value="+1">🇺🇸 +1</SelectItem>
                          <SelectItem value="+44">🇬🇧 +44</SelectItem>
                          <SelectItem value="+33">🇫🇷 +33</SelectItem>
                          <SelectItem value="+49">🇩🇪 +49</SelectItem>
                          <SelectItem value="+39">🇮🇹 +39</SelectItem>
                          <SelectItem value="+34">🇪🇸 +34</SelectItem>
                          <SelectItem value="+86">🇨🇳 +86</SelectItem>
                          <SelectItem value="+81">🇯🇵 +81</SelectItem>
                          <SelectItem value="+82">🇰🇷 +82</SelectItem>
                          <SelectItem value="+91">🇮🇳 +91</SelectItem>
                          <SelectItem value="+61">🇦🇺 +61</SelectItem>
                          <SelectItem value="+55">🇧🇷 +55</SelectItem>
                          <SelectItem value="+52">🇲🇽 +52</SelectItem>
                          <SelectItem value="+7">🇷🇺 +7</SelectItem>
                          <SelectItem value="+27">🇿🇦 +27</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id="edit-phone"
                        value={editingEmployee.phone || ''}
                        onChange={(e) => setEditingEmployee(prev => prev ? { ...prev, phone: e.target.value } : null)}
                        placeholder="123-456-7890"
                        className={`flex-1 ${editValidationErrors.phone ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {editValidationErrors.phone && (
                      <p className="text-sm text-red-500">{editValidationErrors.phone}</p>
                    )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-gender" className="text-sm font-medium">Gender</Label>
                <Select 
                  value={editingEmployee.gender || ''} 
                  onValueChange={(value) => setEditingEmployee(prev => prev ? { ...prev, gender: value } : null)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Work Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Work Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-companyName" className="text-sm font-medium">Company Name *</Label>
                    <Select 
                      value={editingEmployee.company_id || ''} 
                      onValueChange={(value) => {
                        const selectedCompany = companies.find(company => company.company_id === value);
                        setEditingEmployee(prev => prev ? { 
                          ...prev, 
                          company_id: value,
                          companyName: selectedCompany?.name || ''
                        } : null);
                      }}
                    >
                      <SelectTrigger id="edit-companyName" className={`w-full ${editValidationErrors.companyName ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.company_id} value={company.company_id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {editValidationErrors.companyName && (
                      <p className="text-sm text-red-500">{editValidationErrors.companyName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-department" className="text-sm font-medium">Department (read-only)</Label>
                    <Input
                      id="edit-department"
                      value={editingEmployee.department}
                      disabled
                      className="w-full"
                    />
                    {(user?.role === 'admin' || user?.role === 'hr' || user?.api_role === 'HOD') && (
                      <div className="flex justify-end">
                        <Button variant="outline" onClick={goToPlacementForEmployee}>
                          Change via Placement
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-position" className="text-sm font-medium">Position *</Label>
                    <Input
                      id="edit-position"
                      value={editingEmployee.position}
                      onChange={(e) => setEditingEmployee(prev => prev ? { ...prev, position: e.target.value } : null)}
                      placeholder="Job title"
                      className={`w-full ${editValidationErrors.position ? 'border-red-500' : ''}`}/>
                    {editValidationErrors.position && (
                      <p className="text-sm text-red-500">{editValidationErrors.position}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-role" className="text-sm font-medium">Role *</Label>
                    <Select 
                      value={editingEmployee.role}
                      onValueChange={(value) => setEditingEmployee(prev => prev ? { ...prev, role: value as 'ADMIN' | 'HR' | 'HOD' | 'LM' | 'EMP' } : null)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="Head-of-Dept">Head-of-Dept</SelectItem>
              <SelectItem value="Line Manager">Line Manager</SelectItem>
                        <SelectItem value="Employee">Employee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-managerialLevel" className="text-sm font-medium">Managerial Level *</Label>
                    <Select 
                      value={editingEmployee.managerialLevel}
                      onValueChange={(value) => setEditingEmployee(prev => prev ? { ...prev, managerialLevel: value as 'Individual Contributor' | 'Supervisory' | 'Middle Management' } : null)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select managerial weight" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Supervisory">Supervisory</SelectItem>
                        <SelectItem value="Middle Management">Middle Management</SelectItem>
                        <SelectItem value="Individual Contributor">Individual Contributor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Company Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-status" className="text-sm font-medium">Status *</Label>
                    <Select 
                      value={editingEmployee.status}
                      onValueChange={(value) => setEditingEmployee(prev => prev ? { ...prev, status: value as 'Active' | 'Inactive'} : null)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-joinDate" className="text-sm font-medium">Join Date *</Label>
                    <Input
                      id="edit-joinDate"
                      type="date"
                      value={editingEmployee.joinDate || ''}
                      onChange={(e) => setEditingEmployee(prev => prev ? { ...prev, joinDate: e.target.value } : null)}
                      className={`w-full ${editValidationErrors.joinDate ? 'border-red-500' : ''}`}/>
                    {editValidationErrors.joinDate && (
                      <p className="text-sm text-red-500">{editValidationErrors.joinDate}</p>)}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-employeeCode" className="text-sm font-medium">Employee Code</Label>
                    <Input
                      id="edit-employeeCode"
                      value={editingEmployee.employeeCode || ''}
                      onChange={(e) => setEditingEmployee(prev => prev ? { ...prev, employeeCode: e.target.value } : null)}
                      placeholder="Enter unique employee code"
                      className={`w-full ${editValidationErrors.employeeCode ? 'border-red-500' : ''}`}
                      required
                    />
                    {editValidationErrors.employeeCode && (
                      <p className="text-sm text-red-500">{editValidationErrors.employeeCode}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-jobType" className="text-sm font-medium">Job Type</Label>
                    <Select 
                      value={editingEmployee.jobType || 'Full-time'}
                      onValueChange={(value) => setEditingEmployee(prev => prev ? { ...prev, jobType: value } : null)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select job type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Full-time Remote">Full-time Remote</SelectItem>
                        <SelectItem value="Part-time Remote">Part-time Remote</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-location" className="text-sm font-medium">Location</Label>
                    <Input
                      id="edit-location"
                      value={editingEmployee.location || ''}
                      onChange={(e) => setEditingEmployee(prev => prev ? { ...prev, location: e.target.value } : null)}
                      placeholder="Enter location"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-branch" className="text-sm font-medium">Branch</Label>
                    <Select 
                      value={editingEmployee.branch || 'Office'}
                      onValueChange={(value) => setEditingEmployee(prev => prev ? { ...prev, branch: value } : null)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Office">Office</SelectItem>
                        <SelectItem value="Store">Store</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* <div className="space-y-2">
                    <Label htmlFor="edit-directManager" className="text-sm font-medium">Direct Manager</Label>
                    <Input
                      id="edit-directManager"
                      value={editingEmployee.directManager || ''}
                      onChange={(e) => setEditingEmployee(prev => prev ? { ...prev, directManager: e.target.value } : null)}
                      placeholder="Enter direct manager"
                      className="w-full"
                    />
                  </div> */}
                </div>
              </div>

              {/* Warnings Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Warnings</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Add a warning..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const value = e.currentTarget.value.trim();
                          if (value) {
                            setEditingEmployee(prev => prev ? {
                              ...prev,
                              warnings: [...(prev.warnings || []), value],
                              warnings_count: (prev.warnings || []).length + 1
                            } : null);
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        const input = e.currentTarget.parentElement?.querySelector('input');
                        const value = input?.value.trim();
                        if (value) {
                          setEditingEmployee(prev => prev ? {
                            ...prev,
                            warnings: [...(prev.warnings || []), value],
                            warnings_count: (prev.warnings || []).length + 1
                          } : null);
                          if (input) input.value = '';
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  
                  {/* Display warnings */}
                  {editingEmployee.warnings && editingEmployee.warnings.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">
                        Warnings ({editingEmployee.warningsCount || editingEmployee.warnings.length}):
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {editingEmployee.warnings.map((warning, index) => (
                          <div key={index} className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
                            <span className="text-sm text-yellow-800">{warning}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingEmployee(prev => prev ? {
                                  ...prev,
                                  warnings: prev.warnings?.filter((_, i) => i !== index) || [],
                                  warnings_count: (prev.warnings?.length || 1) - 1
                                } : null);
                              }}
                              className="h-6 w-6 p-0 text-yellow-600 hover:text-yellow-800"
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingEmployee(null);
                  setOriginalEmployee(null);
                  setEditValidationErrors({});
                }}>Cancel</Button>
                <Button onClick={handleSaveEdit}>Save Changes</Button>
              </div>
            </div>)}
        </DialogContent>
      </Dialog>

      {/* Import Modal */}
      {canImport && (
        <Dialog open={isImportModalOpen} onOpenChange={handleImportModalClose}>
          <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Import Employees from Excel
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* File Upload Area */}
            <div className="space-y-3">
              <div
                className={`border border-dashed rounded-md p-4 text-center transition-colors ${
                  isDragOver
                    ? 'border-green-400 bg-green-50'
                    : selectedFile
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleFileSelect}
              >
                {selectedFile ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-green-600" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[220px]">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="h-8 px-2 text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <Upload className="h-6 w-6 text-gray-400" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Drag and drop Excel/CSV here</p>
                      <p className="text-xs text-gray-500">or click to browse</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex items-center justify-between rounded-md border p-2">
                <div className="flex items-center gap-2 text-xs">
                  <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
                  <span className="text-gray-700">Download Excel template</span>
                </div>
                <Button asChild variant="link" size="sm" className="text-indigo-700">
                  <a
                    href="https://docs.google.com/spreadsheets/d/1aNv4iMchQJR_Qa4HjOUTAaWeIBPoOvyT/edit?gid=774914515#gid=774914515"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Template
                  </a>
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            {selectedFile && (
              <div className="flex gap-2">
                <Button
                  onClick={handleDryRun}
                  disabled={isImporting}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Validate
                </Button>
                <Button
                  onClick={handleActualImport}
                  disabled={isImporting}
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {isImporting ? 'Importing...' : 'Import'}
                </Button>
              </div>
            )}

            {/* Results Display */}
            {importResults && (
              <div className={`rounded-md p-3 ${
                (importResults.created > 0 || importResults.updated > 0 || importResults.validated_count) ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start gap-2">
                  <div className={`p-1 rounded-full ${
                    (importResults.created > 0 || importResults.updated > 0 || importResults.validated_count) ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {(importResults.created > 0 || importResults.updated > 0 || importResults.validated_count) ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 text-sm">
                    {importResults.validated_count !== undefined ? (
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-green-800">Validation successful</p>
                        <div className="text-xs text-gray-700 flex gap-3">
                          <span>Validated: {importResults.validated_count}</span>
                          <span>Create: {importResults.to_create || 0}</span>
                          <span>Update: {importResults.to_update || 0}</span>
                        </div>
                      </div>
                    ) : (importResults.created > 0 || importResults.updated > 0) ? (
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-green-800">Import successful</p>
                        <div className="text-xs text-green-700 flex gap-3">
                          <span>Created: {importResults.created}</span>
                          <span>Updated: {importResults.updated}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="font-medium text-red-800">{importResults.message || 'Import failed'}</p>
                    )}

                    {importResults.errors && importResults.errors.length > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => setShowImportDetails((v) => !v)}>
                            {showImportDetails ? 'Hide details' : 'View details'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={copyErrors}><Copy className="h-4 w-4 mr-1" />Copy</Button>
                          <Button size="sm" variant="outline" onClick={downloadErrors}><Download className="h-4 w-4 mr-1" />Download</Button>
                        </div>

                        {showImportDetails && (
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant={errorView === 'summary' ? 'default' : 'outline'} onClick={() => setErrorView('summary')}>Summary</Button>
                              <Button size="sm" variant={errorView === 'fields' ? 'default' : 'outline'} onClick={() => setErrorView('fields')}>By Field</Button>
                              <Button size="sm" variant={errorView === 'rows' ? 'default' : 'outline'} onClick={() => setErrorView('rows')}>By Row</Button>
                              <Button size="sm" variant={errorView === 'raw' ? 'default' : 'outline'} onClick={() => setErrorView('raw')}>Raw JSON</Button>
                            </div>

                            {errorView === 'summary' && (
                              <div className="bg-gray-50 border rounded p-2">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                  <div><span className="text-gray-600">Total errors:</span> <span className="font-medium text-gray-900">{importResults.errors.length}</span></div>
                                  <div><span className="text-gray-600">Distinct fields:</span> <span className="font-medium text-gray-900">{Object.keys(fieldErrors).length}</span></div>
                                  <div><span className="text-gray-600">Created:</span> <span className="font-medium text-gray-900">{importResults.created || 0}</span></div>
                                  <div><span className="text-gray-600">Updated:</span> <span className="font-medium text-gray-900">{importResults.updated || 0}</span></div>
                                </div>
                                <div className="mt-2">
                                  <div className="flex flex-wrap gap-1">
                                    {Object.keys(fieldErrors).slice(0, 10).map((key) => (
                                      <Badge key={key} variant="secondary" className="text-[10px]">{key} ({fieldErrors[key].length})</Badge>
                                    ))}
                                    {Object.keys(fieldErrors).length > 10 && (
                                      <span className="text-[10px] text-gray-500">+{Object.keys(fieldErrors).length - 10} more</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {errorView === 'fields' && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={errorFilter}
                                    onChange={(e) => setErrorFilter(e.target.value)}
                                    placeholder="Filter by field name"
                                    className="h-8"
                                  />
                                </div>
                                <div className="space-y-2 max-h-60 overflow-auto pr-1">
                                  {Object.entries(fieldErrors)
                                    .filter(([key]) => key.toLowerCase().includes(errorFilter.toLowerCase()))
                                    .map(([key, messages]) => (
                                      <div key={key} className="border rounded p-2 bg-white">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-semibold text-gray-800">{key}</span>
                                          <Badge variant="outline" className="text-[10px]">{messages.length} issue{messages.length > 1 ? 's' : ''}</Badge>
                                        </div>
                                        <ul className="mt-2 text-xs text-red-700 list-disc list-inside space-y-1">
                                          {messages.map((m, i) => (
                                            <li key={i}>{m}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}

                            {errorView === 'rows' && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={errorFilter}
                                    onChange={(e) => setErrorFilter(e.target.value)}
                                    placeholder="Filter by row number or field name"
                                    className="h-8"
                                  />
                                </div>
                                <div className="space-y-2 max-h-60 overflow-auto pr-1">
                                  {rowErrors
                                    .filter((e) => {
                                      const q = errorFilter.toLowerCase();
                                      if (!q) return true;
                                      return (
                                        String(e.row).includes(q) ||
                                        String(e.field || '').toLowerCase().includes(q) ||
                                        e.message.toLowerCase().includes(q)
                                      );
                                    })
                                    .map((e, i) => (
                                      <div key={`${e.row}-${e.field}-${i}`} className="border rounded p-2 bg-white">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-semibold text-gray-800">{e.row ? `Row ${e.row}` : 'General'}{e.field ? ` – ${e.field}` : ''}</span>
                                        </div>
                                        <p className="mt-2 text-xs text-red-700">
                                          {e.message}
                                        </p>
                                      </div>
                                    ))}
                                  {rowErrors.length === 0 && (
                                    <div className="text-xs text-gray-600">No row-level errors detected.</div>
                                  )}
                                </div>
                              </div>
                            )}

                            {errorView === 'raw' && (
                              <div className="bg-gray-50 border rounded p-2">
                                <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap break-words">
{JSON.stringify(importResults.errors, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          </DialogContent>
        </Dialog>
      )}

      {filteredEmployees.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No employees found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search criteria or add a new employee.</p>
            
            {/* Error message display */}
            {lastError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">{lastError}</span>
                </div>
                {retryCount > 0 && (
                  <div className="mt-2 text-xs text-red-600">
                    Retry attempt {retryCount}/3 failed
                  </div>
                )}
              </div>
            )}
            
            {/* Auto-refresh indicator */}
            {autoRefreshing && (
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">
                  {retryCount > 0 
                    ? `Retrying... (attempt ${retryCount + 1}/4)` 
                    : 'Checking for new employee data...'
                  }
                </span>
              </div>
            )}
            
            {/* Auto-refresh status when not actively refreshing */}
            {!autoRefreshing && employees.length === 0 && !loading && (
              <div className="text-sm text-gray-500 mt-2">
                <div className="flex items-center justify-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Auto-refresh active - checking every 10 seconds</span>
                </div>
                {lastError && (
                  <div className="mt-2 text-xs text-gray-400">
                    Will retry automatically on next refresh
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmployeeList;
              {/* Change Department via Placement Dialog */}
              {/* Department changes are now done via Replacements page navigation */}
