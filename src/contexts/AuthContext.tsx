
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import apiService from '../services/api';
import { useQueryClient } from '@tanstack/react-query';
import { ApiUser, UserRole } from '../types/api';
import { toast } from 'sonner';

interface User {
  user_id: string;
  name: string;
  email: string;
  role: 'admin' | 'hr' | 'manager' | 'employee';
  avatar?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  position?: string;
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
    user_id: apiUser.user_id,
    name: apiUser.name || `${apiUser.first_name} ${apiUser.last_name}`.trim(),
    email: apiUser.email,
    role: mapApiRoleToLocalRole(apiUser.role),
    avatar: apiUser.avatar,
    username: apiUser.username,
    first_name: apiUser.first_name,
    last_name: apiUser.last_name,
    phone: apiUser.phone,
    position: apiUser.position,
  };
};

interface AuthContextType {
  user: User | null;
  login: (credentials: { email?: string; username?: string; password: string }) => Promise<boolean>;
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
  const queryClient = useQueryClient();

  const login = async (credentials: { email?: string; username?: string; password: string }): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      console.log('Attempting login with:', { 
        email: credentials.email, 
        username: credentials.username, 
        password: '***' 
      });
      
      const response = await apiService.login(credentials);
      console.log('Login response:', response);
      
      if (response.user) {
        const localUser = convertApiUserToLocalUser(response.user);
        console.log('Converted local user:', localUser);
        setUser(localUser);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(localUser));
        queryClient.clear();
        toast.success(`Welcome back, ${localUser.name}!`);
        setIsLoading(false);
        return true;
      } else {
        console.error('No user in response:', response);
        toast.error('Login failed: No user data received');
        setIsLoading(false);
        return false;
      }
    } catch (error: any ) {
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
      localStorage.removeItem('refresh_token');
      queryClient.clear();
      toast.success('Logged out successfully');
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
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
      } else if (savedUser && !isApiAuthenticated) {
        // Try to refresh the token if we have a user but no valid token
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            console.log('Attempting to refresh expired token on app initialization...');
            await apiService.refreshToken();
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            setIsAuthenticated(true);
            console.log('Token refreshed successfully on app initialization');
          } else {
            // No refresh token available, clear stale data
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('Failed to refresh token on initialization:', error);
          // Clear any stale user data if token refresh fails
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem('user');
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
