import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Plus,
  Trash2,
  GripVertical,
  Settings,
  Loader2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  AlertCircle,
  Thermometer,
  Hash,
  Type,
  CheckSquare,
  Camera,
  List,
  Zap,
} from 'lucide-react';
import { dailyLogAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const PARAM_TYPES = [
  { value: 'numeric', label: 'Numeric', icon: Hash, description: 'Number input (temperature, pressure, etc.)' },
  { value: 'select', label: 'Selection', icon: List, description: 'Dropdown selection' },
  { value: 'text', label: 'Text', icon: Type, description: 'Free text input' },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare, description: 'Yes/No toggle' },
  { value: 'photo', label: 'Photo', icon: Camera, description: 'Photo capture with optional OCR' },
  { value: 'status', label: 'Status', icon: Zap, description: 'Operational status (Energized/De-energized)' },
];

const CATEGORIES = [
  'Status',
  'Temperature',
  'Electrical',
  'Mechanical',
  'Oil',
  'Gas',
  'Inspection',
  'Environment',
  'Documentation',
  'General',
];

const DailyLogTemplateConfig = ({ 
  open, 
  onClose, 
  assetType,
  companyId,
  onSave 
}) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState(null);
  const [expandedParam, setExpandedParam] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (open && assetType && companyId) {
      loadTemplate();
    }
  }, [open, assetType, companyId]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const response = await dailyLogAPI.getTemplate(assetType, companyId);
      setTemplate(response);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to load template:', error);
      toast.error('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = (field, value) => {
    setTemplate(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleParamChange = (paramIndex, field, value) => {
    setTemplate(prev => {
      const newParams = [...(prev.parameters || [])];
      newParams[paramIndex] = { ...newParams[paramIndex], [field]: value };
      return { ...prev, parameters: newParams };
    });
    setHasChanges(true);
  };

  const addParameter = () => {
    const newParam = {
      param_id: `new_${Date.now()}`,
      param_name: 'New Parameter',
      param_type: 'numeric',
      unit: '',
      required: false,
      order: (template?.parameters?.length || 0) + 1,
      category: 'General',
      ocr_enabled: false,
    };
    
    setTemplate(prev => ({
      ...prev,
      parameters: [...(prev.parameters || []), newParam]
    }));
    setExpandedParam(newParam.param_id);
    setHasChanges(true);
  };

  const removeParameter = (paramIndex) => {
    setTemplate(prev => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== paramIndex)
    }));
    setHasChanges(true);
  };

  const moveParameter = (paramIndex, direction) => {
    const newIndex = direction === 'up' ? paramIndex - 1 : paramIndex + 1;
    if (newIndex < 0 || newIndex >= template.parameters.length) return;

    setTemplate(prev => {
      const newParams = [...prev.parameters];
      [newParams[paramIndex], newParams[newIndex]] = [newParams[newIndex], newParams[paramIndex]];
      // Update order values
      newParams.forEach((p, i) => p.order = i + 1);
      return { ...prev, parameters: newParams };
    });
    setHasChanges(true);
  };

  const duplicateParameter = (paramIndex) => {
    const original = template.parameters[paramIndex];
    const duplicate = {
      ...original,
      param_id: `dup_${Date.now()}`,
      param_name: `${original.param_name} (Copy)`,
      order: template.parameters.length + 1,
    };
    
    setTemplate(prev => ({
      ...prev,
      parameters: [...prev.parameters, duplicate]
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const templateData = {
        ...template,
        company_id: companyId,
        asset_type: assetType,
        created_by: currentUser?.user_id,
      };
      
      await dailyLogAPI.saveTemplate(templateData);
      toast.success('Template saved successfully');
      setHasChanges(false);
      onSave?.();
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const getParamTypeIcon = (type) => {
    const paramType = PARAM_TYPES.find(p => p.value === type);
    return paramType?.icon || Hash;
  };

  const renderParameterEditor = (param, index) => {
    const isExpanded = expandedParam === param.param_id;
    const Icon = getParamTypeIcon(param.param_type);

    return (
      <Card key={param.param_id} className="mb-2">
        <CardHeader 
          className="py-3 px-4 cursor-pointer hover:bg-muted/50"
          onClick={() => setExpandedParam(isExpanded ? null : param.param_id)}
        >
          <div className="flex items-center gap-3">
            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
            <Icon className="w-4 h-4 text-primary" />
            <div className="flex-1">
              <span className="font-medium">{param.param_name}</span>
              {param.required && (
                <Badge variant="destructive" className="ml-2 text-xs">Required</Badge>
              )}
              {param.ocr_enabled && (
                <Badge variant="outline" className="ml-2 text-xs">OCR</Badge>
              )}
            </div>
            <Badge variant="secondary" className="text-xs">{param.category}</Badge>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => { e.stopPropagation(); moveParameter(index, 'up'); }}
                disabled={index === 0}
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => { e.stopPropagation(); moveParameter(index, 'down'); }}
                disabled={index === template.parameters.length - 1}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => { e.stopPropagation(); duplicateParameter(index); }}
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); removeParameter(index); }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0 pb-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Basic Fields */}
              <div className="space-y-2">
                <Label>Parameter Name *</Label>
                <Input
                  value={param.param_name}
                  onChange={(e) => handleParamChange(index, 'param_name', e.target.value)}
                  placeholder="e.g., OTI Temperature"
                />
              </div>

              <div className="space-y-2">
                <Label>Type *</Label>
                <Select
                  value={param.param_type}
                  onValueChange={(val) => handleParamChange(index, 'param_type', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PARAM_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={param.category || 'General'}
                  onValueChange={(val) => handleParamChange(index, 'category', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {param.param_type === 'numeric' && (
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input
                    value={param.unit || ''}
                    onChange={(e) => handleParamChange(index, 'unit', e.target.value)}
                    placeholder="e.g., °C, kV, A"
                  />
                </div>
              )}

              {/* Options for numeric thresholds */}
              {param.param_type === 'numeric' && (
                <>
                  <div className="col-span-2">
                    <Separator className="my-2" />
                    <Label className="text-sm text-muted-foreground">Threshold Settings (Optional)</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>Min Value</Label>
                    <Input
                      type="number"
                      value={param.min_value ?? ''}
                      onChange={(e) => handleParamChange(index, 'min_value', e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Value</Label>
                    <Input
                      type="number"
                      value={param.max_value ?? ''}
                      onChange={(e) => handleParamChange(index, 'max_value', e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Warning Max</Label>
                    <Input
                      type="number"
                      value={param.warning_max ?? ''}
                      onChange={(e) => handleParamChange(index, 'warning_max', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="Show warning above this"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Critical Max</Label>
                    <Input
                      type="number"
                      value={param.critical_max ?? ''}
                      onChange={(e) => handleParamChange(index, 'critical_max', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="Show critical above this"
                    />
                  </div>
                </>
              )}

              {/* Options for select type */}
              {param.param_type === 'select' && (
                <div className="col-span-2 space-y-2">
                  <Label>Options (one per line)</Label>
                  <Textarea
                    value={(param.options || []).join('\n')}
                    onChange={(e) => handleParamChange(index, 'options', e.target.value.split('\n').filter(o => o.trim()))}
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                    rows={4}
                  />
                </div>
              )}

              {/* Checkboxes */}
              <div className="col-span-2 flex gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={param.required}
                    onCheckedChange={(checked) => handleParamChange(index, 'required', checked)}
                  />
                  <Label className="text-sm cursor-pointer">Required Field</Label>
                </div>

                {(param.param_type === 'numeric' || param.param_type === 'photo') && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={param.ocr_enabled}
                      onCheckedChange={(checked) => handleParamChange(index, 'ocr_enabled', checked)}
                    />
                    <Label className="text-sm cursor-pointer">Enable OCR</Label>
                  </div>
                )}

                {param.param_type === 'select' && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={param.sync_with_nameplate}
                      onCheckedChange={(checked) => handleParamChange(index, 'sync_with_nameplate', checked)}
                    />
                    <Label className="text-sm cursor-pointer">Sync to Nameplate</Label>
                  </div>
                )}
              </div>

              {/* OCR hint */}
              {param.ocr_enabled && (
                <div className="col-span-2 space-y-2">
                  <Label>OCR Hint (helps AI read the meter)</Label>
                  <Input
                    value={param.ocr_hint || ''}
                    onChange={(e) => handleParamChange(index, 'ocr_hint', e.target.value)}
                    placeholder="e.g., analog gauge, digital display, dial meter"
                  />
                </div>
              )}

              {/* Nameplate sync settings */}
              {param.sync_with_nameplate && (
                <div className="col-span-2 space-y-2">
                  <Label>Nameplate Key (field to sync to)</Label>
                  <Input
                    value={param.nameplate_key || ''}
                    onChange={(e) => handleParamChange(index, 'nameplate_key', e.target.value)}
                    placeholder="e.g., current_tap_position"
                  />
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Configure Daily Log Template - {assetType}
          </DialogTitle>
          <DialogDescription>
            Customize the parameters that field engineers will record during daily inspections
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            {/* Template Info */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input
                    value={template?.template_name || ''}
                    onChange={(e) => handleTemplateChange('template_name', e.target.value)}
                    placeholder="e.g., Transformer Daily Log"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={template?.description || ''}
                    onChange={(e) => handleTemplateChange('description', e.target.value)}
                    placeholder="Brief description of this template"
                  />
                </div>
              </div>

              {template?.is_default && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-amber-700">
                    This is the default template. Saving will create a custom version for your company.
                  </span>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            {/* Parameters */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Parameters ({template?.parameters?.length || 0})</Label>
                <Button onClick={addParameter} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Parameter
                </Button>
              </div>

              <div className="space-y-2">
                {(template?.parameters || [])
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((param, index) => renderParameterEditor(param, index))}
              </div>

              {(!template?.parameters || template.parameters.length === 0) && (
                <Card className="p-8 text-center">
                  <Thermometer className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No parameters defined</p>
                  <Button onClick={addParameter} className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Parameter
                  </Button>
                </Card>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="px-6 py-4 border-t gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading || saving || !hasChanges}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Template
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DailyLogTemplateConfig;
