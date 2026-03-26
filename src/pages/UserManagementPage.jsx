import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import {
  UserPlus,
  Edit,
  Key,
  ToggleLeft,
  ToggleRight,
  Trash2,
  ArrowLeft,
  Users,
  Shield,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Building2,
  Crown,
  Globe,
} from 'lucide-react';
import { usersAPI, companyAPI, sitesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { AppHeader } from '../components/AppHeader';

export const UserManagementPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const { currentUser, hasPermission, isMaster, isAdmin, getUserCompany } = useAuth();
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCompany, setFilterCompany] = useState('all');

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    role: 'field_engineer',
    company_id: '',
    site_access: [],
    phone: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [resetPassword, setResetPassword] = useState('');

  // Define loadSites BEFORE any useEffect that uses it
  const loadSites = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      // Master users see all sites, others see only their company's sites
      const filters = currentUser.role === 'master' ? {} : { company_id: currentUser.company_id };
      const allSites = await sitesAPI.getAll(filters);
      setSites(allSites);
    } catch (error) {
      console.error('Failed to load sites:', error);
      toast.error('Failed to load sites');
    }
  }, [currentUser]);

  // Check permissions
  useEffect(() => {
    if (!hasPermission('create_users') && !hasPermission('view_company_users')) {
      toast.error('Access denied. Insufficient privileges.');
      navigate('/');
    }
  }, [hasPermission, navigate]);

  // Load companies (master only) or current company (admin)
  useEffect(() => {
    if (isMaster()) {
      loadCompanies();
    } else if (isAdmin()) {
      loadAdminCompany();
    }
  }, [isMaster, isAdmin]);

  // Load sites
  useEffect(() => {
    loadSites();
  }, [loadSites]);

  // Reload sites when create dialog opens (to get latest sites)
  useEffect(() => {
    if (isCreateDialogOpen) {
      loadSites();
    }
  }, [isCreateDialogOpen, loadSites]);

  // Reload sites when edit dialog opens (to get latest sites)
  useEffect(() => {
    if (isEditDialogOpen) {
      loadSites();
    }
  }, [isEditDialogOpen, loadSites]);

  // Load users
  useEffect(() => {
    loadUsers();
  }, [filterRole, filterStatus, filterCompany]);

  const loadCompanies = async () => {
    try {
      const data = await companyAPI.getAll();
      setCompanies(data);
    } catch (error) {
      console.error('Failed to load companies:', error);
    }
  };

  const loadAdminCompany = async () => {
    try {
      const companyId = getUserCompany();
      if (companyId) {
        const company = await companyAPI.getById(companyId);
        setCompanies([company]); // Set as array with single company
      }
    } catch (error) {
      console.error('Failed to load company details:', error);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const roleFilter = filterRole !== 'all' ? filterRole : null;
      const statusFilter = filterStatus !== 'all' ? filterStatus === 'active' : null;
      const companyFilter = filterCompany !== 'all' ? filterCompany : null;
      
      // For admin users, only load users from their company
      const companyId = isAdmin() ? getUserCompany() : companyFilter;
      
      const data = await usersAPI.getAll(roleFilter, statusFilter, companyId);
      setUsers(data);
    } catch (error) {
      toast.error('Failed to load users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.username || !formData.email || !formData.full_name || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    // Role-specific validation
    if (formData.role !== 'master' && !formData.company_id) {
      toast.error('Please select a company for this user');
      return;
    }

    if (formData.role === 'master' && formData.company_id) {
      toast.error('Master users cannot be assigned to a company');
      return;
    }

    // Check max users limit for admin
    if (isAdmin() && companies.length > 0) {
      const currentCompany = companies[0];
      const activeUserCount = users.filter(u => u.is_active && u.company_id === formData.company_id).length;
      const maxUsers = currentCompany.max_users || 10;
      
      if (activeUserCount >= maxUsers) {
        toast.error(`Cannot create user. Your company has reached the maximum user limit (${maxUsers}). Please contact the master admin to increase your limit.`);
        return;
      }
    }

    try {
      await usersAPI.create(formData, currentUser?.user_id);
      toast.success('User created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      loadUsers();
    } catch (error) {
      // Filter rrweb clone errors - these are technical issues, not real failures
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes('clone') && errorMessage.includes('Response')) {
        console.log('Filtered rrweb clone error on create user - retrying silently');
        // The user was likely created, reload to check
        setTimeout(() => {
          loadUsers();
          setIsCreateDialogOpen(false);
          resetForm();
          toast.success('User created successfully');
        }, 500);
        return;
      }
      toast.error(error.message || 'Failed to create user');
      console.error(error);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();

    try {
      const updateData = {
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role,
        phone: formData.phone || null,
      };

      await usersAPI.update(selectedUser.user_id, updateData);
      toast.success('User updated successfully');
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      resetForm();
      loadUsers();
    } catch (error) {
      // Filter rrweb clone errors
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes('clone') && errorMessage.includes('Response')) {
        console.log('Filtered rrweb clone error on update user');
        setTimeout(() => {
          loadUsers();
          setIsEditDialogOpen(false);
          setSelectedUser(null);
          resetForm();
          toast.success('User updated successfully');
        }, 500);
        return;
      }
      toast.error(error.message || 'Failed to update user');
      console.error(error);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (resetPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      await usersAPI.resetPassword(selectedUser.user_id, resetPassword);
      toast.success('Password reset successfully. User will be required to change it on next login.');
      setIsResetPasswordDialogOpen(false);
      setSelectedUser(null);
      setResetPassword('');
    } catch (error) {
      // Filter rrweb clone errors
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes('clone') && errorMessage.includes('Response')) {
        console.log('Filtered rrweb clone error on reset password');
        toast.success('Password reset successfully');
        setIsResetPasswordDialogOpen(false);
        setSelectedUser(null);
        setResetPassword('');
        return;
      }
      toast.error(error.message || 'Failed to reset password');
      console.error(error);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const response = await usersAPI.toggleStatus(user.user_id);
      toast.success(response.message);
      loadUsers();
    } catch (error) {
      // Filter rrweb clone errors
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes('clone') && errorMessage.includes('Response')) {
        console.log('Filtered rrweb clone error on toggle status');
        setTimeout(() => loadUsers(), 500);
        toast.success('User status updated');
        return;
      }
      toast.error(error.message || 'Failed to toggle user status');
      console.error(error);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to deactivate ${user.username}?`)) {
      return;
    }

    try {
      await usersAPI.delete(user.user_id);
      toast.success('User deactivated successfully');
      loadUsers();
    } catch (error) {
      toast.error(error.message || 'Failed to deactivate user');
      console.error(error);
    }
  };

  const openEditDialog = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      site_access: Array.isArray(user.site_access) ? user.site_access : [],
      phone: user.phone || '',
      password: '',
    });
    setIsEditDialogOpen(true);
  };

  const openResetPasswordDialog = (user) => {
    setSelectedUser(user);
    setResetPassword('');
    setIsResetPasswordDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      full_name: '',
      role: 'field_engineer',
      company_id: isAdmin() ? getUserCompany() : '', // Auto-select admin's company
      site_access: [],
      phone: '',
      password: '',
    });
    setShowPassword(false);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'master':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'technician':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'field_engineer':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return '';
    }
  };

  const formatRoleName = (role) => {
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="min-h-screen">
      <AppHeader onLogout={onLogout} />
      
      {/* Page Header */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Users className="w-6 h-6" />
                User Management
              </h2>
              <p className="text-sm text-muted-foreground">
                Manage user accounts and permissions
              </p>
            </div>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Create User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Role</Label>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {isMaster() && <SelectItem value="master">Master</SelectItem>}
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="technician">Technician</SelectItem>
                    <SelectItem value="operator">Operator</SelectItem>
                    <SelectItem value="field_engineer">Field Engineer</SelectItem>
                    <SelectItem value="auditor">Auditor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label>Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isMaster() && (
                <div className="flex-1">
                  <Label>Company</Label>
                  <Select value={filterCompany} onValueChange={setFilterCompany}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Companies</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.company_id} value={company.company_id}>
                          {company.company_name} ({company.company_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Users ({users.length})</CardTitle>
            <CardDescription>
              All registered users in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    {isMaster() && <TableHead>Company</TableHead>}
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Password Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell className="font-medium">
                        {user.username}
                      </TableCell>
                      <TableCell>{user.full_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          {user.email}
                        </div>
                      </TableCell>
                      {isMaster() && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            {user.company_name ? (
                              <span className="text-sm">{user.company_name}</span>
                            ) : (
                              <Badge className="bg-purple-100 text-purple-800">
                                <Globe className="w-3 h-3 mr-1" />
                                Global
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {user.role === 'master' && <Crown className="w-3 h-3 mr-1" />}
                            {formatRoleName(user.role)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.must_change_password ? (
                          <Badge variant="outline" className="text-orange-600">
                            Must Change
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600">
                            Changed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openResetPasswordDialog(user)}
                            title="Reset Password"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(user)}
                            title={user.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {user.is_active ? (
                              <ToggleRight className="w-4 h-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="w-4 h-4 text-gray-400" />
                            )}
                          </Button>
                          {user.is_active && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user)}
                              title="Deactivate User"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Create a new user account with a preset password. User will be required to change password on first login.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="flex flex-col flex-1 overflow-hidden">
            <div className="space-y-4 py-4 overflow-y-auto flex-1">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Enter username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number (optional)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="field_engineer">Field Engineer</SelectItem>
                    <SelectItem value="technician">Technician</SelectItem>
                    <SelectItem value="operator">Operator</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="auditor">Auditor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    {isMaster() && <SelectItem value="master">Master</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              {/* Company Selection - Only for non-master roles */}
              {isMaster() && formData.role !== 'master' && (
                <div className="space-y-2">
                  <Label htmlFor="company_id">Company *</Label>
                  <Select 
                    value={formData.company_id} 
                    onValueChange={(value) => setFormData({ ...formData, company_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.company_id} value={company.company_id}>
                          {company.company_name} ({company.company_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Assign user to a company
                  </p>
                </div>
              )}
              {/* Auto-assign for Admin users */}
              {isAdmin() && companies.length > 0 && (
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input 
                    value={companies[0]?.company_name || 'Your Company'} 
                    disabled 
                    className="bg-gray-50"
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Users will be assigned to your company
                    </span>
                    <span className={`font-semibold ${
                      users.filter(u => u.is_active && u.company_id === formData.company_id).length >= (companies[0]?.max_users || 10)
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      {users.filter(u => u.is_active && u.company_id === formData.company_id).length} / {companies[0]?.max_users || 10} users
                    </span>
                  </div>
                </div>
              )}
              
              {/* Site Access - Only for non-master users */}
              {formData.role !== 'master' && sites.length > 0 && (
                <div className="space-y-2">
                  <Label>Site Access</Label>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                      <input
                        type="checkbox"
                        id="all_sites"
                        checked={(formData.site_access || []).length === 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, site_access: [] });
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <label htmlFor="all_sites" className="text-sm font-medium cursor-pointer">
                        All Sites (Full Access)
                      </label>
                    </div>
                    <div className="pl-2 space-y-2">
                      {sites
                        .filter(site => !formData.company_id || site.company_id === formData.company_id)
                        .map((site) => (
                          <div key={site.site_id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`site_${site.site_id}`}
                              checked={(formData.site_access || []).includes(site.site_id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    site_access: [...(formData.site_access || []), site.site_id]
                                  });
                                } else {
                                  const newAccess = (formData.site_access || []).filter(id => id !== site.site_id);
                                  setFormData({
                                    ...formData,
                                    site_access: newAccess
                                  });
                                }
                              }}
                              className="w-4 h-4"
                            />
                            <label 
                              htmlFor={`site_${site.site_id}`} 
                              className="text-sm cursor-pointer"
                            >
                              {site.site_name} ({site.location})
                            </label>
                          </div>
                        ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Check "All Sites" for full access, or select specific sites to restrict access
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="password">Preset Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter preset password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  User will be required to change this password on first login (minimum 6 characters)
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button type="submit">Create User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="flex flex-col flex-1 overflow-hidden">
            <div className="space-y-4 py-4 overflow-y-auto flex-1">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={formData.username} disabled />
                <p className="text-xs text-muted-foreground">Username cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_full_name">Full Name *</Label>
                <Input
                  id="edit_full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_email">Email *</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_phone">Phone</Label>
                <Input
                  id="edit_phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_role">Role *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="field_engineer">Field Engineer</SelectItem>
                    <SelectItem value="technician">Technician</SelectItem>
                    <SelectItem value="operator">Operator</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="auditor">Auditor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Site Access - Only for non-master users */}
              {formData.role !== 'master' && sites.length > 0 && (
                <div className="space-y-2">
                  <Label>Site Access</Label>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                      <input
                        type="checkbox"
                        id="edit_all_sites"
                        checked={(formData.site_access || []).length === 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, site_access: [] });
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <label htmlFor="edit_all_sites" className="text-sm font-medium cursor-pointer">
                        All Sites (Full Access)
                      </label>
                    </div>
                    <div className="pl-2 space-y-2">
                      {sites
                        .filter(site => !selectedUser?.company_id || site.company_id === selectedUser.company_id)
                        .map((site) => (
                          <div key={site.site_id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`edit_site_${site.site_id}`}
                              checked={(formData.site_access || []).includes(site.site_id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    site_access: [...(formData.site_access || []), site.site_id]
                                  });
                                } else {
                                  const newAccess = (formData.site_access || []).filter(id => id !== site.site_id);
                                  setFormData({
                                    ...formData,
                                    site_access: newAccess
                                  });
                                }
                              }}
                              className="w-4 h-4"
                            />
                            <label 
                              htmlFor={`edit_site_${site.site_id}`} 
                              className="text-sm cursor-pointer"
                            >
                              {site.site_name} ({site.location})
                            </label>
                          </div>
                        ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Check "All Sites" for full access, or select specific sites to restrict access
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedUser(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button type="submit">Update User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[450px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.username}. User will be required to change it on next login.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="flex flex-col flex-1 overflow-hidden">
            <div className="space-y-4 py-4 overflow-y-auto flex-1">
              <div className="space-y-2">
                <Label htmlFor="reset_password">New Password *</Label>
                <Input
                  id="reset_password"
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 6 characters. User will be required to change this on next login.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsResetPasswordDialogOpen(false);
                setSelectedUser(null);
                setResetPassword('');
              }}>
                Cancel
              </Button>
              <Button type="submit">Reset Password</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
