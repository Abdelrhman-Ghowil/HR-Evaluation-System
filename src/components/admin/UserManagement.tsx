import React, { useState, useMemo } from 'react';
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
  X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUsers } from '../../hooks/useApi';
import { ApiUser, UserRole } from '../../types/api';
import { apiService } from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';

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
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');

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
    setSelectedUser(null);
    setIsCreateDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    console.log('Edit user clicked:', user);
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
      const firstNameInput = document.getElementById('first_name') as HTMLInputElement;
      const lastNameInput = document.getElementById('last_name') as HTMLInputElement;
      const usernameInput = document.getElementById('username') as HTMLInputElement;
      const emailInput = document.getElementById('email') as HTMLInputElement;
      const phoneInput = document.getElementById('phone') as HTMLInputElement;
      const positionInput = document.getElementById('position') as HTMLInputElement;
      const passwordInput = document.getElementById('password') as HTMLInputElement;
      // PATCH request with form data - matching API payload structure
      const updateData: {
        username?: string;
        email?: string;
        password?: string;
        first_name?: string;
        last_name?: string;
        name?: string;
        phone?: string;
        role?: UserRole;
        title?: string;
        avatar?: string;
      } = {
        username: usernameInput?.value || user.username,
        email: emailInput?.value || user.email,
        first_name: firstNameInput?.value || user.first_name,
        last_name: lastNameInput?.value || user.last_name,
        name: nameInput?.value || user.name,
        phone: phoneInput?.value || user.phone,
        role: selectedRole as UserRole || user.role,
        title: positionInput?.value || user.position,
        avatar: user.avatar || ""
      };
      
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
          first_name: updatedUser.first_name || updateData.first_name || selectedUser.first_name,
          last_name: updatedUser.last_name || updateData.last_name || selectedUser.last_name,
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
      
      // Invalidate and refetch users query to update the UI
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      
      // Close the dialog after successful save
      setIsEditDialogOpen(false);
      
      // Show success message
      console.log('User updated and UI refreshed successfully');
      
    } catch (error) {
      console.error('Error updating user:', error);
      // Handle error - show error message to user
    }
  };

  const handleCreateNewUser = async () => {
    try {
      // Get form data from the create dialog inputs
      const nameInput = document.getElementById('new-name') as HTMLInputElement;
      const firstNameInput = document.getElementById('new-first-name') as HTMLInputElement;
      const lastNameInput = document.getElementById('new-last-name') as HTMLInputElement;
      const usernameInput = document.getElementById('new-username') as HTMLInputElement;
      const emailInput = document.getElementById('new-email') as HTMLInputElement;
      const passwordInput = document.getElementById('new-password') as HTMLInputElement;
      const phoneInput = document.getElementById('new-phone') as HTMLInputElement;
      const positionInput = document.getElementById('new-position') as HTMLInputElement;
      const avatarInput = document.getElementById('new-avatar') as HTMLInputElement;
      const roleSelect = document.querySelector('[id="new-role"] input') as HTMLInputElement;
      
      // Validate required fields
      if (!nameInput?.value || !emailInput?.value || !passwordInput?.value || !usernameInput?.value) {
        alert('Please fill in all required fields (Name, Username, Email, Password)');
        return;
      }
      
      // Create user data payload matching API structure
      const createData = {
        username: usernameInput.value,
        email: emailInput.value,
        password: passwordInput.value,
        first_name: firstNameInput?.value || '',
        last_name: lastNameInput?.value || '',
        name: nameInput.value,
        phone: phoneInput?.value || '',
        role: roleSelect?.value || 'Employee',
        position: positionInput?.value || '',
        avatar: avatarInput?.value || ''
      };
      
      console.log('Creating user with data:', createData);
      
      // TODO: Replace with actual API call when endpoint is available
      // const response = await apiService.post('/users', createData);
      
      // Simulate successful creation for now
      console.log('User created successfully');
      
      // Invalidate and refetch users query to update the UI
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      
      // Close the dialog after successful creation
      setIsCreateDialogOpen(false);
      
      // Clear form fields
      if (nameInput) nameInput.value = '';
      if (firstNameInput) firstNameInput.value = '';
      if (lastNameInput) lastNameInput.value = '';
      if (usernameInput) usernameInput.value = '';
      if (emailInput) emailInput.value = '';
      if (passwordInput) passwordInput.value = '';
      if (phoneInput) phoneInput.value = '';
      if (positionInput) positionInput.value = '';
      if (avatarInput) avatarInput.value = '';
      
      console.log('User created and UI refreshed successfully');
      
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user. Please try again.');
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" defaultValue={selectedUser.name} />
                  </div>
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input id="first_name" defaultValue={selectedUser.first_name} />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input id="last_name" defaultValue={selectedUser.last_name} />
                  </div>
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" defaultValue={selectedUser.username} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={selectedUser.email} />
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
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" defaultValue={selectedUser.phone} />
                  </div>
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Input id="position" defaultValue={selectedUser.position} />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" placeholder="Enter new password (leave blank to keep current)" />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="permissions" className="space-y-4">
                <div className="space-y-4">
                  {Object.entries(
                    permissions.reduce((acc, permission) => {
                      if (!acc[permission.category]) acc[permission.category] = [];
                      acc[permission.category].push(permission);
                      return acc;
                    }, {} as Record<string, Permission[]>)
                  ).map(([category, categoryPermissions]) => (
                    <div key={category}>
                      <h4 className="font-medium text-gray-900 mb-2 capitalize">{category}</h4>
                      <div className="space-y-2">
                        {categoryPermissions.map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={permission.id}
                              defaultChecked={selectedUser.permissions.includes(permission.id)}
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-name">Name</Label>
                <Input id="new-name" placeholder="Enter full name" />
              </div>
              <div>
                <Label htmlFor="new-first-name">First Name</Label>
                <Input id="new-first-name" placeholder="Enter first name" />
              </div>
              <div>
                <Label htmlFor="new-last-name">Last Name</Label>
                <Input id="new-last-name" placeholder="Enter last name" />
              </div>
              <div>
                <Label htmlFor="new-username">Username</Label>
                <Input id="new-username" placeholder="Enter username" />
              </div>
              <div>
                <Label htmlFor="new-email">Email</Label>
                <Input id="new-email" type="email" placeholder="Enter email address" />
              </div>
              <div>
                <Label htmlFor="new-password">Password</Label>
                <Input id="new-password" type="password" placeholder="Enter password" />
              </div>
              <div>
                <Label htmlFor="new-phone">Phone</Label>
                <Input id="new-phone" placeholder="Enter phone number" />
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
              </div>
              <div>
                <Label htmlFor="new-position">Position</Label>
                <Input id="new-position" placeholder="Enter position/title" />
              </div>
              <div>
                <Label htmlFor="new-avatar">Avatar URL</Label>
                <Input id="new-avatar" placeholder="Enter avatar URL (optional)" />
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