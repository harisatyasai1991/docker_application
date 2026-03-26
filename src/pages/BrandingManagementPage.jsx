import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Palette,
  Upload,
  Save,
  Globe,
  Building2,
  Edit,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Info,
  LayoutDashboard,
  LogIn,
  Image,
  Type,
  Eye,
  Download,
} from 'lucide-react';
import { companyAPI, brandingAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { AppHeader } from '../components/AppHeader';

export const BrandingManagementPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const { isMaster } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoWhiteFile, setLogoWhiteFile] = useState(null);
  const [logoWhitePreview, setLogoWhitePreview] = useState(null);
  const [headerLogoFile, setHeaderLogoFile] = useState(null);
  const [headerLogoPreview, setHeaderLogoPreview] = useState(null);
  const [loginBgFile, setLoginBgFile] = useState(null);
  const [loginBgPreview, setLoginBgPreview] = useState(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState(null);
  const [importTargetCompany, setImportTargetCompany] = useState(null);
  const importFileInputRef = React.useRef(null);
  
  const [formData, setFormData] = useState({
    subdomain: '',
    app_name: '',
    primary_color: '#1e40af',
    secondary_color: '#3b82f6',
    // Header customization
    header_bg_color: '',
    header_text_color: '#ffffff',
    header_title: '',
    header_subtitle: '',
    // Login page customization
    login_bg_overlay: 'rgba(30, 64, 175, 0.7)',
    login_hide_left_panel: false,
  });

  const apiBase = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    if (!isMaster()) {
      toast.error('Access denied. Master Admin privileges required.');
      navigate('/');
    } else {
      loadCompanies();
    }
  }, [isMaster, navigate]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await companyAPI.getAll();
      setCompanies(data);
    } catch (error) {
      toast.error('Failed to load companies');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (company) => {
    setSelectedCompany(company);
    setFormData({
      subdomain: company.subdomain || '',
      app_name: company.app_name || '',
      primary_color: company.primary_color || '#1e40af',
      secondary_color: company.secondary_color || '#3b82f6',
      // Header customization
      header_bg_color: company.header_bg_color || '',
      header_text_color: company.header_text_color || '#ffffff',
      header_title: company.header_title || '',
      header_subtitle: company.header_subtitle || '',
      // Login page customization
      login_bg_overlay: company.login_bg_overlay || 'rgba(30, 64, 175, 0.7)',
      login_hide_left_panel: company.login_hide_left_panel || false,
    });
    
    // Set logo preview
    if (company.logo_url) {
      const logoUrl = company.logo_url.startsWith('http') 
        ? company.logo_url 
        : `${apiBase}${company.logo_url}`;
      setLogoPreview(logoUrl);
    } else {
      setLogoPreview(null);
    }
    
    // Set white logo preview
    if (company.logo_white_url) {
      const logoWhiteUrl = company.logo_white_url.startsWith('http') 
        ? company.logo_white_url 
        : `${apiBase}${company.logo_white_url}`;
      setLogoWhitePreview(logoWhiteUrl);
    } else {
      setLogoWhitePreview(null);
    }
    
    // Set header logo preview (same as logo_white_url for now)
    if (company.logo_white_url) {
      const headerLogoUrl = company.logo_white_url.startsWith('http') 
        ? company.logo_white_url 
        : `${apiBase}${company.logo_white_url}`;
      setHeaderLogoPreview(headerLogoUrl);
    } else {
      setHeaderLogoPreview(null);
    }
    
    // Set login background preview
    if (company.login_bg_image) {
      const loginBgUrl = company.login_bg_image.startsWith('http') 
        ? company.login_bg_image 
        : `${apiBase}${company.login_bg_image}`;
      setLoginBgPreview(loginBgUrl);
    } else {
      setLoginBgPreview(null);
    }
    
    setLogoFile(null);
    setLogoWhiteFile(null);
    setHeaderLogoFile(null);
    setLoginBgFile(null);
    setEditDialogOpen(true);
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

  const handleLogoWhiteChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setLogoWhiteFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoWhitePreview(reader.result);
        // Also update header logo preview
        setHeaderLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoginBgChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setLoginBgFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setLoginBgPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file, type = 'logo') => {
    const formData = new FormData();
    formData.append('logo', file);
    
    const response = await fetch(`${apiBase}/api/companies/${selectedCompany.company_id}/upload-logo?type=${type}`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to upload ${type}`);
    }
    
    const result = await response.json();
    return result.logo_url;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      let logoUrl = null;
      let logoWhiteUrl = null;
      let loginBgUrl = null;
      
      // Upload main logo if changed
      if (logoFile) {
        logoUrl = await uploadImage(logoFile, 'logo');
      }
      
      // Upload white logo if changed
      if (logoWhiteFile) {
        logoWhiteUrl = await uploadImage(logoWhiteFile, 'logo_white');
      }
      
      // Upload login background if changed
      if (loginBgFile) {
        loginBgUrl = await uploadImage(loginBgFile, 'login_bg');
      }
      
      // Build update payload
      const updatePayload = {
        subdomain: formData.subdomain.toLowerCase().trim() || null,
        app_name: formData.app_name.trim() || null,
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        // Header customization
        header_bg_color: formData.header_bg_color || null,
        header_text_color: formData.header_text_color || '#ffffff',
        header_title: formData.header_title || null,
        header_subtitle: formData.header_subtitle || null,
        // Login page customization
        login_bg_overlay: formData.login_bg_overlay || null,
        login_hide_left_panel: formData.login_hide_left_panel,
      };
      
      // Add uploaded URLs if available
      if (logoUrl) {
        updatePayload.logo_url = logoUrl;
      }
      if (logoWhiteUrl) {
        updatePayload.logo_white_url = logoWhiteUrl;
      }
      if (loginBgUrl) {
        updatePayload.login_bg_image = loginBgUrl;
      }
      
      // Update branding
      await brandingAPI.update(selectedCompany.company_id, updatePayload);
      
      toast.success('Branding updated successfully!');
      setEditDialogOpen(false);
      loadCompanies();
    } catch (error) {
      toast.error(error.message || 'Failed to update branding');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const getSubdomainUrl = (subdomain) => {
    if (!subdomain) return null;
    return `https://${subdomain}.dms-insight.com`;
  };

  // Helper function to convert image URL to base64
  const imageUrlToBase64 = async (imageUrl) => {
    if (!imageUrl) return null;
    
    try {
      // Construct full URL if relative
      const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${apiBase}${imageUrl}`;
      
      const response = await fetch(fullUrl);
      if (!response.ok) return null;
      
      const blob = await response.blob();
      
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          // Extract base64 data and mime type
          const base64 = reader.result;
          resolve({
            data: base64,
            mimeType: blob.type,
            size: blob.size
          });
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to convert image to base64:', error);
      return null;
    }
  };

  const handleExportBranding = async (company) => {
    // Show loading toast
    const loadingToast = toast.loading(`Exporting branding for ${company.company_name}...`);
    
    try {
      // Convert images to base64
      const [logoBase64, logoWhiteBase64, loginBgBase64] = await Promise.all([
        imageUrlToBase64(company.logo_url),
        imageUrlToBase64(company.logo_white_url),
        imageUrlToBase64(company.login_bg_image)
      ]);

      // Create portable branding configuration with embedded images
      const exportData = {
        _exportVersion: "2.0",
        _exportedAt: new Date().toISOString(),
        _exportedFrom: window.location.origin,
        company_code: company.company_code,
        company_name: company.company_name,
        branding: {
          subdomain: company.subdomain || null,
          app_name: company.app_name || null,
          primary_color: company.primary_color || '#1e40af',
          secondary_color: company.secondary_color || '#3b82f6',
          // Header customization
          header_bg_color: company.header_bg_color || null,
          header_text_color: company.header_text_color || '#ffffff',
          header_title: company.header_title || null,
          header_subtitle: company.header_subtitle || null,
          // Login page customization
          login_bg_overlay: company.login_bg_overlay || null,
          login_hide_left_panel: company.login_hide_left_panel || false,
          // Image URLs (fallback if embedded images fail to upload during import)
          logo_url: company.logo_url || null,
          logo_white_url: company.logo_white_url || null,
          login_bg_image: company.login_bg_image || null,
        },
        // Embedded images as base64
        images: {
          logo: logoBase64,
          logo_white: logoWhiteBase64,
          login_bg: loginBgBase64
        },
        _notes: {
          images_included: "All images are embedded as base64 and will be automatically uploaded on import",
          subdomain_config: "Subdomain must be configured in DNS for production use"
        }
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `branding-${company.company_code.toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.dismiss(loadingToast);
      
      // Show success with image count
      const imageCount = [logoBase64, logoWhiteBase64, loginBgBase64].filter(Boolean).length;
      toast.success(`Exported branding for ${company.company_name} (${imageCount} images included)`);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to export branding');
      console.error(error);
    }
  };

  const handleImportClick = (company) => {
    setImportTargetCompany(company);
    importFileInputRef.current?.click();
  };

  const handleImportFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Please select a JSON file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        // Validate the import file structure
        if (!data._exportVersion || !data.branding) {
          toast.error('Invalid branding configuration file');
          return;
        }

        setImportData(data);
        setImportDialogOpen(true);
      } catch (error) {
        toast.error('Failed to parse JSON file');
        console.error(error);
      }
    };
    reader.readAsText(file);
    
    // Reset the input so the same file can be selected again
    e.target.value = '';
  };

  // Helper function to convert base64 to File object
  const base64ToFile = (base64Data, filename) => {
    if (!base64Data || !base64Data.data) return null;
    
    try {
      // Extract the base64 content (remove data:image/xxx;base64, prefix)
      const arr = base64Data.data.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      
      return new File([u8arr], filename, { type: mime });
    } catch (error) {
      console.error('Failed to convert base64 to file:', error);
      return null;
    }
  };

  // Helper function to upload a file
  const uploadImageFile = async (file, companyId, type) => {
    if (!file) return null;
    
    const formData = new FormData();
    formData.append('logo', file);
    
    const response = await fetch(`${apiBase}/api/companies/${companyId}/upload-logo?type=${type}`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to upload ${type}`);
    }
    
    const result = await response.json();
    return result.logo_url;
  };

  const handleImportConfirm = async () => {
    if (!importData || !importTargetCompany) return;

    try {
      setSaving(true);
      
      const loadingToast = toast.loading('Importing branding configuration...');
      
      // First, upload any embedded images (v2.0 format)
      let uploadedLogoUrl = null;
      let uploadedLogoWhiteUrl = null;
      let uploadedLoginBgUrl = null;
      let imageUploadErrors = [];
      
      if (importData.images) {
        // Upload logo
        if (importData.images.logo) {
          try {
            toast.loading('Uploading logo...', { id: loadingToast });
            const logoFile = base64ToFile(importData.images.logo, 'logo.png');
            if (logoFile) {
              uploadedLogoUrl = await uploadImageFile(logoFile, importTargetCompany.company_id, 'logo');
            }
          } catch (err) {
            console.error('Logo upload failed:', err);
            imageUploadErrors.push('logo');
          }
        }
        
        // Upload white logo
        if (importData.images.logo_white) {
          try {
            toast.loading('Uploading white logo...', { id: loadingToast });
            const logoWhiteFile = base64ToFile(importData.images.logo_white, 'logo_white.png');
            if (logoWhiteFile) {
              uploadedLogoWhiteUrl = await uploadImageFile(logoWhiteFile, importTargetCompany.company_id, 'logo_white');
            }
          } catch (err) {
            console.error('White logo upload failed:', err);
            imageUploadErrors.push('white logo');
          }
        }
        
        // Upload login background
        if (importData.images.login_bg) {
          try {
            toast.loading('Uploading login background...', { id: loadingToast });
            const loginBgFile = base64ToFile(importData.images.login_bg, 'login_bg.jpg');
            if (loginBgFile) {
              uploadedLoginBgUrl = await uploadImageFile(loginBgFile, importTargetCompany.company_id, 'login_bg');
            }
          } catch (err) {
            console.error('Login background upload failed:', err);
            imageUploadErrors.push('login background');
          }
        }
      }
      
      toast.loading('Applying branding settings...', { id: loadingToast });
      
      // Apply the imported branding to the target company
      const updatePayload = {
        subdomain: importData.branding.subdomain,
        app_name: importData.branding.app_name,
        primary_color: importData.branding.primary_color,
        secondary_color: importData.branding.secondary_color,
        header_bg_color: importData.branding.header_bg_color,
        header_text_color: importData.branding.header_text_color,
        header_title: importData.branding.header_title,
        header_subtitle: importData.branding.header_subtitle,
        login_bg_overlay: importData.branding.login_bg_overlay,
        login_hide_left_panel: importData.branding.login_hide_left_panel,
      };
      
      // Add uploaded image URLs if available (from v2 format with embedded images)
      if (uploadedLogoUrl) updatePayload.logo_url = uploadedLogoUrl;
      if (uploadedLogoWhiteUrl) updatePayload.logo_white_url = uploadedLogoWhiteUrl;
      if (uploadedLoginBgUrl) updatePayload.login_bg_image = uploadedLoginBgUrl;
      
      // IMPORTANT: Fallback to existing logo URLs from branding data if no new uploads
      // This handles v1 format or when image upload fails
      if (!uploadedLogoUrl && importData.branding.logo_url) {
        updatePayload.logo_url = importData.branding.logo_url;
      }
      if (!uploadedLogoWhiteUrl && importData.branding.logo_white_url) {
        updatePayload.logo_white_url = importData.branding.logo_white_url;
      }
      if (!uploadedLoginBgUrl && importData.branding.login_bg_image) {
        updatePayload.login_bg_image = importData.branding.login_bg_image;
      }

      await brandingAPI.update(importTargetCompany.company_id, updatePayload);
      
      toast.dismiss(loadingToast);
      
      // Count uploaded images
      const imageCount = [uploadedLogoUrl, uploadedLogoWhiteUrl, uploadedLoginBgUrl].filter(Boolean).length;
      
      // Show appropriate success/warning message
      if (imageUploadErrors.length > 0) {
        toast.warning(`Branding imported to ${importTargetCompany.company_name}, but some images failed to upload: ${imageUploadErrors.join(', ')}. Original URLs preserved.`);
      } else {
        const imageMsg = imageCount > 0 ? ` (${imageCount} images uploaded)` : '';
        toast.success(`Branding imported to ${importTargetCompany.company_name}${imageMsg}`);
      }
      
      setImportDialogOpen(false);
      setImportData(null);
      setImportTargetCompany(null);
      loadCompanies();
    } catch (error) {
      toast.error('Failed to import branding: ' + (error.message || 'Unknown error'));
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewLogin = () => {
    // Get the current base URL
    const baseUrl = window.location.origin;
    const subdomain = formData.subdomain?.trim();
    
    if (!subdomain) {
      toast.error('Please configure a subdomain first to preview the login page');
      return;
    }
    
    // Open login page in new tab with subdomain parameter for testing
    // Note: Use /login route directly to preserve query params through any redirects
    const previewUrl = `${baseUrl}/login?subdomain=${subdomain}`;
    window.open(previewUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
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
              onClick={() => navigate('/admin-tools')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Globe className="w-6 h-6 text-blue-600" />
                Multi-Tenant Branding
              </h1>
              <p className="text-sm text-muted-foreground">
                Configure white-label branding for each company
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Info Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">How White-Labeling Works</p>
                <p>Assign a unique subdomain to each company (e.g., <code className="bg-blue-100 px-1 rounded">acumen</code> for <code className="bg-blue-100 px-1 rounded">acumen.dms-insight.com</code>). 
                When users access that URL, they will see the company's custom branding (logo, colors, app name) on the login page and throughout the application.</p>
                <p className="mt-2"><strong>Sync Environments:</strong> Use <Upload className="w-3 h-3 inline mx-1" /> to import and <Download className="w-3 h-3 inline mx-1" /> to export branding configurations between dev/test/production.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Companies Table */}
        <Card>
          <CardHeader>
            <CardTitle>Company Branding Configuration</CardTitle>
            <CardDescription>
              Manage branding settings for all companies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Subdomain</TableHead>
                  <TableHead>App Name</TableHead>
                  <TableHead>Logo</TableHead>
                  <TableHead>Colors</TableHead>
                  <TableHead>Custom Header</TableHead>
                  <TableHead>Custom Login</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.company_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{company.company_name}</p>
                          <p className="text-xs text-muted-foreground">{company.company_code}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {company.subdomain ? (
                        <div className="flex items-center gap-1">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {company.subdomain}
                          </code>
                          <a 
                            href={getSubdomainUrl(company.subdomain)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not configured</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {company.app_name || (
                        <span className="text-muted-foreground text-sm">Default</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {company.logo_url ? (
                        <img 
                          src={company.logo_url.startsWith('http') ? company.logo_url : `${apiBase}${company.logo_url}`}
                          alt={company.company_name}
                          className="h-8 w-auto max-w-[80px] object-contain bg-gray-100 rounded p-1"
                        />
                      ) : (
                        <span className="text-muted-foreground text-sm">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: company.primary_color || '#1e40af' }}
                          title={`Primary: ${company.primary_color || '#1e40af'}`}
                        />
                        <div 
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: company.secondary_color || '#3b82f6' }}
                          title={`Secondary: ${company.secondary_color || '#3b82f6'}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      {company.header_bg_color ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Custom
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Default</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {company.login_bg_image ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Custom
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Default</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {company.subdomain ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleImportClick(company)}
                          title="Import branding configuration"
                          data-testid={`import-branding-${company.company_code}`}
                        >
                          <Upload className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExportBranding(company)}
                          title="Export branding configuration"
                          data-testid={`export-branding-${company.company_code}`}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(company)}
                          data-testid={`configure-branding-${company.company_code}`}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Configure
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Configure Branding: {selectedCompany?.company_name}
            </DialogTitle>
            <DialogDescription>
              Set up white-label branding for this company
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="header" className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Header
              </TabsTrigger>
              <TabsTrigger value="login" className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                Login Page
              </TabsTrigger>
            </TabsList>

            {/* Basic Tab */}
            <TabsContent value="basic" className="space-y-6 mt-4">
              {/* Subdomain */}
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="subdomain"
                    value={formData.subdomain}
                    onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    placeholder="e.g., acumen"
                    className="flex-1"
                    data-testid="subdomain-input"
                  />
                  <span className="text-muted-foreground text-sm">.dms-insight.com</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty to disable white-labeling for this company
                </p>
              </div>

              {/* App Name */}
              <div className="space-y-2">
                <Label htmlFor="app_name">Custom App Name</Label>
                <Input
                  id="app_name"
                  value={formData.app_name}
                  onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
                  placeholder="e.g., Acumen DMS"
                  data-testid="app-name-input"
                />
                <p className="text-xs text-muted-foreground">
                  Displayed on login page and header. Leave empty to use "DMS Insight"
                </p>
              </div>

              {/* Main Logo */}
              <div className="space-y-2">
                <Label>Company Logo (Standard)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Used on light backgrounds (e.g., login page left panel)
                </p>
                {logoPreview && (
                  <div className="flex justify-center p-4 bg-gray-100 rounded-lg">
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="max-h-24 object-contain"
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
                      data-testid="logo-upload-input"
                    />
                  </Label>
                </div>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="w-14 h-10 cursor-pointer"
                    />
                    <Input
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      placeholder="#1e40af"
                      className="flex-1"
                      data-testid="primary-color-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="w-14 h-10 cursor-pointer"
                    />
                    <Input
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      placeholder="#3b82f6"
                      className="flex-1"
                      data-testid="secondary-color-input"
                    />
                  </div>
                </div>
              </div>

              {/* Basic Preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div 
                  className="p-6 rounded-lg"
                  style={{ backgroundColor: formData.primary_color }}
                >
                  {logoPreview && (
                    <img
                      src={logoPreview}
                      alt="Logo"
                      className="h-12 mb-4 brightness-0 invert"
                    />
                  )}
                  <h2 className="text-xl font-bold text-white mb-2">
                    {formData.app_name || selectedCompany?.company_name || 'Company Name'}
                  </h2>
                  <Button 
                    style={{ backgroundColor: formData.secondary_color }}
                    className="text-white"
                  >
                    Sample Button
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Header Tab */}
            <TabsContent value="header" className="space-y-6 mt-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Custom Header Branding</p>
                    <p>Configure a custom application header that appears after users log in. This is useful for partner portals where you want to display partner-specific branding.</p>
                  </div>
                </div>
              </div>

              {/* White Logo for Header */}
              <div className="space-y-2">
                <Label>White Logo (for dark backgrounds)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Used in the header bar and on dark backgrounds
                </p>
                {logoWhitePreview && (
                  <div className="flex justify-center p-4 bg-gray-800 rounded-lg">
                    <img
                      src={logoWhitePreview}
                      alt="White Logo Preview"
                      className="max-h-16 object-contain"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="logo-white-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 p-4 border-2 border-dashed rounded-lg hover:border-blue-500 transition-colors">
                      <Upload className="w-5 h-5" />
                      <span>Click to upload white logo</span>
                    </div>
                    <Input
                      id="logo-white-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoWhiteChange}
                      data-testid="logo-white-upload-input"
                    />
                  </Label>
                </div>
              </div>

              <Separator />

              {/* Header Background Color */}
              <div className="space-y-2">
                <Label htmlFor="header-bg-color">Header Background Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="header-bg-color"
                    type="color"
                    value={formData.header_bg_color || '#1e40af'}
                    onChange={(e) => setFormData({ ...formData, header_bg_color: e.target.value })}
                    className="w-14 h-10 cursor-pointer"
                  />
                  <Input
                    value={formData.header_bg_color}
                    onChange={(e) => setFormData({ ...formData, header_bg_color: e.target.value })}
                    placeholder="#1e40af (leave empty for default)"
                    className="flex-1"
                    data-testid="header-bg-color-input"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty to use the default DMS Insight header style
                </p>
              </div>

              {/* Header Text Color */}
              <div className="space-y-2">
                <Label htmlFor="header-text-color">Header Text Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="header-text-color"
                    type="color"
                    value={formData.header_text_color || '#ffffff'}
                    onChange={(e) => setFormData({ ...formData, header_text_color: e.target.value })}
                    className="w-14 h-10 cursor-pointer"
                  />
                  <Input
                    value={formData.header_text_color}
                    onChange={(e) => setFormData({ ...formData, header_text_color: e.target.value })}
                    placeholder="#ffffff"
                    className="flex-1"
                    data-testid="header-text-color-input"
                  />
                </div>
              </div>

              {/* Header Title */}
              <div className="space-y-2">
                <Label htmlFor="header-title">Header Title</Label>
                <Input
                  id="header-title"
                  value={formData.header_title}
                  onChange={(e) => setFormData({ ...formData, header_title: e.target.value })}
                  placeholder="e.g., Partner Portal"
                  data-testid="header-title-input"
                />
                <p className="text-xs text-muted-foreground">
                  Custom title displayed in the header. Leave empty to use the app name.
                </p>
              </div>

              {/* Header Subtitle */}
              <div className="space-y-2">
                <Label htmlFor="header-subtitle">Header Subtitle</Label>
                <Input
                  id="header-subtitle"
                  value={formData.header_subtitle}
                  onChange={(e) => setFormData({ ...formData, header_subtitle: e.target.value })}
                  placeholder="e.g., Powered by DMS Insight"
                  data-testid="header-subtitle-input"
                />
                <p className="text-xs text-muted-foreground">
                  Optional subtitle displayed below the title
                </p>
              </div>

              {/* Header Preview */}
              <div className="space-y-2">
                <Label>Header Preview</Label>
                <div 
                  className="p-4 rounded-lg flex items-center gap-4"
                  style={{ 
                    backgroundColor: formData.header_bg_color || formData.primary_color || '#1e40af',
                    color: formData.header_text_color || '#ffffff'
                  }}
                >
                  {(logoWhitePreview || headerLogoPreview) && (
                    <img
                      src={logoWhitePreview || headerLogoPreview}
                      alt="Header Logo"
                      className="h-10 object-contain"
                    />
                  )}
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: formData.header_text_color || '#ffffff' }}>
                      {formData.header_title || formData.app_name || 'DMS Insight'}
                    </h3>
                    {formData.header_subtitle && (
                      <p className="text-sm opacity-80" style={{ color: formData.header_text_color || '#ffffff' }}>
                        {formData.header_subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Login Page Tab */}
            <TabsContent value="login" className="space-y-6 mt-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Custom Login Page</p>
                    <p>Create a unique login experience for this company's portal. You can add a custom background image, color overlay, and choose the layout style.</p>
                  </div>
                </div>
              </div>

              {/* Login Background Image */}
              <div className="space-y-2">
                <Label>Login Background Image</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Background image for the login page. Recommended size: 1920x1080 or larger.
                </p>
                {loginBgPreview && (
                  <div className="relative rounded-lg overflow-hidden">
                    <img
                      src={loginBgPreview}
                      alt="Login Background Preview"
                      className="w-full h-48 object-cover"
                    />
                    {formData.login_bg_overlay && (
                      <div 
                        className="absolute inset-0"
                        style={{ backgroundColor: formData.login_bg_overlay }}
                      />
                    )}
                  </div>
                )}
                <div>
                  <Label htmlFor="login-bg-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 p-4 border-2 border-dashed rounded-lg hover:border-blue-500 transition-colors">
                      <Image className="w-5 h-5" />
                      <span>Click to upload background image</span>
                    </div>
                    <Input
                      id="login-bg-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLoginBgChange}
                      data-testid="login-bg-upload-input"
                    />
                  </Label>
                </div>
              </div>

              {/* Login Background Overlay */}
              <div className="space-y-2">
                <Label htmlFor="login-bg-overlay">Background Overlay Color</Label>
                <Input
                  id="login-bg-overlay"
                  value={formData.login_bg_overlay}
                  onChange={(e) => setFormData({ ...formData, login_bg_overlay: e.target.value })}
                  placeholder="rgba(30, 64, 175, 0.7)"
                  data-testid="login-bg-overlay-input"
                />
                <p className="text-xs text-muted-foreground">
                  Semi-transparent color overlay on the background image. Use RGBA format for transparency (e.g., rgba(30, 64, 175, 0.7))
                </p>
              </div>

              <Separator />

              {/* Login Layout Options */}
              <div className="space-y-4">
                <Label>Login Page Layout</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="login-hide-left-panel"
                    checked={formData.login_hide_left_panel}
                    onCheckedChange={(checked) => setFormData({ ...formData, login_hide_left_panel: checked })}
                    data-testid="login-hide-left-panel-checkbox"
                  />
                  <label
                    htmlFor="login-hide-left-panel"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Full-width background layout (hide left info panel)
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  When enabled, the login form appears centered over the full background image instead of the standard two-column layout.
                </p>
              </div>

              {/* Login Page Preview */}
              <div className="space-y-2">
                <Label>Login Page Preview</Label>
                <div 
                  className="relative rounded-lg overflow-hidden h-64"
                  style={{ 
                    backgroundImage: loginBgPreview ? `url(${loginBgPreview})` : 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {formData.login_bg_overlay && (
                    <div 
                      className="absolute inset-0"
                      style={{ backgroundColor: formData.login_bg_overlay }}
                    />
                  )}
                  <div className={`relative h-full flex ${formData.login_hide_left_panel ? 'items-center justify-center' : ''}`}>
                    {!formData.login_hide_left_panel && (
                      <div className="w-1/2 p-6 flex flex-col justify-center text-white">
                        {logoPreview && (
                          <img src={logoPreview} alt="Logo" className="h-8 w-auto mb-4 brightness-0 invert" />
                        )}
                        <h3 className="text-lg font-bold">
                          {formData.app_name || 'Welcome'}
                        </h3>
                        <p className="text-sm opacity-80">Asset Management Platform</p>
                      </div>
                    )}
                    <div className={`${formData.login_hide_left_panel ? 'w-80' : 'w-1/2'} p-4 flex items-center justify-center`}>
                      <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-sm">
                        <h4 className="font-semibold mb-4">Sign In</h4>
                        <div className="space-y-3">
                          <div className="h-10 bg-gray-100 rounded" />
                          <div className="h-10 bg-gray-100 rounded" />
                          <div 
                            className="h-10 rounded flex items-center justify-center text-white text-sm"
                            style={{ backgroundColor: formData.primary_color }}
                          >
                            Sign In
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <div className="flex items-center justify-between w-full">
              <Button 
                variant="outline" 
                onClick={handlePreviewLogin}
                disabled={!formData.subdomain?.trim()}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                data-testid="preview-login-btn"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview Login Page
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} data-testid="save-branding-btn">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden file input for import */}
      <input
        type="file"
        ref={importFileInputRef}
        onChange={handleImportFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Import Confirmation Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import Branding Configuration
            </DialogTitle>
            <DialogDescription>
              Review the imported configuration before applying
            </DialogDescription>
          </DialogHeader>

          {importData && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Source Company:</span>
                  <span className="text-sm font-medium">{importData.company_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Source Code:</span>
                  <span className="text-sm font-mono">{importData.company_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Exported On:</span>
                  <span className="text-sm">{new Date(importData._exportedAt).toLocaleDateString()}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Subdomain:</span>
                  <span className="text-sm font-mono">{importData.branding?.subdomain || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">App Name:</span>
                  <span className="text-sm">{importData.branding?.app_name || 'Default'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Colors:</span>
                  <div className="flex gap-1">
                    <div 
                      className="w-5 h-5 rounded border"
                      style={{ backgroundColor: importData.branding?.primary_color || '#1e40af' }}
                    />
                    <div 
                      className="w-5 h-5 rounded border"
                      style={{ backgroundColor: importData.branding?.secondary_color || '#3b82f6' }}
                    />
                  </div>
                </div>
              </div>

              {/* Show images status */}
              {importData.images ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-green-800">
                      <p className="font-medium">Images Included (v2.0 format)</p>
                      <div className="mt-1 flex gap-3">
                        {importData.images.logo && <span>✓ Logo</span>}
                        {importData.images.logo_white && <span>✓ White Logo</span>}
                        {importData.images.login_bg && <span>✓ Login Background</span>}
                      </div>
                      <p className="mt-1 text-xs">Images will be automatically uploaded during import.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium">Legacy Format (v1.0)</p>
                      <p className="mt-1">Images are not included. You'll need to upload them separately after import.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Target Company: {importTargetCompany?.company_name}</p>
                    <p className="mt-1">This will overwrite existing branding settings for this company.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportConfirm} disabled={saving}>
              <Upload className="w-4 h-4 mr-2" />
              {saving ? 'Importing...' : 'Apply Configuration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrandingManagementPage;
