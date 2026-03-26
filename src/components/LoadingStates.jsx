import React from 'react';
import { Activity } from 'lucide-react';

export const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Activity className={`${sizeClasses[size]} text-primary animate-spin`} />
      {text && <p className="mt-4 text-sm text-muted-foreground">{text}</p>}
    </div>
  );
};

export const ErrorMessage = ({ error, retry }) => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 max-w-md">
        <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Data</h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        {retry && (
          <button
            onClick={retry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export const EmptyState = ({ message = 'No data available', icon: Icon }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {Icon && <Icon className="w-16 h-16 text-muted-foreground/30 mb-4" />}
      <p className="text-lg text-muted-foreground">{message}</p>
    </div>
  );
};
