import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { 
  Sparkles, 
  Loader2, 
  Check, 
  AlertCircle,
  FileText,
  Settings2,
  ListOrdered,
  Shield,
  Wrench,
  ChevronDown,
  ChevronUp,
  Zap,
  Thermometer,
  Droplets,
  Activity,
  CircuitBoard,
  Gauge,
  FlaskConical,
  Cable,
  Radio
} from 'lucide-react';
import { toast } from 'sonner';
import { testsAPI } from '../services/api';

// Voltage class options for transformers
const VOLTAGE_CLASSES = [
  { value: '11kV', label: '11 kV', irTestVoltage: '1kV' },
  { value: '33kV', label: '33 kV', irTestVoltage: '2.5kV' },
  { value: '66kV', label: '66 kV', irTestVoltage: '5kV' },
  { value: '132kV', label: '132 kV', irTestVoltage: '5kV' },
  { value: '220kV', label: '220 kV', irTestVoltage: '5kV' },
  { value: '400kV', label: '400 kV', irTestVoltage: '10kV' },
];

// Switchgear type options
const SWITCHGEAR_TYPES = [
  { value: 'SF6', label: 'SF6 Gas Insulated' },
  { value: 'Vacuum', label: 'Vacuum Circuit Breaker' },
  { value: 'Air', label: 'Air Insulated' },
  { value: 'Oil', label: 'Oil Circuit Breaker' },
];

// Oil type options for DGA
const OIL_TYPES = [
  { value: 'Mineral', label: 'Mineral Oil' },
  { value: 'Natural_Ester', label: 'Natural Ester (FR3)' },
  { value: 'Synthetic_Ester', label: 'Synthetic Ester' },
];

// Transformer type options
const TRANSFORMER_TYPES = [
  { value: 'Power', label: 'Power Transformer' },
  { value: 'Distribution', label: 'Distribution Transformer' },
  { value: 'Auto', label: 'Auto Transformer' },
  { value: 'Reactor', label: 'Shunt Reactor' },
];

