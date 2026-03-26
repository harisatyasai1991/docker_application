import React from 'react';
import { Badge } from './ui/badge';
import { Globe, Building2 } from 'lucide-react';

/**
 * TestScopeBadge Component
 * Displays a colored badge indicating if a test is Global or Company-specific
 * 
 * @param {string} scope - "global" or "company"
 * @param {string} companyName - Company name for company-specific tests
 * @param {string} size - "sm" | "md" - controls the badge size
 */
export const TestScopeBadge = ({ 
  scope = "global", 
  companyName = "",
  size = "sm",
  className = ""
}) => {
  const isGlobal = scope === "global" || !scope;
  
  // Size configurations
  const sizeConfig = {
    sm: {
      badge: "text-xs px-1.5 py-0.5",
      icon: "w-3 h-3"
    },
    md: {
      badge: "text-sm px-2 py-1",
      icon: "w-4 h-4"
    }
  };

  const config = sizeConfig[size] || sizeConfig.sm;
  
  // Color configuration
  const colorConfig = isGlobal
    ? "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
    : "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200";
  
  const Icon = isGlobal ? Globe : Building2;
  const label = isGlobal ? "Global" : "Company";

  return (
    <Badge 
      variant="outline" 
      className={`${colorConfig} ${config.badge} flex items-center gap-1 font-medium ${className}`}
      title={isGlobal 
        ? "Global Test: Available for all companies and Sales Orders" 
        : `Company-Specific Test: Only for ${companyName || 'this company'}'s internal use`
      }
    >
      <Icon className={config.icon} />
      <span>{label}</span>
    </Badge>
  );
};

export default TestScopeBadge;
