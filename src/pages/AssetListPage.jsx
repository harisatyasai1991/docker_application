import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { AppHeader } from '../components/AppHeader';
import { ModuleTabs } from '../components/ModuleTabs';
import { LoadingSpinner, ErrorMessage } from '../components/LoadingStates';
import { useAPIData } from '../hooks/useAPI';
import { assetsAPI, assetTypeAPI, testsAPI, sitesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Search,
  ArrowUpDown,
  Eye,
  Filter,
  Plus,
  PackagePlus,
  MapPin,
  Globe,
  Building2,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

export const AssetListPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const { assetType } = useParams();
  const [searchParams] = useSearchParams();
  const { currentUser, isMaster } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [healthFilter, setHealthFilter] = useState('all');
  const [sortField, setSortField] = useState('health_score');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Get selected site - prioritize URL query param, then fallback to localStorage
  const [selectedSiteId, setSelectedSiteId] = useState(() => {
    // First check URL query parameter (passed from DashboardPage)
    const urlSiteId = searchParams.get('site_id');
    if (urlSiteId) {
      // Update localStorage to keep it in sync
      localStorage.setItem('selectedSiteId', urlSiteId);
      return urlSiteId;
    }
    // Fallback to localStorage
    return localStorage.getItem('selectedSiteId');
  });
  
  // Update selectedSiteId when URL query param changes
  useEffect(() => {
    const urlSiteId = searchParams.get('site_id');
    if (urlSiteId && urlSiteId !== selectedSiteId) {
      setSelectedSiteId(urlSiteId);
      localStorage.setItem('selectedSiteId', urlSiteId);
    }
  }, [searchParams]);
  
  // Fetch site details for displaying site name
  const { data: selectedSite } = useAPIData(
    () => selectedSiteId ? sitesAPI.getById(selectedSiteId) : Promise.resolve(null),
    [selectedSiteId]
  );
  
  // Region/Site breadcrumb state
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [regionsSummary, setRegionsSummary] = useState(null);
  const [regionsLoading, setRegionsLoading] = useState(true);
  const [sitesInRegion, setSitesInRegion] = useState([]);

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

  // Set selected region based on current site
  useEffect(() => {
    if (selectedSite && regionsSummary?.regions) {
      const siteRegion = (selectedSite.region || 'main').toLowerCase();
      const matchingRegion = regionsSummary.regions.find(r => 
        r.region.toLowerCase() === siteRegion
      );
      if (matchingRegion) {
        setSelectedRegion(matchingRegion);
      }
    }
  }, [selectedSite, regionsSummary]);

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

  // Handle site selection from breadcrumb dropdown
  const handleBreadcrumbSiteSelect = (newSiteId) => {
    if (newSiteId) {
      setSelectedSiteId(newSiteId);
      localStorage.setItem('selectedSiteId', newSiteId);
      navigate(`/assets/${assetType}?site_id=${newSiteId}`);
    }
  };
  
  // Onboarding dialog state
  const [isOnboardDialogOpen, setIsOnboardDialogOpen] = useState(false);
  const [onboardStep, setOnboardStep] = useState(1); // 1: Asset Type, 2: Details, 3: Tests
  const [assetTypes, setAssetTypes] = useState([]);
  const [availableTests, setAvailableTests] = useState([]);
  const [selectedAssetType, setSelectedAssetType] = useState(null);
  const [selectedTests, setSelectedTests] = useState([]);
  const [onboardFormData, setOnboardFormData] = useState({
    asset_name: '',
    manufacturer: 'Unknown',
    model: 'Unknown',
    serial_number: 'Unknown',
    installation_date: '',
    rated_capacity: '',
    voltage_rating: '',
    location_detail: '',
    nameplate_details: {}
  });

  const assetTypeNames = {
    transformer: 'Transformer',
    switchgear: 'Switch Gear',
    motors: 'Motors',
    generators: 'Generators',
    cables: 'Cables',
    ups: 'UPS'
  };

  // Fetch assets from API with site and company filtering
  const { data: assets, loading, error, refetch } = useAPIData(
    () => {
      const params = { asset_type: assetType };
      
      // Apply site filtering if a site is selected
      if (selectedSiteId) {
        params.site_id = selectedSiteId;
      }
      
      // Non-master users must always filter by their company
      if (!isMaster() && currentUser?.company_id) {
        params.company_id = currentUser.company_id;
      }
      
      return assetsAPI.getAll(params);
    },
    [assetType, selectedSiteId, currentUser?.company_id]
  );

  // Load asset types and tests when dialog opens
  useEffect(() => {
    if (isOnboardDialogOpen && onboardStep === 1) {
      loadAssetTypesForOnboarding();
    }
  }, [isOnboardDialogOpen, onboardStep]);

  const loadAssetTypesForOnboarding = async () => {
    try {
      const types = await assetTypeAPI.getAll();
      setAssetTypes(types);
    } catch (error) {
      console.error('Failed to load asset types:', error);
      toast.error('Failed to load asset types');
    }
  };

  const handleOpenOnboardDialog = () => {
    setIsOnboardDialogOpen(true);
    setOnboardStep(1);
    setSelectedAssetType(null);
    setSelectedTests([]);
    setOnboardFormData({
      asset_name: '',
      manufacturer: 'Unknown',
      model: 'Unknown',
      serial_number: 'Unknown',
      installation_date: '',
      rated_capacity: '',
      voltage_rating: '',
      location_detail: '',
      nameplate_details: {}
    });
  };

  const handleSelectAssetType = async (assetTypeData) => {
    setSelectedAssetType(assetTypeData);
    
    // Initialize nameplate fields
    const nameplateDetails = {};
    if (assetTypeData.nameplate_template) {
      assetTypeData.nameplate_template.forEach(field => {
        nameplateDetails[field.name] = '';
      });
    }
    setOnboardFormData({ ...onboardFormData, nameplate_details: nameplateDetails });
    
    // Load available tests for this asset type WITH COMPANY CUSTOMIZATIONS
    try {
      const tests = await testsAPI.getAll({ 
        asset_type: assetTypeData.name,  // Use exact case as stored in asset type
        company_id: currentUser.company_id  // Include company_id to get customized templates
      });
      setAvailableTests(tests || []);
    } catch (error) {
      // Filter rrweb clone errors
      const errorMessage = error?.message || error?.toString() || '';
      if (errorMessage.includes('clone') && errorMessage.includes('Response')) {
        console.log('Filtered rrweb clone error on load tests');
        setAvailableTests([]);
        return;
      }
      console.error('Failed to load tests:', error);
      setAvailableTests([]);
    }
    
    setOnboardStep(2);
  };

  const handleSubmitAssetDetails = () => {
    if (!onboardFormData.asset_name.trim()) {
      toast.error('Asset name is required');
      return;
    }
    setOnboardStep(3);
  };

  const handleToggleTest = (testId) => {
    setSelectedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const handleSubmitOnboarding = async () => {
    try {
      // Get site_id - use selectedSiteId from localStorage, or get first available site
      let siteId = selectedSiteId;
      
      if (!siteId) {
        // If no site is selected, we need to get one
        // For now, show an error - site selection should be required
        toast.error('Please select a site from the Site Overview page first');
        return;
      }
      
      // Create the asset data
      const assetData = {
        ...onboardFormData,
        asset_type: selectedAssetType.name, // Use proper case (not lowercase)
        site_id: siteId,
        site_ids: [siteId],
        applicable_tests: selectedTests, // Include selected tests
      };
      
      // Only add company_id if user has one (non-master users)
      if (currentUser?.company_id) {
        assetData.company_id = currentUser.company_id;
      }
      
      const createdAsset = await assetsAPI.create(assetData);
      
      toast.success(`Asset "${onboardFormData.asset_name}" onboarded successfully!`);
      
      // Close dialog
      setIsOnboardDialogOpen(false);
      
      // Refresh the asset list
      if (typeof refetch === 'function') {
        refetch();
      } else {
        // Fallback: reload the page
        window.location.reload();
      }
      
      // Navigate to asset detail page
      navigate(`/assets/${selectedAssetType.name.toLowerCase()}/${createdAsset.asset_id}`);
    } catch (error) {
      // Filter rrweb clone errors
      const errorMessage = error?.message || error?.toString() || '';
      if (errorMessage.includes('clone') && errorMessage.includes('Response')) {
        console.log('Filtered rrweb clone error on asset onboarding');
        toast.success(`Asset "${onboardFormData.asset_name}" onboarded successfully!`);
        setIsOnboardDialogOpen(false);
        if (typeof refetch === 'function') {
          refetch();
        }
        return;
      }
      console.error('Failed to onboard asset:', error);
      toast.error(`Failed to onboard asset: ${error?.message || 'Unknown error'}`);
    }
  };

  const getHealthBadge = (score) => {
    if (score >= 80) {
      return (
        <Badge className="bg-[hsl(var(--status-healthy))] text-[hsl(var(--status-healthy-foreground))] border-0">
          Healthy
        </Badge>
      );
    } else if (score >= 60) {
      return (
        <Badge className="bg-[hsl(var(--status-warning))] text-[hsl(var(--status-warning-foreground))] border-0">
          Warning
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-[hsl(var(--status-critical))] text-[hsl(var(--status-critical-foreground))] border-0">
          Critical
        </Badge>
      );
    }
  };

  const getHealthScore = (score) => {
    let color = '';
    if (score >= 80) {
      color = 'text-[hsl(var(--status-healthy))]';
    } else if (score >= 60) {
      color = 'text-[hsl(var(--status-warning))]';
    } else {
      color = 'text-[hsl(var(--status-critical))]';
    }
    return <span className={`font-semibold ${color}`}>{score}</span>;
  };

  const filteredAndSortedAssets = useMemo(() => {
    // Return empty array if assets is null/undefined
    if (!assets) return [];
    
    let filtered = assets.filter(asset => {
      const matchesSearch = 
        asset.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.asset_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesHealth = 
        healthFilter === 'all' ||
        (healthFilter === 'healthy' && asset.health_score >= 80) ||
        (healthFilter === 'warning' && asset.health_score >= 60 && asset.health_score < 80) ||
        (healthFilter === 'critical' && asset.health_score < 60);
      
      return matchesSearch && matchesHealth;
    });

    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === 'last_test_date' || sortField === 'next_test_date') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [assets, searchTerm, healthFilter, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortableHeader = ({ field, children }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 transition-smooth group"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-2">
        <span>{children}</span>
        <ArrowUpDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-smooth" />
      </div>
    </TableHead>
  );

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen">
        <AppHeader onLogout={onLogout} />
        <LoadingSpinner size="lg" text={`Loading ${assetTypeNames[assetType] || 'assets'}...`} />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen">
        <AppHeader onLogout={onLogout} />
        <ErrorMessage error={error} retry={() => window.location.reload()} />
      </div>
    );
  }

  // Handle site change from PageNavigation - stay on asset list page
  const handleSiteChange = (newSiteId) => {
    setSelectedSiteId(newSiteId);
    localStorage.setItem('selectedSiteId', newSiteId);
    // Update URL to reflect the new site
    navigate(`/assets/${assetType}?site_id=${newSiteId}`);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <AppHeader onLogout={onLogout} />
      
      {/* Module Tabs */}
      <ModuleTabs />
      
      {/* Custom Breadcrumb with Region/Site Dropdowns */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1 text-sm flex-wrap" aria-label="Breadcrumb">
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
                  {selectedSite ? selectedSite.site_name : 'Select Site'}
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
                      onClick={() => handleBreadcrumbSiteSelect(s.site_id)}
                      className={`py-2 ${selectedSiteId === s.site_id ? 'bg-accent' : ''}`}
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
            
            {/* Asset Type */}
            <span className="text-sm font-medium text-foreground px-2">
              {assetTypeNames[assetType]}
            </span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Site Context & Page Title */}
        <div className="mb-6">
          {selectedSite && (
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">{selectedSite.site_name}</h2>
              {selectedSite.location && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-lg text-muted-foreground">{selectedSite.location}</span>
                </>
              )}
            </div>
          )}
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground font-medium">{assetTypeNames[assetType]} Assets</p>
            <Button onClick={handleOpenOnboardDialog} size="lg" className="gap-2">
              <PackagePlus className="w-5 h-5" />
              Onboard New Asset
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 border-border/50 shadow-md">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by asset name, ID, or manufacturer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
              </div>
              <div>
                <Select value={healthFilter} onValueChange={setHealthFilter}>
                  <SelectTrigger className="h-11">
                    <div className="flex items-center">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter by health" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assets</SelectItem>
                    <SelectItem value="healthy">Healthy</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="border-border/50 shadow-md">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <SortableHeader field="asset_name">Asset Name</SortableHeader>
                  <SortableHeader field="asset_id">Asset ID</SortableHeader>
                  <SortableHeader field="manufacturer">Manufacturer</SortableHeader>
                  <SortableHeader field="voltage_level">Voltage Level</SortableHeader>
                  <SortableHeader field="last_test_date">Last Test Date</SortableHeader>
                  <SortableHeader field="next_test_date">Next Test Date</SortableHeader>
                  <SortableHeader field="health_score">Health Score</SortableHeader>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedAssets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      No assets found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedAssets.map((asset) => (
                    <TableRow 
                      key={asset.asset_id} 
                      className="hover:bg-muted/50 transition-smooth cursor-pointer"
                      onClick={() => navigate(`/assets/${assetType}/${asset.asset_id}`)}
                    >
                      <TableCell className="font-medium">{asset.asset_name}</TableCell>
                      <TableCell>
                        <span className="font-mono text-sm text-muted-foreground">{asset.asset_id}</span>
                      </TableCell>
                      <TableCell>{asset.manufacturer}</TableCell>
                      <TableCell>{asset.voltage_level}</TableCell>
                      <TableCell>{asset.last_test_date}</TableCell>
                      <TableCell>{asset.next_test_date}</TableCell>
                      <TableCell>{getHealthScore(asset.health_score)}</TableCell>
                      <TableCell>{getHealthBadge(asset.health_score)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/assets/${assetType}/${asset.asset_id}`);
                          }}
                          className="transition-smooth hover:bg-primary hover:text-primary-foreground hover:border-primary"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </main>

      {/* Onboard Asset Dialog */}
      <Dialog open={isOnboardDialogOpen} onOpenChange={setIsOnboardDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Onboard New Asset - Step {onboardStep} of 3</DialogTitle>
            <DialogDescription>
              {onboardStep === 1 && "Select the asset type to begin"}
              {onboardStep === 2 && "Enter asset details and nameplate information"}
              {onboardStep === 3 && "Select applicable tests for this asset"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {/* Step 1: Asset Type Selection */}
            {onboardStep === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Choose the type of asset you want to onboard:</p>
                <div className="grid grid-cols-2 gap-4">
                  {assetTypes.map((type) => (
                    <Card 
                      key={type.asset_type_id}
                      className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
                      onClick={() => handleSelectAssetType(type)}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">{type.name}</CardTitle>
                        <CardDescription>{type.description || 'No description'}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">
                          {type.nameplate_template?.length || 0} nameplate fields configured
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Asset Details */}
            {onboardStep === 2 && selectedAssetType && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="asset_name">Asset Name *</Label>
                      <Input
                        id="asset_name"
                        value={onboardFormData.asset_name}
                        onChange={(e) => setOnboardFormData({ ...onboardFormData, asset_name: e.target.value })}
                        placeholder="e.g., Transformer T1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manufacturer">Manufacturer</Label>
                      <Input
                        id="manufacturer"
                        value={onboardFormData.manufacturer}
                        onChange={(e) => setOnboardFormData({ ...onboardFormData, manufacturer: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model">Model</Label>
                      <Input
                        id="model"
                        value={onboardFormData.model}
                        onChange={(e) => setOnboardFormData({ ...onboardFormData, model: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="serial_number">Serial Number</Label>
                      <Input
                        id="serial_number"
                        value={onboardFormData.serial_number}
                        onChange={(e) => setOnboardFormData({ ...onboardFormData, serial_number: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="installation_date">Installation Date</Label>
                      <Input
                        id="installation_date"
                        type="date"
                        value={onboardFormData.installation_date}
                        onChange={(e) => setOnboardFormData({ ...onboardFormData, installation_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location_detail">Location Detail</Label>
                      <Input
                        id="location_detail"
                        value={onboardFormData.location_detail}
                        onChange={(e) => setOnboardFormData({ ...onboardFormData, location_detail: e.target.value })}
                        placeholder="e.g., Substation A, Bay 3"
                      />
                    </div>
                  </div>
                </div>

                {/* Nameplate Details */}
                {selectedAssetType.nameplate_template && selectedAssetType.nameplate_template.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Nameplate Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedAssetType.nameplate_template.map((field, index) => (
                        <div key={index} className="space-y-2">
                          <Label htmlFor={`nameplate_${field.name}`}>
                            {field.name}
                            <span className="text-xs text-muted-foreground ml-2">
                              (e.g., {field.example} {field.unit})
                            </span>
                          </Label>
                          <Input
                            id={`nameplate_${field.name}`}
                            value={onboardFormData.nameplate_details[field.name] || ''}
                            onChange={(e) => setOnboardFormData({
                              ...onboardFormData,
                              nameplate_details: {
                                ...onboardFormData.nameplate_details,
                                [field.name]: e.target.value
                              }
                            })}
                            placeholder={`${field.example} ${field.unit}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Test Selection */}
            {onboardStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Select Applicable Tests</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose which tests should be available for this asset in the Conduct Test page
                  </p>
                </div>
                
                {availableTests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No tests configured for {selectedAssetType?.name}</p>
                    <p className="text-xs mt-2">Master admin can create test templates in Test Templates page</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableTests.map((test) => (
                      <Card key={test.test_id} className={`p-4 ${test.is_customized ? 'border-blue-500 bg-blue-50/50' : ''}`}>
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedTests.includes(test.test_id)}
                            onCheckedChange={() => handleToggleTest(test.test_id)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{test.name || test.test_name}</h4>
                              {test.is_customized && (
                                <Badge className="bg-blue-600 text-white text-xs">
                                  Customized
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{test.test_code} • {test.description || 'No description'}</p>
                            <div className="mt-2 flex gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {test.parameters?.length || test.test_parameters?.length || 0} parameters
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {test.frequency || test.estimated_duration || 'N/A'}
                              </Badge>
                              {test.is_customized && (
                                <Badge variant="outline" className="text-xs bg-blue-50 border-blue-300 text-blue-700">
                                  Company Template
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              {onboardStep > 1 && (
                <Button variant="outline" onClick={() => setOnboardStep(onboardStep - 1)}>
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsOnboardDialogOpen(false)}>
                Cancel
              </Button>
              {onboardStep < 3 && (
                <Button onClick={onboardStep === 1 ? null : handleSubmitAssetDetails} disabled={onboardStep === 1}>
                  Next
                </Button>
              )}
              {onboardStep === 3 && (
                <Button onClick={handleSubmitOnboarding}>
                  Complete Onboarding
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
