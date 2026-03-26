import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { customizationAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Activity, 
  Wrench, 
  BookOpen, 
  Shield, 
  Plus, 
  X, 
  Save,
  AlertCircle,
  RotateCcw,
  ImagePlus
} from 'lucide-react';
import { ReferenceImageUpload } from './ReferenceImageUpload';

export const AssetTestCustomizationDialog = ({ 
  open, 
  onOpenChange, 
  test, 
  asset,
  onSaved 
}) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [existingCustomization, setExistingCustomization] = useState(null);
  const [activeTab, setActiveTab] = useState('parameters');
  
  // Form state
  const [customParameters, setCustomParameters] = useState([]);
  const [customEquipment, setCustomEquipment] = useState([]);
  const [customStandards, setCustomStandards] = useState([]);
  const [customSafety, setCustomSafety] = useState([]);
  const [notes, setNotes] = useState('');
  
  // Temporary input states for adding new items
  const [newEquipment, setNewEquipment] = useState('');
  const [newStandard, setNewStandard] = useState('');
  const [newSafety, setNewSafety] = useState('');

  // Load existing customization if any
  useEffect(() => {
    const loadCustomization = async () => {
      if (!open || !test || !asset) return;
      
      console.log('Loading customization for:', {
        company_id: currentUser.company_id,
        test_id: test.test_id,
        asset_id: asset.asset_id,
        test_name: test.name
      });
      
      try {
        const customization = await customizationAPI.getByTest(
          currentUser.company_id,
          test.test_id,
          asset.asset_id
        );
        
        console.log('Loaded customization:', customization);
        
        setExistingCustomization(customization);
        setCustomParameters(customization.custom_parameters || []);
        setCustomEquipment(customization.custom_equipment || []);
        setCustomStandards(customization.custom_standards || []);
        setCustomSafety(customization.custom_safety_precautions || []);
        setNotes(customization.notes || '');
      } catch (error) {
        // 404 or "No customization found" is expected if no customization exists
        const errorMsg = error.message || '';
        console.log('Error loading customization:', errorMsg);
        
        if (errorMsg.includes('404') || errorMsg.includes('No customization found') || errorMsg.includes('Using global template')) {
          // Initialize with defaults from test template
          console.log('No customization found, initializing with defaults from test template');
          setExistingCustomization(null);
          setCustomParameters([]);
          setCustomEquipment(Array.isArray(test.equipment) ? test.equipment : []);
          setCustomStandards(Array.isArray(test.applicable_standards) ? test.applicable_standards : []);
          setCustomSafety(Array.isArray(test.safety_precautions) ? test.safety_precautions : []);
          setNotes('');
        } else {
          console.error('Failed to load customization:', error);
          toast.error(`Failed to load customization details: ${errorMsg}`);
        }
      }
    };

    loadCustomization();
  }, [open, test, asset, currentUser]);

  // Handle adding parameter override
  const handleAddParameterOverride = (param) => {
    const existing = customParameters.find(p => p.parameter_name === param.name);
    if (existing) {
      toast.warning('Parameter already has an override');
      return;
    }
    
    setCustomParameters([
      ...customParameters,
      {
        parameter_name: param.name,
        custom_limit: param.limit,
        custom_unit: param.unit,
        is_custom: true
      }
    ]);
  };

  // Handle updating parameter override
  const handleUpdateParameterOverride = (paramName, field, value) => {
    setCustomParameters(customParameters.map(p => 
      p.parameter_name === paramName 
        ? { ...p, [field]: value }
        : p
    ));
  };

  // Handle removing parameter override
  const handleRemoveParameterOverride = (paramName) => {
    setCustomParameters(customParameters.filter(p => p.parameter_name !== paramName));
  };

  // Helper to get equipment name (handles both string and object format)
  const getEquipmentName = (item) => {
    if (typeof item === 'string') return item;
    return item?.name || '';
  };

  // Helper to get equipment image
  const getEquipmentImage = (item) => {
    if (typeof item === 'string') return null;
    return item?.reference_image || null;
  };

  // Helper to get safety text
  const getSafetyText = (item) => {
    if (typeof item === 'string') return item;
    return item?.text || '';
  };

  // Helper to get safety image
  const getSafetyImage = (item) => {
    if (typeof item === 'string') return null;
    return item?.reference_image || null;
  };

  // Handle adding equipment
  const handleAddEquipment = () => {
    if (!newEquipment.trim()) return;
    const existingNames = customEquipment.map(e => getEquipmentName(e));
    if (existingNames.includes(newEquipment.trim())) {
      toast.warning('Equipment already added');
      return;
    }
    setCustomEquipment([...customEquipment, { name: newEquipment.trim(), reference_image: null }]);
    setNewEquipment('');
  };

  // Handle removing equipment
  const handleRemoveEquipment = (index) => {
    setCustomEquipment(customEquipment.filter((_, i) => i !== index));
  };

  // Handle updating equipment image
  const handleUpdateEquipmentImage = (index, imageUrl) => {
    const updated = [...customEquipment];
    const item = updated[index];
    if (typeof item === 'string') {
      updated[index] = { name: item, reference_image: imageUrl };
    } else {
      updated[index] = { ...item, reference_image: imageUrl };
    }
    setCustomEquipment(updated);
  };

  // Handle adding standard
  const handleAddStandard = () => {
    if (!newStandard.trim()) return;
    if (customStandards.includes(newStandard.trim())) {
      toast.warning('Standard already added');
      return;
    }
    setCustomStandards([...customStandards, newStandard.trim()]);
    setNewStandard('');
  };

  // Handle removing standard
  const handleRemoveStandard = (item) => {
    setCustomStandards(customStandards.filter(s => s !== item));
  };

  // Handle adding safety precaution
  const handleAddSafety = () => {
    if (!newSafety.trim()) return;
    const existingTexts = customSafety.map(s => getSafetyText(s));
    if (existingTexts.includes(newSafety.trim())) {
      toast.warning('Safety precaution already added');
      return;
    }
    setCustomSafety([...customSafety, { text: newSafety.trim(), reference_image: null }]);
    setNewSafety('');
  };

  // Handle removing safety precaution
  const handleRemoveSafety = (index) => {
    setCustomSafety(customSafety.filter((_, i) => i !== index));
  };

  // Handle updating safety image
  const handleUpdateSafetyImage = (index, imageUrl) => {
    const updated = [...customSafety];
    const item = updated[index];
    if (typeof item === 'string') {
      updated[index] = { text: item, reference_image: imageUrl };
    } else {
      updated[index] = { ...item, reference_image: imageUrl };
    }
    setCustomSafety(updated);
  };

  // Handle save
  const handleSave = async () => {
    setLoading(true);
    try {
      const customizationData = {
        company_id: currentUser.company_id,
        test_id: test.test_id,
        test_code: test.test_code,
        asset_id: asset.asset_id,
        custom_parameters: customParameters.length > 0 ? customParameters : null,
        custom_equipment: customEquipment.length > 0 ? customEquipment : null,
        custom_standards: customStandards.length > 0 ? customStandards : null,
        custom_safety_precautions: customSafety.length > 0 ? customSafety : null,
        customized_by: currentUser.user_id,
        notes: notes || null
      };

      if (existingCustomization) {
        // Update existing
        await customizationAPI.update(
          existingCustomization.customization_id,
          {
            custom_parameters: customParameters.length > 0 ? customParameters : null,
            custom_equipment: customEquipment.length > 0 ? customEquipment : null,
            custom_standards: customStandards.length > 0 ? customStandards : null,
            custom_safety_precautions: customSafety.length > 0 ? customSafety : null,
            notes: notes || null
          }
        );
        toast.success('Asset customization updated successfully');
      } else {
        // Create new
        await customizationAPI.create(customizationData);
        toast.success('Asset customization created successfully');
      }

      if (onSaved) onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save customization:', error);
      toast.error('Failed to save customization');
    } finally {
      setLoading(false);
    }
  };

  // Handle reset to defaults
  const handleResetToDefaults = () => {
    if (confirm('Reset all customizations to template defaults?')) {
      setCustomParameters([]);
      setCustomEquipment(test.equipment || []);
      setCustomStandards(test.applicable_standards || []);
      setCustomSafety(test.safety_precautions || []);
      setNotes('');
      toast.info('Reset to template defaults');
    }
  };

  if (!test || !asset) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2 text-primary" />
            Customize Test for Asset
          </DialogTitle>
          <DialogDescription>
            Customize test parameters, equipment, standards, and safety precautions specifically for{' '}
            <strong>{asset.asset_name}</strong>. Changes will not affect other assets.
          </DialogDescription>
        </DialogHeader>

        <div className="border-l-4 border-blue-500 bg-blue-50 p-3 rounded-r mb-4 flex-shrink-0">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm text-blue-900 font-medium">
                Test: <strong>{test.name}</strong>
              </p>
              <p className="text-xs text-blue-700 mt-1">
                These customizations will override the global template only for this specific asset
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 sticky top-0 bg-background z-10">
            <TabsTrigger value="parameters">
              <Activity className="w-4 h-4 mr-2" />
              Parameters
            </TabsTrigger>
            <TabsTrigger value="equipment">
              <Wrench className="w-4 h-4 mr-2" />
              Equipment
            </TabsTrigger>
            <TabsTrigger value="standards">
              <BookOpen className="w-4 h-4 mr-2" />
              Standards
            </TabsTrigger>
            <TabsTrigger value="safety">
              <Shield className="w-4 h-4 mr-2" />
              Safety
            </TabsTrigger>
          </TabsList>

          {/* Parameters Tab */}
          <TabsContent value="parameters" className="space-y-4 mt-4">
            <div>
              <h4 className="text-sm font-semibold mb-3">Template Parameters</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Click "Override" to customize a parameter for this asset
              </p>
              <div className="space-y-2">
                {test.parameters && test.parameters.length > 0 ? test.parameters.map((param, idx) => {
                  const override = customParameters.find(p => p.parameter_name === param.name);
                  return (
                    <Card key={idx} className="border-border/50">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{param.name}</p>
                            <div className="flex items-center space-x-3 mt-1">
                              <span className="text-xs text-muted-foreground">
                                Default: <Badge variant="outline" className="ml-1">{param.limit}</Badge>
                              </span>
                              <span className="text-xs text-muted-foreground">{param.unit}</span>
                            </div>
                            {override && (
                              <div className="mt-2 space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Input
                                    type="text"
                                    placeholder="Custom limit"
                                    value={override.custom_limit || ''}
                                    onChange={(e) => handleUpdateParameterOverride(param.name, 'custom_limit', e.target.value)}
                                    className="text-sm"
                                  />
                                  <Input
                                    type="text"
                                    placeholder="Unit"
                                    value={override.custom_unit || ''}
                                    onChange={(e) => handleUpdateParameterOverride(param.name, 'custom_unit', e.target.value)}
                                    className="text-sm w-24"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveParameterOverride(param.name)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                          {!override && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddParameterOverride(param)}
                            >
                              Override
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                }) : (
                  <Card className="border-border/50">
                    <CardContent className="p-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        No parameters defined in the test template. Parameters are automatically extracted from SOP steps.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Equipment Tab */}
          <TabsContent value="equipment" className="space-y-4 mt-4">
            <div>
              <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
                Required Equipment
                <Badge variant="outline" className="text-xs font-normal">
                  <ImagePlus className="w-3 h-3 mr-1" />
                  Images supported
                </Badge>
              </h4>
              <p className="text-xs text-muted-foreground mb-3">Add reference images to help technicians identify equipment</p>
              <div className="flex items-center space-x-2 mb-3">
                <Input
                  type="text"
                  placeholder="Add equipment..."
                  value={newEquipment}
                  onChange={(e) => setNewEquipment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddEquipment()}
                />
                <Button onClick={handleAddEquipment} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {customEquipment.map((item, idx) => (
                  <Card key={idx} className="border-border/50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <ReferenceImageUpload
                          imageUrl={getEquipmentImage(item)}
                          onImageChange={(url) => handleUpdateEquipmentImage(idx, url)}
                          category="equipment"
                          size="small"
                        />
                        <div className="flex items-center flex-1 space-x-2">
                          <Wrench className="w-4 h-4 text-muted-foreground" />
                          <p className="text-sm">{getEquipmentName(item)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveEquipment(idx)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Standards Tab */}
          <TabsContent value="standards" className="space-y-4 mt-4">
            <div>
              <h4 className="text-sm font-semibold mb-3">Applicable Standards</h4>
              <div className="flex items-center space-x-2 mb-3">
                <Input
                  type="text"
                  placeholder="Add standard..."
                  value={newStandard}
                  onChange={(e) => setNewStandard(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddStandard()}
                />
                <Button onClick={handleAddStandard} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {customStandards.map((item, idx) => (
                  <Card key={idx} className="border-border/50">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <BookOpen className="w-4 h-4 text-muted-foreground" />
                          <p className="text-sm">{item}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveStandard(item)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Safety Tab */}
          <TabsContent value="safety" className="space-y-4 mt-4">
            <div>
              <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
                Safety Precautions
                <Badge variant="outline" className="text-xs font-normal">
                  <ImagePlus className="w-3 h-3 mr-1" />
                  Images supported
                </Badge>
              </h4>
              <p className="text-xs text-muted-foreground mb-3">Add reference images for safety equipment and warning signs</p>
              <div className="flex items-center space-x-2 mb-3">
                <Input
                  type="text"
                  placeholder="Add safety precaution..."
                  value={newSafety}
                  onChange={(e) => setNewSafety(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSafety()}
                />
                <Button onClick={handleAddSafety} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {customSafety.map((item, idx) => (
                  <Card key={idx} className="border-red-100 bg-red-50/30">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <ReferenceImageUpload
                          imageUrl={getSafetyImage(item)}
                          onImageChange={(url) => handleUpdateSafetyImage(idx, url)}
                          category="safety"
                          size="small"
                        />
                        <div className="flex items-center flex-1 space-x-2">
                          <Shield className="w-4 h-4 text-red-500" />
                          <p className="text-sm">{getSafetyText(item)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSafety(idx)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        </div>

        {/* Notes Section */}
        <div className="mt-4 flex-shrink-0">
          <Label htmlFor="notes" className="text-sm font-semibold">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Add notes about this customization..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-2"
            rows={3}
          />
        </div>

        <DialogFooter className="flex items-center justify-between pt-4 border-t flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleResetToDefaults}
            disabled={loading}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : existingCustomization ? 'Update' : 'Save'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
