import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { AppHeader } from '../components/AppHeader';
import { ModuleTabs } from '../components/ModuleTabs';
import { LoadingSpinner, ErrorMessage } from '../components/LoadingStates';
import { SLDViewer } from '../components/SLDViewer';
import { useAPIData } from '../hooks/useAPI';
import { sitesAPI, assetsAPI, usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  Activity, 
  Zap, 
  Settings, 
  Battery, 
  Cable, 
  BatteryCharging,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  CircuitBoard,
  ToggleRight,
  Fan,
  Factory,
  Unplug,
  Server,
  Globe,
  Building2,
  ChevronRight,
  ChevronDown,
  MapPin,
  Layers,
  LayoutDashboard
} from 'lucide-react';

const assetTypes = [
  {
    id: 'transformer',
    name: 'Transformer',
    icon: 'custom',
    customIconPath: '/images/transformer-icon.png',
    count: 45,
    healthy: 38,
    warning: 5,
    critical: 2,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary'
  },
  {
    id: 'switchgear',
    name: 'Switch Gear',
    icon: 'custom',
    customIconPath: '/images/switchgear-icon.png',
    count: 32,
    healthy: 28,
    warning: 3,
    critical: 1,
    iconBg: 'bg-secondary/10',
    iconColor: 'text-secondary'
  },
  {
    id: 'motors',
    name: 'Motors',
    icon: 'custom',
    customIconPath: '/images/motor-icon.png',
    count: 78,
    healthy: 65,
    warning: 10,
    critical: 3,
    iconBg: 'bg-accent/10',
    iconColor: 'text-accent'
  },
  {
    id: 'generators',
    name: 'Generators',
    icon: 'custom',
    customIconPath: '/images/generator-icon.png',
    count: 28,
    healthy: 24,
    warning: 3,
    critical: 1,
    iconBg: 'bg-[hsl(142_76%_36%)]/10',
    iconColor: 'text-[hsl(142_76%_36%)]'
  },
  {
    id: 'cables',
    name: 'Cables',
    icon: 'custom',
    customIconPath: '/images/cable-icon.png',
    count: 124,
    healthy: 110,
    warning: 12,
    critical: 2,
    iconBg: 'bg-[hsl(25_95%_53%)]/10',
    iconColor: 'text-[hsl(25_95%_53%)]'
  },
  {
    id: 'ups',
    name: 'UPS',
    icon: 'custom',
    customIconPath: '/images/ups-icon.png',
    count: 18,
    healthy: 16,
    warning: 1,
    critical: 1,
    iconBg: 'bg-[hsl(280_100%_70%)]/10',
    iconColor: 'text-[hsl(280_100%_70%)]'
  },
];

