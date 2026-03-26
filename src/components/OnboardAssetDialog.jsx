import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { CheckCircle2, ChevronRight, ChevronLeft, Upload, Image as ImageIcon, X, Plus, MapPin, AlertTriangle, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { assetsAPI, testsAPI, sitesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const OnboardAssetDialog = ({ isOpen, onClose, onSuccess }) => {
  const { currentUser, isMaster } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Asset Type, 2: Site Selection, 3: Asset Details, 4: Photo Upload, 5: Tests
  const [assetTypes, setAssetTypes] = useState([]);
  const [sites, setSites] = useState([]);
  const [availableTests, setAvailableTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  // Quick Site Creation State
  const [showQuickSiteForm, setShowQuickSiteForm] = useState(false);
  const [creatingQuickSite, setCreatingQuickSite] = useState(false);
  const [quickSiteData, setQuickSiteData] = useState({
    site_name: '',
    location: '',
    site_incharge: {
      name: '',
      designation: '',
      phone: '',
      email: ''
    }
  });
  
  const [formData, setFormData] = useState({
    asset_type: '',
    asset_type_id: '',
    site_ids: [],
    asset_name: '',
    manufacturer: '',
    model: '',
    serial_number: '',
    installation_date: '',
    location_detail: '',
    nameplate_template: [],
    nameplate_data: {},
    selected_tests: [],
    asset_photo: null // Will store base64 or file
  });

  // Load asset types and sites when dialog opens or step changes
  useEffect(() => {
    if (isOpen) {
      loadAssetTypes();
      loadSites();
      resetForm();
    }
  }, [isOpen]);

  // Reload sites when reaching site selection step
  useEffect(() => {
    if (step === 2 && isOpen) {
      loadSites(); // Refresh sites to show any newly created ones
    }
  }, [step, isOpen]);

  // Load tests when asset type is selected
  useEffect(() => {
    if (step === 5 && formData.asset_type) {
      loadAvailableTests();
    }
  }, [step, formData.asset_type]);

  const resetForm = () => {
    setStep(1);
    setPhotoPreview(null);
    setShowQuickSiteForm(false);
    setQuickSiteData({ 
      site_name: '', 
      location: '', 
      site_incharge: { name: '', designation: '', phone: '', email: '' }
    });
    setFormData({
      asset_type: '',
      asset_type_id: '',
      site_ids: [],
      asset_name: '',
      manufacturer: '',
      model: '',
      serial_number: '',
      installation_date: '',
      location_detail: '',
      nameplate_template: [],
      nameplate_data: {},
      selected_tests: [],
      asset_photo: null
    });
  };

  // Quick Site Creation Handler
  const handleQuickSiteCreate = async () => {
    if (!quickSiteData.site_name.trim()) {
      toast.error('Please enter a site name');
      return;
    }
    if (!quickSiteData.location.trim()) {
      toast.error('Please enter a location');
      return;
    }
    
    setCreatingQuickSite(true);
    try {
      const newSite = await sitesAPI.create({
        site_name: quickSiteData.site_name,
        location: quickSiteData.location,
        company_id: currentUser?.company_id,
        site_incharge: {
          name: quickSiteData.site_incharge.name || currentUser?.full_name || 'Admin',
          designation: quickSiteData.site_incharge.designation || 'Site Manager',
          phone: quickSiteData.site_incharge.phone || '',
          email: quickSiteData.site_incharge.email || currentUser?.email || ''
        },
        asset_breakdown: {
          transformer: 0,
          switchgear: 0,
          motors: 0,
          generators: 0,
          cables: 0,
          ups: 0
        }
      });
      
      toast.success(`Site "${quickSiteData.site_name}" created successfully!`);
      
      // Refresh sites list
      await loadSites();
      
      // Auto-select the newly created site
      setFormData(prev => ({
        ...prev,
        site_ids: [...prev.site_ids, newSite.site_id]
      }));
      
      // Reset quick site form
      setShowQuickSiteForm(false);
      setQuickSiteData({ 
        site_name: '', 
        location: '', 
        site_incharge: { name: '', designation: '', phone: '', email: '' }
      });
      
    } catch (error) {
      toast.error(error.message || 'Failed to create site');
      console.error('Quick site creation error:', error);
    } finally {
      setCreatingQuickSite(false);
    }
  };

  const loadAssetTypes = async () => {
    try {
      // Using fetch directly since assetTypeAPI is not exposed in the main export
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/asset-types`);
      const types = await response.json();
      setAssetTypes(types);
    } catch (error) {
      toast.error('Failed to load asset types');
    }
  };

  const loadSites = async () => {
    try {
      // Master users see all sites, others see only their company's sites
      const filters = currentUser?.role === 'master' ? {} : { company_id: currentUser?.company_id };
      const allSites = await sitesAPI.getAll(filters);
      setSites(allSites);
    } catch (error) {
      toast.error('Failed to load sites');
      console.error('Load sites error:', error);
    }
  };

  const loadAvailableTests = async () => {
    setLoadingTests(true);
    try {
      const tests = await testsAPI.getAll({ company_id: currentUser?.company_id });
      // Filter tests applicable to selected asset type (case-insensitive comparison)
      const assetTypeLower = formData.asset_type?.toLowerCase();
      const applicable = tests.filter(test => 
        test.applicable_asset_types?.some(type => 
          type?.toLowerCase() === assetTypeLower
        )
      );
      setAvailableTests(applicable);
    } catch (error) {
      toast.error('Failed to load tests');
    } finally {
      setLoadingTests(false);
    }
  };

  const handleAssetTypeSelect = (assetTypeId, autoAdvance = false) => {
    const selectedType = assetTypes.find(at => at.asset_type_id === assetTypeId);
    if (selectedType) {
      setFormData({
        ...formData,
        asset_type: selectedType.name,
        asset_type_id: assetTypeId,
        nameplate_template: selectedType.nameplate_template || []
      });
      // Auto advance to next step on double-click
      if (autoAdvance) {
        setStep(2);
      }
    }
  };

  // Double-click handler for asset type
  const handleAssetTypeDoubleClick = (assetTypeId) => {
    handleAssetTypeSelect(assetTypeId, true);
  };

  const handleSiteToggle = (siteId) => {
    const currentSites = formData.site_ids;
    if (currentSites.includes(siteId)) {
      setFormData({
        ...formData,
        site_ids: currentSites.filter(id => id !== siteId)
      });
    } else {
      setFormData({
        ...formData,
        site_ids: [...currentSites, siteId]
      });
    }
  };

  const handleTestToggle = (testId) => {
    const currentTests = formData.selected_tests;
    if (currentTests.includes(testId)) {
      setFormData({
        ...formData,
        selected_tests: currentTests.filter(id => id !== testId)
      });
    } else {
      setFormData({
        ...formData,
        selected_tests: [...currentTests, testId]
      });
    }
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Convert to base64 for preview and storage
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setPhotoPreview(base64String);
      setFormData({ ...formData, asset_photo: base64String });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setFormData({ ...formData, asset_photo: null });
  };

  const getDefaultAssetImage = (assetType) => {
    // Default placeholder images for each asset type
    const defaultImages = {
      'transformer': 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%236b7280"%3ETransformer%3C/text%3E%3C/svg%3E',
      'switchgear': 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%236b7280"%3ESwitchgear%3C/text%3E%3C/svg%3E',
      'motors': 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%236b7280"%3EMotor%3C/text%3E%3C/svg%3E',
      'generators': 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%236b7280"%3EGenerator%3C/text%3E%3C/svg%3E',
      'cables': 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%236b7280"%3ECable%3C/text%3E%3C/svg%3E',
      'ups': 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%236b7280"%3EUPS%3C/text%3E%3C/svg%3E',
    };
    return defaultImages[assetType] || defaultImages['transformer'];
  };

  const handleNext = () => {
    if (step === 1 && !formData.asset_type) {
      toast.error('Please select an asset type');
      return;
    }
    if (step === 2 && formData.site_ids.length === 0) {
      toast.error('Please select at least one site');
      return;
    }
    if (step === 3 && !formData.asset_name) {
      toast.error('Please enter asset name');
      return;
    }
    // Step 4 (photo) is optional, no validation needed
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      // Create nameplate details from template
      const nameplateDetails = {};
      formData.nameplate_template.forEach(field => {
        nameplateDetails[field.name] = formData.nameplate_data[field.name] || '';
      });

      // Use uploaded photo or default based on asset type
      const photoToUse = formData.asset_photo || getDefaultAssetImage(formData.asset_type);
      
      const assetData = {
        company_id: currentUser.company_id,
        site_id: formData.site_ids[0], // Primary site
        site_ids: formData.site_ids, // All sites
        asset_name: formData.asset_name,
        asset_type: formData.asset_type.toLowerCase(),
        manufacturer: formData.manufacturer,
        model: formData.model,
        serial_number: formData.serial_number,
        installation_date: formData.installation_date || null,
        location_detail: formData.location_detail,
        nameplate_details: nameplateDetails,
        applicable_tests: formData.selected_tests, // Send selected tests
        asset_photo_url: photoToUse // Include photo (uploaded or default)
      };

      console.log('Creating asset with tests:', assetData);
      await assetsAPI.create(assetData);
      toast.success('Asset onboarded successfully!');
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(`Failed to onboard asset: ${error.message}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-4 pb-2 border-b">
          <DialogTitle className="text-base">Onboard New Asset - Step {step} of 5</DialogTitle>
        </DialogHeader>

        {/* Progress Indicator - Compact */}
        <div className="flex items-center gap-1 px-6 py-2 bg-gray-50">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                s <= step ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              {s < 5 && (
                <div className={`flex-1 h-0.5 mx-1 ${s < step ? 'bg-primary' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Content Area with Scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          {/* Step 1: Select Asset Type */}
          {step === 1 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold">Select Asset Type</h3>
                  <p className="text-xs text-muted-foreground">Double-click to select and continue</p>
                </div>
                {isMaster() && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onClose();
                      navigate('/asset-types');
                    }}
                    className="text-xs h-7"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    New Asset Type
                  </Button>
                )}
              </div>
              
              {assetTypes.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="w-6 h-6 text-orange-500" />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">No Asset Types Available</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Asset types need to be configured first
                  </p>
                  {isMaster() && (
                    <Button
                      size="sm"
                      onClick={() => {
                        onClose();
                        navigate('/asset-types');
                      }}
                    >
                      <Settings className="w-3.5 h-3.5 mr-1" />
                      Configure Asset Types
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {assetTypes.map((type) => (
                    <div
                      key={type.asset_type_id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAssetTypeSelect(type.asset_type_id);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleAssetTypeDoubleClick(type.asset_type_id);
                      }}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all select-none ${
                        formData.asset_type_id === type.asset_type_id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-sm">{type.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {type.category} {type.description ? `• ${type.description.substring(0, 30)}...` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Sites */}
          {step === 2 && (
            <div>
              <h3 className="text-sm font-semibold mb-1">Assign to Sites</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Select one or more sites where this asset is located
              </p>
              
              {/* No Sites Warning & Quick Create */}
              {sites.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed rounded-lg">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="w-6 h-6 text-orange-500" />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">No Sites Configured</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Create your first site to continue
                  </p>
                  
                  {/* Quick Site Creation Form */}
                  {!showQuickSiteForm ? (
                    <Button size="sm" onClick={() => setShowQuickSiteForm(true)} className="gap-1">
                      <Plus className="w-3.5 h-3.5" />
                      Create Site
                    </Button>
                  ) : (
                    <Card className="max-w-md mx-auto text-left mt-3">
                      <CardContent className="pt-3 pb-3">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            Create New Site
                          </h4>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowQuickSiteForm(false)}>
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Site Name *</Label>
                              <Input
                                value={quickSiteData.site_name}
                                onChange={(e) => setQuickSiteData({ ...quickSiteData, site_name: e.target.value })}
                                placeholder="e.g., Main Plant"
                                className="h-8 text-xs"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Location *</Label>
                              <Input
                                value={quickSiteData.location}
                                onChange={(e) => setQuickSiteData({ ...quickSiteData, location: e.target.value })}
                                placeholder="e.g., Mumbai, India"
                                className="h-8 text-xs"
                              />
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            className="w-full h-7 text-xs" 
                            onClick={handleQuickSiteCreate}
                            disabled={creatingQuickSite}
                          >
                            {creatingQuickSite ? 'Creating...' : 'Create Site'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <>
                  {/* Site List */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {sites.map((site) => (
                      <div
                        key={site.site_id}
                        onClick={() => handleSiteToggle(site.site_id)}
                        onDoubleClick={() => {
                          handleSiteToggle(site.site_id);
                          if (!formData.site_ids.includes(site.site_id)) {
                            setTimeout(() => setStep(3), 100);
                          }
                        }}
                        className={`p-2.5 border-2 rounded-lg cursor-pointer transition-all select-none ${
                          formData.site_ids.includes(site.site_id)
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">{site.site_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {site.location} {site.region && `• ${site.region}`}
                            </div>
                          </div>
                          <Checkbox
                            checked={formData.site_ids.includes(site.site_id)}
                            onCheckedChange={() => handleSiteToggle(site.site_id)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Add New Site Option */}
                  <div className="mt-2 pt-2 border-t">
                    {!showQuickSiteForm ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowQuickSiteForm(true)}
                        className="w-full gap-1 border-dashed text-xs h-7"
                      >
                        <Plus className="w-3 h-3" />
                        Add New Site
                      </Button>
                    ) : (
                      <Card className="border-primary/30 bg-primary/5">
                        <CardContent className="pt-2 pb-2">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-primary" />
                              Create New Site
                            </span>
                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setShowQuickSiteForm(false)}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                value={quickSiteData.site_name}
                                onChange={(e) => setQuickSiteData({ ...quickSiteData, site_name: e.target.value })}
                                placeholder="Site Name *"
                                className="h-7 text-xs"
                              />
                              <Input
                                value={quickSiteData.location}
                                onChange={(e) => setQuickSiteData({ ...quickSiteData, location: e.target.value })}
                                placeholder="Location *"
                                className="h-7 text-xs"
                              />
                            </div>
                            
                            <Button 
                              onClick={handleQuickSiteCreate} 
                              size="sm"
                              className="w-full h-7 text-xs"
                              disabled={!quickSiteData.site_name || !quickSiteData.location || creatingQuickSite}
                            >
                              {creatingQuickSite ? 'Creating...' : 'Create & Select'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  
                  {/* Selected Sites Summary */}
                  {formData.site_ids.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1 items-center">
                      <span className="text-xs font-medium">Selected:</span>
                      {formData.site_ids.map(siteId => {
                        const site = sites.find(s => s.site_id === siteId);
                        return (
                          <Badge key={siteId} variant="secondary" className="text-xs">
                            {site?.site_name}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 3: Asset Details & Nameplate */}
          {step === 3 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Asset Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Asset Name *</Label>
                  <Input
                    value={formData.asset_name}
                    onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                    placeholder="e.g., Transformer T-101"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Serial Number</Label>
                  <Input
                    value={formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                    placeholder="e.g., SN123456"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Manufacturer</Label>
                  <Input
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="e.g., ABB"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Model</Label>
                  <Input
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="e.g., Model X100"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Installation Date</Label>
                  <Input
                    type="date"
                    value={formData.installation_date}
                    onChange={(e) => setFormData({ ...formData, installation_date: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Location Detail</Label>
                  <Input
                    value={formData.location_detail}
                    onChange={(e) => setFormData({ ...formData, location_detail: e.target.value })}
                    placeholder="e.g., Building A, Floor 2"
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {formData.nameplate_template.length > 0 && (
                <div className="border-t pt-3 mt-2">
                  <h4 className="text-xs font-medium mb-2 text-muted-foreground">Nameplate Data</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {formData.nameplate_template.map((field, index) => (
                      <div key={index}>
                        <Label className="text-xs">{field.name}</Label>
                        <Input
                          value={formData.nameplate_data[field.name] || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            nameplate_data: {
                              ...formData.nameplate_data,
                              [field.name]: e.target.value
                            }
                          })}
                          placeholder={`${field.example} ${field.unit !== '-' ? field.unit : ''}`}
                          className="h-7 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Upload Photo */}
          {step === 4 && (
            <div>
              <h3 className="text-sm font-semibold mb-1">Asset Photo</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Upload a photo of the asset (optional)
              </p>

              <div className="space-y-3">
                {/* Photo Preview */}
                <Card className="border-2 border-dashed">
                  <CardContent className="p-4">
                    {photoPreview || formData.asset_photo ? (
                      <div className="relative">
                        <img
                          src={photoPreview || formData.asset_photo}
                          alt="Asset preview"
                          className="w-full h-40 object-contain rounded-lg bg-gray-50"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 h-7 text-xs"
                          onClick={handleRemovePhoto}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <ImageIcon className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                        <p className="text-xs text-muted-foreground mb-1">
                          No photo uploaded
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Default {formData.asset_type} image will be used
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Upload Button */}
                <div className="flex justify-center">
                  <Label htmlFor="photo-upload" className="cursor-pointer">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Photo</span>
                    </div>
                    <Input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </Label>
                </div>

                {/* Guidelines */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                  <p className="text-[10px] text-blue-800">
                    <strong>Tip:</strong> JPG, PNG, GIF accepted. Max size: 5MB.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Select Tests */}
          {step === 5 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold">Select Applicable Tests</h3>
                {availableTests.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {formData.selected_tests.length} of {availableTests.length} selected
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Choose which test templates apply to this {formData.asset_type || 'asset'}
                {availableTests.length > 0 && ` • ${availableTests.length} tests available`}
              </p>
              {loadingTests ? (
                <div className="text-center py-6 text-sm">Loading tests...</div>
              ) : availableTests.length > 0 ? (
                <ScrollArea className="h-64">
                  <div className="space-y-1.5 pr-3">
                    {availableTests.map((test) => (
                      <div
                        key={test.test_id}
                        onClick={() => handleTestToggle(test.test_id)}
                        className={`p-2.5 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.selected_tests.includes(test.test_id)
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">{test.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {test.test_code} • {test.parameters?.length || 0} parameters
                            </div>
                          </div>
                          <Checkbox
                            checked={formData.selected_tests.includes(test.test_id)}
                            onCheckedChange={() => handleTestToggle(test.test_id)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No tests available for this asset type
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Compact */}
        <DialogFooter className="px-6 py-3 border-t bg-gray-50 flex justify-between items-center">
          <div>
            {step > 1 && (
              <Button variant="outline" size="sm" onClick={handleBack} className="gap-1 h-8">
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="h-8">
              Cancel
            </Button>
            {step < 5 ? (
              <Button size="sm" onClick={handleNext} className="gap-1 h-8">
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button size="sm" onClick={handleSubmit} className="h-8">
                Complete Onboarding
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
