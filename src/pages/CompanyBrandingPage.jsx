import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Palette,
  Upload,
  Save,
  RotateCcw,
} from 'lucide-react';
import { companyAPI, brandingAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useBranding } from '../contexts/BrandingContext';
import { AppHeader } from '../components/AppHeader';

export const CompanyBrandingPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const { isAdmin, getUserCompany } = useAuth();
  const { refreshBranding } = useBranding();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  
  const [formData, setFormData] = useState({
    primary_color: '#1e40af',
    secondary_color: '#3b82f6',
  });

  const companyId = getUserCompany();
  const apiBase = process.env.REACT_APP_BACKEND_URL || '';

  useEffect(() => {
    if (!isAdmin()) {
      toast.error('Access denied. Admin privileges required.');
      navigate('/');
    } else {
      loadCompany();
    }
  }, [isAdmin, navigate]);

  const loadCompany = async () => {
    try {
      setLoading(true);
      const data = await companyAPI.getById(companyId);
      setCompany(data);
      setFormData({
        primary_color: data.primary_color || '#1e40af',
        secondary_color: data.secondary_color || '#3b82f6',
      });
      if (data.logo_url) {
        // Construct full URL if relative path
        const logoUrl = data.logo_url.startsWith('http') 
          ? data.logo_url 
          : `${apiBase}${data.logo_url}`;
        setLogoPreview(logoUrl);
      }
    } catch (error) {
      toast.error('Failed to load company details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Upload logo if changed
      if (logoFile) {
        await brandingAPI.uploadLogo(companyId, logoFile);
      }
      
      // Update colors
      await brandingAPI.update(companyId, formData);
      
      toast.success('Company branding updated successfully! Colors and logo will appear across the application.');
      
      // Reload company and refresh branding context
      await loadCompany();
      refreshBranding(); // This will apply the new colors globally
    } catch (error) {
      toast.error('Failed to update branding');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!window.confirm('Are you sure you want to reset to default branding? This will remove your logo and reset colors.')) {
      return;
    }
    
    try {
      setSaving(true);
      
      // Reset to default branding (empty logo, default colors)
      await brandingAPI.update(companyId, {
        logo_url: '',
        primary_color: '#1e40af',
        secondary_color: '#3b82f6',
      });
      
      toast.success('Branding reset to default successfully!');
      
      // Clear local state
      setLogoFile(null);
      setLogoPreview(null);
      setFormData({
        primary_color: '#1e40af',
        secondary_color: '#3b82f6',
      });
      
      // Reload and refresh
      await loadCompany();
      refreshBranding();
    } catch (error) {
      toast.error('Failed to reset branding');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <AppHeader onLogout={onLogout} />
      
      {/* Page Title */}
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-4">
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
                <Palette className="w-6 h-6 text-blue-600" />
                Company Branding
              </h1>
              <p className="text-sm text-muted-foreground">
                Customize your company's logo and colors
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="space-y-6">
          {/* Logo Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Company Logo</CardTitle>
              <CardDescription>
                Upload your company logo (PNG, JPG, or SVG recommended)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {logoPreview && (
                <div className="flex justify-center p-6 bg-gray-100 rounded-lg">
                  <img
                    src={logoPreview}
                    alt="Company Logo Preview"
                    className="max-h-32 object-contain"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 p-4 border-2 border-dashed rounded-lg hover:border-blue-500 transition-colors">
                    <Upload className="w-5 h-5" />
                    <span>Click to upload logo</span>
                  </div>
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Color Customization */}
          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
              <CardDescription>
                Choose your company's primary and secondary colors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="primary-color"
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      placeholder="#1e40af"
                      className="flex-1"
                    />
                  </div>
                  <div 
                    className="h-16 rounded-lg"
                    style={{ backgroundColor: formData.primary_color }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                  <div 
                    className="h-16 rounded-lg"
                    style={{ backgroundColor: formData.secondary_color }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                See how your branding will appear
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-6 rounded-lg" style={{ backgroundColor: formData.primary_color }}>
                {logoPreview && (
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="h-12 mb-4 brightness-0 invert"
                  />
                )}
                <h2 className="text-2xl font-bold text-white mb-2">
                  {company?.company_name}
                </h2>
                <Button 
                  style={{ backgroundColor: formData.secondary_color }}
                  className="text-white"
                >
                  Sample Button
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handleResetToDefault}
              disabled={saving}
              size="lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              size="lg"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Branding
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
