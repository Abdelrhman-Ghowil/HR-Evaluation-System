import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ApiDepartment, ApiSubDepartment, ApiSection, ApiSubSection } from '../types/api';

interface OrganizationalContextType {
  // Current selections
  selectedDepartment: ApiDepartment | null;
  selectedSubDepartment: ApiSubDepartment | null;
  selectedSection: ApiSection | null;
  selectedSubSection: ApiSubSection | null;
  
  // Navigation path
  navigationPath: string[];
  
  // Setters
  setDepartment: (department: ApiDepartment | null) => void;
  setSubDepartment: (subDepartment: ApiSubDepartment | null) => void;
  setSection: (section: ApiSection | null) => void;
  setSubSection: (subSection: ApiSubSection | null) => void;
  
  // Utility functions
  clearSelection: () => void;
  goBack: () => void;
  getBreadcrumbs: () => { name: string; path: string }[];
  validateNavigation: (page: string) => boolean;
}

const OrganizationalContext = createContext<OrganizationalContextType | undefined>(undefined);

interface OrganizationalProviderProps {
  children: ReactNode;
}

export const OrganizationalProvider: React.FC<OrganizationalProviderProps> = ({ children }) => {
  const [selectedDepartment, setSelectedDepartment] = useState<ApiDepartment | null>(null);
  const [selectedSubDepartment, setSelectedSubDepartment] = useState<ApiSubDepartment | null>(null);
  const [selectedSection, setSelectedSection] = useState<ApiSection | null>(null);
  const [selectedSubSection, setSelectedSubSection] = useState<ApiSubSection | null>(null);

  const setDepartment = (department: ApiDepartment | null) => {
    setSelectedDepartment(department);
    // Clear lower level selections when department changes
    setSelectedSubDepartment(null);
    setSelectedSection(null);
    setSelectedSubSection(null);
  };

  const setSubDepartment = (subDepartment: ApiSubDepartment | null) => {
    setSelectedSubDepartment(subDepartment);
    // Clear lower level selections when sub-department changes
    setSelectedSection(null);
    setSelectedSubSection(null);
  };

  const setSection = (section: ApiSection | null) => {
    setSelectedSection(section);
    // Clear lower level selections when section changes
    setSelectedSubSection(null);
  };

  const setSubSection = (subSection: ApiSubSection | null) => {
    setSelectedSubSection(subSection);
  };

  const clearSelection = () => {
    setSelectedDepartment(null);
    setSelectedSubDepartment(null);
    setSelectedSection(null);
    setSelectedSubSection(null);
  };

  const goBack = () => {
    if (selectedSubSection) {
      setSelectedSubSection(null);
    } else if (selectedSection) {
      setSelectedSection(null);
    } else if (selectedSubDepartment) {
      setSelectedSubDepartment(null);
    } else if (selectedDepartment) {
      setSelectedDepartment(null);
    }
  };

  const getBreadcrumbs = () => {
    const breadcrumbs: { name: string; path: string }[] = [
      { name: 'Departments', path: 'departments' }
    ];

    if (selectedDepartment) {
      breadcrumbs.push({
        name: selectedDepartment.name,
        path: 'sub-departments'
      });
    }

    if (selectedSubDepartment) {
      breadcrumbs.push({
        name: selectedSubDepartment.name,
        path: 'sections'
      });
    }

    if (selectedSection) {
      breadcrumbs.push({
        name: selectedSection.name,
        path: 'sub-sections'
      });
    }

    if (selectedSubSection) {
      breadcrumbs.push({
        name: selectedSubSection.name,
        path: 'sub-section-details'
      });
    }

    return breadcrumbs;
  };

  const navigationPath = getBreadcrumbs().map(b => b.name);

  const validateNavigation = (page: string): boolean => {
    switch (page) {
      case 'departments':
        return true; // Always accessible
      case 'sub-departments':
        return selectedDepartment !== null; // Requires department selection
      case 'sections':
        return true; // Independent navigation - no parent requirement
      case 'sub-sections':
        return true; // Independent navigation - no parent requirement
      default:
        return false;
    }
  };

  const value: OrganizationalContextType = {
    selectedDepartment,
    selectedSubDepartment,
    selectedSection,
    selectedSubSection,
    navigationPath,
    setDepartment,
    setSubDepartment,
    setSection,
    setSubSection,
    clearSelection,
    goBack,
    getBreadcrumbs,
    validateNavigation
  };

  return (
    <OrganizationalContext.Provider value={value}>
      {children}
    </OrganizationalContext.Provider>
  );
};

export const useOrganizational = (): OrganizationalContextType => {
  const context = useContext(OrganizationalContext);
  if (context === undefined) {
    throw new Error('useOrganizational must be used within an OrganizationalProvider');
  }
  return context;
};

export default OrganizationalContext;