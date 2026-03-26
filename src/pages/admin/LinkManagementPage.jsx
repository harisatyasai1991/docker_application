/**
 * Cross-Module Link Management Page
 * Manage links between Online Monitoring Equipment and Asset Performance Module
 */
import React, { useState, useEffect } from 'react';
import { AppHeader } from '../../components/AppHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  Link2, 
  Unlink,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Cpu,
  Building2,
  ArrowRight,
  ArrowLeftRight,
  Plus,
  Settings2,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Info,
  FileText
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '../../components/ui/alert';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// API helper
const apiCall = async (endpoint, options = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-User-Role': localStorage.getItem('userRole') || 'user',
      'X-Company-Id': localStorage.getItem('companyId') || '',
      'X-User-Name': localStorage.getItem('userName') || 'User',
      ...options.headers
    },
    ...options
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'API Error' }));
    throw new Error(error.detail || 'API Error');
  }
  return response.json();
};

export function LinkManagementPage({ onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [links, setLinks] = useState([]);
  const [unlinkedEquipment, setUnlinkedEquipment] = useState([]);
  const [unlinkedAssets, setUnlinkedAssets] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedLink, setSelectedLink] = useState(null);
  const [syncNames, setSyncNames] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, linksData, unlinkedEq, unlinkedAst, suggestionsData] = await Promise.all([
        apiCall('/api/module-links/stats'),
        apiCall('/api/module-links/linked'),
        apiCall('/api/module-links/equipment/unlinked'),
        apiCall('/api/module-links/assets/unlinked'),
        apiCall('/api/module-links/suggestions')
      ]);
      
      setStats(statsData);
      setLinks(linksData.links || []);
      setUnlinkedEquipment(unlinkedEq.equipment || []);
      setUnlinkedAssets(unlinkedAst.assets || []);
      setSuggestions(suggestionsData.suggestions || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load link data');
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async () => {
    if (!selectedEquipment || !selectedAsset) {
      toast.error('Please select both equipment and asset');
      return;
    }

    try {
      await apiCall('/api/module-links/link', {
        method: 'POST',
        body: JSON.stringify({
          equipment_id: selectedEquipment.equipment_id,
          asset_id: selectedAsset.asset_id,
          sync_names: syncNames
        })
      });
      
      toast.success('Equipment linked to asset successfully');
      setShowLinkDialog(false);
      setSelectedEquipment(null);
      setSelectedAsset(null);
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to create link');
    }
  };

  const handleUnlink = async () => {
    if (!selectedLink) return;

    try {
      await apiCall('/api/module-links/unlink', {
        method: 'POST',
        body: JSON.stringify({
          equipment_id: selectedLink.equipment.equipment_id
        })
      });
      
      toast.success('Link removed successfully');
      setShowUnlinkDialog(false);
      setSelectedLink(null);
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to remove link');
    }
  };

  const handleToggleLinkStatus = async (link, newStatus) => {
    try {
      await apiCall('/api/module-links/link-status', {
        method: 'PUT',
        body: JSON.stringify({
          link_id: link.link_id,
          status: newStatus
        })
      });
      
      toast.success(`Link ${newStatus === 'active' ? 'enabled' : 'disabled'}`);
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to update link status');
    }
  };

  const handleApplySuggestion = (suggestion) => {
    setSelectedEquipment(suggestion.equipment);
    setSelectedAsset(suggestion.asset);
    setShowLinkDialog(true);
  };

  const filteredLinks = links.filter(link => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      link.equipment?.name?.toLowerCase().includes(term) ||
      link.equipment?.code?.toLowerCase().includes(term) ||
      link.asset?.name?.toLowerCase().includes(term)
    );
  });

  const filteredUnlinkedEquipment = unlinkedEquipment.filter(eq => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return eq.name?.toLowerCase().includes(term) || eq.code?.toLowerCase().includes(term);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
      <AppHeader onLogout={onLogout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Link2 className="h-6 w-6 text-purple-500" />
              Cross-Module Linking
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Connect Online Monitoring equipment with Asset Performance Module
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              size="sm"
              onClick={() => setShowLinkDialog(true)}
              className="gap-2 bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4" />
              Create Link
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-600 font-medium">Monitoring Equipment</p>
                    <p className="text-2xl font-bold text-emerald-800">{stats.stats?.equipment?.total || 0}</p>
                  </div>
                  <Cpu className="h-8 w-8 text-emerald-400" />
                </div>
                <div className="mt-2 text-xs text-emerald-600">
                  {stats.stats?.equipment?.linked || 0} linked • {stats.stats?.equipment?.unlinked || 0} unlinked
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">APM Assets</p>
                    <p className="text-2xl font-bold text-blue-800">{stats.stats?.assets?.total || 0}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-blue-400" />
                </div>
                <div className="mt-2 text-xs text-blue-600">
                  {stats.stats?.assets?.linked || 0} linked • {stats.stats?.assets?.unlinked || 0} unlinked
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-100 bg-gradient-to-br from-green-50 to-white">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Active Links</p>
                    <p className="text-2xl font-bold text-green-800">{links.filter(l => l.link_status === 'active').length}</p>
                  </div>
                  <Link2 className="h-8 w-8 text-green-400" />
                </div>
                <div className="mt-2 text-xs text-green-600">
                  Monitoring ↔ Asset Performance
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-100 bg-gradient-to-br from-amber-50 to-white">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-600 font-medium">License Status</p>
                    <p className="text-2xl font-bold text-amber-800">
                      {stats.license?.limit ? `${stats.license.used}/${stats.license.limit}` : 'Unlimited'}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-amber-400" />
                </div>
                <div className="mt-2 text-xs text-amber-600">
                  {stats.license?.allowed ? 'Can add more links' : 'Limit reached'}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search equipment or assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <Link2 className="h-4 w-4" />
              Active Links ({links.length})
            </TabsTrigger>
            <TabsTrigger value="unlinked" className="gap-2">
              <Unlink className="h-4 w-4" />
              Unlinked ({unlinkedEquipment.length})
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Suggestions ({suggestions.length})
            </TabsTrigger>
          </TabsList>

          {/* Active Links Tab */}
          <TabsContent value="overview" className="space-y-4">
            {filteredLinks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Link2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No active links found</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setShowLinkDialog(true)}
                  >
                    Create First Link
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredLinks.map((link) => (
                  <Card key={link.link_id} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6 flex-1">
                          {/* Equipment */}
                          <div className="flex items-center gap-3 min-w-[250px]">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Cpu className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{link.equipment?.name}</p>
                              <p className="text-xs text-gray-500">
                                {link.equipment?.code} • {link.equipment?.type?.replace('_', ' ')}
                              </p>
                            </div>
                          </div>

                          {/* Link Arrow */}
                          <div className="flex flex-col items-center">
                            <ArrowLeftRight className="h-5 w-5 text-purple-400" />
                            <Badge 
                              variant={link.link_status === 'active' ? 'default' : 'secondary'}
                              className={link.link_status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : ''}
                            >
                              {link.link_status || 'active'}
                            </Badge>
                          </div>

                          {/* Asset */}
                          <div className="flex items-center gap-3 min-w-[250px]">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <Building2 className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{link.asset?.name || 'Unknown Asset'}</p>
                              <p className="text-xs text-gray-500">
                                {link.asset?.type} • {link.asset?.status}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleLinkStatus(link, link.link_status === 'active' ? 'disabled' : 'active')}
                            className="gap-1"
                          >
                            {link.link_status === 'active' ? (
                              <>
                                <ToggleRight className="h-4 w-4 text-green-600" />
                                <span className="text-xs">Enabled</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="h-4 w-4 text-gray-400" />
                                <span className="text-xs">Disabled</span>
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedLink(link);
                              setShowUnlinkDialog(true);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Name sync indicator */}
                      {!link.names_synced && (
                        <div className="mt-3 flex items-center gap-2 text-amber-600 text-xs">
                          <AlertTriangle className="h-3 w-3" />
                          Names not synced between modules
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Unlinked Equipment Tab */}
          <TabsContent value="unlinked" className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Unlinked Equipment</AlertTitle>
              <AlertDescription>
                These monitoring equipment items are not connected to any Asset Performance asset. 
                Link them to enable cross-module navigation and unified asset management.
              </AlertDescription>
            </Alert>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUnlinkedEquipment.slice(0, 12).map((eq) => (
                <Card key={eq.equipment_id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Cpu className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{eq.name}</p>
                          <p className="text-xs text-gray-500">{eq.code}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {eq.equipment_type?.replace('_', ' ')} • {eq.substation_name}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedEquipment(eq);
                          setShowLinkDialog(true);
                        }}
                        className="shrink-0"
                      >
                        <Link2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredUnlinkedEquipment.length > 12 && (
              <p className="text-center text-gray-500 text-sm">
                Showing 12 of {filteredUnlinkedEquipment.length} unlinked equipment
              </p>
            )}
          </TabsContent>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions" className="space-y-4">
            <Alert className="bg-purple-50 border-purple-200">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <AlertTitle className="text-purple-800">Smart Suggestions</AlertTitle>
              <AlertDescription className="text-purple-700">
                Based on matching codes and names, these equipment-asset pairs are likely related.
              </AlertDescription>
            </Alert>

            {suggestions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No suggestions available</p>
                  <p className="text-sm text-gray-400 mt-1">All potential matches have been linked</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {suggestions.map((suggestion, idx) => (
                  <Card key={idx} className="hover:shadow-md transition-shadow border-purple-100">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6 flex-1">
                          {/* Equipment */}
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Cpu className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{suggestion.equipment.name}</p>
                              <p className="text-xs text-gray-500">{suggestion.equipment.code}</p>
                            </div>
                          </div>

                          <ArrowRight className="h-5 w-5 text-purple-400" />

                          {/* Asset */}
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <Building2 className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{suggestion.asset.name}</p>
                              <p className="text-xs text-gray-500">{suggestion.asset.code}</p>
                            </div>
                          </div>

                          {/* Match Score */}
                          <div className="flex flex-col items-center">
                            <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                              {suggestion.match_score}% match
                            </Badge>
                            <div className="text-xs text-gray-400 mt-1">
                              {suggestion.match_reasons?.join(', ')}
                            </div>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => handleApplySuggestion(suggestion)}
                          className="bg-purple-600 hover:bg-purple-700 gap-2"
                        >
                          <Link2 className="h-4 w-4" />
                          Link
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-purple-600" />
              Link Equipment to Asset
            </DialogTitle>
            <DialogDescription>
              Connect monitoring equipment to an Asset Performance asset for unified management.
            </DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-6 py-4">
            {/* Equipment Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Monitoring Equipment
              </label>
              {selectedEquipment ? (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      <Cpu className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">{selectedEquipment.name}</p>
                        <p className="text-xs text-gray-500">{selectedEquipment.code}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2 text-xs"
                      onClick={() => setSelectedEquipment(null)}
                    >
                      Change
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Select onValueChange={(value) => {
                  const eq = unlinkedEquipment.find(e => e.equipment_id === value);
                  setSelectedEquipment(eq);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select equipment..." />
                  </SelectTrigger>
                  <SelectContent>
                    {unlinkedEquipment.map((eq) => (
                      <SelectItem key={eq.equipment_id} value={eq.equipment_id}>
                        {eq.name} ({eq.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Asset Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Asset Performance Asset
              </label>
              {selectedAsset ? (
                <Card className="border-purple-200 bg-purple-50">
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-medium">{selectedAsset.asset_name}</p>
                        <p className="text-xs text-gray-500">{selectedAsset.asset_type}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2 text-xs"
                      onClick={() => setSelectedAsset(null)}
                    >
                      Change
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Select onValueChange={(value) => {
                  const asset = unlinkedAssets.find(a => a.asset_id === value);
                  setSelectedAsset(asset);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset..." />
                  </SelectTrigger>
                  <SelectContent>
                    {unlinkedAssets.slice(0, 50).map((asset) => (
                      <SelectItem key={asset.asset_id} value={asset.asset_id}>
                        {asset.asset_name} ({asset.asset_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center gap-2 py-2">
            <input 
              type="checkbox" 
              id="syncNames" 
              checked={syncNames}
              onChange={(e) => setSyncNames(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="syncNames" className="text-sm text-gray-600">
              Sync equipment name to match asset name
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleLink}
              disabled={!selectedEquipment || !selectedAsset}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Link2 className="h-4 w-4 mr-2" />
              Create Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unlink Confirmation Dialog */}
      <Dialog open={showUnlinkDialog} onOpenChange={setShowUnlinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Unlink className="h-5 w-5" />
              Remove Link
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove the link between these items?
            </DialogDescription>
          </DialogHeader>

          {selectedLink && (
            <div className="py-4 space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Cpu className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">{selectedLink.equipment?.name}</span>
                </div>
              </div>
              <div className="text-center">
                <ArrowLeftRight className="h-5 w-5 text-gray-300 mx-auto" />
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">{selectedLink.asset?.name}</span>
                </div>
              </div>
            </div>
          )}

          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-700 text-sm">
              The equipment and asset will remain in their respective modules but will no longer be connected.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnlinkDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleUnlink}>
              Remove Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LinkManagementPage;