export const DashboardPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const { siteId } = useParams();
  const [searchParams] = useSearchParams();
  const siteIdFromQuery = searchParams.get('site');
  const effectiveSiteId = siteId || siteIdFromQuery;
  const { currentUser, isMaster } = useAuth();
  
  // Region/Site dropdown state
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [regionsSummary, setRegionsSummary] = useState(null);
  const [regionsLoading, setRegionsLoading] = useState(true);
  const [sitesInRegion, setSitesInRegion] = useState([]);
  
  // Dashboard tab state (overview or sld)
  const [activeTab, setActiveTab] = useState('overview');
  const [tabPreferenceLoaded, setTabPreferenceLoaded] = useState(false);

  // Get the user's company_id for filtering
  const userCompanyId = currentUser?.company_id;

  // Load user's tab preference on mount
  useEffect(() => {
    const loadTabPreference = async () => {
      if (currentUser?.user_id) {
        try {
          const prefs = await usersAPI.getPreferences(currentUser.user_id);
          if (prefs?.dashboard_tab) {
            setActiveTab(prefs.dashboard_tab);
          }
        } catch (error) {
          console.log('No saved tab preference, using default');
        }
      }
      setTabPreferenceLoaded(true);
    };
    loadTabPreference();
  }, [currentUser?.user_id]);

  // Save tab preference when it changes
  const handleTabChange = async (newTab) => {
    setActiveTab(newTab);
    if (currentUser?.user_id) {
      try {
        await usersAPI.updatePreferences(currentUser.user_id, {
          dashboard_tab: newTab,
          company_id: currentUser.company_id
        });
      } catch (error) {
        console.error('Failed to save tab preference:', error);
      }
    }
  };

  // Store siteId in localStorage when it changes (for cross-page filtering)
  useEffect(() => {
    if (effectiveSiteId) {
      localStorage.setItem('selectedSiteId', effectiveSiteId);
    }
  }, [effectiveSiteId]);

  // Fetch regions summary for dropdown
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

  // Fetch site data
  const { data: site, loading: siteLoading, error: siteError } = useAPIData(
    () => effectiveSiteId ? sitesAPI.getById(effectiveSiteId) : Promise.resolve(null),
    [effectiveSiteId]
  );

  // Set selected region based on current site
  useEffect(() => {
    if (site && regionsSummary?.regions) {
      const siteRegion = (site.region || 'main').toLowerCase();
      const matchingRegion = regionsSummary.regions.find(r => 
        r.region.toLowerCase() === siteRegion
      );
      if (matchingRegion) {
        setSelectedRegion(matchingRegion);
      }
    }
  }, [site, regionsSummary]);

  // Fetch sites in selected region for dropdown (or all sites if no region selected)
  useEffect(() => {
    const fetchSitesInRegion = async () => {
      try {
        const filters = {};
        if (!isMaster() && currentUser?.company_id) {
          filters.company_id = currentUser.company_id;
        }
        const allSites = await sitesAPI.getAll(filters);
        
        // If no region selected, show all sites
        if (!selectedRegion) {
          setSitesInRegion(allSites);
          return;
        }
        
        // Otherwise filter by region
        const regionKey = selectedRegion.region?.toLowerCase() || 'main';
        const filtered = allSites.filter(s => {
          const siteRegion = (s.region || 'main').toLowerCase();
          return siteRegion === regionKey || 
                 (regionKey === 'main' && (!s.region || s.region === ''));
        });
        setSitesInRegion(filtered);
      } catch (err) {
        console.error('Failed to fetch sites in region:', err);
      }
    };
    fetchSitesInRegion();
  }, [selectedRegion, currentUser, isMaster]);

  // Handle region selection from dropdown
  const handleRegionSelect = (regionKey) => {
    if (regionKey === 'all') {
      setSelectedRegion(null);
      // Don't navigate away - just clear the region filter
    } else {
      const selected = regionsSummary?.regions?.find(r => r.region === regionKey);
      if (selected) {
        setSelectedRegion(selected);
      }
    }
  };

  // Handle site selection from dropdown
  const handleSiteSelect = (newSiteId) => {
    if (newSiteId) {
      navigate(`/dashboard/${newSiteId}`);
    }
  };

  // Fetch assets for this site - ALWAYS filter by company for non-master users
  const { data: assets, loading: assetsLoading, error: assetsError } = useAPIData(
    () => {
      const filters = {};
      if (effectiveSiteId) {
        filters.site_id = effectiveSiteId;
      }
      // Non-master users must always filter by their company
      if (!isMaster() && userCompanyId) {
        filters.company_id = userCompanyId;
      }
      return assetsAPI.getAll(filters);
    },
    [effectiveSiteId, userCompanyId, isMaster]
  );

  // Show loading state
  if (siteLoading || assetsLoading) {
    return (
      <div className="min-h-screen">
        <AppHeader onLogout={onLogout} />
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  // Show error state
  if (siteError || assetsError) {
    return (
      <div className="min-h-screen">
        <AppHeader onLogout={onLogout} />
        <ErrorMessage error={siteError || assetsError} retry={() => window.location.reload()} />
      </div>
    );
  }

  // Calculate asset statistics from real data
  const assetsByType = {};
  (assets || []).forEach(asset => {
    // Normalize asset type to lowercase for consistent matching
    const type = (asset.asset_type || '').toLowerCase();
    if (!assetsByType[type]) {
      assetsByType[type] = { total: 0, healthy: 0, warning: 0, critical: 0 };
    }
    assetsByType[type].total++;
    
    // Categorize by health score
    if (asset.health_score >= 85) assetsByType[type].healthy++;
    else if (asset.health_score >= 70) assetsByType[type].warning++;
    else assetsByType[type].critical++;
  });

  // Update assetTypes with real counts
  const updatedAssetTypes = assetTypes.map(type => ({
    ...type,
    count: assetsByType[type.id]?.total || 0,
    healthy: assetsByType[type.id]?.healthy || 0,
    warning: assetsByType[type.id]?.warning || 0,
    critical: assetsByType[type.id]?.critical || 0
  }));

  const totalAssets = updatedAssetTypes.reduce((sum, type) => sum + type.count, 0);
  const totalHealthy = updatedAssetTypes.reduce((sum, type) => sum + type.healthy, 0);
  const totalWarning = updatedAssetTypes.reduce((sum, type) => sum + type.warning, 0);
  const totalCritical = updatedAssetTypes.reduce((sum, type) => sum + type.critical, 0);
  const healthPercentage = totalAssets > 0 ? Math.round((totalHealthy / totalAssets) * 100) : 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <AppHeader onLogout={onLogout} />
      
      {/* Module Tabs - Quick switching between APM and Online Monitoring */}
      <ModuleTabs />

      {/* Custom Breadcrumb with Region/Site Dropdowns */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
            {/* Home */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
              onClick={() => navigate('/sites')}
            >
              <span>Home</span>
            </Button>
            
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            
            {/* Region Dropdown - Show as "All Sites" when no regions */}
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
            
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            
            {/* Site Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 gap-2 font-medium bg-background"
                >
                  <Building2 className="w-4 h-4" />
                  {site ? site.site_name : 'Select Site'}
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72 max-h-80 overflow-y-auto">
                <DropdownMenuLabel>
                  {selectedRegion ? `Sites in ${selectedRegion.region_name}` : 'All Sites'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {sitesInRegion.length > 0 ? (
                  sitesInRegion.map((s) => (
                    <DropdownMenuItem 
                      key={s.site_id}
                      onClick={() => handleSiteSelect(s.site_id)}
                      className={`py-2 ${effectiveSiteId === s.site_id ? 'bg-accent' : ''}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            s.status === 'critical' ? 'bg-red-500' :
                            s.status === 'warning' ? 'bg-amber-500' :
                            'bg-green-500'
                          }`} />
                          <div>
                            <p className="font-medium text-sm">{s.site_name}</p>
                            <p className="text-xs text-muted-foreground">{s.location || 'No location'}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {s.total_assets || 0} assets
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
            
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            
            {/* Current Page */}
            <span className="text-sm font-medium text-foreground px-2">
              Asset Dashboard
            </span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {site ? site.site_name : 'Asset Dashboard'}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground">
              {site ? site.location : 'Monitor and manage all assets'}
            </p>
          </div>
        </div>

        {/* Tabs for Overview and SLD */}
        {effectiveSiteId && tabPreferenceLoaded ? (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="overview" className="gap-2" data-testid="tab-overview">
                <LayoutDashboard className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="sld" className="gap-2" data-testid="tab-sld">
                <Layers className="w-4 h-4" />
                Single Line Diagram
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab Content */}
            <TabsContent value="overview">
              {/* Asset Overview Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {updatedAssetTypes.map((type) => (
                  <Card 
                    key={type.id}
                    className="cursor-pointer transition-smooth hover:shadow-lg hover:scale-[1.02] border-border/50"
                    onClick={() => navigate(`/assets/${type.id}${siteId ? `?site_id=${siteId}` : ''}`)}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-lg ${type.iconBg} ${type.iconColor} flex items-center justify-center`}>
                            {type.icon === 'custom' && type.customIconPath ? (
                              <img 
                                src={type.customIconPath} 
                                alt={type.name}
                                className="w-8 h-8 object-contain"
                              />
                            ) : (
                              <Settings className="w-6 h-6" />
                            )}
                          </div>
                          <div>
                            <CardTitle className="text-base">{type.name}</CardTitle>
                            <CardDescription className="text-2xl font-bold text-foreground">
                              {type.count}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[hsl(var(--status-healthy))]" />
                          <span className="text-sm">{type.healthy}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-[hsl(var(--status-warning))]" />
                          <span className="text-sm">{type.warning}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-[hsl(var(--status-critical))]" />
                          <span className="text-sm">{type.critical}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Total Assets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-foreground">{totalAssets}</p>
                  </CardContent>
                </Card>
                
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Healthy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[hsl(var(--status-healthy))]" />
                      <p className="text-3xl font-bold text-foreground">{totalHealthy}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Warning</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-[hsl(var(--status-warning))]" />
                      <p className="text-3xl font-bold text-foreground">{totalWarning}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Critical</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-[hsl(var(--status-critical))]" />
                      <p className="text-3xl font-bold text-foreground">{totalCritical}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* SLD Tab Content */}
            <TabsContent value="sld">
              <SLDViewer siteId={effectiveSiteId} site={site} embedded={true} />
            </TabsContent>
          </Tabs>
        ) : (
          /* No site selected - show asset overview without tabs */
          <>
            {/* Asset Overview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {updatedAssetTypes.map((type) => (
                <Card 
                  key={type.id}
                  className="cursor-pointer transition-smooth hover:shadow-lg hover:scale-[1.02] border-border/50"
                  onClick={() => navigate(`/assets/${type.id}${siteId ? `?site_id=${siteId}` : ''}`)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg ${type.iconBg} ${type.iconColor} flex items-center justify-center`}>
                          {type.icon === 'custom' && type.customIconPath ? (
                            <img 
                              src={type.customIconPath} 
                              alt={type.name}
                              className="w-8 h-8 object-contain"
                            />
                          ) : (
                            <Settings className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-base">{type.name}</CardTitle>
                          <CardDescription className="text-2xl font-bold text-foreground">
                            {type.count}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[hsl(var(--status-healthy))]" />
                        <span className="text-sm">{type.healthy}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-[hsl(var(--status-warning))]" />
                        <span className="text-sm">{type.warning}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[hsl(var(--status-critical))]" />
                        <span className="text-sm">{type.critical}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Total Assets</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">{totalAssets}</p>
                </CardContent>
              </Card>
              
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Healthy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[hsl(var(--status-healthy))]" />
                    <p className="text-3xl font-bold text-foreground">{totalHealthy}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Warning</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-[hsl(var(--status-warning))]" />
                    <p className="text-3xl font-bold text-foreground">{totalWarning}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Critical</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[hsl(var(--status-critical))]" />
                    <p className="text-3xl font-bold text-foreground">{totalCritical}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
