/**
 * Dashboard Templates Management Page
 * Super Admin UI for managing dashboard templates and company assignments
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { 
  Layout,
  Plus,
  Edit2,
  Trash2,
  Copy,
  CheckCircle,
  Building2,
  Eye,
  Save,
  X,
  Settings,
  Palette,
  Layers,
  Grid3X3,
  ChevronRight,
  Star,
  StarOff,
  RefreshCw,
  Search,
  Monitor,
  Factory
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { monitoringAPI } from '../../services/api';
import { toast } from 'sonner';

// Available widget types for templates
const WIDGET_TYPES = [
  { type: 'kpi_card', name: 'KPI Card', description: 'Single metric display', icon: Grid3X3 },
  { type: 'trend_chart', name: 'Trend Chart', description: 'Line/area chart for trends', icon: Monitor },
  { type: 'alarm_list', name: 'Alarm List', description: 'List of active alarms', icon: Monitor },
  { type: 'equipment_table', name: 'Equipment Table', description: 'Equipment status table', icon: Monitor },
  { type: 'regional_overview', name: 'Regional Overview', description: 'Region-based summary', icon: Monitor },
  { type: 'map_view', name: 'Map Widget', description: 'Mini map view', icon: Monitor },
  { type: 'health_chart', name: 'Health Distribution', description: 'Pie/donut chart', icon: Monitor },
];

// Section types
const SECTION_TYPES = [
  { type: 'summary_cards', name: 'Summary Cards', description: 'Row of KPI cards' },
  { type: 'regional_overview', name: 'Regional Overview', description: 'Region cards with stats' },
  { type: 'alarm_list', name: 'Alarm List', description: 'Active alarms panel' },
  { type: 'trend_section', name: 'Trend Analysis', description: 'Charts and trends' },
  { type: 'equipment_grid', name: 'Equipment Grid', description: 'Equipment status cards' },
  { type: 'custom', name: 'Custom Section', description: 'Flexible layout section' },
];

const COLOR_SCHEMES = [
  { value: 'default', name: 'Default (Blue)', colors: ['#3B82F6', '#10B981', '#F59E0B'] },
  { value: 'ocean', name: 'Ocean (Teal)', colors: ['#06B6D4', '#0EA5E9', '#22D3EE'] },
  { value: 'forest', name: 'Forest (Green)', colors: ['#10B981', '#059669', '#34D399'] },
  { value: 'sunset', name: 'Sunset (Orange)', colors: ['#F59E0B', '#F97316', '#FBBF24'] },
  { value: 'royal', name: 'Royal (Purple)', colors: ['#8B5CF6', '#7C3AED', '#A78BFA'] },
];

export function DashboardTemplatesPage({ onLogout }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [allTemplates, setAllTemplates] = useState([]);
  const [activeTab, setActiveTab] = useState('templates');
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  
  // Form states
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New template form
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    template_type: 'monitoring',
    is_default: false,
    is_active: true,
    color_scheme: 'default',
    sections: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [templatesRes, assignmentsRes] = await Promise.all([
        monitoringAPI.getDashboardTemplates({}),
        monitoringAPI.getAllDashboardAssignments()
      ]);
      
      setTemplates(templatesRes.templates || []);
      setAssignments(assignmentsRes.assignments || []);
      setAllTemplates(assignmentsRes.templates || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim()) {
      toast.error('Template name is required');
      return;
    }
    
    try {
      await monitoringAPI.createDashboardTemplate(newTemplate);
      toast.success('Template created successfully');
      setShowCreateDialog(false);
      setNewTemplate({
        name: '',
        description: '',
        template_type: 'monitoring',
        is_default: false,
        is_active: true,
        color_scheme: 'default',
        sections: []
      });
      fetchData();
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    }
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return;
    
    try {
      await monitoringAPI.updateDashboardTemplate(selectedTemplate.template_id, selectedTemplate);
      toast.success('Template updated successfully');
      setShowEditDialog(false);
      setSelectedTemplate(null);
      fetchData();
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await monitoringAPI.deleteDashboardTemplate(templateId);
      toast.success('Template deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error(error.message || 'Failed to delete template');
    }
  };

  const handleCloneTemplate = async (templateId, templateName) => {
    try {
      await monitoringAPI.cloneDashboardTemplate(templateId, `${templateName} (Copy)`);
      toast.success('Template cloned successfully');
      fetchData();
    } catch (error) {
      console.error('Error cloning template:', error);
      toast.error('Failed to clone template');
    }
  };

  const handleAssignTemplate = async () => {
    if (!selectedCompany || !selectedTemplate) return;
    
    try {
      await monitoringAPI.assignCompanyDashboard(
        selectedCompany.company_id, 
        selectedTemplate.template_id,
        'monitoring'
      );
      toast.success('Dashboard assigned successfully');
      setShowAssignDialog(false);
      setSelectedCompany(null);
      setSelectedTemplate(null);
      fetchData();
    } catch (error) {
      console.error('Error assigning template:', error);
      toast.error('Failed to assign template');
    }
  };

  const handleSetDefault = async (template) => {
    try {
      await monitoringAPI.updateDashboardTemplate(template.template_id, { is_default: true });
      toast.success('Default template updated');
      fetchData();
    } catch (error) {
      console.error('Error setting default:', error);
      toast.error('Failed to set default');
    }
  };

  // Filter assignments by search
  const filteredAssignments = assignments.filter(a => 
    a.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.company_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        <AppHeader onLogout={onLogout} />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-gray-500">Loading templates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <AppHeader onLogout={onLogout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl shadow-lg shadow-violet-200">
                <Layout className="h-6 w-6 text-white" />
              </div>
              Dashboard Templates
            </h1>
            <p className="text-gray-500 mt-1">Manage and assign custom dashboard layouts to customers</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="gap-2 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-lg shadow-violet-200"
            >
              <Plus className="h-4 w-4" />
              New Template
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white shadow-sm border border-gray-200 p-1">
            <TabsTrigger value="templates" className="gap-2 data-[state=active]:bg-violet-500 data-[state=active]:text-white">
              <Layers className="h-4 w-4" />
              Templates ({templates.length})
            </TabsTrigger>
            <TabsTrigger value="assignments" className="gap-2 data-[state=active]:bg-violet-500 data-[state=active]:text-white">
              <Building2 className="h-4 w-4" />
              Company Assignments ({assignments.length})
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card 
                  key={template.template_id}
                  className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
                    template.is_default ? 'ring-2 ring-violet-500' : ''
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                          template.template_type === 'monitoring' 
                            ? 'bg-gradient-to-br from-cyan-500 to-blue-500' 
                            : 'bg-gradient-to-br from-orange-500 to-amber-500'
                        }`}>
                          {template.template_type === 'monitoring' ? (
                            <Monitor className="h-5 w-5 text-white" />
                          ) : (
                            <Factory className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <CardDescription className="text-xs capitalize">
                            {template.template_type} Dashboard
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {template.is_default && (
                          <Badge className="bg-violet-100 text-violet-700 border-0">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Default
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {template.description || 'No description'}
                    </p>
                    
                    {/* Color scheme preview */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs text-gray-400">Color Scheme:</span>
                      <div className="flex gap-1">
                        {COLOR_SCHEMES.find(c => c.value === template.color_scheme)?.colors.map((color, i) => (
                          <div 
                            key={i}
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        )) || (
                          <span className="text-xs text-gray-500">Default</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Sections count */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                      <Grid3X3 className="h-3 w-3" />
                      {template.sections?.length || 0} sections configured
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 gap-1"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="gap-1"
                        onClick={() => handleCloneTemplate(template.template_id, template.name)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      {!template.is_default && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="gap-1"
                            onClick={() => handleSetDefault(template)}
                          >
                            <Star className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="gap-1 text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteTemplate(template.template_id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {templates.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Layout className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-800 font-medium">No templates found</p>
                  <p className="text-gray-500 text-sm mt-1">Create your first dashboard template</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments">
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Company Dashboard Assignments</CardTitle>
                    <CardDescription>Assign dashboard templates to each company</CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search companies..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-gray-50"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Company Code</TableHead>
                      <TableHead>Monitoring Dashboard</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssignments.map((company) => (
                      <TableRow key={company.company_id}>
                        <TableCell className="font-medium">{company.company_name}</TableCell>
                        <TableCell className="text-gray-500">{company.company_code}</TableCell>
                        <TableCell>
                          <Badge className="bg-cyan-100 text-cyan-700 border-0">
                            {company.monitoring_template_name || 'Default'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={company.is_active ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-gray-100 text-gray-700 border-0'}>
                            {company.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => {
                              setSelectedCompany(company);
                              setShowAssignDialog(true);
                            }}
                          >
                            <Settings className="h-3 w-3" />
                            Assign
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {filteredAssignments.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No companies found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-violet-500" />
              Create Dashboard Template
            </DialogTitle>
            <DialogDescription>
              Create a new dashboard template that can be assigned to companies
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Template Name *</Label>
              <Input
                value={newTemplate.name}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Executive Overview"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newTemplate.description}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this template..."
                className="min-h-[80px]"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Type</Label>
                <Select 
                  value={newTemplate.template_type}
                  onValueChange={(v) => setNewTemplate(prev => ({ ...prev, template_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monitoring">Monitoring Dashboard</SelectItem>
                    <SelectItem value="production">Production Dashboard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Color Scheme</Label>
                <Select 
                  value={newTemplate.color_scheme}
                  onValueChange={(v) => setNewTemplate(prev => ({ ...prev, color_scheme: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_SCHEMES.map(scheme => (
                      <SelectItem key={scheme.value} value={scheme.value}>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {scheme.colors.map((color, i) => (
                              <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                            ))}
                          </div>
                          {scheme.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newTemplate.is_default}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, is_default: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Set as default template</span>
              </label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTemplate}
              className="gap-2 bg-violet-500 hover:bg-violet-600"
            >
              <Plus className="h-4 w-4" />
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-violet-500" />
              Edit Dashboard Template
            </DialogTitle>
            <DialogDescription>
              Modify template settings and sections
            </DialogDescription>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-800">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Template Name *</Label>
                    <Input
                      value={selectedTemplate.name}
                      onChange={(e) => setSelectedTemplate(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Color Scheme</Label>
                    <Select 
                      value={selectedTemplate.color_scheme || 'default'}
                      onValueChange={(v) => setSelectedTemplate(prev => ({ ...prev, color_scheme: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COLOR_SCHEMES.map(scheme => (
                          <SelectItem key={scheme.value} value={scheme.value}>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                {scheme.colors.map((color, i) => (
                                  <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                                ))}
                              </div>
                              {scheme.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={selectedTemplate.description || ''}
                    onChange={(e) => setSelectedTemplate(prev => ({ ...prev, description: e.target.value }))}
                    className="min-h-[60px]"
                  />
                </div>
              </div>
              
              {/* Sections */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-800">Dashboard Sections</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const newSection = {
                        section_id: `section-${Date.now()}`,
                        section_type: 'custom',
                        title: 'New Section',
                        order: (selectedTemplate.sections?.length || 0) + 1,
                        is_visible: true,
                        widgets: [],
                        config: {}
                      };
                      setSelectedTemplate(prev => ({
                        ...prev,
                        sections: [...(prev.sections || []), newSection]
                      }));
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Section
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {(selectedTemplate.sections || []).map((section, index) => (
                    <div 
                      key={section.section_id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Grid3X3 className="h-4 w-4 text-gray-400" />
                            <Input
                              value={section.title}
                              onChange={(e) => {
                                const updated = [...selectedTemplate.sections];
                                updated[index] = { ...section, title: e.target.value };
                                setSelectedTemplate(prev => ({ ...prev, sections: updated }));
                              }}
                              className="h-8 w-40"
                            />
                          </div>
                          <Select
                            value={section.section_type}
                            onValueChange={(v) => {
                              const updated = [...selectedTemplate.sections];
                              updated[index] = { ...section, section_type: v };
                              setSelectedTemplate(prev => ({ ...prev, sections: updated }));
                            }}
                          >
                            <SelectTrigger className="h-8 w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SECTION_TYPES.map(type => (
                                <SelectItem key={type.type} value={type.type}>{type.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 text-xs">
                            <input
                              type="checkbox"
                              checked={section.is_visible}
                              onChange={(e) => {
                                const updated = [...selectedTemplate.sections];
                                updated[index] = { ...section, is_visible: e.target.checked };
                                setSelectedTemplate(prev => ({ ...prev, sections: updated }));
                              }}
                              className="rounded border-gray-300"
                            />
                            Visible
                          </label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
                            onClick={() => {
                              const updated = selectedTemplate.sections.filter((_, i) => i !== index);
                              setSelectedTemplate(prev => ({ ...prev, sections: updated }));
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        {SECTION_TYPES.find(t => t.type === section.section_type)?.description || 'Custom section'}
                      </p>
                    </div>
                  ))}
                  
                  {(!selectedTemplate.sections || selectedTemplate.sections.length === 0) && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No sections configured. Add sections to build your dashboard layout.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateTemplate}
              className="gap-2 bg-violet-500 hover:bg-violet-600"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Template Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-violet-500" />
              Assign Dashboard Template
            </DialogTitle>
            <DialogDescription>
              {selectedCompany && `Assign a dashboard template to ${selectedCompany.company_name}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Monitoring Dashboard Template</Label>
              <Select
                value={selectedTemplate?.template_id || ''}
                onValueChange={(v) => {
                  const template = templates.find(t => t.template_id === v);
                  setSelectedTemplate(template);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.filter(t => t.template_type === 'monitoring').map(template => (
                    <SelectItem key={template.template_id} value={template.template_id}>
                      <div className="flex items-center gap-2">
                        {template.name}
                        {template.is_default && (
                          <Badge className="bg-violet-100 text-violet-700 border-0 text-xs">Default</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedTemplate && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">{selectedTemplate.description || 'No description'}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {selectedTemplate.sections?.length || 0} sections configured
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignTemplate}
              disabled={!selectedTemplate}
              className="gap-2 bg-violet-500 hover:bg-violet-600"
            >
              <CheckCircle className="h-4 w-4" />
              Assign Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DashboardTemplatesPage;
