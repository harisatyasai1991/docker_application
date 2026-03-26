import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AppHeader } from '../components/AppHeader';
import { assetsAPI } from '../services/api';
import { toast } from 'sonner';
import { Settings, Plus, Edit, Trash2, Save, Database, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const ParameterManagementPage = ({ onLogout }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [parameters, setParameters] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedAssetType, setSelectedAssetType] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingParameter, setEditingParameter] = useState(null);
  const [saving, setSaving] = useState(false);
  const [assetTypes, setAssetTypes] = useState([]);
  const [loadingAssetTypes, setLoadingAssetTypes] = useState(true);
  const [showInactive, setShowInactive] = useState(false);

  // Form state for add/edit
  const [formData, setFormData] = useState({
    key: '',
    label: '',
    example: '',
    category: 'Electrical'
  });

  const categories = ['Electrical', 'Physical', 'Mechanical', 'General', 'Safety', 'Performance'];

  // Check if user is master admin
  useEffect(() => {
    if (currentUser?.role !== 'master') {
      toast.error('Access denied. Only master admins can manage parameters.');
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Load asset types from Asset Type Management
  useEffect(() => {
    loadAssetTypes();
  }, []);

  // Load parameters (reload when showInactive toggle changes)
  useEffect(() => {
    loadParameters();
  }, [showInactive]);

  const loadAssetTypes = async () => {
    setLoadingAssetTypes(true);
    try {
      const apiUrl = process.env.REACT_APP_BACKEND_URL || '';
      const response = await fetch(`${apiUrl}/api/asset-types`);
      const data = await response.json();
      console.log('Loaded asset types:', data);
      
      // Transform to {value, label} format
      // Use lowercase name as value to match parameter storage
      const types = data.map(type => ({
        value: type.name?.toLowerCase() || type.asset_type_id,
        label: type.name
      }));
      
      setAssetTypes(types);
      
      // Set first asset type as selected
      if (types.length > 0 && !selectedAssetType) {
        setSelectedAssetType(types[0].value);
      }
    } catch (error) {
      console.error('Failed to load asset types:', error);
      toast.error('Failed to load asset types');
      
      // Fallback to default types if API fails
      const fallbackTypes = [
        { value: 'transformer', label: 'Transformer' },
        { value: 'switchgear', label: 'Switchgear' },
        { value: 'motors', label: 'Motors' },
        { value: 'generators', label: 'Generators' },
        { value: 'cables', label: 'Cables' },
        { value: 'ups', label: 'UPS' }
      ];
      setAssetTypes(fallbackTypes);
      setSelectedAssetType(fallbackTypes[0].value);
    } finally {
      setLoadingAssetTypes(false);
    }
  };

  const loadParameters = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.REACT_APP_BACKEND_URL || '';
      const url = `${apiUrl}/api/nameplate-parameters${showInactive ? '?show_inactive=true' : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      console.log('Loaded parameters:', data);
      setParameters(data);
    } catch (error) {
      console.error('Failed to load parameters:', error);
      toast.error('Failed to load parameters');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setFormData({
      key: '',
      label: '',
      example: '',
      category: 'Electrical'
    });
    setShowAddDialog(true);
  };

  const handleEditClick = (param) => {
    setEditingParameter(param);
    setFormData({
      key: param.key,
      label: param.label,
      example: param.example,
      category: param.category
    });
    setShowEditDialog(true);
  };

  const handleAddParameter = async () => {
    if (!formData.key || !formData.label || !formData.example) {
      toast.error('Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const apiUrl = process.env.REACT_APP_BACKEND_URL || '';
      const response = await fetch(`${apiUrl}/api/nameplate-parameters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_type: selectedAssetType,
          parameter: formData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add parameter');
      }

      toast.success('Parameter added successfully');
      setShowAddDialog(false);
      loadParameters();
    } catch (error) {
      console.error('Failed to add parameter:', error);
      toast.error(error.message || 'Failed to add parameter');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateParameter = async () => {
    if (!formData.key || !formData.label || !formData.example) {
      toast.error('Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const apiUrl = process.env.REACT_APP_BACKEND_URL || '';
      const response = await fetch(`${apiUrl}/api/nameplate-parameters`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_type: selectedAssetType,
          old_key: editingParameter.key,
          parameter: formData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update parameter');
      }

      toast.success('Parameter updated successfully');
      setShowEditDialog(false);
      loadParameters();
    } catch (error) {
      console.error('Failed to update parameter:', error);
      toast.error(error.message || 'Failed to update parameter');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteParameter = async (paramKey) => {
    if (!confirm(`Are you sure you want to deactivate the parameter "${paramKey}"?\n\nThis will hide it from recommendations but preserve historical data.`)) {
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_BACKEND_URL || '';
      const response = await fetch(`${apiUrl}/api/nameplate-parameters`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_type: selectedAssetType,
          parameter_key: paramKey
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to deactivate parameter');
      }

      toast.success('Parameter deactivated successfully');
      loadParameters();
    } catch (error) {
      console.error('Failed to deactivate parameter:', error);
      toast.error(error.message || 'Failed to deactivate parameter');
    }
  };

  const handleReactivateParameter = async (paramKey) => {
    try {
      const apiUrl = process.env.REACT_APP_BACKEND_URL || '';
      const response = await fetch(`${apiUrl}/api/nameplate-parameters/reactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_type: selectedAssetType,
          parameter_key: paramKey
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to reactivate parameter');
      }

      toast.success('Parameter reactivated successfully');
      loadParameters();
    } catch (error) {
      console.error('Failed to reactivate parameter:', error);
      toast.error(error.message || 'Failed to reactivate parameter');
    }
  };

  // Helper function to get parameter count (respecting showInactive toggle)
  const getParameterCount = (assetType) => {
    const params = parameters[assetType] || [];
    if (!showInactive) {
      return params.filter(param => param.is_active !== false).length;
    }
    return params.length;
  };

  // Filter parameters based on showInactive toggle
  const currentParameters = useMemo(() => {
    const params = parameters[selectedAssetType] || [];
    
    // If showInactive is false, filter out inactive parameters
    if (!showInactive) {
      return params.filter(param => param.is_active !== false);
    }
    
    return params;
  }, [parameters, selectedAssetType, showInactive]);

  if (currentUser?.role !== 'master') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader onLogout={onLogout} />

      <main className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                ← Back to Overview
              </Button>
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Database className="w-8 h-8 text-primary" />
                  Parameter Library Management
                </h1>
                <p className="text-muted-foreground mt-1">
                  Manage standard nameplate parameters for all asset types
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              Master Admin Only
            </Badge>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Why Manage Standard Parameters?</p>
                <p className="text-blue-800">
                  Standard parameters ensure consistency across all assets, enabling powerful analytics, 
                  reporting, and comparisons. When users add nameplate details, they'll see these as recommendations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Asset Type Selector */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Select Asset Type</CardTitle>
                <CardDescription>
                  Choose an asset type to view and manage its parameters. 
                  Asset types sync automatically from Asset Type Management.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={loadAssetTypes}
                  disabled={loadingAssetTypes}
                  size="sm"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {loadingAssetTypes ? 'Refreshing...' : 'Refresh Types'}
                </Button>
                <Button onClick={handleAddClick} disabled={!selectedAssetType}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Parameter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingAssetTypes ? (
              <p className="text-center py-4 text-muted-foreground">Loading asset types...</p>
            ) : assetTypes.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">
                No asset types found. Please add asset types in Asset Type Management first.
              </p>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {assetTypes.map(type => (
                  <Button
                    key={type.value}
                    variant={selectedAssetType === type.value ? 'default' : 'outline'}
                    onClick={() => setSelectedAssetType(type.value)}
                  >
                    {type.label}
                    <Badge variant="secondary" className="ml-2">
                      {getParameterCount(type.value)}
                    </Badge>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parameters List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="capitalize">{selectedAssetType} Parameters</CardTitle>
                <CardDescription>
                  {currentParameters.length} standard parameters defined
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="show-inactive"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
                <Label htmlFor="show-inactive" className="cursor-pointer text-sm">
                  Show Inactive Parameters
                </Label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading parameters...</p>
            ) : currentParameters.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No parameters defined for this asset type. Click "Add Parameter" to create one.
              </p>
            ) : (
              <div className="space-y-3">
                {currentParameters.map((param, idx) => {
                  const isInactive = param.is_active === false;
                  return (
                    <Card 
                      key={idx} 
                      className={`border-border/50 ${isInactive ? 'opacity-50 bg-gray-50' : ''}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{param.label}</h4>
                              <Badge variant="outline">{param.category}</Badge>
                              {isInactive && (
                                <Badge variant="secondary" className="bg-red-100 text-red-700">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                              <div>
                                <span className="text-muted-foreground">Key:</span>
                                <code className="ml-2 bg-muted px-2 py-0.5 rounded">{param.key}</code>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Example:</span>
                                <span className="ml-2 text-blue-600">{param.example}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!isInactive ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditClick(param)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteParameter(param.key)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReactivateParameter(param.key)}
                                className="text-green-600 hover:text-green-700"
                              >
                                Reactivate
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add Parameter Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Parameter</DialogTitle>
            <DialogDescription>
              Add a new standard parameter for {assetTypes.find(t => t.value === selectedAssetType)?.label}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="key">Parameter Key *</Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="e.g., rated_power"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use lowercase with underscores (e.g., primary_voltage)
              </p>
            </div>

            <div>
              <Label htmlFor="label">Display Label *</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g., Rated Power"
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="example">Example Value *</Label>
              <Input
                id="example"
                value={formData.example}
                onChange={(e) => setFormData({ ...formData, example: e.target.value })}
                placeholder="e.g., 1000 kVA"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddParameter} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Adding...' : 'Add Parameter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Parameter Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Parameter</DialogTitle>
            <DialogDescription>
              Update parameter details for {assetTypes.find(t => t.value === selectedAssetType)?.label}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-key">Parameter Key *</Label>
              <Input
                id="edit-key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="e.g., rated_power"
              />
            </div>

            <div>
              <Label htmlFor="edit-label">Display Label *</Label>
              <Input
                id="edit-label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g., Rated Power"
              />
            </div>

            <div>
              <Label htmlFor="edit-category">Category *</Label>
              <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-example">Example Value *</Label>
              <Input
                id="edit-example"
                value={formData.example}
                onChange={(e) => setFormData({ ...formData, example: e.target.value })}
                placeholder="e.g., 1000 kVA"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateParameter} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Updating...' : 'Update Parameter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
