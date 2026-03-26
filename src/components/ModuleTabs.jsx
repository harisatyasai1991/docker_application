/**
 * Module Tabs Component - Quick switching between Asset Performance and Online Monitoring
 * Provides consistent navigation across both modules
 */
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Activity, BarChart3 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export function ModuleTabs({ className }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasModuleAccess } = useAuth();
  
  const isAssetPerformance = location.pathname.startsWith('/dashboard') || 
                             location.pathname.startsWith('/sites') ||
                             location.pathname.startsWith('/assets') ||
                             location.pathname === '/';
  
  const isOnlineMonitoring = location.pathname.startsWith('/monitoring');
  
  // Don't show if user doesn't have access to both modules
  const hasAPM = hasModuleAccess('asset_management');
  const hasOM = hasModuleAccess('online_monitoring');
  
  if (!hasAPM || !hasOM) {
    return null;
  }

  const tabs = [
    {
      id: 'asset-performance',
      label: 'Asset Performance',
      icon: BarChart3,
      active: isAssetPerformance,
      path: '/dashboard',
      color: 'blue',
      description: 'Sites, Assets & Maintenance'
    },
    {
      id: 'online-monitoring',
      label: 'Online Monitoring',
      icon: Activity,
      active: isOnlineMonitoring,
      path: '/monitoring',
      color: 'emerald',
      description: 'Real-time PD Monitoring'
    }
  ];

  return (
    <div className={cn("bg-white border-b border-gray-200 shadow-sm", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 h-12">
          <span className="text-xs font-medium text-gray-500 mr-2 hidden sm:inline">MODULE:</span>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                data-testid={`module-tab-${tab.id}`}
                onClick={() => navigate(tab.path)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  tab.active
                    ? tab.color === 'blue'
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-200"
                      : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-200"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ModuleTabs;
