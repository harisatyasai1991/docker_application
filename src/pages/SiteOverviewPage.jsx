import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { DMSLogo } from '../components/DMSLogo';
import { LoadingSpinner, ErrorMessage } from '../components/LoadingStates';
import { useAPIData } from '../hooks/useAPI';
import { sitesAPI } from '../services/api';
import {
  Activity,
  LogOut,
  MapPin,
  Phone,
  Mail,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  CheckCircle,
  Building2,
  Search,
  User,
  FileText,
  FileStack,
  Users,
  Crown,
  Settings,
  ChevronDown,
  Palette,
  Database,
  ClipboardList,
  Shield,
  Plus,
  FileCheck,
  FolderOpen,
  Clock,
  LayoutTemplate,
  FlaskConical,
  Wrench,
  Cpu,
  ListChecks,
  Package,
  BarChart3,
  History,
  Factory,
  Link2,
  Lock,
  Globe,
  ChevronRight,
  Grid3X3,
  List,
  ArrowLeft,
  WifiOff,
  Download,
  Command,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { OnboardAssetDialog } from '../components/OnboardAssetDialog';
import { GlobalSearch } from '../components/GlobalSearch';

export const SiteOverviewPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const { hasPermission, isMaster, isAdmin, currentUser, hasModuleAccess } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSite, setSelectedSite] = useState(null);
  const [showOnboardAssetDialog, setShowOnboardAssetDialog] = useState(false);
  const [showNoAccessMessage, setShowNoAccessMessage] = useState(false);
  
  // Global Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // PWA Install state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  
  // Region-first navigation state
  const [viewMode, setViewMode] = useState('regions'); // 'regions', 'admin'
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [regionsSummary, setRegionsSummary] = useState(null);
  const [regionsLoading, setRegionsLoading] = useState(true);
  const [adminStats, setAdminStats] = useState({ users: 0, templates: 0, reports: 0 });
  const [showNoSitesForCompany, setShowNoSitesForCompany] = useState(false);
  
  // Keyboard shortcut for search (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // PWA Install prompt handling
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };
  
  // Store selected site in localStorage for cross-page filtering
  useEffect(() => {
    if (selectedSite) {
      localStorage.setItem('selectedSiteId', selectedSite.site_id);
    }
  }, [selectedSite]);

  // Fetch admin stats when in admin mode
  useEffect(() => {
    const fetchAdminStats = async () => {
      if (viewMode === 'admin' && (isMaster() || isAdmin())) {
        try {
          // Fetch counts from various endpoints
          const [usersRes, templatesRes, reportsRes] = await Promise.all([
            fetch('/api/users').then(r => r.json()).catch(() => []),
            fetch('/api/test-templates').then(r => r.json()).catch(() => []),
            fetch('/api/reports').then(r => r.json()).catch(() => ({ reports: [] }))
          ]);
          
          setAdminStats({
            users: Array.isArray(usersRes) ? usersRes.length : 0,
            templates: Array.isArray(templatesRes) ? templatesRes.length : 0,
            reports: Array.isArray(reportsRes?.reports) ? reportsRes.reports.length : (Array.isArray(reportsRes) ? reportsRes.length : 0)
          });
        } catch (err) {
          console.error('Failed to fetch admin stats:', err);
        }
      }
    };
    
    fetchAdminStats();
  }, [viewMode, isMaster, isAdmin]);

  // Fetch regions summary
  useEffect(() => {
    const fetchRegionsSummary = async () => {
      setRegionsLoading(true);
      try {
        const companyId = !isMaster() && currentUser?.company_id ? currentUser.company_id : null;
        const data = await sitesAPI.getRegionsSummary(companyId);
        setRegionsSummary(data);
      } catch (err) {
        console.error('Failed to load regions summary:', err);
      } finally {
        setRegionsLoading(false);
      }
    };
    
    if (currentUser) {
      fetchRegionsSummary();
    }
  }, [currentUser, isMaster]);

  // Fetch sites and company stats from API - filter by company for non-master users
  const { data: allSites, loading: sitesLoading, error: sitesError } = useAPIData(
    () => {
      const filters = {};
      // Non-master users should only see their company's sites
      if (!isMaster() && currentUser?.company_id) {
        filters.company_id = currentUser.company_id;
      }
      return sitesAPI.getAll(filters);
    },
    [currentUser?.company_id]
  );

  // Filter sites based on user's site_access
  const sites = useMemo(() => {
    if (!currentUser || !allSites) return [];
    
    let filteredSites = allSites;
    let companySites = allSites; // Sites belonging to the user's company
    
    // Master users see all sites
    if (!isMaster()) {
      // Get all sites for the user's company first
      companySites = allSites.filter(site => site.company_id === currentUser.company_id);
      
      // If site_access is empty, show all sites in their company (admin with full access)
      if (!currentUser.site_access || currentUser.site_access.length === 0) {
        filteredSites = companySites;
      } else {
        // Filter by specific site access
        filteredSites = allSites.filter(site => 
          currentUser.site_access.includes(site.site_id)
        );
      }
      
      // Determine which message to show
      if (companySites.length === 0) {
        // No sites exist for the company at all - show "create first site" message
        setShowNoAccessMessage(false);
        setShowNoSitesForCompany(true);
      } else if (filteredSites.length === 0) {
        // Sites exist but user has no access - show "no access" message
        setShowNoAccessMessage(true);
        setShowNoSitesForCompany(false);
      } else {
        // User has access to sites
        setShowNoAccessMessage(false);
        setShowNoSitesForCompany(false);
      }
    } else {
      // Master user
      setShowNoAccessMessage(false);
      setShowNoSitesForCompany(allSites.length === 0);
    }
    
    // Filter by selected region if in region view
    if (selectedRegion) {
      const regionKey = selectedRegion.region?.toLowerCase() || 'main';
      filteredSites = filteredSites.filter(site => {
        const siteRegion = (site.region || 'main').toLowerCase();
        return siteRegion === regionKey || 
               (regionKey === 'main' && (!site.region || site.region === ''));
      });
    }
    
    return filteredSites;
  }, [allSites, currentUser, isMaster, selectedRegion]);
  
  // Initialize selected site from localStorage or first available site
  useEffect(() => {
    if (sites.length > 0 && !selectedSite) {
      const savedSiteId = localStorage.getItem('selectedSiteId');
      const siteToSelect = savedSiteId 
        ? sites.find(s => s.site_id === savedSiteId) || sites[0]
        : sites[0];
      setSelectedSite(siteToSelect);
    }
  }, [sites, selectedSite]);
  
  const { data: companyStats, loading: statsLoading, error: statsError } = useAPIData(
    () => {
      // Non-master users should only see their company's stats
      const companyId = !isMaster() && currentUser?.company_id ? currentUser.company_id : null;
      return sitesAPI.getCompanyStats(companyId);
    },
    [currentUser?.company_id]
  );

  // Show loading state
  if (sitesLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingSpinner size="lg" text="Loading site data..." />
      </div>
    );
  }

  // Show error state
  if (sitesError || statsError) {
    return (
      <div className="min-h-screen bg-background">
        <ErrorMessage error={sitesError || statsError} retry={() => window.location.reload()} />
      </div>
    );
  }

  // Filter sites based on search
  const filteredSites = (sites || []).filter(site => {
    const matchesSearch = site.site_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         site.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-[hsl(var(--status-healthy))] text-white';
      case 'warning': return 'bg-[hsl(var(--status-warning))] text-white';
      case 'critical': return 'bg-[hsl(var(--status-critical))] text-white';
      default: return 'bg-muted';
    }
  };

  const handleSiteClick = (siteId) => {
    // Navigate to Asset Dashboard with site context
    navigate(`/dashboard/${siteId}`);
  };

  const handleContactClick = (type, value) => {
    if (type === 'phone') {
      window.location.href = `tel:${value}`;
    } else if (type === 'email') {
      window.location.href = `mailto:${value}`;
    }
  };

  // Handle region selection from dropdown
  const handleRegionSelect = (region) => {
    if (region === 'all') {
      setSelectedRegion(null);
    } else {
      const selected = regionsSummary?.regions?.find(r => r.region === region);
      if (selected) {
        setSelectedRegion(selected);
      }
    }
    // Scroll to top for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle site selection from dropdown
  const handleSiteSelect = (siteId) => {
    if (siteId) {
      navigate(`/dashboard?site=${siteId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <AppHeader onLogout={onLogout} />
      
      {/* Custom Breadcrumb with Dropdowns */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <nav className="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
              {/* Home */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/')}
              >
                <span>Home</span>
              </Button>
              
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              
              {/* Region Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 gap-2 font-medium bg-background"
                  >
                    <Globe className="w-4 h-4" />
                    {selectedRegion ? selectedRegion.region_name : 'All Sites'}
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Select Region</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleRegionSelect('all')}
                    className={!selectedRegion ? 'bg-accent' : ''}
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    All Sites
                    <Badge variant="outline" className="ml-auto">{regionsSummary?.total_sites || 0}</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {regionsSummary?.regions?.map((region) => (
                    <DropdownMenuItem 
                      key={region.region}
                      onClick={() => handleRegionSelect(region.region)}
                      className={selectedRegion?.region === region.region ? 'bg-accent' : ''}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{region.region_name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {region.site_count}
                        </Badge>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Site Dropdown - Always shown for quick site selection */}
              <>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 gap-2 font-medium bg-background"
                    >
                      <Building2 className="w-4 h-4" />
                      Select Site
                      <ChevronDown className="w-3 h-3 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-72 max-h-80 overflow-y-auto">
                    <DropdownMenuLabel>{selectedRegion ? `Sites in ${selectedRegion.region_name}` : 'All Sites'}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {(selectedRegion ? filteredSites : sites)?.length > 0 ? (
                      (selectedRegion ? filteredSites : sites).map((site) => (
                        <DropdownMenuItem 
                          key={site.site_id}
                          onClick={() => handleSiteSelect(site.site_id)}
                          className="py-2"
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                site.status === 'critical' ? 'bg-red-500' :
                                site.status === 'warning' ? 'bg-amber-500' :
                                'bg-green-500'
                              }`} />
                              <div>
                                <p className="font-medium text-sm">{site.site_name}</p>
                                <p className="text-xs text-muted-foreground">{site.location || 'No location'}</p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {site.total_assets || 0} assets
                            </Badge>
                          </div>
                        </DropdownMenuItem>
                      ))
                    ) : (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      No sites available
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          </nav>
          
          {/* Right side: Search and Offline buttons */}
          <div className="flex items-center gap-2">
            {/* Global Search Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSearchOpen(true)}
              className="gap-2 text-muted-foreground hover:text-foreground"
              title="Search (Ctrl+K)"
            >
              <Search className="w-4 h-4" />
              <span className="hidden lg:inline text-xs">Search...</span>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-muted rounded border">
                <Command className="w-2.5 h-2.5" />K
              </kbd>
            </Button>

            {/* Go Offline Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!isInstalled && deferredPrompt) {
                  handleInstallClick();
                } else {
                  navigate('/offline-testing');
                }
              }}
              className="gap-1 text-orange-600 border-orange-300 hover:bg-orange-50"
              title={isInstalled ? "Offline Testing Mode" : "Install App for Offline Testing"}
            >
              <WifiOff className="w-4 h-4" />
              {!isInstalled && <Download className="w-3 h-3" />}
              <span className="hidden lg:inline">{isInstalled ? "Offline Mode" : "Go Offline"}</span>
            </Button>
          </div>
        </div>
        </div>
      </div>

      {/* No Site Access Message - Only show when sites exist but user has no access */}
      {showNoAccessMessage && !showNoSitesForCompany && (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="max-w-2xl mx-auto text-center p-12">
            <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
              <MapPin className="w-10 h-10 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold mb-3">No Site Access Assigned</h2>
            <p className="text-muted-foreground mb-6">
              You currently don't have access to any sites. Please contact your administrator to get site access assigned to your account.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="font-medium mb-2">Need Help?</p>
              <p className="text-muted-foreground">
                Contact your company admin at{' '}
                <a href="mailto:admin@company.com" className="text-primary hover:underline">
                  admin@company.com
                </a>
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Main Content - Always show dashboard, even when no sites */}
      {!showNoAccessMessage && (
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header with View Toggle */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            {selectedRegion ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setSelectedRegion(null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="p-0 h-auto text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Regions
                  </Button>
                </div>
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Globe className="w-6 h-6 text-primary" />
                  {selectedRegion.region_name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selectedRegion.site_count} site(s) • {selectedRegion.total_assets} assets
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  {viewMode === 'admin' ? 'Administration' : 'Sites Overview'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {viewMode === 'regions' 
                    ? `${regionsSummary?.total_regions || 0} regions • ${regionsSummary?.total_sites || 0} sites`
                    : viewMode === 'admin'
                    ? 'Manage sites, users, and system configuration'
                    : `${sites.length} sites across all regions`
                  }
                </p>
              </>
            )}
          </div>
          
          {/* View Toggle */}
          {!selectedRegion && (
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
              <Button
                variant={viewMode === 'regions' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('regions')}
                className="gap-2"
              >
                <Grid3X3 className="w-4 h-4" />
                Regions
              </Button>
              {(isMaster() || isAdmin()) && (
                <Button
                  variant={viewMode === 'admin' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('admin')}
                  className="gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Administration
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Module Cards - Always shown on main landing page (not in admin view or when region selected) */}
        {viewMode === 'regions' && !selectedRegion && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Asset Performance Module */}
            <Card 
              className="group cursor-pointer overflow-hidden border-2 border-blue-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-white"
              onClick={() => navigate('/dashboard')}
              data-testid="module-card-asset-performance"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-blue-900 group-hover:text-blue-700 transition-colors">
                      Asset Performance
                    </h3>
                    <p className="text-sm text-blue-700/80 mt-1">
                      Health monitoring, analytics & reports
                    </p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-blue-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
                <div className="mt-4 pt-4 border-t border-blue-200 flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <Activity className="w-4 h-4" />
                    <span>{companyStats?.totalAssets || 0} Assets</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <CheckCircle className="w-4 h-4" />
                    <span>{companyStats?.avgHealthScore || 0}% Avg Health</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Production Testing Module */}
            {hasModuleAccess('production_testing') && (
              <Card 
                className="group cursor-pointer overflow-hidden border-2 border-cyan-200 hover:border-cyan-400 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-cyan-50 to-white"
                onClick={() => navigate('/production')}
                data-testid="module-card-production"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Factory className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-cyan-900 group-hover:text-cyan-700 transition-colors">
                        Production Testing
                      </h3>
                      <p className="text-sm text-cyan-700/80 mt-1">
                        Batches, quality control & certificates
                      </p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-cyan-400 group-hover:text-cyan-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="mt-4 pt-4 border-t border-cyan-200 flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-cyan-700">
                      <Package className="w-4 h-4" />
                      <span>Batch Management</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-cyan-700">
                      <FileCheck className="w-4 h-4" />
                      <span>Certificates</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Online Monitoring Module */}
            {hasModuleAccess('online_monitoring') && (
              <Card 
                className="group cursor-pointer overflow-hidden border-2 border-emerald-200 hover:border-emerald-400 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-emerald-50 to-white"
                onClick={() => navigate('/monitoring')}
                data-testid="module-card-monitoring"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Activity className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-emerald-900 group-hover:text-emerald-700 transition-colors">
                        Online Monitoring
                      </h3>
                      <p className="text-sm text-emerald-700/80 mt-1">
                        Real-time PD monitoring & alarms
                      </p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-emerald-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="mt-4 pt-4 border-t border-emerald-200 flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-emerald-700">
                      <Cpu className="w-4 h-4" />
                      <span>Substations</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-emerald-700">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Live Alarms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Region Cards View */}
        {viewMode === 'regions' && !selectedRegion && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Browse by Region
            </h3>
            {regionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner text="Loading regions..." />
              </div>
            ) : showNoSitesForCompany ? (
              /* No Sites For Company - Show create site card */
              <Card className="border-2 border-dashed border-blue-300 bg-blue-50/30">
                <CardContent className="p-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Building2 className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Sites Yet</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Your organization doesn't have any sites configured. Create your first site to start managing assets and equipment.
                  </p>
                  {(isAdmin() || isMaster()) && (
                    <Button 
                      onClick={() => navigate('/site-management')}
                      className="gap-2"
                      size="lg"
                    >
                      <Plus className="w-5 h-5" />
                      Create Your First Site
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : regionsSummary?.regions?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {regionsSummary.regions.map((region) => (
                  <Card 
                    key={region.region}
                    className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 group"
                    onClick={() => {
                      setSelectedRegion(region);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Globe className="w-6 h-6 text-primary" />
                        </div>
                        <Badge 
                          className={
                            region.overall_status === 'critical' ? 'bg-red-500' :
                            region.overall_status === 'warning' ? 'bg-amber-500' :
                            'bg-green-500'
                          }
                        >
                          {region.overall_status}
                        </Badge>
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                        {region.region_name}
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                        <div className="bg-muted/50 rounded-lg p-2 text-center">
                          <p className="text-muted-foreground text-xs">Sites</p>
                          <p className="font-bold text-lg">{region.site_count}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2 text-center">
                          <p className="text-muted-foreground text-xs">Assets</p>
                          <p className="font-bold text-lg">{region.total_assets}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 pt-3 border-t">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            {region.healthy_sites}
                          </span>
                          {region.warning_sites > 0 && (
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-500" />
                              {region.warning_sites}
                            </span>
                          )}
                          {region.critical_sites > 0 && (
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-red-500" />
                              {region.critical_sites}
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Globe className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="font-semibold mb-2">No Regions Found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sites are not grouped by region yet. Use the Module Sync feature to set up regions.
                  </p>
                  {(isMaster() || isAdmin()) && (
                    <Button variant="outline" onClick={() => setViewMode('admin')}>
                      Go to Administration
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Administration View (Admin only) */}
        {viewMode === 'admin' && !selectedRegion && (isMaster() || isAdmin()) && (
          <div className="space-y-6">
            {/* Admin Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-blue-200">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Sites</p>
                      <p className="text-3xl font-bold">{regionsSummary?.total_sites || 0}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-green-200">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                      <p className="text-3xl font-bold">{adminStats?.users || 0}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-purple-200">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Test Templates</p>
                      <p className="text-3xl font-bold">{adminStats?.templates || 0}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                      <ClipboardList className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-amber-200">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Reports</p>
                      <p className="text-3xl font-bold">{adminStats?.reports || 0}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Site Management */}
              <Card className="border-blue-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/site-management')}>
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Site Management</h4>
                      <p className="text-xs text-muted-foreground">Add, edit, configure sites</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* User Management */}
              <Card className="border-green-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/users')}>
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">User Management</h4>
                      <p className="text-xs text-muted-foreground">Manage users & access</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Test Templates */}
              <Card className="border-purple-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/test-templates')}>
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <ClipboardList className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Test Templates</h4>
                      <p className="text-xs text-muted-foreground">Configure test SOPs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Admin Tools */}
              <Card className="border-slate-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/admin-tools')}>
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Admin Tools</h4>
                      <p className="text-xs text-muted-foreground">Sync, diagnostics & tools</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Module Configuration */}
            {isMaster() && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Module Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant="outline" className="justify-start gap-2 h-auto py-3" onClick={() => navigate('/company-management')}>
                      <Building2 className="w-4 h-4" />
                      <div className="text-left">
                        <p className="font-medium">Company Management</p>
                        <p className="text-xs text-muted-foreground">Manage tenants & licenses</p>
                      </div>
                    </Button>
                    <Button variant="outline" className="justify-start gap-2 h-auto py-3" onClick={() => navigate('/asset-types')}>
                      <Database className="w-4 h-4" />
                      <div className="text-left">
                        <p className="font-medium">Asset Types</p>
                        <p className="text-xs text-muted-foreground">Configure asset categories</p>
                      </div>
                    </Button>
                    <Button variant="outline" className="justify-start gap-2 h-auto py-3" onClick={() => navigate('/admin/dashboard-templates')}>
                      <LayoutTemplate className="w-4 h-4" />
                      <div className="text-left">
                        <p className="font-medium">Dashboard Templates</p>
                        <p className="text-xs text-muted-foreground">Customize layouts</p>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Sites List (shown when a region is selected) */}
        {selectedRegion && (
          <>
          {/* Sites Grid for the selected region */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Sites in {selectedRegion.region_name}</h3>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search sites..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            
            {filteredSites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSites.map((site) => (
                  <Card 
                    key={site.site_id}
                    className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 group"
                    onClick={() => navigate(`/dashboard?site=${site.site_id}`)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <Badge 
                          className={
                            site.status === 'critical' ? 'bg-red-500' :
                            site.status === 'warning' ? 'bg-amber-500' :
                            'bg-green-500'
                          }
                        >
                          {site.status || 'healthy'}
                        </Badge>
                      </div>
                      
                      <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                        {site.site_name}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {site.location || 'No location'}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-muted/50 rounded-lg p-2 text-center">
                          <p className="text-muted-foreground text-xs">Assets</p>
                          <p className="font-bold">{site.total_assets || site.asset_count || 0}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2 text-center">
                          <p className="text-muted-foreground text-xs">Health</p>
                          <p className="font-bold">{site.health_score || 85}%</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end mt-3 pt-2 border-t">
                        <span className="text-xs text-muted-foreground group-hover:text-primary flex items-center gap-1">
                          View Dashboard <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="font-semibold mb-2">No Sites Found</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? 'No sites match your search.' : 'No sites in this region.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
          </>
        )}

        {/* Organized Quick Actions - Only shown in admin view */}
        {viewMode === 'admin' && (isMaster() || isAdmin() || hasPermission('edit_templates')) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            
            {/* Reports Section */}
            <Card className="border-blue-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-white">
                  <FileText className="w-4 h-4" />
                  Reports
                </h3>
              </div>
              <CardContent className="pt-3 pb-3 bg-gradient-to-b from-blue-50/50 to-white">
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/reports')}
                    className="w-full justify-start h-8 text-xs hover:bg-blue-100"
                  >
                    <Clock className="w-3.5 h-3.5 mr-2 text-blue-600" />
                    Recent Reports
                  </Button>
                  {hasPermission('approve_reports') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/report-approval')}
                      className="w-full justify-start h-8 text-xs hover:bg-blue-100"
                    >
                      <FileCheck className="w-3.5 h-3.5 mr-2 text-orange-600" />
                      Report Approvals
                    </Button>
                  )}
                  {hasPermission('edit_templates') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/report-templates')}
                      className="w-full justify-start h-8 text-xs hover:bg-blue-100"
                    >
                      <LayoutTemplate className="w-3.5 h-3.5 mr-2 text-purple-600" />
                      Report Templates
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/combined-reports')}
                    className="w-full justify-start h-8 text-xs hover:bg-blue-100"
                  >
                    <FileStack className="w-3.5 h-3.5 mr-2 text-indigo-600" />
                    Combined Reports
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Assets Section */}
            <Card className="border-emerald-200 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2.5">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-white">
                  <Cpu className="w-4 h-4" />
                  Assets
                </h3>
              </div>
              <CardContent className="pt-3 pb-3 bg-gradient-to-b from-emerald-50/50 to-white">
                <div className="space-y-1">
                  {(isAdmin() || isMaster()) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowOnboardAssetDialog(true)}
                      className="w-full justify-start h-8 text-xs hover:bg-emerald-100"
                    >
                      <Plus className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                      Add New Asset
                    </Button>
                  )}
                  {isMaster() && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/asset-types')}
                        className="w-full justify-start h-8 text-xs hover:bg-emerald-100"
                      >
                        <Package className="w-3.5 h-3.5 mr-2 text-teal-600" />
                        Asset Types
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/parameter-management')}
                        className="w-full justify-start h-8 text-xs hover:bg-emerald-100"
                      >
                        <Database className="w-3.5 h-3.5 mr-2 text-cyan-600" />
                        Parameter Library
                      </Button>
                    </>
                  )}
                  {(isAdmin() || isMaster()) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/order-management')}
                      className="w-full justify-start h-8 text-xs hover:bg-emerald-100"
                    >
                      <ClipboardList className="w-3.5 h-3.5 mr-2 text-amber-600" />
                      Sales Orders
                    </Button>
                  )}
                  
                  {/* Cross-Module Links - Show to admins, greyed if missing modules */}
                  {(isAdmin() || isMaster()) && (
                    <div className="relative group">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (hasModuleAccess('asset_management') && hasModuleAccess('online_monitoring')) {
                            navigate('/admin/module-links');
                          } else {
                            toast.info(
                              'Cross-Module Linking requires both Asset Management and Online Monitoring modules. Contact your administrator to enable these features.',
                              { duration: 5000 }
                            );
                          }
                        }}
                        className={`w-full justify-start h-8 text-xs ${
                          hasModuleAccess('asset_management') && hasModuleAccess('online_monitoring')
                            ? 'hover:bg-purple-100'
                            : 'opacity-50 cursor-not-allowed'
                        }`}
                      >
                        {hasModuleAccess('asset_management') && hasModuleAccess('online_monitoring') ? (
                          <Link2 className="w-3.5 h-3.5 mr-2 text-purple-600" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 mr-2 text-gray-400" />
                        )}
                        <span className={hasModuleAccess('asset_management') && hasModuleAccess('online_monitoring') ? '' : 'text-gray-400'}>
                          Cross-Module Links
                        </span>
                        {!(hasModuleAccess('asset_management') && hasModuleAccess('online_monitoring')) && (
                          <Badge variant="outline" className="ml-auto text-[8px] py-0 px-1 text-gray-400 border-gray-300">
                            PRO
                          </Badge>
                        )}
                      </Button>
                      {/* Tooltip on hover for locked state */}
                      {!(hasModuleAccess('asset_management') && hasModuleAccess('online_monitoring')) && (
                        <div className="absolute left-full top-0 ml-2 hidden group-hover:block z-50">
                          <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg max-w-[200px] whitespace-normal">
                            <p className="font-semibold mb-1">Unlock Cross-Module Linking</p>
                            <p className="text-gray-300">Connect monitoring equipment to asset performance for unified management.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sites & Users Section */}
            <Card className="border-orange-200 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-white">
                  <Building2 className="w-4 h-4" />
                  Sites & Users
                </h3>
              </div>
              <CardContent className="pt-3 pb-3 bg-gradient-to-b from-orange-50/50 to-white">
                <div className="space-y-1">
                  {(isAdmin() || isMaster()) && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/site-management')}
                        className="w-full justify-start h-8 text-xs hover:bg-orange-100"
                      >
                        <MapPin className="w-3.5 h-3.5 mr-2 text-orange-600" />
                        Site Management
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/users')}
                        className="w-full justify-start h-8 text-xs hover:bg-orange-100"
                      >
                        <Users className="w-3.5 h-3.5 mr-2 text-rose-600" />
                        User Management
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/company-branding')}
                        className="w-full justify-start h-8 text-xs hover:bg-orange-100"
                      >
                        <Palette className="w-3.5 h-3.5 mr-2 text-pink-600" />
                        Company Branding
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/audit-trail')}
                        className="w-full justify-start h-8 text-xs hover:bg-orange-100"
                      >
                        <Shield className="w-3.5 h-3.5 mr-2 text-violet-600" />
                        Audit Trail
                      </Button>
                    </>
                  )}
                  {isMaster() && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/companies')}
                      className="w-full justify-start h-8 text-xs hover:bg-orange-100"
                    >
                      <Crown className="w-3.5 h-3.5 mr-2 text-purple-600" />
                      Manage Companies
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tests Section */}
            <Card className="border-purple-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-violet-500 px-4 py-2.5">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-white">
                  <FlaskConical className="w-4 h-4" />
                  Tests
                </h3>
              </div>
              <CardContent className="pt-3 pb-3 bg-gradient-to-b from-purple-50/50 to-white">
                <div className="space-y-1">
                  {(isAdmin() || isMaster()) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/test-templates')}
                      className="w-full justify-start h-8 text-xs hover:bg-purple-100"
                    >
                      <ListChecks className="w-3.5 h-3.5 mr-2 text-purple-600" />
                      Test Templates
                    </Button>
                  )}
                  {(isAdmin() || isMaster()) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/company-customization')}
                      className="w-full justify-start h-8 text-xs hover:bg-purple-100"
                    >
                      <Wrench className="w-3.5 h-3.5 mr-2 text-indigo-600" />
                      Customize Tests
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/reports')}
                    className="w-full justify-start h-8 text-xs hover:bg-purple-100"
                  >
                    <BarChart3 className="w-3.5 h-3.5 mr-2 text-blue-600" />
                    Test Results
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/reports')}
                    className="w-full justify-start h-8 text-xs hover:bg-purple-100"
                  >
                    <History className="w-3.5 h-3.5 mr-2 text-gray-600" />
                    Test History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Site Blocks Overview - Only shown when region is selected (site-level detail) */}
        {selectedRegion && (
        <Card className="mb-6 border-border/50 shadow-md">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by site name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        )}
        
        {/* Site Overview Card - Only shown in regions view, not admin view */}
        {viewMode !== 'admin' && (
        <Card className="mb-8 border-border/50 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-primary" />
              Site Overview
            </CardTitle>
            <CardDescription>Click on any site block to view details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Site Blocks */}
              <div className="space-y-3">
                {sites.map(site => (
                  <button
                    key={site.site_id}
                    onClick={() => setSelectedSite(site)}
                    className={`w-full text-left transition-all ${
                      selectedSite?.site_id === site.site_id
                        ? 'ring-2 ring-primary shadow-lg scale-105'
                        : 'hover:shadow-md hover:scale-102'
                    }`}
                  >
                    <Card className={`border-border/50 ${
                      selectedSite?.site_id === site.site_id ? 'border-primary bg-primary/5' : ''
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-bold text-foreground">{site.site_name}</h3>
                          <Badge className={getStatusColor(site.status)}>
                            {site.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground mb-3">
                          <MapPin className="w-3 h-3 mr-1" />
                          {site.location}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-muted/30 rounded-lg p-2">
                            <p className="text-xs text-muted-foreground mb-1">Assets</p>
                            <p className="text-xl font-bold">{site.total_assets}</p>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-2">
                            <p className="text-xs text-muted-foreground mb-1">Health</p>
                            <p className="text-xl font-bold">{site.health_score}/100</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>

              {/* Right Column - Site Details */}
              <div className="bg-muted/20 rounded-lg border border-border/30 p-6">
                {selectedSite ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-foreground mb-1">{selectedSite.site_name}</h3>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 mr-1" />
                          {selectedSite.location}
                        </div>
                      </div>
                      <Badge className={getStatusColor(selectedSite.status)}>
                        {selectedSite.status.toUpperCase()}
                      </Badge>
                    </div>

                    {/* Asset Statistics */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-card rounded-lg border border-border/50">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Total Assets</p>
                        <p className="text-3xl font-bold">{selectedSite.total_assets}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Health Score</p>
                        <p className="text-3xl font-bold">{selectedSite.health_score}/100</p>
                      </div>
                    </div>

                    {/* Asset Breakdown */}
                    <div className="bg-card rounded-lg border border-border/50 p-4">
                      <p className="text-sm font-semibold mb-3">Asset Distribution</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Transformers:</span>
                          <span className="font-semibold">{selectedSite.asset_breakdown?.transformer || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Switchgear:</span>
                          <span className="font-semibold">{selectedSite.asset_breakdown?.switchgear || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Motors:</span>
                          <span className="font-semibold">{selectedSite.asset_breakdown?.motors || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Generators:</span>
                          <span className="font-semibold">{selectedSite.asset_breakdown?.generators || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cables:</span>
                          <span className="font-semibold">{selectedSite.asset_breakdown?.cables || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">UPS:</span>
                          <span className="font-semibold">{selectedSite.asset_breakdown?.ups || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Alerts */}
                    <div className="bg-card rounded-lg border border-border/50 p-4">
                      <p className="text-sm font-semibold mb-3">Active Alerts</p>
                      <div className="flex gap-3 flex-wrap">
                        {selectedSite.critical_alerts > 0 && (
                          <div className="flex items-center gap-2 bg-[hsl(var(--status-critical))]/10 px-3 py-2 rounded-lg border border-[hsl(var(--status-critical))]/30">
                            <AlertTriangle className="w-4 h-4 text-[hsl(var(--status-critical))]" />
                            <span className="text-sm font-semibold">{selectedSite.critical_alerts} Critical</span>
                          </div>
                        )}
                        {selectedSite.warning_alerts > 0 && (
                          <div className="flex items-center gap-2 bg-[hsl(var(--status-warning))]/10 px-3 py-2 rounded-lg border border-[hsl(var(--status-warning))]/30">
                            <AlertTriangle className="w-4 h-4 text-[hsl(var(--status-warning))]" />
                            <span className="text-sm font-semibold">{selectedSite.warning_alerts} Warning</span>
                          </div>
                        )}
                        {(selectedSite.critical_alerts === 0 || !selectedSite.critical_alerts) && (selectedSite.warning_alerts === 0 || !selectedSite.warning_alerts) && (
                          <div className="flex items-center gap-2 bg-[hsl(var(--status-healthy))]/10 px-3 py-2 rounded-lg border border-[hsl(var(--status-healthy))]/30">
                            <CheckCircle2 className="w-4 h-4 text-[hsl(var(--status-healthy))]" />
                            <span className="text-sm font-semibold">No Active Alerts</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Site Incharge */}
                    <div className="bg-primary/5 rounded-lg border border-primary/20 p-4">
                      <div className="flex items-center mb-3">
                        <User className="w-4 h-4 mr-2 text-primary" />
                        <p className="text-sm font-semibold">Site Incharge</p>
                      </div>
                      {selectedSite.site_incharge ? (
                        <>
                          <p className="font-semibold mb-1">{selectedSite.site_incharge.name}</p>
                          <p className="text-sm text-muted-foreground mb-3">{selectedSite.site_incharge.designation}</p>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleContactClick('phone', selectedSite.site_incharge.phone);
                              }}
                            >
                              <Phone className="w-3 h-3 mr-1" />
                              Call
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleContactClick('email', selectedSite.site_incharge.email);
                              }}
                            >
                              <Mail className="w-3 h-3 mr-1" />
                              Email
                            </Button>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">No incharge assigned</p>
                      )}
                    </div>

                    {/* View Assets Button */}
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                        onClick={() => handleSiteClick(selectedSite.site_id)}
                      >
                        <Building2 className="w-4 h-4 mr-2" />
                        View Dashboard
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/sites/${selectedSite.site_id}/sld`)}
                        title="View Single Line Diagram"
                      >
                        <Layers className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-center">
                    <div>
                      <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                      <p className="text-lg font-semibold text-muted-foreground mb-2">Select a Site</p>
                      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        Click on any site block to view detailed information
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Site Cards - Only shown in regions view */}
        {viewMode !== 'admin' && (
        <>
        <div className="mb-4">
          <h3 className="text-2xl font-bold text-foreground mb-4">
            All Sites
            <span className="text-muted-foreground text-base ml-2">({filteredSites.length})</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSites.map(site => (
            <Card key={site.site_id} className="border-border/50 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{site.site_name}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {site.location}
                    </div>
                  </div>
                  <Badge className={getStatusColor(site.status)}>
                    {site.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Asset Statistics */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Assets</p>
                    <p className="text-2xl font-bold">{site.total_assets}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Health Score</p>
                    <p className="text-2xl font-bold">{site.health_score}/100</p>
                  </div>
                </div>

                {/* Alerts */}
                <div className="flex gap-2">
                  {site.critical_alerts > 0 && (
                    <Badge variant="outline" className="border-[hsl(var(--status-critical))] text-[hsl(var(--status-critical))]">
                      {site.critical_alerts} Critical
                    </Badge>
                  )}
                  {site.warning_alerts > 0 && (
                    <Badge variant="outline" className="border-[hsl(var(--status-warning))] text-[hsl(var(--status-warning))]">
                      {site.warning_alerts} Warning
                    </Badge>
                  )}
                  {(site.critical_alerts === 0 || !site.critical_alerts) && (site.warning_alerts === 0 || !site.warning_alerts) && (
                    <Badge variant="outline" className="border-[hsl(var(--status-healthy))] text-[hsl(var(--status-healthy))]">
                      No Alerts
                    </Badge>
                  )}
                </div>

                {/* Site Incharge */}
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center mb-2">
                    <User className="w-4 h-4 mr-2 text-primary" />
                    <p className="text-sm font-semibold">Site Incharge</p>
                  </div>
                  {site.site_incharge ? (
                    <>
                      <p className="text-sm font-medium">{site.site_incharge.name}</p>
                      <p className="text-xs text-muted-foreground mb-2">{site.site_incharge.designation}</p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContactClick('phone', site.site_incharge.phone);
                          }}
                        >
                          <Phone className="w-3 h-3 mr-1" />
                          Call
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContactClick('email', site.site_incharge.email);
                          }}
                        >
                          <Mail className="w-3 h-3 mr-1" />
                          Email
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">No incharge assigned</p>
                  )}
                </div>

                {/* View Assets Button */}
                <Button
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                  onClick={() => handleSiteClick(site.site_id)}
                >
                  View Assets
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSites.length === 0 && (viewMode === 'all' || selectedRegion) && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No sites found matching your criteria</p>
          </div>
        )}
        </>
        )}
      </main>
      )}

      {/* Onboard Asset Dialog */}
      {!showNoAccessMessage && (
        <OnboardAssetDialog
          isOpen={showOnboardAssetDialog}
          onClose={() => setShowOnboardAssetDialog(false)}
          onSuccess={() => {
            // Optionally refresh data or show success message
            toast.success('Asset onboarded successfully!');
          }}
        />
      )}
      
      {/* Global Search Dialog */}
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};
