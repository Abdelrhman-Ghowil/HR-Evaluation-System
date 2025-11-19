# API Integration Guide

This guide explains how to integrate the HR Evaluation System frontend with your backend API using the provided API service and React Query hooks.

## 🚀 Quick Start

### 1. Environment Setup

Copy the example environment file and configure your API URL:

```bash
cp .env.example .env
```

Edit `.env` and set your backend API URL:

```env
VITE_API_BASE_URL=https://hr-eval-sys-dev.replit.app/
# or your production API URL
# VITE_API_BASE_URL=https://hr-eval-sys-dev.replit.app/
```

### 2. Backend API Requirements

Your backend should implement the following endpoints as specified:

#### Authentication
- `POST /api/auth/login/` - User login with email, username, and password
- Returns JWT tokens and user information

#### Users & Employees
- `GET /api/employees/` - List employees
- `POST /api/employees/` - Create employee
- `GET /api/employees/{id}/` - Get employee details
- `PATCH /api/employees/{id}/` - Update employee
- `DELETE /api/employees/{id}/` - Delete employee
- `POST /api/accounts/users/` - Create user
- `PATCH /api/accounts/users/{id}/` - Update user

#### Companies & Departments
- `GET /api/org/companies/` - List companies
- `POST /api/org/companies/create/` - Create company
- `GET /api/org/departments/` - List departments
- `POST /api/org/departments/create/` - Create department
- `PATCH /api/org/departments/{id}/` - Update department

#### Evaluations
- `GET /api/evaluations/` - List evaluations
- `POST /api/evaluations/` - Create evaluation
- `GET /api/evaluations/{id}/` - Get evaluation details
- `PATCH /api/evaluations/{id}/` - Update evaluation
- `DELETE /api/evaluations/{id}/` - Delete evaluation

## 📁 File Structure

```
src/
├── services/
│   └── api.ts              # Main API service with axios configuration
├── types/
│   └── api.ts              # TypeScript types for API requests/responses
├── hooks/
│   └── useApi.ts           # React Query hooks for API operations
├── contexts/
│   └── AuthContext.tsx     # Updated authentication context
└── components/
    ├── auth/
    │   └── LoginPage.tsx    # Updated login form
    └── examples/
        └── ApiIntegrationExample.tsx  # Example usage component
```

## 🔧 API Service Usage

### Basic API Service

```typescript
import apiService from '../services/api';

// Direct API calls (not recommended for components)
const employees = await apiService.getEmployees();
const newEmployee = await apiService.createEmployee(employeeData);
```

### React Query Hooks (Recommended)

```typescript
import { useEmployees, useCreateEmployee } from '../hooks/useApi';

function EmployeeList() {
  // Fetch employees with caching and automatic refetching
  const { data, isLoading, error } = useEmployees();
  
  // Create employee mutation with optimistic updates
  const createEmployee = useCreateEmployee({
    onSuccess: () => {
      // Custom success handling
      console.log('Employee created successfully!');
    }
  });

  const handleCreate = (employeeData) => {
    createEmployee.mutate(employeeData);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.results?.map(employee => (
        <div key={employee.id}>{employee.user?.name}</div>
      ))}
    </div>
  );
}
```

## 🔐 Authentication

### Login Process

```typescript
import { useAuth } from '../hooks/useAuth';

function LoginForm() {
  const { login, isLoading } = useAuth();
  
  const handleSubmit = async (email, username, password) => {
    const success = await login(email, username, password);
    if (success) {
      // Redirect to dashboard
    }
  };
}
```

### Protected Routes

```typescript
import { useAuth } from '../hooks/useAuth';

function ProtectedComponent() {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return <div>Welcome, {user?.name}!</div>;
}
```

## 📊 Data Types

### User Roles
- `ADMIN` - System Administrator
- `HR` - Human Resources
- `HOD` - Head of Department
- `LM` - Line Manager
- `EMP` - Employee

### Employee Status
- `ACTIVE` - Active employee
- `INACTIVE` - Inactive employee

### Managerial Levels
- `IC` - Individual Contributor
- `SUPERVISORY` - Supervisory level
- `MIDDLE` - Middle management

