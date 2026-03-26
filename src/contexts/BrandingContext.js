import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { companyAPI, brandingAPI } from '../services/api';
import { useAuth } from './AuthContext';

const BrandingContext = createContext();

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};

// Helper to extract subdomain from hostname or stored session
const getSubdomain = () => {
  const hostname = window.location.hostname;
  
  // Check for URL parameter for testing (e.g., ?subdomain=ipec)
  const urlParams = new URLSearchParams(window.location.search);
  const testSubdomain = urlParams.get('subdomain');
  if (testSubdomain) {
    // Store the subdomain in sessionStorage so it persists across navigation
    sessionStorage.setItem('portal_subdomain', testSubdomain.toLowerCase());
    return testSubdomain.toLowerCase();
  }
  
  // Check if we have a stored subdomain from a previous navigation
  const storedSubdomain = sessionStorage.getItem('portal_subdomain');
  if (storedSubdomain) {
    return storedSubdomain;
  }
  
  // Skip subdomain detection for localhost and IP addresses
  if (hostname === 'localhost' || hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    return null;
  }
  
  // Handle preview.emergentagent.com format (e.g., multi-tenant-ui-3.preview.emergentagent.com)
  // In this case, we want to check for customer subdomains like acumen.dmsinsight.com
  const parts = hostname.split('.');
  
  // For production: customer.dmsinsight.com -> subdomain = "customer"
  // For preview: multi-tenant-ui-3.preview.emergentagent.com -> no subdomain
  if (parts.length >= 3) {
    // Check if it's a preview URL (contains "preview" or "emergentagent")
    if (hostname.includes('preview.emergentagent') || hostname.includes('localhost')) {
      return null;
    }
    
    // Skip common prefixes that aren't customer subdomains
    const firstPart = parts[0].toLowerCase();
    if (firstPart === 'www' || firstPart === 'app' || firstPart === 'api') {
      return null;
    }
    
    // For production URLs like acumen.dmsinsight.com
    // Store it for session persistence
    sessionStorage.setItem('portal_subdomain', firstPart);
    return firstPart;
  }
  
  return null;
};

// Default branding values
const DEFAULT_BRANDING = {
  logo_url: null,
  primary_color: '#1e40af',
  secondary_color: '#3b82f6',
  company_name: 'DMS Insight',
  app_name: 'DMS Insight',
  favicon_url: null,
  subdomain: null,
  company_id: null,
  // Partner header customization (null means use default header style)
  header_bg_color: null,
  header_text_color: null,
  header_title: null,
  header_subtitle: null,
  logo_white_url: null,
  // Partner login page customization
  login_bg_image: null,
  login_bg_overlay: null,
  login_hide_left_panel: false,
  // Base64 fallbacks for logo persistence
  logo_base64: null,
  logo_white_base64: null,
};

// Helper function to resolve logo URL with base64 fallback
const resolveLogoUrl = (logoUrl, logoBase64, apiBase) => {
  // If we have a URL, construct full path if relative
  if (logoUrl) {
    const fullUrl = logoUrl.startsWith('http') ? logoUrl : `${apiBase}${logoUrl}`;
    // Return an object with both URL and fallback so we can handle load errors
    return { url: fullUrl, fallback: logoBase64 };
  }
  // If no URL but we have base64, use that directly
  if (logoBase64) {
    return { url: logoBase64, fallback: null };
  }
  return { url: null, fallback: null };
};

