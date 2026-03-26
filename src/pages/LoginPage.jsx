import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Activity, Zap, Shield, Lock, User } from 'lucide-react';
import { authAPI } from '../services/api';
import { useBranding } from '../contexts/BrandingContext';
import BrandedLogo from '../components/BrandedLogo';

export const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { branding, loading: brandingLoading } = useBranding();
  
  const apiBase = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    
    try {
      // Authenticate with backend
      const response = await authAPI.login(username, password);
      
      if (response.success && response.user) {
        const userData = response.user;
        
        // Check if user must change password
        if (userData.must_change_password) {
          toast.info('You must change your password on first login');
          // Store temporary user data for password change flow
          localStorage.setItem('pendingPasswordChange', JSON.stringify(userData));
          onLogin(userData, true); // Pass true to indicate password change required
        } else {
          toast.success(`Login successful! Welcome ${userData.full_name}`);
          onLogin(userData);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Filter out rrweb-related clone errors
      const errorMsg = error.message || 'Invalid username or password';
      if (errorMsg.includes('clone') || errorMsg.includes('body is already used')) {
        // This is a technical error from rrweb interceptor, show user-friendly message
        toast.error('Invalid username or password');
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get the logo to display - prioritize branding logo, fallback to base64, then default
  const getLogoUrl = () => {
    if (branding.logo_url) {
      return branding.logo_url;
    }
    if (branding.logo_base64) {
      return branding.logo_base64;
    }
    return '/images/dms-logo.png';
  };

  // Get the white logo URL with base64 fallback
  const getWhiteLogoUrl = () => {
    if (branding.logo_white_url) {
      return branding.logo_white_url;
    }
    if (branding.logo_white_base64) {
      return branding.logo_white_base64;
    }
    // Fall back to regular logo if no white version
    return getLogoUrl();
  };

  // Check if we have any logo available
  const hasLogo = () => {
    return !!(branding.logo_url || branding.logo_base64);
  };

  // Check if we have white logo available
  const hasWhiteLogo = () => {
    return !!(branding.logo_white_url || branding.logo_white_base64);
  };

  // Get display name
  const getDisplayName = () => {
    if (branding.app_name && branding.app_name !== 'DMS Insight') {
      return branding.app_name;
    }
    return null;
  };

  // Show loading state while branding is loading
  if (brandingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-primary/20 rounded-full"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: branding.login_bg_image ? `url(${branding.login_bg_image})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Background overlay for custom backgrounds */}
      {branding.login_bg_image && (
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundColor: branding.login_bg_overlay || 'rgba(0, 0, 0, 0.4)',
          }}
        />
      )}
      
      {/* Default background decorative elements (only when no custom bg) */}
      {!branding.login_bg_image && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        </div>
      )}

      <div className={`w-full ${branding.login_hide_left_panel ? 'max-w-6xl flex justify-end px-8' : 'max-w-6xl grid lg:grid-cols-2 gap-8'} items-center relative z-10`}>
        {/* Left side - Branding (hidden when login_hide_left_panel is true) */}
        {!branding.login_hide_left_panel && (
        <div className={`hidden lg:flex flex-col justify-center space-y-8 p-8 ${branding.login_bg_image ? 'text-white' : ''}`}>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {branding.login_bg_image && hasWhiteLogo() ? (
                <img 
                  src={getWhiteLogoUrl()} 
                  alt={branding.company_name || 'Company Logo'} 
                  className="h-20 w-auto object-contain max-w-[200px]"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = getLogoUrl();
                  }}
                />
              ) : hasLogo() ? (
                <img 
                  src={getLogoUrl()} 
                  alt={branding.company_name || 'Company Logo'} 
                  className="h-20 w-auto object-contain max-w-[200px]"
                  onError={(e) => {
                    // Fallback to default logo on error
                    e.target.onerror = null;
                    e.target.src = '/images/dms-logo.png';
                  }}
                />
              ) : (
                <img 
                  src="/images/dms-logo.png" 
                  alt="DMS Logo" 
                  className="h-20 w-auto object-contain"
                />
              )}
            </div>
            
            {/* Show custom app name if available */}
            {getDisplayName() && (
              <h2 className={`text-2xl font-bold ${branding.login_bg_image ? 'text-white' : 'text-foreground'}`}>
                {getDisplayName()}
              </h2>
            )}
            
            <p className={`text-lg leading-relaxed mt-6 ${branding.login_bg_image ? 'text-white/80' : 'text-muted-foreground'}`}>
              Comprehensive electrical asset monitoring and predictive maintenance platform for industrial infrastructure.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${branding.login_bg_image ? 'bg-white/20' : 'bg-primary/10'}`}>
                <Zap className={`w-6 h-6 ${branding.login_bg_image ? 'text-white' : 'text-primary'}`} />
              </div>
              <div>
                <h3 className={`font-semibold mb-1 ${branding.login_bg_image ? 'text-white' : 'text-foreground'}`}>Real-Time Diagnostics</h3>
                <p className={`text-sm ${branding.login_bg_image ? 'text-white/70' : 'text-muted-foreground'}`}>Monitor asset health with live data and instant alerts</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${branding.login_bg_image ? 'bg-white/20' : 'bg-secondary/10'}`}>
                <Activity className={`w-6 h-6 ${branding.login_bg_image ? 'text-white' : 'text-secondary'}`} />
              </div>
              <div>
                <h3 className={`font-semibold mb-1 ${branding.login_bg_image ? 'text-white' : 'text-foreground'}`}>Predictive Maintenance</h3>
                <p className={`text-sm ${branding.login_bg_image ? 'text-white/70' : 'text-muted-foreground'}`}>Reduce downtime with intelligent scheduling</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${branding.login_bg_image ? 'bg-white/20' : 'bg-accent/10'}`}>
                <Shield className={`w-6 h-6 ${branding.login_bg_image ? 'text-white' : 'text-accent'}`} />
              </div>
              <div>
                <h3 className={`font-semibold mb-1 ${branding.login_bg_image ? 'text-white' : 'text-foreground'}`}>Enterprise Security</h3>
                <p className={`text-sm ${branding.login_bg_image ? 'text-white/70' : 'text-muted-foreground'}`}>Bank-grade encryption for your critical data</p>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Right side - Login Form */}
        <div className="flex items-center justify-center">
          <Card className={`w-full max-w-md shadow-xl ${branding.login_hide_left_panel ? 'bg-white/95 backdrop-blur-sm' : 'border-border/50'}`}>
            <CardHeader className="space-y-2 text-center">
              <div className="flex justify-center lg:hidden mb-4">
                {hasLogo() ? (
                  <img 
                    src={getLogoUrl()} 
                    alt={branding.company_name || 'Company Logo'} 
                    className="h-16 w-auto object-contain max-w-[160px]"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/dms-logo.png';
                    }}
                  />
                ) : (
                  <img 
                    src="/images/dms-logo.png" 
                    alt="DMS Logo" 
                    className="h-16 w-auto object-contain"
                  />
                )}
              </div>
              
              {/* Show app name on mobile if custom */}
              {getDisplayName() && (
                <p className="text-lg font-bold text-primary lg:hidden">{getDisplayName()}</p>
              )}
              
              <CardTitle className="text-2xl font-bold">
                {branding.app_name && branding.app_name !== 'DMS Insight' ? branding.app_name : 'Welcome Back'}
              </CardTitle>
              <CardDescription className="text-base">
                {branding.subdomain && branding.header_subtitle 
                  ? branding.header_subtitle 
                  : 'Sign in to access your diagnostic monitoring dashboard'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 h-11"
                      required
                      data-testid="login-username-input"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-11"
                      required
                      data-testid="login-password-input"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-primary hover:bg-primary-dark shadow-primary transition-smooth"
                  disabled={isLoading}
                  data-testid="login-submit-button"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  <p>Secure authentication enabled</p>
                  {!branding.subdomain && (
                    <p className="text-xs mt-1">Master Admin: DMSInsight</p>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Powered by DMS Insight footer for white-labeled instances */}
      {branding.subdomain && branding.app_name !== 'DMS Insight' && (
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by <span className="font-semibold">DMS Insight</span>
          </p>
        </div>
      )}
    </div>
  );
};