### Evaluation Types
- `ANNUAL` - Annual evaluation
- `QUARTERLY` - Quarterly evaluation
- `MONTHLY` - Monthly evaluation
- `PROBATION` - Probation evaluation

### Evaluation Status
- `DRAFT` - Draft status
- `PENDING_HOD` - Pending HOD approval
- `PENDING_HR` - Pending HR approval
- `EMPLOYEE_REVIEW` - Employee review
- `APPROVED` - Approved
- `REJECTED` - Rejected
- `COMPLETED` - Completed

## 🎯 Example Usage

### Creating an Employee

```typescript
import { useCreateEmployee } from '../hooks/useApi';

function CreateEmployeeForm() {
  const createEmployee = useCreateEmployee();
  
  const handleSubmit = (formData) => {
    const employeeData = {
      user_id: formData.userId,
      company: formData.companyId,
      managerial_level: 'IC',
      status: 'ACTIVE',
      join_date: '2024-01-15'
    };
    
    createEmployee.mutate(employeeData);
  };
}
```

### Fetching with Filters

```typescript
import { useEmployees } from '../hooks/useApi';

function FilteredEmployeeList() {
  const [filters, setFilters] = useState({
    status: 'ACTIVE',
    role: 'EMP'
  });
  
  const { data, isLoading } = useEmployees(filters);
  
  return (
    <div>
      {/* Filter controls */}
      <select onChange={(e) => setFilters({...filters, status: e.target.value})}>
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
      </select>
      
      {/* Employee list */}
      {data?.results?.map(employee => (
        <EmployeeCard key={employee.id} employee={employee} />
      ))}
    </div>
  );
}
```

### Creating an Evaluation

```typescript
import { useCreateEvaluation } from '../hooks/useApi';

function CreateEvaluationForm() {
  const createEvaluation = useCreateEvaluation();
  
  const handleSubmit = (formData) => {
    const evaluationData = {
      employee_id: formData.employeeId,
      type: 'ANNUAL',
      status: 'DRAFT',
      period: '2024-Q1'
    };
    
    createEvaluation.mutate(evaluationData);
  };
}
```

## 🔧 Error Handling

The API service includes comprehensive error handling:

```typescript
import { useEmployees } from '../hooks/useApi';

function EmployeeList() {
  const { data, isLoading, error } = useEmployees();
  
  if (error) {
    return (
      <div className="error">
        <h3>Error Loading Employees</h3>
        <p>{error.message}</p>
        {error.status === 401 && <p>Please log in again</p>}
        {error.details && (
          <ul>
            {Object.entries(error.details).map(([field, errors]) => (
              <li key={field}>{field}: {errors.join(', ')}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }
}
```

## 🚀 Performance Features

### Caching
- Automatic caching with React Query
- Configurable stale times for different data types
- Background refetching

### Optimistic Updates
- Immediate UI updates for better UX
- Automatic rollback on errors

### Request Deduplication
- Automatic deduplication of identical requests
- Reduced server load

## 🔒 Security Features

### JWT Token Management
- Automatic token storage and retrieval
- Token refresh handling
- Automatic logout on token expiration

### Request Interceptors
- Automatic authorization header injection
- Request/response logging (development)
- Error handling and retry logic

## 🧪 Testing

Example test for API hooks:

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEmployees } from '../hooks/useApi';

test('useEmployees hook', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  
  const { result } = renderHook(() => useEmployees(), { wrapper });
  
  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });
});
```

## 📝 Notes

1. **Environment Variables**: Always use environment variables for API URLs
2. **Error Handling**: The service includes comprehensive error handling with user-friendly messages
3. **Type Safety**: Full TypeScript support with proper type definitions
4. **Caching**: React Query provides intelligent caching and background updates
5. **Authentication**: JWT tokens are automatically managed and included in requests
6. **Toast Notifications**: Success and error messages are automatically displayed

## 🔗 Related Files

- `src/services/api.ts` - Main API service
- `src/types/api.ts` - TypeScript type definitions
- `src/hooks/useApi.ts` - React Query hooks
- `src/contexts/AuthContext.tsx` - Authentication context
- `src/components/examples/ApiIntegrationExample.tsx` - Usage examples

For more examples, check the `ApiIntegrationExample` component which demonstrates CRUD operations for employees, companies, and evaluations.