import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

export const WorkOrderModal = ({ isOpen, onClose, onSave, editingOrder, currentUser }) => {
  const [formData, setFormData] = useState({
    wo_number: '',
    description: '',
    status: 'draft',
    validity_start: '',
    validity_end: '',
    assets: [],
    test_templates: {}
  });
  
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [availableTests, setAvailableTests] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [loadingTests, setLoadingTests] = useState(false);
  const [saving, setSaving] = useState(false);

  const API_URL = process.env.REACT_APP_BACKEND_URL || '';

  useEffect(() => {
    if (editingOrder) {
      // Normalize data to ensure all fields have values
      const normalizedOrder = {
        ...editingOrder,
        wo_number: editingOrder.wo_number || '',
        description: editingOrder.description || '',
        status: editingOrder.status || 'draft',
        validity_start: editingOrder.validity_start || '',
        validity_end: editingOrder.validity_end || ''
      };
      setFormData(normalizedOrder);
      setSelectedAssets(editingOrder.assets || []);
    } else {
      resetForm();
    }
    
    if (isOpen) {
      loadAssets();
      loadTestTemplates();
    }
  }, [editingOrder, isOpen]);

  const resetForm = () => {
    setFormData({
      wo_number: '',
      description: '',
      status: 'draft',
      validity_start: '',
      validity_end: '',
      assets: [],
      test_templates: {}
    });
    setSelectedAssets([]);
  };

  const loadAssets = async () => {
    setLoadingAssets(true);
    try {
      const companyId = currentUser?.company_id;
      const response = await fetch(`${API_URL}/api/assets?company_id=${companyId}`);
      const data = await response.json();
      setAvailableAssets(Array.isArray(data) ? data : data.assets || []);
    } catch (error) {
      console.error('Failed to load assets:', error);
      toast.error('Failed to load assets');
    } finally {
      setLoadingAssets(false);
    }
  };

  const loadTestTemplates = async () => {
    setLoadingTests(true);
    try {
      const response = await fetch(`${API_URL}/api/test-templates`);
      const data = await response.json();
      setAvailableTests(data);
    } catch (error) {
      console.error('Failed to load test templates:', error);
      toast.error('Failed to load test templates');
    } finally {
      setLoadingTests(false);
    }
  };

  const toggleAsset = (assetId) => {
    setSelectedAssets(prev => {
      if (prev.includes(assetId)) {
        // Remove asset and its test templates
        const newTemplates = { ...formData.test_templates };
        delete newTemplates[assetId];
        setFormData({ ...formData, test_templates: newTemplates });
        return prev.filter(id => id !== assetId);
      } else {
        return [...prev, assetId];
      }
    });
  };

  const toggleTestForAsset = (assetId, testId) => {
    setFormData(prev => {
      const templates = { ...prev.test_templates };
      if (!templates[assetId]) {
        templates[assetId] = [];
      }
      
      if (templates[assetId].includes(testId)) {
        templates[assetId] = templates[assetId].filter(id => id !== testId);
        if (templates[assetId].length === 0) {
          delete templates[assetId];
        }
      } else {
        templates[assetId] = [...templates[assetId], testId];
      }
      
      return { ...prev, test_templates: templates };
    });
  };

  const getTestsForAsset = (assetId) => {
    const asset = availableAssets.find(a => a.asset_id === assetId);
    if (!asset) return [];
    
    return availableTests.filter(test => 
      test.asset_type === asset.asset_type ||
      test.applicable_asset_types?.includes(asset.asset_type)
    );
  };

  const handleSubmit = async () => {
    // Validation - safely handle undefined values
    if (!(formData.wo_number || '').trim()) {
      toast.error('WO Number is required');
      return;
    }
    if (!(formData.description || '').trim()) {
      toast.error('Description is required');
      return;
    }
    // Assets are optional for editing existing orders
    if (!editingOrder && selectedAssets.length === 0) {
      toast.error('Please select at least one asset');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        company_id: currentUser?.company_id,
        assets: selectedAssets,
        created_by: currentUser?.username || 'admin'
      };

      const url = editingOrder 
        ? `${API_URL}/api/work-orders/${editingOrder.wo_id}`
        : `${API_URL}/api/work-orders`;
      
      const method = editingOrder ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to save work order');
      }

      toast.success(editingOrder ? 'Work Order updated' : 'Work Order created');
      onSave();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Failed to save work order:', error);
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingOrder ? 'Edit Work Order' : 'Create New Work Order'}
          </DialogTitle>
          <DialogDescription>
            Create a work order for internal operations and routine checks
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold border-b pb-2">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="wo_number">WO Number *</Label>
                <Input
                  id="wo_number"
                  value={formData.wo_number}
                  onChange={(e) => setFormData({ ...formData, wo_number: e.target.value })}
                  placeholder="WO-2025-001"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the work to be performed..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="validity_start">Validity Start</Label>
                <Input
                  id="validity_start"
                  type="date"
                  value={formData.validity_start}
                  onChange={(e) => setFormData({ ...formData, validity_start: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="validity_end">Validity End</Label>
                <Input
                  id="validity_end"
                  type="date"
                  value={formData.validity_end}
                  onChange={(e) => setFormData({ ...formData, validity_end: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Asset Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold border-b pb-2">
              Select Assets * ({selectedAssets.length} selected)
            </h3>
            
            {loadingAssets ? (
              <p className="text-sm text-muted-foreground">Loading assets...</p>
            ) : availableAssets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assets found for your company</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-2">
                {availableAssets.map(asset => (
                  <label
                    key={asset.asset_id}
                    className="flex items-start gap-2 p-2 border rounded hover:bg-accent cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAssets.includes(asset.asset_id)}
                      onChange={() => toggleAsset(asset.asset_id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{asset.asset_name || asset.asset_id}</p>
                      <p className="text-xs text-muted-foreground">{asset.asset_type}</p>
                      {asset.location && (
                        <p className="text-xs text-muted-foreground">{asset.location}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Test Template Selection */}
          {selectedAssets.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-2">Select Test Templates</h3>
              
              {selectedAssets.map(assetId => {
                const asset = availableAssets.find(a => a.asset_id === assetId);
                const tests = getTestsForAsset(assetId);
                const selectedTests = formData.test_templates[assetId] || [];
                
                return (
                  <div key={assetId} className="border rounded p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">{asset?.asset_name || assetId}</h4>
                      <Badge variant="secondary">{selectedTests.length} tests selected</Badge>
                    </div>
                    
                    {tests.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No test templates available</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {tests.map(test => (
                          <label
                            key={test.test_id}
                            className="flex items-center gap-2 text-sm p-2 border rounded hover:bg-accent cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedTests.includes(test.test_id)}
                              onChange={() => toggleTestForAsset(assetId, test.test_id)}
                            />
                            <span className="truncate">{test.test_name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : editingOrder ? 'Update' : 'Create'} Work Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
