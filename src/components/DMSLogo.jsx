import React from 'react';

export const DMSLogo = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'h-8 max-w-[120px]',
    md: 'h-10 max-w-[150px]',
    lg: 'h-12 max-w-[180px]',
    xl: 'h-14 max-w-[200px]'
  };

  return (
    <img 
      src="/images/dms-logo.png" 
      alt="DMS - Diagnostic Monitoring Solutions" 
      className={`${sizes[size]} w-auto object-contain ${className}`}
      style={{ aspectRatio: 'auto' }}
    />
  );
};
