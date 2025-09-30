import { useEmployees } from './useApi';
import { ApiEmployee, PaginatedResponse } from '@/types/api';
import { UseQueryOptions } from '@tanstack/react-query';

export interface Manager {
  id: string;
  name: string;
  role: string;
  employee_id: string;
  user_id: string;
}

/**
 * Custom hook to fetch managers (employees with roles LM, HOD, HR) for a specific company
 * @param companyId - The company ID to filter managers by
 * @param options - Additional query options
 * @returns Query result with managers data
 */
export const useManagers = (
  companyId?: string,
  options?: UseQueryOptions<Manager[], Error>
) => {
  // Use the existing useEmployees hook with role filtering
  // Pass multiple roles as comma-separated string to the API
  const employeesQuery = useEmployees(
    companyId ? { 
      company_id: companyId,
      role: "LM,HOD" // Filter by multiple roles at API level
    } : undefined,
    {
      enabled: !!companyId, // Only fetch when companyId is provided
      select: (data: PaginatedResponse<ApiEmployee> | ApiEmployee[]) => {
        // Handle both paginated response and direct array response
        let employees: ApiEmployee[] = [];
        
        if (Array.isArray(data)) {
          employees = data;
        } else if (data?.results && Array.isArray(data.results)) {
          employees = data.results;
        }
        
        // Transform to Manager interface (filtering already done by API)
        const managers = employees.map((employee: ApiEmployee): Manager => ({
          id: employee.employee_id,
          name: employee.name,
          role: employee.role,
          employee_id: employee.employee_id,
          user_id: employee.user_id
        }));
        
        return managers;
      },
      ...options,
    }
  );

  return {
    ...employeesQuery,
    data: employeesQuery.data || [],
    managers: employeesQuery.data || [],
  };
};

export default useManagers;