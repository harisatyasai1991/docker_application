import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { ReportTemplateDesigner } from '../components/ReportTemplateDesigner';
import { CanvasTemplateDesigner } from '../components/CanvasTemplateDesigner';
import { useAPIDataWithRefetch } from '../hooks/useAPI';
import { reportTemplateAPI, canvasTemplateAPI } from '../services/api';
import { LoadingSpinner, ErrorMessage } from '../components/LoadingStates';
import { toast } from 'sonner';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Copy,
  LogOut,
  Home,
  ArrowLeft,
  Layout,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { useNavigate } from 'react-router-dom';

export const ReportTemplatesPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const { currentUser, hasPermission } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [designerMode, setDesignerMode] = useState(null); // 'canvas' or 'simple'
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'standard', 'canvas'

  // Fetch regular templates
  const { data: templates, loading, error, refetch } = useAPIDataWithRefetch(
    () => reportTemplateAPI.getAll(),
    []
  );

  // Fetch canvas templates
  const { data: canvasTemplates, loading: canvasLoading, error: canvasError, refetch: refetchCanvas } = useAPIDataWithRefetch(
    () => canvasTemplateAPI.getAll(),
    []
  );

  // Combined refetch
  const refetchAll = () => {
    refetch();
    refetchCanvas();
  };

  const handleSave = async (templateData) => {
    try {
      // Deep clone to avoid rrweb issues
      const safeTemplateData = JSON.parse(JSON.stringify(templateData));
      
      // Check if this is a canvas template (has orientation and canvas_width/height)
      const isCanvasTemplate = safeTemplateData.orientation && safeTemplateData.canvas_width;
      
      if (isCanvasTemplate) {
        // Use canvas template API
        if (editingTemplate && editingTemplate.template_id) {
          await canvasTemplateAPI.update(editingTemplate.template_id, safeTemplateData);
          toast.success('Canvas template updated successfully');
        } else {
          await canvasTemplateAPI.create(safeTemplateData);
          toast.success('Canvas template created successfully');
        }
      } else {
        // Use regular report template API
        if (editingTemplate) {
          await reportTemplateAPI.update(editingTemplate.template_id, safeTemplateData);
          toast.success('Template updated successfully');
        } else {
          await reportTemplateAPI.create(safeTemplateData);
          toast.success('Template created successfully');
        }
      }
      
      setIsCreating(false);
      setEditingTemplate(null);
      setDesignerMode(null);
      refetchAll();
    } catch (error) {
      console.error('Save template error:', error);
      const errorMessage = error?.message || error?.response?.data?.detail || 'Failed to save template';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (templateId, isCanvas = false) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        if (isCanvas) {
          await canvasTemplateAPI.delete(templateId);
        } else {
          await reportTemplateAPI.delete(templateId);
        }
        toast.success('Template deleted successfully');
        refetchAll();
      } catch (error) {
        toast.error('Failed to delete template');
        console.error(error);
      }
    }
  };

  const handleDuplicate = async (template, isCanvas = false) => {
    try {
      const duplicateData = {
        ...template,
        template_name: `${template.template_name} (Copy)`,
        created_by: currentUser?.full_name || 'Admin',
      };
      delete duplicateData.template_id;
      delete duplicateData.created_at;
      delete duplicateData.updated_at;

      if (isCanvas) {
        await canvasTemplateAPI.create(duplicateData);
      } else {
        await reportTemplateAPI.create(duplicateData);
      }
      toast.success('Template duplicated successfully');
      refetchAll();
    } catch (error) {
      toast.error('Failed to duplicate template');
      console.error(error);
    }
  };

  // Handle edit for canvas templates
  const handleEditCanvas = (template) => {
    setEditingTemplate(template);
    setDesignerMode('canvas');
  };

  // Designer mode selection
  if (designerMode === 'canvas') {
    return (
      <div className="min-h-screen bg-gray-100">
        <CanvasTemplateDesigner
          template={editingTemplate}
          onSave={handleSave}
          onCancel={() => {
            setDesignerMode(null);
            setIsCreating(false);
            setEditingTemplate(null);
          }}
        />
      </div>
    );
  }

  if (designerMode === 'simple' || isCreating || editingTemplate) {
    return (
      <div className="min-h-screen">
        <AppHeader onLogout={onLogout} />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              {editingTemplate ? 'Edit' : 'Create'} Report Template
            </h2>
            <p className="text-sm text-muted-foreground">Design your report layout</p>
          </div>
          
          <ReportTemplateDesigner
            template={editingTemplate}
            onSave={handleSave}
            onCancel={() => {
              setDesignerMode(null);
              setIsCreating(false);
              setEditingTemplate(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader onLogout={onLogout} />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Report Templates</h2>
            <p className="text-sm text-muted-foreground">Manage test report templates</p>
          </div>
          <div className="flex items-center gap-3">
            {hasPermission('edit_templates') && (
              <div className="flex gap-2">
                <Button 
                  onClick={() => setDesignerMode('canvas')}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Layout className="w-4 h-4 mr-2" />
                  Canvas Designer
                </Button>
                <Button variant="outline" onClick={() => setDesignerMode('simple')}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Quick Builder
                </Button>
              </div>
            )}
            <Button variant="outline" onClick={() => navigate('/sites')}>
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4">
          <Button 
            variant={activeTab === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveTab('all')}
          >
            All Templates ({(templates?.length || 0) + (canvasTemplates?.length || 0)})
          </Button>
          <Button 
            variant={activeTab === 'standard' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveTab('standard')}
          >
            Standard ({templates?.length || 0})
          </Button>
          <Button 
            variant={activeTab === 'canvas' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveTab('canvas')}
          >
            <Layout className="w-3 h-3 mr-1" />
            Canvas ({canvasTemplates?.length || 0})
          </Button>
        </div>
      </div>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(loading || canvasLoading) ? (
          <LoadingSpinner message="Loading templates..." />
        ) : (error || canvasError) ? (
          <ErrorMessage message={error?.message || canvasError?.message} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Canvas Templates */}
            {(activeTab === 'all' || activeTab === 'canvas') && canvasTemplates && canvasTemplates.map((template) => (
              <Card key={`canvas-${template.template_id}`} className="border-border/50 hover:shadow-lg transition-smooth border-l-4 border-l-purple-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{template.template_name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {template.description || 'Canvas-style drag & drop template'}
                      </CardDescription>
                    </div>
                    <Badge className="ml-2 bg-purple-100 text-purple-800 hover:bg-purple-100">
                      <Layout className="w-3 h-3 mr-1" />
                      Canvas
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {template.elements?.length || 0} elements
                      </span>
                      <span className="text-xs">
                        {template.orientation === 'landscape' ? 'Landscape' : 'Portrait'}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      by {template.created_by}
                    </div>

                    <div className="flex gap-2">
                      {hasPermission('edit_templates') && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleEditCanvas(template)}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDuplicate(template, true)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(template.template_id, true)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Standard Templates */}
            {(activeTab === 'all' || activeTab === 'standard') && templates && templates.map((template) => (
              <Card key={template.template_id} className="border-border/50 hover:shadow-lg transition-smooth">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{template.template_name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {template.description}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {template.test_type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {template.elements?.length || 0} elements
                        </span>
                        <span className="text-xs">
                          by {template.created_by}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {hasPermission('edit_templates') && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => setEditingTemplate(template)}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDuplicate(template)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(template.template_id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        {!hasPermission('edit_templates') && (
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

            {/* Empty State */}
            {((activeTab === 'all' && (!templates || templates.length === 0) && (!canvasTemplates || canvasTemplates.length === 0)) ||
              (activeTab === 'standard' && (!templates || templates.length === 0)) ||
              (activeTab === 'canvas' && (!canvasTemplates || canvasTemplates.length === 0))) && (
              <div className="col-span-full">
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">
                      {activeTab === 'canvas' ? 'No Canvas Templates Yet' : 
                       activeTab === 'standard' ? 'No Standard Templates Yet' : 'No Templates Yet'}
                    </h3>
                    <p className="text-muted-foreground text-center mb-4">
                      {activeTab === 'canvas' 
                        ? 'Create your first canvas template using the drag & drop designer'
                        : 'Create your first report template to get started'}
                    </p>
                    {hasPermission('edit_templates') && (
                      <div className="flex gap-2">
                        {(activeTab === 'all' || activeTab === 'canvas') && (
                          <Button onClick={() => setDesignerMode('canvas')}>
                            <Layout className="w-4 h-4 mr-2" />
                            Canvas Designer
                          </Button>
                        )}
                        {(activeTab === 'all' || activeTab === 'standard') && (
                          <Button variant="outline" onClick={() => setDesignerMode('simple')}>
                            <Plus className="w-4 h-4 mr-2" />
                            Quick Builder
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
