import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Home, ChevronRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { sitesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const assetTypeOptions = [
  { id: 'transformer', label: 'Transformer' },
  { id: 'switchgear', label: 'Switch Gear' },
  { id: 'motors', label: 'Motors' },
  { id: 'generators', label: 'Generators' },
  { id: 'cables', label: 'Cables' },
  { id: 'ups', label: 'UPS' }
];

const assetActionOptions = [
  { id: 'analytics', label: '📊 View Analytics', path: '/analytics' },
  { id: 'test', label: '🔬 Conduct Test', path: '/test' },
  { id: 'reports', label: '📄 View Reports', path: '/reports' },
  { id: 'alerts', label: '🚨 View Alerts', path: '/alerts' },
  { id: 'maintenance', label: '🔧 Schedule Maintenance', path: '/maintenance' }
];

export const PageNavigation = ({ 
  currentSiteId = null,
  breadcrumbs = [],
  showSiteSelector = false,
  showAssetTypeSelector = false,
  currentAssetType = null,
  showAssetActionsSelector = false,
  currentAssetId = null,
  onSiteChange = null  // Optional callback for custom site change handling
}) => {
  const navigate = useNavigate();
  const { currentUser, isMaster } = useAuth();
  const [sites, setSites] = useState([]);
  const [loadingSites, setLoadingSites] = useState(false);

  // Load sites from API based on user access
  useEffect(() => {
    const loadSites = async () => {
      if (!showSiteSelector || !currentUser) return;
      
      setLoadingSites(true);
      try {
        // Master users see all sites, others see only their company's sites
        const filters = isMaster() ? {} : { company_id: currentUser.company_id };
        const fetchedSites = await sitesAPI.getAll(filters);
        
        // Filter by user's site access if they have specific sites assigned
        let accessibleSites = fetchedSites;
        if (currentUser.site_access && currentUser.site_access.length > 0) {
          accessibleSites = fetchedSites.filter(site => 
            currentUser.site_access.includes(site.site_id)
          );
        }
        
        setSites(accessibleSites);
      } catch (error) {
        console.error('Failed to load sites:', error);
        setSites([]);
      } finally {
        setLoadingSites(false);
      }
    };

    loadSites();
  }, [showSiteSelector, currentUser, isMaster]);

  const handleSiteChange = (siteId) => {
    const site = sites.find(s => s.site_id === siteId);
    if (site) {
      // Store selected site in localStorage for cross-page filtering
      localStorage.setItem('selectedSiteId', siteId);
      
      // If a custom handler is provided, use it (e.g., for staying on asset list page)
      if (onSiteChange) {
        onSiteChange(siteId, site);
      } else {
        // Default behavior: navigate to dashboard
        navigate(`/dashboard/${siteId}`);
      }
    }
  };

  const handleAssetTypeChange = (assetType) => {
    navigate(`/assets/${assetType}`);
  };

  const handleAssetActionChange = (actionId) => {
    if (actionId === 'back-to-list') {
      navigate(`/assets/${currentAssetType}`);
      return;
    }
    
    const action = assetActionOptions.find(a => a.id === actionId);
    if (action && currentAssetType && currentAssetId) {
      navigate(`/assets/${currentAssetType}/${currentAssetId}${action.path}`);
    }
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Home Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/sites')}
        className="hover:bg-primary/10 transition-smooth"
        title="Go to Site Overview"
      >
        <Home className="w-4 h-4 mr-1" />
        <span className="hidden sm:inline">Home</span>
      </Button>

      {/* Site Selector */}
      {showSiteSelector && (
        <>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <Select value={currentSiteId || undefined} onValueChange={handleSiteChange}>
            <SelectTrigger className="w-[200px] h-9">
              <SelectValue placeholder={loadingSites ? "Loading..." : "Select site to view"} />
            </SelectTrigger>
            <SelectContent>
              {sites.length > 0 ? (
                sites.map(site => (
                  <SelectItem key={site.site_id} value={site.site_id}>
                    {site.site_name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-sites" disabled>
                  {loadingSites ? "Loading..." : "No sites available"}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </>
      )}

      {/* Asset Type Selector */}
      {showAssetTypeSelector && (
        <>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <Select value={currentAssetType || undefined} onValueChange={handleAssetTypeChange}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Select asset type" />
            </SelectTrigger>
            <SelectContent>
              {assetTypeOptions.map(type => (
                <SelectItem key={type.id} value={type.id}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}

      {/* Asset Actions Selector */}
      {showAssetActionsSelector && currentAssetId && (
        <>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <Select onValueChange={handleAssetActionChange}>
            <SelectTrigger className="w-[200px] h-9">
              <SelectValue placeholder="Quick actions..." />
            </SelectTrigger>
            <SelectContent>
              {assetActionOptions.map(action => (
                <SelectItem key={action.id} value={action.id}>
                  {action.label}
                </SelectItem>
              ))}
              <SelectItem value="back-to-list">
                ⬅️ Back to Asset List
              </SelectItem>
            </SelectContent>
          </Select>
        </>
      )}

      {/* Breadcrumbs */}
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          {crumb.link ? (
            <Button
              variant="link"
              size="sm"
              onClick={() => navigate(crumb.link)}
              className="h-auto p-0 text-sm text-muted-foreground hover:text-foreground transition-smooth"
            >
              {crumb.label}
            </Button>
          ) : (
            <span className="text-sm font-medium text-foreground">
              {crumb.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
