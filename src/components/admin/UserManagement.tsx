import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

import {
  Users,
  Shield,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  ArrowLeft,
  UserPlus,
  Settings,
  Key,
  Mail,
  Phone,
  Loader2,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUsers, queryKeys } from '../../hooks/useApi';
import { ApiUser, UserRole, CreateUserRequest, ApiError } from '../../types/api';
import { apiService } from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';
import { buildUsernameBaseFromName, generateUniqueUsernameFromName } from '@/utils/dataTransformers';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
  avatar?: string;
  phone?: string;
  username: string;
  first_name: string;
  last_name: string;
  position?: string;
  updated_at?: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'users' | 'evaluations' | 'reports' | 'settings';
}

interface UserManagementProps {
  onBack: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ onBack }) => {
  const lastGeneratedEditUsernameRef = useRef<string>('');
  const lastGeneratedCreateUsernameRef = useRef<string>('');
  const mapRoleInputToApiRole = (value: string): UserRole => {
    switch (value) {
      case 'Admin':
        return 'ADMIN';
      case 'HR':
        return 'HR';
      case 'Head-of-Dept':
        return 'HOD';
      case 'Line Manager':
        return 'LM';
      case 'Employee':
      default:
        return 'EMP';
    }
  };
  const handleUseDefaultPassword = () => {
    const input = document.getElementById('new-password') as HTMLInputElement | null;
    if (input) {
      input.value = 'Password123';
    }
  };
  const handleUseDefaultEditPassword = () => {
    const input = document.getElementById('password') as HTMLInputElement | null;
    if (input) {
      input.value = 'Password123';
    }
  };
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createErrorItems, setCreateErrorItems] = useState<string[]>([]);
  const [createValidationErrors, setCreateValidationErrors] = useState<{[key: string]: string}>({});
  const [editError, setEditError] = useState<string | null>(null);
  const [editErrorItems, setEditErrorItems] = useState<string[]>([]);
  const [editValidationErrors, setEditValidationErrors] = useState<{[key: string]: string}>({});
  const PERMISSIONS_COMING_SOON = true;

  // Fetch users from API
  const { data: apiUsers, isLoading, error } = useUsers();

  // Role permissions mapping
  const rolePermissions = {
    admin: ['user_management', 'evaluations_manage', 'reports_view', 'reports_export', 'settings_manage', 'team_management'],
    hr: ['user_management', 'evaluations_manage', 'reports_view', 'reports_export', 'team_management'],
    headofdept: ['evaluations_view', 'team_management', 'reports_view', 'evaluations_manage'],
    linemanager: ['evaluations_view', 'team_management', 'reports_view'],
    employee: ['profile_edit', 'evaluations_view']
  };

  // Transform API users to component User interface
  const transformApiUserToUser = (apiUser: ApiUser): User => {
    return {
      id: apiUser.user_id,
      name: apiUser.name,
      email: apiUser.email,
      role: apiUser.role,
      permissions: rolePermissions[apiUser.role.toLowerCase().replace(/[^a-z]/g, '') as keyof typeof rolePermissions] || [],
      avatar: apiUser.avatar,
      phone: apiUser.phone,
      username: apiUser.username,
      first_name: apiUser.first_name,
      last_name: apiUser.last_name,
      position: apiUser.position, // Using position from API as position
      updated_at: apiUser.updated_at || new Date().toISOString() // Use API updated_at or current time as fallback
    };
  };

  // Transform API users to component users
  const users = useMemo(() => {
    if (!apiUsers || apiUsers.length === 0) {
      // Mock data for testing
      return [
        {
          id: '1',
          name: 'John Doe',
          email: 'john.doe@company.com',
          role: 'ADMIN' as UserRole,
          permissions: rolePermissions.admin,
          phone: '+1234567890',
          username: 'johndoe',
          first_name: 'John',
          last_name: 'Doe',
          position: 'System Administrator',
          updated_at: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane.smith@company.com',
          role: 'HR' as UserRole,
          permissions: rolePermissions.hr,
          phone: '+1234567891',
          username: 'janesmith',
          first_name: 'Jane',
          last_name: 'Smith',
          position: 'HR Manager',
          updated_at: '2024-01-10T14:20:00Z'
        }
      ];
    }
    return apiUsers.map(transformApiUserToUser);
  }, [apiUsers]);

  const sanitizeUsername = (value: string): string => (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const getExistingUsernames = (excludeUsername?: string) => {
    const existing = new Set(users.map((u) => sanitizeUsername(u.username)).filter(Boolean));
    if (excludeUsername) existing.delete(sanitizeUsername(excludeUsername));
    return existing;
  };

  const handleEditNameChange = (fullName: string) => {
    const input = document.getElementById('username') as HTMLInputElement | null;
    if (!input) return;

    if (sanitizeUsername(input.value)) return;

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      input.value = '';
      lastGeneratedEditUsernameRef.current = '';
      return;
    }

    const existing = getExistingUsernames(selectedUser?.username);
    const suffix = sanitizeUsername(input.value).match(/(\d{2})$/)?.[1];
    const preferred = suffix ? `${buildUsernameBaseFromName(fullName)}${suffix}` : undefined;
    const generated = generateUniqueUsernameFromName(fullName, existing, preferred);
    input.value = generated;
    lastGeneratedEditUsernameRef.current = generated;
  };

  const handleCreateNameChange = (fullName: string) => {
    const input = document.getElementById('new-username') as HTMLInputElement | null;
    if (!input) return;

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      input.value = '';
      lastGeneratedCreateUsernameRef.current = '';
      return;
    }

    const existing = getExistingUsernames();
    const suffix = sanitizeUsername(input.value).match(/(\d{2})$/)?.[1];
    const preferred = suffix ? `${buildUsernameBaseFromName(fullName)}${suffix}` : undefined;
    const generated = generateUniqueUsernameFromName(fullName, existing, preferred);
    input.value = generated;
    lastGeneratedCreateUsernameRef.current = generated;
  };

  const permissions: Permission[] = [
    { id: 'user_management', name: 'User Management', description: 'Create, edit, and delete users', category: 'users' },
    { id: 'system_settings', name: 'System Settings', description: 'Access system configuration', category: 'settings' },
    { id: 'reports_view', name: 'View Reports', description: 'Access and view reports', category: 'reports' },
    { id: 'reports_export', name: 'Export Reports', description: 'Export reports to various formats', category: 'reports' },
    { id: 'evaluations_manage', name: 'Manage Evaluations', description: 'Create and manage evaluations', category: 'evaluations' },
    { id: 'evaluations_view', name: 'View Evaluations', description: 'View evaluation results', category: 'evaluations' },
    { id: 'team_management', name: 'Team Management', description: 'Manage team members', category: 'users' },
    { id: 'profile_edit', name: 'Edit Profile', description: 'Edit own profile information', category: 'users' }
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200';
    case 'HR': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'HOD': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'LM': return 'bg-green-100 text-green-800 border-green-200';
    case 'EMP': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };





  const handleCreateUser = () => {
    setCreateError(null);
    setCreateErrorItems([]);
    setCreateValidationErrors({});
    setSelectedUser(null);
    setIsCreateDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    console.log('Edit user clicked:', user);
    setEditError(null);
    setEditErrorItems([]);
    setEditValidationErrors({});
    setSelectedUser(user);
    setSelectedRole(user.role);
    setIsEditDialogOpen(true);
  };

  const handleSaveUser = async (user: User) => {
    console.log('Save user clicked:', user);
    console.log('User ID being sent to API:', user.id);
    
    // Validate user ID exists
    if (!user.id) {
      console.error('User ID is missing or invalid:', user.id);
      alert('Error: User ID is missing. Cannot update user.');
      return;
    }
    
    try {
      // Get form data from the dialog inputs
      const nameInput = document.getElementById('name') as HTMLInputElement;
      const usernameInput = document.getElementById('username') as HTMLInputElement;
      const emailInput = document.getElementById('email') as HTMLInputElement;
      const phoneInput = document.getElementById('phone') as HTMLInputElement;
      const positionInput = document.getElementById('position') as HTMLInputElement;
      const passwordInput = document.getElementById('password') as HTMLInputElement;

      const nameValue = nameInput?.value || user.name;
      const usernameValueRaw = usernameInput?.value ?? user.username;
      const usernameValue = sanitizeUsername(usernameValueRaw) || sanitizeUsername(user.username);

      const existing = getExistingUsernames(user.username);
      if (usernameValue && existing.has(usernameValue)) {
        setEditValidationErrors(prev => ({ ...prev, username: 'Username already exists' }));
        return;
      }

      // PATCH request with form data - matching API payload structure
      const updateData: {
        username?: string;
        email?: string;
        password?: string;
        name?: string;
        phone?: string;
        role?: UserRole;
        title?: string;
        avatar?: string;
      } = {
        username: user.username,
        email: emailInput?.value || user.email,
        name: nameValue,
        phone: phoneInput?.value || user.phone,
        role: selectedRole as UserRole || user.role,
        title: positionInput?.value || user.position,
        avatar: user.avatar || ""
      };

      if (usernameValue && usernameValue !== sanitizeUsername(user.username)) updateData.username = usernameValue;
      
      // Only include password if it's provided
      if (passwordInput?.value && passwordInput.value.trim() !== '') {
        updateData.password = passwordInput.value;
      }
      
      console.log('Making PATCH request to:', `/api/accounts/users/${user.id}/`);
      console.log('Request data:', updateData);
      console.log('Selected role being sent:', selectedRole);
        
      const updatedUser = await apiService.updateUser(user.id, updateData);
      console.log('User updated successfully:', updatedUser);
      console.log('Updated user role from API response:', updatedUser.role);
      console.log('Full API response:', JSON.stringify(updatedUser, null, 2));
      
      // Update the selectedUser state with the new data
      if (selectedUser) {
        const updatedSelectedUser = {
          ...selectedUser,
          username: updatedUser.username || updateData.username || selectedUser.username,
          first_name: updatedUser.first_name || selectedUser.first_name,
          last_name: updatedUser.last_name || selectedUser.last_name,
          name: updatedUser.name || updateData.name || selectedUser.name,
          email: updatedUser.email || updateData.email || selectedUser.email,
          phone: updatedUser.phone || updateData.phone || selectedUser.phone,
          role: (updatedUser.role as UserRole) || (updateData.role as UserRole) || selectedUser.role,
          position: updatedUser.position || updateData.title || selectedUser.position,
          updated_at: updatedUser.updated_at || new Date().toISOString()
        };
        console.log('Updated selectedUser state:', updatedSelectedUser);
        console.log('Role in updated state:', updatedSelectedUser.role);
        setSelectedUser(updatedSelectedUser);
        setSelectedRole(updatedUser.role || updateData.role || selectedUser.role);
        console.log('Set selectedRole to:', updatedUser.role || updateData.role || selectedUser.role);
      }
      
      // Update React Query cache in-place to keep the row position
      queryClient.setQueryData<ApiUser[]>(queryKeys.users, (old) => {
        if (!old) return old;
        const idx = old.findIndex(u => u.user_id === user.id);
        if (idx === -1) return old;
        const merged = { ...old[idx], ...updatedUser } as ApiUser;
        const next = old.slice();
        next[idx] = merged;
        return next;
      });
      
      // Close the dialog after successful save
      setIsEditDialogOpen(false);
      
      // Show success message
      console.log('User updated and UI refreshed successfully');
      
    } catch (error) {
      const apiError = error as ApiError;
      const fieldMessages: Record<string, string[]> = {};
      const normalizeField = (path: string) => {
        const key = path.split('.').filter(Boolean).pop() || path;
        if (key === 'title') return 'position';
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
      const message = apiError?.message || items[0] || 'Failed to update user. Please try again.';
      setEditError(message);
    }
  };

  const handleCreateNewUser = async () => {
    try {
      // Get form data from the create dialog inputs
      const nameInput = document.getElementById('new-name') as HTMLInputElement;
      const usernameInput = document.getElementById('new-username') as HTMLInputElement;
      const emailInput = document.getElementById('new-email') as HTMLInputElement;
      const passwordInput = document.getElementById('new-password') as HTMLInputElement;
      const phoneInput = document.getElementById('new-phone') as HTMLInputElement;
      const positionInput = document.getElementById('new-position') as HTMLInputElement;
      const roleSelect = document.querySelector('[id="new-role"] input') as HTMLInputElement;
      
      // Validate required fields
      if (!nameInput?.value || !emailInput?.value || !passwordInput?.value || !usernameInput?.value) {
        alert('Please fill in all required fields (Name, Username, Email, Password)');
        return;
      }

      const existing = getExistingUsernames();
      const normalizedUsername = generateUniqueUsernameFromName(
        nameInput.value,
        existing,
        sanitizeUsername(usernameInput.value)
      );
      usernameInput.value = normalizedUsername;
      lastGeneratedCreateUsernameRef.current = normalizedUsername;
      
      // Derive first and last name from full name
      const cleanName = nameInput.value.trim().replace(/\s+/g, ' ');
      const parts = cleanName.split(' ');
      const first_name = parts[0] || '';
      const last_name = parts.length > 1 ? parts.slice(1).join(' ') : '';

      // Create user data payload matching API structure
      const createData: CreateUserRequest = {
        username: normalizedUsername,
        email: emailInput.value,
        password: passwordInput.value,
        first_name,
        last_name,
        name: nameInput.value,
        phone: phoneInput?.value || '',
        role: mapRoleInputToApiRole(roleSelect?.value || 'Employee'),
        title: positionInput?.value || ''
      };
      
      console.log('Creating user with data (API payload):', createData);
      
      // Make POST request to create user
      const createdUser = await apiService.createUser(createData);
      console.log('User created successfully:', createdUser);
      
      // Invalidate and refetch users query to update the UI
      await queryClient.invalidateQueries({ queryKey: queryKeys.users });
      
      // Close the dialog after successful creation
      setIsCreateDialogOpen(false);
      
      // Clear form fields
      if (nameInput) nameInput.value = '';
      if (usernameInput) usernameInput.value = '';
      if (emailInput) emailInput.value = '';
      if (passwordInput) passwordInput.value = '';
      if (phoneInput) phoneInput.value = '';
      if (positionInput) positionInput.value = '';
      
      console.log('User created and UI refreshed successfully');
      setCreateError(null);
      setCreateErrorItems([]);
      setCreateValidationErrors({});
    
    } catch (error) {
      const apiError = error as ApiError;
      const fieldMessages: Record<string, string[]> = {};
      const normalizeField = (path: string) => {
        const key = path.split('.').filter(Boolean).pop() || path;
        if (key === 'first_name' || key === 'last_name') return 'name';
        if (key === 'title') return 'title';
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
      setCreateValidationErrors(firstMessages);
      const items = Object.entries(fieldMessages).flatMap(([field, msgs]) => msgs.map(m => `${field}: ${m}`));
      setCreateErrorItems(items);
      const message = apiError?.message || items[0] || 'Failed to create user. Please try again.';
      setCreateError(message);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      // TODO: Implement API call to delete user
      console.log('Delete user:', userId);
    }
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage user roles and permissions</p>
          </div>
        </div>
        <Button onClick={handleCreateUser} className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users by name, email, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex gap-2">
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem key="all" value="all">All Roles</SelectItem>
                      <SelectItem key="Admin" value="Admin">Admin</SelectItem>
                      <SelectItem key="HR" value="HR">HR</SelectItem>
                      <SelectItem key="Head-of-Dept" value="Head-of-Dept">Head of Department</SelectItem>
                      <SelectItem key="Line Manager" value="Line Manager">Line Manager</SelectItem>
                      <SelectItem key="Employee" value="Employee">Employee</SelectItem>
                    </SelectContent>
                </Select>
                {filterRole !== 'all' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setFilterRole('all')}
                    className="px-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading users...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-red-600 mb-4">
              <Shield className="h-12 w-12 mx-auto mb-2" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Users</h3>
            <p className="text-gray-600">Failed to load user data. Please try again later.</p>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      {!isLoading && !error && (
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      <span className="text-sm text-gray-500">@{user.username}</span>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Mail className="h-4 w-4" />
                        <span>{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center space-x-1">
                          <Phone className="h-4 w-4" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                      {user.position && (
                        <div className="flex items-center space-x-1">
                          <span>{user.position}</span>
                        </div>
                      )}
                    </div>
                    {user.updated_at && (
                      <div className="text-xs text-gray-500 mt-1">
                        Last updated: {new Date(user.updated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}

                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-600 hover:text-red-700"
                    disabled={user.id === currentUser?.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {!isLoading && !error && filteredUsers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </CardContent>
        </Card>
      )}

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl bg-white border shadow-lg">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {selectedUser ? (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">User Details</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-4">
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" defaultValue={selectedUser.name} onChange={(e) => handleEditNameChange(e.target.value)} />
                    {editValidationErrors.name && (
                      <p className="text-sm text-red-500">{editValidationErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      defaultValue={selectedUser.username}
                      onChange={() => {
                        if (!editValidationErrors.username) return;
                        setEditValidationErrors(prev => {
                          if (!prev.username) return prev;
                          const next = { ...prev };
                          delete next.username;
                          return next;
                        });
                      }}
                    />
                    {editValidationErrors.username && (
                      <p className="text-sm text-red-500">{editValidationErrors.username}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={selectedUser.email} />
                    {editValidationErrors.email && (
                      <p className="text-sm text-red-500">{editValidationErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger id="role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key="edit-Admin" value="Admin">Admin</SelectItem>
                        <SelectItem key="edit-HR" value="HR">HR</SelectItem>
                        <SelectItem key="edit-Head-of-Dept" value="Head-of-Dept">Head of Department</SelectItem>
                        <SelectItem key="edit-Line Manager" value="Line Manager">Line Manager</SelectItem>
                        <SelectItem key="edit-Employee" value="Employee">Employee</SelectItem>
                      </SelectContent>
                    </Select>
                    {editValidationErrors.role && (
                      <p className="text-sm text-red-500">{editValidationErrors.role}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" defaultValue={selectedUser.phone} />
                    {editValidationErrors.phone && (
                      <p className="text-sm text-red-500">{editValidationErrors.phone}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Input id="position" defaultValue={selectedUser.position} />
                    {editValidationErrors.position && (
                      <p className="text-sm text-red-500">{editValidationErrors.position}</p>
                    )}
                  </div>
                  <div>
                   <div>
                     <Label htmlFor="password">Password</Label>
                     <div className="relative">
                       <Input 
                         id="password" 
                         type={showPassword ? "text" : "password"} 
                         placeholder="Enter new password (leave blank to keep current)" 
                         className="pr-10"
                       />
                       <Button
                         type="button"
                         variant="ghost"
                         size="sm"
                         className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                         onClick={() => setShowPassword(!showPassword)}
                         aria-label={showPassword ? "Hide password" : "Show password"}
                       >
                         {showPassword ? (
                           <EyeOff className="h-4 w-4 text-gray-400" />
                         ) : (
                           <Eye className="h-4 w-4 text-gray-400" />
                         )}
                       </Button>
                     </div>
                     {editValidationErrors.password && (
                       <p className="text-sm text-red-500">{editValidationErrors.password}</p>
                     )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={handleUseDefaultEditPassword}
                      >
                        Use Default Password
                      </Button>
                   </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="permissions" className="space-y-4">
                {PERMISSIONS_COMING_SOON && (
                  <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-yellow-600" />
                    <span>
                      Permissions management is coming soon. Controls are disabled in this preview.
                    </span>
                  </div>
                )}
                <div className="space-y-4">
                  {Object.entries(
                    permissions.reduce((acc, permission) => {
                      if (!acc[permission.category]) acc[permission.category] = [];
                      acc[permission.category].push(permission);
                      return acc;
                    }, {} as Record<string, Permission[]>)
                  ).map(([category, categoryPermissions]) => (
                    <div key={category}>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900 capitalize">{category}</h4>
                        {PERMISSIONS_COMING_SOON && (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Coming Soon</Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        {categoryPermissions.map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={permission.id}
                              defaultChecked={selectedUser.permissions.includes(permission.id)}
                              disabled={PERMISSIONS_COMING_SOON}
                              title={PERMISSIONS_COMING_SOON ? 'Coming soon' : undefined}
                            />
                            <div className="flex-1">
                              <Label htmlFor={permission.id} className="font-medium">
                                {permission.name}
                              </Label>
                              <p className="text-sm text-gray-600">{permission.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="p-4 text-center text-gray-500">
              Loading user data...
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => selectedUser && handleSaveUser(selectedUser)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-name">Name</Label>
                <Input id="new-name" placeholder="Enter full name" onChange={(e) => handleCreateNameChange(e.target.value)} />
                {createValidationErrors.name && (
                  <p className="text-sm text-red-500">{createValidationErrors.name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="new-username">Username</Label>
                <Input id="new-username" placeholder="Enter username" />
                {createValidationErrors.username && (
                  <p className="text-sm text-red-500">{createValidationErrors.username}</p>
                )}
              </div>
              <div>
                <Label htmlFor="new-email">Email</Label>
                <Input id="new-email" type="email" placeholder="Enter email address" />
                {createValidationErrors.email && (
                  <p className="text-sm text-red-500">{createValidationErrors.email}</p>
                )}
              </div>
              <div>
                <Label htmlFor="new-password">Password</Label>
                <div className="relative">
                  <Input 
                    id="new-password" 
                    type={showCreatePassword ? "text" : "password"} 
                    placeholder="Enter password" 
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    aria-label={showCreatePassword ? "Hide password" : "Show password"}
                  >
                    {showCreatePassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {createValidationErrors.password && (
                  <p className="text-sm text-red-500">{createValidationErrors.password}</p>
                )}
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={handleUseDefaultPassword}
                >
                  Use Default Password
                </Button>
              </div>
              <div>
                <Label htmlFor="new-phone">Phone</Label>
                <Input id="new-phone" placeholder="Enter phone number" />
                {createValidationErrors.phone && (
                  <p className="text-sm text-red-500">{createValidationErrors.phone}</p>
                )}
              </div>
              <div>
                <Label htmlFor="new-role">Role</Label>
                <Select>
                  <SelectTrigger id="new-role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem key="create-Admin" value="Admin">Admin</SelectItem>
                     <SelectItem key="create-HR" value="HR">HR</SelectItem>
                     <SelectItem key="create-Head-of-Dept" value="Head-of-Dept">Head of Department</SelectItem>
                     <SelectItem key="create-Line Manager" value="Line Manager">Line Manager</SelectItem>
                     <SelectItem key="create-Employee" value="Employee">Employee</SelectItem>
                   </SelectContent>
                </Select>
                {createValidationErrors.role && (
                  <p className="text-sm text-red-500">{createValidationErrors.role}</p>
                )}
              </div>
              <div>
                <Label htmlFor="new-position">Position</Label>
                <Input id="new-position" placeholder="Enter position/title" />
                {createValidationErrors.title && (
                  <p className="text-sm text-red-500">{createValidationErrors.title}</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateNewUser}>
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
