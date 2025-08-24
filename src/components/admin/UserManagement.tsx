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
  Loader2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUsers } from '../../hooks/useApi';
import { ApiUser, UserRole } from '../../types/api';
import { apiService } from '../../services/api';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

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
      position: apiUser.position // Using position from API as position
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
          position: 'System Administrator'
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
          position: 'HR Manager'
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
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
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

  const handleEditUser = async (user: User) => {
    console.log('Edit user clicked:', user);
    console.log('User ID being sent to API:', user.id);
    
    // Validate user ID exists
    if (!user.id) {
      console.error('User ID is missing or invalid:', user.id);
      alert('Error: User ID is missing. Cannot update user.');
      return;
    }
    
    try {
       // PATCH request with complete user data structure
       const updateData = {
         username: user.username,
         first_name: user.first_name,
         last_name: user.last_name,
         name: user.name,
         email: user.email,
         phone: user.phone,
         avatar: user.avatar || "",
         role: user.role,
         title: user.position
       };
      
      console.log('Making PATCH request to:', `/api/accounts/users/${user.id}/`);
        console.log('Request data:', updateData);
        
        const updatedUser = await apiService.updateUser(user.id, updateData);
        console.log('User updated successfully:', updatedUser);
      
      // Optionally refresh the users list or show success message
      // You might want to call a refetch function here
      
    } catch (error) {
      console.error('Error updating user:', error);
      // Handle error - show error message to user
    }
    
    setSelectedUser(user);
    setIsEditDialogOpen(true);
    console.log('Dialog should be open now');
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
              <Select value={selectedRole} onValueChange={setSelectedRole}>
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
                    </div>

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
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={selectedUser.email} />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select defaultValue={selectedUser.role}>
                      <SelectTrigger>
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
            <Button onClick={() => setIsEditDialogOpen(false)}>
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
                <Label htmlFor="new-email">Email</Label>
                <Input id="new-email" type="email" placeholder="Enter email address" />
              </div>
              <div>
                <Label htmlFor="new-role">Role</Label>
                <Select>
                  <SelectTrigger>
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
                <Label htmlFor="new-phone">Phone</Label>
                <Input id="new-phone" placeholder="Enter phone number" />
              </div>
              <div>
                <Label htmlFor="new-position">Position</Label>
                <Input id="new-position" placeholder="Enter position/title" />
              </div>
              <div>
                <Label htmlFor="new-password">Temporary Password</Label>
                <Input id="new-password" type="password" placeholder="Enter temporary password" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(false)}>
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;