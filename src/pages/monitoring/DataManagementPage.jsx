/**
 * Online Monitoring Module - Data Management Page
 * Import/Export substations and equipment data
 */
import React, { useState, useRef } from 'react';
import { AppHeader } from '../../components/AppHeader';
import { ModuleTabs } from '../../components/ModuleTabs';
import { MonitoringNav } from './MonitoringNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  Download, 
  Upload, 
  FileSpreadsheet,
  FileJson,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Building2,
  Cpu,
  Trash2,
  RefreshCw,
  Info,
  Copy,
  FileDown,
  Link2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '../../components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { monitoringAPI } from '../../services/api';
import { toast } from 'sonner';

export function DataManagementPage({ onLogout }) {
  const [activeTab, setActiveTab] = useState('export');
  const [loading, setLoading] = useState(false);
  const [exportData, setExportData] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [importMode, setImportMode] = useState('append');
  const [includeCompany, setIncludeCompany] = useState(false);
  const [createCompanyOnImport, setCreateCompanyOnImport] = useState(true);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [clearOptions, setClearOptions] = useState({
    substations: false,
    equipment: false,
    readings: false,
    alarms: false
  });
  
  const fileInputRef = useRef(null);

  // Export functions
  const handleExportJSON = async (withCompany = false, withUsers = false, withSites = false, withAssets = false) => {
    setLoading(true);
    try {
      const data = await monitoringAPI.exportData({
        include_substations: true,
        include_equipment: true,
        include_readings: false,
        include_company: withCompany,
        include_users: withUsers,
        include_sites: withSites,
        include_assets: withAssets,
        format: 'json'
      });
      
      setExportData(data);
      
      // Create downloadable file
      let filename = `monitoring_data_${new Date().toISOString().split('T')[0]}.json`;
      if (withCompany && withUsers && withSites && withAssets) {
        filename = `full_company_export_${new Date().toISOString().split('T')[0]}.json`;
      } else if (withCompany && withUsers) {
        filename = `full_deployment_with_users_${new Date().toISOString().split('T')[0]}.json`;
      } else if (withCompany) {
        filename = `full_deployment_${new Date().toISOString().split('T')[0]}.json`;
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      let exportMsg = `Exported ${data.summary?.substations_count || 0} substations, ${data.summary?.equipment_count || 0} equipment`;
      if (withSites) {
        exportMsg += `, ${data.summary?.sites_count || 0} sites`;
      }
      if (withAssets) {
        exportMsg += `, ${data.summary?.assets_count || 0} assets`;
      }
      if (withUsers) {
        exportMsg += `, ${data.summary?.users_count || 0} users`;
      }
      if (withCompany) {
        exportMsg += ' (with company data)';
      }
      toast.success(exportMsg);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async (type) => {
    setLoading(true);
    try {
      let data;
      let filename;
      
      if (type === 'substations') {
        data = await monitoringAPI.exportSubstationsCSV();
        filename = `substations_${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        data = await monitoringAPI.exportEquipmentCSV();
        filename = `equipment_${new Date().toISOString().split('T')[0]}.csv`;
      }
      
      // Convert to CSV
      const csvContent = convertToCSV(data.columns, data.rows);
      
      // Download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Exported ${data.total} ${type}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async (type) => {
    setLoading(true);
    try {
      let data;
      let filename;
      
      if (type === 'substations') {
        data = await monitoringAPI.getSubstationsTemplate();
        filename = 'substations_template.csv';
      } else {
        data = await monitoringAPI.getEquipmentTemplate();
        filename = 'equipment_template.csv';
      }
      
      // Convert to CSV with example rows
      const csvContent = convertToCSV(data.columns, data.example_rows);
      
      // Download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${type} template`);
    } catch (error) {
      console.error('Template download error:', error);
      toast.error('Failed to download template');
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (columns, rows) => {
    const header = columns.join(',');
    const csvRows = rows.map(row => 
      columns.map(col => {
        const value = row[col] ?? '';
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );
    return [header, ...csvRows].join('\n');
  };

  // Import functions
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        
        if (file.name.endsWith('.json')) {
          const jsonData = JSON.parse(content);
          processJSONImport(jsonData);
        } else if (file.name.endsWith('.csv')) {
          const csvData = parseCSV(content);
          processCSVImport(csvData, file.name);
        } else {
          toast.error('Unsupported file format. Please use JSON or CSV.');
        }
      } catch (error) {
        console.error('File parse error:', error);
        toast.error('Failed to parse file');
      }
    };
    reader.readAsText(file);
  };

  const parseCSV = (content) => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return { columns: [], rows: [] };
    
    const columns = lines[0].split(',').map(col => col.trim().replace(/^"|"$/g, ''));
    const rows = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === columns.length) {
        const row = {};
        columns.forEach((col, idx) => {
          row[col] = values[idx];
        });
        rows.push(row);
      }
    }
    
    return { columns, rows };
  };

  const parseCSVLine = (line) => {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    return values;
  };

  const processJSONImport = (data) => {
    // Handle full export format or direct array
    const substations = data.data?.substations || data.substations || [];
    const equipment = data.data?.equipment || data.equipment || [];
    const company = data.data?.company || null;
    const users = data.data?.users || [];
    const sites = data.data?.sites || [];
    const assets = data.data?.assets || [];
    const crossModuleLinks = data.data?.cross_module_links || [];
    
    setImportPreview({
      type: 'json',
      substations: substations.slice(0, 5),
      equipment: equipment.slice(0, 5),
      sites: sites.slice(0, 5),
      assets: assets.slice(0, 5),
      totalSubstations: substations.length,
      totalEquipment: equipment.length,
      totalSites: sites.length,
      totalAssets: assets.length,
      company: company,
      users: users,
      totalUsers: users.length,
      crossModuleLinks: crossModuleLinks,
      totalCrossModuleLinks: crossModuleLinks.length,
      isFullDeployment: !!(company || users.length > 0 || sites.length > 0 || assets.length > 0),
      rawData: { substations, equipment, company, users, sites, assets, cross_module_links: crossModuleLinks }
    });
  };

  const processCSVImport = (csvData, filename) => {
    const isSubstations = filename.toLowerCase().includes('substation');
    const isEquipment = filename.toLowerCase().includes('equipment');
    
    setImportPreview({
      type: 'csv',
      dataType: isSubstations ? 'substations' : (isEquipment ? 'equipment' : 'unknown'),
      columns: csvData.columns,
      rows: csvData.rows.slice(0, 5),
      totalRows: csvData.rows.length,
      rawData: csvData.rows
    });
  };

  const handleImport = async () => {
    if (!importPreview) return;
    
    setLoading(true);
    try {
      // Check if this is a full deployment import (has company or users)
      const isFullDeployment = importPreview.isFullDeployment;
      
      if (isFullDeployment && importPreview.type === 'json') {
        // Use full deployment endpoint for imports with company/users
        const fullDeploymentPayload = {
          mode: importMode,
          create_company_if_missing: createCompanyOnImport,
          substations: importPreview.rawData.substations.map(s => ({
            name: s.name,
            code: s.code,
            region: s.region,
            region_name: s.region_name,
            voltage_level: s.voltage_level,
            latitude: s.latitude,
            longitude: s.longitude,
            address: s.address
          })),
          equipment: importPreview.rawData.equipment.map(e => ({
            substation_code: e.substation_code || e.code?.split('-')[0] || '',
            equipment_type: e.equipment_type,
            name: e.name,
            code: e.code,
            rating: e.rating,
            manufacturer: e.manufacturer,
            installation_date: e.installation_date,
            health_status: e.health_status
          }))
        };
        
        // Add company data if present
        if (importPreview.rawData.company) {
          fullDeploymentPayload.company = importPreview.rawData.company;
        }
        
        // Add users data if present
        if (importPreview.rawData.users && importPreview.rawData.users.length > 0) {
          fullDeploymentPayload.users = importPreview.rawData.users;
        }
        
        // Add cross-module links if present
        if (importPreview.rawData.cross_module_links && importPreview.rawData.cross_module_links.length > 0) {
          fullDeploymentPayload.cross_module_links = importPreview.rawData.cross_module_links;
        }
        
        // Add sites data if present (Asset Performance module)
        if (importPreview.rawData.sites && importPreview.rawData.sites.length > 0) {
          fullDeploymentPayload.sites = importPreview.rawData.sites;
        }
        
        // Add assets data if present (Asset Performance module)
        if (importPreview.rawData.assets && importPreview.rawData.assets.length > 0) {
          fullDeploymentPayload.assets = importPreview.rawData.assets;
        }
        
        const result = await monitoringAPI.importFullDeployment(fullDeploymentPayload);
        setImportResults(result);
        setImportPreview(null);
        
        if (result.success) {
          let successMsg = result.message;
          if (result.results?.company?.created) {
            successMsg = `Company created! ${successMsg}`;
          }
          toast.success(successMsg);
        } else {
          toast.error('Import completed with errors');
        }
      } else {
        // Standard import for data-only imports
        let importPayload = { mode: importMode };
        
        if (importPreview.type === 'json') {
          // Map JSON data to import format
          importPayload.substations = importPreview.rawData.substations.map(s => ({
            name: s.name,
            code: s.code,
            region: s.region,
            region_name: s.region_name,
            voltage_level: s.voltage_level,
            latitude: s.latitude,
            longitude: s.longitude,
            address: s.address
          }));
          importPayload.equipment = importPreview.rawData.equipment.map(e => ({
            substation_code: e.substation_code || e.code?.split('-')[0] || '',
            equipment_type: e.equipment_type,
            name: e.name,
            code: e.code,
            rating: e.rating,
            manufacturer: e.manufacturer,
            installation_date: e.installation_date,
            health_status: e.health_status
          }));
          // Include cross-module links if present
          if (importPreview.rawData.cross_module_links && importPreview.rawData.cross_module_links.length > 0) {
            importPayload.cross_module_links = importPreview.rawData.cross_module_links;
          }
        } else if (importPreview.type === 'csv') {
          if (importPreview.dataType === 'substations') {
            importPayload.substations = importPreview.rawData.map(row => ({
              name: row.name,
              code: row.code,
              region: row.region,
              region_name: row.region_name,
              voltage_level: row.voltage_level,
              latitude: row.latitude ? parseFloat(row.latitude) : null,
              longitude: row.longitude ? parseFloat(row.longitude) : null,
              address: row.address
            }));
          } else if (importPreview.dataType === 'equipment') {
            importPayload.equipment = importPreview.rawData.map(row => ({
              substation_code: row.substation_code,
              equipment_type: row.equipment_type,
              name: row.name,
              code: row.code,
              rating: row.rating,
              manufacturer: row.manufacturer,
              installation_date: row.installation_date,
              health_status: row.health_status || 'healthy'
            }));
          }
        }
        
        const result = await monitoringAPI.importData(importPayload);
        setImportResults(result);
        setImportPreview(null);
        
        if (result.success) {
          toast.success(result.message);
        } else {
          toast.error('Import completed with errors');
        }
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import data');
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    setLoading(true);
    try {
      const result = await monitoringAPI.clearData({
        clear_substations: clearOptions.substations,
        clear_equipment: clearOptions.equipment,
        clear_readings: clearOptions.readings,
        clear_alarms: clearOptions.alarms,
        confirm: 'DELETE'
      });
      
      toast.success('Data cleared successfully');
      setShowClearDialog(false);
      setClearOptions({ substations: false, equipment: false, readings: false, alarms: false });
    } catch (error) {
      console.error('Clear error:', error);
      toast.error('Failed to clear data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <AppHeader onLogout={onLogout} />
      <ModuleTabs />
      <MonitoringNav />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-blue-500" />
              Data Management
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Import and export substations, equipment, and monitoring data
            </p>
          </div>
          <Button 
            variant="outline" 
            className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => setShowClearDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
            Clear Data
          </Button>
        </div>

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
            {/* Portable Export Info Banner */}
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Portable Export</AlertTitle>
              <AlertDescription className="text-blue-700">
                All exports are <strong>deployment-independent</strong>. You can export from this system and import to any other DMS Insight deployment. 
                Equipment links to substations via <code className="bg-blue-100 px-1 rounded">code</code>, and system IDs are auto-generated on import.
              </AlertDescription>
            </Alert>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Data Export */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileJson className="h-5 w-5 text-blue-500" />
                      Data Export (JSON)
                    </CardTitle>
                    <Badge className="bg-green-100 text-green-700 border-green-200">Portable</Badge>
                  </div>
                  <CardDescription>
                    Export substations and equipment. Use for data migration.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={() => handleExportJSON(false)}
                    disabled={loading}
                    className="w-full gap-2"
                  >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Export Data Only
                  </Button>
                  {exportData && !exportData.data?.company && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 text-green-700 text-sm">
                        <CheckCircle2 className="h-4 w-4" />
                        Exported: {exportData.summary?.substations_count} substations, {exportData.summary?.equipment_count} equipment
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Full Deployment Export */}
              <Card className="border-purple-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building2 className="h-5 w-5 text-purple-500" />
                      Full Deployment
                    </CardTitle>
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200">+ Company + Users</Badge>
                  </div>
                  <CardDescription>
                    Includes company, users (with passwords), and all data. For fresh deployments.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={() => handleExportJSON(true, true)}
                    disabled={loading}
                    className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
                  >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Export Full Deployment
                  </Button>
                  <p className="text-xs text-gray-500">
                    Users can login with same credentials after import
                  </p>
                  {exportData && (exportData.data?.company || exportData.data?.users) && (
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="text-purple-700 text-sm space-y-1">
                        {exportData.data.company && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Company: {exportData.data.company.company_name}
                          </div>
                        )}
                        {exportData.data.users && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Users: {exportData.data.users.length} exported
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Complete Company Export - All Modules */}
            <Card className="border-emerald-200 bg-emerald-50/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="h-5 w-5 text-emerald-600" />
                    Complete Company Export
                  </CardTitle>
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">All Modules</Badge>
                </div>
                <CardDescription>
                  Export ALL data for a company including Images, Test Records, and Analytics data. Self-contained export - no manual file copying needed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-emerald-800">Includes:</h4>
                    <ul className="text-sm text-emerald-700 space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3" />
                        Company/Organization details
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3" />
                        Users with hashed passwords & site access
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3" />
                        Sites (Asset Performance module)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3" />
                        Assets with nameplate data & images
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3" />
                        Test Records (IR, PI, DGA, PD)
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-emerald-800">&nbsp;</h4>
                    <ul className="text-sm text-emerald-700 space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3" />
                        Substations (Online Monitoring)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3" />
                        Equipment/Assets (Online Monitoring)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3" />
                        Cross-module links
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3" />
                        Asset Images (embedded as base64)
                      </li>
                    </ul>
                  </div>
                </div>
                <Button 
                  onClick={() => handleExportJSON(true, true, true, true)}
                  disabled={loading}
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  size="lg"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Export Complete Company Data
                </Button>
                <p className="text-xs text-emerald-600 text-center">
                  Perfect for demo setup, backup, or migration to another deployment
                </p>
                {exportData && exportData.data?.sites && (
                  <div className="p-3 bg-emerald-100 rounded-lg border border-emerald-300">
                    <div className="text-emerald-800 text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Sites: {exportData.summary?.sites_count || 0} | Assets: {exportData.summary?.assets_count || 0}
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Substations: {exportData.summary?.substations_count || 0} | Equipment: {exportData.summary?.equipment_count || 0}
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Test Records: {exportData.summary?.test_records_count || 0} | Images: {exportData.summary?.images_embedded_count || 0}
                      </div>
                      {exportData.data?.users && (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Users: {exportData.summary?.users_count || 0}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CSV Export */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
                    Export as CSV
                  </CardTitle>
                  <Badge className="bg-green-100 text-green-700 border-green-200">Portable</Badge>
                </div>
                <CardDescription>
                  Export as CSV for Excel editing. Import order: Substations first, then Equipment.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => handleExportCSV('substations')}
                    disabled={loading}
                    className="gap-2"
                  >
                    <Building2 className="h-4 w-4 text-blue-500" />
                    Export Substations
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleExportCSV('equipment')}
                    disabled={loading}
                    className="gap-2"
                  >
                    <Cpu className="h-4 w-4 text-orange-500" />
                    Export Equipment
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Templates Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileDown className="h-5 w-5 text-purple-500" />
                  Download Templates
                </CardTitle>
                <CardDescription>
                  Get blank templates with example data to fill in for bulk import
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => handleDownloadTemplate('substations')}
                    disabled={loading}
                    className="gap-2"
                  >
                    <Building2 className="h-4 w-4" />
                    Substations Template
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleDownloadTemplate('equipment')}
                    disabled={loading}
                    className="gap-2"
                  >
                    <Cpu className="h-4 w-4" />
                    Equipment Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Import Tab */}
          <TabsContent value="import" className="space-y-6">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Upload className="h-5 w-5 text-blue-500" />
                  Upload Data File
                </CardTitle>
                <CardDescription>
                  Upload a JSON backup or CSV file to import data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Select value={importMode} onValueChange={setImportMode}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="append">Append to existing</SelectItem>
                      <SelectItem value="replace">Replace all data</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-gray-500">
                    {importMode === 'append' 
                      ? 'New data will be added. Duplicates will be skipped.'
                      : 'Warning: Existing data will be deleted first!'}
                  </div>
                </div>
                
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Click to upload or drag and drop</p>
                  <p className="text-gray-400 text-sm mt-1">JSON or CSV files</p>
                </div>
              </CardContent>
            </Card>

            {/* Preview Section */}
            {importPreview && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Info className="h-5 w-5 text-amber-500" />
                    Import Preview
                  </CardTitle>
                  <CardDescription>
                    Review the data before importing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {importPreview.type === 'json' && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 text-blue-700 font-medium mb-2">
                          <Building2 className="h-4 w-4" />
                          Substations: {importPreview.totalSubstations}
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {importPreview.substations.map((s, i) => (
                            <li key={i} className="truncate">• {s.name} ({s.region})</li>
                          ))}
                          {importPreview.totalSubstations > 5 && (
                            <li className="text-gray-400">...and {importPreview.totalSubstations - 5} more</li>
                          )}
                        </ul>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center gap-2 text-orange-700 font-medium mb-2">
                          <Cpu className="h-4 w-4" />
                          Equipment: {importPreview.totalEquipment}
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {importPreview.equipment.map((e, i) => (
                            <li key={i} className="truncate">• {e.name} ({e.equipment_type})</li>
                          ))}
                          {importPreview.totalEquipment > 5 && (
                            <li className="text-gray-400">...and {importPreview.totalEquipment - 5} more</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  {/* Full Deployment Info - Company and Users */}
                  {importPreview.type === 'json' && importPreview.isFullDeployment && (
                    <Alert className="bg-purple-50 border-purple-200">
                      <Building2 className="h-4 w-4 text-purple-600" />
                      <AlertTitle className="text-purple-800">Full Deployment Import Detected</AlertTitle>
                      <AlertDescription className="text-purple-700 space-y-2">
                        <p>This file contains company and/or user data:</p>
                        <div className="grid md:grid-cols-2 gap-2 mt-2">
                          {importPreview.company && (
                            <div className="p-2 bg-purple-100 rounded text-sm">
                              <span className="font-medium">Company:</span> {importPreview.company.company_name}
                            </div>
                          )}
                          {importPreview.totalUsers > 0 && (
                            <div className="p-2 bg-purple-100 rounded text-sm">
                              <span className="font-medium">Users:</span> {importPreview.totalUsers} user(s)
                            </div>
                          )}
                        </div>
                        <label className="flex items-center gap-2 mt-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={createCompanyOnImport}
                            onChange={(e) => setCreateCompanyOnImport(e.target.checked)}
                            className="h-4 w-4 text-purple-600"
                          />
                          <span className="text-sm">Create company if it doesn't exist (Master Admin only)</span>
                        </label>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Cross-Module Links Info */}
                  {importPreview.type === 'json' && importPreview.totalCrossModuleLinks > 0 && (
                    <Alert className="bg-blue-50 border-blue-200">
                      <Link2 className="h-4 w-4 text-blue-600" />
                      <AlertTitle className="text-blue-800">Cross-Module Links Included</AlertTitle>
                      <AlertDescription className="text-blue-700">
                        <p className="text-sm">
                          This export includes {importPreview.totalCrossModuleLinks} cross-module link(s) between 
                          monitoring assets and APM assets. These will be restored on import if the corresponding 
                          assets exist in the target deployment.
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {importPreview.type === 'csv' && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant={importPreview.dataType === 'substations' ? 'default' : 'secondary'}>
                          {importPreview.dataType === 'substations' ? 'Substations' : 
                           importPreview.dataType === 'equipment' ? 'Equipment' : 'Unknown Type'}
                        </Badge>
                        <span className="text-sm text-gray-500">{importPreview.totalRows} rows</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border rounded-lg overflow-hidden">
                          <thead className="bg-gray-100">
                            <tr>
                              {importPreview.columns.map((col, i) => (
                                <th key={i} className="px-3 py-2 text-left font-medium text-gray-700">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {importPreview.rows.map((row, i) => (
                              <tr key={i} className="border-t">
                                {importPreview.columns.map((col, j) => (
                                  <td key={j} className="px-3 py-2 text-gray-600 truncate max-w-[150px]">
                                    {row[col] || '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {importPreview.totalRows > 5 && (
                        <p className="text-sm text-gray-400 mt-2">...and {importPreview.totalRows - 5} more rows</p>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-3 pt-4 border-t">
                    <Button onClick={handleImport} disabled={loading} className="gap-2">
                      {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Import Data
                    </Button>
                    <Button variant="outline" onClick={() => setImportPreview(null)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Section */}
            {importResults && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {importResults.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    Import Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">{importResults.message}</p>
                  
                  {/* Company/User results for full deployment */}
                  {(importResults.results?.company || importResults.results?.users) && (
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <h4 className="font-medium text-purple-700 mb-2">Full Deployment Results</h4>
                      <div className="space-y-2 text-sm">
                        {importResults.results?.company && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-purple-600" />
                            <span className={importResults.results.company.created ? "text-green-600" : "text-amber-600"}>
                              {importResults.results.company.message}
                            </span>
                          </div>
                        )}
                        {importResults.results?.users && (
                          <div className="flex items-center justify-between">
                            <span>Users:</span>
                            <span>
                              <span className="text-green-600">{importResults.results.users.imported || 0} imported</span>
                              {importResults.results.users.skipped > 0 && (
                                <span className="text-amber-600 ml-2">{importResults.results.users.skipped} skipped</span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Online Monitoring Results */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-2">Substations (Online Monitoring)</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-green-600">Imported:</span>
                          <span className="font-medium">{importResults.results?.substations?.imported || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-600">Skipped:</span>
                          <span className="font-medium">{importResults.results?.substations?.skipped || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-600">Errors:</span>
                          <span className="font-medium">{importResults.results?.substations?.errors?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-2">Equipment (Online Monitoring)</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-green-600">Imported:</span>
                          <span className="font-medium">{importResults.results?.equipment?.imported || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-600">Skipped:</span>
                          <span className="font-medium">{importResults.results?.equipment?.skipped || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-600">Errors:</span>
                          <span className="font-medium">{importResults.results?.equipment?.errors?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Asset Performance Module Results */}
                  {(importResults.results?.sites || importResults.results?.assets) && (
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="font-medium text-green-700 mb-2">Sites (Asset Performance)</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-green-600">Imported:</span>
                            <span className="font-medium">{importResults.results?.sites?.imported || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-amber-600">Skipped:</span>
                            <span className="font-medium">{importResults.results?.sites?.skipped || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-600">Errors:</span>
                            <span className="font-medium">{importResults.results?.sites?.errors?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="font-medium text-green-700 mb-2">Assets (Asset Performance)</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-green-600">Imported:</span>
                            <span className="font-medium">{importResults.results?.assets?.imported || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-amber-600">Skipped:</span>
                            <span className="font-medium">{importResults.results?.assets?.skipped || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-600">Errors:</span>
                            <span className="font-medium">{importResults.results?.assets?.errors?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Cross-Module Links Results */}
                  {(importResults.results?.cross_module_links?.linked > 0 || 
                    importResults.results?.cross_module_links?.skipped > 0) && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
                        <Link2 className="h-4 w-4" />
                        Cross-Module Links
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-green-600">Linked:</span>
                          <span className="font-medium">{importResults.results?.cross_module_links?.linked || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-600">Skipped (asset not found):</span>
                          <span className="font-medium">{importResults.results?.cross_module_links?.skipped || 0}</span>
                        </div>
                        {importResults.results?.cross_module_links?.errors?.length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-red-600">Errors:</span>
                            <span className="font-medium">{importResults.results?.cross_module_links?.errors?.length}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Test Records Results */}
                  {importResults.results?.test_records && (
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <h4 className="font-medium text-purple-700 mb-2">Test Records</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-green-600">Imported:</span>
                          <span className="font-medium">{importResults.results?.test_records?.imported || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-600">Skipped:</span>
                          <span className="font-medium">{importResults.results?.test_records?.skipped || 0}</span>
                        </div>
                        {importResults.results?.test_records?.errors?.length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-red-600">Errors:</span>
                            <span className="font-medium">{importResults.results?.test_records?.errors?.length}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Show errors if any */}
                  {(importResults.results?.substations?.errors?.length > 0 || 
                    importResults.results?.equipment?.errors?.length > 0 ||
                    importResults.results?.sites?.errors?.length > 0 ||
                    importResults.results?.assets?.errors?.length > 0) && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Import Errors</AlertTitle>
                      <AlertDescription>
                        <ul className="mt-2 text-sm space-y-1">
                          {importResults.results?.sites?.errors?.slice(0, 5).map((err, i) => (
                            <li key={`site-${i}`}>Site Row {err.row}: {err.name || err.site_name} - {err.error}</li>
                          ))}
                          {importResults.results?.assets?.errors?.slice(0, 5).map((err, i) => (
                            <li key={`asset-${i}`}>Asset Row {err.row}: {err.name || err.asset_name} - {err.error}</li>
                          ))}
                          {importResults.results?.substations?.errors?.slice(0, 5).map((err, i) => (
                            <li key={`s-${i}`}>Substation Row {err.row}: {err.name} - {err.error}</li>
                          ))}
                          {importResults.results?.equipment?.errors?.slice(0, 5).map((err, i) => (
                            <li key={`e-${i}`}>Equipment Row {err.row}: {err.name} - {err.error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <Button variant="outline" onClick={() => setImportResults(null)}>
                    Close
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Clear Data Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Clear Monitoring Data
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. Select what data to clear:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input 
                type="checkbox" 
                checked={clearOptions.equipment}
                onChange={(e) => setClearOptions(prev => ({ ...prev, equipment: e.target.checked }))}
                className="h-4 w-4 text-red-600"
              />
              <div>
                <div className="font-medium">Equipment</div>
                <div className="text-sm text-gray-500">All equipment records</div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input 
                type="checkbox" 
                checked={clearOptions.substations}
                onChange={(e) => setClearOptions(prev => ({ ...prev, substations: e.target.checked }))}
                className="h-4 w-4 text-red-600"
              />
              <div>
                <div className="font-medium">Substations</div>
                <div className="text-sm text-gray-500">All substation records (will also clear equipment)</div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input 
                type="checkbox" 
                checked={clearOptions.readings}
                onChange={(e) => setClearOptions(prev => ({ ...prev, readings: e.target.checked }))}
                className="h-4 w-4 text-red-600"
              />
              <div>
                <div className="font-medium">Readings</div>
                <div className="text-sm text-gray-500">Historical sensor readings</div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input 
                type="checkbox" 
                checked={clearOptions.alarms}
                onChange={(e) => setClearOptions(prev => ({ ...prev, alarms: e.target.checked }))}
                className="h-4 w-4 text-red-600"
              />
              <div>
                <div className="font-medium">Alarms</div>
                <div className="text-sm text-gray-500">All alarm history</div>
              </div>
            </label>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleClearData}
              disabled={loading || (!clearOptions.substations && !clearOptions.equipment && !clearOptions.readings && !clearOptions.alarms)}
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Clear Selected Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DataManagementPage;
