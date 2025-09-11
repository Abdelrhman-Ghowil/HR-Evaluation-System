import { ApiSubDepartment, ApiSection, ApiSubSection, PaginatedResponse } from '../types/api';

// Mock Sub-Departments Data
export const mockSubDepartments: ApiSubDepartment[] = [
  {
    sub_department_id: 'mock-sub-dept-1',
    name: 'Human Resources Operations',
    department: 'dept-1',
    manager: 'Sarah Johnson',
    employee_count: 15,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    sub_department_id: 'mock-sub-dept-2',
    name: 'Talent Acquisition',
    department: 'dept-1',
    manager: 'Michael Chen',
    employee_count: 8,
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z'
  },
  {
    sub_department_id: 'mock-sub-dept-3',
    name: 'Employee Benefits',
    department: 'dept-1',
    manager: 'Lisa Rodriguez',
    employee_count: 6,
    created_at: '2024-01-17T10:00:00Z',
    updated_at: '2024-01-17T10:00:00Z'
  },
  {
    sub_department_id: 'mock-sub-dept-4',
    name: 'Software Development',
    department: 'dept-2',
    manager: 'David Kim',
    employee_count: 25,
    created_at: '2024-01-18T10:00:00Z',
    updated_at: '2024-01-18T10:00:00Z'
  },
  {
    sub_department_id: 'mock-sub-dept-5',
    name: 'Quality Assurance',
    department: 'dept-2',
    manager: 'Emily Davis',
    employee_count: 12,
    created_at: '2024-01-19T10:00:00Z',
    updated_at: '2024-01-19T10:00:00Z'
  },
  {
    sub_department_id: 'mock-sub-dept-6',
    name: 'DevOps & Infrastructure',
    department: 'dept-2',
    manager: 'James Wilson',
    employee_count: 8,
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z'
  },
  {
    sub_department_id: 'mock-sub-dept-7',
    name: 'Product Management',
    department: 'dept-2',
    manager: 'Anna Thompson',
    employee_count: 5,
    created_at: '2024-01-21T10:00:00Z',
    updated_at: '2024-01-21T10:00:00Z'
  },
  {
    sub_department_id: 'mock-sub-dept-8',
    name: 'Financial Planning',
    department: 'dept-3',
    manager: 'Robert Brown',
    employee_count: 10,
    created_at: '2024-01-22T10:00:00Z',
    updated_at: '2024-01-22T10:00:00Z'
  },
  {
    sub_department_id: 'mock-sub-dept-9',
    name: 'Accounting',
    department: 'dept-3',
    manager: 'Jennifer Lee',
    employee_count: 14,
    created_at: '2024-01-23T10:00:00Z',
    updated_at: '2024-01-23T10:00:00Z'
  },
  {
    sub_department_id: 'mock-sub-dept-10',
    name: 'Budget Analysis',
    department: 'dept-3',
    manager: 'Mark Garcia',
    employee_count: 7,
    created_at: '2024-01-24T10:00:00Z',
    updated_at: '2024-01-24T10:00:00Z'
  },
  {
    sub_department_id: 'mock-sub-dept-11',
    name: 'Digital Marketing',
    department: 'dept-4',
    manager: 'Sophie Martinez',
    employee_count: 12,
    created_at: '2024-01-25T10:00:00Z',
    updated_at: '2024-01-25T10:00:00Z'
  },
  {
    sub_department_id: 'mock-sub-dept-12',
    name: 'Brand Management',
    department: 'dept-4',
    manager: 'Alex Turner',
    employee_count: 8,
    created_at: '2024-01-26T10:00:00Z',
    updated_at: '2024-01-26T10:00:00Z'
  }
];

// Mock Sections Data
export const mockSections: ApiSection[] = [
  {
    section_id: 'mock-section-1',
    name: 'Employee Relations',
    sub_department: 'mock-sub-dept-1',
    manager: 'Tom Anderson',
    employee_count: 6,
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z'
  },
  {
    section_id: 'mock-section-2',
    name: 'Benefits Administration',
    sub_department: 'mock-sub-dept-3',
    manager: 'Rachel Green',
    employee_count: 9,
    created_at: '2024-01-21T10:00:00Z',
    updated_at: '2024-01-21T10:00:00Z'
  },
  {
    section_id: 'mock-section-3',
    name: 'Frontend Development',
    sub_department: 'mock-sub-dept-4',
    manager: 'Chris Parker',
    employee_count: 12,
    created_at: '2024-01-22T10:00:00Z',
    updated_at: '2024-01-22T10:00:00Z'
  },
  {
    section_id: 'mock-section-4',
    name: 'Backend Development',
    sub_department: 'mock-sub-dept-4',
    manager: 'Nina Patel',
    employee_count: 13,
    created_at: '2024-01-23T10:00:00Z',
    updated_at: '2024-01-23T10:00:00Z'
  },
  {
    section_id: 'mock-section-5',
    name: 'Test Automation',
    sub_department: 'mock-sub-dept-5',
    manager: 'Kevin Liu',
    employee_count: 7,
    created_at: '2024-01-24T10:00:00Z',
    updated_at: '2024-01-24T10:00:00Z'
  },
  {
    section_id: 'mock-section-6',
    name: 'Manual Testing',
    sub_department: 'mock-sub-dept-5',
    manager: 'Maria Santos',
    employee_count: 5,
    created_at: '2024-01-25T10:00:00Z',
    updated_at: '2024-01-25T10:00:00Z'
  }
];

