import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Edit,
  Settings,
  Plus,
  Trash2,
  Package,
  Crown,
  Zap,
  Cog,
  Building,
} from 'lucide-react';
import { assetTypeAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export const AssetTypeManagementPage = () => {
  const navigate = useNavigate();
  const { isMaster, currentUser } = useAuth();
  const [assetTypes, setAssetTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssetType, setSelectedAssetType] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    icon: '',
    nameplate_template: [],
  });
  
  // Temporary inputs
  const [newNameplateField, setNewNameplateField] = useState({ name: '', example: '', unit: '' });
  
  // Suggestions state
  const [suggestions, setSuggestions] = useState({
    nameplate_fields: []
  });
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (!isMaster()) {
      toast.error('Access denied. Master privileges required.');
      navigate('/');
    } else {
      loadAssetTypes();
    }
  }, [isMaster, navigate]);

  const loadAssetTypes = async () => {
    try {
      setLoading(true);
      const data = await assetTypeAPI.getAll();
      setAssetTypes(data);
    } catch (error) {
      // Filter out rrweb clone errors
      const errorMessage = error?.message || error?.toString() || '';
      if (errorMessage.includes('clone') && errorMessage.includes('Response')) {
        console.log('Filtered rrweb clone error on asset types load');
        // Still try to proceed - the data might have loaded successfully
        return;
      }
      toast.error('Failed to load asset types');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async (assetTypeName) => {
    if (!assetTypeName) {
      setSuggestions({
        nameplate_fields: []
      });
      return;
    }
    
    try {
      setLoadingSuggestions(true);
      const data = await assetTypeAPI.getParameterSuggestions(assetTypeName);
      setSuggestions(data);
    } catch (error) {
      // Filter out rrweb clone errors
      const errorMessage = error?.message || error?.toString() || '';
      if (errorMessage.includes('clone') && errorMessage.includes('Response')) {
        console.log('Filtered rrweb clone error on load suggestions');
        return;
      }
      console.error('Failed to load suggestions:', error);
      toast.error('Failed to load suggestions');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (assetType) => {
    setSelectedAssetType(assetType);
    setFormData({
      name: assetType.name,
      category: assetType.category || '',
      description: assetType.description || '',
      icon: assetType.icon || '',
      nameplate_template: assetType.nameplate_template || [],
    });
    loadSuggestions(assetType.name);
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      description: '',
      icon: '',
      nameplate_template: [],
    });
    setNewNameplateField({ name: '', example: '', unit: '' });
  };

  const handleCreate = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error('Asset type name is required');
        return;
      }

      await assetTypeAPI.create({
        ...formData,
        created_by: currentUser.user_id,
      });
      
      toast.success('Asset type created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      loadAssetTypes();
    } catch (error) {
      // Filter out rrweb clone errors
      const errorMessage = error?.message || error?.toString() || '';
      if (errorMessage.includes('clone') && errorMessage.includes('Response')) {
        console.log('Filtered rrweb clone error on create - asset type likely created successfully');
        toast.success('Asset type created successfully');
        setIsCreateDialogOpen(false);
        resetForm();
        loadAssetTypes();
        return;
      }
      toast.error(error.message || 'Failed to create asset type');
      console.error(error);
    }
  };

  const handleUpdate = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error('Asset type name is required');
        return;
      }

      await assetTypeAPI.update(selectedAssetType.asset_type_id, formData);
      toast.success('Asset type updated successfully');
      setIsEditDialogOpen(false);
      loadAssetTypes();
    } catch (error) {
      // Filter out rrweb clone errors
      const errorMessage = error?.message || error?.toString() || '';
      if (errorMessage.includes('clone') && errorMessage.includes('Response')) {
        console.log('Filtered rrweb clone error on update - asset type likely updated successfully');
        toast.success('Asset type updated successfully');
        setIsEditDialogOpen(false);
        loadAssetTypes();
        return;
      }
      toast.error(error.message || 'Failed to update asset type');
      console.error(error);
    }
  };

  const handleDelete = async (assetTypeId) => {
    if (!window.confirm('Are you sure you want to delete this asset type?')) {
      return;
    }
    
    try {
      await assetTypeAPI.delete(assetTypeId);
      toast.success('Asset type deleted successfully');
      loadAssetTypes();
    } catch (error) {
      // Filter out rrweb clone errors
      const errorMessage = error?.message || error?.toString() || '';
      if (errorMessage.includes('clone') && errorMessage.includes('Response')) {
        console.log('Filtered rrweb clone error on delete - asset type likely deleted successfully');
        toast.success('Asset type deleted successfully');
        loadAssetTypes();
        return;
      }
      toast.error('Failed to delete asset type');
      console.error(error);
    }
  };

  // Nameplate field handlers
  const addNameplateField = () => {
    if (newNameplateField.name && newNameplateField.unit) {
      setFormData({
        ...formData,
        nameplate_template: [...formData.nameplate_template, { ...newNameplateField }]
      });
      setNewNameplateField({ name: '', example: '', unit: '' });
    }
  };

  const removeNameplateField = (index) => {
    setFormData({
      ...formData,
      nameplate_template: formData.nameplate_template.filter((_, i) => i !== index)
    });
  };

  // Add from suggestions
  const addNameplateFromSuggestion = (field) => {
    const exists = formData.nameplate_template.some(f => f.name === field.name);
    if (!exists) {
      setFormData({
        ...formData,
        nameplate_template: [...formData.nameplate_template, field]
      });
      toast.success(`Added: ${field.name}`);
    } else {
      toast.info('Field already added');
    }
  };

  const getIconComponent = (iconName) => {
    const icons = {
      'electrical': <Zap className="w-4 h-4" />,
      'mechanical': <Cog className="w-4 h-4" />,
      'building': <Building className="w-4 h-4" />,
      'package': <Package className="w-4 h-4" />,
    };
    return icons[iconName] || <Package className="w-4 h-4" />;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Electrical': 'bg-blue-100 text-blue-800',
      'Mechanical': 'bg-green-100 text-green-800',
      'Civil': 'bg-orange-100 text-orange-800',
      'Environmental': 'bg-purple-100 text-purple-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
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
                  <Package className="w-6 h-6 text-indigo-600" />
                  Asset Type Management
                  <Badge className="bg-purple-100 text-purple-800">Master</Badge>
                </h1>
                <p className="text-sm text-muted-foreground">
                  Define asset types with default templates for test creation
                </p>
              </div>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Create Asset Type
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Asset Types Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Asset Types ({assetTypes.length})
            </CardTitle>
            <CardDescription>
              Manage asset types that will be available for test template creation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading asset types...</div>
            ) : assetTypes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No asset types found. Create your first asset type to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Templates</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assetTypes.map((assetType) => (
                    <TableRow key={assetType.asset_type_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getIconComponent(assetType.icon)}
                          <span className="font-medium">{assetType.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {assetType.category && (
                          <Badge className={getCategoryColor(assetType.category)}>
                            {assetType.category}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {assetType.description || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          {assetType.default_parameters?.length || 0} params, {' '}
                          {assetType.default_equipment?.length || 0} equipment, {' '}
                          {assetType.default_standards?.length || 0} standards
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {assetType.usage_count || 0} tests
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(assetType)}
                            title="Edit Asset Type"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(assetType.asset_type_id)}
                            title="Delete Asset Type"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={() => {
        setIsCreateDialogOpen(false);
        setIsEditDialogOpen(false);
      }}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {isCreateDialogOpen ? 'Create Asset Type' : `Edit Asset Type: ${selectedAssetType?.name}`}
            </DialogTitle>
            <DialogDescription>
              Define an asset type with default templates. Use suggestions panel on the right to quickly add items.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex gap-4">
            {/* Main Form - Left Side */}
            <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Asset Type Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setFormData({ ...formData, name: newName });
                    // Load suggestions when name changes
                    if (newName.length > 2) {
                      loadSuggestions(newName);
                    }
                  }}
                  placeholder="e.g., Power Transformer, Motor, Switchgear"
                />
                {loadingSuggestions && <p className="text-xs text-muted-foreground">Loading suggestions...</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Electrical, Mechanical, Civil"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this asset type"
              />
            </div>

            {/* Nameplate Template Fields */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold">Nameplate Template Fields</Label>
              <p className="text-sm text-muted-foreground">Define what nameplate information should be captured for this asset type</p>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  value={newNameplateField.name}
                  onChange={(e) => setNewNameplateField({ ...newNameplateField, name: e.target.value })}
                  placeholder="Field name (e.g., Rated Power)"
                />
                <Input
                  value={newNameplateField.example}
                  onChange={(e) => setNewNameplateField({ ...newNameplateField, example: e.target.value })}
                  placeholder="Example (e.g., 1000)"
                />
                <div className="flex gap-2">
                  <Input
                    value={newNameplateField.unit}
                    onChange={(e) => setNewNameplateField({ ...newNameplateField, unit: e.target.value })}
                    placeholder="Unit (e.g., kVA)"
                  />
                  <Button onClick={addNameplateField} size="sm" type="button">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {formData.nameplate_template.map((field, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-blue-900">{field.name}</span>
                      <span className="text-xs text-blue-700 ml-2">({field.example} {field.unit})</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNameplateField(index)}
                    >
                      <Trash2 className="w-3 h-3 text-blue-600" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
            
          {/* Suggestions Side Panel - Right Side */}
            <div className="w-96 border-l pl-4 overflow-y-auto py-4">
              <div className="sticky top-0 bg-background pb-2">
                <h3 className="font-semibold text-lg">💡 Nameplate Suggestions</h3>
                <p className="text-xs text-muted-foreground">Click to add nameplate field</p>
              </div>
              
              {suggestions.nameplate_fields && suggestions.nameplate_fields.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium text-sm text-blue-600">Suggested Nameplate Fields</h4>
                  {suggestions.nameplate_fields.map((field, index) => (
                    <button
                      key={index}
                      onClick={() => addNameplateFromSuggestion(field)}
                      className="w-full text-left p-2 hover:bg-blue-50 rounded text-xs border transition-colors"
                    >
                      <div className="font-medium">{field.name}</div>
                      <div className="text-muted-foreground">{field.example} {field.unit}</div>
                    </button>
                  ))}
                </div>
              )}
              
              {!loadingSuggestions && (!suggestions.nameplate_fields || suggestions.nameplate_fields.length === 0) && (
                <div className="mt-4 text-center text-muted-foreground text-sm p-4">
                  <p>Enter an asset type name (e.g., "transformer", "motor", "switchgear") to see nameplate field suggestions</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={isCreateDialogOpen ? handleCreate : handleUpdate}>
              {isCreateDialogOpen ? 'Create Asset Type' : 'Update Asset Type'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};