// Quick Generate templates - predefined common test types with customization options
const QUICK_TEMPLATES = [
  {
    id: 'ir',
    name: 'Insulation Resistance (IR)',
    icon: Gauge,
    color: 'bg-blue-500',
    assetType: 'Transformer',
    description: 'HV-LV, HV-Ground, LV-Ground with DAR & PI',
    presets: [
      { key: 'voltageClass', label: 'Voltage Class', options: VOLTAGE_CLASSES, default: '33kV' },
      { key: 'transformerType', label: 'Transformer Type', options: TRANSFORMER_TYPES, default: 'Power' },
    ],
    buildPrompt: (presets) => `Create a comprehensive Insulation Resistance (IR) test for ${presets.voltageClass} ${presets.transformerType} transformers with HV-LV, HV-Ground, and LV-Ground configurations following IEEE C57.12.90 standards. Use ${VOLTAGE_CLASSES.find(v => v.value === presets.voltageClass)?.irTestVoltage || '5kV'} test voltage. Include IR measurements at 15 sec and 60 sec intervals, Dielectric Absorption Ratio (DAR), and Polarization Index (PI) calculations. Set appropriate limits for ${presets.voltageClass} class equipment. Add ambient temperature and humidity as test conditions.`
  },
  {
    id: 'dga',
    name: 'Dissolved Gas Analysis (DGA)',
    icon: FlaskConical,
    color: 'bg-amber-500',
    assetType: 'Transformer',
    description: 'Oil analysis with key fault gases',
    presets: [
      { key: 'voltageClass', label: 'Voltage Class', options: VOLTAGE_CLASSES, default: '33kV' },
      { key: 'oilType', label: 'Oil Type', options: OIL_TYPES, default: 'Mineral' },
    ],
    buildPrompt: (presets) => `Generate a Dissolved Gas Analysis (DGA) test template for ${presets.voltageClass} ${presets.oilType === 'Mineral' ? 'mineral oil-filled' : presets.oilType.replace('_', ' ').toLowerCase() + '-filled'} transformers per IEEE C57.104 and IEC 60599 standards. Include all key gases: Hydrogen (H2), Methane (CH4), Ethane (C2H6), Ethylene (C2H4), Acetylene (C2H2), Carbon Monoxide (CO), Carbon Dioxide (CO2), Oxygen (O2), and Nitrogen (N2). Set appropriate alarm limits for ${presets.oilType === 'Mineral' ? 'mineral oil' : presets.oilType.replace('_', ' ').toLowerCase()}. Include oil temperature and sampling conditions.`
  },
  {
    id: 'turns_ratio',
    name: 'Turns Ratio Test',
    icon: Activity,
    color: 'bg-green-500',
    assetType: 'Transformer',
    description: 'Ratio and phase deviation measurements',
    presets: [
      { key: 'voltageClass', label: 'Voltage Class', options: VOLTAGE_CLASSES, default: '33kV' },
      { key: 'transformerType', label: 'Transformer Type', options: TRANSFORMER_TYPES, default: 'Power' },
    ],
    buildPrompt: (presets) => `Create a Turns Ratio Test (TTR) template for ${presets.voltageClass} ${presets.transformerType} transformers following IEEE C57.12.90 and IEC 60076 standards. Include measurements for all tap positions, ratio deviation percentage (limit ±0.5% for ${presets.voltageClass} class), and phase angle deviation. Test all winding combinations: HV-LV, HV-TV (if tertiary exists). Include nameplate ratio reference values.`
  },
  {
    id: 'winding_resistance',
    name: 'Winding Resistance',
    icon: Cable,
    color: 'bg-purple-500',
    assetType: 'Transformer',
    description: 'DC resistance for all windings',
    presets: [
      { key: 'voltageClass', label: 'Voltage Class', options: VOLTAGE_CLASSES, default: '33kV' },
      { key: 'transformerType', label: 'Transformer Type', options: TRANSFORMER_TYPES, default: 'Power' },
    ],
    buildPrompt: (presets) => `Generate a Winding Resistance test template for ${presets.voltageClass} ${presets.transformerType} transformers per IEEE C57.12.90 standards. Measure DC resistance for HV, LV, and TV (if present) windings across all phases (H1-H0, H2-H0, H3-H0, X1-X0, X2-X0, X3-X0). Include temperature correction to 75°C reference. Set deviation limit to ±2% between phases for ${presets.voltageClass} class. Record winding temperature and ambient conditions.`
  },
  {
    id: 'power_factor',
    name: 'Power Factor / Tan Delta',
    icon: CircuitBoard,
    color: 'bg-red-500',
    assetType: 'Transformer',
    description: 'Insulation power factor testing',
    presets: [
      { key: 'voltageClass', label: 'Voltage Class', options: VOLTAGE_CLASSES, default: '33kV' },
      { key: 'oilType', label: 'Oil Type', options: OIL_TYPES, default: 'Mineral' },
    ],
    buildPrompt: (presets) => `Create a Power Factor (Tan Delta) test template for ${presets.voltageClass} transformer insulation testing per IEEE C57.12.90 and NETA standards. Include UST (Ungrounded Specimen Test) and GST (Grounded Specimen Test) modes. Test configurations: CH (HV to LV+Ground), CL (LV to HV+Ground), CHL (HV to LV). Set power factor limits appropriate for ${presets.oilType === 'Mineral' ? 'mineral oil' : presets.oilType.replace('_', ' ').toLowerCase()} insulation at ${presets.voltageClass} class. Include capacitance and watts loss measurements.`
  },
  {
    id: 'contact_resistance',
    name: 'Contact Resistance',
    icon: Zap,
    color: 'bg-orange-500',
    assetType: 'Switchgear',
    description: 'Main and arcing contact resistance',
    presets: [
      { key: 'voltageClass', label: 'Voltage Class', options: VOLTAGE_CLASSES, default: '33kV' },
      { key: 'switchgearType', label: 'Switchgear Type', options: SWITCHGEAR_TYPES, default: 'SF6' },
    ],
    buildPrompt: (presets) => `Generate a Contact Resistance test template for ${presets.voltageClass} ${presets.switchgearType} circuit breakers per IEC 62271-100 and IEEE C37 standards. Measure resistance for main contacts and arcing contacts (if applicable) across all phases. Include minimum 100A DC injection current. Set resistance limits appropriate for ${presets.switchgearType} ${presets.voltageClass} class breakers. Record contact travel and timing if applicable.`
  },
  {
    id: 'partial_discharge',
    name: 'Partial Discharge (PD)',
    icon: Radio,
    color: 'bg-indigo-500',
    assetType: 'Switchgear',
    description: 'UHF/Acoustic PD detection',
    presets: [
      { key: 'voltageClass', label: 'Voltage Class', options: VOLTAGE_CLASSES, default: '132kV' },
      { key: 'switchgearType', label: 'Equipment Type', options: [
        { value: 'GIS', label: 'GIS Switchgear' },
        { value: 'Transformer', label: 'Power Transformer' },
        { value: 'Cable', label: 'HV Cable' },
      ], default: 'GIS' },
    ],
    buildPrompt: (presets) => `Create a Partial Discharge test template for ${presets.voltageClass} ${presets.switchgearType} per IEC 60270 and IEC 62478 standards. Include UHF sensor measurements (dB), acoustic sensor readings (mV), and background noise levels. Set PD threshold limits appropriate for ${presets.voltageClass} ${presets.switchgearType}. Record PRPD (Phase Resolved PD) patterns and apparent charge (pC) if available. Include test voltage levels and duration.`
  },
  {
    id: 'oil_breakdown',
    name: 'Oil Breakdown Voltage',
    icon: Droplets,
    color: 'bg-cyan-500',
    assetType: 'Transformer',
    description: 'Dielectric strength of insulating oil',
    presets: [
      { key: 'oilType', label: 'Oil Type', options: OIL_TYPES, default: 'Mineral' },
      { key: 'voltageClass', label: 'Equipment Class', options: VOLTAGE_CLASSES, default: '33kV' },
    ],
    buildPrompt: (presets) => `Generate an Oil Breakdown Voltage (BDV) test template for ${presets.oilType === 'Mineral' ? 'mineral' : presets.oilType.replace('_', ' ').toLowerCase()} transformer insulating oil per IEC 60156 and ASTM D1816 standards. Include multiple breakdown tests (minimum 6 tests), gap distance settings (2.5mm standard). Set minimum BDV limit appropriate for ${presets.voltageClass} class equipment (${parseInt(presets.voltageClass) >= 132 ? '60 kV' : '40 kV'} minimum). Include oil temperature and moisture content (ppm). Calculate average and standard deviation.`
  },
  {
    id: 'sfra',
    name: 'SFRA',
    icon: Activity,
    color: 'bg-pink-500',
    assetType: 'Transformer',
    description: 'Sweep Frequency Response Analysis',
    presets: [
      { key: 'voltageClass', label: 'Voltage Class', options: VOLTAGE_CLASSES, default: '132kV' },
      { key: 'transformerType', label: 'Transformer Type', options: TRANSFORMER_TYPES, default: 'Power' },
    ],
    buildPrompt: (presets) => `Create a Sweep Frequency Response Analysis (SFRA) test template for ${presets.voltageClass} ${presets.transformerType} transformer winding assessment per IEC 60076-18 and IEEE C57.149 standards. Include end-to-end open circuit and short circuit measurements for all windings. Frequency range: 20 Hz to 2 MHz. Set correlation coefficient limits for ${presets.voltageClass} class transformers. Record reference traces and comparison indices.`
  }
];

