import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { X, Upload, Plus, Check, Grid3X3, List } from 'lucide-react';
import { toast } from 'sonner';
import { AssetTestMatrix } from './AssetTestMatrix';

export const SalesOrderModal = ({ isOpen, onClose, onSave, editingOrder, viewingOrder, companies }) => {
  const isViewOnly = !!viewingOrder && !editingOrder;
  const orderToDisplay = viewingOrder || editingOrder;
  
  const [formData, setFormData] = useState({
    so_number: '',
    company_id: '',
    customer_name: '',
    project_name: '',
    scope_of_work: '',
    quotation_number: '',
    po_number: '',
    sales_person: '',
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
  const [uploadedFile, setUploadedFile] = useState(null);
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [viewMode, setViewMode] = useState('matrix'); // 'matrix' or 'list'
  const [saving, setSaving] = useState(false);

  const API_URL = process.env.REACT_APP_BACKEND_URL || '';

  useEffect(() => {
    const orderData = orderToDisplay;
    if (orderData) {
      // Handle legacy data that might have 'description' instead of 'scope_of_work'
      const normalizedOrder = {
        ...orderData,
        company_id: orderData.company_id || '',
        scope_of_work: orderData.scope_of_work || orderData.description || '',
        customer_name: orderData.customer_name || '',
        project_name: orderData.project_name || '',
        quotation_number: orderData.quotation_number || '',
        po_number: orderData.po_number || '',
        sales_person: orderData.sales_person || '',
        status: orderData.status || 'draft',
        validity_start: orderData.validity_start || '',
        validity_end: orderData.validity_end || ''
      };
      setFormData(normalizedOrder);
      setSelectedAssets(orderData.assets || []);
      // Reset available assets before loading new ones to prevent duplicates
      setAvailableAssets([]);
      if (orderData.company_id) {
        loadAssets(orderData.company_id);
      }
    } else {
      resetForm();
    }
  }, [orderToDisplay, isOpen]);

  const resetForm = () => {
    setFormData({
      so_number: '',
      company_id: '',
      customer_name: '',
      project_name: '',
      scope_of_work: '',
      quotation_number: '',
      po_number: '',
      sales_person: '',
      status: 'draft',
      validity_start: '',
      validity_end: '',
      assets: [],
      test_templates: {}
    });
    setSelectedAssets([]);
    setAvailableAssets([]);
    setUploadedFile(null);
  };

  const loadAssets = async (companyId) => {
    setLoadingAssets(true);
    try {
      const response = await fetch(`${API_URL}/api/assets?company_id=${companyId}`);
      const data = await response.json();
      const assetsList = Array.isArray(data) ? data : data.assets || [];
      // Deduplicate by asset_id
      const uniqueAssets = assetsList.filter((asset, index, self) =>
        index === self.findIndex(a => a.asset_id === asset.asset_id)
      );
      setAvailableAssets(uniqueAssets);
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
      // Only fetch global tests for Sales Order selection
      const response = await fetch(`${API_URL}/api/tests?for_sales_order=true`);
      const data = await response.json();
      setAvailableTests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load test templates:', error);
      toast.error('Failed to load test templates');
    } finally {
      setLoadingTests(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTestTemplates();
    }
  }, [isOpen]);

  const handleCompanyChange = (companyId) => {
    setFormData({ ...formData, company_id: companyId, customer_name: '', assets: [], test_templates: {} });
    setSelectedAssets([]);
    
    if (companyId) {
      const company = companies.find(c => c.company_id === companyId);
      if (company) {
        setFormData(prev => ({ ...prev, customer_name: company.company_name || company.name }));
      }
      loadAssets(companyId);
    } else {
      setAvailableAssets([]);
    }
  };

  const handleCreateNewCompany = async () => {
    if (!newCompanyName.trim()) {
      toast.error('Please enter company name');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCompanyName,
          industry: 'General',
          created_by: 'master'
        })
      });

      if (!response.ok) throw new Error('Failed to create company');

      const newCompany = await response.json();
      toast.success('Company created successfully');
      setShowNewCompany(false);
      setNewCompanyName('');
      
      // Reload companies list and select new one
      handleCompanyChange(newCompany.company_id);
    } catch (error) {
      console.error('Failed to create company:', error);
      toast.error('Failed to create company');
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
    
    // Filter tests that are applicable to this asset type
    return availableTests.filter(test => 
      test.applicable_asset_types?.some(type => 
        type.toLowerCase() === asset.asset_type?.toLowerCase()
      )
    );
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleSubmit = async () => {
    // Validation - safely handle undefined values
    if (!(formData.so_number || '').trim()) {
      toast.error('SO Number is required');
      return;
    }
    if (!formData.company_id) {
      toast.error('Company is required');
      return;
    }
    if (!(formData.quotation_number || '').trim()) {
      toast.error('Quotation Number is required');
      return;
    }
    if (!(formData.scope_of_work || '').trim()) {
      toast.error('Scope of Work is required');
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
        assets: selectedAssets,
        created_by: 'master' // Replace with actual user
      };

      const url = editingOrder 
        ? `${API_URL}/api/sales-orders/${editingOrder.so_id}`
        : `${API_URL}/api/sales-orders`;
      
      const method = editingOrder ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to save sales order');
      }

      const result = await response.json();

      // Upload document if selected
      if (uploadedFile && result.so_id) {
        const formData = new FormData();
        formData.append('document', uploadedFile);

        await fetch(`${API_URL}/api/sales-orders/${result.so_id}/upload-document`, {
          method: 'POST',
          body: formData
        });
      }

      toast.success(editingOrder ? 'Sales Order updated' : 'Sales Order created');
      onSave();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Failed to save sales order:', error);
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isViewOnly ? 'View Sales Order' : editingOrder ? 'Edit Sales Order' : 'Create New Sales Order'}
          </DialogTitle>
          <DialogDescription>
            {isViewOnly 
              ? 'Sales order details (read-only)' 
              : 'Create a sales order for external customer testing work'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold border-b pb-2">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="so_number">SO Number *</Label>
                <Input
                  id="so_number"
                  value={formData.so_number}
                  onChange={(e) => setFormData({ ...formData, so_number: e.target.value })}
                  placeholder="SO-2025-001"
                  disabled={isViewOnly}
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm disabled:bg-muted disabled:cursor-not-allowed"
                  disabled={isViewOnly}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Company Selection */}
            <div>
              <Label htmlFor="company">Company *</Label>
              {isViewOnly ? (
                <Input
                  value={companies.find(c => c.company_id === formData.company_id)?.company_name || formData.customer_name || '-'}
                  disabled
                />
              ) : !showNewCompany ? (
                <div className="flex gap-2">
                  <select
                    id="company"
                    value={formData.company_id}
                    onChange={(e) => handleCompanyChange(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="">Select Company</option>
                    {companies.map(company => (
                      <option key={company.company_id} value={company.company_id}>
                        {company.company_name || company.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewCompany(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter new company name"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                  />
                  <Button onClick={handleCreateNewCompany}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewCompany(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder="Customer/Company Name"
                  disabled={isViewOnly}
                />
              </div>

              <div>
                <Label htmlFor="project_name">Project Name</Label>
                <Input
                  id="project_name"
                  value={formData.project_name}
                  onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                  placeholder="Optional"
                  disabled={isViewOnly}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="scope_of_work">Scope of Work *</Label>
              <Textarea
                id="scope_of_work"
                value={formData.scope_of_work}
                onChange={(e) => setFormData({ ...formData, scope_of_work: e.target.value })}
                placeholder="Describe the testing work to be performed..."
                rows={3}
                disabled={isViewOnly}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quotation_number">Quotation Number <span className="text-red-500">*</span></Label>
                <Input
                  id="quotation_number"
                  value={formData.quotation_number}
                  onChange={(e) => setFormData({ ...formData, quotation_number: e.target.value })}
                  placeholder="QT-2025-001"
                  required
                  disabled={isViewOnly}
                />
              </div>

              <div>
                <Label htmlFor="po_number">PO Number</Label>
                <Input
                  id="po_number"
                  value={formData.po_number}
                  onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                  placeholder="Optional"
                  disabled={isViewOnly}
                />
              </div>

              <div>
                <Label htmlFor="sales_person">Sales Person</Label>
                <Input
                  id="sales_person"
                  value={formData.sales_person}
                  onChange={(e) => setFormData({ ...formData, sales_person: e.target.value })}
                  placeholder="Optional"
                  disabled={isViewOnly}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="validity_start">Validity Start</Label>
                <Input
                  id="validity_start"
                  type="date"
                  value={formData.validity_start}
                  onChange={(e) => setFormData({ ...formData, validity_start: e.target.value })}
                  disabled={isViewOnly}
                />
              </div>

              <div>
                <Label htmlFor="validity_end">Validity End</Label>
                <Input
                  id="validity_end"
                  type="date"
                  value={formData.validity_end}
                  onChange={(e) => setFormData({ ...formData, validity_end: e.target.value })}
                  disabled={isViewOnly}
                />
              </div>
            </div>

            {/* File Upload - Hide in view mode */}
            {!isViewOnly && (
              <div>
                <Label>Upload SO Document</Label>
                <div className="mt-2">
                  <label className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-md cursor-pointer hover:bg-accent">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">
                      {uploadedFile ? uploadedFile.name : 'Choose file...'}
                    </span>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.jpg,.png"
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}
            
            {/* Show uploaded document link in view mode */}
            {isViewOnly && orderToDisplay?.so_document_url && (
              <div>
                <Label>SO Document</Label>
                <a 
                  href={orderToDisplay.so_document_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  View Document
                </a>
              </div>
            )}
          </div>

          {/* Asset Selection */}
          {formData.company_id && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-sm font-semibold">
                  {isViewOnly ? 'Assets' : 'Select Assets *'} ({selectedAssets.length} selected)
                </h3>
                {!isViewOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedAssets.length === availableAssets.length) {
                        setSelectedAssets([]);
                      } else {
                        setSelectedAssets(availableAssets.map(a => a.asset_id));
                      }
                    }}
                    className="text-xs"
                  >
                    {selectedAssets.length === availableAssets.length ? 'Deselect All' : 'Select All'}
                  </Button>
                )}
              </div>
              
              {loadingAssets ? (
                <p className="text-sm text-muted-foreground">Loading assets...</p>
              ) : availableAssets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No assets found for this company</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-2">
                  {availableAssets.map(asset => (
                    <label
                      key={asset.asset_id}
                      className={`flex items-start gap-2 p-2 border rounded ${isViewOnly ? '' : 'hover:bg-accent cursor-pointer'}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedAssets.includes(asset.asset_id)}
                        onChange={() => !isViewOnly && toggleAsset(asset.asset_id)}
                        className="mt-1"
                        disabled={isViewOnly}
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
          )}

          {/* Test Template Selection - Matrix View */}
          {selectedAssets.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{isViewOnly ? 'Test Configuration' : 'Configure Tests for Assets'}</h3>
                {!isViewOnly && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'matrix' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('matrix')}
                    className="gap-1"
                  >
                    <Grid3X3 className="w-4 h-4" />
                    Matrix
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="gap-1"
                  >
                    <List className="w-4 h-4" />
                    List
                  </Button>
                </div>
                )}
              </div>
              
              {viewMode === 'matrix' ? (
                <AssetTestMatrix
                  assets={availableAssets.filter(a => selectedAssets.includes(a.asset_id))}
                  tests={availableTests}
                  selectedTests={formData.test_templates}
                  onSelectionChange={(newSelection) => {
                    if (!isViewOnly) {
                      setFormData({ ...formData, test_templates: newSelection });
                    }
                  }}
                  getTestsForAssetType={getTestsForAsset}
                />
              ) : (
                /* List View - Original Implementation */
                <div className="space-y-4">
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
                          <p className="text-xs text-muted-foreground">No test templates available for {asset?.asset_type || 'this asset type'}</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {tests.map(test => (
                              <label
                                key={test.test_id}
                                className={`flex items-center gap-2 text-sm p-2 border rounded ${isViewOnly ? '' : 'hover:bg-accent cursor-pointer'}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedTests.includes(test.test_id)}
                                  onChange={() => !isViewOnly && toggleTestForAsset(assetId, test.test_id)}
                                  disabled={isViewOnly}
                                />
                                <div className="flex-1 min-w-0">
                                  <span className="truncate block">{test.name}</span>
                                  <span className="text-xs text-muted-foreground">{test.category}</span>
                                </div>
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
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {isViewOnly ? 'Close' : 'Cancel'}
          </Button>
          {!isViewOnly && (
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : editingOrder ? 'Update' : 'Create'} Sales Order
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
