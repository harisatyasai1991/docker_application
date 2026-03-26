import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import {
  Plus,
  GripVertical,
  Trash2,
  Image as ImageIcon,
  Type,
  Table,
  FileText,
  Save,
  Eye,
  X,
  Upload,
  Settings,
  Bold,
  Italic,
  List,
  AlignLeft,
  Sparkles,
  Wand2,
  Loader2,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Sortable Element Component
const SortableElement = ({ element, onUpdate, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.element_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getElementIcon = (type) => {
    switch (type) {
      case 'logo':
        return <ImageIcon className="w-4 h-4" />;
      case 'text':
        return <Type className="w-4 h-4" />;
      case 'table':
        return <Table className="w-4 h-4" />;
      case 'parameters_table':
        return <Table className="w-4 h-4 text-blue-600" />;
      case 'test_summary':
        return <FileText className="w-4 h-4 text-green-600" />;
      case 'signature_block':
        return <FileText className="w-4 h-4 text-purple-600" />;
      case 'dynamic_field':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getElementTypeName = (type) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getSectionBadgeColor = (section) => {
    switch (section) {
      case 'header': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'footer': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Ensure element has all required fields with defaults
  const normalizedElement = {
    section: 'body',
    width: 'full',
    alignment: 'left',
    row: null,
    ...element,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Drag Handle */}
            <button
              className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-5 h-5" />
            </button>

            {/* Element Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge variant="outline" className="flex items-center gap-1">
                  {getElementIcon(normalizedElement.element_type)}
                  <span>{getElementTypeName(normalizedElement.element_type)}</span>
                </Badge>
                <Badge variant="outline" className={getSectionBadgeColor(normalizedElement.section)}>
                  {normalizedElement.section.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {normalizedElement.width === 'full' ? 'Full Width' : normalizedElement.width === 'half' ? '50%' : normalizedElement.width === 'third' ? '33%' : '25%'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {normalizedElement.alignment}
                </Badge>
                <span className="text-xs text-muted-foreground">Pos {normalizedElement.position}</span>
              </div>

              {/* Layout Controls */}
              <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <Label className="text-xs">Section</Label>
                  <Select
                    value={normalizedElement.section}
                    onValueChange={(value) => onUpdate(element.element_id, { section: value })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="header">Header (All Pages)</SelectItem>
                      <SelectItem value="body">Body (Main Content)</SelectItem>
                      <SelectItem value="footer">Footer (All Pages)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Width</Label>
                  <Select
                    value={normalizedElement.width}
                    onValueChange={(value) => onUpdate(element.element_id, { width: value })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full (100%)</SelectItem>
                      <SelectItem value="half">Half (50%)</SelectItem>
                      <SelectItem value="third">Third (33%)</SelectItem>
                      <SelectItem value="quarter">Quarter (25%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Alignment</Label>
                  <Select
                    value={normalizedElement.alignment}
                    onValueChange={(value) => onUpdate(element.element_id, { alignment: value })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                      <SelectItem value="justify">Justify</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Row (Group Elements)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={normalizedElement.row || 0}
                    onChange={(e) => onUpdate(element.element_id, { row: parseInt(e.target.value) || 0 })}
                    className="h-8 text-xs"
                    placeholder="0 = auto"
                  />
                </div>
              </div>

              {/* Element-specific editors */}
              {element.element_type === 'logo' && (
                <div className="space-y-2">
                  <Label className="text-sm">Logo Image</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            onUpdate(element.element_id, { image_base64: reader.result });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-sm"
                    />
                  </div>
                  {element.image_base64 && (
                    <img
                      src={element.image_base64}
                      alt="Logo preview"
                      className="h-16 w-auto object-contain border rounded"
                    />
                  )}
                  <div className="space-y-1">
                    <Label className="text-xs">Logo Height (in PDF)</Label>
                    <Select
                      value={element.styles?.maxHeight || '60px'}
                      onValueChange={(value) => onUpdate(element.element_id, { 
                        styles: { ...element.styles, maxHeight: value } 
                      })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30px">Small (30px)</SelectItem>
                        <SelectItem value="40px">Medium (40px)</SelectItem>
                        <SelectItem value="60px">Large (60px)</SelectItem>
                        <SelectItem value="80px">Extra Large (80px)</SelectItem>
                        <SelectItem value="100px">Huge (100px)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {element.element_type === 'text' && (
                <div className="space-y-2">
                  <Label className="text-sm">Content</Label>
                  <Textarea
                    value={element.content || ''}
                    onChange={(e) => onUpdate(element.element_id, { content: e.target.value })}
                    placeholder="Enter text content here... You can use basic formatting."
                    rows={6}
                    className="font-sans"
                  />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <AlignLeft className="w-3 h-3" />
                    <span>Plain text with line breaks preserved in PDF</span>
                  </div>
                </div>
              )}

              {element.element_type === 'dynamic_field' && (
                <div className="space-y-2">
                  <Label className="text-sm">Dynamic Field</Label>
                  <Select
                    value={element.field_name || ''}
                    onValueChange={(value) => onUpdate(element.element_id, { field_name: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asset_name">Asset Name</SelectItem>
                      <SelectItem value="asset_id">Asset ID</SelectItem>
                      <SelectItem value="test_name">Test Name</SelectItem>
                      <SelectItem value="test_date">Test Date</SelectItem>
                      <SelectItem value="conductor">Conducted By</SelectItem>
                      <SelectItem value="test_result">Test Result</SelectItem>
                      <SelectItem value="start_time">Start Time</SelectItem>
                      <SelectItem value="completion_time">Completion Time</SelectItem>
                      <SelectItem value="manufacturer">Manufacturer</SelectItem>
                      <SelectItem value="voltage_rating">Voltage Rating</SelectItem>
                    </SelectContent>
                  </Select>
                  {element.field_name && (
                    <p className="text-xs text-muted-foreground">
                      Will display: {`{{${element.field_name}}}`}
                    </p>
                  )}
                </div>
              )}

              {element.element_type === 'table' && (
                <div className="space-y-2">
                  <Label className="text-sm">Table Configuration</Label>
                  <Textarea
                    value={element.table_config ? JSON.stringify(element.table_config, null, 2) : ''}
                    onChange={(e) => {
                      try {
                        const config = JSON.parse(e.target.value);
                        onUpdate(element.element_id, { table_config: config });
                      } catch (err) {
                        // Invalid JSON, don't update
                      }
                    }}
                    placeholder='{"columns": ["Parameter", "Reading", "Limit"], "data_source": "test_readings"}'
                    className="font-mono text-xs"
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    JSON configuration for table structure
                  </p>
                </div>
              )}

              {element.element_type === 'parameters_table' && (
                <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4 text-blue-600" />
                    <Label className="text-sm font-semibold text-blue-900">Parameter Readings Table</Label>
                  </div>
                  <p className="text-xs text-blue-700">
                    This table will automatically display all parameter readings recorded during test execution.
                    Columns: Step | Parameter | Value | Unit | Status
                  </p>
                </div>
              )}

              {element.element_type === 'test_summary' && (
                <div className="space-y-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-600" />
                    <Label className="text-sm font-semibold text-green-900">Test Summary Block</Label>
                  </div>
                  <p className="text-xs text-green-700">
                    Displays a formatted summary including: Asset Name, Asset ID, Test Name, Test Date, Conducted By, and Final Result.
                  </p>
                </div>
              )}

              {element.element_type === 'signature_block' && (
                <div className="space-y-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <Label className="text-sm font-semibold text-purple-900">Signature Block</Label>
                  </div>
                  <p className="text-xs text-purple-700">
                    Adds signature lines for Technician and Supervisor with date fields.
                  </p>
                </div>
              )}
            </div>

            {/* Delete Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(element.element_id)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper to migrate old template elements to new format
const migrateElement = (element) => {
  return {
    section: 'body',
    width: 'full',
    alignment: element.element_type === 'logo' ? 'center' : 'left',
    row: null,
    styles: element.element_type === 'logo' ? { maxHeight: '60px' } : {},
    ...element,
  };
};

// Main Designer Component
export const ReportTemplateDesigner = ({ template = null, onSave, onCancel, companyId = null }) => {
  const [templateName, setTemplateName] = useState(template?.template_name || '');
  const [testType, setTestType] = useState(template?.test_type || '');
  const [description, setDescription] = useState(template?.description || '');
  const [elements, setElements] = useState(
    (template?.elements || []).map(migrateElement)
  );

  // AI Generation State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(true);

  // Preset templates
  const presetTemplates = [
    { id: 'standard', name: 'Standard', description: 'Comprehensive report with all sections', icon: '📋' },
    { id: 'minimal', name: 'Minimal', description: 'Executive summary only', icon: '📄' },
    { id: 'detailed', name: 'Detailed', description: 'Full details with parameters', icon: '📊' },
    { id: 'compliance', name: 'Compliance', description: 'Regulatory compliance format', icon: '✅' },
  ];

  // Generate template from AI or preset
  const generateTemplate = async (preset = null) => {
    setIsGenerating(true);
    try {
      const response = await fetch(`${API_URL}/api/report-templates/generate-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: preset ? null : aiPrompt,
          preset: preset,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Migrate elements to ensure all fields exist
        const migratedElements = data.elements.map(migrateElement);
        setElements(migratedElements);
        
        if (data.template_name && !templateName) {
          setTemplateName(data.template_name);
        }
        if (data.description && !description) {
          setDescription(data.description);
        }
        
        toast.success(`Template generated with ${migratedElements.length} elements!`, {
          description: data.source === 'ai' ? 'Generated using AI' : `Using ${preset} preset`,
        });
        setAiPrompt('');
      } else {
        toast.error('Generation failed', { description: data.error });
      }
    } catch (error) {
      console.error('Template generation error:', error);
      toast.error('Failed to generate template', { description: error.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setElements((items) => {
        const oldIndex = items.findIndex((item) => item.element_id === active.id);
        const newIndex = items.findIndex((item) => item.element_id === over.id);

        const reordered = arrayMove(items, oldIndex, newIndex);
        // Update positions
        return reordered.map((item, index) => ({ ...item, position: index + 1 }));
      });
    }
  };

  const addElement = (type) => {
    let newElement = {
      element_id: `elem-${Date.now()}`,
      element_type: type,
      section: 'body',
      position: elements.length + 1,
      row: null,
      alignment: type === 'logo' ? 'center' : 'left',
      width: 'full',
      content: null,
      field_name: null,
      table_config: null,
      image_base64: null,
      styles: {},
    };

    // Set type-specific defaults
    switch (type) {
      case 'text':
        newElement.content = 'Enter your content here...';
        break;
      case 'logo':
        newElement.alignment = 'center';
        newElement.styles = { maxHeight: '60px' };
        break;
      case 'dynamic_field':
        newElement.field_name = '';
        break;
      case 'table':
        newElement.table_config = { columns: ['Column 1', 'Column 2'], data_source: 'custom' };
        break;
      case 'parameters_table':
        newElement.table_config = { 
          columns: ['Step', 'Parameter', 'Value', 'Unit', 'Status'],
          data_source: 'test_parameters',
          auto_populate: true
        };
        newElement.content = 'Auto-populated from test execution data';
        break;
      case 'test_summary':
        newElement.content = 'Test summary with asset info, test details, and result';
        newElement.table_config = {
          data_source: 'test_summary',
          auto_populate: true,
          fields: ['asset_name', 'asset_id', 'test_name', 'test_date', 'conductor', 'result']
        };
        break;
      case 'signature_block':
        newElement.content = 'Signature block with technician and supervisor fields';
        newElement.table_config = {
          data_source: 'signatures',
          fields: ['technician', 'supervisor', 'date']
        };
        break;
      default:
        break;
    }

    setElements([...elements, newElement]);
    toast.success(`${type.split('_').join(' ')} element added`);
  };

  const updateElement = (elementId, updates) => {
    setElements(elements.map(el =>
      el.element_id === elementId ? { ...el, ...updates } : el
    ));
  };

  const deleteElement = (elementId) => {
    setElements(elements.filter(el => el.element_id !== elementId).map((el, idx) => ({
      ...el,
      position: idx + 1
    })));
    toast.success('Element removed');
  };

  const handleSave = () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    if (!testType.trim()) {
      toast.error('Please select a test type');
      return;
    }
    if (elements.length === 0) {
      toast.error('Please add at least one element to the template');
      return;
    }

    const templateData = {
      template_name: templateName,
      test_type: testType,
      description: description,
      elements: elements,
      company_id: companyId, // Company-specific or null for global
      created_by: 'admin', // TODO: Get from auth context
    };

    onSave(templateData);
  };

  // State for preview mode
  const [showPreview, setShowPreview] = useState(true);
  const [selectedElementId, setSelectedElementId] = useState(null);

  // Mock data for preview
  const mockPreviewData = {
    asset_name: 'TX-001 Power Transformer',
    asset_id: 'ASSET-001',
    test_name: 'Transformer Winding Resistance Test',
    test_date: new Date().toLocaleDateString(),
    conductor: 'John Smith',
    test_result: 'PASS',
    start_time: '09:00 AM',
    completion_time: '11:30 AM',
    manufacturer: 'ABB',
    voltage_rating: '33kV/11kV',
    parameters: [
      { step: 1, parameter: 'HV Winding R-Y', value: '0.125', unit: 'Ω', status: 'Pass' },
      { step: 2, parameter: 'HV Winding Y-B', value: '0.128', unit: 'Ω', status: 'Pass' },
      { step: 3, parameter: 'HV Winding B-R', value: '0.124', unit: 'Ω', status: 'Pass' },
      { step: 4, parameter: 'LV Winding r-y', value: '0.045', unit: 'Ω', status: 'Pass' },
      { step: 5, parameter: 'LV Winding y-b', value: '0.044', unit: 'Ω', status: 'Pass' },
    ]
  };

  // Render preview element
  const renderPreviewElement = (element) => {
    const isSelected = selectedElementId === element.element_id;
    const baseClasses = `p-2 border rounded transition-all ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-gray-200'}`;
    
    switch (element.element_type) {
      case 'logo':
        return (
          <div className={`${baseClasses} text-${element.alignment || 'center'}`} onClick={() => setSelectedElementId(element.element_id)}>
            {element.image_base64 ? (
              <img src={element.image_base64} alt="Logo" className="inline-block" style={{ maxHeight: element.styles?.maxHeight || '60px' }} />
            ) : (
              <div className="inline-flex items-center justify-center w-32 h-16 bg-gray-100 rounded border-2 border-dashed border-gray-300">
                <ImageIcon className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>
        );
      
      case 'text':
        return (
          <div className={`${baseClasses} text-${element.alignment || 'left'}`} onClick={() => setSelectedElementId(element.element_id)}>
            <p className="whitespace-pre-wrap text-sm">{element.content || 'Text content...'}</p>
          </div>
        );
      
      case 'dynamic_field':
        const fieldValue = mockPreviewData[element.field_name] || `{{${element.field_name || 'field'}}}`;
        return (
          <div className={`${baseClasses} text-${element.alignment || 'left'}`} onClick={() => setSelectedElementId(element.element_id)}>
            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm font-medium">{fieldValue}</span>
          </div>
        );
      
      case 'parameters_table':
        return (
          <div className={baseClasses} onClick={() => setSelectedElementId(element.element_id)}>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-blue-50">
                  <th className="border p-1.5 text-left">Step</th>
                  <th className="border p-1.5 text-left">Parameter</th>
                  <th className="border p-1.5 text-right">Value</th>
                  <th className="border p-1.5 text-center">Unit</th>
                  <th className="border p-1.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockPreviewData.parameters.map((p, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border p-1.5">{p.step}</td>
                    <td className="border p-1.5">{p.parameter}</td>
                    <td className="border p-1.5 text-right font-mono">{p.value}</td>
                    <td className="border p-1.5 text-center">{p.unit}</td>
                    <td className="border p-1.5 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${p.status === 'Pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      case 'test_summary':
        return (
          <div className={`${baseClasses} bg-gray-50 p-3 rounded-lg`} onClick={() => setSelectedElementId(element.element_id)}>
            <h4 className="font-semibold text-sm mb-2 text-gray-800">Test Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-gray-500">Asset:</span> <span className="font-medium">{mockPreviewData.asset_name}</span></div>
              <div><span className="text-gray-500">Asset ID:</span> <span className="font-medium">{mockPreviewData.asset_id}</span></div>
              <div><span className="text-gray-500">Test:</span> <span className="font-medium">{mockPreviewData.test_name}</span></div>
              <div><span className="text-gray-500">Date:</span> <span className="font-medium">{mockPreviewData.test_date}</span></div>
              <div><span className="text-gray-500">Conducted By:</span> <span className="font-medium">{mockPreviewData.conductor}</span></div>
              <div><span className="text-gray-500">Result:</span> <span className="font-medium text-green-600">{mockPreviewData.test_result}</span></div>
            </div>
          </div>
        );
      
      case 'signature_block':
        return (
          <div className={`${baseClasses} border-t-2 pt-4 mt-4`} onClick={() => setSelectedElementId(element.element_id)}>
            <div className="grid grid-cols-2 gap-8">
              <div className="text-center">
                <div className="h-12 border-b border-gray-400 mb-1"></div>
                <p className="text-xs text-gray-600">Technician Signature</p>
                <p className="text-xs text-gray-400">Date: ___________</p>
              </div>
              <div className="text-center">
                <div className="h-12 border-b border-gray-400 mb-1"></div>
                <p className="text-xs text-gray-600">Supervisor Signature</p>
                <p className="text-xs text-gray-400">Date: ___________</p>
              </div>
            </div>
          </div>
        );
      
      case 'table':
        return (
          <div className={baseClasses} onClick={() => setSelectedElementId(element.element_id)}>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  {(element.table_config?.columns || ['Column 1', 'Column 2']).map((col, i) => (
                    <th key={i} className="border p-1.5 text-left">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {(element.table_config?.columns || ['Column 1', 'Column 2']).map((_, i) => (
                    <td key={i} className="border p-1.5 text-gray-400 italic">Sample data...</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        );
      
      default:
        return (
          <div className={`${baseClasses} text-gray-400 italic`} onClick={() => setSelectedElementId(element.element_id)}>
            {element.element_type}
          </div>
        );
    }
  };

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col">
      {/* Top Bar - Template Settings */}
      <Card className="mb-4">
        <CardContent className="py-3">
          <div className="flex items-center gap-4">
            <div className="flex-1 grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Template Name</Label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Transformer Test Report"
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Test Type</Label>
                <Select value={testType} onValueChange={setTestType}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select test type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transformer">Transformer</SelectItem>
                    <SelectItem value="switchgear">Switchgear</SelectItem>
                    <SelectItem value="motor">Motor</SelectItem>
                    <SelectItem value="generator">Generator</SelectItem>
                    <SelectItem value="cable">Cable</SelectItem>
                    <SelectItem value="ups">UPS</SelectItem>
                    <SelectItem value="general">General (All Types)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description..."
                  className="h-9"
                />
              </div>
            </div>
            <Separator orientation="vertical" className="h-10" />
            <div className="flex items-center gap-2">
              <Button 
                variant={showPreview ? "default" : "outline"} 
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </Button>
              <Button onClick={handleSave} size="sm">
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
              <Button variant="outline" size="sm" onClick={onCancel}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content - Split View */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0 overflow-hidden">
        {/* Element Palette - Left Sidebar - Compact & Scrollable */}
        <div className="col-span-2 overflow-auto">
          {/* AI Generation Panel */}
          <Card className="mb-3 border-2 border-purple-200 bg-gradient-to-b from-purple-50 to-white">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">AI Generate</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              {/* Preset Templates */}
              <div className="space-y-1 mb-3">
                <p className="text-[10px] font-medium text-muted-foreground px-1">Quick Presets</p>
                <div className="grid grid-cols-2 gap-1">
                  {presetTemplates.map((preset) => (
                    <Button
                      key={preset.id}
                      variant="outline"
                      size="sm"
                      className="h-auto py-1.5 px-2 flex flex-col items-center justify-center text-[10px] hover:bg-purple-50 hover:border-purple-300"
                      onClick={() => generateTemplate(preset.id)}
                      disabled={isGenerating}
                      title={preset.description}
                    >
                      <span className="text-base mb-0.5">{preset.icon}</span>
                      <span>{preset.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
              
              <Separator className="my-2" />
              
              {/* Free-form AI Prompt */}
              <div className="space-y-2">
                <p className="text-[10px] font-medium text-muted-foreground px-1 flex items-center gap-1">
                  <Wand2 className="w-3 h-3" />
                  Custom Prompt
                </p>
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe your template... e.g., 'Logo at top, test summary, parameters table, and signatures at bottom'"
                  className="text-xs h-16 resize-none"
                  disabled={isGenerating}
                />
                <Button
                  size="sm"
                  className="w-full h-7 text-xs bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  onClick={() => generateTemplate()}
                  disabled={isGenerating || !aiPrompt.trim()}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-3 h-3 mr-1" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Manual Elements Panel */}
          <Card className="sticky top-0">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Elements
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <div className="space-y-0.5">
                <p className="text-[10px] font-medium text-muted-foreground px-2 mb-0.5">Basic</p>
                <Button variant="ghost" size="sm" className="w-full justify-start h-7 text-xs" onClick={() => addElement('logo')}>
                  <ImageIcon className="w-3.5 h-3.5 mr-2 text-purple-600" />
                  Logo
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start h-7 text-xs" onClick={() => addElement('text')}>
                  <Type className="w-3.5 h-3.5 mr-2 text-gray-600" />
                  Text
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start h-7 text-xs" onClick={() => addElement('dynamic_field')}>
                  <FileText className="w-3.5 h-3.5 mr-2 text-orange-600" />
                  Dynamic Field
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start h-7 text-xs" onClick={() => addElement('table')}>
                  <Table className="w-3.5 h-3.5 mr-2 text-gray-600" />
                  Table
                </Button>
                
                <Separator className="my-1.5" />
                <p className="text-[10px] font-medium text-muted-foreground px-2 mb-0.5">Auto-Fill</p>
                
                <Button variant="ghost" size="sm" className="w-full justify-start h-7 text-xs bg-blue-50 hover:bg-blue-100" onClick={() => addElement('parameters_table')}>
                  <Table className="w-3.5 h-3.5 mr-2 text-blue-600" />
                  Parameters
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start h-7 text-xs bg-green-50 hover:bg-green-100" onClick={() => addElement('test_summary')}>
                  <FileText className="w-3.5 h-3.5 mr-2 text-green-600" />
                  Summary
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start h-7 text-xs bg-purple-50 hover:bg-purple-100" onClick={() => addElement('signature_block')}>
                  <FileText className="w-3.5 h-3.5 mr-2 text-purple-600" />
                  Signatures
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Builder Area - Center - Scrollable */}
        <div className={`${showPreview ? 'col-span-6' : 'col-span-10'} overflow-auto`}>
          <Card className="min-h-full">
            <CardHeader className="py-2 px-4 border-b sticky top-0 bg-background z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  Template Builder
                  <span className="ml-2 text-muted-foreground font-normal">({elements.length} elements)</span>
                </CardTitle>
                <Badge variant="outline" className="text-[10px]">
                  <GripVertical className="w-3 h-3 mr-1" />
                  Drag to reorder
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-2">
              {elements.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Click elements from left panel to add</p>
                  <p className="text-xs">Then drag to reorder</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={elements.map(el => el.element_id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {elements.map((element) => (
                      <SortableElement
                        key={element.element_id}
                        element={element}
                        onUpdate={updateElement}
                        onDelete={deleteElement}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Preview - Right Panel - Sticky */}
        {showPreview && (
          <div className="col-span-4 overflow-auto">
            <Card className="sticky top-0 border-2 border-dashed border-primary/30">
              <CardHeader className="py-2 px-4 border-b bg-primary/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" />
                    Live Preview
                  </CardTitle>
                  <Badge className="bg-primary/10 text-primary text-[10px]">Updates in real-time</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 bg-white max-h-[calc(100vh-280px)] overflow-auto">
                {/* Report Preview Container */}
                <div className="bg-white border shadow-sm rounded-lg p-6 min-h-[300px]" style={{ fontFamily: 'Arial, sans-serif' }}>
                  {/* Report Header */}
                  <div className="text-center mb-4 pb-3 border-b-2 border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800">{templateName || 'Report Template'}</h2>
                    <p className="text-xs text-gray-500">{testType ? `${testType.charAt(0).toUpperCase() + testType.slice(1)} Test Report` : 'Test Report'}</p>
                  </div>
                  
                  {/* Rendered Elements */}
                  {elements.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Add elements to see preview</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {elements.map((element) => (
                        <div key={element.element_id}>
                          {renderPreviewElement(element)}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Report Footer */}
                  <div className="mt-6 pt-3 border-t text-center text-[10px] text-gray-400">
                    Generated by DMS Insight • {new Date().toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
