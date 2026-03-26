/**
 * Production Testing Module - Test Specifications Page
 * Manage test types, parameters, and tolerances
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { ProductionNav } from './ProductionNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '../../components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { 
  Gauge, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Settings,
  AlertTriangle,
  X
} from 'lucide-react';
import { productionAPI } from '../../services/api';
import { toast } from 'sonner';

// Display/Interface types for reading values during testing
const DISPLAY_TYPES = [
  { value: 'digital_lcd', label: 'Digital LCD Display' },
  { value: 'analog_meter', label: 'Analog Meter' },
  { value: 'computer_interface', label: 'Computer Interface' },
  { value: 'manual_entry', label: 'Manual Entry' },
];

const TOLERANCE_TYPES = [
  { value: 'min', label: 'Minimum (≥ value)' },
  { value: 'max', label: 'Maximum (≤ value)' },
  { value: 'range', label: 'Range (min to max)' },
  { value: 'percentage', label: 'Percentage (± %)' },
  { value: 'exact', label: 'Exact Match' },
  { value: 'none', label: 'No Tolerance' },
];

const DATA_TYPES = [
  { value: 'number', label: 'Number' },
  { value: 'text', label: 'Text' },
  { value: 'select', label: 'Dropdown Selection' },
];

export function TestSpecsPage({ onLogout }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [testSpecs, setTestSpecs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSpec, setEditingSpec] = useState(null);
  const [equipmentCategories, setEquipmentCategories] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    test_code: '',
    test_name: '',
    equipment_category: '',
    display_type: 'digital_lcd',
    instructions: '',
    safety_notes: '',
    parameters: []
  });

  const fetchTestSpecs = async () => {
    try {
      setLoading(true);
      const response = await productionAPI.getTestSpecs();
      setTestSpecs(response.test_specs || []);
    } catch (error) {
      console.error('Error fetching test specs:', error);
      toast.error('Failed to load test specifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipmentCategories = async () => {
    try {
      const response = await productionAPI.getEquipmentCategories();
      setEquipmentCategories(response.categories || []);
    } catch (error) {
      console.error('Error fetching equipment categories:', error);
    }
  };

  useEffect(() => {
    fetchTestSpecs();
    fetchEquipmentCategories();
  }, []);

  const handleCreateSpec = async () => {
    try {
      if (!formData.test_code || !formData.test_name) {
        toast.error('Test code and name are required');
        return;
      }

      await productionAPI.createTestSpec(formData);
      toast.success('Test specification created successfully');
      setShowCreateDialog(false);
      resetForm();
      fetchTestSpecs();
    } catch (error) {
      console.error('Error creating test spec:', error);
      toast.error(error.detail || 'Failed to create test specification');
    }
  };

  const handleUpdateSpec = async () => {
    try {
      if (!formData.test_code || !formData.test_name) {
        toast.error('Test code and name are required');
        return;
      }

      await productionAPI.updateTestSpec(editingSpec.test_spec_id, formData);
      toast.success('Test specification updated successfully');
      setEditingSpec(null);
      resetForm();
      fetchTestSpecs();
    } catch (error) {
      console.error('Error updating test spec:', error);
      toast.error(error.detail || 'Failed to update test specification');
    }
  };

  const resetForm = () => {
    setFormData({
      test_code: '',
      test_name: '',
      equipment_category: '',
      display_type: 'digital_lcd',
      instructions: '',
      safety_notes: '',
      parameters: []
    });
  };

  const openEditDialog = (spec) => {
    setEditingSpec(spec);
    setFormData({
      test_code: spec.test_code,
      test_name: spec.test_name,
      equipment_category: spec.equipment_category || spec.equipment_type || '',
      display_type: spec.display_type || spec.equipment_type || 'digital_lcd',
      instructions: spec.instructions || '',
      safety_notes: spec.safety_notes || '',
      parameters: spec.parameters || []
    });
  };

  const addParameter = () => {
    setFormData({
      ...formData,
      parameters: [
        ...formData.parameters,
        {
          param_id: `param_${Date.now()}`,
          param_name: '',
          unit: '',
          data_type: 'number',
          tolerance: { type: 'none' },
          options: []
        }
      ]
    });
  };

  const updateParameter = (index, field, value) => {
    const newParams = [...formData.parameters];
    newParams[index] = { ...newParams[index], [field]: value };
    setFormData({ ...formData, parameters: newParams });
  };

  const updateTolerance = (index, toleranceField, value) => {
    const newParams = [...formData.parameters];
    newParams[index].tolerance = { ...newParams[index].tolerance, [toleranceField]: value };
    setFormData({ ...formData, parameters: newParams });
  };

  const removeParameter = (index) => {
    const newParams = formData.parameters.filter((_, i) => i !== index);
    setFormData({ ...formData, parameters: newParams });
  };

  // Filter specs
  const filteredSpecs = searchQuery
    ? testSpecs.filter(spec => 
        spec.test_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spec.test_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : testSpecs;

  const getEquipmentLabel = (type) => {
    // Check if it's an equipment category (from the categories list)
    if (equipmentCategories.includes(type)) {
      return type;
    }
    // Otherwise check if it's a display type
    const eq = DISPLAY_TYPES.find(e => e.value === type);
    return eq ? eq.label : type;
  };

  const formatTolerance = (tolerance) => {
    if (!tolerance || tolerance.type === 'none') return '-';
    switch (tolerance.type) {
      case 'min': return `≥ ${tolerance.value}`;
      case 'max': return `≤ ${tolerance.value}`;
      case 'range': return `${tolerance.min} - ${tolerance.max}`;
      case 'percentage': return `± ${tolerance.percentage}%`;
      case 'exact': return `= ${tolerance.value}`;
      default: return '-';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader onLogout={onLogout} />
      <ProductionNav />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Settings className="h-8 w-8 text-purple-500" />
              Test Specifications
            </h1>
            <p className="text-muted-foreground mt-1">Configure test types, parameters, and tolerance limits</p>
          </div>
          <Button 
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => setShowCreateDialog(true)}
            data-testid="create-test-spec-btn"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Test Type
          </Button>
        </div>

        {/* Search */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search test specifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-test-specs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Test Specs List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : filteredSpecs.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <Gauge className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Test Specifications Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try adjusting your search' : 'Create your first test specification'}
              </p>
              {!searchQuery && (
                <Button 
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Test Type
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredSpecs.map((spec) => (
              <Card key={spec.test_spec_id} className="bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Gauge className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle className="text-foreground flex items-center gap-2">
                          {spec.test_code}
                          <Badge variant="outline" className="ml-2">{spec.test_name}</Badge>
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                          Equipment: {spec.equipment_category || getEquipmentLabel(spec.equipment_type)}
                        </CardDescription>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => openEditDialog(spec)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Parameters Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3 font-medium text-foreground">Parameter</th>
                          <th className="text-left p-3 font-medium text-foreground">Unit</th>
                          <th className="text-left p-3 font-medium text-foreground">Data Type</th>
                          <th className="text-left p-3 font-medium text-foreground">Tolerance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(spec.parameters || []).map((param, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="p-3 text-foreground">{param.param_name}</td>
                            <td className="p-3 text-muted-foreground">{param.unit || '-'}</td>
                            <td className="p-3 text-muted-foreground capitalize">{param.data_type || 'number'}</td>
                            <td className="p-3">
                              <Badge variant="outline" className={
                                param.tolerance?.type === 'none' || !param.tolerance?.type
                                  ? 'bg-gray-100 text-gray-600'
                                  : 'bg-blue-100 text-blue-700'
                              }>
                                {formatTolerance(param.tolerance)}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Instructions & Safety Notes */}
                  {(spec.instructions || spec.safety_notes) && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {spec.instructions && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Instructions</p>
                          <p className="text-sm text-foreground">{spec.instructions}</p>
                        </div>
                      )}
                      {spec.safety_notes && (
                        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                          <p className="text-xs font-medium text-red-600 mb-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Safety Notes
                          </p>
                          <p className="text-sm text-red-700">{spec.safety_notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog || !!editingSpec} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setEditingSpec(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSpec ? 'Edit Test Specification' : 'Add New Test Type'}</DialogTitle>
            <DialogDescription>
              {editingSpec ? 'Update test parameters and tolerances' : 'Define a new test type with its parameters'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="test_code">Test Code *</Label>
                <Input
                  id="test_code"
                  value={formData.test_code}
                  onChange={(e) => setFormData({ ...formData, test_code: e.target.value.toUpperCase() })}
                  placeholder="e.g., IR, HV, PD"
                  data-testid="input-test-code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test_name">Test Name *</Label>
                <Input
                  id="test_name"
                  value={formData.test_name}
                  onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
                  placeholder="e.g., Insulation Resistance Test"
                  data-testid="input-test-name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="equipment_category">Equipment Category *</Label>
                <Select 
                  value={formData.equipment_category} 
                  onValueChange={(value) => setFormData({ ...formData, equipment_category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select equipment category" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Links to Equipment Management categories</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="display_type">Display/Interface Type</Label>
                <Select 
                  value={formData.display_type} 
                  onValueChange={(value) => setFormData({ ...formData, display_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select display type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DISPLAY_TYPES.map(dt => (
                      <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Parameters Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Test Parameters</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addParameter}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Parameter
                </Button>
              </div>

              {formData.parameters.length === 0 ? (
                <div className="text-center py-6 border border-dashed rounded-lg">
                  <p className="text-muted-foreground text-sm">No parameters added yet</p>
                  <Button 
                    type="button" 
                    variant="link" 
                    size="sm"
                    onClick={addParameter}
                    className="mt-2"
                  >
                    Add your first parameter
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.parameters.map((param, index) => (
                    <div key={param.param_id} className="p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-sm font-medium text-foreground">Parameter {index + 1}</span>
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeParameter(index)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Parameter Name</Label>
                          <Input
                            value={param.param_name}
                            onChange={(e) => updateParameter(index, 'param_name', e.target.value)}
                            placeholder="e.g., Test Voltage"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Unit</Label>
                          <Input
                            value={param.unit}
                            onChange={(e) => updateParameter(index, 'unit', e.target.value)}
                            placeholder="e.g., kV, MΩ"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Data Type</Label>
                          <Select 
                            value={param.data_type} 
                            onValueChange={(value) => updateParameter(index, 'data_type', value)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DATA_TYPES.map(dt => (
                                <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Tolerance Settings */}
                      <div className="grid grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Tolerance Type</Label>
                          <Select 
                            value={param.tolerance?.type || 'none'} 
                            onValueChange={(value) => updateTolerance(index, 'type', value)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TOLERANCE_TYPES.map(tt => (
                                <SelectItem key={tt.value} value={tt.value}>{tt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {param.tolerance?.type === 'min' && (
                          <div className="space-y-1">
                            <Label className="text-xs">Min Value</Label>
                            <Input
                              type="number"
                              value={param.tolerance?.value || ''}
                              onChange={(e) => updateTolerance(index, 'value', parseFloat(e.target.value))}
                              className="h-9"
                            />
                          </div>
                        )}
                        
                        {param.tolerance?.type === 'max' && (
                          <div className="space-y-1">
                            <Label className="text-xs">Max Value</Label>
                            <Input
                              type="number"
                              value={param.tolerance?.value || ''}
                              onChange={(e) => updateTolerance(index, 'value', parseFloat(e.target.value))}
                              className="h-9"
                            />
                          </div>
                        )}
                        
                        {param.tolerance?.type === 'range' && (
                          <>
                            <div className="space-y-1">
                              <Label className="text-xs">Min</Label>
                              <Input
                                type="number"
                                value={param.tolerance?.min || ''}
                                onChange={(e) => updateTolerance(index, 'min', parseFloat(e.target.value))}
                                className="h-9"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Max</Label>
                              <Input
                                type="number"
                                value={param.tolerance?.max || ''}
                                onChange={(e) => updateTolerance(index, 'max', parseFloat(e.target.value))}
                                className="h-9"
                              />
                            </div>
                          </>
                        )}
                        
                        {param.tolerance?.type === 'percentage' && (
                          <>
                            <div className="space-y-1">
                              <Label className="text-xs">Reference Value</Label>
                              <Input
                                type="number"
                                value={param.tolerance?.reference || ''}
                                onChange={(e) => updateTolerance(index, 'reference', parseFloat(e.target.value))}
                                placeholder="Nominal value"
                                className="h-9"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">± Percentage</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={param.tolerance?.percentage || ''}
                                onChange={(e) => updateTolerance(index, 'percentage', parseFloat(e.target.value))}
                                placeholder="e.g., 5"
                                className="h-9"
                              />
                            </div>
                          </>
                        )}
                        
                        {param.tolerance?.type === 'exact' && (
                          <div className="space-y-1 col-span-2">
                            <Label className="text-xs">Exact Value</Label>
                            <Input
                              value={param.tolerance?.value || ''}
                              onChange={(e) => updateTolerance(index, 'value', e.target.value)}
                              placeholder="e.g., Pass, No Breakdown"
                              className="h-9"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Instructions & Safety */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Step-by-step instructions for conducting this test..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="safety_notes" className="text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Safety Notes
                </Label>
                <Textarea
                  id="safety_notes"
                  value={formData.safety_notes}
                  onChange={(e) => setFormData({ ...formData, safety_notes: e.target.value })}
                  placeholder="Important safety precautions..."
                  rows={3}
                  className="border-red-200 focus:border-red-400"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateDialog(false);
                setEditingSpec(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={editingSpec ? handleUpdateSpec : handleCreateSpec}
              className="bg-purple-600 hover:bg-purple-700"
              data-testid="save-test-spec-btn"
            >
              {editingSpec ? 'Save Changes' : 'Create Test Type'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TestSpecsPage;
