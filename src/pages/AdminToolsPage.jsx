import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { Checkbox } from '../components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import {
  ArrowLeft,
  Shield,
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Wrench,
  Activity,
  Server,
  HardDrive,
  BarChart3,
  ClipboardList,
  Zap,
  Search,
  Settings,
  FileWarning,
  CircleDot,
  ChevronRight,
  Loader2,
  MapPin,
  Link2,
  ArrowRightLeft,
  Building2,
  Globe,
  Palette,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../services/api';
import { toast } from 'sonner';

export const AdminToolsPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const { currentUser, isMaster, isAdmin } = useAuth();
  
  // State for Asset Breakdown tool
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showFixDialog, setShowFixDialog] = useState(false);
  const [fixingInProgress, setFixingInProgress] = useState(false);
  const [fixResult, setFixResult] = useState(null);
  const [lastAnalysis, setLastAnalysis] = useState(null);
  
  // State for Asset Linkage tool
  const [linkageLoading, setLinkageLoading] = useState(false);
  const [linkageResult, setLinkageResult] = useState(null);
  const [showLinkageFixDialog, setShowLinkageFixDialog] = useState(false);
  const [linkageFixingInProgress, setLinkageFixingInProgress] = useState(false);
  const [linkageFixResult, setLinkageFixResult] = useState(null);
  const [lastLinkageAnalysis, setLastLinkageAnalysis] = useState(null);
  
  // State for orphaned asset assignment
  const [sitesList, setSitesList] = useState([]);
  const [selectedOrphanedAssets, setSelectedOrphanedAssets] = useState([]);
  const [targetSiteId, setTargetSiteId] = useState('');
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assigningInProgress, setAssigningInProgress] = useState(false);
  
  // Active tool tab
  const [activeTool, setActiveTool] = useState('breakdown'); // 'breakdown', 'linkage', 'module-sync', or 'data-reassign'
  
  // State for Module Sync tool
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncResult, setSyncResult] = useState(null);
  const [showSyncConfirmDialog, setShowSyncConfirmDialog] = useState(false);

  // State for Data Reassignment tool
  const [reassignLoading, setReassignLoading] = useState(false);
  const [reassignSummary, setReassignSummary] = useState(null);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [reassignSourceTenant, setReassignSourceTenant] = useState('');
  const [reassignTargetCompany, setReassignTargetCompany] = useState('');
  const [reassignInProgress, setReassignInProgress] = useState(false);
  const [reassignResult, setReassignResult] = useState(null);

  // Check access
  useEffect(() => {
    if (!isMaster && !isAdmin) {
      toast.error('Access denied. Admin privileges required.');
      navigate('/sites');
    }
  }, [isMaster, isAdmin, navigate]);

  // Analyze asset breakdown
  const handleAnalyze = async () => {
    setLoading(true);
    setAnalysisResult(null);
    try {
      const result = await adminAPI.analyzeAssetBreakdown();
      setAnalysisResult(result);
      setLastAnalysis(new Date().toISOString());
      
      if (result.sites_needing_fix === 0) {
        toast.success('All sites have correct asset counts!');
      } else {
        toast.warning(`${result.sites_needing_fix} sites need fixing`);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Failed to analyze database: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Apply fixes
  const handleApplyFix = async () => {
    setFixingInProgress(true);
    try {
      const result = await adminAPI.fixAssetBreakdown();
      setFixResult(result);
      toast.success(`Fixed ${result.results?.fixed?.length || 0} sites successfully!`);
      
      // Refresh analysis
      await handleAnalyze();
    } catch (error) {
      console.error('Fix failed:', error);
      toast.error('Failed to apply fixes: ' + (error.message || 'Unknown error'));
    } finally {
      setFixingInProgress(false);
      setShowFixDialog(false);
    }
  };

  // Analyze asset linkage
  const handleAnalyzeLinkage = async () => {
    setLinkageLoading(true);
    setLinkageResult(null);
    try {
      const result = await adminAPI.analyzeAssetLinkage();
      setLinkageResult(result);
      setLastLinkageAnalysis(new Date().toISOString());
      
      const issueCount = result.summary?.assets_with_issues || 0;
      if (issueCount === 0) {
        toast.success('All assets have correct site linkage!');
      } else {
        toast.warning(`${issueCount} assets have linkage issues`);
      }
    } catch (error) {
      console.error('Linkage analysis failed:', error);
      toast.error('Failed to analyze asset linkage: ' + (error.message || 'Unknown error'));
    } finally {
      setLinkageLoading(false);
    }
  };

  // Apply linkage fixes
  const handleApplyLinkageFix = async () => {
    setLinkageFixingInProgress(true);
    try {
      const result = await adminAPI.fixAssetLinkage();
      setLinkageFixResult(result);
      toast.success(`Fixed ${result.results?.fixed?.length || 0} assets, ${result.results?.skipped_orphaned?.length || 0} orphaned`);
      
      // Refresh analysis
      await handleAnalyzeLinkage();
    } catch (error) {
      console.error('Linkage fix failed:', error);
      toast.error('Failed to apply linkage fixes: ' + (error.message || 'Unknown error'));
    } finally {
      setLinkageFixingInProgress(false);
      setShowLinkageFixDialog(false);
    }
  };

  // Load sites list for dropdown
  const loadSitesList = async () => {
    try {
      const sites = await adminAPI.getSitesList();
      setSitesList(sites || []);
    } catch (error) {
      console.error('Failed to load sites list:', error);
    }
  };

  // Load sites when linkage tab is active
  useEffect(() => {
    if (activeTool === 'linkage') {
      loadSitesList();
    }
  }, [activeTool]);

  // Toggle orphaned asset selection
  const handleToggleOrphanedAsset = (assetId) => {
    setSelectedOrphanedAssets(prev => 
      prev.includes(assetId) 
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  // Select all orphaned assets
  const handleSelectAllOrphaned = () => {
    const orphanedIds = linkageResult?.issues?.orphaned?.map(a => a.asset_id) || [];
    if (selectedOrphanedAssets.length === orphanedIds.length) {
      setSelectedOrphanedAssets([]);
    } else {
      setSelectedOrphanedAssets(orphanedIds);
    }
  };

  // Open assign dialog
  const handleOpenAssignDialog = () => {
    if (selectedOrphanedAssets.length === 0) {
      toast.error('Please select at least one asset to assign');
      return;
    }
    setShowAssignDialog(true);
  };

  // Assign orphaned assets to site
  const handleAssignToSite = async () => {
    if (!targetSiteId) {
      toast.error('Please select a target site');
      return;
    }
    
    setAssigningInProgress(true);
    try {
      const result = await adminAPI.assignAssetsToSite(selectedOrphanedAssets, targetSiteId);
      toast.success(result.message || `Assigned ${result.results?.assigned?.length || 0} assets`);
      
      // Reset selection
      setSelectedOrphanedAssets([]);
      setTargetSiteId('');
      setShowAssignDialog(false);
      
      // Refresh analysis
      await handleAnalyzeLinkage();
    } catch (error) {
      console.error('Assignment failed:', error);
      toast.error('Failed to assign assets: ' + (error.message || 'Unknown error'));
    } finally {
      setAssigningInProgress(false);
    }
  };

  // ============= MODULE SYNC FUNCTIONS =============
  
  // Fetch sync status
  const handleFetchSyncStatus = async () => {
    setSyncLoading(true);
    try {
      const result = await adminAPI.getSyncStatus();
      setSyncStatus(result);
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
      toast.error('Failed to fetch sync status');
    } finally {
      setSyncLoading(false);
    }
  };
  
  // Execute sync
  const handleExecuteSync = async () => {
    setSyncLoading(true);
    setShowSyncConfirmDialog(false);
    try {
      const result = await adminAPI.syncMonitoringToAPM();
      setSyncResult(result);
      toast.success(result.message || 'Sync completed successfully');
      // Refresh status after sync
      await handleFetchSyncStatus();
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Sync failed: ' + (error.message || 'Unknown error'));
    } finally {
      setSyncLoading(false);
    }
  };
  
  // Load sync status when tab becomes active
  useEffect(() => {
    if (activeTool === 'module-sync') {
      handleFetchSyncStatus();
    }
  }, [activeTool]);

  // ============= DATA REASSIGNMENT FUNCTIONS =============
  
  // Fetch monitoring data summary
  const handleFetchReassignSummary = async () => {
    setReassignLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/data-reassignment/monitoring-summary`);
      if (!response.ok) throw new Error('Failed to fetch summary');
      const result = await response.json();
      setReassignSummary(result);
    } catch (error) {
      console.error('Failed to fetch reassignment summary:', error);
      toast.error('Failed to fetch data summary');
    } finally {
      setReassignLoading(false);
    }
  };
  
  // Execute data reassignment
  const handleExecuteReassign = async () => {
    if (!reassignTargetCompany) {
      toast.error('Please select a target company');
      return;
    }
    
    setReassignInProgress(true);
    try {
      const params = new URLSearchParams({
        source_tenant_id: reassignSourceTenant || '',
        target_company_id: reassignTargetCompany,
        move_substations: 'true',
        move_equipment: 'true',
        move_alarms: 'true'
      });
      
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/data-reassignment/move-monitoring-data?${params}`,
        { method: 'POST' }
      );
      
      if (!response.ok) throw new Error('Failed to move data');
      const result = await response.json();
      setReassignResult(result);
      toast.success(`Data moved successfully! Substations: ${result.moved?.substations || 0}, Equipment: ${result.moved?.equipment || 0}`);
      
      // Refresh summary
      await handleFetchReassignSummary();
      setShowReassignDialog(false);
    } catch (error) {
      console.error('Reassignment failed:', error);
      toast.error('Failed to move data: ' + (error.message || 'Unknown error'));
    } finally {
      setReassignInProgress(false);
    }
  };
  
  // Load reassignment summary when tab becomes active
  useEffect(() => {
    if (activeTool === 'data-reassign') {
      handleFetchReassignSummary();
    }
  }, [activeTool]);

  // Get status badge
  const getStatusBadge = (needsFix) => {
    if (needsFix) {
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Needs Fix
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        OK
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader 
        title="Admin Tools" 
        onLogout={onLogout}
        showBackButton={true}
        onBackClick={() => navigate('/sites')}
      />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-800 rounded-lg">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Admin Tools</h1>
              <p className="text-slate-600">Database maintenance and system diagnostics</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <p className="text-xl font-bold text-slate-800">
                    {analysisResult ? 'Analyzed' : 'Not Checked'}
                  </p>
                </div>
                <Database className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Sites OK</p>
                  <p className="text-xl font-bold text-green-600">
                    {analysisResult?.sites_ok ?? '-'}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Sites Need Fix</p>
                  <p className="text-xl font-bold text-amber-600">
                    {analysisResult?.sites_needing_fix ?? '-'}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-slate-500">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Sites</p>
                  <p className="text-xl font-bold text-slate-800">
                    {analysisResult?.total_sites ?? '-'}
                  </p>
                </div>
                <Server className="w-8 h-8 text-slate-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tool Selector Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant={activeTool === 'breakdown' ? 'default' : 'outline'}
            onClick={() => setActiveTool('breakdown')}
            className="gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Asset Count Check
          </Button>
          <Button
            variant={activeTool === 'linkage' ? 'default' : 'outline'}
            onClick={() => setActiveTool('linkage')}
            className="gap-2"
          >
            <Database className="w-4 h-4" />
            Asset Linkage Check
          </Button>
          <Button
            variant={activeTool === 'module-sync' ? 'default' : 'outline'}
            onClick={() => setActiveTool('module-sync')}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Module Sync
          </Button>
          <Button
            variant={activeTool === 'data-reassign' ? 'default' : 'outline'}
            onClick={() => setActiveTool('data-reassign')}
            className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Data Reassignment
          </Button>
        </div>

        {/* Main Tools Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Database Tools */}
          <div className="lg:col-span-2">
            {/* Asset Breakdown Tool */}
            {activeTool === 'breakdown' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-slate-600" />
                    <CardTitle>Database Health Check</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAnalyze}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Analyze
                        </>
                      )}
                    </Button>
                    {analysisResult?.sites_needing_fix > 0 && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setShowFixDialog(true)}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        <Wrench className="w-4 h-4 mr-2" />
                        Fix Issues ({analysisResult.sites_needing_fix})
                      </Button>
                    )}
                  </div>
                </div>
                <CardDescription>
                  Check and fix asset count synchronization across all sites
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!analysisResult ? (
                  <div className="text-center py-12 text-slate-500">
                    <Database className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-medium mb-2">No Analysis Run Yet</p>
                    <p className="text-sm">Click "Analyze" to check database health</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Summary */}
                    <div className={`p-4 rounded-lg ${
                      analysisResult.sites_needing_fix === 0 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-amber-50 border border-amber-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        {analysisResult.sites_needing_fix === 0 ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="font-medium text-green-800">
                              All sites have correct asset counts!
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                            <span className="font-medium text-amber-800">
                              {analysisResult.sites_needing_fix} site(s) have incorrect asset counts
                            </span>
                          </>
                        )}
                      </div>
                      {lastAnalysis && (
                        <p className="text-xs text-slate-500 mt-2">
                          Last analyzed: {new Date(lastAnalysis).toLocaleString()}
                        </p>
                      )}
                    </div>

                    {/* Sites List */}
                    <Accordion type="single" collapsible className="w-full">
                      {analysisResult.details
                        ?.sort((a, b) => (b.needs_fix ? 1 : 0) - (a.needs_fix ? 1 : 0))
                        .map((site, index) => (
                        <AccordionItem key={site.site_id} value={site.site_id}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center justify-between w-full pr-4">
                              <div className="flex items-center gap-3">
                                <CircleDot className={`w-4 h-4 ${
                                  site.needs_fix ? 'text-amber-500' : 'text-green-500'
                                }`} />
                                <span className="font-medium">{site.site_name}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-sm text-slate-500">
                                  {site.actual_total} assets
                                </span>
                                {getStatusBadge(site.needs_fix)}
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="pl-7 space-y-3">
                              {site.needs_fix && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                  <p className="text-sm font-medium text-amber-800 mb-2">
                                    Issue Details:
                                  </p>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="text-slate-500">Dashboard Shows:</p>
                                      <p className="font-mono bg-white px-2 py-1 rounded">
                                        {JSON.stringify(site.current_breakdown)}
                                      </p>
                                      <p className="text-slate-600 mt-1">
                                        Total: {site.current_total}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-slate-500">Actual Assets:</p>
                                      <p className="font-mono bg-white px-2 py-1 rounded">
                                        {JSON.stringify(site.actual_breakdown)}
                                      </p>
                                      <p className="text-slate-600 mt-1">
                                        Total: {site.actual_total}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Assets List */}
                              <div>
                                <p className="text-sm font-medium text-slate-700 mb-2">
                                  Assets in Database ({site.assets?.length || 0}):
                                </p>
                                {site.assets?.length > 0 ? (
                                  <div className="bg-slate-50 rounded-lg p-3">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead className="text-xs">Asset Name</TableHead>
                                          <TableHead className="text-xs">Type</TableHead>
                                          <TableHead className="text-xs">ID</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {site.assets.map((asset) => (
                                          <TableRow key={asset.asset_id}>
                                            <TableCell className="text-sm font-medium">
                                              {asset.asset_name}
                                            </TableCell>
                                            <TableCell>
                                              <Badge variant="outline" className="text-xs">
                                                {asset.asset_type}
                                              </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs font-mono text-slate-500">
                                              {asset.asset_id?.slice(0, 8)}...
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <p className="text-sm text-slate-500 italic">
                                    No assets found for this site
                                  </p>
                                )}
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}
              </CardContent>
            </Card>
            )}

            {/* Asset Linkage Tool */}
            {activeTool === 'linkage' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-slate-600" />
                    <CardTitle>Asset Site Linkage Check</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAnalyzeLinkage}
                      disabled={linkageLoading}
                    >
                      {linkageLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Analyze
                        </>
                      )}
                    </Button>
                    {linkageResult?.summary?.assets_with_issues > 0 && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setShowLinkageFixDialog(true)}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        <Wrench className="w-4 h-4 mr-2" />
                        Fix Linkage Issues
                      </Button>
                    )}
                  </div>
                </div>
                <CardDescription>
                  Check if assets are properly linked to valid sites (site_id and site_ids fields)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!linkageResult ? (
                  <div className="text-center py-12 text-slate-500">
                    <Database className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-medium mb-2">No Analysis Run Yet</p>
                    <p className="text-sm">Click "Analyze" to check asset-site linkage</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Summary */}
                    <div className={`p-4 rounded-lg ${
                      linkageResult.summary?.assets_with_issues === 0 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-amber-50 border border-amber-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        {linkageResult.summary?.assets_with_issues === 0 ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="font-medium text-green-800">
                              All assets have correct site linkage!
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                            <span className="font-medium text-amber-800">
                              {linkageResult.summary?.assets_with_issues} asset(s) have linkage issues
                            </span>
                          </>
                        )}
                      </div>
                      {lastLinkageAnalysis && (
                        <p className="text-xs text-slate-500 mt-2">
                          Last analyzed: {new Date(lastLinkageAnalysis).toLocaleString()}
                        </p>
                      )}
                    </div>

                    {/* Issue Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-slate-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-slate-800">{linkageResult.summary?.total_assets || 0}</p>
                        <p className="text-xs text-slate-500">Total Assets</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-green-600">{linkageResult.summary?.assets_ok || 0}</p>
                        <p className="text-xs text-slate-500">Assets OK</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-amber-600">{linkageResult.summary?.missing_site_id_count || 0}</p>
                        <p className="text-xs text-slate-500">Missing site_id</p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-red-600">{linkageResult.summary?.orphaned_count || 0}</p>
                        <p className="text-xs text-slate-500">Orphaned</p>
                      </div>
                    </div>

                    {/* Orphaned Assets Section - Only show if there are orphaned assets */}
                    {linkageResult.issues?.orphaned?.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <h4 className="font-semibold text-red-800">
                              Orphaned Assets ({linkageResult.issues.orphaned.length})
                            </h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleSelectAllOrphaned}
                              className="text-xs"
                            >
                              {selectedOrphanedAssets.length === linkageResult.issues.orphaned.length
                                ? 'Deselect All'
                                : 'Select All'}
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleOpenAssignDialog}
                              disabled={selectedOrphanedAssets.length === 0}
                              className="bg-blue-600 hover:bg-blue-700 text-xs"
                            >
                              <MapPin className="w-3 h-3 mr-1" />
                              Assign to Site ({selectedOrphanedAssets.length})
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-red-700 mb-3">
                          These assets have site_id values that don't match any existing site. 
                          Select assets and assign them to a valid site.
                        </p>
                        
                        <ScrollArea className="h-[200px]">
                          <div className="bg-white rounded-lg">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[40px]"></TableHead>
                                  <TableHead className="text-xs">Asset Name</TableHead>
                                  <TableHead className="text-xs">Type</TableHead>
                                  <TableHead className="text-xs">Invalid site_id</TableHead>
                                  <TableHead className="text-xs">Issues</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {linkageResult.issues.orphaned.map((asset) => (
                                  <TableRow 
                                    key={asset.asset_id} 
                                    className={selectedOrphanedAssets.includes(asset.asset_id) ? 'bg-blue-50' : ''}
                                  >
                                    <TableCell>
                                      <Checkbox
                                        checked={selectedOrphanedAssets.includes(asset.asset_id)}
                                        onCheckedChange={() => handleToggleOrphanedAsset(asset.asset_id)}
                                      />
                                    </TableCell>
                                    <TableCell className="text-sm font-medium">
                                      {asset.asset_name}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="text-xs">
                                        {asset.asset_type}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs font-mono text-red-600">
                                      {asset.site_id ? asset.site_id.slice(0, 12) + '...' : 'null'}
                                    </TableCell>
                                    <TableCell className="text-xs text-red-700">
                                      {asset.issues?.join(', ').slice(0, 50)}...
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </ScrollArea>
                      </div>
                    )}

                    {/* All Assets Table */}
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">
                        All Assets ({linkageResult.all_assets?.length || 0}):
                      </p>
                      <ScrollArea className="h-[400px]">
                        <div className="bg-slate-50 rounded-lg p-3">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs">Asset Name</TableHead>
                                <TableHead className="text-xs">Type</TableHead>
                                <TableHead className="text-xs">site_id</TableHead>
                                <TableHead className="text-xs">site_ids</TableHead>
                                <TableHead className="text-xs">Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {linkageResult.all_assets?.map((asset) => (
                                <TableRow key={asset.asset_id} className={asset.issues?.length > 0 ? 'bg-amber-50' : ''}>
                                  <TableCell className="text-sm font-medium">
                                    {asset.asset_name}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs">
                                      {asset.asset_type}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-xs font-mono text-slate-500">
                                    {asset.site_id ? asset.site_id.slice(0, 8) + '...' : <span className="text-red-500">MISSING</span>}
                                  </TableCell>
                                  <TableCell className="text-xs font-mono text-slate-500">
                                    {asset.site_ids?.length > 0 
                                      ? `[${asset.site_ids.length} site(s)]` 
                                      : <span className="text-red-500">EMPTY</span>}
                                  </TableCell>
                                  <TableCell>
                                    {asset.issues?.length > 0 ? (
                                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                                        {asset.issues.length} issue(s)
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                        OK
                                      </Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Valid Sites Reference */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-800 mb-2">
                        Valid Site IDs in Database ({linkageResult.valid_site_ids?.length || 0}):
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {linkageResult.valid_site_ids?.map((siteId) => (
                          <Badge key={siteId} variant="outline" className="text-xs font-mono bg-white">
                            {siteId.slice(0, 8)}...
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            )}
            
            {/* Module Sync Tool */}
            {activeTool === 'module-sync' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-slate-600" />
                    <CardTitle>Monitoring → APM Sync</CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFetchSyncStatus}
                    disabled={syncLoading}
                    className="gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncLoading ? 'animate-spin' : ''}`} />
                    Refresh Status
                  </Button>
                </div>
                <CardDescription>
                  Sync substations from Online Monitoring to Sites in Asset Performance, and assign assets to their corresponding sites.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* How it works */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-slate-800 mb-2">How It Works</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">1.</span>
                      <span>Creates a <strong>Site</strong> in APM for each <strong>Substation</strong> in Monitoring</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">2.</span>
                      <span>Groups Sites by <strong>Region</strong> for easy navigation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">3.</span>
                      <span>Assigns each <strong>Asset</strong> to the Site corresponding to its linked equipment's substation</span>
                    </li>
                  </ul>
                </div>
                
                {/* Sync Status */}
                {syncStatus && (
                  <div className="space-y-4 mb-6">
                    <h4 className="font-medium text-slate-800">Current Status</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Monitoring Module */}
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                        <h5 className="font-medium text-emerald-800 mb-2 flex items-center gap-2">
                          <Server className="w-4 h-4" />
                          Online Monitoring
                        </h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Substations:</span>
                            <span className="font-medium">{syncStatus.monitoring?.substations || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Equipment:</span>
                            <span className="font-medium">{syncStatus.monitoring?.equipment || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Linked to Assets:</span>
                            <span className="font-medium">{syncStatus.monitoring?.linked_equipment || 0}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* APM Module */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h5 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" />
                          Asset Performance
                        </h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Sites:</span>
                            <span className="font-medium">{syncStatus.apm?.sites || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Linked to Substations:</span>
                            <span className="font-medium">{syncStatus.apm?.sites_linked_to_substations || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Assets with Sites:</span>
                            <span className="font-medium">{syncStatus.apm?.assets_with_sites || 0} / {syncStatus.apm?.assets || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Region Breakdown */}
                    {syncStatus.regions && Object.keys(syncStatus.regions).length > 0 && (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <h5 className="font-medium text-slate-800 mb-2">Sites by Region</h5>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(syncStatus.regions).map(([region, count]) => (
                            <Badge key={region} variant="outline" className="bg-white">
                              {region}: {count}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Sync Result */}
                {syncResult && (
                  <div className={`border rounded-lg p-4 mb-6 ${syncResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <h4 className={`font-medium mb-2 ${syncResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {syncResult.success ? 'Sync Completed Successfully' : 'Sync Failed'}
                    </h4>
                    <p className="text-sm text-slate-700">{syncResult.message}</p>
                    
                    {syncResult.results && (
                      <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                        <div className="flex justify-between">
                          <span>Sites Created:</span>
                          <span className="font-medium text-green-600">{syncResult.results.sites_created}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sites Updated:</span>
                          <span className="font-medium text-blue-600">{syncResult.results.sites_updated}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Assets Assigned:</span>
                          <span className="font-medium text-green-600">{syncResult.results.assets_assigned}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Assets Skipped:</span>
                          <span className="font-medium text-amber-600">{syncResult.results.assets_skipped}</span>
                        </div>
                      </div>
                    )}
                    
                    {syncResult.results?.region_summary && Object.keys(syncResult.results.region_summary).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-sm font-medium text-slate-700 mb-2">By Region:</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(syncResult.results.region_summary).map(([region, data]) => (
                            <Badge key={region} variant="outline" className="bg-white">
                              {region}: {data.sites} sites, {data.assets} assets
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Sync Button */}
                <Button
                  onClick={() => setShowSyncConfirmDialog(true)}
                  disabled={syncLoading}
                  className="w-full gap-2"
                >
                  {syncLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Run Sync Now
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
            )}
            
            {/* Data Reassignment Tool */}
            {activeTool === 'data-reassign' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft className="w-5 h-5 text-purple-600" />
                    <CardTitle>Data Reassignment Tool</CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFetchReassignSummary}
                    disabled={reassignLoading}
                  >
                    {reassignLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <CardDescription>
                  Move Online Monitoring data between organizations for demo setup
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reassignLoading && !reassignSummary ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-600" />
                    <p className="text-sm text-slate-500">Loading data summary...</p>
                  </div>
                ) : reassignSummary ? (
                  <div className="space-y-4">
                    {/* Data by Tenant */}
                    <div>
                      <h4 className="font-medium text-slate-700 mb-3">Current Data Distribution</h4>
                      <div className="space-y-3">
                        {reassignSummary.data_by_tenant?.map((tenant) => (
                          <Card key={tenant.tenant_id || 'empty'} className="border-slate-200">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-slate-500" />
                                  <span className="font-medium">
                                    {tenant.company_name || 'No Company (Master)'}
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-purple-600 border-purple-200 hover:bg-purple-50"
                                  onClick={() => {
                                    setReassignSourceTenant(tenant.tenant_id || '');
                                    setShowReassignDialog(true);
                                  }}
                                >
                                  Move Data
                                </Button>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                <div className="bg-blue-50 rounded p-2 text-center">
                                  <p className="text-blue-600 font-medium">{tenant.substations}</p>
                                  <p className="text-xs text-slate-500">Substations</p>
                                </div>
                                <div className="bg-green-50 rounded p-2 text-center">
                                  <p className="text-green-600 font-medium">{tenant.equipment}</p>
                                  <p className="text-xs text-slate-500">Equipment</p>
                                </div>
                                <div className="bg-amber-50 rounded p-2 text-center">
                                  <p className="text-amber-600 font-medium">{tenant.alarms}</p>
                                  <p className="text-xs text-slate-500">Alarms</p>
                                </div>
                              </div>
                              {tenant.substation_list?.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-slate-100">
                                  <p className="text-xs text-slate-500 mb-1">Substations:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {tenant.substation_list.slice(0, 5).map((sub, i) => (
                                      <Badge key={i} variant="secondary" className="text-xs">
                                        {sub.name}
                                      </Badge>
                                    ))}
                                    {tenant.substation_list.length > 5 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{tenant.substation_list.length - 5} more
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                    
                    {/* Last Result */}
                    {reassignResult && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-800">Data Moved Successfully</span>
                        </div>
                        <div className="text-sm space-y-1 text-green-700">
                          <p>Target: {reassignResult.target_company_name}</p>
                          <div className="flex gap-4">
                            <span>Substations: {reassignResult.moved?.substations || 0}</span>
                            <span>Equipment: {reassignResult.moved?.equipment || 0}</span>
                            <span>Alarms: {reassignResult.moved?.alarms || 0}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Database className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>Click refresh to load data summary</p>
                  </div>
                )}
              </CardContent>
            </Card>
            )}
          </div>

          {/* Side Panel - Other Tools */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-slate-600" />
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {isMaster() && (
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:from-purple-100 hover:to-blue-100"
                    onClick={() => navigate('/branding-management')}
                  >
                    <Globe className="w-4 h-4 mr-2 text-purple-600" />
                    Multi-Tenant Branding
                  </Button>
                )}
                {isMaster() && (
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-gradient-to-r from-green-50 to-blue-50 border-green-200 hover:from-green-100 hover:to-blue-100"
                    onClick={() => navigate('/partner-management')}
                  >
                    <Building2 className="w-4 h-4 mr-2 text-green-600" />
                    Partner & Customer Links
                  </Button>
                )}
                {(isAdmin() || isMaster()) && (
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 hover:from-emerald-100 hover:to-teal-100"
                    onClick={() => navigate('/tenant-data-export')}
                    data-testid="tenant-data-export-btn"
                  >
                    <Database className="w-4 h-4 mr-2 text-emerald-600" />
                    Tenant Data Export/Import
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleAnalyze}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Analysis
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/audit-trail')}
                >
                  <ClipboardList className="w-4 h-4 mr-2" />
                  View Audit Trail
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/site-management')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Site Management
                </Button>
              </CardContent>
            </Card>

            {/* System Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-slate-600" />
                  <CardTitle className="text-lg">System Info</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Environment</span>
                  <Badge variant="outline">Production</Badge>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">User Role</span>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    {currentUser?.role || 'Unknown'}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Database</span>
                  <span className="text-slate-700">MongoDB</span>
                </div>
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex gap-3">
                  <FileWarning className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 mb-1">
                      About Asset Count Sync
                    </p>
                    <p className="text-xs text-blue-700">
                      This tool checks if the asset counts displayed on dashboards 
                      match the actual assets in the database. Mismatches can occur 
                      when assets are created/deleted but counters aren't updated properly.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Fix Result Display */}
        {fixResult && (
          <Card className="mt-6 border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <CardTitle className="text-green-800">Fix Applied Successfully</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-green-700">
                  <strong>{fixResult.results?.fixed?.length || 0}</strong> sites were fixed
                </p>
                {fixResult.results?.fixed?.map((site) => (
                  <div key={site.site_id} className="bg-white rounded p-2 text-sm">
                    <span className="font-medium">{site.site_name}:</span>
                    <span className="text-slate-600 ml-2">
                      {site.old_total} → {site.new_total} assets
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Fix Confirmation Dialog */}
      <Dialog open={showFixDialog} onOpenChange={setShowFixDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirm Database Fix
            </DialogTitle>
            <DialogDescription>
              This will update asset counts for {analysisResult?.sites_needing_fix} site(s) 
              to match the actual assets in the database.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
              <p className="font-medium text-amber-800 mb-2">Sites to be fixed:</p>
              <ul className="space-y-1">
                {analysisResult?.details
                  ?.filter(s => s.needs_fix)
                  .map(site => (
                    <li key={site.site_id} className="text-amber-700">
                      • {site.site_name}: {site.current_total} → {site.actual_total} assets
                    </li>
                  ))}
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFixDialog(false)}
              disabled={fixingInProgress}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyFix}
              disabled={fixingInProgress}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {fixingInProgress ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Fixing...
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4 mr-2" />
                  Apply Fix
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Linkage Fix Confirmation Dialog */}
      <Dialog open={showLinkageFixDialog} onOpenChange={setShowLinkageFixDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirm Asset Linkage Fix
            </DialogTitle>
            <DialogDescription>
              This will attempt to fix asset site linkage issues by:
              <ul className="mt-2 text-sm list-disc pl-4">
                <li>If site_id exists but site_ids is empty → populate site_ids</li>
                <li>If site_ids exists but site_id is empty → set site_id from site_ids</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
              <p className="font-medium text-amber-800 mb-2">Issues found:</p>
              <ul className="space-y-1 text-amber-700">
                <li>• Missing site_id: {linkageResult?.summary?.missing_site_id_count || 0}</li>
                <li>• Empty site_ids: {linkageResult?.summary?.empty_site_ids_count || 0}</li>
                <li>• Invalid site_id: {linkageResult?.summary?.invalid_site_id_count || 0}</li>
                <li>• Orphaned: {linkageResult?.summary?.orphaned_count || 0} (requires manual fix)</li>
              </ul>
            </div>
            {linkageResult?.summary?.orphaned_count > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm mt-3">
                <p className="font-medium text-red-800">
                  ⚠️ Orphaned assets cannot be auto-fixed and require manual intervention.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLinkageFixDialog(false)}
              disabled={linkageFixingInProgress}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyLinkageFix}
              disabled={linkageFixingInProgress}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {linkageFixingInProgress ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Fixing...
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4 mr-2" />
                  Apply Linkage Fix
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Orphaned Assets to Site Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-blue-500" />
              Assign Assets to Site
            </DialogTitle>
            <DialogDescription>
              Assign {selectedOrphanedAssets.length} selected orphaned asset(s) to a valid site.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* Selected Assets Summary */}
            <div className="bg-slate-50 border rounded-lg p-3">
              <p className="text-sm font-medium text-slate-700 mb-2">
                Selected Assets ({selectedOrphanedAssets.length}):
              </p>
              <div className="max-h-[120px] overflow-y-auto">
                {selectedOrphanedAssets.map(assetId => {
                  const asset = linkageResult?.issues?.orphaned?.find(a => a.asset_id === assetId);
                  return (
                    <div key={assetId} className="text-sm text-slate-600 py-1 border-b last:border-0">
                      • {asset?.asset_name || assetId} 
                      <Badge variant="outline" className="ml-2 text-xs">
                        {asset?.asset_type}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Site Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Select Target Site:
              </label>
              <Select value={targetSiteId} onValueChange={setTargetSiteId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a site to assign assets to..." />
                </SelectTrigger>
                <SelectContent>
                  {sitesList.map((site) => (
                    <SelectItem key={site.site_id} value={site.site_id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {site.site_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Warning */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <p className="text-blue-800">
                <strong>Note:</strong> This will update each asset's <code className="bg-blue-100 px-1 rounded">site_id</code> and <code className="bg-blue-100 px-1 rounded">site_ids</code> fields, 
                and also update the target site's asset count.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAssignDialog(false);
                setTargetSiteId('');
              }}
              disabled={assigningInProgress}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignToSite}
              disabled={assigningInProgress || !targetSiteId}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {assigningInProgress ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4 mr-2" />
                  Assign to Site
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Module Sync Confirmation Dialog */}
      <Dialog open={showSyncConfirmDialog} onOpenChange={setShowSyncConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-500" />
              Confirm Module Sync
            </DialogTitle>
            <DialogDescription>
              This will sync data between Online Monitoring and Asset Performance modules.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="text-blue-800 font-medium mb-2">This operation will:</p>
              <ul className="list-disc list-inside text-blue-700 space-y-1">
                <li>Create Sites in APM from Substations in Monitoring</li>
                <li>Assign each Asset to its corresponding Site</li>
                <li>Group Sites by Region for navigation</li>
              </ul>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
              <p className="text-amber-800">
                <strong>Note:</strong> Existing sites linked to substations will be updated, not duplicated. 
                This operation is safe to run multiple times.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSyncConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExecuteSync}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Run Sync
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Data Reassignment Dialog */}
      <Dialog open={showReassignDialog} onOpenChange={setShowReassignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-purple-600" />
              Move Monitoring Data
            </DialogTitle>
            <DialogDescription>
              Move substations, equipment, and alarms to a different organization.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-sm text-slate-600">
                <strong>Source:</strong> {reassignSourceTenant ? 
                  reassignSummary?.data_by_tenant?.find(t => t.tenant_id === reassignSourceTenant)?.company_name || reassignSourceTenant
                  : 'No Company (Master/Unassigned)'}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Move To Organization:
              </label>
              <Select value={reassignTargetCompany} onValueChange={setReassignTargetCompany}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target company" />
                </SelectTrigger>
                <SelectContent>
                  {reassignSummary?.companies?.map((company) => (
                    <SelectItem key={company.company_id} value={company.company_id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        {company.company_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm">
              <p className="text-purple-800 font-medium mb-2">This will move:</p>
              <ul className="list-disc list-inside text-purple-700 space-y-1">
                <li>All Substations from source to target</li>
                <li>All Equipment/Assets from source to target</li>
                <li>All Alarms from source to target</li>
                <li>Any Cross-Module links</li>
              </ul>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
              <p className="text-amber-800">
                <strong>Note:</strong> After moving data, you may need to run "Module Sync" to update the Site associations in the Asset Performance module.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReassignDialog(false);
                setReassignTargetCompany('');
              }}
              disabled={reassignInProgress}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExecuteReassign}
              disabled={reassignInProgress || !reassignTargetCompany}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {reassignInProgress ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Moving...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  Move Data
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminToolsPage;
