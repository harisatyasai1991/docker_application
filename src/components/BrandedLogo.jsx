import React, { useState, useEffect } from 'react';
import { useBranding } from '../contexts/BrandingContext';

/**
 * BrandedLogo - A logo component with automatic base64 fallback
 * 
 * This component displays the company logo and automatically falls back
 * to the base64-encoded version if the URL fails to load. This ensures
 * logo persistence across deployments even when file storage is ephemeral.
 * 
 * @param {string} variant - 'default' or 'white' for different logo versions
 * @param {string} className - CSS classes to apply to the image
 * @param {string} alt - Alt text for the image
 * @param {object} style - Inline styles to apply
 * @param {function} onLoad - Callback when image loads successfully
 * @param {function} onError - Callback when both URL and fallback fail
 */
const BrandedLogo = ({ 
  variant = 'default', 
  className = '', 
  alt,
  style = {},
  onLoad,
  onError,
  ...props 
}) => {
  const { branding } = useBranding();
  const [imgSrc, setImgSrc] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  // Determine which logo URL and base64 to use based on variant
  const logoUrl = variant === 'white' ? branding.logo_white_url : branding.logo_url;
  const logoBase64 = variant === 'white' ? branding.logo_white_base64 : branding.logo_base64;
  const defaultAlt = variant === 'white' 
    ? `${branding.company_name || 'Company'} Logo (White)` 
    : `${branding.company_name || 'Company'} Logo`;

  useEffect(() => {
    // Reset state when branding changes
    setHasError(false);
    setUsedFallback(false);
    
    // Prioritize URL, fallback to base64
    if (logoUrl) {
      setImgSrc(logoUrl);
    } else if (logoBase64) {
      setImgSrc(logoBase64);
      setUsedFallback(true);
    } else {
      setImgSrc(null);
    }
  }, [logoUrl, logoBase64]);

  const handleError = () => {
    // If URL failed and we have base64 fallback, use it
    if (!usedFallback && logoBase64) {
      console.log(`Logo URL failed to load, using base64 fallback for ${variant} variant`);
      setImgSrc(logoBase64);
      setUsedFallback(true);
    } else {
      // Both URL and fallback failed
      setHasError(true);
      if (onError) onError();
    }
  };

  const handleLoad = () => {
    if (onLoad) onLoad();
  };

  // Don't render if no source available
  if (!imgSrc || hasError) {
    return null;
  }

  return (
    <img
      src={imgSrc}
      alt={alt || defaultAlt}
      className={className}
      style={style}
      onError={handleError}
      onLoad={handleLoad}
      data-testid={`branded-logo-${variant}`}
      {...props}
    />
  );
};

export default BrandedLogo;
