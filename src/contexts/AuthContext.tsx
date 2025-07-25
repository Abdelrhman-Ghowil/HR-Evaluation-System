
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import apiService from '../services/api';
import { ApiUser, UserRole } from '../types/api';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'hr' | 'manager' | 'employee';
  department: string;
  avatar?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  title?: string;
}

// Helper function to map API user role to local role
const mapApiRoleToLocalRole = (apiRole: UserRole): User['role'] => {
  switch (apiRole) {
    case 'ADMIN':
      return 'admin';
    case 'HR':
      return 'hr';
    case 'HOD':
    case 'LM':
      return 'manager';
    case 'EMP':
      return 'employee';
    default:
      return 'employee';
  }
};

// Helper function to convert API user to local user format
const convertApiUserToLocalUser = (apiUser: ApiUser): User => {
  return {
    id: apiUser.id,
    name: apiUser.name || `${apiUser.first_name} ${apiUser.last_name}`.trim(),
    email: apiUser.email,
    role: mapApiRoleToLocalRole(apiUser.role),
    department: apiUser.title || 'Unknown', // Using title as department for now
    avatar: apiUser.avatar,
    username: apiUser.username,
    first_name: apiUser.first_name,
    last_name: apiUser.last_name,
    phone: apiUser.phone,
    title: apiUser.title,
  };
};

interface AuthContextType {
  user: User | null;
  login: (email: string, username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = async (email: string, username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      console.log('Attempting login with:', { email, username, password: '***' });
      const response = await apiService.login({ email, username, password });
      console.log('Login response:', response);
      
      if (response.user) {
        const localUser = convertApiUserToLocalUser(response.user);
        console.log('Converted local user:', localUser);
        setUser(localUser);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(localUser));
        toast.success(`Welcome back, ${localUser.name}!`);
        setIsLoading(false);
        return true;
      } else {
        console.error('No user in response:', response);
        toast.error('Login failed: No user data received');
        setIsLoading(false);
        return false;
      }
    } catch (error: any) {
      console.error('Login error details:', {
        message: error.message,
        status: error.status,
        details: error.details,
        stack: error.stack
      });
      toast.error(error.message || 'Login failed. Please check your credentials.');
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      toast.success('Logged out successfully');
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = () => {
      const savedUser = localStorage.getItem('user');
      const isApiAuthenticated = apiService.isAuthenticated();
      
      if (savedUser && isApiAuthenticated) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error parsing saved user:', error);
          logout();
        }
      } else if (!isApiAuthenticated) {
        // Clear any stale user data if API token is invalid
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('user');
      }
    };

    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
