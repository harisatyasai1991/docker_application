import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Settings,
  Plus,
  Trash2,
  FlaskConical,
  Shield,
  AlertCircle,
  Save,
  RotateCcw,
} from 'lucide-react';
import { testsAPI, customizationAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { AppHeader } from '../components/AppHeader';

export const CompanyCustomizationPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const { isAdmin, getUserCompany, currentUser } = useAuth();
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [globalTemplate, setGlobalTemplate] = useState(null);
  const [customization, setCustomization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [customParameters, setCustomParameters] = useState([]);
  const [additionalParameters, setAdditionalParameters] = useState([]);
  const [customEquipment, setCustomEquipment] = useState([]);
  const [customStandards, setCustomStandards] = useState([]);
  const [customSafety, setCustomSafety] = useState([]);
  
  // Temporary inputs
  const [newEquipment, setNewEquipment] = useState('');
  const [newStandard, setNewStandard] = useState('');
  const [newSafety, setNewSafety] = useState('');

  const companyId = getUserCompany();

  useEffect(() => {
    if (!isAdmin()) {
      toast.error('Access denied. Admin privileges required.');
      navigate('/');
    } else {
      loadTests();
    }
  }, [isAdmin, navigate]);

  const loadTests = async () => {
    try {
      setLoading(true);
      const data = await testsAPI.getAll();
      setTests(data);
    } catch (error) {
      toast.error('Failed to load test templates');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadTestDetails = async (test) => {
    try {
      setSelectedTest(test);
      setGlobalTemplate(test);
      
      // Try to load existing customization
      try {
        const custom = await customizationAPI.getByTest(companyId, test.test_id);
        setCustomization(custom);
        loadCustomizationData(custom);
      } catch (error) {
        // No customization exists yet
        setCustomization(null);
        resetCustomizationData();
      }
    } catch (error) {
      toast.error('Failed to load test details');
      console.error(error);
    }
  };

  const loadCustomizationData = (custom) => {
    setCustomParameters(custom.custom_parameters || []);
    setAdditionalParameters(custom.additional_parameters || []);
    setCustomEquipment(custom.custom_equipment || []);
    setCustomStandards(custom.custom_standards || []);
    setCustomSafety(custom.custom_safety_precautions || []);
  };

  const resetCustomizationData = () => {
    setCustomParameters([]);
    setAdditionalParameters([]);
    setCustomEquipment([]);
    setCustomStandards([]);
    setCustomSafety([]);
  };

  const handleSaveCustomization = async () => {
    try {
      setSaving(true);
      
      const customizationData = {
        company_id: companyId,
        test_id: selectedTest.test_id,
        test_code: selectedTest.test_code,
        custom_parameters: customParameters,
        additional_parameters: additionalParameters,
        custom_equipment: customEquipment,
        custom_standards: customStandards,
        custom_safety_precautions: customSafety,
        customized_by: currentUser.user_id,
      };

      if (customization) {
        // Update existing
        await customizationAPI.update(customization.customization_id, customizationData);
        toast.success('Customization updated successfully');
      } else {
        // Create new
        const created = await customizationAPI.create(customizationData);
        setCustomization(created);
        toast.success('Customization created successfully');
      }
    } catch (error) {
      toast.error('Failed to save customization');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleRevertToGlobal = async () => {
    if (!customization) return;
    
    if (!window.confirm('Are you sure you want to revert to global template? All customizations will be lost.')) {
      return;
    }
    
    try {
      await customizationAPI.delete(customization.customization_id);
      toast.success('Reverted to global template');
      setCustomization(null);
      resetCustomizationData();
    } catch (error) {
      toast.error('Failed to revert customization');
      console.error(error);
    }
  };

  const toggleParameterOverride = (paramName) => {
    const existing = customParameters.find(p => p.parameter_name === paramName);
    
    if (existing) {
      // Remove override
      setCustomParameters(customParameters.filter(p => p.parameter_name !== paramName));
    } else {
      // Add override with global values
      const globalParam = globalTemplate.parameters.find(p => p.name === paramName);
      setCustomParameters([...customParameters, {
        parameter_name: paramName,
        custom_limit: globalParam.limit,
        custom_unit: globalParam.unit,
        is_custom: true
      }]);
    }
  };

  const updateParameterOverride = (paramName, field, value) => {
    setCustomParameters(customParameters.map(p => 
      p.parameter_name === paramName 
        ? { ...p, [field]: value }
        : p
    ));
  };

  const getParameterValue = (paramName, field) => {
    const override = customParameters.find(p => p.parameter_name === paramName);
    if (override && override[`custom_${field}`]) {
      return override[`custom_${field}`];
    }
    const globalParam = globalTemplate?.parameters.find(p => p.name === paramName);
    return globalParam?.[field] || '';
  };

  const isParameterCustomized = (paramName) => {
    return customParameters.some(p => p.parameter_name === paramName);
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
                  <Settings className="w-6 h-6 text-blue-600" />
                  Company Template Customization
                  <Badge className="bg-blue-100 text-blue-800">Admin</Badge>
                </h1>
                <p className="text-sm text-muted-foreground">
                  Customize test templates for your company
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Test Selection Sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Select Test Template</CardTitle>
              <CardDescription>Choose a test to customize</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tests.map((test) => (
                  <Button
                    key={test.test_id}
                    variant={selectedTest?.test_id === test.test_id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => loadTestDetails(test)}
                  >
                    <FlaskConical className="w-4 h-4 mr-2" />
                    {test.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customization Panel */}
          <div className="lg:col-span-2 space-y-6">
            {!selectedTest ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Select a test template to start customizing
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Header with Actions */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{selectedTest.name}</CardTitle>
                        <CardDescription>
                          {customization ? (
                            <span className="text-blue-600">✓ Customized for your company</span>
                          ) : (
                            <span className="text-gray-600">Using global template</span>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {customization && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRevertToGlobal}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Revert to Global
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={handleSaveCustomization}
                          disabled={saving}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Customization
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Side-by-Side Parameters */}
                <Card>
                  <CardHeader>
                    <CardTitle>Test Parameters</CardTitle>
                    <CardDescription>
                      Override individual parameters or keep global values
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {globalTemplate?.parameters.map((param, index) => {
                      const isCustom = isParameterCustomized(param.name);
                      return (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <Label className="text-base font-semibold">{param.name}</Label>
                            <Button
                              variant={isCustom ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleParameterOverride(param.name)}
                            >
                              {isCustom ? 'Customized' : 'Use Global'}
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            {/* Global Column */}
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Global Template</Label>
                              <div className="space-y-2">
                                <div>
                                  <Label className="text-xs">Limit</Label>
                                  <Input
                                    value={param.limit}
                                    disabled
                                    className="bg-gray-100"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Unit</Label>
                                  <Input
                                    value={param.unit}
                                    disabled
                                    className="bg-gray-100"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Custom Column */}
                            <div className="space-y-2">
                              <Label className="text-xs text-blue-600">Company Custom</Label>
                              <div className="space-y-2">
                                <div>
                                  <Label className="text-xs">Limit</Label>
                                  <Input
                                    value={getParameterValue(param.name, 'limit')}
                                    onChange={(e) => updateParameterOverride(param.name, 'custom_limit', e.target.value)}
                                    disabled={!isCustom}
                                    className={isCustom ? 'border-blue-500' : 'bg-gray-100'}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Unit</Label>
                                  <Input
                                    value={getParameterValue(param.name, 'unit')}
                                    onChange={(e) => updateParameterOverride(param.name, 'custom_unit', e.target.value)}
                                    disabled={!isCustom}
                                    className={isCustom ? 'border-blue-500' : 'bg-gray-100'}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Additional Equipment */}
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Equipment</CardTitle>
                    <CardDescription>
                      Global: {globalTemplate?.equipment.join(', ')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={newEquipment}
                        onChange={(e) => setNewEquipment(e.target.value)}
                        placeholder="Add company-specific equipment..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newEquipment.trim()) {
                            setCustomEquipment([...customEquipment, newEquipment.trim()]);
                            setNewEquipment('');
                          }
                        }}
                      />
                      <Button
                        onClick={() => {
                          if (newEquipment.trim()) {
                            setCustomEquipment([...customEquipment, newEquipment.trim()]);
                            setNewEquipment('');
                          }
                        }}
                        size="sm"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {customEquipment.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                          <span className="text-blue-900">{item}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCustomEquipment(customEquipment.filter((_, i) => i !== index))}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Standards */}
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Standards</CardTitle>
                    <CardDescription>
                      Global: {globalTemplate?.applicable_standards.join(', ')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={newStandard}
                        onChange={(e) => setNewStandard(e.target.value)}
                        placeholder="Add company-specific standard..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newStandard.trim()) {
                            setCustomStandards([...customStandards, newStandard.trim()]);
                            setNewStandard('');
                          }
                        }}
                      />
                      <Button
                        onClick={() => {
                          if (newStandard.trim()) {
                            setCustomStandards([...customStandards, newStandard.trim()]);
                            setNewStandard('');
                          }
                        }}
                        size="sm"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {customStandards.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                          <span className="text-blue-900">{item}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCustomStandards(customStandards.filter((_, i) => i !== index))}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Safety Precautions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Safety Precautions</CardTitle>
                    <CardDescription>
                      Add company-specific safety requirements
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={newSafety}
                        onChange={(e) => setNewSafety(e.target.value)}
                        placeholder="Add safety precaution..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newSafety.trim()) {
                            setCustomSafety([...customSafety, newSafety.trim()]);
                            setNewSafety('');
                          }
                        }}
                      />
                      <Button
                        onClick={() => {
                          if (newSafety.trim()) {
                            setCustomSafety([...customSafety, newSafety.trim()]);
                            setNewSafety('');
                          }
                        }}
                        size="sm"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {customSafety.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 rounded border border-yellow-200">
                          <span className="text-yellow-900">{item}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCustomSafety(customSafety.filter((_, i) => i !== index))}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
