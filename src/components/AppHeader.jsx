import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { DMSLogo } from './DMSLogo';
import { NotificationBell } from './NotificationBell';
import { GlobalSearch } from './GlobalSearch';
import { VersionBadge } from './VersionBadge';
import BrandedLogo from './BrandedLogo';
import {
  Activity,
  LogOut,
  User,
  FileText,
  Users,
  Crown,
  Settings,
  ChevronDown,
  Palette,
  Building2,
  Wrench,
  Factory,
  Download,
  WifiOff,
  Search,
  Command,
  Info,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { useBranding } from '../contexts/BrandingContext';

export const AppHeader = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission, isMaster, isAdmin, currentUser, hasModuleAccess } = useAuth();
  const { branding, userCompanyInfo } = useBranding();
  
  // Check if we're in the Production Testing module (offline not supported)
  const isProductionModule = location.pathname.startsWith('/production');
  
  // Global Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // PWA Install state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  
  // PWA Install dialog state (for showing instructions)
  const [showInstallDialog, setShowInstallDialog] = useState(false);

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
    } else {
      setShowInstallDialog(true);
    }
  };

  return (
    <>
    <header 
      className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50"
      style={{
        backgroundColor: branding.header_bg_color || 'var(--card)',
        color: branding.header_text_color || 'inherit',
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Mobile Layout */}
        <div className="flex md:hidden flex-col gap-3">
          <div className="flex items-center justify-between">
            {/* Custom Partner Header for Mobile */}
            {branding.header_bg_color ? (
              <div className="flex items-center gap-2">
                <BrandedLogo 
                  variant={branding.logo_white_url ? 'white' : 'default'}
                  alt={branding.company_name} 
                  className="h-8 w-auto object-contain"
                />
                {branding.header_title && (
                  <div className="leading-tight">
                    <p className="text-sm font-bold" style={{ color: branding.header_text_color || '#fff' }}>
                      {branding.header_title}
                    </p>
                    {branding.header_subtitle && (
                      <p className="text-[8px] opacity-75" style={{ color: branding.header_text_color || '#fff' }}>
                        {branding.header_subtitle}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <DMSLogo size="sm" />
            )}
            <div className="flex items-center gap-2">
              {/* Search Button (Mobile) */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSearchOpen(true)}
                title="Search"
                style={branding.header_bg_color ? { 
                  borderColor: branding.header_text_color || '#fff',
                  color: branding.header_text_color || '#fff'
                } : {}}
              >
                <Search className="w-4 h-4" />
              </Button>
              
              {/* Go Offline Button (Mobile) - Hidden in Production and Monitoring Modules */}
              {!isProductionModule && !location.pathname.startsWith('/monitoring') && (
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
                  className="text-orange-600 border-orange-300"
                  title={isInstalled ? "Offline Testing" : "Install App & Go Offline"}
                >
                  <WifiOff className="w-4 h-4" />
                  {!isInstalled && <Download className="w-3 h-3 ml-0.5" />}
                </Button>
              )}
              
              {hasPermission('edit_templates') && (
                <Button 
                  variant="default"
                  size="sm"
                  onClick={() => navigate('/report-templates')}
                  className="bg-primary"
                >
                  <FileText className="w-4 h-4" />
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={onLogout}
                className="transition-smooth hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
              >
                <LogOut className="w-4 h-4 mr-1" />
                <span className="text-xs">Logout</span>
              </Button>
            </div>
          </div>
          
          {/* Centered Brand - Skip if custom header already shown */}
          {!branding.header_bg_color && (
            <div className="flex items-center justify-center gap-2">
              {(branding.logo_url || branding.logo_base64) ? (
                <>
                  <BrandedLogo 
                    variant="default"
                    alt={branding.company_name} 
                    className="h-10 w-auto object-contain max-w-[80px] bg-white p-1 rounded shadow-sm"
                  />
                  <div className="text-center leading-tight">
                    {branding.app_name && branding.app_name !== 'DMS Insight' ? (
                      <>
                        <p className="text-sm font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                          {branding.app_name}
                        </p>
                        <p className="text-[6px] font-semibold text-primary/70 tracking-wider">POWERED BY DMS INSIGHT</p>
                      </>
                    ) : (
                      <>
                        <h1 className="text-xs font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                          DMS Insight
                        </h1>
                        <p className="text-[6px] font-semibold text-primary/70 tracking-wider">FROM DATA TO DECISIONS</p>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4 text-primary animate-pulse" strokeWidth={2.5} />
                  <div className="text-center leading-tight">
                    {branding.app_name && branding.app_name !== 'DMS Insight' ? (
                      <>
                        <p className="text-sm font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                          {branding.app_name}
                        </p>
                        <p className="text-[6px] font-semibold text-primary/70 tracking-wider">POWERED BY DMS INSIGHT</p>
                      </>
                    ) : (
                      <>
                        <h1 className="text-xs font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                          DMS Insight
                        </h1>
                        <p className="text-[6px] font-semibold text-primary/70 tracking-wider">FROM DATA TO DECISIONS</p>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* User Info */}
          <div className="flex items-center justify-center gap-2 pb-2">
            <User className="w-4 h-4 text-secondary" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">{currentUser?.full_name}</span>
              <span className="text-[10px] text-muted-foreground capitalize">{currentUser?.role}</span>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between gap-4">
          {/* Left: Logo or Custom Partner Header */}
          {branding.header_bg_color ? (
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/sites')}>
              <BrandedLogo 
                variant={branding.logo_white_url ? 'white' : 'default'}
                alt={branding.company_name} 
                className="h-12 w-auto object-contain"
              />
              {branding.header_title && (
                <div className="leading-tight">
                  <p className="text-lg font-bold" style={{ color: branding.header_text_color || '#fff' }}>
                    {branding.header_title}
                  </p>
                  {branding.header_subtitle && (
                    <p className="text-xs opacity-75" style={{ color: branding.header_text_color || '#fff' }}>
                      {branding.header_subtitle}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="cursor-pointer" onClick={() => navigate('/sites')}>
              <DMSLogo size="sm" />
            </div>
          )}

          {/* Center: User's Company Name - Show when using portal branding */}
          {branding.header_bg_color && userCompanyInfo?.company_name && (
            <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
              <h2 
                className="text-xl font-bold tracking-wide"
                style={{ 
                  color: branding.header_text_color || '#fff',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                {userCompanyInfo.company_name}
              </h2>
            </div>
          )}

          {/* Center: Brand - Only show if no custom header */}
          {!branding.header_bg_color && (
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/sites')}>
              {(branding.logo_url || branding.logo_base64) ? (
                <div className="flex items-center gap-3">
                  <BrandedLogo 
                    variant="default"
                    alt={branding.company_name} 
                    className="h-14 w-auto object-contain max-w-[120px] bg-white p-1 rounded shadow-sm"
                  />
                  <div className="text-center leading-tight">
                    {branding.app_name && branding.app_name !== 'DMS Insight' ? (
                      <>
                        <p className="text-lg font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                          {branding.app_name}
                        </p>
                        <p className="text-[8px] font-semibold text-primary/70 tracking-wider">POWERED BY DMS INSIGHT</p>
                      </>
                    ) : branding.company_name && branding.company_name !== 'DMS Insight' ? (
                      <>
                        <p className="text-lg font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                          {branding.company_name}
                        </p>
                        <p className="text-[8px] font-semibold text-primary/70 tracking-wider">POWERED BY DMS INSIGHT</p>
                      </>
                    ) : (
                      <>
                        <h1 className="text-base font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                          DMS Insight
                        </h1>
                        <p className="text-[8px] font-semibold text-primary/70 tracking-wider">FROM DATA TO DECISIONS</p>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary animate-pulse" strokeWidth={2.5} />
                  <div className="text-center leading-tight">
                    {branding.app_name && branding.app_name !== 'DMS Insight' ? (
                      <>
                        <p className="text-lg font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                          {branding.app_name}
                        </p>
                        <p className="text-[8px] font-semibold text-primary/70 tracking-wider">POWERED BY DMS INSIGHT</p>
                      </>
                    ) : branding.company_name && branding.company_name !== 'DMS Insight' ? (
                      <>
                        <p className="text-lg font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                          {branding.company_name}
                        </p>
                        <p className="text-[8px] font-semibold text-primary/70 tracking-wider">POWERED BY DMS INSIGHT</p>
                      </>
                    ) : (
                      <>
                        <h1 className="text-base font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                          DMS Insight
                        </h1>
                        <p className="text-[8px] font-semibold text-primary/70 tracking-wider">FROM DATA TO DECISIONS</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Right: Notifications + User Menu */}
          <div className="flex items-center gap-2">
            {/* Notification Bell (Admin only) */}
            <NotificationBell />

            {/* User Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`gap-2 ${branding.header_bg_color 
                    ? 'bg-white/20 border-white/30 text-white hover:bg-white/30 hover:text-white' 
                    : ''}`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    branding.header_bg_color ? 'bg-white text-gray-800' : 'bg-primary text-white'
                  }`}>
                    {currentUser?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-semibold leading-none">{currentUser?.full_name}</span>
                    <span className={`text-[10px] capitalize leading-none mt-0.5 ${
                      branding.header_bg_color ? 'text-white/70' : 'text-muted-foreground'
                    }`}>
                      {currentUser?.role}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-semibold">{currentUser?.full_name}</span>
                    <span className="text-xs text-muted-foreground font-normal">{currentUser?.email}</span>
                    <Badge className={`mt-2 w-fit ${
                      isMaster() ? 'bg-purple-100 text-purple-800' : 
                      isAdmin() ? 'bg-blue-100 text-blue-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {isMaster() && <Crown className="w-3 h-3 mr-1" />}
                      {currentUser?.role}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* Production Module - Available only if module is enabled */}
                {hasModuleAccess('production_testing') && (
                  <DropdownMenuItem onClick={() => navigate('/production')} className="gap-2">
                    <Factory className="w-4 h-4" />
                    Production Testing
                  </DropdownMenuItem>
                )}
                {/* Online Monitoring Module - Available only if module is enabled */}
                {hasModuleAccess('online_monitoring') && (
                  <DropdownMenuItem onClick={() => navigate('/monitoring')} className="gap-2">
                    <Activity className="w-4 h-4" />
                    Online Monitoring
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {(isMaster() || isAdmin()) && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/admin-tools')} className="gap-2">
                      <Wrench className="w-4 h-4" />
                      Admin Tools
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 flex items-center justify-center">
                  <VersionBadge />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>

    {/* Install Instructions Dialog */}
    <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-green-600" />
            Install DMS Insight App
          </DialogTitle>
          <DialogDescription>
            Install this app on your device for offline access
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Chrome / Edge (Desktop):</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Click the install icon in the address bar (⊕)</li>
              <li>Or click Menu (⋮) → "Install DMS Insight"</li>
            </ol>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Chrome (Android):</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Tap Menu (⋮) → "Add to Home screen"</li>
              <li>Tap "Install" when prompted</li>
            </ol>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Safari (iOS):</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Tap the Share button (□↑)</li>
              <li>Scroll down and tap "Add to Home Screen"</li>
              <li>Tap "Add" to confirm</li>
            </ol>
          </div>
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-800">
              <strong>Tip:</strong> Once installed, you can access Offline Testing directly from your home screen, even without internet!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Global Search Dialog */}
    <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
