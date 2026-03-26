/**
 * Tenant Data Export/Import Page
 * Accessible to Company Admins and Master Admins
 * Allows exporting/importing complete tenant data for syncing between environments
 */
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '../components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Download,
  Upload,
  ArrowLeft,
  Building2,
  Users,
  MapPin,
  HardDrive,
  FileJson,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Info,
  AlertTriangle,
  Database,
  Image,
  FileText,
  Zap,
  Server,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { monitoringAPI } from '../services/api';
import { toast } from 'sonner';

export const TenantDataExportPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const { currentUser, isMaster, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('export');
  const [loading, setLoading] = useState(false);
  const [exportData, setExportData] = useState(null);
  
  // Export options
  const [exportOptions, setExportOptions] = useState({
    includeCompany: true,
    includeUsers: true,
    includeSites: true,
    includeAssets: true,
    includeTestRecords: true,
    includeOnlineMonitoring: true,
    includeImages: true,
  });
  
  // Import state
  const [importPreview, setImportPreview] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importOptions, setImportOptions] = useState({
    createCompanyOnImport: true,
    skipExistingUsers: true,
  });
  
  const fileInputRef = useRef(null);

  // Check access - Company Admin or Master Admin
  const hasAccess = isAdmin() || isMaster();

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader onLogout={onLogout} />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You need Company Admin or Master Admin privileges to access this page.
          </p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Export handler
  const handleExport = async () => {
    setLoading(true);
    const loadingToast = toast.loading('Preparing export...');
    
    try {
      const data = await monitoringAPI.exportData({
        include_substations: exportOptions.includeOnlineMonitoring,
        include_equipment: exportOptions.includeOnlineMonitoring,
        include_readings: false,
        include_company: exportOptions.includeCompany,
        include_users: exportOptions.includeUsers,
        include_sites: exportOptions.includeSites,
        include_assets: exportOptions.includeAssets,
        include_images: exportOptions.includeImages,
        format: 'json'
      });
      
      setExportData(data);
      
      // Generate filename based on what's included
      const parts = ['tenant_export'];
      if (exportOptions.includeCompany) parts.push('company');
      if (exportOptions.includeUsers) parts.push('users');
      if (exportOptions.includeSites) parts.push('sites');
      if (exportOptions.includeAssets) parts.push('assets');
      const filename = `${parts.join('_')}_${new Date().toISOString().split('T')[0]}.json`;
      
      // Create downloadable file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.dismiss(loadingToast);
      
      // Build success message
      const counts = [];
      if (data.summary?.sites_count) counts.push(`${data.summary.sites_count} sites`);
      if (data.summary?.assets_count) counts.push(`${data.summary.assets_count} assets`);
      if (data.summary?.users_count) counts.push(`${data.summary.users_count} users`);
      if (data.summary?.substations_count) counts.push(`${data.summary.substations_count} substations`);
      if (data.summary?.equipment_count) counts.push(`${data.summary.equipment_count} equipment`);
      if (data.summary?.images_embedded_count) counts.push(`${data.summary.images_embedded_count} images`);
      
      toast.success(`Export complete: ${counts.join(', ')}`);
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  // Quick export for complete company data
  const handleQuickExport = async () => {
    setLoading(true);
    const loadingToast = toast.loading('Exporting complete company data...');
    
    try {
      const data = await monitoringAPI.exportData({
        include_substations: true,
        include_equipment: true,
        include_readings: false,
        include_company: true,
        include_users: true,
        include_sites: true,
        include_assets: true,
        include_images: true,
        format: 'json'
      });
      
      setExportData(data);
      
      const filename = `complete_tenant_export_${currentUser?.company_name?.replace(/\s+/g, '_') || 'company'}_${new Date().toISOString().split('T')[0]}.json`;
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.dismiss(loadingToast);
      toast.success('Complete tenant data exported successfully!');
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  // Import file handler
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Please select a JSON file');
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading('Reading import file...');

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate structure
      if (!data.data && !data.summary) {
        toast.dismiss(loadingToast);
        toast.error('Invalid export file format');
        return;
      }

      setImportPreview(data);
      setShowImportDialog(true);
      toast.dismiss(loadingToast);
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Import parse error:', error);
      toast.error('Failed to parse import file');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  // Confirm import
  const handleImportConfirm = async () => {
    if (!importPreview) return;

    setLoading(true);
    const loadingToast = toast.loading('Importing data...');

    try {
      const result = await monitoringAPI.importData(importPreview.data, {
        create_company: importOptions.createCompanyOnImport,
        skip_existing_users: importOptions.skipExistingUsers,
      });

      setImportResults(result);
      toast.dismiss(loadingToast);
      toast.success('Import completed successfully!');
      setShowImportDialog(false);
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Import error:', error);
      toast.error(error.message || 'Failed to import data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <AppHeader onLogout={onLogout} />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin-tools')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Database className="h-6 w-6 text-emerald-600" />
              Tenant Data Export/Import
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Export and import complete tenant data for syncing between environments
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <Alert className="mb-6 bg-emerald-50 border-emerald-200">
          <Info className="h-4 w-4 text-emerald-600" />
          <AlertTitle className="text-emerald-800">Portable Data Export</AlertTitle>
          <AlertDescription className="text-emerald-700">
            Export your complete tenant data including company info, users, sites, assets, and test records. 
            Use this to sync configurations between <strong>development</strong>, <strong>testing</strong>, and <strong>production</strong> environments.
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="export" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-2">
              <Upload className="h-4 w-4" />
              Import
            </TabsTrigger>
          </TabsList>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-6">
            {/* Quick Export Card */}
            <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="h-5 w-5 text-emerald-600" />
                    Quick Export - Complete Tenant Data
                  </CardTitle>
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Recommended</Badge>
                </div>
                <CardDescription>
                  One-click export of all your tenant data including company, users, sites, assets, and test records with embedded images.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleQuickExport}
                  disabled={loading}
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  size="lg"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Export Complete Tenant Data
                </Button>
                
                {exportData && (
                  <div className="mt-4 p-4 bg-white rounded-lg border border-emerald-200">
                    <h4 className="font-medium text-emerald-800 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Last Export Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      {exportData.summary?.sites_count !== undefined && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="h-3 w-3" />
                          {exportData.summary.sites_count} Sites
                        </div>
                      )}
                      {exportData.summary?.assets_count !== undefined && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <HardDrive className="h-3 w-3" />
                          {exportData.summary.assets_count} Assets
                        </div>
                      )}
                      {exportData.summary?.users_count !== undefined && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="h-3 w-3" />
                          {exportData.summary.users_count} Users
                        </div>
                      )}
                      {exportData.summary?.substations_count !== undefined && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Server className="h-3 w-3" />
                          {exportData.summary.substations_count} Substations
                        </div>
                      )}
                      {exportData.summary?.test_records_count !== undefined && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <FileText className="h-3 w-3" />
                          {exportData.summary.test_records_count} Test Records
                        </div>
                      )}
                      {exportData.summary?.images_embedded_count !== undefined && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Image className="h-3 w-3" />
                          {exportData.summary.images_embedded_count} Images
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Custom Export Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileJson className="h-5 w-5 text-blue-500" />
                  Custom Export
                </CardTitle>
                <CardDescription>
                  Select specific data to include in your export
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeCompany"
                      checked={exportOptions.includeCompany}
                      onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeCompany: checked }))}
                    />
                    <Label htmlFor="includeCompany" className="flex items-center gap-2 cursor-pointer">
                      <Building2 className="h-4 w-4 text-purple-500" />
                      Company Info
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeUsers"
                      checked={exportOptions.includeUsers}
                      onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeUsers: checked }))}
                    />
                    <Label htmlFor="includeUsers" className="flex items-center gap-2 cursor-pointer">
                      <Users className="h-4 w-4 text-blue-500" />
                      Users
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeSites"
                      checked={exportOptions.includeSites}
                      onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeSites: checked }))}
                    />
                    <Label htmlFor="includeSites" className="flex items-center gap-2 cursor-pointer">
                      <MapPin className="h-4 w-4 text-green-500" />
                      Sites
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeAssets"
                      checked={exportOptions.includeAssets}
                      onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeAssets: checked }))}
                    />
                    <Label htmlFor="includeAssets" className="flex items-center gap-2 cursor-pointer">
                      <HardDrive className="h-4 w-4 text-amber-500" />
                      Assets
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeOnlineMonitoring"
                      checked={exportOptions.includeOnlineMonitoring}
                      onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeOnlineMonitoring: checked }))}
                    />
                    <Label htmlFor="includeOnlineMonitoring" className="flex items-center gap-2 cursor-pointer">
                      <Server className="h-4 w-4 text-cyan-500" />
                      Online Monitoring
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeImages"
                      checked={exportOptions.includeImages}
                      onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeImages: checked }))}
                    />
                    <Label htmlFor="includeImages" className="flex items-center gap-2 cursor-pointer">
                      <Image className="h-4 w-4 text-pink-500" />
                      Embed Images
                    </Label>
                  </div>
                </div>

                <Separator />

                <Button
                  onClick={handleExport}
                  disabled={loading}
                  className="w-full gap-2"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Export Selected Data
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Import Tab */}
          <TabsContent value="import" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Upload className="h-5 w-5 text-blue-500" />
                  Import Tenant Data
                </CardTitle>
                <CardDescription>
                  Import data from a previously exported JSON file
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800">Important</AlertTitle>
                  <AlertDescription className="text-amber-700">
                    Importing data may overwrite existing records. Make sure to backup your current data before importing.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="createCompanyOnImport"
                      checked={importOptions.createCompanyOnImport}
                      onCheckedChange={(checked) => setImportOptions(prev => ({ ...prev, createCompanyOnImport: checked }))}
                    />
                    <Label htmlFor="createCompanyOnImport" className="cursor-pointer">
                      Create company if it doesn't exist
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="skipExistingUsers"
                      checked={importOptions.skipExistingUsers}
                      onCheckedChange={(checked) => setImportOptions(prev => ({ ...prev, skipExistingUsers: checked }))}
                    />
                    <Label htmlFor="skipExistingUsers" className="cursor-pointer">
                      Skip users that already exist (by username)
                    </Label>
                  </div>
                </div>

                <Separator />

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".json"
                  className="hidden"
                />
                
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="w-full gap-2"
                  variant="outline"
                  size="lg"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Select JSON File to Import
                </Button>

                {importResults && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Import Results
                    </h4>
                    <div className="text-sm text-green-700 space-y-1">
                      {importResults.companies_created !== undefined && (
                        <p>Companies created: {importResults.companies_created}</p>
                      )}
                      {importResults.users_created !== undefined && (
                        <p>Users created: {importResults.users_created}</p>
                      )}
                      {importResults.sites_created !== undefined && (
                        <p>Sites created: {importResults.sites_created}</p>
                      )}
                      {importResults.assets_created !== undefined && (
                        <p>Assets created: {importResults.assets_created}</p>
                      )}
                      {importResults.substations_created !== undefined && (
                        <p>Substations created: {importResults.substations_created}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Import Preview Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Confirm Import
            </DialogTitle>
            <DialogDescription>
              Review the data to be imported
            </DialogDescription>
          </DialogHeader>

          {importPreview && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="text-sm font-medium text-gray-800 mb-2">Data to Import:</div>
                {importPreview.summary && (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {importPreview.summary.sites_count !== undefined && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-green-500" />
                        {importPreview.summary.sites_count} Sites
                      </div>
                    )}
                    {importPreview.summary.assets_count !== undefined && (
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-3 w-3 text-amber-500" />
                        {importPreview.summary.assets_count} Assets
                      </div>
                    )}
                    {importPreview.summary.users_count !== undefined && (
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-blue-500" />
                        {importPreview.summary.users_count} Users
                      </div>
                    )}
                    {importPreview.summary.substations_count !== undefined && (
                      <div className="flex items-center gap-2">
                        <Server className="h-3 w-3 text-cyan-500" />
                        {importPreview.summary.substations_count} Substations
                      </div>
                    )}
                    {importPreview.summary.equipment_count !== undefined && (
                      <div className="flex items-center gap-2">
                        <Zap className="h-3 w-3 text-yellow-500" />
                        {importPreview.summary.equipment_count} Equipment
                      </div>
                    )}
                  </div>
                )}
                {importPreview.data?.company && (
                  <div className="mt-2 pt-2 border-t">
                    <span className="text-sm text-gray-600">Company: </span>
                    <span className="text-sm font-medium">{importPreview.data.company.company_name}</span>
                  </div>
                )}
              </div>

              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700 text-sm">
                  This will import all the listed data into your current environment.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportConfirm} disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Confirm Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenantDataExportPage;
