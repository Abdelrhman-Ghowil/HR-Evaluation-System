/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosInstance, AxiosResponse } from 'axios';
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
  CreateObjectiveRequest,
  UpdateObjectiveRequest,
  ApiCompetency,
  CreateCompetencyRequest,
  UpdateCompetencyRequest,
  ApiResponse,
  PaginatedResponse,
  ApiError,
  AuthHeaders,
  EmployeeQueryParams,
  DepartmentQueryParams,
  EvaluationQueryParams,
  EvaluationType,
  WeightsConfiguration,
  WeightsConfigurationLevel,
  UpdateWeightsConfigurationRequest,
  ApiSubDepartment,
  CreateSubDepartmentRequest,
  UpdateSubDepartmentRequest,
  SubDepartmentQueryParams,
  ApiSection,
  CreateSectionRequest,
  UpdateSectionRequest,
  SectionQueryParams,
  ApiSubSection,
  CreateSubSectionRequest,
  UpdateSubSectionRequest,
  SubSectionQueryParams,
  ApiPlacement,
  CreatePlacementRequest,
  ImportResponse,
  ApiMyProfile,
  ApiActivityLog,
  CreateActivityLogRequest,
  PaginatedResponse as _PaginatedResponse
} from '../types/api';

// Base API configuration
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '10000', 10);

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: false,
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh and errors
    this.api.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              console.log('Token expired, attempting refresh...');
              const response = await axios.post(`${BASE_URL}/api/auth/refresh/`, {
                refresh: refreshToken
              });
              const { access } = response.data;
              this.saveToken(access);
              originalRequest.headers.Authorization = `Bearer ${access}`;
              console.log('Token refreshed successfully, retrying original request');
              return this.api(originalRequest);
            } else {
              console.log('No refresh token available, redirecting to login');
              this.clearToken();
              // Use a more graceful redirect that works with React Router
              if (typeof window !== 'undefined') {
                window.location.href = '/';
              }
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            this.clearToken();
            // Use a more graceful redirect that works with React Router
            if (typeof window !== 'undefined') {
              window.location.href = '/';
            }
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );

    // Load token from localStorage on initialization
    this.loadToken();
  }

  // Token management
  private loadToken(): void {
    // Check both possible token keys for backward compatibility
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (token) {
      this.token = token;
    }
  }

  private saveToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
    // Also save to 'token' key for backward compatibility
    localStorage.setItem('token', token);
  }

  private clearToken(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
  }

  // Error handling
  private handleError(error: any): ApiError {
    console.error('Full API Error Details:', {
      message: error?.message,
      code: error?.code,
      response: error?.response,
      request: error?.request ? 'Request made but no response' : 'No request made'
    });

    if (error?.response) {
      // Server responded with error status
      const errorMessage = error.response.data?.message || error.response.data?.error || `Server error (${error.response.status})`;
      return {
        message: errorMessage,
        status: error.response.status,
        details: error.response.data,
      };
    } else
    if (error?.request) {
      // Request was made but no response received
      const errorCode = error?.code;
      let networkMessage = 'Network error - please check your connection';
      
      if (errorCode === 'ENOTFOUND') {
        networkMessage = 'Cannot reach server - DNS resolution failed';
      } else if (errorCode === 'ECONNREFUSED') {
        networkMessage = 'Connection refused - server may be down';
      } else if (errorCode === 'ETIMEDOUT') {
        networkMessage = 'Request timeout - server took too long to respond';
      } else if (errorCode === 'ERR_NETWORK') {
        networkMessage = 'Network error - CORS policy or connectivity issue. Please check if the API server allows cross-origin requests.';
      }
      
      return {
        message: networkMessage,
        status: 0,
      };
    } else {
      // Something else happened in setting up the request
      return {
        message: error?.message || 'An unexpected error occurred',
        status: 0,
      };
    }
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // Construct dynamic payload based on provided fields (sanitized)
    const payload: any = {
      password: (credentials.password || '').toString()
    };
    
    // Add username if provided
    if (credentials.username && credentials.username.trim()) {
      payload.username = credentials.username.trim();
    }
    
    // Add email if provided
    if (credentials.email && credentials.email.trim()) {
      payload.email = credentials.email.trim().toLowerCase();
    }
    
    // Validate that at least one identifier is provided
    if (!payload.username && !payload.email) {
      throw new Error('Either username or email must be provided');
    }
    
    console.log('Login payload keys:', Object.keys(payload).filter(k => k !== 'password'));
    
    const response: AxiosResponse<{access: string, refresh: string}> = await this.api.post('/api/auth/login/', payload);
    const { access, refresh } = response.data;

    this.saveToken(access);
    if (refresh) {
      localStorage.setItem('refresh_token', refresh);
    }

    // Extract user info from JWT token (robust decoding)
    const user = this.extractUserFromToken(access);
    
    return {
      access,
      refresh,
      user
    };
  }

  // Helper method to extract user info from JWT token
  private extractUserFromToken(token: string): ApiUser {
    const base64Url = token.split('.')[1] || '';
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    let payload: any = null;
    try {
      const json = atob(padded);
      payload = JSON.parse(json);
    } catch (error) {
      console.error('Error decoding JWT payload:', error);
    }
    
    if (!payload || typeof payload !== 'object') {
      // Fallback minimal user to avoid failing login due to decode issues
      return {
        user_id: 'unknown',
        username: 'user',
        email: '',
        first_name: '',
        last_name: '',
        name: 'Unknown User',
        role: 'EMP'
      };
    }
    
    return {
      user_id: payload.user_id || payload.id || 'unknown',
      username: payload.username || payload.name?.split(' ')[0] || 'user',
      email: payload.email || '',
      first_name: payload.first_name || payload.name?.split(' ')[0] || '',
      last_name: payload.last_name || payload.name?.split(' ').slice(1).join(' ') || '',
      name: payload.name || payload.username || 'Unknown User',
      role: payload.role || 'EMP'
    };
  }

  async logout(): Promise<void> {
    try {
      // Optionally call logout endpoint if your backend supports it
      // await this.api.post('/api/auth/logout/');
    } catch (error) {
      // Ignore logout errors, still clear local token
      console.warn('Logout request failed:', error);
    } finally {
      this.clearToken();
    }
  }

  // Token refresh method
  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response: AxiosResponse<{ access: string }> = await this.api.post('/api/auth/refresh/', {
        refresh: refreshToken
      });

      const { access } = response.data;
      this.saveToken(access);
      return access;
    } catch (error) {
      this.clearToken();
      throw error;
    }
  }

  // User management methods
  async createUser(userData: CreateUserRequest): Promise<ApiUser> {
    const response: AxiosResponse<ApiUser> = await this.api.post('/api/accounts/users/', userData);
    return response.data;
  }

  async updateUser(userId: string, userData: UpdateUserRequest): Promise<ApiUser> {
    try {
      // Try with trailing slash first
      const response: AxiosResponse<ApiUser> = await this.api.patch(`/api/accounts/users/${userId}/`, userData);
      return response.data;
    } catch (error: any) {
      // If 404, try without trailing slash as fallback
      if (error?.response?.status === 404) {
        console.log('Trying alternative endpoint without trailing slash...');
        const response: AxiosResponse<ApiUser> = await this.api.patch(`/api/accounts/users/${userId}`, userData);
        return response.data;
      }
      throw error;
    }
  }

  async getUser(userId: string): Promise<ApiUser> {
    const response: AxiosResponse<ApiUser> = await this.api.get(`/api/accounts/users/${userId}/`);
    return response.data;
  }

  async getUsers(): Promise<ApiUser[]> {
    const response: AxiosResponse<ApiUser[]> = await this.api.get('/api/accounts/users/');
    return response.data;
  }

  async changePassword(passwordData: { old_password: string; new_password: string; new_password_confirm: string }): Promise<void> {
    await this.api.post('/api/accounts/users/change-password/', passwordData);
  }

  // My Profile methods
  async getMyProfile(): Promise<ApiMyProfile> {
    console.log('API: Fetching my profile data');
    const response: AxiosResponse<ApiMyProfile> = await this.api.get('/api/my-profile/');
    console.log('API: My profile response:', response.data);
    return response.data;
  }

  async updateMyProfile(profileData: Partial<ApiMyProfile>): Promise<ApiMyProfile> {
    console.log('API: Updating my profile data', profileData);
    const response: AxiosResponse<ApiMyProfile> = await this.api.patch('/api/my-profile/', profileData);
    console.log('API: My profile update response:', response.data);
    return response.data;
  }

  // Employee methods
  async getEmployees(params?: EmployeeQueryParams): Promise<PaginatedResponse<ApiEmployee>> {
    const response: AxiosResponse<PaginatedResponse<ApiEmployee>> = await this.api.get('/api/employees/', {
      params,
    });
    return response.data;
  }

  async getEmployeeByUserId(userId: string): Promise<ApiEmployee> {
    console.log('API: Fetching employee data for user_id:', userId);
    const response: AxiosResponse<ApiEmployee> = await this.api.get('/api/employees/', {
      params: { user_id: userId },
    });
    
    console.log('API: Raw response:', response.data);
    return response.data;
  }

  async getEmployee(employeeId: string): Promise<ApiEmployee> {
    const response: AxiosResponse<ApiEmployee> = await this.api.get(`/api/employees/${employeeId}/`);
    return response.data;
  }

  async createEmployee(employeeData: CreateEmployeeRequest): Promise<ApiEmployee> {
    const response: AxiosResponse<ApiEmployee> = await this.api.post('/api/employees/', employeeData);
    return response.data;
  }

  async updateEmployee(employeeId: string, employeeData: Partial<CreateEmployeeRequest>): Promise<ApiEmployee> {
    const response: AxiosResponse<ApiEmployee> = await this.api.patch(`/api/employees/${employeeId}/`, employeeData);
    return response.data;
  }

  async deleteEmployee(employeeId: string): Promise<void> {
    await this.api.delete(`/api/employees/${employeeId}/`);
  }

  // Company methods
  async getCompanies(): Promise<PaginatedResponse<ApiCompany>> {
    const response: AxiosResponse<PaginatedResponse<ApiCompany>> = await this.api.get('/api/org/companies/');
    return response.data;
  }

  async getCompany(companyId: string): Promise<ApiCompany> {
    const response: AxiosResponse<ApiCompany> = await this.api.get(`/api/org/companies/${companyId}/`);
    return response.data;
  }

  async createCompany(companyData: CreateCompanyRequest): Promise<ApiCompany> {
    const response: AxiosResponse<ApiCompany> = await this.api.post('/api/org/companies/create/', companyData);
    return response.data;
  }

  async updateCompany(companyId: string, companyData: Partial<CreateCompanyRequest>): Promise<ApiCompany> {
    const response: AxiosResponse<ApiCompany> = await this.api.patch(`/api/org/companies/${companyId}/`, companyData);
    return response.data;
  }

  async deleteCompany(companyId: string): Promise<void> {
    await this.api.delete(`/api/org/companies/${companyId}/`);
  }

  async importCompanies(file: File, dryRun: boolean = false): Promise<{ success: boolean; message: string; data?: any; errors?: any[] }> {
    const formData = new FormData();
    formData.append('file', file);

    const endpoint = dryRun ? '/api/org/companies/import/?dry_run=true' : '/api/org/companies/import/';

    try {
      const response: AxiosResponse<{ success: boolean; message: string; data?: any; errors?: any[] }> = await this.api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async importHierarchy(file: File, dryRun: boolean = false): Promise<{ success: boolean; message: string; data?: any; errors?: any[] }> {
    const formData = new FormData();
    formData.append('file', file);

    const endpoint = dryRun ? '/api/org/companies/import-hierarchy/?dry_run=true' : '/api/org/companies/import-hierarchy/';

    try {
      const response: AxiosResponse<{ success: boolean; message: string; data?: any; errors?: any[] }> = await this.api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }
  
  async importPlacements(file: File, dryRun: boolean = false): Promise<{ success: boolean; message: string; data?: any; errors?: any[] }> {
    const formData = new FormData();
    formData.append('file', file);

    const endpoint = dryRun ? '/api/org/placements/import-levels/?dry_run=true' : '/api/org/placements/import-levels/';

    try {
      const response: AxiosResponse<{ success: boolean; message: string; data?: any; errors?: any[] }> = await this.api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async importEmployees(file: File, dryRun: boolean = false): Promise<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const endpoint = dryRun ? '/api/employees/import/?dry_run=true' : '/api/employees/import/';

    try {
      const response: AxiosResponse<ImportResponse> = await this.api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Ensure we return the expected format even if backend returns different structure
      const data = response.data as any;

      // Normalize errors to ApiError[] if backend returns strings or a keyed object
      let normalizedErrors: ApiError[] | undefined;
      const rawErrors = data?.errors;
      if (Array.isArray(rawErrors)) {
        normalizedErrors = rawErrors.map((item: any) => {
          if (typeof item === 'string') {
            return { message: item, status: 400 } as ApiError;
          }
          if (item && typeof item === 'object') {
            return {
              message: item.message ?? 'Import error',
              status: item.status ?? 400,
              details: item.details,
            } as ApiError;
          }
          return { message: String(item), status: 400 } as ApiError;
        });
      } else if (rawErrors && typeof rawErrors === 'object') {
        // Preserve nested error object under details so UI can show a nested JSON
        normalizedErrors = [{
          message: 'Import validation errors',
          status: 400,
          details: rawErrors,
        } as ApiError];
      }

      return {
        status: 'imported',
        created: data.created || 0,
        updated: data.updated || 0,
        validated_count: data.validated_count,
        to_create: data.to_create,
        to_update: data.to_update,
        message: data.message,
        errors: normalizedErrors,
      };
    } 
    catch (error: any) {
      const apiError = (error);
      throw apiError;
    }
  }

  // Department methods
  async getDepartments(params?: DepartmentQueryParams): Promise<PaginatedResponse<ApiDepartment>> {
    const response: AxiosResponse<PaginatedResponse<ApiDepartment>> = await this.api.get('/api/org/departments/', {
      params,
    });
    return response.data;
  }

  async getDepartmentsByCompany(companyId: string): Promise<PaginatedResponse<ApiDepartment>> {
    const response: AxiosResponse<PaginatedResponse<ApiDepartment>> = await this.api.get('/api/org/departments/', {
      params: { company_id: companyId },
    });
    return response.data;
  }

  async getDepartment(departmentId: string): Promise<ApiDepartment> {
    const response: AxiosResponse<ApiDepartment> = await this.api.get(`/api/org/departments/${departmentId}/`);
    return response.data;
  }

  async createDepartment(departmentData: CreateDepartmentRequest): Promise<ApiDepartment> {
    const response: AxiosResponse<ApiDepartment> = await this.api.post('/api/org/departments/create/', departmentData);
    return response.data;
  }

  async updateDepartment(departmentId: string, departmentData: UpdateDepartmentRequest): Promise<ApiDepartment> {
    const response: AxiosResponse<ApiDepartment> = await this.api.patch(`/api/org/departments/${departmentId}/`, departmentData);
    return response.data;
  }

  async deleteDepartment(departmentId: string): Promise<void> {
    await this.api.delete(`/api/org/departments/${departmentId}/`);
  }

  // Sub-Department methods
  async getSubDepartments(params?: SubDepartmentQueryParams): Promise<PaginatedResponse<ApiSubDepartment>> {
    const response: AxiosResponse<PaginatedResponse<ApiSubDepartment>> = await this.api.get('/api/org/sub-departments/', {
      params,
    });
    return response.data;
  }

  async getSubDepartment(subDepartmentId: string): Promise<ApiSubDepartment> {
    const response: AxiosResponse<ApiSubDepartment> = await this.api.get(`/api/org/sub-departments/${subDepartmentId}/`);
    return response.data;
  }

  async createSubDepartment(subDepartmentData: CreateSubDepartmentRequest): Promise<ApiSubDepartment> {
    const response: AxiosResponse<ApiSubDepartment> = await this.api.post('/api/org/sub-departments/', subDepartmentData);
    return response.data;
  }

  async updateSubDepartment(subDepartmentId: string, subDepartmentData: UpdateSubDepartmentRequest): Promise<ApiSubDepartment> {
    const response: AxiosResponse<ApiSubDepartment> = await this.api.patch(`/api/org/sub-departments/${subDepartmentId}/`, subDepartmentData);
    return response.data;
  }

  async deleteSubDepartment(subDepartmentId: string): Promise<void> {
    await this.api.delete(`/api/org/sub-departments/${subDepartmentId}/`);
  }

  // Section methods
  async getSections(params?: SectionQueryParams): Promise<ApiSection[]> {
    const response: AxiosResponse<ApiSection[]> = await this.api.get('/api/org/sections/', {
      params,
    });
    return response.data;
  }

  async getSection(sectionId: string): Promise<ApiSection> {
    const response: AxiosResponse<ApiSection> = await this.api.get(`/api/org/sections/${sectionId}/`);
    return response.data;
  }

  async createSection(sectionData: CreateSectionRequest): Promise<ApiSection> {
    const response: AxiosResponse<ApiSection> = await this.api.post('/api/org/sections/', sectionData);
    return response.data;
  }

  async updateSection(sectionId: string, sectionData: UpdateSectionRequest): Promise<ApiSection> {
    const response: AxiosResponse<ApiSection> = await this.api.patch(`/api/org/sections/${sectionId}/`, sectionData);
    return response.data;
  }

  async deleteSection(sectionId: string): Promise<void> {
    await this.api.delete(`/api/org/sections/${sectionId}/`);
  }

  // Sub-Section methods
  async getSubSections(params?: SubSectionQueryParams): Promise<PaginatedResponse<ApiSubSection>> {
    const response: AxiosResponse<PaginatedResponse<ApiSubSection>> = await this.api.get('/api/org/sub-sections/', {
      params,
    });
    return response.data;
  }

  async getSubSection(subSectionId: string): Promise<ApiSubSection> {
    const response: AxiosResponse<ApiSubSection> = await this.api.get(`/api/org/sub-sections/${subSectionId}/`);
    return response.data;
  }

  async createSubSection(subSectionData: CreateSubSectionRequest): Promise<ApiSubSection> {
    const response: AxiosResponse<ApiSubSection> = await this.api.post('/api/org/sub-sections/', subSectionData);
    return response.data;
  }

  async updateSubSection(subSectionId: string, subSectionData: UpdateSubSectionRequest): Promise<ApiSubSection> {
    const response: AxiosResponse<ApiSubSection> = await this.api.patch(`/api/org/sub-sections/${subSectionId}/`, subSectionData);
    return response.data;
  }

  async deleteSubSection(subSectionId: string): Promise<void> {
    await this.api.delete(`/api/org/sub-sections/${subSectionId}/`);
  }

  // Evaluation methods
  async getEvaluations(params?: EvaluationQueryParams): Promise<PaginatedResponse<ApiEvaluation>> {
    const hasArrayParam = !!params && Object.values(params).some((v) => Array.isArray(v));
    if (params && hasArrayParam) {
      const sp = new URLSearchParams();
      Object.entries(params as Record<string, unknown>).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        if (Array.isArray(v)) {
          v.forEach((item) => {
            if (item === undefined || item === null) return;
            sp.append(k, String(item));
          });
          return;
        }
        const s = String(v);
        if (!s) return;
        sp.append(k, s);
      });
      const qs = sp.toString();
      const response: AxiosResponse<PaginatedResponse<ApiEvaluation>> = await this.api.get(
        qs ? `/api/evaluations/?${qs}` : '/api/evaluations/'
      );
      return response.data;
    }

    const response: AxiosResponse<PaginatedResponse<ApiEvaluation>> = await this.api.get('/api/evaluations/', { params });
    return response.data;
  }

  async getSelfEvaluations(): Promise<ApiEvaluation[]> {
    const response: AxiosResponse<ApiEvaluation[] | PaginatedResponse<ApiEvaluation> | ApiResponse<ApiEvaluation[]>> = await this.api.get('/api/evaluations/self-evaluate/');
    const data = response.data as any;
    if (Array.isArray(data)) return data;
    if (data?.results && Array.isArray(data.results)) return data.results;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
  }

  async getSelfEvaluationByEmployeeId(employeeId: string): Promise<ApiEvaluation[]> {
    const response: AxiosResponse<ApiEvaluation[] | PaginatedResponse<ApiEvaluation> | ApiResponse<ApiEvaluation[]>> = await this.api.get(`/api/evaluations/self-evaluate/?employee_id=${employeeId}`);
    const data = response.data as any;
    if (Array.isArray(data)) return data;
    if (data?.results && Array.isArray(data.results)) return data.results;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
  }

  async createSelfEvaluation(payload: { period: string; type: EvaluationType }): Promise<ApiEvaluation> {
    const response: AxiosResponse<ApiEvaluation | ApiResponse<ApiEvaluation>> = await this.api.post('/api/evaluations/self-evaluate/', payload);
    const data = response.data as any;
    return (data?.data ?? data) as ApiEvaluation;
  }

  async getEvaluation(evaluationId: string): Promise<ApiEvaluation> {
    const response: AxiosResponse<ApiEvaluation> = await this.api.get(`/api/evaluations/${evaluationId}/`);
    return response.data;
  }

  async createEvaluation(evaluationData: CreateEvaluationRequest): Promise<ApiEvaluation> {
    const response: AxiosResponse<ApiEvaluation> = await this.api.post('/api/evaluations/', evaluationData);
    return response.data;
  }

  async updateEvaluation(evaluationId: string, evaluationData: UpdateEvaluationRequest): Promise<ApiEvaluation> {
    const response: AxiosResponse<ApiEvaluation> = await this.api.patch(`/api/evaluations/${evaluationId}/`, evaluationData);
    return response.data;
  }

  async deleteEvaluation(evaluationId: string): Promise<void> {
    await this.api.delete(`/api/evaluations/${evaluationId}/`);
  }

  // Objective methods
  async getObjectives(evaluationId: string): Promise<ApiObjective[]> {
    const response: AxiosResponse<ApiObjective[] | PaginatedResponse<ApiObjective> | ApiResponse<ApiObjective[]>> = await this.api.get(`/api/objectives/?evaluation_id=${evaluationId}`);
    
    // Handle different response formats
    if (Array.isArray(response.data)) {
      // Direct array response
      return response.data;
    } else if (response.data && 'results' in response.data && Array.isArray(response.data.results)) {
      // Paginated response
      return response.data.results;
    } else if (response.data && 'data' in response.data && Array.isArray(response.data.data)) {
      // Wrapped response
      return response.data.data;
    } else {
      // Unexpected format, return empty array
      console.warn('Unexpected response format for objectives:', response.data);
      return [];
    }
  }

  async createObjective(objectiveData: CreateObjectiveRequest): Promise<ApiObjective> {
    const response = await this.api.post('/api/objectives/', objectiveData);
    return response.data;
  }

  async updateObjective(objectiveId: string, objectiveData: UpdateObjectiveRequest): Promise<ApiObjective> {
    const response = await this.api.patch(`/api/objectives/${objectiveId}/`, objectiveData);
    return response.data;
  }

  async deleteObjective(objectiveId: string): Promise<void> {
    await this.api.delete(`/api/objectives/${objectiveId}/`);
  }

  // Competency methods
  async getCompetencies(evaluationId: string): Promise<ApiCompetency[]> {
    const response = await this.api.get(`/api/competencies/?evaluation_id=${evaluationId}`);
    return response.data;
  }

  async createCompetency(competencyData: CreateCompetencyRequest): Promise<ApiCompetency> {
    const response = await this.api.post('/api/competencies/', competencyData);
    return response.data;
  }

  async updateCompetency(competencyId: string, competencyData: UpdateCompetencyRequest): Promise<ApiCompetency> {
    const response = await this.api.patch(`/api/competencies/${competencyId}/`, competencyData);
    return response.data;
  }

  async deleteCompetency(competencyId: string): Promise<void> {
    await this.api.delete(`/api/competencies/${competencyId}/`);
  }

  async getActivityLogByEvaluationId(evaluationId: string): Promise<ApiActivityLog[]> {
    const response: AxiosResponse<ApiActivityLog[] | _PaginatedResponse<ApiActivityLog> | ApiResponse<ApiActivityLog[]>> = await this.api.get(`/api/activity-log/?evaluation_id=${evaluationId}`);
    const data = response.data as any;
    if (Array.isArray(data)) return data;
    if (data?.results && Array.isArray(data.results)) return data.results;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
  }

  async createActivityLog(payload: CreateActivityLogRequest): Promise<ApiActivityLog> {
    const response: AxiosResponse<ApiActivityLog | ApiResponse<ApiActivityLog>> = await this.api.post('/api/activity-log/', payload);
    const data = response.data as any;
    if (data?.data) return data.data as ApiActivityLog;
    return data as ApiActivityLog;
  }

  // Utility methods
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // Check if token is expired (basic JWT check)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (error) {
      // If token parsing fails, consider it invalid
      return false;
    }
  }

  // Test API connectivity
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log('Testing API connection to:', this.api.defaults.baseURL);
      // Use a valid API endpoint instead of root URL to avoid 404 errors
      const response = await this.api.get('/api/auth/validate/', { timeout: 5000 });
      return {
        success: true,
        message: 'API connection successful',
        details: { status: response.status, url: this.api.defaults.baseURL }
      };
    } catch (error: any) {
      // If the endpoint requires authentication, that's still a successful connection
      if (error.response?.status === 401) {
        return {
          success: true,
          message: 'API connection successful (authentication required)',
          details: { status: error.response.status, url: this.api.defaults.baseURL }
        };
      }
      const apiError = this.handleError(error);
      return {
        success: false,
        message: apiError.message,
        details: { status: apiError.status, url: this.api.defaults.baseURL }
      };
    }
  }

  getToken(): string | null {
    return this.token;
  }

  // Method to manually set token (useful for testing or external auth)
  setToken(token: string): void {
    this.saveToken(token);
  }

  // Validate current token
  async validateToken(): Promise<boolean> {
    try {
      if (!this.isAuthenticated()) {
        return false;
      }
      
      // Make a simple request to validate token
      await this.api.get('/api/auth/validate/');
      return true;
    } catch (error) {
      this.clearToken();
      return false;
    }
  }

  // Weights Configuration Methods
  async getWeightsConfiguration(level: WeightsConfigurationLevel): Promise<WeightsConfiguration> {
    const response: AxiosResponse<WeightsConfiguration> = await this.api.get(`/api/weights-configuration/${level}/`);
    return response.data;
  }

  async updateWeightsConfiguration(level: WeightsConfigurationLevel, configData: UpdateWeightsConfigurationRequest): Promise<WeightsConfiguration> {
    const response: AxiosResponse<WeightsConfiguration> = await this.api.put(`/api/weights-configuration/${level}/`, configData);
    return response.data;
  }

  // Placement methods
  async getPlacements(): Promise<ApiPlacement[]> {
    const response: AxiosResponse<ApiPlacement[]> = await this.api.get('/api/org/placements/');
    return response.data;
  }

  async getPlacement(placementId: string): Promise<ApiPlacement> {
    const response: AxiosResponse<ApiPlacement> = await this.api.get(`/api/org/placements/${placementId}`);
    return response.data;
  }

  async createPlacement(placementData: CreatePlacementRequest): Promise<ApiPlacement> {
    const response: AxiosResponse<ApiPlacement> = await this.api.post('/api/org/placements/', placementData);
    return response.data;
  }

  async updatePlacement(employeeId: string, placementData: Partial<CreatePlacementRequest>): Promise<ApiPlacement> {
    const response: AxiosResponse<ApiPlacement> = await this.api.put(`/api/org/placements/${employeeId}/`, placementData);
    return response.data;
  }

  async deletePlacement(placementId: string): Promise<void> {
    await this.api.delete(`/api/org/placements/${placementId}`);
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();
export default apiService;

// Export the class for testing or multiple instances if needed
export { ApiService };