/**
 * AITemplateGenerator - Dialog for generating test templates using AI
 * 
 * Takes a natural language description and generates a complete test template
 * including parameters, SOP steps, equipment, safety precautions, and display configuration.
 */
export const AITemplateGenerator = ({ 
  open, 
  onOpenChange, 
  assetTypes = [],
  onTemplateGenerated // Callback with generated template for preview/editing
}) => {
  const [description, setDescription] = useState('');
  const [selectedAssetType, setSelectedAssetType] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('quick'); // 'quick' or 'custom'
  const [generatingTemplateId, setGeneratingTemplateId] = useState(null);
  const [selectedTemplateForConfig, setSelectedTemplateForConfig] = useState(null);
  const [presetValues, setPresetValues] = useState({});

  // Initialize preset values for a template
  const initializePresets = (template) => {
    const defaults = {};
    template.presets?.forEach(preset => {
      defaults[preset.key] = preset.default;
    });
    return defaults;
  };

  // Example prompts for inspiration
  const examplePrompts = [
    "Create an Insulation Resistance (IR) test for power transformers with HV-LV, HV-Ground, LV-Ground configurations following IEEE C57.12.90 standards. Include DAR and PI measurements at 15 sec, 60 sec intervals.",
    "Generate a Dissolved Gas Analysis (DGA) test template for oil-filled transformers per IEEE C57.104. Include key gases: Hydrogen, Methane, Ethane, Ethylene, Acetylene, CO, CO2.",
    "Create a Contact Resistance test for SF6 circuit breakers per IEC 62271-100. Test main contacts and arcing contacts separately.",
    "Generate a Partial Discharge test template for GIS switchgear using UHF sensors per IEC 62478.",
  ];

  const handleGenerate = async (promptOverride = null, templateId = null) => {
    const promptToUse = promptOverride || description;
    
    if (!promptToUse.trim()) {
      toast.error('Please enter a description of the test template');
      return;
    }

    setIsGenerating(true);
    setGeneratingTemplateId(templateId);
    setError(null);
    setGeneratedTemplate(null);

    try {
      const result = await testsAPI.aiGenerate(promptToUse, selectedAssetType);
      
      if (result.success && result.template) {
        setGeneratedTemplate(result.template);
        setShowPreview(true);
        toast.success('Template generated successfully! Review before saving.');
      } else {
        throw new Error(result.message || 'Failed to generate template');
      }
    } catch (err) {
      console.error('Template generation error:', err);
      setError(err.message || 'Failed to generate template');
      toast.error(err.message || 'Failed to generate template');
    } finally {
      setIsGenerating(false);
      setGeneratingTemplateId(null);
    }
  };

  // Open configuration panel for a template
  const handleOpenConfig = (template) => {
    setSelectedTemplateForConfig(template);
    setPresetValues(initializePresets(template));
  };

  // Generate with selected presets
  const handleGenerateWithPresets = () => {
    if (!selectedTemplateForConfig) return;
    
    const prompt = selectedTemplateForConfig.buildPrompt(presetValues);
    setDescription(prompt);
    setSelectedAssetType(selectedTemplateForConfig.assetType);
    setSelectedTemplateForConfig(null);
    handleGenerate(prompt, selectedTemplateForConfig.id);
  };

  // Quick generate handler (direct generation with defaults)
  const handleQuickGenerate = (template) => {
    const defaults = initializePresets(template);
    const prompt = template.buildPrompt(defaults);
    setDescription(prompt);
    setSelectedAssetType(template.assetType);
    handleGenerate(prompt, template.id);
  };

  const handleUseTemplate = () => {
    if (generatedTemplate && onTemplateGenerated) {
      onTemplateGenerated(generatedTemplate);
      handleClose();
    }
  };

  const handleClose = () => {
    setDescription('');
    setSelectedAssetType('');
    setGeneratedTemplate(null);
    setShowPreview(false);
    setError(null);
    setActiveTab('quick');
    setGeneratingTemplateId(null);
    setSelectedTemplateForConfig(null);
    setPresetValues({});
    onOpenChange(false);
  };

  const useExamplePrompt = (prompt) => {
    setDescription(prompt);
    setActiveTab('custom');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Template Generator
          </DialogTitle>
          <DialogDescription>
            Generate industry-standard test templates with one click or describe your custom requirements.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {!showPreview ? (
            <>
              {/* Tab Selector */}
              <div className="flex gap-2 border-b pb-2">
                <Button
                  variant={activeTab === 'quick' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('quick')}
                  className={activeTab === 'quick' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                  disabled={isGenerating}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Quick Generate
                </Button>
                <Button
                  variant={activeTab === 'custom' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('custom')}
                  className={activeTab === 'custom' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                  disabled={isGenerating}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Custom Description
                </Button>
              </div>

              {activeTab === 'quick' ? (
                /* Quick Generate Grid */
                <div className="space-y-3">
                  {/* Configuration Panel (when a template is selected for customization) */}
                  {selectedTemplateForConfig ? (
                    <Card className="border-2 border-purple-300 bg-purple-50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${selectedTemplateForConfig.color} text-white`}>
                              {React.createElement(selectedTemplateForConfig.icon, { className: "w-5 h-5" })}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{selectedTemplateForConfig.name}</h3>
                              <p className="text-xs text-gray-500">Configure options before generating</p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setSelectedTemplateForConfig(null)}
                            className="text-gray-500"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          {selectedTemplateForConfig.presets?.map((preset) => (
                            <div key={preset.key} className="space-y-1">
                              <Label className="text-xs font-medium text-gray-700">{preset.label}</Label>
                              <Select
                                value={presetValues[preset.key] || preset.default}
                                onValueChange={(value) => setPresetValues({ ...presetValues, [preset.key]: value })}
                              >
                                <SelectTrigger className="h-9 bg-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {preset.options.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setSelectedTemplateForConfig(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            className="flex-1 bg-purple-600 hover:bg-purple-700"
                            onClick={handleGenerateWithPresets}
                            disabled={isGenerating}
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generate with Settings
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600">
                        Click to generate with defaults, or use the <Settings2 className="w-4 h-4 inline" /> button to customize settings first:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {QUICK_TEMPLATES.map((template) => {
                          const IconComponent = template.icon;
                          const isThisGenerating = isGenerating && generatingTemplateId === template.id;
                          
                          return (
                            <div
                              key={template.id}
                              className={`
                                relative rounded-lg border-2 text-left transition-all
                                ${isThisGenerating 
                                  ? 'border-purple-500 bg-purple-50' 
                                  : 'border-gray-200 hover:border-purple-300'}
                                ${isGenerating && !isThisGenerating ? 'opacity-50' : ''}
                              `}
                            >
                              <button
                                onClick={() => handleQuickGenerate(template)}
                                disabled={isGenerating}
                                className="w-full p-4 text-left hover:bg-purple-50/50 rounded-t-lg"
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded-lg ${template.color} text-white flex-shrink-0`}>
                                    {isThisGenerating ? (
                                      <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                      <IconComponent className="w-5 h-5" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm text-gray-900">
                                      {template.name}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {template.description}
                                    </p>
                                    <div className="flex items-center gap-1 mt-2">
                                      <Badge variant="outline" className="text-[10px]">
                                        {template.assetType}
                                      </Badge>
                                      {template.presets?.slice(0, 2).map((p) => (
                                        <Badge key={p.key} variant="secondary" className="text-[10px] bg-gray-100">
                                          {p.default}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </button>
                              
                              {/* Configure Button */}
                              <div className="border-t px-4 py-2 bg-gray-50 rounded-b-lg">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full h-7 text-xs text-gray-600 hover:text-purple-700 hover:bg-purple-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenConfig(template);
                                  }}
                                  disabled={isGenerating}
                                >
                                  <Settings2 className="w-3 h-3 mr-1" />
                                  Customize ({template.presets?.length || 0} options)
                                </Button>
                              </div>
                              
                              {isThisGenerating && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                                  <div className="flex items-center gap-2 text-purple-600">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span className="text-sm font-medium">Generating...</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                  
                  {/* Error Display */}
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800">Generation Failed</p>
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Custom Description Tab */
                <>
                  {/* Description Input */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">
                      Describe the test template you need
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="e.g., Create an Insulation Resistance test for 33kV power transformers with HV-LV, HV-Ground, LV-Ground configurations following IEEE C57.12.90 standards..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      className="resize-none"
                      disabled={isGenerating}
                    />
                    <p className="text-xs text-gray-500">
                      Be specific about: test type, equipment voltage levels, configurations, 
                      applicable standards (IEEE/IEC/NETA), and any specific parameters needed.
                    </p>
                  </div>

                  {/* Asset Type Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Asset Type (Optional)</Label>
                    <Select 
                      value={selectedAssetType || 'any'} 
                      onValueChange={(value) => setSelectedAssetType(value === 'any' ? '' : value)}
                      disabled={isGenerating}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select asset type for better suggestions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any/Not specified</SelectItem>
                        {assetTypes.map((type) => (
                          <SelectItem key={type.type_id || type.name} value={type.name}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Example Prompts */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">
                      Example prompts for inspiration
                    </Label>
                    <div className="space-y-2">
                      {examplePrompts.map((prompt, index) => (
                        <button
                          key={index}
                          onClick={() => useExamplePrompt(prompt)}
                          className="w-full text-left p-3 text-xs bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-lg transition-colors"
                          disabled={isGenerating}
                        >
                          <span className="text-purple-600 font-medium">Example {index + 1}:</span>{' '}
                          {prompt.substring(0, 150)}...
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800">Generation Failed</p>
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            /* Template Preview */
            <TemplatePreview 
              template={generatedTemplate} 
              onBack={() => setShowPreview(false)}
            />
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          {!showPreview ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isGenerating}>
                Cancel
              </Button>
              {activeTab === 'custom' && (
                <Button 
                  onClick={() => handleGenerate()} 
                  disabled={isGenerating || !description.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Template
                    </>
                  )}
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Back to Edit
              </Button>
              <Button variant="outline" onClick={() => handleGenerate()} disabled={isGenerating}>
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Regenerate
              </Button>
              <Button 
                onClick={handleUseTemplate}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Use This Template
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * TemplatePreview - Shows a preview of the generated template
 */
const TemplatePreview = ({ template, onBack }) => {
  const [expandedSections, setExpandedSections] = useState({
    parameters: true,
    sop: true,
    equipment: false,
    safety: false,
    display: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!template) return null;

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-purple-600">{template.test_code}</Badge>
              <Badge variant="outline">{template.category}</Badge>
              <Badge variant="outline">{template.test_mode}</Badge>
            </div>
            <h3 className="text-lg font-semibold text-purple-900">{template.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
          </div>
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Generated
          </Badge>
        </div>
        
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {template.applicable_asset_types?.map((type, i) => (
            <Badge key={i} variant="secondary" className="bg-blue-100 text-blue-800">
              {type}
            </Badge>
          ))}
          {template.applicable_standards?.map((std, i) => (
            <Badge key={i} variant="outline" className="text-gray-600">
              {std}
            </Badge>
          ))}
        </div>
        
        {template.estimated_duration && (
          <p className="mt-2 text-xs text-gray-500">
            Estimated Duration: {template.estimated_duration}
          </p>
        )}
      </div>

      {/* Parameters Section */}
      <CollapsibleSection
        title="Parameters"
        icon={<FileText className="w-4 h-4" />}
        count={template.parameters?.length || 0}
        expanded={expandedSections.parameters}
        onToggle={() => toggleSection('parameters')}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {template.parameters?.map((param, i) => (
            <div key={i} className="p-2 bg-gray-50 rounded text-sm">
              <span className="font-medium">{param.name}</span>
              <span className="text-gray-500 ml-2">
                {param.limit} {param.unit}
              </span>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* SOP Steps Section */}
      <CollapsibleSection
        title="SOP Steps"
        icon={<ListOrdered className="w-4 h-4" />}
        count={template.sop_steps?.length || 0}
        expanded={expandedSections.sop}
        onToggle={() => toggleSection('sop')}
      >
        <div className="space-y-2">
          {template.sop_steps?.map((step, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  Step {step.step_number}
                </Badge>
                {step.step_type === 'checklist' && (
                  <Badge className="bg-amber-100 text-amber-800 text-xs">
                    Checklist
                  </Badge>
                )}
              </div>
              <p className="font-medium text-sm">{step.title}</p>
              <p className="text-xs text-gray-600 mt-1">{step.instruction}</p>
              {step.checklist_items?.length > 0 && (
                <div className="mt-2 pl-4 border-l-2 border-amber-200 space-y-1">
                  {step.checklist_items.map((item, j) => (
                    <p key={j} className="text-xs text-gray-600">
                      • {item.item_text}
                      {item.is_required && <span className="text-red-500 ml-1">*</span>}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Equipment Section */}
      <CollapsibleSection
        title="Equipment"
        icon={<Wrench className="w-4 h-4" />}
        count={template.equipment?.length || 0}
        expanded={expandedSections.equipment}
        onToggle={() => toggleSection('equipment')}
      >
        <div className="flex flex-wrap gap-2">
          {template.equipment?.map((eq, i) => (
            <Badge key={i} variant="secondary" className="text-sm">
              {typeof eq === 'string' ? eq : eq.name}
            </Badge>
          ))}
        </div>
      </CollapsibleSection>

      {/* Safety Precautions Section */}
      <CollapsibleSection
        title="Safety Precautions"
        icon={<Shield className="w-4 h-4" />}
        count={template.safety_precautions?.length || 0}
        expanded={expandedSections.safety}
        onToggle={() => toggleSection('safety')}
      >
        <div className="space-y-1">
          {template.safety_precautions?.map((safety, i) => (
            <p key={i} className="text-sm text-gray-700 flex items-start gap-2">
              <span className="text-red-500">⚠️</span>
              {typeof safety === 'string' ? safety : safety.text}
            </p>
          ))}
        </div>
      </CollapsibleSection>

      {/* Display Config Section */}
      {template.display_config && (
        <CollapsibleSection
          title="Display Configuration"
          icon={<Settings2 className="w-4 h-4" />}
          count={template.display_config.parameter_groups?.length || 0}
          countLabel="groups"
          expanded={expandedSections.display}
          onToggle={() => toggleSection('display')}
        >
          <div className="space-y-3">
            {template.display_config.parameter_groups?.map((group, i) => (
              <div key={i} className="p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <span 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: group.color || '#3b82f6' }}
                  />
                  <span className="font-medium text-sm">{group.name}</span>
                  <Badge variant="outline" className="text-xs">{group.chart_type}</Badge>
                </div>
                {group.patterns?.length > 0 && (
                  <p className="text-xs text-gray-500">
                    Patterns: {group.patterns.join(', ')}
                  </p>
                )}
              </div>
            ))}
            
            {template.display_config.test_conditions?.length > 0 && (
              <div className="p-2 bg-amber-50 rounded">
                <p className="text-xs font-medium text-amber-800 mb-1">Test Conditions:</p>
                <p className="text-xs text-amber-700">
                  {template.display_config.test_conditions.join(', ')}
                </p>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
};

/**
 * CollapsibleSection - Reusable collapsible section component
 */
const CollapsibleSection = ({ 
  title, 
  icon, 
  count, 
  countLabel = 'items',
  expanded, 
  onToggle, 
  children 
}) => (
  <Card>
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium">{title}</span>
        <Badge variant="secondary" className="text-xs">
          {count} {countLabel}
        </Badge>
      </div>
      {expanded ? (
        <ChevronUp className="w-4 h-4 text-gray-500" />
      ) : (
        <ChevronDown className="w-4 h-4 text-gray-500" />
      )}
    </button>
    {expanded && (
      <CardContent className="pt-0 pb-3">
        {children}
      </CardContent>
    )}
  </Card>
);

export default AITemplateGenerator;
