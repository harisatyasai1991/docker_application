import React, { useState, useEffect, useCallback } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { 
  Plus, 
  Trash2, 
  Save, 
  X,
  Camera,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Search,
  Database,
  ArrowUp,
  ArrowDown,
  PlusCircle,
  GripVertical,
  ImagePlus,
  ListChecks,
  ClipboardList,
  ToggleLeft,
  ToggleRight,
  Hash,
  MessageSquare
} from 'lucide-react';
import { sopTemplateAPI } from '../services/api';
import { toast } from 'sonner';
import { MultipleReferenceImages } from './ReferenceImageUpload';

// Sortable Step Card Component for drag-and-drop
const SortableStepCard = ({ 
  step, 
  stepIndex, 
  stepsCount,
  expandedStep, 
  setExpandedStep,
  moveStepUp,
  moveStepDown,
  insertStepAfter,
  removeStep,
  updateStep,
  updateParameter,
  addParameter,
  removeParameter,
  updateStepReferenceImages,
  addChecklistItem,
  updateChecklistItem,
  removeChecklistItem,
  toggleStepType,
  steps,
  setSteps,
  parameterLibrary,
  librarySearchTerm,
  setLibrarySearchTerm,
  loadingLibrary,
  filteredLibraryParams,
  testId
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `step-${step.step_number}` });

  const stepType = step.step_type || 'standard';
  const isChecklist = stepType === 'checklist';

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`border-2 ${isDragging ? 'shadow-lg ring-2 ring-primary' : ''}`}>
        <CardHeader className="cursor-pointer" onClick={() => setExpandedStep(expandedStep === stepIndex ? null : stepIndex)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Drag Handle */}
              <div 
                {...attributes} 
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="w-5 h-5 text-gray-400" />
              </div>
              
              <div className="flex flex-col items-center space-y-1">
                {/* Move Up Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0"
                  disabled={stepIndex === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    moveStepUp(stepIndex);
                  }}
                  title="Move step up"
                >
                  <ArrowUp className={`w-3 h-3 ${stepIndex === 0 ? 'text-gray-300' : 'text-gray-500 hover:text-blue-600'}`} />
                </Button>
                
                {/* Step Number */}
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {step.step_number}
                </div>
                
                {/* Move Down Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0"
                  disabled={stepIndex === stepsCount - 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    moveStepDown(stepIndex);
                  }}
                  title="Move step down"
                >
                  <ArrowDown className={`w-3 h-3 ${stepIndex === stepsCount - 1 ? 'text-gray-300' : 'text-gray-500 hover:text-blue-600'}`} />
                </Button>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">
                    {step.title || `Step ${step.step_number}`}
                  </CardTitle>
                  {/* Step Type Badge */}
                  {isChecklist && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-[10px]">
                      <ListChecks className="w-3 h-3 mr-1" />
                      Checklist
                    </Badge>
                  )}
                </div>
                {!isChecklist && step.parameters && step.parameters.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.parameters.length} parameter(s)
                  </p>
                )}
                {isChecklist && step.checklist_items && step.checklist_items.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.checklist_items.length} checklist item(s)
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-1">
              {step.photo_required && (
                <Badge variant="outline" className="border-blue-500 text-blue-500 mr-2">
                  <Camera className="w-3 h-3 mr-1" />
                  Photo
                </Badge>
              )}
              {/* Insert Step After Button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  insertStepAfter(stepIndex);
                }}
                title={`Insert new step after Step ${step.step_number}`}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <PlusCircle className="w-4 h-4" />
              </Button>
              {/* Delete Step Button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  removeStep(stepIndex);
                }}
                title="Delete step"
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              {expandedStep === stepIndex ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        </CardHeader>

        {expandedStep === stepIndex && (
          <CardContent className="space-y-4 pt-0">
            {/* Step Type Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Step Type</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${!isChecklist ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
                  Standard
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1"
                  onClick={() => toggleStepType(stepIndex)}
                >
                  {isChecklist ? (
                    <ToggleRight className="w-8 h-8 text-purple-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                  )}
                </Button>
                <span className={`text-xs ${isChecklist ? 'font-semibold text-purple-600' : 'text-muted-foreground'}`}>
                  Checklist
                </span>
              </div>
            </div>

            <div>
              <Label>Step Title *</Label>
              <Input
                value={step.title}
                onChange={(e) => updateStep(stepIndex, 'title', e.target.value)}
                placeholder={isChecklist ? "e.g., Pre-Test Verification Checklist" : "e.g., Equipment Setup & Calibration"}
              />
            </div>

            <div>
              <Label>{isChecklist ? 'Instructions / Description' : 'Instructions *'}</Label>
              <Textarea
                value={step.instruction}
                onChange={(e) => updateStep(stepIndex, 'instruction', e.target.value)}
                placeholder={isChecklist ? "Brief description of this checklist (optional)" : "Detailed step-by-step instructions for the engineer"}
                rows={isChecklist ? 2 : 3}
              />
            </div>

            {/* Checklist Items Section - Only for checklist type */}
            {isChecklist && (
              <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50/50">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-purple-600" />
                    Checklist Items
                  </Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addChecklistItem(stepIndex)}
                    className="h-8 border-purple-300 text-purple-700 hover:bg-purple-100"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Item
                  </Button>
                </div>
                
                {step.checklist_items && step.checklist_items.length > 0 ? (
                  <div className="space-y-3">
                    {step.checklist_items.map((item, itemIndex) => (
                      <div key={item.id || itemIndex} className="p-3 bg-white rounded-lg border border-purple-200">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 space-y-2">
                            {/* Item Title */}
                            <Input
                              value={item.title}
                              onChange={(e) => updateChecklistItem(stepIndex, itemIndex, 'title', e.target.value)}
                              placeholder="Checklist item description (e.g., Verify oil level is adequate)"
                              className="text-sm"
                            />
                            
                            {/* Item Options Row */}
                            <div className="flex flex-wrap items-center gap-4 text-xs">
                              {/* Required Toggle */}
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <Checkbox
                                  checked={item.is_required}
                                  onCheckedChange={(checked) => updateChecklistItem(stepIndex, itemIndex, 'is_required', checked)}
                                  className="h-3.5 w-3.5"
                                />
                                <span className={item.is_required ? 'text-red-600 font-medium' : 'text-gray-500'}>Required</span>
                              </label>
                              
                              {/* Requires Value Toggle */}
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <Checkbox
                                  checked={item.requires_value}
                                  onCheckedChange={(checked) => updateChecklistItem(stepIndex, itemIndex, 'requires_value', checked)}
                                  className="h-3.5 w-3.5"
                                />
                                <Hash className="w-3 h-3" />
                                <span>Value Input</span>
                              </label>
                              
                              {/* Requires Photo Toggle */}
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <Checkbox
                                  checked={item.requires_photo}
                                  onCheckedChange={(checked) => updateChecklistItem(stepIndex, itemIndex, 'requires_photo', checked)}
                                  className="h-3.5 w-3.5"
                                />
                                <Camera className="w-3 h-3" />
                                <span>Photo</span>
                              </label>
                              
                              {/* Allows Comment Toggle */}
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <Checkbox
                                  checked={item.allows_comment}
                                  onCheckedChange={(checked) => updateChecklistItem(stepIndex, itemIndex, 'allows_comment', checked)}
                                  className="h-3.5 w-3.5"
                                />
                                <MessageSquare className="w-3 h-3" />
                                <span>Comment</span>
                              </label>
                            </div>
                            
                            {/* Value Config - Show if requires_value is true */}
                            {item.requires_value && (
                              <div className="flex gap-2 mt-2">
                                <Input
                                  value={item.value_label || ''}
                                  onChange={(e) => updateChecklistItem(stepIndex, itemIndex, 'value_label', e.target.value)}
                                  placeholder="Value label (e.g., Temperature)"
                                  className="text-xs h-7 flex-1"
                                />
                                <Input
                                  value={item.value_unit || ''}
                                  onChange={(e) => updateChecklistItem(stepIndex, itemIndex, 'value_unit', e.target.value)}
                                  placeholder="Unit (e.g., °C)"
                                  className="text-xs h-7 w-20"
                                />
                              </div>
                            )}
                          </div>
                          
                          {/* Delete Item Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeChecklistItem(stepIndex, itemIndex)}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border-2 border-dashed border-purple-200 rounded-lg">
                    <ListChecks className="w-8 h-8 mx-auto mb-2 text-purple-300" />
                    <p className="text-sm text-muted-foreground">No checklist items yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Click "Add Item" to create checklist items</p>
                  </div>
                )}
              </div>
            )}

            {/* Standard Step Fields - Only show for standard type */}
            {!isChecklist && (
              <>
                <div>
                  <Label>Safety Note</Label>
                  <Textarea
                    value={step.safety_note}
                    onChange={(e) => updateStep(stepIndex, 'safety_note', e.target.value)}
                    placeholder="Important safety information (optional)"
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Estimated Duration</Label>
                  <Input
                    value={step.estimated_duration}
                    onChange={(e) => updateStep(stepIndex, 'estimated_duration', e.target.value)}
                    placeholder="e.g., 10 minutes"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`photo-${stepIndex}`}
                    checked={step.photo_required}
                    onCheckedChange={(checked) => updateStep(stepIndex, 'photo_required', checked)}
                  />
                  <Label htmlFor={`photo-${stepIndex}`} className="cursor-pointer">
                    Step photo documentation required
                  </Label>
                </div>

                {/* Reference Images Section */}
                <div className="border rounded-lg p-4 bg-blue-50/50">
                  <Label className="text-sm font-semibold mb-2 block flex items-center gap-2">
                    <ImagePlus className="w-4 h-4 text-blue-600" />
                    Reference Images (max 5)
                  </Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Add reference images to help technicians understand this step
                  </p>
                  <MultipleReferenceImages
                    images={step.reference_images || []}
                onImagesChange={(images) => updateStepReferenceImages(stepIndex, images)}
                category="sop_step"
                testId={testId}
                maxImages={5}
              />
                </div>

                {/* Parameters - Two Column Layout */}
                <div className="border rounded-lg p-4 bg-gray-50/50">
                  <Label className="text-base font-semibold mb-3 block">Parameters to Record</Label>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Left: Added Parameters */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Added Parameters</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addParameter(stepIndex)}
                          className="h-7 text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Custom
                        </Button>
                      </div>
                      
                      {step.parameters && step.parameters.length > 0 ? (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                          {step.parameters.map((param, paramIndex) => (
                            <Card key={paramIndex} className="border bg-white">
                              <CardContent className="p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-xs font-semibold text-gray-600">#{paramIndex + 1}</h5>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                onClick={() => removeParameter(stepIndex, paramIndex)}
                              >
                                <Trash2 className="w-3 h-3 text-red-500" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <div className="col-span-2">
                                <Input
                                  value={param.parameter_name}
                                  onChange={(e) => updateParameter(stepIndex, paramIndex, 'parameter_name', e.target.value)}
                                  placeholder="Parameter Name"
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div>
                                <Input
                                  value={param.unit}
                                  onChange={(e) => updateParameter(stepIndex, paramIndex, 'unit', e.target.value)}
                                  placeholder="Unit"
                                  className="h-8 text-sm"
                                />
                              </div>
                            </div>
                            
                            <Input
                              value={param.expected_value}
                              onChange={(e) => updateParameter(stepIndex, paramIndex, 'expected_value', e.target.value)}
                              placeholder="Expected Value / Limit"
                              className="h-8 text-sm"
                            />

                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-1">
                                <Checkbox
                                  id={`req-${stepIndex}-${paramIndex}`}
                                  checked={param.is_required}
                                  onCheckedChange={(checked) => updateParameter(stepIndex, paramIndex, 'is_required', checked)}
                                />
                                <Label htmlFor={`req-${stepIndex}-${paramIndex}`} className="text-xs cursor-pointer">
                                  Required
                                </Label>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Checkbox
                                  id={`photo-${stepIndex}-${paramIndex}`}
                                  checked={param.photo_allowed}
                                  onCheckedChange={(checked) => updateParameter(stepIndex, paramIndex, 'photo_allowed', checked)}
                                />
                                <Label htmlFor={`photo-${stepIndex}-${paramIndex}`} className="text-xs cursor-pointer">
                                  Photo
                                </Label>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border-2 border-dashed rounded bg-white">
                      <Database className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">
                        No parameters added yet
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Right: Parameter Library */}
                <div className="border-l pl-4 lg:border-l lg:pl-4 border-t pt-4 lg:border-t-0 lg:pt-0">
                  <div className="flex items-center gap-2 mb-3">
                    <Database className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Parameter Library</span>
                  </div>
                  
                  {/* Search */}
                  <div className="relative mb-3">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={librarySearchTerm}
                      onChange={(e) => setLibrarySearchTerm(e.target.value)}
                      className="pl-7 h-8 text-sm"
                    />
                  </div>
                  
                  {/* Parameter List */}
                  <div className="space-y-1 max-h-[250px] overflow-y-auto">
                    {loadingLibrary ? (
                      <div className="py-4 text-center text-muted-foreground text-xs">
                        Loading...
                      </div>
                    ) : filteredLibraryParams.length > 0 ? (
                      filteredLibraryParams.map((param, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            // Add parameter directly to this step
                            const updatedSteps = [...steps];
                            if (!updatedSteps[stepIndex].parameters) {
                              updatedSteps[stepIndex].parameters = [];
                            }
                            const exists = updatedSteps[stepIndex].parameters.some(
                              p => p.parameter_name === param.name
                            );
                            if (exists) {
                              toast.info(`${param.name} already added`);
                              return;
                            }
                            updatedSteps[stepIndex].parameters.push({
                              parameter_name: param.name,
                              expected_value: param.limit || '',
                              unit: param.unit || '',
                              is_required: true,
                              photo_allowed: true
                            });
                            setSteps(updatedSteps);
                            toast.success(`Added "${param.name}"`);
                          }}
                          className="w-full text-left p-2 rounded text-xs border bg-white hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-800 truncate">{param.name}</span>
                            <Plus className="w-3 h-3 text-blue-600 flex-shrink-0" />
                          </div>
                          <div className="text-gray-500 text-[10px] mt-0.5 truncate">
                            {param.limit || 'As per spec'} {param.unit && `(${param.unit})`}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="py-4 text-center text-xs text-muted-foreground">
                        {librarySearchTerm ? 'No matches' : 'No parameters'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
                </div>
              </>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export const SOPBuilder = ({ currentSOP, onSave, onCancel, testInfo }) => {
  const [templateName, setTemplateName] = useState(currentSOP?.template_name || '');
  const [description, setDescription] = useState(currentSOP?.description || '');
  const [applicableAssetTypes, setApplicableAssetTypes] = useState(
    currentSOP?.applicable_asset_types || [testInfo?.asset_type || 'transformer']
  );
  // Initialize steps with default step_type if not present
  const initializeSteps = (steps) => {
    if (!steps || steps.length === 0) return [];
    return steps.map(step => ({
      ...step,
      step_type: step.step_type || 'standard',
      checklist_items: step.checklist_items || (step.step_type === 'checklist' ? [] : undefined),
      reference_images: step.reference_images || []
    }));
  };
  const [steps, setSteps] = useState(initializeSteps(currentSOP?.steps));
  const [expandedStep, setExpandedStep] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(currentSOP?.template_id || null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  
  // Parameter Library state
  const [parameterLibrary, setParameterLibrary] = useState([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [librarySearchTerm, setLibrarySearchTerm] = useState('');

  const assetTypes = [
    { value: 'transformer', label: 'Transformer' },
    { value: 'switchgear', label: 'Switchgear' },
    { value: 'motors', label: 'Motors' },
    { value: 'generators', label: 'Generators' },
    { value: 'cables', label: 'Cables' },
    { value: 'ups', label: 'UPS' }
  ];

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end for reordering steps
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      const oldIndex = steps.findIndex(step => `step-${step.step_number}` === active.id);
      const newIndex = steps.findIndex(step => `step-${step.step_number}` === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newSteps = arrayMove(steps, oldIndex, newIndex);
        // Renumber all steps
        newSteps.forEach((step, i) => {
          step.step_number = i + 1;
        });
        setSteps(newSteps);
        setExpandedStep(newIndex);
      }
    }
  };

  // Fetch available templates on mount
  React.useEffect(() => {
    loadAvailableTemplates();
  }, [testInfo?.asset_type]);

  const loadAvailableTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const templates = await sopTemplateAPI.getAll(testInfo?.asset_type);
      setAvailableTemplates(templates);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load SOP templates');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Load parameter library for the current asset type
  const loadParameterLibrary = useCallback(async () => {
    setLoadingLibrary(true);
    try {
      const apiUrl = process.env.REACT_APP_BACKEND_URL || '';
      const assetType = testInfo?.asset_type || applicableAssetTypes[0] || 'transformer';
      const response = await fetch(`${apiUrl}/api/test-parameters/${assetType}`);
      const data = await response.json();
      setParameterLibrary(data.parameters || []);
    } catch (error) {
      console.error('Failed to load parameter library:', error);
      toast.error('Failed to load parameter library');
    } finally {
      setLoadingLibrary(false);
    }
  }, [testInfo?.asset_type, applicableAssetTypes]);

  // Load parameter library when asset type changes
  useEffect(() => {
    if (testInfo?.asset_type || applicableAssetTypes.length > 0) {
      loadParameterLibrary();
    }
  }, [testInfo?.asset_type, applicableAssetTypes, loadParameterLibrary]);

  // Filter parameters based on search term
  const filteredLibraryParams = parameterLibrary.filter(param =>
    param.name?.toLowerCase().includes(librarySearchTerm.toLowerCase()) ||
    param.category?.toLowerCase().includes(librarySearchTerm.toLowerCase()) ||
    param.unit?.toLowerCase().includes(librarySearchTerm.toLowerCase())
  );

  // Save new parameters to library when saving template
  const saveParametersToLibrary = async (templateSteps) => {
    try {
      const apiUrl = process.env.REACT_APP_BACKEND_URL || '';
      const assetType = testInfo?.asset_type || applicableAssetTypes[0] || 'general';
      
      // Collect all parameters from all steps
      const allParams = [];
      templateSteps.forEach(step => {
        (step.parameters || []).forEach(param => {
          if (param.parameter_name && !allParams.some(p => p.parameter_name === param.parameter_name)) {
            allParams.push(param);
          }
        });
      });
      
      if (allParams.length === 0) return;
      
      // Send to bulk add endpoint
      await fetch(`${apiUrl}/api/test-parameters/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_type: assetType,
          parameters: allParams
        })
      });
      
      // Refresh library after saving
      loadParameterLibrary();
    } catch (error) {
      console.error('Failed to save parameters to library:', error);
      // Don't show error to user - this is a background operation
    }
  };

  // Load template into editor
  const loadTemplate = async (templateId) => {
    try {
      const template = await sopTemplateAPI.getById(templateId);
      setTemplateName(template.template_name);
      setDescription(template.description);
      setApplicableAssetTypes(template.applicable_asset_types);
      setSteps(template.steps);
      setSelectedTemplateId(template.template_id);
      setShowTemplateSelector(false);
      toast.success(`Template "${template.template_name}" loaded`);
    } catch (error) {
      console.error('Failed to load template:', error);
      toast.error('Failed to load template');
    }
  };

  // Add new step at the end
  const addStep = (stepType = 'standard') => {
    const newStep = {
      step_number: steps.length + 1,
      step_type: stepType, // 'standard' or 'checklist'
      title: '',
      instruction: '',
      safety_note: '',
      parameters: [],
      photo_required: false,
      estimated_duration: '10 minutes',
      reference_images: [],
      // Checklist-specific fields
      checklist_items: stepType === 'checklist' ? [] : undefined
    };
    setSteps([...steps, newStep]);
    setExpandedStep(steps.length);
  };

  // Insert a new step after a specific index
  const insertStepAfter = (index, stepType = 'standard') => {
    const newStep = {
      step_number: index + 2, // Will be renumbered
      step_type: stepType,
      title: '',
      instruction: '',
      safety_note: '',
      parameters: [],
      photo_required: false,
      estimated_duration: '10 minutes',
      reference_images: [],
      checklist_items: stepType === 'checklist' ? [] : undefined
    };
    
    const updatedSteps = [
      ...steps.slice(0, index + 1),
      newStep,
      ...steps.slice(index + 1)
    ];
    
    // Renumber all steps
    updatedSteps.forEach((step, i) => {
      step.step_number = i + 1;
    });
    
    setSteps(updatedSteps);
    setExpandedStep(index + 1); // Expand the newly inserted step
    toast.success(`New step inserted after Step ${index + 1}`);
  };

  // Move step up (decrease index)
  const moveStepUp = (index) => {
    if (index === 0) return; // Already at top
    
    const updatedSteps = [...steps];
    const temp = updatedSteps[index];
    updatedSteps[index] = updatedSteps[index - 1];
    updatedSteps[index - 1] = temp;
    
    // Renumber all steps
    updatedSteps.forEach((step, i) => {
      step.step_number = i + 1;
    });
    
    setSteps(updatedSteps);
    setExpandedStep(index - 1); // Keep the moved step expanded
  };

  // Move step down (increase index)
  const moveStepDown = (index) => {
    if (index === steps.length - 1) return; // Already at bottom
    
    const updatedSteps = [...steps];
    const temp = updatedSteps[index];
    updatedSteps[index] = updatedSteps[index + 1];
    updatedSteps[index + 1] = temp;
    
    // Renumber all steps
    updatedSteps.forEach((step, i) => {
      step.step_number = i + 1;
    });
    
    setSteps(updatedSteps);
    setExpandedStep(index + 1); // Keep the moved step expanded
  };

  // Remove step
  const removeStep = (index) => {
    const updatedSteps = steps.filter((_, i) => i !== index);
    // Renumber steps
    updatedSteps.forEach((step, i) => {
      step.step_number = i + 1;
    });
    setSteps(updatedSteps);
    if (expandedStep === index) {
      setExpandedStep(null);
    } else if (expandedStep > index) {
      setExpandedStep(expandedStep - 1);
    }
  };

  // Update step field
  const updateStep = (index, field, value) => {
    const updatedSteps = [...steps];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    setSteps(updatedSteps);
  };

  // Add parameter to step
  const addParameter = (stepIndex) => {
    const updatedSteps = [...steps];
    if (!updatedSteps[stepIndex].parameters) {
      updatedSteps[stepIndex].parameters = [];
    }
    updatedSteps[stepIndex].parameters.push({
      parameter_name: '',
      expected_value: '',
      unit: '',
      is_required: true,
      photo_allowed: true
    });
    setSteps(updatedSteps);
  };

  // Remove parameter
  const removeParameter = (stepIndex, paramIndex) => {
    const updatedSteps = [...steps];
    updatedSteps[stepIndex].parameters = updatedSteps[stepIndex].parameters.filter((_, i) => i !== paramIndex);
    setSteps(updatedSteps);
  };

  // Update parameter
  const updateParameter = (stepIndex, paramIndex, field, value) => {
    const updatedSteps = [...steps];
    updatedSteps[stepIndex].parameters[paramIndex] = {
      ...updatedSteps[stepIndex].parameters[paramIndex],
      [field]: value
    };
    setSteps(updatedSteps);
  };

  // Update step reference images
  const updateStepReferenceImages = (stepIndex, images) => {
    const updatedSteps = [...steps];
    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex],
      reference_images: images
    };
    setSteps(updatedSteps);
  };

  // Add checklist item to a step
  const addChecklistItem = (stepIndex) => {
    const updatedSteps = [...steps];
    if (!updatedSteps[stepIndex].checklist_items) {
      updatedSteps[stepIndex].checklist_items = [];
    }
    updatedSteps[stepIndex].checklist_items.push({
      id: Date.now().toString(),
      title: '',
      is_required: true,
      requires_value: false,
      value_label: '',
      value_unit: '',
      requires_photo: false,
      allows_comment: true
    });
    setSteps(updatedSteps);
  };

  // Update checklist item
  const updateChecklistItem = (stepIndex, itemIndex, field, value) => {
    const updatedSteps = [...steps];
    updatedSteps[stepIndex].checklist_items[itemIndex] = {
      ...updatedSteps[stepIndex].checklist_items[itemIndex],
      [field]: value
    };
    setSteps(updatedSteps);
  };

  // Remove checklist item
  const removeChecklistItem = (stepIndex, itemIndex) => {
    const updatedSteps = [...steps];
    updatedSteps[stepIndex].checklist_items.splice(itemIndex, 1);
    setSteps(updatedSteps);
  };

  // Toggle step type between standard and checklist
  const toggleStepType = (stepIndex) => {
    const updatedSteps = [...steps];
    const currentType = updatedSteps[stepIndex].step_type || 'standard';
    const newType = currentType === 'standard' ? 'checklist' : 'standard';
    
    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex],
      step_type: newType,
      checklist_items: newType === 'checklist' ? [] : undefined
    };
    setSteps(updatedSteps);
  };

  // Toggle asset type
  const toggleAssetType = (assetType) => {
    if (applicableAssetTypes.includes(assetType)) {
      setApplicableAssetTypes(applicableAssetTypes.filter(t => t !== assetType));
    } else {
      setApplicableAssetTypes([...applicableAssetTypes, assetType]);
    }
  };

  // Save SOP Template
  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter template name');
      return;
    }

    if (steps.length === 0) {
      toast.error('Please add at least one step');
      return;
    }

    // Validate steps
    for (let i = 0; i < steps.length; i++) {
      if (!steps[i].title.trim()) {
        toast.error(`Step ${i + 1}: Please enter title`);
        return;
      }
      // Only require instruction for standard steps
      const stepType = steps[i].step_type || 'standard';
      if (stepType === 'standard' && !steps[i].instruction?.trim()) {
        toast.error(`Step ${i + 1}: Please enter instruction`);
        return;
      }
      // For checklist steps, require at least one item
      if (stepType === 'checklist' && (!steps[i].checklist_items || steps[i].checklist_items.length === 0)) {
        toast.error(`Step ${i + 1}: Please add at least one checklist item`);
        return;
      }
    }

    setIsSaving(true);
    try {
      // Create completely new clean objects - do NOT spread or copy from original steps
      // This ensures no dnd-kit sensors or DOM references are carried over
      const cleanSteps = [];
      
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepType = step.step_type || 'standard';
        
        // Build clean parameters array
        const cleanParams = [];
        if (step.parameters && Array.isArray(step.parameters)) {
          for (const p of step.parameters) {
            cleanParams.push({
              parameter_name: String(p.parameter_name || ''),
              expected_value: String(p.expected_value || ''),
              unit: String(p.unit || ''),
              is_required: p.is_required === true,
              photo_allowed: p.photo_allowed === true
            });
          }
        }
        
        // Build clean reference images array
        const cleanRefImages = [];
        if (step.reference_images && Array.isArray(step.reference_images)) {
          for (const img of step.reference_images) {
            if (typeof img === 'string') {
              cleanRefImages.push(img);
            }
          }
        }
        
        // Build the clean step object with only primitive values
        const cleanStep = {
          step_number: i + 1,
          step_type: String(stepType),
          title: String(step.title || ''),
          instruction: String(step.instruction || ''),
          safety_note: String(step.safety_note || ''),
          estimated_duration: String(step.estimated_duration || '10 minutes'),
          photo_required: step.photo_required === true,
          reference_images: cleanRefImages,
          parameters: cleanParams
        };
        
        // Only add checklist_items for checklist type steps
        if (stepType === 'checklist' && step.checklist_items && Array.isArray(step.checklist_items)) {
          const cleanChecklistItems = [];
          for (const item of step.checklist_items) {
            cleanChecklistItems.push({
              id: String(item.id || String(Date.now())),
              title: String(item.title || ''),
              is_required: item.is_required === true,
              requires_value: item.requires_value === true,
              value_label: String(item.value_label || ''),
              value_unit: String(item.value_unit || ''),
              requires_photo: item.requires_photo === true,
              allows_comment: item.allows_comment !== false
            });
          }
          cleanStep.checklist_items = cleanChecklistItems;
        }
        
        cleanSteps.push(cleanStep);
      }

      // Build the template data with only clean, primitive values
      const safeTemplateData = {
        template_name: String(templateName),
        description: String(description || 'No description provided'),
        applicable_asset_types: applicableAssetTypes.map(t => String(t)),
        steps: cleanSteps,
        created_by: 'Current User'
      };
      
      // Final verification - this should never fail now
      try {
        JSON.stringify(safeTemplateData);
      } catch (jsonError) {
        console.error('JSON serialization still failed:', jsonError);
        console.error('Template data:', safeTemplateData);
        toast.error('Error preparing template data. Please contact support.');
        setIsSaving(false);
        return;
      }

      let savedTemplate;
      if (currentSOP?.template_id) {
        // Update existing
        savedTemplate = await sopTemplateAPI.update(currentSOP.template_id, safeTemplateData);
        toast.success('SOP template updated successfully');
      } else {
        // Create new
        savedTemplate = await sopTemplateAPI.create(safeTemplateData);
        toast.success('SOP template created successfully');
      }

      // Save any new parameters to the library for future use (use cleanSteps not steps)
      await saveParametersToLibrary(cleanSteps);

      onSave && onSave(savedTemplate);
    } catch (error) {
      const errorMessage = error?.message || error?.response?.data?.detail || 'Failed to save template';
      toast.error(`Failed to save template: ${errorMessage}`);
      console.error('Save template error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Selector */}
      <Card className="border-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Load Existing Template</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Select from {availableTemplates.length} available templates or create new
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplateSelector(!showTemplateSelector)}
            >
              {showTemplateSelector ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Hide Templates
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Browse Templates
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        
        {showTemplateSelector && (
          <CardContent>
            {isLoadingTemplates ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading templates...
              </div>
            ) : availableTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableTemplates.map(template => (
                  <Card
                    key={template.template_id}
                    className={`cursor-pointer transition hover:shadow-md ${
                      selectedTemplateId === template.template_id
                        ? 'border-primary border-2 bg-primary/5'
                        : 'border-border'
                    }`}
                    onClick={() => loadTemplate(template.template_id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm">{template.template_name}</h4>
                        {selectedTemplateId === template.template_id && (
                          <Badge variant="default" className="ml-2">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {template.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {template.steps?.length || 0} steps
                        </span>
                        <div className="flex gap-1">
                          {template.applicable_asset_types?.slice(0, 2).map(type => (
                            <Badge key={type} variant="outline" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground mb-2">No templates available</p>
                <p className="text-xs text-muted-foreground">
                  Create your first template below
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Template Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>SOP Template Information</CardTitle>
            <div className="flex items-center space-x-2">
              {selectedTemplateId && (
                <>
                  <Badge variant="outline" className="border-blue-500 text-blue-600">
                    Editing: {templateName}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTemplateName('');
                      setDescription('');
                      setSteps([]);
                      setSelectedTemplateId(null);
                      toast.info('Starting new template');
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="templateName">Template Name *</Label>
            <Input
              id="templateName"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Standard Transformer Winding Resistance Test"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this SOP template"
              rows={2}
            />
          </div>

          <div>
            <Label>Applicable Asset Types *</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {assetTypes.map(type => (
                <div
                  key={type.value}
                  onClick={() => toggleAssetType(type.value)}
                  className={`px-3 py-1 rounded border cursor-pointer transition ${
                    applicableAssetTypes.includes(type.value)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  {type.label}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">SOP Steps ({steps.length})</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Drag steps to reorder or use arrow buttons
            </p>
          </div>
          <Button onClick={addStep} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Step
          </Button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={steps.map(s => `step-${s.step_number}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {steps.map((step, stepIndex) => (
                <SortableStepCard
                  key={`step-${step.step_number}`}
                  step={step}
                  stepIndex={stepIndex}
                  stepsCount={steps.length}
                  expandedStep={expandedStep}
                  setExpandedStep={setExpandedStep}
                  moveStepUp={moveStepUp}
                  moveStepDown={moveStepDown}
                  insertStepAfter={insertStepAfter}
                  removeStep={removeStep}
                  updateStep={updateStep}
                  updateParameter={updateParameter}
                  addParameter={addParameter}
                  removeParameter={removeParameter}
                  updateStepReferenceImages={updateStepReferenceImages}
                  addChecklistItem={addChecklistItem}
                  updateChecklistItem={updateChecklistItem}
                  removeChecklistItem={removeChecklistItem}
                  toggleStepType={toggleStepType}
                  steps={steps}
                  setSteps={setSteps}
                  parameterLibrary={parameterLibrary}
                  librarySearchTerm={librarySearchTerm}
                  setLibrarySearchTerm={setLibrarySearchTerm}
                  loadingLibrary={loadingLibrary}
                  filteredLibraryParams={filteredLibraryParams}
                  testId={testInfo?.test_id || ''}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {steps.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <GripVertical className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No steps added yet</p>
              <Button onClick={addStep}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Step
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : currentSOP ? 'Update Template' : 'Save Template'}
        </Button>
      </div>
    </div>
  );
};
