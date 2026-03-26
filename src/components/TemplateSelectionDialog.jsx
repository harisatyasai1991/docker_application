import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { 
  FileText, 
  Download, 
  Crown, 
  Star, 
  Check, 
  Lock,
  Sparkles,
  Building2,
  ChevronRight,
  Layout
} from 'lucide-react';
import { reportTemplateAPI, canvasTemplateAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

// License tier definitions
const LICENSE_TIERS = {
  FREE: 'free',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise'
};

// Standard Report Template definition (built-in)
const STANDARD_TEMPLATE = {
  template_id: 'standard-report',
  template_name: 'Standard Report',
  description: 'Comprehensive DMS Insight test report featuring company branding, detailed asset information, complete SOP execution records with photo evidence, parameter measurements with visual charts, and digital signature verification for regulatory compliance.',
  test_type: 'all',
  is_standard: true,
  is_active: true,
  elements: [
    { element_id: 'header', element_type: 'header', section: 'header', position: 1 },
    { element_id: 'test-info', element_type: 'test_summary', section: 'body', position: 2 },
    { element_id: 'asset-info', element_type: 'asset_info', section: 'body', position: 3 },
    { element_id: 'about-test', element_type: 'about_test', section: 'body', position: 4 },
    { element_id: 'sop-steps', element_type: 'sop_steps', section: 'body', position: 5 },
    { element_id: 'parameters', element_type: 'parameters_table', section: 'body', position: 6 },
    { element_id: 'charts', element_type: 'charts', section: 'body', position: 7 },
    { element_id: 'conclusion', element_type: 'conclusion', section: 'body', position: 8 },
    { element_id: 'signatures', element_type: 'signature_block', section: 'body', position: 9 },
    { element_id: 'footer', element_type: 'footer', section: 'footer', position: 10 },
  ],
  features: ['header', 'footer', 'test_info', 'asset_info', 'sop_steps', 'parameters', 'charts', 'signatures']
};

export const TemplateSelectionDialog = ({ 
  open, 
  onOpenChange, 
  onSelectTemplate,
  testType = 'all',
  reportData = null 
}) => {
  const { currentUser } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [canvasTemplates, setCanvasTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(STANDARD_TEMPLATE);
  
  // Determine user's license tier (can be from user profile or company settings)
  // Admin and Master users get premium access by default
  const isAdminUser = currentUser?.role === 'admin' || currentUser?.role === 'master' || currentUser?.role === 'company_admin';
  const userLicenseTier = isAdminUser ? LICENSE_TIERS.PREMIUM : (currentUser?.license_tier || LICENSE_TIERS.FREE);
  
  // Check if user can use custom templates
  const canUseCustomTemplates = userLicenseTier === LICENSE_TIERS.PREMIUM || userLicenseTier === LICENSE_TIERS.ENTERPRISE;
  const canUseEnterpriseFeatures = userLicenseTier === LICENSE_TIERS.ENTERPRISE;

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      // Fetch both regular and canvas templates
      const [regularData, canvasData] = await Promise.all([
        reportTemplateAPI.getAll(),
        canvasTemplateAPI.getAll()
      ]);
      
      // Filter regular templates - show all active templates
      const filteredTemplates = regularData.filter(t => {
        if (!t.is_active) return false;
        
        // Show all templates if testType is 'all' or not specified
        if (!testType || testType === 'all') return true;
        
        // Match by test_type field
        const templateTestType = (t.test_type || '').toLowerCase();
        const reportTestType = (testType || '').toLowerCase();
        
        // General templates apply to all
        if (templateTestType === 'general' || templateTestType === 'all') return true;
        
        // Direct match
        if (templateTestType === reportTestType) return true;
        
        // Match transformer/electrical/motor etc. (common asset types)
        const assetTypes = ['transformer', 'motor', 'circuit_breaker', 'relay', 'cable', 'battery'];
        if (assetTypes.includes(templateTestType)) return true;
        
        return false;
      });
      
      // Filter canvas templates (all active ones)
      const filteredCanvasTemplates = (canvasData || []).filter(t => t.is_active !== false);
      
      setTemplates(filteredTemplates);
      setCanvasTemplates(filteredCanvasTemplates);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open, testType]);

  const handleSelectTemplate = (template) => {
    // Check license for custom templates
    if (!template.is_standard && !canUseCustomTemplates) {
      toast.error('Custom templates require Premium or Enterprise license');
      return;
    }
    setSelectedTemplate(template);
  };

  const handleConfirm = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
      onOpenChange(false);
    }
  };

  const getLicenseBadge = (tier) => {
    switch (tier) {
      case LICENSE_TIERS.PREMIUM:
        return (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px]">
            <Crown className="w-3 h-3 mr-1" />
            Premium
          </Badge>
        );
      case LICENSE_TIERS.ENTERPRISE:
        return (
          <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px]">
            <Building2 className="w-3 h-3 mr-1" />
            Enterprise
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Select Report Template
          </DialogTitle>
          <DialogDescription>
            Choose a template for your PDF report. 
            {!canUseCustomTemplates && (
              <span className="text-amber-600 ml-1">
                Upgrade to Premium for custom templates.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden min-h-0">
          <ScrollArea className="h-[calc(85vh-200px)] pr-4">
            {/* Standard Template - Always Available */}
            <div className="mb-4">
              <Label className="text-xs text-muted-foreground mb-2 block flex items-center gap-2">
                <Star className="w-3 h-3 text-amber-500" />
                Standard Template (Free)
              </Label>
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate?.template_id === STANDARD_TEMPLATE.template_id 
                    ? 'ring-2 ring-primary border-primary' 
                    : 'border-border/50 hover:border-primary/50'
                }`}
                onClick={() => handleSelectTemplate(STANDARD_TEMPLATE)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{STANDARD_TEMPLATE.template_name}</h4>
                        <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                          <Check className="w-3 h-3 mr-1" />
                          Recommended
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {STANDARD_TEMPLATE.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {STANDARD_TEMPLATE.features.slice(0, 5).map((feature) => (
                          <Badge key={feature} variant="secondary" className="text-[10px]">
                            {feature.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                        {STANDARD_TEMPLATE.features.length > 5 && (
                          <Badge variant="secondary" className="text-[10px]">
                            +{STANDARD_TEMPLATE.features.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    {selectedTemplate?.template_id === STANDARD_TEMPLATE.template_id && (
                      <div className="ml-2">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator className="my-4" />

            {/* Custom Templates - Premium/Enterprise */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-purple-500" />
                Custom Templates
                {!canUseCustomTemplates && (
                  <Badge variant="outline" className="text-[10px] ml-2">
                    <Lock className="w-3 h-3 mr-1" />
                    Premium Required
                  </Badge>
                )}
              </Label>

              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading templates...
                </div>
              ) : templates.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-6 text-center">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      No custom templates available for this test type.
                    </p>
                    {canUseCustomTemplates && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Go to Report Templates to create one.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {templates.map((template) => (
                    <Card 
                      key={template.template_id}
                      className={`transition-all ${
                        canUseCustomTemplates 
                          ? 'cursor-pointer hover:shadow-md' 
                          : 'opacity-60 cursor-not-allowed'
                      } ${
                        selectedTemplate?.template_id === template.template_id 
                          ? 'ring-2 ring-primary border-primary' 
                          : 'border-border/50 hover:border-primary/50'
                      }`}
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{template.template_name}</h4>
                              <Badge variant="outline" className="text-[10px]">
                                {template.test_type}
                              </Badge>
                              {!canUseCustomTemplates && (
                                <Lock className="w-3 h-3 text-muted-foreground" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {template.description || 'Custom report template'}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{template.elements?.length || 0} elements</span>
                              <span>•</span>
                              <span>by {template.created_by}</span>
                            </div>
                          </div>
                          {selectedTemplate?.template_id === template.template_id && canUseCustomTemplates && (
                            <div className="ml-2">
                              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Canvas Templates Section */}
            {canvasTemplates.length > 0 && (
              <>
                <Separator className="my-4" />
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block flex items-center gap-2">
                    <Layout className="w-3 h-3 text-purple-500" />
                    Canvas Templates (Drag & Drop Designer)
                    {!canUseCustomTemplates && (
                      <Badge variant="outline" className="text-[10px] ml-2">
                        <Lock className="w-3 h-3 mr-1" />
                        Premium Required
                      </Badge>
                    )}
                  </Label>

                  <div className="space-y-3">
                    {canvasTemplates.map((template) => (
                      <Card 
                        key={`canvas-${template.template_id}`}
                        className={`transition-all border-l-4 border-l-purple-500 ${
                          canUseCustomTemplates 
                            ? 'cursor-pointer hover:shadow-md' 
                            : 'opacity-60 cursor-not-allowed'
                        } ${
                          selectedTemplate?.template_id === template.template_id 
                            ? 'ring-2 ring-purple-500 border-purple-500' 
                            : 'border-border/50 hover:border-purple-300'
                        }`}
                        onClick={() => handleSelectTemplate({ ...template, is_canvas: true })}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{template.template_name}</h4>
                                <Badge className="text-[10px] bg-purple-100 text-purple-800">
                                  <Layout className="w-3 h-3 mr-1" />
                                  Canvas
                                </Badge>
                                {!canUseCustomTemplates && (
                                  <Lock className="w-3 h-3 text-muted-foreground" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {template.description || 'Custom drag & drop canvas template'}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{template.elements?.length || 0} elements</span>
                                <span>•</span>
                                <span>{template.orientation === 'landscape' ? 'Landscape' : 'Portrait'}</span>
                                <span>•</span>
                                <span>by {template.created_by}</span>
                              </div>
                            </div>
                            {selectedTemplate?.template_id === template.template_id && canUseCustomTemplates && (
                              <div className="ml-2">
                                <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                                  <Check className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Upgrade CTA for Free Users */}
            {!canUseCustomTemplates && (
              <Card className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Crown className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-amber-900">Upgrade to Premium</h4>
                      <p className="text-sm text-amber-700">
                        Create custom report templates with your company branding, custom sections, and more.
                      </p>
                    </div>
                    <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                      Learn More
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="border-t pt-4 mt-2">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              Selected: <span className="font-medium text-foreground">{selectedTemplate?.template_name}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={!selectedTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Generate PDF
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { STANDARD_TEMPLATE, LICENSE_TIERS };