export const BrandingProvider = ({ children }) => {
  const { currentUser, getUserCompany } = useAuth();
  const [branding, setBranding] = useState(DEFAULT_BRANDING);
  const [subdomainBranding, setSubdomainBranding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detectedSubdomain, setDetectedSubdomain] = useState(null);
  const [prevUser, setPrevUser] = useState(null);
  const [userCompanyInfo, setUserCompanyInfo] = useState(null); // Store user's actual company info

  // Load subdomain branding on mount (BEFORE login)
  useEffect(() => {
    loadSubdomainBranding();
  }, []);

  // Load user's company branding after login, or clear portal session on logout
  useEffect(() => {
    if (currentUser) {
      loadUserBranding();
      setPrevUser(currentUser);
    } else if (prevUser) {
      // User just logged out - clear portal session and reload subdomain branding
      sessionStorage.removeItem('portal_subdomain');
      setSubdomainBranding(null);
      setDetectedSubdomain(null);
      setUserCompanyInfo(null);
      setPrevUser(null);
      // Reload branding (will use defaults since no subdomain in URL anymore)
      loadSubdomainBranding();
    }
  }, [currentUser]);

  const loadSubdomainBranding = async () => {
    try {
      const subdomain = getSubdomain();
      setDetectedSubdomain(subdomain);
      
      if (!subdomain) {
        // No subdomain detected, use defaults
        setBranding(DEFAULT_BRANDING);
        applyBrandingColors(DEFAULT_BRANDING.primary_color, DEFAULT_BRANDING.secondary_color);
        setLoading(false);
        return;
      }

      // Fetch branding from API based on subdomain
      const response = await brandingAPI.getBySubdomain(subdomain);
      
      if (response.found) {
        const apiBase = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
        
        // Resolve logo URLs with base64 fallback for persistence
        const logoResolved = resolveLogoUrl(response.logo_url, response.logo_base64, apiBase);
        const logoWhiteResolved = resolveLogoUrl(response.logo_white_url, response.logo_white_base64, apiBase);
        
        let faviconUrl = response.favicon_url;
        if (faviconUrl && !faviconUrl.startsWith('http')) {
          faviconUrl = `${apiBase}${faviconUrl}`;
        }
        
        const brandingData = {
          logo_url: logoResolved.url,
          logo_base64: logoResolved.fallback || response.logo_base64,
          primary_color: response.primary_color || DEFAULT_BRANDING.primary_color,
          secondary_color: response.secondary_color || DEFAULT_BRANDING.secondary_color,
          company_name: response.company_name || DEFAULT_BRANDING.company_name,
          app_name: response.app_name || response.company_name || DEFAULT_BRANDING.app_name,
          favicon_url: faviconUrl,
          subdomain: response.subdomain,
          company_id: response.company_id,
          // Partner header customization
          header_bg_color: response.header_bg_color,
          header_text_color: response.header_text_color,
          header_title: response.header_title,
          header_subtitle: response.header_subtitle,
          logo_white_url: logoWhiteResolved.url,
          logo_white_base64: logoWhiteResolved.fallback || response.logo_white_base64,
          // Partner login page customization
          login_bg_image: response.login_bg_image ? 
            (response.login_bg_image.startsWith('http') ? response.login_bg_image : `${apiBase}${response.login_bg_image}`) 
            : null,
          login_bg_overlay: response.login_bg_overlay,
          login_hide_left_panel: response.login_hide_left_panel || false,
        };
        
        setSubdomainBranding(brandingData);
        setBranding(brandingData);
        applyBrandingColors(brandingData.primary_color, brandingData.secondary_color);
        
        // Update favicon if provided
        if (faviconUrl) {
          updateFavicon(faviconUrl);
        }
        
        // Update document title
        if (brandingData.app_name && brandingData.app_name !== 'DMS Insight') {
          document.title = `${brandingData.app_name} | DMS Insight`;
        }
      } else {
        // Subdomain not found, use defaults
        setBranding(DEFAULT_BRANDING);
        applyBrandingColors(DEFAULT_BRANDING.primary_color, DEFAULT_BRANDING.secondary_color);
      }
    } catch (error) {
      console.error('Failed to load subdomain branding:', error);
      setBranding(DEFAULT_BRANDING);
      applyBrandingColors(DEFAULT_BRANDING.primary_color, DEFAULT_BRANDING.secondary_color);
    } finally {
      setLoading(false);
    }
  };

  const loadUserBranding = async () => {
    try {
      setLoading(true);
      
      // Check if there's a stored portal subdomain (for persistence on refresh)
      const storedSubdomain = sessionStorage.getItem('portal_subdomain');
      const activeSubdomain = detectedSubdomain || storedSubdomain;
      
      // If there's a subdomain but subdomainBranding isn't loaded yet, load it first
      let currentSubdomainBranding = subdomainBranding;
      if (activeSubdomain && !currentSubdomainBranding) {
        try {
          const response = await brandingAPI.getBySubdomain(activeSubdomain);
          if (response.found) {
            const apiBase = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
            
            // Resolve logo URLs with base64 fallback
            const logoResolved = resolveLogoUrl(response.logo_url, response.logo_base64, apiBase);
            const logoWhiteResolved = resolveLogoUrl(response.logo_white_url, response.logo_white_base64, apiBase);
            
            currentSubdomainBranding = {
              logo_url: logoResolved.url,
              logo_base64: logoResolved.fallback || response.logo_base64,
              primary_color: response.primary_color || DEFAULT_BRANDING.primary_color,
              secondary_color: response.secondary_color || DEFAULT_BRANDING.secondary_color,
              company_name: response.company_name || DEFAULT_BRANDING.company_name,
              app_name: response.app_name || response.company_name || DEFAULT_BRANDING.app_name,
              favicon_url: response.favicon_url,
              subdomain: response.subdomain,
              company_id: response.company_id,
              header_bg_color: response.header_bg_color,
              header_text_color: response.header_text_color,
              header_title: response.header_title,
              header_subtitle: response.header_subtitle,
              logo_white_url: logoWhiteResolved.url,
              logo_white_base64: logoWhiteResolved.fallback || response.logo_white_base64,
              login_bg_image: response.login_bg_image ? 
                (response.login_bg_image.startsWith('http') ? response.login_bg_image : `${apiBase}${response.login_bg_image}`) 
                : null,
              login_bg_overlay: response.login_bg_overlay,
              login_hide_left_panel: response.login_hide_left_panel || false,
            };
            setSubdomainBranding(currentSubdomainBranding);
          }
        } catch (error) {
          console.warn('Failed to load subdomain branding in loadUserBranding:', error);
        }
      }
      
      // Always fetch user's company info (for display purposes)
      const companyId = getUserCompany();
      if (companyId && currentUser?.role !== 'master') {
        try {
          const company = await companyAPI.getById(companyId);
          setUserCompanyInfo({
            company_id: companyId,
            company_name: company.company_name,
            app_name: company.app_name,
          });
        } catch (error) {
          console.warn('Failed to fetch user company info:', error);
        }
      } else {
        setUserCompanyInfo(null);
      }
      
      // IMPORTANT: Master users ALWAYS see subdomain branding (or defaults if no subdomain)
      if (currentUser?.role === 'master') {
        const brandingToUse = currentSubdomainBranding || DEFAULT_BRANDING;
        setBranding(brandingToUse);
        applyBrandingColors(brandingToUse.primary_color, brandingToUse.secondary_color);
        setLoading(false);
        return;
      }
      
      // For regular users, validate partner-customer access if subdomain was detected
      if (activeSubdomain && currentUser?.company_id) {
        try {
          const validation = await brandingAPI.validateAccess(activeSubdomain, currentUser.company_id);
          
          if (validation.use_partner_branding && validation.branding) {
            // User's company is linked to this partner - use partner branding
            const apiBase = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
            
            // Resolve logo URLs with base64 fallback
            const logoResolved = resolveLogoUrl(
              validation.branding.logo_url, 
              validation.branding.logo_base64, 
              apiBase
            );
            const logoWhiteResolved = resolveLogoUrl(
              validation.branding.logo_white_url, 
              validation.branding.logo_white_base64, 
              apiBase
            );
            
            const partnerBranding = {
              ...validation.branding,
              logo_url: logoResolved.url,
              logo_base64: logoResolved.fallback || validation.branding.logo_base64,
              logo_white_url: logoWhiteResolved.url,
              logo_white_base64: logoWhiteResolved.fallback || validation.branding.logo_white_base64,
              company_name: validation.partner_name,
              company_id: validation.partner_id,
            };
            
            setBranding(partnerBranding);
            applyBrandingColors(partnerBranding.primary_color, partnerBranding.secondary_color);
            setLoading(false);
            return;
          }
          // If not linked to partner, fall through to default branding
        } catch (error) {
          console.warn('Partner validation failed, using default branding:', error);
        }
      }
      
      // If subdomain branding exists but user isn't linked, still show subdomain branding
      // (This allows users to see the partner portal even if not officially linked)
      if (currentSubdomainBranding) {
        setBranding(currentSubdomainBranding);
        applyBrandingColors(currentSubdomainBranding.primary_color, currentSubdomainBranding.secondary_color);
        setLoading(false);
        return;
      }
      
      // Fall back to company-based branding for admin/users (when no subdomain)
      // companyId is already declared above for userCompanyInfo
      
      if (companyId) {
        const company = await companyAPI.getById(companyId);
        const apiBase = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
        
        // Resolve logo URLs with base64 fallback
        const logoResolved = resolveLogoUrl(company.logo_url, company.logo_base64, apiBase);
        const logoWhiteResolved = resolveLogoUrl(company.logo_white_url, company.logo_white_base64, apiBase);
        
        const brandingData = {
          logo_url: logoResolved.url,
          logo_base64: logoResolved.fallback || company.logo_base64,
          logo_white_url: logoWhiteResolved.url,
          logo_white_base64: logoWhiteResolved.fallback || company.logo_white_base64,
          primary_color: company.primary_color || DEFAULT_BRANDING.primary_color,
          secondary_color: company.secondary_color || DEFAULT_BRANDING.secondary_color,
          company_name: company.company_name || DEFAULT_BRANDING.company_name,
          app_name: company.app_name || company.company_name || DEFAULT_BRANDING.app_name,
          favicon_url: company.favicon_url || null,
          subdomain: company.subdomain || null,
          company_id: companyId,
        };
        
        setBranding(brandingData);
        applyBrandingColors(brandingData.primary_color, brandingData.secondary_color);
      } else {
        // No company ID - use default branding
        setBranding(DEFAULT_BRANDING);
        applyBrandingColors(DEFAULT_BRANDING.primary_color, DEFAULT_BRANDING.secondary_color);
      }
    } catch (error) {
      console.error('Failed to load user branding:', error);
      // Use defaults on error, but keep subdomain branding if available
      const fallbackBranding = subdomainBranding || DEFAULT_BRANDING;
      setBranding(fallbackBranding);
      applyBrandingColors(fallbackBranding.primary_color, fallbackBranding.secondary_color);
    } finally {
      setLoading(false);
    }
  };

  const applyBrandingColors = (primaryColor, secondaryColor) => {
    if (!primaryColor || !secondaryColor) return;

    // Convert hex to HSL for CSS variables (Tailwind uses HSL format)
    const hexToHsl = (hex) => {
      // Convert hex to RGB first
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return '220 76% 48%'; // Default blue in HSL
      
      let r = parseInt(result[1], 16) / 255;
      let g = parseInt(result[2], 16) / 255;
      let b = parseInt(result[3], 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;

      if (max === min) {
        h = s = 0; // achromatic
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
          default: h = 0;
        }
      }

      h = Math.round(h * 360);
      s = Math.round(s * 100);
      l = Math.round(l * 100);
      
      return `${h} ${s}% ${l}%`;
    };

    const primaryHsl = hexToHsl(primaryColor);
    const secondaryHsl = hexToHsl(secondaryColor);

    // Apply CSS variables to root in HSL format for Tailwind
    document.documentElement.style.setProperty('--primary', primaryHsl);
    document.documentElement.style.setProperty('--secondary', secondaryHsl);
    
    // Also set as data attributes for easier access
    document.documentElement.setAttribute('data-primary-color', primaryColor);
    document.documentElement.setAttribute('data-secondary-color', secondaryColor);
  };

  const updateFavicon = (faviconUrl) => {
    if (!faviconUrl) return;
    
    // Remove existing favicon links
    const existingFavicons = document.querySelectorAll("link[rel*='icon']");
    existingFavicons.forEach(el => el.remove());
    
    // Add new favicon
    const link = document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = faviconUrl;
    document.head.appendChild(link);
  };

  const refreshBranding = useCallback(() => {
    if (currentUser) {
      loadUserBranding();
    } else {
      loadSubdomainBranding();
    }
  }, [currentUser]);

  // Clear portal subdomain session (call on logout to reset branding)
  const clearPortalSession = useCallback(() => {
    sessionStorage.removeItem('portal_subdomain');
    setSubdomainBranding(null);
    setDetectedSubdomain(null);
    setUserCompanyInfo(null);
    setBranding(DEFAULT_BRANDING);
    applyBrandingColors(DEFAULT_BRANDING.primary_color, DEFAULT_BRANDING.secondary_color);
  }, []);

  const value = {
    branding,
    loading,
    refreshBranding,
    detectedSubdomain,
    subdomainBranding,
    clearPortalSession,
    userCompanyInfo, // User's actual company info (separate from portal branding)
  };

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
};
