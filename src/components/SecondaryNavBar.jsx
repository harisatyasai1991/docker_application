/**
 * Secondary Navigation Bar
 * Contains PageNavigation on the left and Search/Offline buttons on the right
 * Used across all pages for consistent navigation experience
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { PageNavigation } from './PageNavigation';
import { GlobalSearch } from './GlobalSearch';
import { 
  Search, 
  WifiOff, 
  Download,
  Command
} from 'lucide-react';

export const SecondaryNavBar = ({ 
  // PageNavigation props
  currentSiteId = null,
  breadcrumbs = [],
  showSiteSelector = false,
  showAssetTypeSelector = false,
  currentAssetType = null,
  showAssetActionsSelector = false,
  currentAssetId = null,
  onSiteChange = null,
  // Custom left content (for Production module tabs, etc.)
  leftContent = null,
  // Hide search/offline for specific modules
  hideSearch = false,
  hideOffline = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Check if we're in the Production Testing module (offline not supported)
  const isProductionModule = location.pathname.startsWith('/production');

  // PWA installation
  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Keyboard shortcut for search
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

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <>
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2">
            {/* Left side: Navigation */}
            <div className="flex items-center gap-1 overflow-x-auto flex-1">
              {leftContent ? (
                leftContent
              ) : (
                <PageNavigation
                  currentSiteId={currentSiteId}
                  breadcrumbs={breadcrumbs}
                  showSiteSelector={showSiteSelector}
                  showAssetTypeSelector={showAssetTypeSelector}
                  currentAssetType={currentAssetType}
                  showAssetActionsSelector={showAssetActionsSelector}
                  currentAssetId={currentAssetId}
                  onSiteChange={onSiteChange}
                />
              )}
            </div>

            {/* Right side: Search & Offline */}
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              {/* Universal Search */}
              {!hideSearch && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSearchOpen(true)}
                  className="gap-2 text-muted-foreground hover:text-foreground border-border"
                  data-testid="nav-search-btn"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden md:inline text-sm">Search</span>
                  <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <Command className="h-3 w-3" />K
                  </kbd>
                </Button>
              )}

              {/* Go Offline - Hidden in Production Module */}
              {!hideOffline && !isProductionModule && (
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
                  data-testid="nav-offline-btn"
                >
                  <WifiOff className="w-4 h-4" />
                  {!isInstalled && <Download className="w-3 h-3" />}
                  <span className="hidden lg:inline">{isInstalled ? "Offline Mode" : "Go Offline"}</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Global Search Dialog */}
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

export default SecondaryNavBar;
