import React from 'react';
import { Badge } from './ui/badge';
import { Zap, ZapOff } from 'lucide-react';

/**
 * TestModeBadge Component
 * Displays a colored badge indicating if a test is Online (Energized) or Offline (De-energized)
 * 
 * @param {string} mode - "online" or "offline"
 * @param {string} size - "sm" | "md" | "lg" - controls the badge size
 * @param {boolean} showIcon - whether to show the icon
 * @param {boolean} showLabel - whether to show the text label
 */
export const TestModeBadge = ({ 
  mode = "offline", 
  size = "sm",
  showIcon = true,
  showLabel = true,
  className = ""
}) => {
  const isOnline = mode === "online";
  
  // Size configurations
  const sizeConfig = {
    sm: {
      badge: "text-xs px-1.5 py-0.5",
      icon: "w-3 h-3"
    },
    md: {
      badge: "text-sm px-2 py-1",
      icon: "w-4 h-4"
    },
    lg: {
      badge: "text-base px-3 py-1.5",
      icon: "w-5 h-5"
    }
  };

  const config = sizeConfig[size] || sizeConfig.sm;
  
  // Color configuration
  const colorConfig = isOnline
    ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
    : "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200";
  
  const Icon = isOnline ? Zap : ZapOff;
  const label = isOnline ? "Online" : "Offline";

  return (
    <Badge 
      variant="outline" 
      className={`${colorConfig} ${config.badge} flex items-center gap-1 font-medium ${className}`}
      title={isOnline 
        ? "Online Test: Conducted on energized/live equipment" 
        : "Offline Test: Conducted on de-energized equipment"
      }
    >
      {showIcon && <Icon className={config.icon} />}
      {showLabel && <span>{label}</span>}
    </Badge>
  );
};

/**
 * TestModeSelector Component
 * A dropdown/toggle for selecting test mode during test creation/editing
 */
export const TestModeSelector = ({ 
  value = "offline", 
  onChange,
  disabled = false 
}) => {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("offline")}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
          value === "offline"
            ? "border-orange-400 bg-orange-50 text-orange-700"
            : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <ZapOff className="w-4 h-4" />
        <div className="text-left">
          <span className="font-medium">Offline</span>
          <p className="text-xs opacity-75">De-energized</p>
        </div>
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("online")}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
          value === "online"
            ? "border-green-400 bg-green-50 text-green-700"
            : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <Zap className="w-4 h-4" />
        <div className="text-left">
          <span className="font-medium">Online</span>
          <p className="text-xs opacity-75">Energized</p>
        </div>
      </button>
    </div>
  );
};

export default TestModeBadge;
