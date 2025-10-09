import { useEmployees } from './useApi';
import { ApiEmployee } from '@/types/api';
import { UseQueryOptions } from '@tanstack/react-query';

export interface Manager {
  id: string;
  name: string;
  role: string;
  employee_id: string;
  user_id: string;
}

/**
 * Custom hook to fetch managers (employees with roles LM, HOD, HR) for a specific company and/or department
 * @param companyId - The company ID to filter managers by
 * @param departmentId - The department ID to filter managers by
 * @param options - Additional query options
 * @returns Query result with managers data
 */
export const useManagers = (
  companyId?: string,
  departmentId?: string,
  options?: UseQueryOptions<Manager[], Error>
) => {
  // Use the existing useEmployees hook with role filtering
  // Pass multiple roles as comma-separated string to the API
  const employeesQuery = useEmployees(
    (companyId || departmentId) ? { 
      ...(companyId && { company_id: companyId }),
      ...(departmentId && { department_id: departmentId }),
      role: "LM,HOD,HR" // Filter by multiple roles at API level including HR
    } : undefined,
    {
      enabled: !!(companyId || departmentId), // Only fetch when companyId or departmentId is provided
      select: (data: ApiEmployee[]) => {
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