/**
 * Online Monitoring Module - Navigation Component
 * Clean, bright white theme
 */
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Cpu, 
  AlertTriangle, 
  TrendingUp,
  Map,
  ClipboardCheck,
  Database
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { path: '/monitoring', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/monitoring/map', icon: Map, label: 'Map View' },
  { path: '/monitoring/substations', icon: Building2, label: 'Substations' },
  { path: '/monitoring/equipment', icon: Cpu, label: 'Assets' },
  { path: '/monitoring/alarms', icon: AlertTriangle, label: 'Alarms' },
  { path: '/monitoring/analytics', icon: TrendingUp, label: 'Analytics' },
  { path: '/monitoring/field-testing', icon: ClipboardCheck, label: 'Field Testing' },
  { path: '/monitoring/data-management', icon: Database, label: 'Data' },
];

export function MonitoringNav() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 h-14 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300",
                  active 
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-200" 
                    : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-white" : "")} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default MonitoringNav;