// Mock Sub-Sections Data
export const mockSubSections: ApiSubSection[] = [
  {
    sub_section_id: 'mock-subsection-1',
    name: 'React Development',
    section: 'mock-section-3',
    manager: 'manager-9',
    employee_count: 6,
    created_at: '2024-01-25T10:00:00Z',
    updated_at: '2024-01-25T10:00:00Z'
  },
  {
    sub_section_id: 'mock-subsection-2',
    name: 'Vue.js Development',
    section: 'mock-section-3',
    manager: 'manager-10',
    employee_count: 6,
    created_at: '2024-01-26T10:00:00Z',
    updated_at: '2024-01-26T10:00:00Z'
  },
  {
    sub_section_id: 'mock-subsection-3',
    name: 'API Development',
    section: 'mock-section-4',
    manager: 'manager-11',
    employee_count: 7,
    created_at: '2024-01-27T10:00:00Z',
    updated_at: '2024-01-27T10:00:00Z'
  },
  {
    sub_section_id: 'mock-subsection-4',
    name: 'Database Management',
    section: 'mock-section-4',
    manager: 'manager-12',
    employee_count: 6,
    created_at: '2024-01-28T10:00:00Z',
    updated_at: '2024-01-28T10:00:00Z'
  }
];

// Mock Data Service
export class MockDataService {
  // Sub-Departments
  static getSubDepartments(departmentId?: string): PaginatedResponse<ApiSubDepartment> {
    let filteredData = mockSubDepartments;
    
    if (departmentId) {
      filteredData = mockSubDepartments.filter(subDept => subDept.department === departmentId);
    }
    
    return {
      count: filteredData.length,
      next: null,
      previous: null,
      results: filteredData
    };
  }

  static getSubDepartment(subDepartmentId: string): ApiSubDepartment | null {
    return mockSubDepartments.find(subDept => subDept.sub_department_id === subDepartmentId) || null;
  }

  static createSubDepartment(data: any): ApiSubDepartment {
    const newSubDepartment: ApiSubDepartment = {
      sub_department_id: `mock-sub-dept-${Date.now()}`,
      name: data.name,
      department: data.department,
      manager: data.manager,
      employee_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mockSubDepartments.push(newSubDepartment);
    return newSubDepartment;
  }

  static updateSubDepartment(subDepartmentId: string, data: any): ApiSubDepartment | null {
    const index = mockSubDepartments.findIndex(subDept => subDept.sub_department_id === subDepartmentId);
    if (index !== -1) {
      mockSubDepartments[index] = {
        ...mockSubDepartments[index],
        ...data,
        updated_at: new Date().toISOString()
      };
      return mockSubDepartments[index];
    }
    return null;
  }

  static deleteSubDepartment(subDepartmentId: string): boolean {
    const index = mockSubDepartments.findIndex(subDept => subDept.sub_department_id === subDepartmentId);
    if (index !== -1) {
      mockSubDepartments.splice(index, 1);
      return true;
    }
    return false;
  }

  // Sections
  static getSections(subDepartmentId?: string): PaginatedResponse<ApiSection> {
    let filteredData = mockSections;
    
    if (subDepartmentId) {
      filteredData = mockSections.filter(section => section.sub_department === subDepartmentId);
    }
    
    return {
      count: filteredData.length,
      next: null,
      previous: null,
      results: filteredData
    };
  }

  static getSection(sectionId: string): ApiSection | null {
    return mockSections.find(section => section.section_id === sectionId) || null;
  }

  static createSection(data: any): ApiSection {
    const newSection: ApiSection = {
      section_id: `mock-section-${Date.now()}`,
      name: data.name,
      sub_department: data.sub_department,
      manager: data.manager,
      employee_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mockSections.push(newSection);
    return newSection;
  }

  static updateSection(sectionId: string, data: any): ApiSection | null {
    const index = mockSections.findIndex(section => section.section_id === sectionId);
    if (index !== -1) {
      mockSections[index] = {
        ...mockSections[index],
        ...data,
        updated_at: new Date().toISOString()
      };
      return mockSections[index];
    }
    return null;
  }

  static deleteSection(sectionId: string): boolean {
    const index = mockSections.findIndex(section => section.section_id === sectionId);
    if (index !== -1) {
      mockSections.splice(index, 1);
      return true;
    }
    return false;
  }

  // Sub-Sections
  static getSubSections(sectionId?: string): PaginatedResponse<ApiSubSection> {
    let filteredData = mockSubSections;
    
    if (sectionId) {
      filteredData = mockSubSections.filter(subSection => subSection.section === sectionId);
    }
    
    return {
      count: filteredData.length,
      next: null,
      previous: null,
      results: filteredData
    };
  }

  static getSubSection(subSectionId: string): ApiSubSection | null {
    return mockSubSections.find(subSection => subSection.sub_section_id === subSectionId) || null;
  }

  static createSubSection(data: any): ApiSubSection {
    const newSubSection: ApiSubSection = {
      sub_section_id: `mock-subsection-${Date.now()}`,
      name: data.name,
      section: data.section,
      manager: data.manager,
      employee_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mockSubSections.push(newSubSection);
    return newSubSection;
  }

  static updateSubSection(subSectionId: string, data: any): ApiSubSection | null {
    const index = mockSubSections.findIndex(subSection => subSection.sub_section_id === subSectionId);
    if (index !== -1) {
      mockSubSections[index] = {
        ...mockSubSections[index],
        ...data,
        updated_at: new Date().toISOString()
      };
      return mockSubSections[index];
    }
    return null;
  }

  static deleteSubSection(subSectionId: string): boolean {
    const index = mockSubSections.findIndex(subSection => subSection.sub_section_id === subSectionId);
    if (index !== -1) {
      mockSubSections.splice(index, 1);
      return true;
    }
    return false;
  }
}