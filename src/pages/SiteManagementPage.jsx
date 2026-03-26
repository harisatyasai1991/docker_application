import React, { useState, useCallback, useEffect } from 'react';
import { AppHeader } from '../components/AppHeader';
import { PageNavigation } from '../components/PageNavigation';
import { LoadingSpinner, ErrorMessage } from '../components/LoadingStates';
import { sitesAPI, companyAPI } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { MapPin, Edit, Trash2, Plus, Building2, Phone, Mail, User, Copy, Globe, Filter, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

export const SiteManagementPage = ({ onLogout }) => {
  const { currentUser } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [formData, setFormData] = useState({
    site_name: '',
    location: '',
    region: '',
    site_incharge: {
      name: '',
      designation: '',
      phone: '',
      email: ''
    }
  });

  // Region management state
  const [regions, setRegions] = useState([]);
  const [isRegionDialogOpen, setIsRegionDialogOpen] = useState(false);
  const [newRegionName, setNewRegionName] = useState('');

  // Company filter state (for master users)
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const isMaster = currentUser?.role === 'master';

  // Fetch sites - filter by company for non-master users
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load companies for filter (master users only)
  useEffect(() => {
    const loadCompanies = async () => {
      if (isMaster) {
        try {
          const data = await companyAPI.getAll();
          setCompanies(data || []);
        } catch (err) {
          console.error('Failed to load companies:', err);
        }
      }
    };
    loadCompanies();
  }, [isMaster]);

  // Load regions from API
  const loadRegions = useCallback(async () => {
    try {
      const companyId = currentUser?.role === 'master' ? null : currentUser?.company_id;
      const data = await sitesAPI.getRegionsSummary(companyId);
      // Extract unique region names
      const regionList = data?.regions?.map(r => r.region_name) || [];
      setRegions([...new Set(regionList)]);
    } catch (err) {
      console.error('Failed to load regions:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadRegions();
    }
  }, [currentUser, loadRegions]);

  const loadSites = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      
      // For master users, use selected company filter
      if (isMaster) {
        if (selectedCompanyFilter && selectedCompanyFilter !== 'all') {
          filters.company_id = selectedCompanyFilter;
        }
      } else {
        // Non-master users only see their company's sites
        filters.company_id = currentUser.company_id;
      }
      
      const data = await sitesAPI.getAll(filters);
      setSites(data);
    } catch (err) {
      setError(err);
      console.error('Failed to load sites:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, isMaster, selectedCompanyFilter]);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  // Filter sites by search term
  const filteredSites = sites.filter(site => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      site.site_name?.toLowerCase().includes(search) ||
      site.location?.toLowerCase().includes(search) ||
      site.region?.toLowerCase().includes(search)
    );
  });

  // Get company name for display
  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.company_id === companyId);
    return company?.company_name || companyId || 'Unassigned';
  };

  const handleCreateClick = () => {
    setFormData({
      site_name: '',
      location: '',
      region: regions.length > 0 ? regions[0] : '',
      site_incharge: {
        name: '',
        designation: '',
        phone: '',
        email: ''
      }
    });
    setIsCreateDialogOpen(true);
  };

  const handleEditClick = (site) => {
    setSelectedSite(site);
    setFormData({
      site_name: site.site_name,
      location: site.location,
      region: site.region || '',
      site_incharge: site.site_incharge || {
        name: '',
        designation: '',
        phone: '',
        email: ''
      }
    });
    setIsEditDialogOpen(true);
  };

  // Handle adding a new region
  const handleAddRegion = () => {
    if (newRegionName.trim()) {
      const regionExists = regions.some(r => r.toLowerCase() === newRegionName.trim().toLowerCase());
      if (!regionExists) {
        setRegions([...regions, newRegionName.trim()]);
        setFormData({ ...formData, region: newRegionName.trim() });
        toast.success(`Region "${newRegionName.trim()}" added`);
      } else {
        toast.error('Region already exists');
      }
      setNewRegionName('');
      setIsRegionDialogOpen(false);
    }
  };

  const handleCreateSite = async () => {
    try {
      if (!currentUser?.company_id) {
        toast.error('Company information not found. Please log in again.');
        return;
      }

      const siteData = {
        ...formData,
        company_id: currentUser.company_id,
        asset_breakdown: {
          transformer: 0,
          switchgear: 0,
          motors: 0,
          generators: 0,
          cables: 0,
          ups: 0
        }
      };

      console.log('Creating site with data:', siteData);
      await sitesAPI.create(siteData);
      toast.success('Site created successfully');
      setIsCreateDialogOpen(false);
      loadSites(); // Reload sites
    } catch (error) {
      console.error('Create site error:', error);
      toast.error(`Failed to create site: ${error.message || 'Unknown error'}`);
    }
  };

  const handleUpdateSite = async () => {
    try {
      await sitesAPI.update(selectedSite.site_id, formData);
      toast.success('Site updated successfully');
      setIsEditDialogOpen(false);
      loadSites(); // Reload sites
    } catch (error) {
      toast.error(`Failed to update site: ${error.message}`);
    }
  };

  const handleDeleteSite = async (siteId) => {
    if (!window.confirm('Are you sure you want to delete this site? This action cannot be undone.')) {
      return;
    }

    try {
      await sitesAPI.delete(siteId);
      toast.success('Site deleted successfully');
      loadSites(); // Reload sites
    } catch (error) {
      toast.error(`Failed to delete site: ${error.message}`);
    }
  };

  // Duplicate site
  const handleDuplicateSite = async (site) => {
    try {
      const duplicateSiteData = {
        site_name: `${site.site_name} (Copy)`,
        location: site.location,
        site_incharge: site.site_incharge || {
          name: '',
          designation: '',
          phone: '',
          email: ''
        },
        asset_breakdown: site.asset_breakdown || {
          transformer: 0,
          switchgear: 0,
          motors: 0,
          generators: 0,
          cables: 0,
          ups: 0
        },
        company_id: site.company_id,
      };

      await sitesAPI.create(duplicateSiteData);
      toast.success(`Site duplicated as "${duplicateSiteData.site_name}"`);
      loadSites();
    } catch (error) {
      toast.error(`Failed to duplicate site: ${error.message}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <AppHeader onLogout={onLogout} />
        <LoadingSpinner size="lg" text="Loading sites..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <AppHeader onLogout={onLogout} />
        <ErrorMessage error={error} retry={refetch} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader onLogout={onLogout} />
      
      <div className="border-b border-border/50 bg-card/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <PageNavigation 
            breadcrumbs={[
              { label: 'Company Overview', link: '/' },
              { label: 'Site Management', link: null }
            ]}
          />
        </div>
      </div>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Site Management</h2>
            <p className="text-lg text-muted-foreground">Manage your company's sites and locations</p>
          </div>
          <Button onClick={handleCreateClick} className="gap-2">
            <Plus className="w-4 h-4" />
            Create New Site
          </Button>
        </div>

        {/* Filters Section */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Company Filter (Master users only) */}
              {isMaster && (
                <div className="flex-1 max-w-xs">
                  <Label className="text-sm text-muted-foreground mb-1 block">
                    <Filter className="w-3 h-3 inline mr-1" />
                    Filter by Organization
                  </Label>
                  <Select value={selectedCompanyFilter} onValueChange={setSelectedCompanyFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Organizations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          All Organizations ({sites.length} sites)
                        </div>
                      </SelectItem>
                      {companies.map((company) => (
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
              )}
              
              {/* Search */}
              <div className="flex-1">
                <Label className="text-sm text-muted-foreground mb-1 block">
                  <Search className="w-3 h-3 inline mr-1" />
                  Search Sites
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, location, or region..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            
            {/* Results summary */}
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <span>Showing {filteredSites.length} of {sites.length} sites</span>
              {selectedCompanyFilter !== 'all' && isMaster && (
                <Badge variant="secondary" className="gap-1">
                  <Building2 className="w-3 h-3" />
                  {getCompanyName(selectedCompanyFilter)}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSites?.map((site) => (
            <Card key={site.site_id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base mb-1">{site.site_name}</CardTitle>
                      <Badge className={getStatusColor(site.status)}>
                        {site.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicateSite(site)}
                      title="Duplicate Site"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(site)}
                      title="Edit Site"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSite(site.site_id)}
                      className="text-red-600 hover:text-red-700"
                      title="Delete Site"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{site.location}</span>
                </div>
                {site.region && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-primary" />
                    <span className="font-medium">{site.region}</span>
                  </div>
                )}
                {/* Show company for master users */}
                {isMaster && site.company_id && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-blue-500" />
                    <span className="text-blue-600 font-medium">{getCompanyName(site.company_id)}</span>
                  </div>
                )}
                <div className="text-sm">
                  <span className="font-medium">Total Assets:</span> {site.total_assets}
                </div>
                <div className="pt-3 border-t">
                  <div className="text-xs font-medium text-muted-foreground mb-2">Site Incharge</div>
                  <div className="space-y-1 text-xs">
                    {site.site_incharge ? (
                      <>
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3" />
                          <span>{site.site_incharge.name} ({site.site_incharge.designation})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          <span>{site.site_incharge.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          <span>{site.site_incharge.email}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400">
                        <User className="w-3 h-3" />
                        <span>No site incharge assigned</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSites.length === 0 && sites.length > 0 && (
          <Card className="p-12 text-center">
            <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Sites Found</h3>
            <p className="text-muted-foreground">No sites match your search criteria. Try adjusting your filters.</p>
          </Card>
        )}

        {sites.length === 0 && (
          <Card className="p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Sites Yet</h3>
            <p className="text-muted-foreground mb-4">Create your first site to get started</p>
            <Button onClick={handleCreateClick} className="gap-2">
              <Plus className="w-4 h-4" />
              Create New Site
            </Button>
          </Card>
        )}
      </main>

      {/* Create Site Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Site</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="site_name">Site Name *</Label>
                <Input
                  id="site_name"
                  value={formData.site_name}
                  onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                  placeholder="e.g., Main Manufacturing Plant"
                />
              </div>
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Mumbai, India"
                />
              </div>
            </div>
            
            {/* Region Selection */}
            <div>
              <Label htmlFor="region">Region *</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.region}
                  onValueChange={(value) => setFormData({ ...formData, region: value })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          {region}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRegionDialogOpen(true)}
                  title="Add New Region"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Group sites by geographic region for easier navigation
              </p>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Site Incharge Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="incharge_name">Name *</Label>
                  <Input
                    id="incharge_name"
                    value={formData.site_incharge.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      site_incharge: { ...formData.site_incharge, name: e.target.value }
                    })}
                    placeholder="Site Manager Name"
                  />
                </div>
                <div>
                  <Label htmlFor="incharge_designation">Designation *</Label>
                  <Input
                    id="incharge_designation"
                    value={formData.site_incharge.designation}
                    onChange={(e) => setFormData({
                      ...formData,
                      site_incharge: { ...formData.site_incharge, designation: e.target.value }
                    })}
                    placeholder="e.g., Site Manager"
                  />
                </div>
                <div>
                  <Label htmlFor="incharge_phone">Phone *</Label>
                  <Input
                    id="incharge_phone"
                    value={formData.site_incharge.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      site_incharge: { ...formData.site_incharge, phone: e.target.value }
                    })}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <Label htmlFor="incharge_email">Email *</Label>
                  <Input
                    id="incharge_email"
                    type="email"
                    value={formData.site_incharge.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      site_incharge: { ...formData.site_incharge, email: e.target.value }
                    })}
                    placeholder="manager@example.com"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSite}>
              Create Site
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Site Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Site</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_site_name">Site Name *</Label>
                <Input
                  id="edit_site_name"
                  value={formData.site_name}
                  onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_location">Location *</Label>
                <Input
                  id="edit_location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>
            
            {/* Region Selection */}
            <div>
              <Label htmlFor="edit_region">Region *</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.region}
                  onValueChange={(value) => setFormData({ ...formData, region: value })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          {region}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRegionDialogOpen(true)}
                  title="Add New Region"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Site Incharge Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_incharge_name">Name *</Label>
                  <Input
                    id="edit_incharge_name"
                    value={formData.site_incharge.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      site_incharge: { ...formData.site_incharge, name: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_incharge_designation">Designation *</Label>
                  <Input
                    id="edit_incharge_designation"
                    value={formData.site_incharge.designation}
                    onChange={(e) => setFormData({
                      ...formData,
                      site_incharge: { ...formData.site_incharge, designation: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_incharge_phone">Phone *</Label>
                  <Input
                    id="edit_incharge_phone"
                    value={formData.site_incharge.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      site_incharge: { ...formData.site_incharge, phone: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_incharge_email">Email *</Label>
                  <Input
                    id="edit_incharge_email"
                    type="email"
                    value={formData.site_incharge.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      site_incharge: { ...formData.site_incharge, email: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSite}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Region Dialog */}
      <Dialog open={isRegionDialogOpen} onOpenChange={setIsRegionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Region</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="new_region_name">Region Name *</Label>
              <Input
                id="new_region_name"
                value={newRegionName}
                onChange={(e) => setNewRegionName(e.target.value)}
                placeholder="e.g., North Region, Western Zone"
                onKeyDown={(e) => e.key === 'Enter' && handleAddRegion()}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter a name for the new region. Sites can then be assigned to this region.
              </p>
            </div>
            {regions.length > 0 && (
              <div>
                <Label className="text-muted-foreground">Existing Regions:</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {regions.map((region) => (
                    <Badge key={region} variant="secondary">
                      <Globe className="w-3 h-3 mr-1" />
                      {region}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setNewRegionName('');
              setIsRegionDialogOpen(false);
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddRegion} disabled={!newRegionName.trim()}>
              Add Region
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
