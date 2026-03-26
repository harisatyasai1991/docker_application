import React, { useState, useEffect } from 'react';
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
  Building2,
  Plus,
  Edit,
  ArrowLeft,
  Users,
  Building,
  Globe,
  Mail,
  Phone,
  Link,
  Crown,
  Calendar,
  Activity,
  Settings,
  Shield,
  ClipboardCheck,
  Factory,
  Leaf,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Loader2,
  Sparkles,
  Wand2,
  Copy,
  CheckCircle,
  Flag,
  ToggleLeft,
  GitBranch,
} from 'lucide-react';
import { Switch } from '../components/ui/switch';
import { companyAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { AppHeader } from '../components/AppHeader';

// Module icons mapping
const MODULE_ICONS = {
  asset_management: Building2,
  production_testing: ClipboardCheck,
  online_monitoring: Activity,
  process_industry: Factory,
  iso_50001: Leaf,
};

// Available product categories for Production Testing module
const PRODUCT_CATEGORIES = [
  'Cable',
  'Transformer',
  'Motor',
  'Switchgear',
  'Panel',
  'Other'
];

export const CompanyManagementPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const { isMaster } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  
  // Module configuration states
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [availableModules, setAvailableModules] = useState({});
  const [companyModules, setCompanyModules] = useState({});
  const [moduleConfigLoading, setModuleConfigLoading] = useState(false);
  const [savingModules, setSavingModules] = useState(false);

  // Factory Reset states
  const [isFactoryResetDialogOpen, setIsFactoryResetDialogOpen] = useState(false);
  const [factoryResetCompany, setFactoryResetCompany] = useState(null);
  const [factoryResetStats, setFactoryResetStats] = useState(null);
  const [factoryResetLoading, setFactoryResetLoading] = useState(false);
  const [factoryResetConfirmText, setFactoryResetConfirmText] = useState('');
  const [factoryResetExecuting, setFactoryResetExecuting] = useState(false);

  // Demo Generator states
  const [isDemoGeneratorOpen, setIsDemoGeneratorOpen] = useState(false);
  const [demoPrompt, setDemoPrompt] = useState('');
  const [demoExamples, setDemoExamples] = useState([]);
  const [demoGenerating, setDemoGenerating] = useState(false);
  const [demoResult, setDemoResult] = useState(null);

  // Feature Flags states
  const [isFeatureFlagsDialogOpen, setIsFeatureFlagsDialogOpen] = useState(false);
  const [featureFlagsCompany, setFeatureFlagsCompany] = useState(null);
  const [availableFeatures, setAvailableFeatures] = useState({});
  const [availableWorkflows, setAvailableWorkflows] = useState({});
  const [companyFeatures, setCompanyFeatures] = useState({});
  const [companyWorkflows, setCompanyWorkflows] = useState({});
  const [featureFlagsLoading, setFeatureFlagsLoading] = useState(false);
  const [savingFeatures, setSavingFeatures] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    company_name: '',
    company_code: '',
    industry: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    website: '',
    subscription_plan: 'basic',
    max_users: 10,
    max_assets: 100,
  });

  // Check permissions
  useEffect(() => {
    if (!isMaster()) {
      toast.error('Access denied. Master privileges required.');
      navigate('/');
    }
  }, [isMaster, navigate]);

  // Load companies
  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await companyAPI.getAll();
      setCompanies(data);
    } catch (error) {
      toast.error('Failed to load companies');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.company_name || !formData.company_code) {
      toast.error('Please fill in company name and code');
      return;
    }

    try {
      await companyAPI.create(formData);
      toast.success('Company created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      loadCompanies();
    } catch (error) {
      toast.error(error.message || 'Failed to create company');
      console.error(error);
    }
  };

  const handleUpdateCompany = async (e) => {
    e.preventDefault();

    try {
      const updateData = {
        company_name: formData.company_name,
        industry: formData.industry,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        address: formData.address,
        website: formData.website,
        subscription_plan: formData.subscription_plan,
        max_users: parseInt(formData.max_users),
        max_assets: parseInt(formData.max_assets),
      };

      await companyAPI.update(selectedCompany.company_id, updateData);
      toast.success('Company updated successfully');
      setIsEditDialogOpen(false);
      setSelectedCompany(null);
      resetForm();
      loadCompanies();
    } catch (error) {
      toast.error(error.message || 'Failed to update company');
      console.error(error);
    }
  };

  const openEditDialog = (company) => {
    setSelectedCompany(company);
    setFormData({
      company_name: company.company_name,
      company_code: company.company_code,
      industry: company.industry || '',
      contact_email: company.contact_email || '',
      contact_phone: company.contact_phone || '',
      address: company.address || '',
      website: company.website || '',
      subscription_plan: company.subscription_plan,
      max_users: company.max_users,
      max_assets: company.max_assets,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      company_name: '',
      company_code: '',
      industry: '',
      contact_email: '',
      contact_phone: '',
      address: '',
      website: '',
      subscription_plan: 'basic',
      max_users: 10,
      max_assets: 100,
    });
  };

  // Module Configuration Functions
  const openModuleConfigDialog = async (company) => {
    setSelectedCompany(company);
    setModuleConfigLoading(true);
    setIsModuleDialogOpen(true);
    
    try {
      // Load available modules and company's current configuration
      const [availableRes, companyModulesRes] = await Promise.all([
        companyAPI.getAvailableModules(),
        companyAPI.getCompanyModules(company.company_id)
      ]);
      
      setAvailableModules(availableRes);
      setCompanyModules(companyModulesRes.modules || {});
    } catch (error) {
      toast.error('Failed to load module configuration');
      console.error(error);
    } finally {
      setModuleConfigLoading(false);
    }
  };

  const handleModuleToggle = (moduleKey, enabled) => {
    setCompanyModules(prev => ({
      ...prev,
      [moduleKey]: {
        ...prev[moduleKey],
        enabled: enabled,
        tier: prev[moduleKey]?.tier || 'basic'
      }
    }));
  };

  const handleModuleTierChange = (moduleKey, tier) => {
    setCompanyModules(prev => ({
      ...prev,
      [moduleKey]: {
        ...prev[moduleKey],
        tier: tier
      }
    }));
  };

  // Handle category toggle for production_testing module
  const handleCategoryToggle = (category) => {
    setCompanyModules(prev => {
      const currentCategories = prev.production_testing?.allowed_categories || [];
      const isCurrentlySelected = currentCategories.includes(category);
      
      let newCategories;
      if (isCurrentlySelected) {
        newCategories = currentCategories.filter(c => c !== category);
      } else {
        newCategories = [...currentCategories, category];
      }
      
      return {
        ...prev,
        production_testing: {
          ...prev.production_testing,
          allowed_categories: newCategories
        }
      };
    });
  };

  // Check if a category is selected for production_testing
  const isCategorySelected = (category) => {
    const categories = companyModules.production_testing?.allowed_categories;
    // If no categories configured, all are considered selected (default open)
    if (!categories || categories.length === 0) {
      return true;
    }
    return categories.includes(category);
  };

  const saveModuleConfiguration = async () => {
    if (!selectedCompany) return;
    
    setSavingModules(true);
    try {
      await companyAPI.updateCompanyModules(selectedCompany.company_id, {
        modules: companyModules
      });
      toast.success('Module configuration saved successfully');
      setIsModuleDialogOpen(false);
      setSelectedCompany(null);
      loadCompanies(); // Refresh to show updated info
    } catch (error) {
      toast.error(error.message || 'Failed to save module configuration');
      console.error(error);
    } finally {
      setSavingModules(false);
    }
  };

  // Factory Reset handlers
  const openFactoryResetDialog = async (company) => {
    setFactoryResetCompany(company);
    setFactoryResetConfirmText('');
    setFactoryResetStats(null);
    setIsFactoryResetDialogOpen(true);
    setFactoryResetLoading(true);
    
    try {
      const stats = await companyAPI.getDataStats(company.company_id);
      setFactoryResetStats(stats);
    } catch (error) {
      toast.error(error.message || 'Failed to load company data statistics');
      console.error(error);
    } finally {
      setFactoryResetLoading(false);
    }
  };

  const executeFactoryReset = async () => {
    if (!factoryResetCompany || factoryResetConfirmText !== factoryResetCompany.company_name) {
      toast.error('Please type the company name correctly to confirm');
      return;
    }
    
    setFactoryResetExecuting(true);
    try {
      const result = await companyAPI.factoryReset(factoryResetCompany.company_id);
      toast.success(`Factory reset completed for "${factoryResetCompany.company_name}"`);
      setIsFactoryResetDialogOpen(false);
      setFactoryResetCompany(null);
      setFactoryResetStats(null);
      setFactoryResetConfirmText('');
      loadCompanies(); // Refresh
    } catch (error) {
      toast.error(error.message || 'Factory reset failed');
      console.error(error);
    } finally {
      setFactoryResetExecuting(false);
    }
  };

  const closeFactoryResetDialog = () => {
    setIsFactoryResetDialogOpen(false);
    setFactoryResetCompany(null);
    setFactoryResetStats(null);
    setFactoryResetConfirmText('');
  };

  // Demo Generator handlers
  const openDemoGenerator = async () => {
    setIsDemoGeneratorOpen(true);
    setDemoPrompt('');
    setDemoResult(null);
    
    // Load examples
    try {
      const examples = await companyAPI.getDemoExamples();
      setDemoExamples(examples.examples || []);
    } catch (error) {
      console.error('Failed to load demo examples:', error);
    }
  };

  const generateDemoCompany = async () => {
    if (!demoPrompt.trim()) {
      toast.error('Please enter a prompt describing the demo company');
      return;
    }
    
    setDemoGenerating(true);
    setDemoResult(null);
    
    try {
      const result = await companyAPI.generateDemoCompany(demoPrompt);
      setDemoResult(result);
      toast.success(`Demo company "${result.company_name}" created!`);
      loadCompanies(); // Refresh company list
    } catch (error) {
      toast.error(error.message || 'Failed to generate demo company');
      console.error(error);
    } finally {
      setDemoGenerating(false);
    }
  };

  const closeDemoGenerator = () => {
    setIsDemoGeneratorOpen(false);
    setDemoPrompt('');
    setDemoResult(null);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // Feature Flags handlers
  const openFeatureFlagsDialog = async (company) => {
    setFeatureFlagsCompany(company);
    setIsFeatureFlagsDialogOpen(true);
    setFeatureFlagsLoading(true);
    
    try {
      // Load available features
      const availableResponse = await companyAPI.getAvailableFeatures();
      setAvailableFeatures(availableResponse.features || {});
      setAvailableWorkflows(availableResponse.workflows || {});
      
      // Load company's current feature configuration
      const companyResponse = await companyAPI.getCompanyFeatures(company.company_id);
      setCompanyFeatures(companyResponse.feature_flags || {});
      setCompanyWorkflows(companyResponse.workflow_variants || {});
    } catch (error) {
      toast.error(error.message || 'Failed to load feature configuration');
      console.error(error);
    } finally {
      setFeatureFlagsLoading(false);
    }
  };

  const toggleFeature = (featureKey) => {
    setCompanyFeatures(prev => ({
      ...prev,
      [featureKey]: !prev[featureKey]
    }));
  };

  const setWorkflowVariant = (workflowKey, value) => {
    setCompanyWorkflows(prev => ({
      ...prev,
      [workflowKey]: value
    }));
  };

  const saveFeatureFlags = async () => {
    if (!featureFlagsCompany) return;
    
    setSavingFeatures(true);
    try {
      await companyAPI.updateCompanyFeatures(featureFlagsCompany.company_id, {
        feature_flags: companyFeatures,
        workflow_variants: companyWorkflows
      });
      toast.success('Feature configuration saved successfully');
      setIsFeatureFlagsDialogOpen(false);
      setFeatureFlagsCompany(null);
    } catch (error) {
      toast.error(error.message || 'Failed to save feature configuration');
      console.error(error);
    } finally {
      setSavingFeatures(false);
    }
  };

  const closeFeatureFlagsDialog = () => {
    setIsFeatureFlagsDialogOpen(false);
    setFeatureFlagsCompany(null);
    setCompanyFeatures({});
    setCompanyWorkflows({});
  };

  // Count enabled modules for a company
  const getEnabledModulesCount = (company) => {
    const modules = company?.subscription?.modules || {};
    return Object.values(modules).filter(m => m?.enabled).length;
  };

  const getSubscriptionBadgeColor = (plan) => {
    switch (plan) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'premium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'basic':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return '';
    }
  };

  const formatPlanName = (plan) => {
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <AppHeader onLogout={onLogout} />
      
      {/* Page Title */}
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/sites')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-purple-600" />
                  Company Management
                  <Badge className="bg-purple-100 text-purple-800">Master</Badge>
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage companies and their configurations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={openDemoGenerator}
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Create Demo Company
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Company
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Companies Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Companies ({companies.length})
            </CardTitle>
            <CardDescription>
              All companies in the system with their subscription details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading companies...</div>
            ) : companies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No companies found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Limits</TableHead>
                    <TableHead>Modules</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.company_id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="font-medium flex items-center gap-2">
                            <Building className="w-4 h-4 text-muted-foreground" />
                            {company.company_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Code: {company.company_code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {company.industry || 'Not specified'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {company.contact_email && (
                            <div className="flex items-center gap-1 text-xs">
                              <Mail className="w-3 h-3" />
                              {company.contact_email}
                            </div>
                          )}
                          {company.contact_phone && (
                            <div className="flex items-center gap-1 text-xs">
                              <Phone className="w-3 h-3" />
                              {company.contact_phone}
                            </div>
                          )}
                          {company.website && (
                            <div className="flex items-center gap-1 text-xs">
                              <Link className="w-3 h-3" />
                              <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                Website
                              </a>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSubscriptionBadgeColor(company.subscription_plan)}>
                          {formatPlanName(company.subscription_plan)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {company.max_users} users
                          </div>
                          <div className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            {company.max_assets} assets
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            {getEnabledModulesCount(company)} active
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={company.is_active ? 'default' : 'secondary'}>
                          {company.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3" />
                          {formatDate(company.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openModuleConfigDialog(company)}
                            title="Configure Modules"
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openFeatureFlagsDialog(company)}
                            title="Feature Flags"
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                          >
                            <Flag className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(company)}
                            title="Edit Company"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openFactoryResetDialog(company)}
                            title="Factory Reset"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
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

      {/* Create Company Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Create New Company</DialogTitle>
            <DialogDescription>
              Create a new company that can have its own users and data
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCompany} className="flex flex-col flex-1 overflow-hidden">
            <div className="space-y-4 py-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="e.g., ABC Corporation"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_code">Company Code *</Label>
                  <Input
                    id="company_code"
                    value={formData.company_code}
                    onChange={(e) => setFormData({ ...formData, company_code: e.target.value.toUpperCase() })}
                    placeholder="e.g., ABC"
                    maxLength={10}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="e.g., Manufacturing, Energy, Healthcare"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="admin@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="+1-555-123-4567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Company address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://company.com"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subscription_plan">Subscription Plan</Label>
                  <Select value={formData.subscription_plan} onValueChange={(value) => setFormData({ ...formData, subscription_plan: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_users">Max Users</Label>
                  <Input
                    id="max_users"
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.max_users}
                    onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) || 10 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_assets">Max Assets</Label>
                  <Input
                    id="max_assets"
                    type="number"
                    min="1"
                    max="100000"
                    value={formData.max_assets}
                    onChange={(e) => setFormData({ ...formData, max_assets: parseInt(e.target.value) || 100 })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button type="submit">Create Company</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Company Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
            <DialogDescription>
              Update company information and settings
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCompany} className="flex flex-col flex-1 overflow-hidden">
            <div className="space-y-4 py-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_company_name">Company Name *</Label>
                  <Input
                    id="edit_company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company Code</Label>
                  <Input value={formData.company_code} disabled />
                  <p className="text-xs text-muted-foreground">Company code cannot be changed</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_industry">Industry</Label>
                <Input
                  id="edit_industry"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_contact_email">Contact Email</Label>
                  <Input
                    id="edit_contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_contact_phone">Contact Phone</Label>
                  <Input
                    id="edit_contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_address">Address</Label>
                <Input
                  id="edit_address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_website">Website</Label>
                <Input
                  id="edit_website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_subscription_plan">Subscription Plan</Label>
                  <Select value={formData.subscription_plan} onValueChange={(value) => setFormData({ ...formData, subscription_plan: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_max_users">Max Users</Label>
                  <Input
                    id="edit_max_users"
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.max_users}
                    onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) || 10 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_max_assets">Max Assets</Label>
                  <Input
                    id="edit_max_assets"
                    type="number"
                    min="1"
                    max="100000"
                    value={formData.max_assets}
                    onChange={(e) => setFormData({ ...formData, max_assets: parseInt(e.target.value) || 100 })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedCompany(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button type="submit">Update Company</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Module Configuration Dialog */}
      <Dialog open={isModuleDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsModuleDialogOpen(false);
          setSelectedCompany(null);
          setCompanyModules({});
        }
      }}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" />
              Configure Modules
            </DialogTitle>
            <DialogDescription>
              {selectedCompany ? (
                <>Enable or disable modules for <strong>{selectedCompany.company_name}</strong></>
              ) : (
                'Manage which modules this company has access to'
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4">
            {moduleConfigLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading module configuration...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(availableModules).map(([moduleKey, moduleInfo]) => {
                  const ModuleIcon = MODULE_ICONS[moduleKey] || Shield;
                  const isEnabled = companyModules[moduleKey]?.enabled || false;
                  const tier = companyModules[moduleKey]?.tier || 'basic';
                  
                  return (
                    <Card key={moduleKey} className={`transition-all ${isEnabled ? 'border-purple-300 bg-purple-50/50 dark:bg-purple-900/10' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2 rounded-lg ${isEnabled ? 'bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-200' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                              <ModuleIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{moduleInfo.name}</h4>
                                {isEnabled && (
                                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                                    <Check className="w-3 h-3 mr-1" />
                                    Enabled
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {moduleInfo.description}
                              </p>
                              
                              {isEnabled && (
                                <div className="mt-3 flex items-center gap-2">
                                  <Label className="text-xs text-muted-foreground">Tier:</Label>
                                  <Select 
                                    value={tier} 
                                    onValueChange={(value) => handleModuleTierChange(moduleKey, value)}
                                  >
                                    <SelectTrigger className="w-32 h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="basic">Basic</SelectItem>
                                      <SelectItem value="professional">Professional</SelectItem>
                                      <SelectItem value="enterprise">Enterprise</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                              
                              {/* Category selection for Production Testing module */}
                              {isEnabled && moduleKey === 'production_testing' && (
                                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                                  <Label className="text-xs text-muted-foreground mb-2 block">
                                    Allowed Asset Categories:
                                    <span className="text-gray-400 ml-1">(leave empty for all)</span>
                                  </Label>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {PRODUCT_CATEGORIES.map(category => {
                                      const isSelected = companyModules.production_testing?.allowed_categories?.includes(category);
                                      const hasNoConfig = !companyModules.production_testing?.allowed_categories || 
                                                         companyModules.production_testing?.allowed_categories?.length === 0;
                                      
                                      return (
                                        <button
                                          key={category}
                                          type="button"
                                          onClick={() => handleCategoryToggle(category)}
                                          className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                                            isSelected
                                              ? 'bg-cyan-100 border-cyan-400 text-cyan-800 dark:bg-cyan-900 dark:border-cyan-600 dark:text-cyan-200'
                                              : hasNoConfig
                                                ? 'bg-gray-50 border-gray-300 text-gray-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 opacity-60'
                                                : 'bg-gray-50 border-gray-300 text-gray-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400'
                                          }`}
                                        >
                                          {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                                          {category}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  {(!companyModules.production_testing?.allowed_categories || 
                                    companyModules.production_testing?.allowed_categories?.length === 0) && (
                                    <p className="text-xs text-gray-500 mt-2 italic">
                                      All categories are available (no restrictions)
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={(checked) => handleModuleToggle(moduleKey, checked)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
          
          <DialogFooter className="border-t pt-4">
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-muted-foreground">
                {Object.values(companyModules).filter(m => m?.enabled).length} modules enabled
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsModuleDialogOpen(false);
                    setSelectedCompany(null);
                    setCompanyModules({});
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={saveModuleConfiguration}
                  disabled={savingModules}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {savingModules ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Factory Reset Dialog */}
      <Dialog open={isFactoryResetDialogOpen} onOpenChange={(open) => !open && closeFactoryResetDialog()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Factory Reset Company
            </DialogTitle>
            <DialogDescription>
              This will permanently delete all operational data for this company.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {factoryResetLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : factoryResetStats ? (
            <div className="space-y-4 py-4">
              {/* Company Info */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="font-medium">{factoryResetStats.company_name}</p>
                <p className="text-sm text-muted-foreground">ID: {factoryResetStats.company_id}</p>
              </div>
              
              {/* Data Counts */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-600">Data to be DELETED:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                    <span>Sites</span>
                    <span className="font-medium">{factoryResetStats.data_counts?.sites || 0}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                    <span>Assets</span>
                    <span className="font-medium">{factoryResetStats.data_counts?.assets || 0}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                    <span>Test Records</span>
                    <span className="font-medium">{factoryResetStats.data_counts?.test_records || 0}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                    <span>Substations</span>
                    <span className="font-medium">{factoryResetStats.data_counts?.substations || 0}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                    <span>Equipment</span>
                    <span className="font-medium">{factoryResetStats.data_counts?.equipment || 0}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                    <span>Cross Links</span>
                    <span className="font-medium">{factoryResetStats.data_counts?.cross_module_links || 0}</span>
                  </div>
                </div>
              </div>
              
              {/* Users Note */}
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm">
                <p className="font-medium text-green-700 dark:text-green-400">
                  Users will be preserved ({factoryResetStats.users_count} users)
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  Company record and user accounts will not be deleted
                </p>
              </div>
              
              {/* Confirmation Input */}
              <div className="space-y-2 pt-2">
                <Label className="text-sm">
                  Type <span className="font-mono font-bold text-red-600">{factoryResetCompany?.company_name}</span> to confirm:
                </Label>
                <Input
                  value={factoryResetConfirmText}
                  onChange={(e) => setFactoryResetConfirmText(e.target.value)}
                  placeholder="Type company name here"
                  className="font-mono"
                  data-testid="factory-reset-confirm-input"
                />
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Failed to load company data
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={closeFactoryResetDialog}
              disabled={factoryResetExecuting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={executeFactoryReset}
              disabled={
                factoryResetExecuting || 
                factoryResetLoading || 
                !factoryResetStats ||
                factoryResetConfirmText !== factoryResetCompany?.company_name
              }
              data-testid="factory-reset-execute-btn"
            >
              {factoryResetExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Reset All Data
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Demo Generator Dialog */}
      <Dialog open={isDemoGeneratorOpen} onOpenChange={(open) => !open && closeDemoGenerator()}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Demo Company Generator
            </DialogTitle>
            <DialogDescription>
              Describe the demo company you want to create using natural language. 
              The AI will generate realistic data including sites, assets, test records, and more.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {/* Password Reminder */}
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Note:</strong> Default admin password for all generated companies: <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">Admin@123</code>
              </p>
            </div>
            
            {/* Prompt Input */}
            <div className="space-y-2">
              <Label htmlFor="demo-prompt">Describe your demo company:</Label>
              <textarea
                id="demo-prompt"
                className="w-full min-h-[100px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-700"
                placeholder="e.g., Create a power utility company in Saudi Arabia with 15 substations across 4 regions..."
                value={demoPrompt}
                onChange={(e) => setDemoPrompt(e.target.value)}
                disabled={demoGenerating}
                data-testid="demo-prompt-input"
              />
            </div>
            
            {/* Example Prompts */}
            {demoExamples.length > 0 && !demoResult && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Example prompts (click to use):</Label>
                <div className="grid gap-2">
                  {demoExamples.map((example, idx) => (
                    <button
                      key={idx}
                      className="text-left p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => setDemoPrompt(example.prompt)}
                      disabled={demoGenerating}
                    >
                      <div className="font-medium text-sm">{example.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">{example.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Generation Progress */}
            {demoGenerating && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
                  <Sparkles className="w-6 h-6 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Generating Demo Company...</p>
                  <p className="text-sm text-muted-foreground">AI is creating realistic data for your company</p>
                </div>
              </div>
            )}
            
            {/* Result Display */}
            {demoResult && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium mb-2">
                    <CheckCircle className="w-5 h-5" />
                    Demo Company Created Successfully!
                  </div>
                  
                  <div className="space-y-3">
                    {/* Company Info */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Company:</span>
                        <span className="ml-2 font-medium">{demoResult.company_name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">ID:</span>
                        <span className="ml-2 font-mono text-xs">{demoResult.company_id}</span>
                      </div>
                    </div>
                    
                    {/* Credentials */}
                    <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                      <div className="text-sm font-medium mb-2">Login Credentials:</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">
                            <span className="text-muted-foreground">Username:</span>{' '}
                            <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{demoResult.admin_username}</code>
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(demoResult.admin_username)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">
                            <span className="text-muted-foreground">Password:</span>{' '}
                            <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{demoResult.admin_password}</code>
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(demoResult.admin_password)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Data Summary */}
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="p-2 bg-white dark:bg-gray-800 rounded border text-center">
                        <div className="text-lg font-bold text-purple-600">{demoResult.summary?.sites || 0}</div>
                        <div className="text-xs text-muted-foreground">Sites</div>
                      </div>
                      <div className="p-2 bg-white dark:bg-gray-800 rounded border text-center">
                        <div className="text-lg font-bold text-blue-600">{demoResult.summary?.assets || 0}</div>
                        <div className="text-xs text-muted-foreground">Assets</div>
                      </div>
                      <div className="p-2 bg-white dark:bg-gray-800 rounded border text-center">
                        <div className="text-lg font-bold text-green-600">{demoResult.summary?.test_records || 0}</div>
                        <div className="text-xs text-muted-foreground">Test Records</div>
                      </div>
                      <div className="p-2 bg-white dark:bg-gray-800 rounded border text-center">
                        <div className="text-lg font-bold text-orange-600">{demoResult.summary?.substations || 0}</div>
                        <div className="text-xs text-muted-foreground">Substations</div>
                      </div>
                      <div className="p-2 bg-white dark:bg-gray-800 rounded border text-center">
                        <div className="text-lg font-bold text-cyan-600">{demoResult.summary?.equipment || 0}</div>
                        <div className="text-xs text-muted-foreground">Equipment</div>
                      </div>
                      <div className="p-2 bg-white dark:bg-gray-800 rounded border text-center">
                        <div className="text-lg font-bold text-pink-600">{demoResult.summary?.cross_module_links || 0}</div>
                        <div className="text-xs text-muted-foreground">Cross Links</div>
                      </div>
                    </div>
                    
                    {/* Modules Enabled */}
                    <div className="flex gap-2 flex-wrap">
                      {demoResult.modules_enabled?.asset_performance && (
                        <Badge variant="outline" className="bg-blue-50">Asset Performance</Badge>
                      )}
                      {demoResult.modules_enabled?.online_monitoring && (
                        <Badge variant="outline" className="bg-green-50">Online Monitoring</Badge>
                      )}
                      {demoResult.modules_enabled?.production_testing && (
                        <Badge variant="outline" className="bg-orange-50">Production Testing</Badge>
                      )}
                    </div>
                    
                    {/* Regions */}
                    {demoResult.regions && demoResult.regions.length > 0 && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Regions:</span>{' '}
                        {demoResult.regions.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={closeDemoGenerator}>
              {demoResult ? 'Close' : 'Cancel'}
            </Button>
            {!demoResult && (
              <Button 
                onClick={generateDemoCompany}
                disabled={demoGenerating || !demoPrompt.trim()}
                className="bg-purple-600 hover:bg-purple-700"
                data-testid="generate-demo-btn"
              >
                {demoGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Demo Company
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feature Flags Dialog */}
      <Dialog open={isFeatureFlagsDialogOpen} onOpenChange={(open) => !open && closeFeatureFlagsDialog()}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-purple-600" />
              Feature Flags - {featureFlagsCompany?.company_name}
            </DialogTitle>
            <DialogDescription>
              Enable or disable specific features for this company. Changes take effect on next login.
            </DialogDescription>
          </DialogHeader>
          
          {featureFlagsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-6 py-4">
              {/* Feature Flags by Module */}
              {Object.entries(availableFeatures).map(([moduleKey, features]) => (
                <div key={moduleKey} className="space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2 text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    {moduleKey === 'asset_management' && <Building2 className="w-4 h-4" />}
                    {moduleKey === 'production_testing' && <ClipboardCheck className="w-4 h-4" />}
                    {moduleKey === 'online_monitoring' && <Activity className="w-4 h-4" />}
                    {moduleKey === 'administration' && <Shield className="w-4 h-4" />}
                    {moduleKey.replace(/_/g, ' ')}
                  </h3>
                  <div className="grid gap-2">
                    {features.map((feature) => (
                      <div 
                        key={feature.key}
                        className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 dark:bg-gray-800"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{feature.name}</div>
                          <div className="text-xs text-muted-foreground">{feature.description}</div>
                          <Badge variant="outline" className="mt-1 text-[10px]">
                            {feature.category}
                          </Badge>
                        </div>
                        <Switch
                          checked={companyFeatures[feature.key] ?? feature.default}
                          onCheckedChange={() => toggleFeature(feature.key)}
                          className="ml-4"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Workflow Variants */}
              {Object.keys(availableWorkflows).length > 0 && (
                <div className="space-y-3 border-t pt-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2 text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    <GitBranch className="w-4 h-4" />
                    Workflow Variants
                  </h3>
                  <div className="grid gap-3">
                    {Object.entries(availableWorkflows).map(([workflowKey, workflow]) => (
                      <div 
                        key={workflowKey}
                        className="p-3 rounded-lg border bg-gray-50 dark:bg-gray-800"
                      >
                        <div className="font-medium text-sm mb-1">{workflow.name}</div>
                        <div className="text-xs text-muted-foreground mb-2">{workflow.description}</div>
                        <Select
                          value={companyWorkflows[workflowKey] ?? workflow.default}
                          onValueChange={(value) => setWorkflowVariant(workflowKey, value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(workflow.options).map(([optKey, optLabel]) => (
                              <SelectItem key={optKey} value={optKey}>
                                {optLabel}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={closeFeatureFlagsDialog}>
              Cancel
            </Button>
            <Button 
              onClick={saveFeatureFlags}
              disabled={savingFeatures || featureFlagsLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {savingFeatures ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Configuration'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};