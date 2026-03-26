import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '../components/ui/command';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Edit,
  Settings,
  Plus,
  Trash2,
  FlaskConical,
  Crown,
  Check,
  ChevronsUpDown,
  Filter,
  Search,
  X,
  FileText,
  ChevronDown,
  ChevronUp,
  Camera,
  Copy,
  ListOrdered,
  GripVertical,
  ImagePlus,
  ArrowUp,
  ArrowDown,
  PlusCircle,
  ListChecks,
  ClipboardList,
  ToggleLeft,
  ToggleRight,
  Hash,
  MessageSquare,
  Globe,
  Building2,
  Download,
  Upload,
  FileJson,
  Package,
  Archive,
  ArchiveRestore,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { testsAPI, assetTypeAPI, reportTemplateAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { ReferenceImageUpload, MultipleReferenceImages } from '../components/ReferenceImageUpload';
import { TestModeBadge, TestModeSelector } from '../components/TestModeBadge';
import { MultiLevelLimitsEditor, MultiLevelLimitsDisplay } from '../components/MultiLevelLimitsEditor';
import { TestScopeBadge } from '../components/TestScopeBadge';
import { DisplayConfigEditor } from '../components/DisplayConfigEditor';
import { AITemplateGenerator } from '../components/AITemplateGenerator';

// Sortable Step Card Component for Edit Dialog
const SortableEditStepCard = ({ 
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
  updateStepParameter,
  addStepParameter,
  removeStepParameter,
  updateStepReferenceImages,
  toggleStepType,
  addChecklistItem,
  updateChecklistItem,
  removeChecklistItem,
  selectedTest
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `edit-step-${step.step_number}` });

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
      <Card className={`border-amber-200 ${isDragging ? 'shadow-lg ring-2 ring-amber-400' : ''}`}>
        <CardHeader className="py-2 px-3 cursor-pointer hover:bg-amber-50" onClick={() => setExpandedStep(expandedStep === stepIndex ? null : stepIndex)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Drag Handle */}
              <div 
                {...attributes} 
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-amber-100 rounded"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="w-4 h-4 text-amber-600" />
              </div>
              
              {/* Move Up/Down and Step Number */}
              <div className="flex flex-col items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  disabled={stepIndex === 0}
                  onClick={(e) => { e.stopPropagation(); moveStepUp(stepIndex); }}
                  title="Move step up"
                >
                  <ArrowUp className={`w-3 h-3 ${stepIndex === 0 ? 'text-gray-300' : 'text-gray-500 hover:text-blue-600'}`} />
                </Button>
                <Badge variant="outline" className="bg-amber-100 text-amber-800">
                  {step.step_number}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  disabled={stepIndex === stepsCount - 1}
                  onClick={(e) => { e.stopPropagation(); moveStepDown(stepIndex); }}
                  title="Move step down"
                >
                  <ArrowDown className={`w-3 h-3 ${stepIndex === stepsCount - 1 ? 'text-gray-300' : 'text-gray-500 hover:text-blue-600'}`} />
                </Button>
              </div>
              <span className="font-medium text-sm">{step.title || 'Untitled Step'}</span>
              {/* Step Type Badge */}
              {isChecklist && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-[10px]">
                  <ListChecks className="w-3 h-3 mr-1" />
                  Checklist
                </Badge>
              )}
              {step.photo_required && <Camera className="w-4 h-4 text-blue-500" />}
              {!isChecklist && step.parameters?.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {step.parameters.length} params
                </Badge>
              )}
              {isChecklist && step.checklist_items?.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {step.checklist_items.length} items
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {/* Insert After Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); insertStepAfter(stepIndex); }}
                className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                title={`Insert new step after Step ${step.step_number}`}
              >
                <PlusCircle className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); removeStep(stepIndex); }}
                className="h-6 w-6 p-0"
              >
                <Trash2 className="w-3 h-3 text-red-500" />
              </Button>
              {expandedStep === stepIndex ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </CardHeader>
        
        {expandedStep === stepIndex && (
          <CardContent className="pt-0 pb-3 px-3 space-y-3">
            {/* Step Type Toggle */}
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium">Step Type</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${!isChecklist ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
                  Standard
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1"
                  onClick={(e) => { e.stopPropagation(); toggleStepType(stepIndex); }}
                >
                  {isChecklist ? (
                    <ToggleRight className="w-6 h-6 text-purple-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-gray-400" />
                  )}
                </Button>
                <span className={`text-xs ${isChecklist ? 'font-semibold text-purple-600' : 'text-muted-foreground'}`}>
                  Checklist
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Step Title *</Label>
                <Input
                  value={step.title}
                  onChange={(e) => updateStep(stepIndex, 'title', e.target.value)}
                  placeholder={isChecklist ? "e.g., Pre-Test Checklist" : "e.g., Connect Test Leads"}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Estimated Duration</Label>
                <Input
                  value={step.estimated_duration}
                  onChange={(e) => updateStep(stepIndex, 'estimated_duration', e.target.value)}
                  placeholder="e.g., 10 minutes"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-xs">{isChecklist ? 'Instructions / Description (Optional)' : 'Instructions'}</Label>
              <textarea
                value={step.instruction}
                onChange={(e) => updateStep(stepIndex, 'instruction', e.target.value)}
                placeholder={isChecklist ? "Brief description of this checklist" : "Detailed instructions for this step..."}
                className="w-full min-h-[60px] text-sm p-2 border rounded-md"
              />
            </div>

            {/* Checklist Items Section - Only for checklist type */}
            {isChecklist && (
              <div className="border-2 border-purple-200 rounded-lg p-3 bg-purple-50/50">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-purple-600" />
                    Checklist Items
                  </Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); addChecklistItem(stepIndex); }}
                    className="h-7 text-xs border-purple-300 text-purple-700 hover:bg-purple-100"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Item
                  </Button>
                </div>
                
                {step.checklist_items && step.checklist_items.length > 0 ? (
                  <div className="space-y-2">
                    {step.checklist_items.map((item, itemIndex) => (
                      <div key={item.id || itemIndex} className="p-2 bg-white rounded border border-purple-200">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 space-y-2">
                            <Input
                              value={item.title}
                              onChange={(e) => updateChecklistItem(stepIndex, itemIndex, 'title', e.target.value)}
                              placeholder="Checklist item description"
                              className="text-xs h-7"
                            />
                            <div className="flex flex-wrap items-center gap-3 text-[10px]">
                              <label className="flex items-center gap-1 cursor-pointer">
                                <Checkbox
                                  checked={item.is_required}
                                  onCheckedChange={(checked) => updateChecklistItem(stepIndex, itemIndex, 'is_required', checked)}
                                  className="h-3 w-3"
                                />
                                <span className={item.is_required ? 'text-red-600 font-medium' : 'text-gray-500'}>Required</span>
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer">
                                <Checkbox
                                  checked={item.requires_value}
                                  onCheckedChange={(checked) => updateChecklistItem(stepIndex, itemIndex, 'requires_value', checked)}
                                  className="h-3 w-3"
                                />
                                <Hash className="w-3 h-3" />
                                <span>Value</span>
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer">
                                <Checkbox
                                  checked={item.requires_photo}
                                  onCheckedChange={(checked) => updateChecklistItem(stepIndex, itemIndex, 'requires_photo', checked)}
                                  className="h-3 w-3"
                                />
                                <Camera className="w-3 h-3" />
                                <span>Photo</span>
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer">
                                <Checkbox
                                  checked={item.allows_comment}
                                  onCheckedChange={(checked) => updateChecklistItem(stepIndex, itemIndex, 'allows_comment', checked)}
                                  className="h-3 w-3"
                                />
                                <MessageSquare className="w-3 h-3" />
                                <span>Comment</span>
                              </label>
                            </div>
                            {item.requires_value && (
                              <div className="flex gap-2">
                                <Input
                                  value={item.value_label || ''}
                                  onChange={(e) => updateChecklistItem(stepIndex, itemIndex, 'value_label', e.target.value)}
                                  placeholder="Value label"
                                  className="text-xs h-6 flex-1"
                                />
                                <Input
                                  value={item.value_unit || ''}
                                  onChange={(e) => updateChecklistItem(stepIndex, itemIndex, 'value_unit', e.target.value)}
                                  placeholder="Unit"
                                  className="text-xs h-6 w-16"
                                />
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); removeChecklistItem(stepIndex, itemIndex); }}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 border-2 border-dashed border-purple-200 rounded">
                    <ListChecks className="w-6 h-6 mx-auto mb-1 text-purple-300" />
                    <p className="text-xs text-muted-foreground">No checklist items yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Standard Step Fields - Only show for standard type */}
            {!isChecklist && (
              <>
                <div>
                  <Label className="text-xs">Safety Note</Label>
                  <Input
                    value={step.safety_note}
                    onChange={(e) => updateStep(stepIndex, 'safety_note', e.target.value)}
                    placeholder="Any safety warnings for this step"
                    className="h-8 text-sm"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={step.photo_required}
                      onChange={(e) => updateStep(stepIndex, 'photo_required', e.target.checked)}
                      className="rounded"
                    />
                    <Camera className="w-4 h-4" />
                    Photo Required
                  </label>
                </div>
                
                {/* Reference Images */}
                <div className="border-t pt-3 mt-3">
                  <Label className="text-xs font-medium flex items-center gap-2 mb-2">
                    <ImagePlus className="w-3 h-3" />
                    Reference Images (max 5)
                  </Label>
                  <MultipleReferenceImages
                    images={step.reference_images || []}
                    onImagesChange={(images) => updateStepReferenceImages(stepIndex, images)}
                    category="sop_step"
                    testId={selectedTest?.test_id}
                    maxImages={5}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Add reference images to help technicians understand this step
                  </p>
                </div>
                
                {/* Step Parameters */}
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-medium">Step Parameters</Label>
                    <Button
                      onClick={() => addStepParameter(stepIndex)}
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Parameter
                    </Button>
                  </div>
                  {step.parameters?.map((param, paramIndex) => (
                    <div key={paramIndex} className="flex gap-2 mb-2">
                      <Input
                        value={param.parameter_name}
                        onChange={(e) => updateStepParameter(stepIndex, paramIndex, 'parameter_name', e.target.value)}
                        placeholder="Parameter name"
                        className="h-7 text-xs flex-1"
                      />
                      <Input
                        value={param.expected_value}
                        onChange={(e) => updateStepParameter(stepIndex, paramIndex, 'expected_value', e.target.value)}
                        placeholder="Expected value"
                        className="h-7 text-xs w-24"
                      />
                      <Input
                        value={param.unit}
                        onChange={(e) => updateStepParameter(stepIndex, paramIndex, 'unit', e.target.value)}
                        placeholder="Unit"
                        className="h-7 text-xs w-16"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStepParameter(stepIndex, paramIndex)}
                        className="h-7 w-7 p-0"
                      >
                        <X className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  {(!step.parameters || step.parameters.length === 0) && (
                    <p className="text-xs text-muted-foreground italic">No parameters added yet</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};

// Sortable Step Card Component for Create Dialog
const SortableCreateStepCard = ({ 
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
  updateStepParameter,
  addStepParameter,
  removeStepParameter,
  updateStepReferenceImages,
  toggleStepType,
  addChecklistItem,
  updateChecklistItem,
  removeChecklistItem
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `create-step-${step.step_number}` });

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
      <Card className={`border-amber-200 ${isDragging ? 'shadow-lg ring-2 ring-amber-400' : ''}`}>
        <CardHeader className="py-2 px-3 cursor-pointer hover:bg-amber-50" onClick={() => setExpandedStep(expandedStep === stepIndex ? null : stepIndex)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Drag Handle */}
              <div 
                {...attributes} 
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-amber-100 rounded"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="w-4 h-4 text-amber-600" />
              </div>
              
              {/* Move Up/Down and Step Number */}
              <div className="flex flex-col items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  disabled={stepIndex === 0}
                  onClick={(e) => { e.stopPropagation(); moveStepUp(stepIndex); }}
                  title="Move step up"
                  type="button"
                >
                  <ArrowUp className={`w-3 h-3 ${stepIndex === 0 ? 'text-gray-300' : 'text-gray-500 hover:text-blue-600'}`} />
                </Button>
                <Badge variant="outline" className="bg-amber-100 text-amber-800">
                  {step.step_number}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  disabled={stepIndex === stepsCount - 1}
                  onClick={(e) => { e.stopPropagation(); moveStepDown(stepIndex); }}
                  title="Move step down"
                  type="button"
                >
                  <ArrowDown className={`w-3 h-3 ${stepIndex === stepsCount - 1 ? 'text-gray-300' : 'text-gray-500 hover:text-blue-600'}`} />
                </Button>
              </div>
              <span className="font-medium text-sm">{step.title || 'Untitled Step'}</span>
              {/* Step Type Badge */}
              {isChecklist && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-[10px]">
                  <ListChecks className="w-3 h-3 mr-1" />
                  Checklist
                </Badge>
              )}
              {step.photo_required && <Camera className="w-4 h-4 text-blue-500" />}
              {!isChecklist && step.parameters?.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {step.parameters.length} params
                </Badge>
              )}
              {isChecklist && step.checklist_items?.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {step.checklist_items.length} items
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {/* Insert After Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); insertStepAfter(stepIndex); }}
                className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                title={`Insert new step after Step ${step.step_number}`}
                type="button"
              >
                <PlusCircle className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); removeStep(stepIndex); }}
                className="h-6 w-6 p-0"
                type="button"
              >
                <Trash2 className="w-3 h-3 text-red-500" />
              </Button>
              {expandedStep === stepIndex ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </CardHeader>
        
        {expandedStep === stepIndex && (
          <CardContent className="pt-0 pb-3 px-3 space-y-3">
            {/* Step Type Toggle */}
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium">Step Type</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${!isChecklist ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
                  Standard
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1"
                  onClick={(e) => { e.stopPropagation(); toggleStepType(stepIndex); }}
                  type="button"
                >
                  {isChecklist ? (
                    <ToggleRight className="w-6 h-6 text-purple-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-gray-400" />
                  )}
                </Button>
                <span className={`text-xs ${isChecklist ? 'font-semibold text-purple-600' : 'text-muted-foreground'}`}>
                  Checklist
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Step Title *</Label>
                <Input
                  value={step.title}
                  onChange={(e) => updateStep(stepIndex, 'title', e.target.value)}
                  placeholder={isChecklist ? "e.g., Pre-Test Checklist" : "e.g., Connect Test Leads"}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Estimated Duration</Label>
                <Input
                  value={step.estimated_duration}
                  onChange={(e) => updateStep(stepIndex, 'estimated_duration', e.target.value)}
                  placeholder="e.g., 10 minutes"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-xs">{isChecklist ? 'Instructions / Description (Optional)' : 'Instructions'}</Label>
              <textarea
                value={step.instruction}
                onChange={(e) => updateStep(stepIndex, 'instruction', e.target.value)}
                placeholder={isChecklist ? "Brief description of this checklist" : "Detailed instructions for this step..."}
                className="w-full min-h-[60px] text-sm p-2 border rounded-md"
              />
            </div>

            {/* Checklist Items Section - Only for checklist type */}
            {isChecklist && (
              <div className="border-2 border-purple-200 rounded-lg p-3 bg-purple-50/50">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-purple-600" />
                    Checklist Items
                  </Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); addChecklistItem(stepIndex); }}
                    className="h-7 text-xs border-purple-300 text-purple-700 hover:bg-purple-100"
                    type="button"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Item
                  </Button>
                </div>
                
                {step.checklist_items && step.checklist_items.length > 0 ? (
                  <div className="space-y-2">
                    {step.checklist_items.map((item, itemIndex) => (
                      <div key={item.id || itemIndex} className="p-2 bg-white rounded border border-purple-200">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 space-y-2">
                            <Input
                              value={item.title}
                              onChange={(e) => updateChecklistItem(stepIndex, itemIndex, 'title', e.target.value)}
                              placeholder="Checklist item description"
                              className="text-xs h-7"
                            />
                            <div className="flex flex-wrap items-center gap-3 text-[10px]">
                              <label className="flex items-center gap-1 cursor-pointer">
                                <Checkbox
                                  checked={item.is_required}
                                  onCheckedChange={(checked) => updateChecklistItem(stepIndex, itemIndex, 'is_required', checked)}
                                  className="h-3 w-3"
                                />
                                <span className={item.is_required ? 'text-red-600 font-medium' : 'text-gray-500'}>Required</span>
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer">
                                <Checkbox
                                  checked={item.requires_value}
                                  onCheckedChange={(checked) => updateChecklistItem(stepIndex, itemIndex, 'requires_value', checked)}
                                  className="h-3 w-3"
                                />
                                <Hash className="w-3 h-3" />
                                <span>Value</span>
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer">
                                <Checkbox
                                  checked={item.requires_photo}
                                  onCheckedChange={(checked) => updateChecklistItem(stepIndex, itemIndex, 'requires_photo', checked)}
                                  className="h-3 w-3"
                                />
                                <Camera className="w-3 h-3" />
                                <span>Photo</span>
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer">
                                <Checkbox
                                  checked={item.allows_comment}
                                  onCheckedChange={(checked) => updateChecklistItem(stepIndex, itemIndex, 'allows_comment', checked)}
                                  className="h-3 w-3"
                                />
                                <MessageSquare className="w-3 h-3" />
                                <span>Comment</span>
                              </label>
                            </div>
                            {item.requires_value && (
                              <div className="flex gap-2">
                                <Input
                                  value={item.value_label || ''}
                                  onChange={(e) => updateChecklistItem(stepIndex, itemIndex, 'value_label', e.target.value)}
                                  placeholder="Value label"
                                  className="text-xs h-6 flex-1"
                                />
                                <Input
                                  value={item.value_unit || ''}
                                  onChange={(e) => updateChecklistItem(stepIndex, itemIndex, 'value_unit', e.target.value)}
                                  placeholder="Unit"
                                  className="text-xs h-6 w-16"
                                />
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); removeChecklistItem(stepIndex, itemIndex); }}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            type="button"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 border-2 border-dashed border-purple-200 rounded">
                    <ListChecks className="w-6 h-6 mx-auto mb-1 text-purple-300" />
                    <p className="text-xs text-muted-foreground">No checklist items yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Standard Step Fields - Only show for standard type */}
            {!isChecklist && (
              <>
                <div>
                  <Label className="text-xs">Safety Note</Label>
                  <Input
                    value={step.safety_note}
                    onChange={(e) => updateStep(stepIndex, 'safety_note', e.target.value)}
                    placeholder="Any safety warnings for this step"
                    className="h-8 text-sm"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={step.photo_required}
                      onChange={(e) => updateStep(stepIndex, 'photo_required', e.target.checked)}
                      className="rounded"
                    />
                    <Camera className="w-4 h-4" />
                    Photo Required
                  </label>
                </div>
                
                {/* Reference Images */}
                <div className="border-t pt-3 mt-3">
                  <Label className="text-xs font-medium flex items-center gap-2 mb-2">
                    <ImagePlus className="w-3 h-3" />
                    Reference Images (max 5)
                  </Label>
                  <MultipleReferenceImages
                    images={step.reference_images || []}
                    onImagesChange={(images) => updateStepReferenceImages(stepIndex, images)}
                    category="sop_step"
                    maxImages={5}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Add reference images to help technicians understand this step
                  </p>
                </div>
                
                {/* Step Parameters */}
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-medium">Step Parameters</Label>
                    <Button
                      onClick={() => addStepParameter(stepIndex)}
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs"
                      type="button"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Parameter
                    </Button>
                  </div>
                  {step.parameters?.map((param, paramIndex) => (
                    <div key={paramIndex} className="flex gap-2 mb-2">
                      <Input
                        value={param.parameter_name}
                        onChange={(e) => updateStepParameter(stepIndex, paramIndex, 'parameter_name', e.target.value)}
                        placeholder="Parameter name"
                        className="h-7 text-xs flex-1"
                      />
                      <Input
                        value={param.expected_value}
                        onChange={(e) => updateStepParameter(stepIndex, paramIndex, 'expected_value', e.target.value)}
                        placeholder="Expected value"
                        className="h-7 text-xs w-24"
                      />
                      <Input
                        value={param.unit}
                        onChange={(e) => updateStepParameter(stepIndex, paramIndex, 'unit', e.target.value)}
                        placeholder="Unit"
                        className="h-7 text-xs w-16"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStepParameter(stepIndex, paramIndex)}
                        className="h-7 w-7 p-0"
                        type="button"
                      >
                        <X className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  {(!step.parameters || step.parameters.length === 0) && (
                    <p className="text-xs text-muted-foreground italic">No parameters added yet</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export const TestTemplatesPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const { isMaster, isAdmin, currentUser } = useAuth();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Export/Import dialog states
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [exportPreview, setExportPreview] = useState(null);
  const [exportTemplatesList, setExportTemplatesList] = useState([]); // Full list of templates for selection
  const [selectedExportTemplates, setSelectedExportTemplates] = useState(new Set()); // Selected template IDs/codes
  const [exportAssetTypeFilter, setExportAssetTypeFilter] = useState('all'); // Filter by asset type
  const [importFile, setImportFile] = useState(null);
  const [importData, setImportData] = useState(null);
  const [importMode, setImportMode] = useState('append');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // AI Template Generator state
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
  
  // Determine if user can create tests (Master or Admin)
  const canCreateTests = isMaster() || isAdmin();
  // Determine if user can create global tests (Master only)
  const canCreateGlobalTests = isMaster();
  
  // Form state for editing
  const [formData, setFormData] = useState({
    parameters: [],
    equipment: [],
    applicable_standards: [],
    safety_precautions: [],
    sop_steps: [],
  });
  
  // Form state for creating new test
  const [createFormData, setCreateFormData] = useState({
    test_code: '',
    name: '',
    category: '',
    description: '',
    test_type: '',
    test_mode: 'offline', // Default to offline
    scope: 'global', // Default scope - will be overridden based on user role
    applicable_asset_types: [],
    parameters: [],
    equipment: [],
    applicable_standards: [],
    safety_precautions: [],
    sop_steps: [],
  });
  
  // SOP step expanded state
  const [expandedEditStep, setExpandedEditStep] = useState(null);
  const [expandedCreateStep, setExpandedCreateStep] = useState(null);
  
  // Drag and drop sensors for SOP steps
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

  // Handle drag end for Edit dialog SOP steps
  const handleEditDragEnd = (event) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      const steps = formData.sop_steps || [];
      const oldIndex = steps.findIndex(step => `edit-step-${step.step_number}` === active.id);
      const newIndex = steps.findIndex(step => `edit-step-${step.step_number}` === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newSteps = arrayMove(steps, oldIndex, newIndex);
        // Renumber all steps
        newSteps.forEach((step, i) => {
          step.step_number = i + 1;
        });
        setFormData({ ...formData, sop_steps: newSteps });
        setExpandedEditStep(newIndex);
      }
    }
  };

  // Handle drag end for Create dialog SOP steps
  const handleCreateDragEnd = (event) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      const steps = createFormData.sop_steps || [];
      const oldIndex = steps.findIndex(step => `create-step-${step.step_number}` === active.id);
      const newIndex = steps.findIndex(step => `create-step-${step.step_number}` === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newSteps = arrayMove(steps, oldIndex, newIndex);
        // Renumber all steps
        newSteps.forEach((step, i) => {
          step.step_number = i + 1;
        });
        setCreateFormData({ ...createFormData, sop_steps: newSteps });
        setExpandedCreateStep(newIndex);
      }
    }
  };

  // Categories extracted from existing tests
  const [existingCategories, setExistingCategories] = useState([]);
  const [categoryInputValue, setCategoryInputValue] = useState('');
  
  // Asset types for smart selector
  const [availableAssetTypes, setAvailableAssetTypes] = useState([]);
  const [selectedAssetTypes, setSelectedAssetTypes] = useState([]);
  const [assetTypeInputValue, setAssetTypeInputValue] = useState('');
  
  // Report templates for default selection
  const [reportTemplates, setReportTemplates] = useState([]);
  const [selectedReportTemplateId, setSelectedReportTemplateId] = useState('');
  
  // Filtering state
  const [filters, setFilters] = useState({
    category: '',
    assetType: '',
    searchText: '',
    testMode: '', // 'online', 'offline', or '' for all
    scope: '', // 'global', 'company', or '' for all
    showRetired: false, // By default, don't show retired templates
  });
  const [filteredTests, setFilteredTests] = useState([]);
  
  // Temporary input states for edit dialog
  const [editNewParameter, setEditNewParameter] = useState({ name: '', limit: '', unit: '' });
  const [editNewEquipment, setEditNewEquipment] = useState('');
  const [editNewStandard, setEditNewStandard] = useState('');
  const [editNewSafety, setEditNewSafety] = useState('');
  
  // Temporary input states for create dialog
  const [createNewEquipment, setCreateNewEquipment] = useState('');
  const [createNewStandard, setCreateNewStandard] = useState('');
  const [createNewSafety, setCreateNewSafety] = useState('');
  const [createNewParameter, setCreateNewParameter] = useState({
    name: '',
    limit: '',
    unit: '',
  });
  
  // Suggestions state
  const [suggestions, setSuggestions] = useState({
    test_parameters: [],
    equipment: [],
    standards: [],
    safety: []
  });
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [activeSuggestionTab, setActiveSuggestionTab] = useState('parameters');

  // Duplicate dialog state
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [testToDuplicate, setTestToDuplicate] = useState(null);
  const [duplicateName, setDuplicateName] = useState('');
  const [duplicateCode, setDuplicateCode] = useState('');

  // Rename dialog state
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [testToRename, setTestToRename] = useState(null);
  const [newTestName, setNewTestName] = useState('');

  useEffect(() => {
    if (!isMaster() && !isAdmin()) {
      toast.error('Access denied. Admin privileges required.');
      navigate('/');
    } else {
      loadTests();
    }
  }, [isMaster, isAdmin, navigate]);

  // Filtering logic
  useEffect(() => {
    let filtered = [...tests];

    // Filter by category
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(test => test.category === filters.category);
    }

    // Filter by asset type
    if (filters.assetType && filters.assetType !== 'all') {
      filtered = filtered.filter(test => 
        test.applicable_asset_types?.includes(filters.assetType)
      );
    }

    // Filter by test mode
    if (filters.testMode && filters.testMode !== 'all') {
      filtered = filtered.filter(test => 
        (test.test_mode || 'offline') === filters.testMode
      );
    }

    // Filter by scope
    if (filters.scope && filters.scope !== 'all') {
      filtered = filtered.filter(test => {
        const testScope = test.scope || 'global'; // Default to global for backward compatibility
        return testScope === filters.scope;
      });
    }

    // Filter by retired status (when showRetired is false, hide retired templates)
    if (!filters.showRetired) {
      filtered = filtered.filter(test => !test.is_retired);
    }

    // Filter by search text
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(test => 
        test.name.toLowerCase().includes(searchLower) ||
        test.test_code.toLowerCase().includes(searchLower) ||
        test.description?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredTests(filtered);
  }, [tests, filters]);

  const clearFilters = () => {
    setFilters({
      category: '',
      assetType: '',
      searchText: '',
      testMode: '',
      scope: '',
      showRetired: false,
    });
  };

  const hasActiveFilters = (filters.category && filters.category !== 'all') || 
                          (filters.assetType && filters.assetType !== 'all') || 
                          (filters.testMode && filters.testMode !== 'all') ||
                          (filters.scope && filters.scope !== 'all') ||
                          filters.showRetired ||
                          filters.searchText;

  // Get unique asset types from all tests
  const getUniqueAssetTypes = () => {
    const allAssetTypes = tests.flatMap(test => test.applicable_asset_types || []);
    return [...new Set(allAssetTypes)].sort();
  };

  const loadTests = async () => {
    try {
      setLoading(true);
      
      // Build filters based on user role
      const testFilters = {
        include_retired: 'true', // Load all tests including retired ones - filtering done on frontend
      };
      if (!isMaster() && currentUser?.company_id) {
        // Company Admin: Get global tests + their company's tests
        testFilters.company_id = currentUser.company_id;
      }
      // Master Admin: Gets all tests by default
      
      const [testsData, assetTypesData, reportTemplatesData] = await Promise.all([
        testsAPI.getAll(testFilters),
        assetTypeAPI.getAll(),
        reportTemplateAPI.getAll().catch(() => []) // Gracefully handle if no templates exist
      ]);
      
      setTests(testsData);
      setFilteredTests(testsData); // Initialize filtered tests
      setAvailableAssetTypes(assetTypesData);
      setReportTemplates(reportTemplatesData || []);
      
      // Extract unique categories from existing tests (only from non-retired)
      const categories = [...new Set(testsData.filter(t => !t.is_retired).map(test => test.category).filter(Boolean))];
      setExistingCategories(categories);
    } catch (error) {
      toast.error('Failed to load test templates');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async (assetTypeName) => {
    try {
      setLoadingSuggestions(true);
      let data;
      
      if (assetTypeName) {
        // Load asset-type specific suggestions
        data = await testsAPI.getParameterSuggestions(assetTypeName);
      } else {
        // Load default/common suggestions when no asset type selected
        data = await testsAPI.getDefaultSuggestions();
      }
      
      setSuggestions(data);
    } catch (error) {
      // Filter rrweb clone errors
      const errorMessage = error?.message || error?.toString() || '';
      if (errorMessage.includes('clone') && errorMessage.includes('Response')) {
        console.log('Filtered rrweb clone error on load suggestions');
        return;
      }
      console.error('Failed to load suggestions:', error);
      // Don't show toast for default suggestions failure - just use empty
      setSuggestions({
        test_parameters: [],
        equipment: [],
        standards: [],
        safety: []
      });
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Load default suggestions when Create dialog opens
  const handleOpenCreateDialog = () => {
    resetCreateForm();
    loadSuggestions(); // Load default suggestions immediately
    setIsCreateDialogOpen(true);
  };

  // Handlers to add from suggestions
  const addParameterFromSuggestion = (param) => {
    try {
      console.log('Adding parameter:', param);
      console.log('Current parameters:', createFormData.parameters);
      
      if (!param || !param.name) {
        console.error('Invalid parameter structure:', param);
        toast.error('Invalid parameter');
        return;
      }
      
      const parameters = createFormData.parameters || [];
      console.log('Parameters array:', parameters);
      
      const exists = parameters.some(p => p && p.name === param.name);
      console.log('Parameter exists?', exists);
      
      if (!exists) {
        const newParams = [...parameters, param];
        console.log('New parameters:', newParams);
        
        setCreateFormData({
          ...createFormData,
          parameters: newParams
        });
        toast.success(`Added: ${param.name}`);
      } else {
        toast.info('Parameter already added');
      }
    } catch (error) {
      console.error('Error adding parameter - Full error:', error);
      console.error('Error stack:', error.stack);
      toast.error(`Failed to add parameter: ${error.message}`);
    }
  };

  const addEquipmentFromSuggestion = (equipment) => {
    try {
      if (!equipment) {
        toast.error('Invalid equipment');
        return;
      }
      const equipmentList = createFormData.equipment || [];
      if (!equipmentList.includes(equipment)) {
        setCreateFormData({
          ...createFormData,
          equipment: [...equipmentList, equipment]
        });
        toast.success('Equipment added');
      } else {
        toast.info('Equipment already added');
      }
    } catch (error) {
      console.error('Error adding equipment:', error);
      toast.error('Failed to add equipment');
    }
  };

  const addStandardFromSuggestion = (standard) => {
    try {
      if (!standard) {
        toast.error('Invalid standard');
        return;
      }
      const standards = createFormData.applicable_standards || [];
      if (!standards.includes(standard)) {
        setCreateFormData({
          ...createFormData,
          applicable_standards: [...standards, standard]
        });
        toast.success('Standard added');
      } else {
        toast.info('Standard already added');
      }
    } catch (error) {
      console.error('Error adding standard:', error);
      toast.error('Failed to add standard');
    }
  };

  const addSafetyFromSuggestion = (safety) => {
    try {
      if (!safety) {
        toast.error('Invalid safety precaution');
        return;
      }
      const safetyList = createFormData.safety_precautions || [];
      if (!safetyList.includes(safety)) {
        setCreateFormData({
          ...createFormData,
          safety_precautions: [...safetyList, safety]
        });
        toast.success('Safety precaution added');
      } else {
        toast.info('Safety precaution already added');
      }
    } catch (error) {
      console.error('Error adding safety:', error);
      toast.error('Failed to add safety precaution');
    }
  };

  // Handlers for Edit form suggestions
  const addEditParameterFromSuggestion = (param) => {
    try {
      console.log('Adding parameter to edit:', param);
      console.log('Current edit parameters:', formData.parameters);
      
      if (!param || !param.name) {
        console.error('Invalid parameter structure:', param);
        toast.error('Invalid parameter');
        return;
      }
      
      const parameters = formData.parameters || [];
      console.log('Edit parameters array:', parameters);
      
      const exists = parameters.some(p => p && p.name === param.name);
      console.log('Parameter exists in edit?', exists);
      
      if (!exists) {
        const newParams = [...parameters, param];
        console.log('New edit parameters:', newParams);
        
        setFormData({
          ...formData,
          parameters: newParams
        });
        toast.success(`Added: ${param.name}`);
      } else {
        toast.info('Parameter already added');
      }
    } catch (error) {
      console.error('Error adding parameter to edit - Full error:', error);
      console.error('Error stack:', error.stack);
      toast.error(`Failed to add parameter: ${error.message}`);
    }
  };

  const addEditEquipmentFromSuggestion = (equipment) => {
    try {
      if (!equipment) {
        toast.error('Invalid equipment');
        return;
      }
      const equipmentList = formData.equipment || [];
      if (!equipmentList.includes(equipment)) {
        setFormData({
          ...formData,
          equipment: [...equipmentList, equipment]
        });
        toast.success('Equipment added');
      } else {
        toast.info('Equipment already added');
      }
    } catch (error) {
      console.error('Error adding equipment to edit:', error);
      toast.error('Failed to add equipment');
    }
  };

  const addEditStandardFromSuggestion = (standard) => {
    try {
      if (!standard) {
        toast.error('Invalid standard');
        return;
      }
      const standards = formData.applicable_standards || [];
      if (!standards.includes(standard)) {
        setFormData({
          ...formData,
          applicable_standards: [...standards, standard]
        });
        toast.success('Standard added');
      } else {
        toast.info('Standard already added');
      }
    } catch (error) {
      console.error('Error adding standard to edit:', error);
      toast.error('Failed to add standard');
    }
  };

  const addEditSafetyFromSuggestion = (safety) => {
    try {
      if (!safety) {
        toast.error('Invalid safety precaution');
        return;
      }
      const safetyList = formData.safety_precautions || [];
      if (!safetyList.includes(safety)) {
        setFormData({
          ...formData,
          safety_precautions: [...safetyList, safety]
        });
        toast.success('Safety precaution added');
      } else {
        toast.info('Safety precaution already added');
      }
    } catch (error) {
      console.error('Error adding safety to edit:', error);
      toast.error('Failed to add safety precaution');
    }
  };

  const openEditDialog = (test) => {
    setSelectedTest(test);
    // Normalize sop_steps to ensure step_type and checklist_items exist
    const normalizedSteps = (test.sop_steps || []).map(step => ({
      ...step,
      step_type: step.step_type || 'standard',
      checklist_items: step.checklist_items || [],
      parameters: step.parameters || [],
      reference_images: step.reference_images || [],
    }));
    setFormData({
      parameters: test.parameters || test.test_parameters || [],
      equipment: test.equipment || test.equipment_needed || [],
      applicable_standards: test.applicable_standards || [],
      safety_precautions: test.safety_precautions || [],
      sop_steps: normalizedSteps,
      default_report_template_id: test.default_report_template_id || '',
      default_report_template_name: test.default_report_template_name || '',
      test_mode: test.test_mode || 'offline',
      scope: test.scope || 'global',
      display_config: test.display_config || null,
    });
    // Reset edit dialog inputs
    setEditNewParameter({ name: '', limit: '', unit: '' });
    setEditNewEquipment('');
    setEditNewStandard('');
    setEditNewSafety('');
    setSelectedReportTemplateId(test.default_report_template_id || '');
    setExpandedEditStep(null);
    
    // Load suggestions based on first applicable asset type
    if (test.applicable_asset_types && test.applicable_asset_types.length > 0) {
      loadSuggestions(test.applicable_asset_types[0]);
    }
    
    setIsEditDialogOpen(true);
  };

  // Handle report template selection change
  const handleReportTemplateChange = (templateId) => {
    setSelectedReportTemplateId(templateId);
    const selectedTemplate = reportTemplates.find(t => t.template_id === templateId);
    setFormData({
      ...formData,
      default_report_template_id: templateId || null,
      default_report_template_name: selectedTemplate?.template_name || null,
    });
  };

  const handleUpdateTest = async () => {
    try {
      await testsAPI.update(selectedTest.test_id, formData);
      toast.success('Test template updated successfully');
      setIsEditDialogOpen(false);
      loadTests(); // This will refresh both tests and filteredTests
      
      // TODO: Create notifications for companies that have customized this test
    } catch (error) {
      toast.error('Failed to update test template');
      console.error(error);
    }
  };

  // Handle AI-generated template
  const handleAITemplateGenerated = (generatedTemplate) => {
    // Populate the create form with the generated template
    setCreateFormData({
      test_code: generatedTemplate.test_code || '',
      name: generatedTemplate.name || '',
      category: generatedTemplate.category || '',
      description: generatedTemplate.description || '',
      test_type: generatedTemplate.test_type || '',
      test_mode: generatedTemplate.test_mode || 'offline',
      scope: 'global', // AI-generated templates are global by default
      applicable_asset_types: generatedTemplate.applicable_asset_types || [],
      applicable_standards: generatedTemplate.applicable_standards || [],
      parameters: generatedTemplate.parameters || [],
      equipment: generatedTemplate.equipment || [],
      safety_precautions: generatedTemplate.safety_precautions || [],
      sop_steps: (generatedTemplate.sop_steps || []).map(step => ({
        ...step,
        step_type: step.step_type || 'standard',
        checklist_items: step.checklist_items || [],
        parameters: step.parameters || [],
        reference_images: step.reference_images || [],
      })),
      display_config: generatedTemplate.display_config || null,
      estimated_duration: generatedTemplate.estimated_duration || '',
    });
    
    // Set selected asset types
    setSelectedAssetTypes(generatedTemplate.applicable_asset_types || []);
    
    // Open the create dialog for review/editing
    setIsAIGeneratorOpen(false);
    setIsCreateDialogOpen(true);
    
    toast.success('AI-generated template loaded. Review and save to create the template.', {
      duration: 5000,
    });
  };

  const handleCreateTest = async () => {
    try {
      // Validation
      if (!createFormData.test_code || !createFormData.name || !createFormData.category) {
        toast.error('Please fill in test code, name, and category');
        return;
      }
      
      if (selectedAssetTypes.length === 0) {
        toast.error('Please select at least one applicable asset type');
        return;
      }

      // Prepare the complete test data including all fields
      const testData = {
        ...createFormData,
        applicable_asset_types: selectedAssetTypes,
        parameters: createFormData.parameters || [],
        equipment: createFormData.equipment || [],
        applicable_standards: createFormData.applicable_standards || [],
        safety_precautions: createFormData.safety_precautions || [],
        sop_steps: createFormData.sop_steps || [],
      };

      console.log('Creating test with data:', testData);

      await testsAPI.create(testData);
      toast.success('Test template created successfully');
      setIsCreateDialogOpen(false);
      resetCreateForm();
      loadTests(); // This will refresh both tests and filteredTests
    } catch (error) {
      toast.error(error.message || 'Failed to create test template');
      console.error(error);
    }
  };

  // Open duplicate dialog
  const handleOpenDuplicateDialog = (test) => {
    setTestToDuplicate(test);
    setDuplicateName(`${test.name} (Copy)`);
    setDuplicateCode(`${test.test_code}-COPY`);
    setIsDuplicateDialogOpen(true);
  };

  // Duplicate test template with custom name
  const handleDuplicateTest = async () => {
    if (!testToDuplicate) return;
    
    if (!duplicateName.trim() || !duplicateCode.trim()) {
      toast.error('Please enter a name and code for the duplicated test');
      return;
    }

    try {
      // Create a copy with custom name and code
      const duplicatedTest = {
        test_code: duplicateCode.trim(),
        name: duplicateName.trim(),
        category: testToDuplicate.category,
        description: testToDuplicate.description,
        test_type: testToDuplicate.test_type,
        test_mode: testToDuplicate.test_mode || 'offline',
        applicable_asset_types: testToDuplicate.applicable_asset_types || [],
        parameters: testToDuplicate.parameters || [],
        equipment: testToDuplicate.equipment || [],
        applicable_standards: testToDuplicate.applicable_standards || [],
        safety_precautions: testToDuplicate.safety_precautions || [],
        sop_steps: testToDuplicate.sop_steps || [],
        default_report_template_id: testToDuplicate.default_report_template_id,
        // New duplicates inherit scope based on who's duplicating
        scope: canCreateGlobalTests ? (testToDuplicate.scope || 'global') : 'company',
        company_id: canCreateGlobalTests ? testToDuplicate.company_id : currentUser?.company_id,
      };

      await testsAPI.create(duplicatedTest);
      toast.success(`Test template duplicated as "${duplicatedTest.name}"`);
      setIsDuplicateDialogOpen(false);
      setTestToDuplicate(null);
      loadTests();
    } catch (error) {
      toast.error('Failed to duplicate test template');
      console.error(error);
    }
  };

  // Open rename dialog
  const handleOpenRenameDialog = (test) => {
    setTestToRename(test);
    setNewTestName(test.name);
    setIsRenameDialogOpen(true);
  };

  // Rename test template
  const handleRenameTest = async () => {
    if (!testToRename) return;
    
    if (!newTestName.trim()) {
      toast.error('Please enter a name for the test');
      return;
    }

    // Check authorization for global tests
    const testScope = testToRename.scope || 'global';
    const isGlobalTest = testScope === 'global';
    
    if (!canCreateGlobalTests && isGlobalTest) {
      toast.error('You cannot rename global test templates. Only Master Admin can rename global tests.');
      return;
    }

    try {
      await testsAPI.update(testToRename.test_id, { name: newTestName.trim() });
      toast.success(`Test renamed to "${newTestName.trim()}"`);
      setIsRenameDialogOpen(false);
      setTestToRename(null);
      loadTests();
    } catch (error) {
      toast.error('Failed to rename test template');
      console.error(error);
    }
  };

  // Delete or Retire test template
  const handleDeleteTest = async (test) => {
    const testScope = test.scope || 'global';
    const isGlobalTest = testScope === 'global';
    
    // Check authorization
    if (!canCreateGlobalTests && isGlobalTest) {
      toast.error('You cannot delete/retire global test templates. Only Master Admin can.');
      return;
    }
    
    try {
      // First check if the template has associated test records
      const recordInfo = await testsAPI.getRecordCount(test.test_id);
      const hasRecords = recordInfo.has_records;
      const recordCount = recordInfo.test_records_count;
      
      // Confirm action
      let confirmMessage;
      if (hasRecords) {
        confirmMessage = `This template has ${recordCount} associated test record(s). It will be RETIRED (not deleted) to preserve historical data.\n\nRetired templates cannot be used for new tests but all historical data is preserved.\n\nContinue?`;
      } else {
        confirmMessage = isGlobalTest
          ? `Are you sure you want to permanently delete the global test template "${test.name}"? This will affect all companies.\n\nThis cannot be undone.`
          : `Are you sure you want to permanently delete the company test template "${test.name}"?\n\nThis cannot be undone.`;
      }
      
      if (!window.confirm(confirmMessage)) {
        return;
      }
      
      const result = await testsAPI.delete(test.test_id);
      
      if (result.action === 'retired') {
        toast.success(`Template "${test.name}" has been retired. ${recordCount} historical test records preserved.`, {
          duration: 5000,
        });
      } else {
        toast.success(`Test template "${test.name}" deleted successfully`);
      }
      
      loadTests();
    } catch (error) {
      toast.error(error.message || 'Failed to delete/retire test template');
      console.error(error);
    }
  };

  // Explicitly retire a test template
  const handleRetireTest = async (test) => {
    const testScope = test.scope || 'global';
    const isGlobalTest = testScope === 'global';
    
    // Check authorization
    if (!canCreateGlobalTests && isGlobalTest) {
      toast.error('You cannot retire global test templates. Only Master Admin can.');
      return;
    }
    
    const confirmMessage = `Are you sure you want to retire "${test.name}"?\n\nRetired templates:\n• Cannot be used for new tests\n• Preserve all historical test records\n• Can be restored later if needed`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    try {
      const result = await testsAPI.retire(test.test_id);
      toast.success(result.message, { duration: 5000 });
      loadTests();
    } catch (error) {
      toast.error(error.message || 'Failed to retire test template');
      console.error(error);
    }
  };

  // Restore a retired test template
  const handleRestoreTest = async (test) => {
    const testScope = test.scope || 'global';
    const isGlobalTest = testScope === 'global';
    
    // Check authorization
    if (!canCreateGlobalTests && isGlobalTest) {
      toast.error('You cannot restore global test templates. Only Master Admin can.');
      return;
    }
    
    const confirmMessage = `Are you sure you want to restore "${test.name}"?\n\nThe template will become active again and can be used for new tests.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    try {
      const result = await testsAPI.restore(test.test_id);
      toast.success(result.message);
      loadTests();
    } catch (error) {
      toast.error(error.message || 'Failed to restore test template');
      console.error(error);
    }
  };

  // Check if user can delete a specific test
  const canDeleteTest = (test) => {
    const testScope = test.scope || 'global';
    if (canCreateGlobalTests) {
      // Master Admin can delete any test
      return true;
    }
    // Company Admin can only delete company-specific tests
    return testScope === 'company';
  };

  const resetCreateForm = () => {
    setCreateFormData({
      test_code: '',
      name: '',
      category: '',
      description: '',
      test_type: '',
      test_mode: 'offline',
      scope: canCreateGlobalTests ? 'global' : 'company', // Default based on user role
      applicable_asset_types: [],
      parameters: [],
      equipment: [],
      applicable_standards: [],
      safety_precautions: [],
      sop_steps: [],
    });
    setCreateNewEquipment('');
    setCreateNewStandard('');
    setCreateNewSafety('');
    setCreateNewParameter({ name: '', limit: '', unit: '' });
    setCategoryInputValue('');
    setSelectedAssetTypes([]);
    setAssetTypeInputValue('');
    setExpandedCreateStep(null);
  };

  // ============= EXPORT/IMPORT FUNCTIONS =============
  
  // Fetch export preview - uses the same tests data that's displayed on the page
  const fetchExportPreview = async () => {
    try {
      // Use the tests that are already loaded on the page
      if (tests && tests.length > 0) {
        setExportTemplatesList(tests);
        // Pre-select all templates by default using consistent ID
        setSelectedExportTemplates(new Set(tests.map(t => t.test_id || t.template_id || t.test_code)));
        
        // Build preview summary
        const byCategory = {};
        tests.forEach(t => {
          const cat = t.category || 'Uncategorized';
          if (!byCategory[cat]) byCategory[cat] = [];
          byCategory[cat].push(t);
        });
        
        setExportPreview({
          total_count: tests.length,
          by_category: byCategory,
          global_count: tests.filter(t => t.scope === 'global').length,
          company_count: tests.filter(t => t.scope === 'company').length
        });
      } else {
        // Fallback: fetch from API
        const response = await testsAPI.getAll({});
        if (response) {
          setExportTemplatesList(response);
          setSelectedExportTemplates(new Set(response.map(t => t.test_id || t.template_id || t.test_code)));
        }
      }
    } catch (error) {
      console.error('Failed to fetch export preview:', error);
    }
  };

  // Get unique asset types from all templates for filter dropdown
  const exportAssetTypes = useMemo(() => {
    const types = new Set();
    exportTemplatesList.forEach(t => {
      (t.applicable_asset_types || []).forEach(at => types.add(at));
    });
    return Array.from(types).sort();
  }, [exportTemplatesList]);

  // Filter templates based on selected asset type
  const filteredExportTemplates = useMemo(() => {
    if (exportAssetTypeFilter === 'all') {
      return exportTemplatesList;
    }
    return exportTemplatesList.filter(t => 
      (t.applicable_asset_types || []).includes(exportAssetTypeFilter)
    );
  }, [exportTemplatesList, exportAssetTypeFilter]);

  // Toggle single template selection
  const toggleExportTemplate = (templateId) => {
    setSelectedExportTemplates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(templateId)) {
        newSet.delete(templateId);
      } else {
        newSet.add(templateId);
      }
      return newSet;
    });
  };

  // Helper to get consistent template ID
  const getTemplateId = (template) => {
    return template.test_id || template.template_id || template.test_code;
  };

  // Select all visible templates
  const selectAllExportTemplates = () => {
    setSelectedExportTemplates(prev => {
      const newSet = new Set(prev);
      filteredExportTemplates.forEach(t => newSet.add(getTemplateId(t)));
      return newSet;
    });
  };

  // Deselect all visible templates
  const deselectAllExportTemplates = () => {
    setSelectedExportTemplates(prev => {
      const newSet = new Set(prev);
      filteredExportTemplates.forEach(t => newSet.delete(getTemplateId(t)));
      return newSet;
    });
  };

  // Check if all visible templates are selected
  const allVisibleSelected = filteredExportTemplates.length > 0 && 
    filteredExportTemplates.every(t => selectedExportTemplates.has(getTemplateId(t)));

  // Handle export - exports selected test templates
  const handleExport = async () => {
    if (selectedExportTemplates.size === 0) {
      toast.error('Please select at least one template to export');
      return;
    }
    
    setIsExporting(true);
    try {
      // Get selected templates from the local list using consistent ID
      const selectedTemplates = exportTemplatesList.filter(t => 
        selectedExportTemplates.has(t.test_id || t.template_id || t.test_code)
      );
      
      // Create portable export format
      const portableTemplates = selectedTemplates.map(template => ({
        template_code: template.test_code || template.template_code,
        test_code: template.test_code,
        template_name: template.name || template.template_name,
        name: template.name || template.template_name,
        category: template.category,
        description: template.description,
        test_type: template.test_type,
        test_mode: template.test_mode || 'offline',
        scope: template.scope || 'global',
        applicable_asset_types: template.applicable_asset_types || [],
        parameters: template.parameters || template.test_parameters || [],
        equipment_needed: template.equipment || template.equipment_needed || [],
        applicable_standards: template.applicable_standards || [],
        safety_precautions: template.safety_precautions || [],
        steps: template.steps || template.sop_steps || [],
        estimated_duration: template.estimated_duration,
        version: template.version || '1.0',
      }));
      
      const exportData = {
        export_version: '1.0',
        export_type: 'test_templates',
        export_date: new Date().toISOString(),
        exported_by: currentUser?.username || 'Unknown',
        templates_count: portableTemplates.length,
        templates: portableTemplates,
        export_note: `Selective export: ${portableTemplates.length} templates`
      };
      
      // Create and download the JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test_templates_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Exported ${portableTemplates.length} test templates successfully`);
      setIsExportDialogOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle file selection for import
  const handleImportFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImportFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          setImportData(data);
        } catch (err) {
          toast.error('Invalid JSON file');
          setImportData(null);
        }
      };
      reader.readAsText(file);
    }
  };

  // Handle import - imports to tests collection
  const handleImport = async () => {
    if (!importData || !importData.templates) {
      toast.error('No valid template data to import');
      return;
    }
    
    setIsImporting(true);
    
    // Import templates one by one using testsAPI
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = [];
    
    for (const template of importData.templates) {
      try {
        // Check if template with same code exists
        const templateCode = template.template_code || template.test_code;
        const existingTests = tests.filter(t => t.test_code === templateCode);
        
        if (existingTests.length > 0 && importMode === 'append') {
          skipped++;
          continue;
        }
        
        // Prepare test data for creation
        const testData = {
          test_code: templateCode,
          name: template.name || template.template_name,
          category: template.category || '',
          description: template.description || '',
          test_type: template.test_type || '',
          test_mode: template.test_mode || 'offline',
          scope: template.scope || 'global',
          applicable_asset_types: template.applicable_asset_types || [],
          parameters: template.parameters || [],
          equipment: template.equipment_needed || template.equipment || [],
          applicable_standards: template.applicable_standards || [],
          safety_precautions: template.safety_precautions || [],
          sop_steps: template.steps || template.sop_steps || [],
        };
        
        if (existingTests.length > 0 && importMode === 'replace') {
          // Update existing
          await testsAPI.update(existingTests[0].test_id, testData);
          updated++;
        } else {
          // Create new
          await testsAPI.create(testData);
          created++;
        }
      } catch (err) {
        console.error('Error importing template:', template.template_code || template.test_code, err);
        errors.push({ 
          code: template.template_code || template.test_code, 
          error: err.message || 'Unknown error'
        });
      }
    }
    
    setIsImporting(false);
    
    // Build result message
    const parts = [];
    if (created > 0) parts.push(`${created} created`);
    if (updated > 0) parts.push(`${updated} updated`);
    if (skipped > 0) parts.push(`${skipped} skipped`);
    if (errors.length > 0) parts.push(`${errors.length} failed`);
    
    const message = `Import complete: ${parts.join(', ')}`;
    
    if (errors.length > 0 && (created > 0 || updated > 0)) {
      // Partial success
      toast.warning(message);
      console.warn('Import errors:', errors);
    } else if (errors.length > 0 && created === 0 && updated === 0) {
      // Complete failure
      toast.error(`Import failed: ${errors.map(e => e.error).join(', ')}`);
      return; // Don't close dialog on complete failure
    } else {
      // Success
      toast.success(message);
    }
    
    // Close dialog and reset state
    setIsImportDialogOpen(false);
    setImportFile(null);
    setImportData(null);
    
    // Refresh the templates list after a short delay to let toast show
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // Open export dialog
  const openExportDialog = () => {
    setExportAssetTypeFilter('all');
    setSelectedExportTemplates(new Set());
    fetchExportPreview();
    setIsExportDialogOpen(true);
  };

  // Open import dialog
  const openImportDialog = () => {
    setImportFile(null);
    setImportData(null);
    setImportMode('append');
    setIsImportDialogOpen(true);
  };

  const handleCategorySelect = (category) => {
    setCreateFormData({ ...createFormData, category });
    setCategoryInputValue(category);
  };

  const handleCategoryInputChange = (value) => {
    setCategoryInputValue(value);
    setCreateFormData({ ...createFormData, category: value });
  };
  
  // Asset type handlers
  const handleAssetTypeSelect = (assetTypeName) => {
    if (!selectedAssetTypes.includes(assetTypeName)) {
      const newSelection = [...selectedAssetTypes, assetTypeName];
      setSelectedAssetTypes(newSelection);
      setCreateFormData({ ...createFormData, applicable_asset_types: newSelection });
      
      // Load suggestions for the first selected asset type
      if (selectedAssetTypes.length === 0) {
        loadSuggestions(assetTypeName);
      }
    }
    setAssetTypeInputValue('');
  };

  const handleAssetTypeInputChange = (value) => {
    setAssetTypeInputValue(value);
  };

  const removeSelectedAssetType = (assetType) => {
    const newSelection = selectedAssetTypes.filter(type => type !== assetType);
    setSelectedAssetTypes(newSelection);
    setCreateFormData({ ...createFormData, applicable_asset_types: newSelection });
  };
  
  const createNewAssetType = async (name) => {
    try {
      await assetTypeAPI.create({
        name,
        category: 'Custom',
        description: `Custom asset type created during test template creation`,
        created_by: currentUser.user_id,
      });
      
      // Reload asset types to include the new one
      const updatedAssetTypes = await assetTypeAPI.getAll();
      setAvailableAssetTypes(updatedAssetTypes);
      
      // Add to selection
      handleAssetTypeSelect(name);
      
      toast.success(`Asset type "${name}" created successfully`);
    } catch (error) {
      toast.error('Failed to create new asset type');
      console.error(error);
    }
  };

  // Edit dialog helper functions
  const addEditParameter = () => {
    if (editNewParameter.name && editNewParameter.limit && editNewParameter.unit) {
      setFormData({
        ...formData,
        parameters: [...formData.parameters, { ...editNewParameter }]
      });
      setEditNewParameter({ name: '', limit: '', unit: '' });
    }
  };

  const removeEditParameter = (index) => {
    setFormData({
      ...formData,
      parameters: formData.parameters.filter((_, i) => i !== index)
    });
  };

  const updateParameter = (index, field, value) => {
    const updated = [...formData.parameters];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, parameters: updated });
  };

  // Helper to get equipment name (handles both string and object format)
  const getEquipmentName = (item) => {
    if (typeof item === 'string') return item;
    return item?.name || '';
  };

  // Helper to get equipment image (handles both string and object format)
  const getEquipmentImage = (item) => {
    if (typeof item === 'string') return null;
    return item?.reference_image || null;
  };

  // Helper to get safety text (handles both string and object format)
  const getSafetyText = (item) => {
    if (typeof item === 'string') return item;
    return item?.text || '';
  };

  // Helper to get safety image (handles both string and object format)
  const getSafetyImage = (item) => {
    if (typeof item === 'string') return null;
    return item?.reference_image || null;
  };

  const addEditEquipment = () => {
    if (editNewEquipment.trim()) {
      // Add as object format
      setFormData({
        ...formData,
        equipment: [...formData.equipment, { name: editNewEquipment.trim(), reference_image: null }]
      });
      setEditNewEquipment('');
    }
  };

  const removeEquipment = (index) => {
    setFormData({
      ...formData,
      equipment: formData.equipment.filter((_, i) => i !== index)
    });
  };

  const updateEquipmentImage = (index, imageUrl) => {
    const updatedEquipment = [...formData.equipment];
    const item = updatedEquipment[index];
    // Convert string to object if needed
    if (typeof item === 'string') {
      updatedEquipment[index] = { name: item, reference_image: imageUrl };
    } else {
      updatedEquipment[index] = { ...item, reference_image: imageUrl };
    }
    setFormData({ ...formData, equipment: updatedEquipment });
  };

  const addEditStandard = () => {
    if (editNewStandard.trim()) {
      setFormData({
        ...formData,
        applicable_standards: [...formData.applicable_standards, editNewStandard.trim()]
      });
      setEditNewStandard('');
    }
  };

  const removeStandard = (index) => {
    setFormData({
      ...formData,
      applicable_standards: formData.applicable_standards.filter((_, i) => i !== index)
    });
  };

  const addEditSafety = () => {
    if (editNewSafety.trim()) {
      // Add as object format
      setFormData({
        ...formData,
        safety_precautions: [...formData.safety_precautions, { text: editNewSafety.trim(), reference_image: null }]
      });
      setEditNewSafety('');
    }
  };

  const removeSafety = (index) => {
    setFormData({
      ...formData,
      safety_precautions: formData.safety_precautions.filter((_, i) => i !== index)
    });
  };

  const updateSafetyImage = (index, imageUrl) => {
    const updatedSafety = [...formData.safety_precautions];
    const item = updatedSafety[index];
    // Convert string to object if needed
    if (typeof item === 'string') {
      updatedSafety[index] = { text: item, reference_image: imageUrl };
    } else {
      updatedSafety[index] = { ...item, reference_image: imageUrl };
    }
    setFormData({ ...formData, safety_precautions: updatedSafety });
  };

  // Update SOP step reference images
  const updateEditStepReferenceImages = (stepIndex, images) => {
    const updatedSteps = [...(formData.sop_steps || [])];
    updatedSteps[stepIndex] = { ...updatedSteps[stepIndex], reference_images: images };
    setFormData({ ...formData, sop_steps: updatedSteps });
  };

  // Create dialog helper functions
  const addCreateParameter = () => {
    if (createNewParameter.name.trim() && createNewParameter.limit.trim() && createNewParameter.unit.trim()) {
      setCreateFormData({
        ...createFormData,
        parameters: [...createFormData.parameters, { ...createNewParameter }]
      });
      setCreateNewParameter({ name: '', limit: '', unit: '' });
    }
  };

  const removeCreateParameter = (index) => {
    setCreateFormData({
      ...createFormData,
      parameters: createFormData.parameters.filter((_, i) => i !== index)
    });
  };

  const addCreateEquipment = () => {
    if (createNewEquipment.trim()) {
      setCreateFormData({
        ...createFormData,
        equipment: [...createFormData.equipment, { name: createNewEquipment.trim(), reference_image: null }]
      });
      setCreateNewEquipment('');
    }
  };

  const removeCreateEquipment = (index) => {
    setCreateFormData({
      ...createFormData,
      equipment: createFormData.equipment.filter((_, i) => i !== index)
    });
  };

  const updateCreateEquipmentImage = (index, imageUrl) => {
    const updatedEquipment = [...createFormData.equipment];
    const item = updatedEquipment[index];
    if (typeof item === 'string') {
      updatedEquipment[index] = { name: item, reference_image: imageUrl };
    } else {
      updatedEquipment[index] = { ...item, reference_image: imageUrl };
    }
    setCreateFormData({ ...createFormData, equipment: updatedEquipment });
  };

  const addCreateStandard = () => {
    if (createNewStandard.trim()) {
      setCreateFormData({
        ...createFormData,
        applicable_standards: [...createFormData.applicable_standards, createNewStandard.trim()]
      });
      setCreateNewStandard('');
    }
  };

  const removeCreateStandard = (index) => {
    setCreateFormData({
      ...createFormData,
      applicable_standards: createFormData.applicable_standards.filter((_, i) => i !== index)
    });
  };

  const addCreateSafety = () => {
    if (createNewSafety.trim()) {
      setCreateFormData({
        ...createFormData,
        safety_precautions: [...createFormData.safety_precautions, { text: createNewSafety.trim(), reference_image: null }]
      });
      setCreateNewSafety('');
    }
  };

  const removeCreateSafety = (index) => {
    setCreateFormData({
      ...createFormData,
      safety_precautions: createFormData.safety_precautions.filter((_, i) => i !== index)
    });
  };

  const updateCreateSafetyImage = (index, imageUrl) => {
    const updatedSafety = [...createFormData.safety_precautions];
    const item = updatedSafety[index];
    if (typeof item === 'string') {
      updatedSafety[index] = { text: item, reference_image: imageUrl };
    } else {
      updatedSafety[index] = { ...item, reference_image: imageUrl };
    }
    setCreateFormData({ ...createFormData, safety_precautions: updatedSafety });
  };

  const updateCreateStepReferenceImages = (stepIndex, images) => {
    const updatedSteps = [...(createFormData.sop_steps || [])];
    updatedSteps[stepIndex] = { ...updatedSteps[stepIndex], reference_images: images };
    setCreateFormData({ ...createFormData, sop_steps: updatedSteps });
  };

  // ============= SOP STEP MANAGEMENT FUNCTIONS =============
  
  // Edit dialog SOP step functions
  const addEditSopStep = () => {
    const newStep = {
      step_number: (formData.sop_steps?.length || 0) + 1,
      step_type: 'standard',
      title: '',
      instruction: '',
      safety_note: '',
      parameters: [],
      photo_required: false,
      estimated_duration: '10 minutes',
      reference_images: [],
      checklist_items: []
    };
    setFormData({
      ...formData,
      sop_steps: [...(formData.sop_steps || []), newStep]
    });
    setExpandedEditStep((formData.sop_steps?.length || 0));
  };

  const removeEditSopStep = (index) => {
    const updatedSteps = (formData.sop_steps || []).filter((_, i) => i !== index);
    // Renumber steps
    updatedSteps.forEach((step, i) => {
      step.step_number = i + 1;
    });
    setFormData({ ...formData, sop_steps: updatedSteps });
    setExpandedEditStep(null);
  };

  const updateEditSopStep = (index, field, value) => {
    const updatedSteps = [...(formData.sop_steps || [])];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    setFormData({ ...formData, sop_steps: updatedSteps });
  };

  const addEditStepParameter = (stepIndex) => {
    const updatedSteps = [...(formData.sop_steps || [])];
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
    setFormData({ ...formData, sop_steps: updatedSteps });
  };

  const removeEditStepParameter = (stepIndex, paramIndex) => {
    const updatedSteps = [...(formData.sop_steps || [])];
    updatedSteps[stepIndex].parameters = updatedSteps[stepIndex].parameters.filter((_, i) => i !== paramIndex);
    setFormData({ ...formData, sop_steps: updatedSteps });
  };

  const updateEditStepParameter = (stepIndex, paramIndex, field, value) => {
    const updatedSteps = [...(formData.sop_steps || [])];
    updatedSteps[stepIndex].parameters[paramIndex] = {
      ...updatedSteps[stepIndex].parameters[paramIndex],
      [field]: value
    };
    setFormData({ ...formData, sop_steps: updatedSteps });
  };

  // Insert a new step after a specific index (Edit dialog)
  const insertEditSopStepAfter = (index) => {
    const newStep = {
      step_number: index + 2,
      step_type: 'standard',
      title: '',
      instruction: '',
      safety_note: '',
      parameters: [],
      photo_required: false,
      estimated_duration: '10 minutes',
      reference_images: [],
      checklist_items: []
    };
    
    const updatedSteps = [
      ...(formData.sop_steps || []).slice(0, index + 1),
      newStep,
      ...(formData.sop_steps || []).slice(index + 1)
    ];
    
    // Renumber all steps
    updatedSteps.forEach((step, i) => {
      step.step_number = i + 1;
    });
    
    setFormData({ ...formData, sop_steps: updatedSteps });
    setExpandedEditStep(index + 1);
    toast.success(`New step inserted after Step ${index + 1}`);
  };

  // Move step up (Edit dialog)
  const moveEditSopStepUp = (index) => {
    if (index === 0) return;
    
    const updatedSteps = [...(formData.sop_steps || [])];
    const temp = updatedSteps[index];
    updatedSteps[index] = updatedSteps[index - 1];
    updatedSteps[index - 1] = temp;
    
    // Renumber all steps
    updatedSteps.forEach((step, i) => {
      step.step_number = i + 1;
    });
    
    setFormData({ ...formData, sop_steps: updatedSteps });
    setExpandedEditStep(index - 1);
  };

  // Move step down (Edit dialog)
  const moveEditSopStepDown = (index) => {
    const steps = formData.sop_steps || [];
    if (index === steps.length - 1) return;
    
    const updatedSteps = [...steps];
    const temp = updatedSteps[index];
    updatedSteps[index] = updatedSteps[index + 1];
    updatedSteps[index + 1] = temp;
    
    // Renumber all steps
    updatedSteps.forEach((step, i) => {
      step.step_number = i + 1;
    });
    
    setFormData({ ...formData, sop_steps: updatedSteps });
    setExpandedEditStep(index + 1);
  };

  // Toggle step type between standard and checklist (Edit dialog)
  const toggleEditStepType = (stepIndex) => {
    const updatedSteps = [...(formData.sop_steps || [])];
    const currentType = updatedSteps[stepIndex].step_type || 'standard';
    const newType = currentType === 'standard' ? 'checklist' : 'standard';
    
    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex],
      step_type: newType,
      checklist_items: newType === 'checklist' ? [] : undefined
    };
    setFormData({ ...formData, sop_steps: updatedSteps });
  };

  // Add checklist item to a step (Edit dialog)
  const addEditChecklistItem = (stepIndex) => {
    const updatedSteps = [...(formData.sop_steps || [])];
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
    setFormData({ ...formData, sop_steps: updatedSteps });
  };

  // Update checklist item (Edit dialog)
  const updateEditChecklistItem = (stepIndex, itemIndex, field, value) => {
    const updatedSteps = [...(formData.sop_steps || [])];
    updatedSteps[stepIndex].checklist_items[itemIndex] = {
      ...updatedSteps[stepIndex].checklist_items[itemIndex],
      [field]: value
    };
    setFormData({ ...formData, sop_steps: updatedSteps });
  };

  // Remove checklist item (Edit dialog)
  const removeEditChecklistItem = (stepIndex, itemIndex) => {
    const updatedSteps = [...(formData.sop_steps || [])];
    updatedSteps[stepIndex].checklist_items.splice(itemIndex, 1);
    setFormData({ ...formData, sop_steps: updatedSteps });
  };

  // Create dialog SOP step functions
  const addCreateSopStep = () => {
    const newStep = {
      step_number: (createFormData.sop_steps?.length || 0) + 1,
      step_type: 'standard',
      title: '',
      instruction: '',
      safety_note: '',
      parameters: [],
      photo_required: false,
      estimated_duration: '10 minutes',
      reference_images: [],
      checklist_items: []
    };
    setCreateFormData({
      ...createFormData,
      sop_steps: [...(createFormData.sop_steps || []), newStep]
    });
    setExpandedCreateStep((createFormData.sop_steps?.length || 0));
  };

  const removeCreateSopStep = (index) => {
    const updatedSteps = (createFormData.sop_steps || []).filter((_, i) => i !== index);
    // Renumber steps
    updatedSteps.forEach((step, i) => {
      step.step_number = i + 1;
    });
    setCreateFormData({ ...createFormData, sop_steps: updatedSteps });
    setExpandedCreateStep(null);
  };

  const updateCreateSopStep = (index, field, value) => {
    const updatedSteps = [...(createFormData.sop_steps || [])];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    setCreateFormData({ ...createFormData, sop_steps: updatedSteps });
  };

  const addCreateStepParameter = (stepIndex) => {
    const updatedSteps = [...(createFormData.sop_steps || [])];
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
    setCreateFormData({ ...createFormData, sop_steps: updatedSteps });
  };

  const removeCreateStepParameter = (stepIndex, paramIndex) => {
    const updatedSteps = [...(createFormData.sop_steps || [])];
    updatedSteps[stepIndex].parameters = updatedSteps[stepIndex].parameters.filter((_, i) => i !== paramIndex);
    setCreateFormData({ ...createFormData, sop_steps: updatedSteps });
  };

  const updateCreateStepParameter = (stepIndex, paramIndex, field, value) => {
    const updatedSteps = [...(createFormData.sop_steps || [])];
    updatedSteps[stepIndex].parameters[paramIndex] = {
      ...updatedSteps[stepIndex].parameters[paramIndex],
      [field]: value
    };
    setCreateFormData({ ...createFormData, sop_steps: updatedSteps });
  };

  // Insert a new step after a specific index (Create dialog)
  const insertCreateSopStepAfter = (index) => {
    const newStep = {
      step_number: index + 2,
      step_type: 'standard',
      title: '',
      instruction: '',
      safety_note: '',
      parameters: [],
      photo_required: false,
      estimated_duration: '10 minutes',
      reference_images: [],
      checklist_items: []
    };
    
    const updatedSteps = [
      ...(createFormData.sop_steps || []).slice(0, index + 1),
      newStep,
      ...(createFormData.sop_steps || []).slice(index + 1)
    ];
    
    // Renumber all steps
    updatedSteps.forEach((step, i) => {
      step.step_number = i + 1;
    });
    
    setCreateFormData({ ...createFormData, sop_steps: updatedSteps });
    setExpandedCreateStep(index + 1);
    toast.success(`New step inserted after Step ${index + 1}`);
  };

  // Move step up (Create dialog)
  const moveCreateSopStepUp = (index) => {
    if (index === 0) return;
    
    const updatedSteps = [...(createFormData.sop_steps || [])];
    const temp = updatedSteps[index];
    updatedSteps[index] = updatedSteps[index - 1];
    updatedSteps[index - 1] = temp;
    
    // Renumber all steps
    updatedSteps.forEach((step, i) => {
      step.step_number = i + 1;
    });
    
    setCreateFormData({ ...createFormData, sop_steps: updatedSteps });
    setExpandedCreateStep(index - 1);
  };

  // Move step down (Create dialog)
  const moveCreateSopStepDown = (index) => {
    const steps = createFormData.sop_steps || [];
    if (index === steps.length - 1) return;
    
    const updatedSteps = [...steps];
    const temp = updatedSteps[index];
    updatedSteps[index] = updatedSteps[index + 1];
    updatedSteps[index + 1] = temp;
    
    // Renumber all steps
    updatedSteps.forEach((step, i) => {
      step.step_number = i + 1;
    });
    
    setCreateFormData({ ...createFormData, sop_steps: updatedSteps });
    setExpandedCreateStep(index + 1);
  };

  // Toggle step type between standard and checklist (Create dialog)
  const toggleCreateStepType = (stepIndex) => {
    const updatedSteps = [...(createFormData.sop_steps || [])];
    const currentType = updatedSteps[stepIndex].step_type || 'standard';
    const newType = currentType === 'standard' ? 'checklist' : 'standard';
    
    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex],
      step_type: newType,
      checklist_items: newType === 'checklist' ? [] : undefined
    };
    setCreateFormData({ ...createFormData, sop_steps: updatedSteps });
  };

  // Add checklist item to a step (Create dialog)
  const addCreateChecklistItem = (stepIndex) => {
    const updatedSteps = [...(createFormData.sop_steps || [])];
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
    setCreateFormData({ ...createFormData, sop_steps: updatedSteps });
  };

  // Update checklist item (Create dialog)
  const updateCreateChecklistItem = (stepIndex, itemIndex, field, value) => {
    const updatedSteps = [...(createFormData.sop_steps || [])];
    updatedSteps[stepIndex].checklist_items[itemIndex] = {
      ...updatedSteps[stepIndex].checklist_items[itemIndex],
      [field]: value
    };
    setCreateFormData({ ...createFormData, sop_steps: updatedSteps });
  };

  // Remove checklist item (Create dialog)
  const removeCreateChecklistItem = (stepIndex, itemIndex) => {
    const updatedSteps = [...(createFormData.sop_steps || [])];
    updatedSteps[stepIndex].checklist_items.splice(itemIndex, 1);
    setCreateFormData({ ...createFormData, sop_steps: updatedSteps });
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
                  <FlaskConical className="w-6 h-6 text-purple-600" />
                  {canCreateGlobalTests ? 'Global Test Templates' : 'Test Templates'}
                  <Badge className={canCreateGlobalTests ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}>
                    {canCreateGlobalTests ? 'Master' : 'Company Admin'}
                  </Badge>
                </h1>
                <p className="text-sm text-muted-foreground">
                  {canCreateGlobalTests 
                    ? 'Manage global test templates for all companies'
                    : 'View global templates and create company-specific tests for internal use'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Export/Import buttons - Master Admin only */}
              {canCreateGlobalTests && (
                <>
                  <Button variant="outline" size="sm" onClick={openExportDialog}>
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" onClick={openImportDialog}>
                    <Upload className="w-4 h-4 mr-1" />
                    Import
                  </Button>
                </>
              )}
              {canCreateGlobalTests && (
                <Button 
                  variant="outline" 
                  onClick={() => setIsAIGeneratorOpen(true)}
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Generate
                </Button>
              )}
              <Button onClick={handleOpenCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Test
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Filters Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary">{filteredTests.length} of {tests.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search templates..."
                    value={filters.searchText}
                    onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* Category Filter */}
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value === 'all' ? '' : value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {existingCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Asset Type Filter */}
              <div className="space-y-2">
                <Label>Asset Type</Label>
                <Select value={filters.assetType} onValueChange={(value) => setFilters({ ...filters, assetType: value === 'all' ? '' : value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Asset Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Asset Types</SelectItem>
                    {getUniqueAssetTypes().map((assetType) => (
                      <SelectItem key={assetType} value={assetType}>
                        {assetType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Test Mode Filter */}
              <div className="space-y-2">
                <Label>Test Mode</Label>
                <Select value={filters.testMode || 'all'} onValueChange={(value) => setFilters({ ...filters, testMode: value === 'all' ? '' : value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Modes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modes</SelectItem>
                    <SelectItem value="online">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Online
                      </span>
                    </SelectItem>
                    <SelectItem value="offline">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        Offline
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Scope Filter */}
              <div className="space-y-2">
                <Label>Scope</Label>
                <Select value={filters.scope || 'all'} onValueChange={(value) => setFilters({ ...filters, scope: value === 'all' ? '' : value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Scopes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Scopes</SelectItem>
                    <SelectItem value="global">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Global
                      </span>
                    </SelectItem>
                    <SelectItem value="company">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        Company
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Clear Filters & Show Retired Toggle */}
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                  <label className="flex items-center gap-2 text-xs cursor-pointer hover:text-orange-600">
                    <Checkbox
                      checked={filters.showRetired}
                      onCheckedChange={(checked) => setFilters({ ...filters, showRetired: !!checked })}
                      className="h-3 w-3"
                    />
                    <Archive className="w-3 h-3 text-orange-500" />
                    <span>Show Retired</span>
                    {tests.filter(t => t.is_retired).length > 0 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-orange-50 text-orange-700">
                        {tests.filter(t => t.is_retired).length}
                      </Badge>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tests Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Test Templates ({filteredTests.length}{hasActiveFilters && ` of ${tests.length}`})
            </CardTitle>
            <CardDescription>
              {canCreateGlobalTests ? (
                "Global templates that can be customized by individual companies"
              ) : (
                "Global templates and your company-specific tests for internal maintenance"
              )}
              {hasActiveFilters && (
                <span className="ml-2 text-blue-600">• Filtered results shown</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading test templates...</div>
            ) : filteredTests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {hasActiveFilters ? (
                  <div>
                    <p>No test templates match your current filters.</p>
                    <Button 
                      variant="link" 
                      onClick={clearFilters}
                      className="mt-2"
                    >
                      Clear filters to show all templates
                    </Button>
                  </div>
                ) : (
                  "No test templates found"
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Enhanced Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test Details</TableHead>
                      <TableHead>Asset Types</TableHead>
                      <TableHead>Template Info</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTests.map((test) => (
                      <TableRow key={test.test_id} className={test.is_retired ? 'bg-orange-50/50' : ''}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{test.test_code}</span>
                              <Badge variant="outline">{test.category}</Badge>
                              <TestModeBadge mode={test.test_mode || 'offline'} size="sm" />
                              <TestScopeBadge scope={test.scope || 'global'} size="sm" />
                              {test.is_retired && (
                                <Badge className="bg-orange-500 text-white text-[10px] flex items-center gap-1">
                                  <Archive className="w-3 h-3" />
                                  Retired
                                </Badge>
                              )}
                            </div>
                            <div className={`text-sm font-medium ${test.is_retired ? 'text-gray-500' : 'text-gray-900'}`}>{test.name}</div>
                            {test.description && (
                              <div className="text-xs text-gray-500 max-w-md truncate">
                                {test.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {test.applicable_asset_types && test.applicable_asset_types.length > 0 ? (
                              test.applicable_asset_types.map((assetType, index) => (
                                <Badge 
                                  key={index} 
                                  variant="secondary" 
                                  className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                                  onClick={() => setFilters({ ...filters, assetType: assetType })}
                                  title={`Filter by ${assetType}`}
                                >
                                  #{assetType.replace(/\s+/g, '')}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400">No asset types</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-gray-500 space-y-1">
                            <div>Parameters: {test.parameters?.length || 0}</div>
                            <div>Equipment: {test.equipment?.length || 0}</div>
                            <div>Standards: {test.applicable_standards?.length || 0}</div>
                            <div className="flex items-center gap-1">
                              <ListOrdered className="w-3 h-3" />
                              SOP Steps: {test.sop_steps?.length || 0}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Restore button for retired templates */}
                            {test.is_retired ? (
                              <>
                                {canDeleteTest(test) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRestoreTest(test)}
                                    title="Restore Template"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  >
                                    <ArchiveRestore className="w-4 h-4" />
                                  </Button>
                                )}
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenRenameDialog(test)}
                                  title="Rename Template"
                                  disabled={!canCreateGlobalTests && (test.scope || 'global') === 'global'}
                                >
                                  <FileText className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenDuplicateDialog(test)}
                                  title="Duplicate Template"
                                >
                                  <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(test)}
                              title="Edit Template"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {canDeleteTest(test) && (
                              <>
                                {/* Retire Button - Orange */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRetireTest(test)}
                                  title="Retire Template (preserves historical data)"
                                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                >
                                  <Archive className="w-4 h-4" />
                                </Button>
                                {/* Delete Button - Red (for permanent deletion) */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteTest(test)}
                                  title={
                                    (test.scope || 'global') === 'global'
                                      ? "Delete Global Template"
                                      : "Delete Company Template"
                                  }
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Global Template: {selectedTest?.name}</DialogTitle>
            <DialogDescription>
              Changes will notify all companies that have customized this template. Use suggestions panel for quick additions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex gap-4">
            {/* Main Form - Left Side */}
            <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-4">
            
            {/* Test Mode Section */}
            <div className="space-y-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <Label className="text-lg font-semibold">Test Mode</Label>
              <p className="text-sm text-muted-foreground">
                Select whether this test is performed on live (Online) or de-energized (Offline) equipment.
              </p>
              <TestModeSelector
                value={formData.test_mode || 'offline'}
                onChange={(mode) => setFormData({ ...formData, test_mode: mode })}
              />
            </div>
            
            {/* Template Scope Section - Only editable by Master Admin */}
            {canCreateGlobalTests && (
              <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Label className="text-lg font-semibold flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  Template Visibility Scope
                </Label>
                <p className="text-sm text-muted-foreground">
                  Change whether this test template is available to all companies (Global) or only to a specific company (Company-specific).
                </p>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={(formData.scope || selectedTest?.scope || 'global') === 'global' ? 'default' : 'outline'}
                    className={`flex-1 flex items-center justify-center gap-2 h-12 ${
                      (formData.scope || selectedTest?.scope || 'global') === 'global' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'hover:bg-blue-50 border-blue-200'
                    }`}
                    onClick={() => setFormData({ ...formData, scope: 'global' })}
                  >
                    <Globe className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">Global</div>
                      <div className="text-xs opacity-80">All companies & Sales Orders</div>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant={(formData.scope || selectedTest?.scope || 'global') === 'company' ? 'default' : 'outline'}
                    className={`flex-1 flex items-center justify-center gap-2 h-12 ${
                      (formData.scope || selectedTest?.scope || 'global') === 'company' 
                        ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                        : 'hover:bg-purple-50 border-purple-200'
                    }`}
                    onClick={() => setFormData({ ...formData, scope: 'company' })}
                  >
                    <Building2 className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">Company-Specific</div>
                      <div className="text-xs opacity-80">Internal use only</div>
                    </div>
                  </Button>
                </div>
                {(formData.scope || selectedTest?.scope || 'global') === 'company' && (
                  <p className="text-xs text-purple-600 flex items-center gap-1 mt-2">
                    <Building2 className="w-3 h-3" />
                    This template will be available only for internal company maintenance activities
                  </p>
                )}
              </div>
            )}
            
            {/* Default Report Template Section */}
            <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Label className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Default Report Template
              </Label>
              <p className="text-sm text-muted-foreground">
                Select a report template to be used by default when generating reports for this test.
              </p>
              <Select
                value={selectedReportTemplateId || 'none'}
                onValueChange={(value) => handleReportTemplateChange(value === 'none' ? '' : value)}
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Select a report template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No default template</SelectItem>
                  {reportTemplates.map((template) => (
                    <SelectItem key={template.template_id} value={template.template_id}>
                      {template.template_name}
                      {template.is_default && <Badge variant="outline" className="ml-2 text-xs">Default</Badge>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedReportTemplateId && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Reports generated from this test will use this template automatically
                </p>
              )}
            </div>

            {/* Display Configuration Section */}
            <div className="space-y-3">
              <DisplayConfigEditor
                config={formData.display_config || {}}
                parameters={(formData.parameters || []).map(p => p.name)}
                onChange={(newConfig) => setFormData({ ...formData, display_config: newConfig })}
              />
            </div>

            {/* Parameters Section */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold">Parameters</Label>
              
              {/* Add New Parameter */}
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <Label className="text-sm font-medium text-gray-700 mb-3 block">Add New Parameter</Label>
                <div className="grid grid-cols-4 gap-2">
                  <Input
                    value={editNewParameter.name}
                    onChange={(e) => setEditNewParameter({ ...editNewParameter, name: e.target.value })}
                    placeholder="Parameter name"
                  />
                  <Input
                    value={editNewParameter.limit}
                    onChange={(e) => setEditNewParameter({ ...editNewParameter, limit: e.target.value })}
                    placeholder="Limit/Range"
                  />
                  <Input
                    value={editNewParameter.unit}
                    onChange={(e) => setEditNewParameter({ ...editNewParameter, unit: e.target.value })}
                    placeholder="Unit"
                  />
                  <Button onClick={addEditParameter} size="sm" type="button">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Existing Parameters */}
              {formData.parameters.map((param, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="grid grid-cols-3 gap-3 flex-1">
                        <div>
                          <Label>Parameter Name</Label>
                          <Input
                            value={param.name}
                            onChange={(e) => updateParameter(index, 'name', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Limit</Label>
                          <Input
                            value={param.limit}
                            onChange={(e) => updateParameter(index, 'limit', e.target.value)}
                            disabled={param.use_multi_level}
                            className={param.use_multi_level ? 'opacity-40 bg-muted' : ''}
                            placeholder={param.use_multi_level ? 'Using multi-level' : 'Enter limit'}
                          />
                        </div>
                        <div>
                          <Label>Unit</Label>
                          <Input
                            value={param.unit}
                            onChange={(e) => updateParameter(index, 'unit', e.target.value)}
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEditParameter(index)}
                        title="Remove Parameter"
                        className="mt-6"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                    
                    {/* Multi-Level Limits Section */}
                    <div className="pt-2 border-t">
                      <MultiLevelLimitsEditor
                        parameter={param}
                        unit={param.unit}
                        onUpdate={(updatedParam) => {
                          const updated = [...formData.parameters];
                          updated[index] = { ...updated[index], ...updatedParam };
                          setFormData({ ...formData, parameters: updated });
                        }}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Equipment Section */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold flex items-center gap-2">
                Equipment
                <Badge variant="outline" className="text-xs font-normal">
                  <ImagePlus className="w-3 h-3 mr-1" />
                  Images supported
                </Badge>
              </Label>
              <div className="flex gap-2">
                <Input
                  value={editNewEquipment}
                  onChange={(e) => setEditNewEquipment(e.target.value)}
                  placeholder="Add equipment..."
                  onKeyPress={(e) => e.key === 'Enter' && addEditEquipment()}
                />
                <Button onClick={addEditEquipment} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {formData.equipment.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded border">
                    <ReferenceImageUpload
                      imageUrl={getEquipmentImage(item)}
                      onImageChange={(url) => updateEquipmentImage(index, url)}
                      category="equipment"
                      testId={selectedTest?.test_id}
                      size="small"
                    />
                    <span className="flex-1">{getEquipmentName(item)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEquipment(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Standards Section */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold">Applicable Standards</Label>
              <div className="flex gap-2">
                <Input
                  value={editNewStandard}
                  onChange={(e) => setEditNewStandard(e.target.value)}
                  placeholder="Add standard..."
                  onKeyPress={(e) => e.key === 'Enter' && addEditStandard()}
                />
                <Button onClick={addEditStandard} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {formData.applicable_standards.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>{item}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStandard(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Precautions Section */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold flex items-center gap-2">
                Safety Precautions
                <Badge variant="outline" className="text-xs font-normal">
                  <ImagePlus className="w-3 h-3 mr-1" />
                  Images supported
                </Badge>
              </Label>
              <div className="flex gap-2">
                <Input
                  value={editNewSafety}
                  onChange={(e) => setEditNewSafety(e.target.value)}
                  placeholder="Add safety precaution..."
                  onKeyPress={(e) => e.key === 'Enter' && addEditSafety()}
                />
                <Button onClick={addEditSafety} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {formData.safety_precautions.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-red-50 rounded border border-red-200">
                    <ReferenceImageUpload
                      imageUrl={getSafetyImage(item)}
                      onImageChange={(url) => updateSafetyImage(index, url)}
                      category="safety"
                      testId={selectedTest?.test_id}
                      size="small"
                    />
                    <span className="flex-1">{getSafetyText(item)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSafety(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* SOP Steps Section */}
            <div className="space-y-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-lg font-semibold flex items-center gap-2">
                    <ListOrdered className="w-5 h-5 text-amber-600" />
                    SOP Steps ({formData.sop_steps?.length || 0})
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Drag steps to reorder or use arrow buttons
                  </p>
                </div>
                <Button onClick={addEditSopStep} size="sm" variant="outline" className="border-amber-300 hover:bg-amber-100">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Step
                </Button>
              </div>
              
              {/* SOP Steps List with Drag and Drop */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleEditDragEnd}
              >
                <SortableContext
                  items={(formData.sop_steps || []).map(s => `edit-step-${s.step_number}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {(formData.sop_steps || []).map((step, stepIndex) => (
                      <SortableEditStepCard
                        key={`edit-step-${step.step_number}`}
                        step={step}
                        stepIndex={stepIndex}
                        stepsCount={formData.sop_steps?.length || 0}
                        expandedStep={expandedEditStep}
                        setExpandedStep={setExpandedEditStep}
                        moveStepUp={moveEditSopStepUp}
                        moveStepDown={moveEditSopStepDown}
                        insertStepAfter={insertEditSopStepAfter}
                        removeStep={removeEditSopStep}
                        updateStep={updateEditSopStep}
                        updateStepParameter={updateEditStepParameter}
                        addStepParameter={addEditStepParameter}
                        removeStepParameter={removeEditStepParameter}
                        updateStepReferenceImages={updateEditStepReferenceImages}
                        toggleStepType={toggleEditStepType}
                        addChecklistItem={addEditChecklistItem}
                        updateChecklistItem={updateEditChecklistItem}
                        removeChecklistItem={removeEditChecklistItem}
                        selectedTest={selectedTest}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              
              {(!formData.sop_steps || formData.sop_steps.length === 0) && (
                <div className="text-center py-6 text-muted-foreground">
                  <GripVertical className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No SOP steps defined</p>
                  <p className="text-xs">Click "Add Step" to create step-by-step procedures</p>
                </div>
              )}
            </div>
          </div>

          {/* Suggestions Side Panel - Right Side */}
          <div className="w-96 border-l pl-4 overflow-y-auto py-4">
            <div className="sticky top-0 bg-background pb-3 border-b mb-3">
              <h3 className="font-semibold text-lg mb-2">💡 Test Suggestions</h3>
              <p className="text-xs text-muted-foreground mb-3">Click to add to template</p>
              
              {/* Tab Navigation - 2x2 Grid */}
              <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-lg mb-3">
                <button
                  type="button"
                  onClick={() => setActiveSuggestionTab('parameters')}
                  className={`px-2 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1 ${
                    activeSuggestionTab === 'parameters'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Params
                  {suggestions.test_parameters?.length > 0 && (
                    <span className="text-[10px] bg-blue-100 text-blue-600 px-1 rounded-full">
                      {suggestions.test_parameters.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSuggestionTab('equipment')}
                  className={`px-2 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1 ${
                    activeSuggestionTab === 'equipment'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Equip
                  {suggestions.equipment?.length > 0 && (
                    <span className="text-[10px] bg-green-100 text-green-600 px-1 rounded-full">
                      {suggestions.equipment.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSuggestionTab('standards')}
                  className={`px-2 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1 ${
                    activeSuggestionTab === 'standards'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Stds
                  {suggestions.standards?.length > 0 && (
                    <span className="text-[10px] bg-purple-100 text-purple-600 px-1 rounded-full">
                      {suggestions.standards.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSuggestionTab('safety')}
                  className={`px-2 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1 ${
                    activeSuggestionTab === 'safety'
                      ? 'bg-white text-red-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Safety
                  {suggestions.safety?.length > 0 && (
                    <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded-full">
                      {suggestions.safety.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
            
            {/* Tab Content */}
            <div className="space-y-2">
              {/* Parameters Tab - Chip/Hashtag Style */}
              {activeSuggestionTab === 'parameters' && (
                <>
                  {suggestions.test_parameters && suggestions.test_parameters.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions.test_parameters.map((param, index) => (
                        <button
                          key={index}
                          onClick={() => addEditParameterFromSuggestion(param)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full text-[11px] border border-blue-200 hover:border-blue-400 transition-all cursor-pointer group"
                          type="button"
                          title={`${param.name}: ${param.limit} ${param.unit} - Click to add`}
                        >
                          <span className="font-medium truncate max-w-[120px]">{param.name}</span>
                          <span className="text-blue-500 text-[10px] hidden group-hover:inline">+</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground text-sm p-4">
                      <p>No parameter suggestions available</p>
                    </div>
                  )}
                </>
              )}
              
              {/* Equipment Tab - Chip Style */}
              {activeSuggestionTab === 'equipment' && (
                <>
                  {suggestions.equipment && suggestions.equipment.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions.equipment.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => addEditEquipmentFromSuggestion(item)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-full text-[11px] border border-green-200 hover:border-green-400 transition-all cursor-pointer group"
                          type="button"
                          title={`${item} - Click to add`}
                        >
                          <span className="font-medium truncate max-w-[140px]">{item}</span>
                          <span className="text-green-500 text-[10px] hidden group-hover:inline">+</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground text-sm p-4">
                      <p>No equipment suggestions available</p>
                    </div>
                  )}
                </>
              )}
              
              {/* Standards Tab - Chip Style */}
              {activeSuggestionTab === 'standards' && (
                <>
                  {suggestions.standards && suggestions.standards.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions.standards.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => addEditStandardFromSuggestion(item)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-full text-[11px] border border-purple-200 hover:border-purple-400 transition-all cursor-pointer group"
                          type="button"
                          title={`${item} - Click to add`}
                        >
                          <span className="font-medium truncate max-w-[160px]">{item}</span>
                          <span className="text-purple-500 text-[10px] hidden group-hover:inline">+</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground text-sm p-4">
                      <p>No standard suggestions available</p>
                    </div>
                  )}
                </>
              )}
              
              {/* Safety Tab - Compact List (longer text) */}
              {activeSuggestionTab === 'safety' && (
                <>
                  {suggestions.safety && suggestions.safety.length > 0 ? (
                    <div className="space-y-1">
                      {suggestions.safety.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => addEditSafetyFromSuggestion(item)}
                          className="w-full text-left px-2 py-1.5 hover:bg-red-50 rounded text-[11px] border border-transparent hover:border-red-200 transition-colors group flex items-start gap-1"
                          type="button"
                        >
                          <span className="text-red-400 mt-0.5">•</span>
                          <span className="flex-1 text-gray-700 group-hover:text-red-700">{item}</span>
                          <span className="text-red-500 text-[10px] hidden group-hover:inline">+</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground text-sm p-4">
                      <p>No safety suggestions available</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateTest}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Test Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Create New Test Template
              {!canCreateGlobalTests && (
                <TestScopeBadge scope="company" size="sm" />
              )}
            </DialogTitle>
            <DialogDescription>
              {canCreateGlobalTests ? (
                "Create a new global test template. Use suggestions panel on the right for quick additions."
              ) : (
                <span className="flex items-center gap-2">
                  <span className="text-purple-600 font-medium">Company-Specific Test:</span>
                  This test will only be available within your company for internal maintenance activities. It will NOT appear in Sales Orders.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex gap-4">
            {/* Main Form - Left Side */}
            <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="test_code">Test Code *</Label>
                <Input
                  id="test_code"
                  value={createFormData.test_code}
                  onChange={(e) => setCreateFormData({ ...createFormData, test_code: e.target.value })}
                  placeholder="e.g., IR-THERMO-001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test_name">Test Name *</Label>
                <Input
                  id="test_name"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  placeholder="e.g., Infrared Thermography"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {categoryInputValue || "Select category or type new..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search categories or type new..."
                        value={categoryInputValue}
                        onValueChange={handleCategoryInputChange}
                      />
                      <CommandEmpty>
                        <div className="p-2">
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => handleCategorySelect(categoryInputValue)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Create "{categoryInputValue}"
                          </Button>
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {existingCategories.map((category) => (
                          <CommandItem
                            key={category}
                            value={category}
                            onSelect={() => handleCategorySelect(category)}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                categoryInputValue === category ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            {category}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                {categoryInputValue && !existingCategories.includes(categoryInputValue) && (
                  <p className="text-xs text-blue-600">
                    ✨ New category "{categoryInputValue}" will be created
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="test_type">Test Type</Label>
                <Input
                  id="test_type"
                  value={createFormData.test_type}
                  onChange={(e) => setCreateFormData({ ...createFormData, test_type: e.target.value })}
                  placeholder="e.g., thermal, resistance, pd"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={createFormData.description}
                onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                placeholder="Describe the test purpose and methodology"
              />
            </div>

            {/* Test Mode Selection */}
            <div className="space-y-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <Label className="text-lg font-semibold">Test Mode *</Label>
              <p className="text-sm text-muted-foreground">
                Select whether this test is performed on live (Online) or de-energized (Offline) equipment.
              </p>
              <TestModeSelector
                value={createFormData.test_mode}
                onChange={(mode) => setCreateFormData({ ...createFormData, test_mode: mode })}
              />
            </div>

            {/* Template Scope Selection - Only visible to Master Admin */}
            {canCreateGlobalTests && (
              <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Label className="text-lg font-semibold flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  Template Visibility Scope *
                </Label>
                <p className="text-sm text-muted-foreground">
                  Choose whether this test template is available to all companies (Global) or only to a specific company (Company-specific).
                </p>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={createFormData.scope === 'global' ? 'default' : 'outline'}
                    className={`flex-1 flex items-center justify-center gap-2 h-12 ${
                      createFormData.scope === 'global' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'hover:bg-blue-50 border-blue-200'
                    }`}
                    onClick={() => setCreateFormData({ ...createFormData, scope: 'global' })}
                  >
                    <Globe className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">Global</div>
                      <div className="text-xs opacity-80">All companies & Sales Orders</div>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant={createFormData.scope === 'company' ? 'default' : 'outline'}
                    className={`flex-1 flex items-center justify-center gap-2 h-12 ${
                      createFormData.scope === 'company' 
                        ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                        : 'hover:bg-purple-50 border-purple-200'
                    }`}
                    onClick={() => setCreateFormData({ ...createFormData, scope: 'company' })}
                  >
                    <Building2 className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">Company-Specific</div>
                      <div className="text-xs opacity-80">Internal use only</div>
                    </div>
                  </Button>
                </div>
                {createFormData.scope === 'company' && (
                  <p className="text-xs text-purple-600 flex items-center gap-1 mt-2">
                    <Building2 className="w-3 h-3" />
                    This template will be available only for internal company maintenance activities
                  </p>
                )}
              </div>
            )}

            {/* Applicable Asset Types - Smart Selector */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold">Applicable Asset Types *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {selectedAssetTypes.length > 0 
                      ? `${selectedAssetTypes.length} asset type${selectedAssetTypes.length > 1 ? 's' : ''} selected`
                      : "Select asset types or create new..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search asset types or type new..."
                      value={assetTypeInputValue}
                      onValueChange={handleAssetTypeInputChange}
                    />
                    <CommandEmpty>
                      <div className="p-2">
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => createNewAssetType(assetTypeInputValue)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create "{assetTypeInputValue}"
                        </Button>
                      </div>
                    </CommandEmpty>
                    <CommandGroup>
                      {availableAssetTypes
                        .filter(assetType => !selectedAssetTypes.includes(assetType.name))
                        .map((assetType) => (
                        <CommandItem
                          key={assetType.asset_type_id}
                          value={assetType.name}
                          onSelect={() => handleAssetTypeSelect(assetType.name)}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 opacity-0`}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{assetType.name}</div>
                            {assetType.category && (
                              <div className="text-xs text-muted-foreground">{assetType.category}</div>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              
              {/* Selected Asset Types */}
              {selectedAssetTypes.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Selected Asset Types:</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedAssetTypes.map((assetType, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {assetType}
                        <button
                          onClick={() => removeSelectedAssetType(assetType)}
                          className="ml-1 hover:text-red-600"
                          type="button"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Parameters Section */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold">Test Parameters</Label>
              <div className="grid grid-cols-4 gap-2">
                <Input
                  value={createNewParameter.name}
                  onChange={(e) => setCreateNewParameter({ ...createNewParameter, name: e.target.value })}
                  placeholder="Parameter name"
                />
                <Input
                  value={createNewParameter.limit}
                  onChange={(e) => setCreateNewParameter({ ...createNewParameter, limit: e.target.value })}
                  placeholder="Limit/Range"
                />
                <Input
                  value={createNewParameter.unit}
                  onChange={(e) => setCreateNewParameter({ ...createNewParameter, unit: e.target.value })}
                  placeholder="Unit"
                />
                <Button onClick={addCreateParameter} size="sm" type="button">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {createFormData.parameters.map((param, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="grid grid-cols-3 gap-3 flex-1">
                        <span className="font-medium">{param.name}</span>
                        <span>{param.limit}</span>
                        <span>{param.unit}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCreateParameter(index)}
                        type="button"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Equipment Section */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold flex items-center gap-2">
                Required Equipment
                <Badge variant="outline" className="text-xs font-normal">
                  <ImagePlus className="w-3 h-3 mr-1" />
                  Images supported
                </Badge>
              </Label>
              <div className="flex gap-2">
                <Input
                  value={createNewEquipment}
                  onChange={(e) => setCreateNewEquipment(e.target.value)}
                  placeholder="Add equipment..."
                  onKeyPress={(e) => e.key === 'Enter' && addCreateEquipment()}
                />
                <Button onClick={addCreateEquipment} size="sm" type="button">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {createFormData.equipment.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded border">
                    <ReferenceImageUpload
                      imageUrl={getEquipmentImage(item)}
                      onImageChange={(url) => updateCreateEquipmentImage(index, url)}
                      category="equipment"
                      size="small"
                    />
                    <span className="flex-1">{getEquipmentName(item)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCreateEquipment(index)}
                      type="button"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Standards Section */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold">Applicable Standards</Label>
              <div className="flex gap-2">
                <Input
                  value={createNewStandard}
                  onChange={(e) => setCreateNewStandard(e.target.value)}
                  placeholder="Add standard (e.g., IEEE 62.2, NETA ATS-2021)..."
                  onKeyPress={(e) => e.key === 'Enter' && addCreateStandard()}
                />
                <Button onClick={addCreateStandard} size="sm" type="button">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {createFormData.applicable_standards.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>{item}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCreateStandard(index)}
                      type="button"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Precautions Section */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold flex items-center gap-2">
                Safety Precautions
                <Badge variant="outline" className="text-xs font-normal">
                  <ImagePlus className="w-3 h-3 mr-1" />
                  Images supported
                </Badge>
              </Label>
              <div className="flex gap-2">
                <Input
                  value={createNewSafety}
                  onChange={(e) => setCreateNewSafety(e.target.value)}
                  placeholder="Add safety precaution..."
                  onKeyPress={(e) => e.key === 'Enter' && addCreateSafety()}
                />
                <Button onClick={addCreateSafety} size="sm" type="button">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {createFormData.safety_precautions.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-red-50 rounded border border-red-200">
                    <ReferenceImageUpload
                      imageUrl={getSafetyImage(item)}
                      onImageChange={(url) => updateCreateSafetyImage(index, url)}
                      category="safety"
                      size="small"
                    />
                    <span className="flex-1 text-red-900">{getSafetyText(item)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCreateSafety(index)}
                      type="button"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* SOP Steps Section for Create */}
            <div className="space-y-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-lg font-semibold flex items-center gap-2">
                    <ListOrdered className="w-5 h-5 text-amber-600" />
                    SOP Steps ({createFormData.sop_steps?.length || 0})
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Drag steps to reorder or use arrow buttons
                  </p>
                </div>
                <Button onClick={addCreateSopStep} size="sm" variant="outline" className="border-amber-300 hover:bg-amber-100" type="button">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Step
                </Button>
              </div>
              
              {/* SOP Steps List with Drag and Drop */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleCreateDragEnd}
              >
                <SortableContext
                  items={(createFormData.sop_steps || []).map(s => `create-step-${s.step_number}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {(createFormData.sop_steps || []).map((step, stepIndex) => (
                      <SortableCreateStepCard
                        key={`create-step-${step.step_number}`}
                        step={step}
                        stepIndex={stepIndex}
                        stepsCount={createFormData.sop_steps?.length || 0}
                        expandedStep={expandedCreateStep}
                        setExpandedStep={setExpandedCreateStep}
                        moveStepUp={moveCreateSopStepUp}
                        moveStepDown={moveCreateSopStepDown}
                        insertStepAfter={insertCreateSopStepAfter}
                        removeStep={removeCreateSopStep}
                        updateStep={updateCreateSopStep}
                        updateStepParameter={updateCreateStepParameter}
                        addStepParameter={addCreateStepParameter}
                        removeStepParameter={removeCreateStepParameter}
                        updateStepReferenceImages={updateCreateStepReferenceImages}
                        toggleStepType={toggleCreateStepType}
                        addChecklistItem={addCreateChecklistItem}
                        updateChecklistItem={updateCreateChecklistItem}
                        removeChecklistItem={removeCreateChecklistItem}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              
              {(!createFormData.sop_steps || createFormData.sop_steps.length === 0) && (
                <div className="text-center py-6 text-muted-foreground">
                  <GripVertical className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No SOP steps defined</p>
                  <p className="text-xs">Click "Add Step" to create step-by-step procedures</p>
                </div>
              )}
            </div>
          </div>

          {/* Suggestions Side Panel - Right Side */}
          <div className="w-96 border-l pl-4 overflow-y-auto py-4">
            <div className="sticky top-0 bg-background pb-3 border-b mb-3">
              <h3 className="font-semibold text-lg mb-2">💡 Test Suggestions</h3>
              <p className="text-xs text-muted-foreground mb-3">Click to add to template</p>
              
              {/* Tab Navigation - 2x2 Grid */}
              <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-lg mb-3">
                <button
                  type="button"
                  onClick={() => setActiveSuggestionTab('parameters')}
                  className={`px-2 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1 ${
                    activeSuggestionTab === 'parameters'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Params
                  {suggestions.test_parameters?.length > 0 && (
                    <span className="text-[10px] bg-blue-100 text-blue-600 px-1 rounded-full">
                      {suggestions.test_parameters.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSuggestionTab('equipment')}
                  className={`px-2 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1 ${
                    activeSuggestionTab === 'equipment'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Equip
                  {suggestions.equipment?.length > 0 && (
                    <span className="text-[10px] bg-green-100 text-green-600 px-1 rounded-full">
                      {suggestions.equipment.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSuggestionTab('standards')}
                  className={`px-2 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1 ${
                    activeSuggestionTab === 'standards'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Stds
                  {suggestions.standards?.length > 0 && (
                    <span className="text-[10px] bg-purple-100 text-purple-600 px-1 rounded-full">
                      {suggestions.standards.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSuggestionTab('safety')}
                  className={`px-2 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1 ${
                    activeSuggestionTab === 'safety'
                      ? 'bg-white text-red-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Safety
                  {suggestions.safety?.length > 0 && (
                    <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded-full">
                      {suggestions.safety.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
            
            {/* Tab Content */}
            <div className="space-y-2">
              {/* Parameters Tab - Chip/Hashtag Style */}
              {activeSuggestionTab === 'parameters' && (
                <>
                  {suggestions.test_parameters && suggestions.test_parameters.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions.test_parameters.map((param, index) => (
                        <button
                          key={index}
                          onClick={() => addParameterFromSuggestion(param)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full text-[11px] border border-blue-200 hover:border-blue-400 transition-all cursor-pointer group"
                          type="button"
                          title={`${param.name}: ${param.limit} ${param.unit} - Click to add`}
                        >
                          <span className="font-medium truncate max-w-[120px]">{param.name}</span>
                          <span className="text-blue-500 text-[10px] hidden group-hover:inline">+</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground text-sm p-4">
                      <p>No parameter suggestions available</p>
                    </div>
                  )}
                </>
              )}
              
              {/* Equipment Tab - Chip Style */}
              {activeSuggestionTab === 'equipment' && (
                <>
                  {suggestions.equipment && suggestions.equipment.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions.equipment.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => addEquipmentFromSuggestion(item)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-full text-[11px] border border-green-200 hover:border-green-400 transition-all cursor-pointer group"
                          type="button"
                          title={`${item} - Click to add`}
                        >
                          <span className="font-medium truncate max-w-[140px]">{item}</span>
                          <span className="text-green-500 text-[10px] hidden group-hover:inline">+</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground text-sm p-4">
                      <p>No equipment suggestions available</p>
                    </div>
                  )}
                </>
              )}
              
              {/* Standards Tab - Chip Style */}
              {activeSuggestionTab === 'standards' && (
                <>
                  {suggestions.standards && suggestions.standards.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions.standards.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => addStandardFromSuggestion(item)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-full text-[11px] border border-purple-200 hover:border-purple-400 transition-all cursor-pointer group"
                          type="button"
                          title={`${item} - Click to add`}
                        >
                          <span className="font-medium truncate max-w-[160px]">{item}</span>
                          <span className="text-purple-500 text-[10px] hidden group-hover:inline">+</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground text-sm p-4">
                      <p>No standard suggestions available</p>
                    </div>
                  )}
                </>
              )}
              
              {/* Safety Tab - Compact List */}
              {activeSuggestionTab === 'safety' && (
                <>
                  {suggestions.safety && suggestions.safety.length > 0 ? (
                    <div className="space-y-1">
                      {suggestions.safety.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => addSafetyFromSuggestion(item)}
                          className="w-full text-left px-2 py-1.5 hover:bg-red-50 rounded text-[11px] border border-transparent hover:border-red-200 transition-colors group flex items-start gap-1"
                          type="button"
                        >
                          <span className="text-red-400 mt-0.5">•</span>
                          <span className="flex-1 text-gray-700 group-hover:text-red-700">{item}</span>
                          <span className="text-red-500 text-[10px] hidden group-hover:inline">+</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground text-sm p-4">
                      <p>No safety suggestions available</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                resetCreateForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateTest} type="button">
              Create Test Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Dialog */}
      <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="w-5 h-5 text-primary" />
              Duplicate Test Template
            </DialogTitle>
            <DialogDescription>
              Create a copy of &quot;{testToDuplicate?.name}&quot; with a new name
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="duplicate_name">New Test Name *</Label>
              <Input
                id="duplicate_name"
                placeholder="Enter name for the duplicated test"
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duplicate_code">Test Code *</Label>
              <Input
                id="duplicate_code"
                placeholder="Enter unique test code"
                value={duplicateCode}
                onChange={(e) => setDuplicateCode(e.target.value)}
              />
            </div>
            <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
              The duplicated test will inherit all parameters, equipment, standards, safety precautions, and SOP steps from the original.
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDuplicateDialogOpen(false);
                setTestToDuplicate(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDuplicateTest}
              disabled={!duplicateName.trim() || !duplicateCode.trim()}
            >
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Rename Test Template
            </DialogTitle>
            <DialogDescription>
              Change the name of this test template
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new_test_name">Test Name *</Label>
              <Input
                id="new_test_name"
                placeholder="Enter new name"
                value={newTestName}
                onChange={(e) => setNewTestName(e.target.value)}
              />
            </div>
            {testToRename && (testToRename.scope || 'global') === 'global' && !canCreateGlobalTests && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm text-yellow-800">
                <strong>Note:</strong> Only Master Admin can rename global test templates.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRenameDialogOpen(false);
                setTestToRename(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRenameTest}
              disabled={!newTestName.trim() || (testToRename && (testToRename.scope || 'global') === 'global' && !canCreateGlobalTests)}
            >
              Save Name
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Templates Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Export Test Templates
            </DialogTitle>
            <DialogDescription>
              Select templates to export as a JSON file for backup or deployment.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2 flex-1 overflow-hidden flex flex-col">
            {exportTemplatesList.length > 0 ? (
              <div className="space-y-3 flex flex-col flex-1 overflow-hidden">
                {/* Selection Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-700">Selected for Export</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      {selectedExportTemplates.size} of {exportTemplatesList.length}
                    </Badge>
                  </div>
                </div>
                
                {/* Filter by Asset Type */}
                <div className="space-y-1 flex-shrink-0">
                  <Label className="text-xs">Filter by Asset Type</Label>
                  <Select value={exportAssetTypeFilter} onValueChange={setExportAssetTypeFilter}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="All Asset Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Asset Types</SelectItem>
                      {exportAssetTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Select All / Deselect All */}
                <div className="flex items-center justify-between flex-shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {filteredExportTemplates.length} templates {exportAssetTypeFilter !== 'all' ? `for ${exportAssetTypeFilter}` : 'shown'}
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-6 text-xs px-2"
                      onClick={selectAllExportTemplates}
                      disabled={allVisibleSelected}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Select All
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-6 text-xs px-2"
                      onClick={deselectAllExportTemplates}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Deselect All
                    </Button>
                  </div>
                </div>
                
                {/* Template List with Checkboxes */}
                <div className="border rounded-lg flex-1 overflow-y-auto min-h-0">
                  {filteredExportTemplates.length > 0 ? (
                    filteredExportTemplates.map((template, idx) => {
                      const templateId = template.test_id || template.template_id || template.test_code;
                      const isSelected = selectedExportTemplates.has(templateId);
                      return (
                        <div 
                          key={templateId || idx}
                          className={`flex items-center gap-3 px-3 py-1.5 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
                          onClick={() => toggleExportTemplate(templateId)}
                        >
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              toggleExportTemplate(templateId);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">
                                {template.name || template.template_name}
                              </span>
                              {template.scope === 'company' && (
                                <Building2 className="w-3 h-3 text-purple-500 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{template.test_code || template.template_code || 'No code'}</span>
                              {template.category && <span>• {template.category}</span>}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {(template.applicable_asset_types || []).slice(0, 2).map(at => (
                              <Badge key={at} variant="outline" className="text-[10px] ml-1">
                                {at}
                              </Badge>
                            ))}
                            {(template.applicable_asset_types || []).length > 2 && (
                              <Badge variant="outline" className="text-[10px] ml-1">
                                +{(template.applicable_asset_types || []).length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No templates match the selected asset type
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground flex-shrink-0">
                  The export file can be imported into any DMS Insight deployment.
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileJson className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Loading templates...</p>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleExport}
              disabled={isExporting || selectedExportTemplates.size === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isExporting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export {selectedExportTemplates.size} Template{selectedExportTemplates.size !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Templates Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-green-600" />
              Import Test Templates
            </DialogTitle>
            <DialogDescription>
              Import test templates from a previously exported JSON file.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* File Input */}
            <div className="space-y-2">
              <Label>Select Export File</Label>
              <Input
                type="file"
                accept=".json"
                onChange={handleImportFileChange}
                className="cursor-pointer"
              />
            </div>
            
            {/* Import Preview */}
            {importData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-700">File Preview</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    {importData.templates?.length || 0} templates
                  </Badge>
                </div>
                
                <div className="text-xs text-green-600 space-y-1">
                  <p>Export Date: {importData.export_date ? new Date(importData.export_date).toLocaleDateString() : 'N/A'}</p>
                  <p>Exported By: {importData.exported_by || 'Unknown'}</p>
                </div>
                
                {/* Template list preview */}
                {importData.templates && importData.templates.length > 0 && (
                  <div className="max-h-32 overflow-y-auto space-y-1 mt-2">
                    {importData.templates.slice(0, 5).map((t, idx) => (
                      <div key={idx} className="text-xs py-1 px-2 bg-white rounded border border-green-100 flex justify-between">
                        <span className="truncate">{t.name || t.template_name}</span>
                        <span className="text-muted-foreground">{t.template_code || t.test_code}</span>
                      </div>
                    ))}
                    {importData.templates.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center">
                        ...and {importData.templates.length - 5} more
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Import Mode */}
            {importData && (
              <div className="space-y-2">
                <Label>Import Mode</Label>
                <Select value={importMode} onValueChange={setImportMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="append">
                      <div className="flex flex-col">
                        <span>Append (Skip Existing)</span>
                        <span className="text-xs text-muted-foreground">Add new templates, skip if code exists</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="replace">
                      <div className="flex flex-col">
                        <span>Replace (Update Existing)</span>
                        <span className="text-xs text-muted-foreground">Update templates if code matches</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport}
              disabled={isImporting || !importData || !importData.templates}
              className="bg-green-600 hover:bg-green-700"
            >
              {isImporting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import {importData?.templates?.length || 0} Templates
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Template Generator Dialog */}
      <AITemplateGenerator
        open={isAIGeneratorOpen}
        onOpenChange={setIsAIGeneratorOpen}
        assetTypes={availableAssetTypes}
        onTemplateGenerated={handleAITemplateGenerated}
      />
    </div>
  );
};