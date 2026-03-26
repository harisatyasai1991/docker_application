/**
 * Online Monitoring Module - Main Dashboard
 * Clean, bright white theme with professional design
 * Two-column layout: Region Heatmap (left) + Substation Detail (right)
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { ModuleTabs } from '../../components/ModuleTabs';
import { MonitoringNav } from './MonitoringNav';
import { Button } from '../../components/ui/button';
import { 
  Activity, 
  RefreshCw,
  Clock
} from 'lucide-react';
import { monitoringAPI } from '../../services/api';
import { toast } from 'sonner';
import { RegionRiskHeatmap } from '../../components/monitoring/widgets/RegionRiskHeatmap';
import { SubstationHealthMonitor } from '../../components/monitoring/widgets/SubstationHealthMonitor';
import { QuickActionsWidget } from '../../components/monitoring/widgets/QuickActionsWidget';

// Default template sections when no template is assigned
// Prioritizes the health monitor (bar charts) as the primary focus
const DEFAULT_SECTIONS = [
  {
    section_id: 'health_monitor',
    section_type: 'substation_health_monitor',
    title: 'Substation Health Monitor',
    order: 1,
    is_visible: true,
    config: {}
  },
  {
    section_id: 'summary',
    section_type: 'summary_cards',
    title: 'Overview',
    order: 2,
    is_visible: true,
    config: { cards: ['substations', 'equipment', 'critical_alarms', 'health'], compact: true }
  },
  {
    section_id: 'actions',
    section_type: 'quick_actions',
    title: 'Quick Actions',
    order: 3,
    is_visible: true,
    config: {}
  }
];

export function MonitoringDashboard({ onLogout }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeAlarms, setActiveAlarms] = useState([]);
  const [template, setTemplate] = useState(null);
  const [selectedSubstation, setSelectedSubstation] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const [summaryRes, alarmsRes, templateRes] = await Promise.all([
        monitoringAPI.getDashboardSummary(),
        monitoringAPI.getActiveAlarms(),
        monitoringAPI.getMyDashboard('monitoring').catch(() => null)
      ]);
      
      setDashboardData(summaryRes);
      setActiveAlarms(alarmsRes.alarms || []);
      setTemplate(templateRes);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader onLogout={onLogout} />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-blue-600 animate-pulse">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Get sections from template or use defaults
  const sections = (template?.sections || DEFAULT_SECTIONS)
    .filter(s => s.is_visible !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Render section based on type with layout considerations
  const renderSection = (section) => {
    const sectionType = section.section_type;
    const sectionConfig = section.config || {};

    // Special layout handling for certain widget combinations
    if (sectionType === 'regional_overview') {
      // Check if alarm list should be rendered side-by-side
      const alarmSection = sections.find(s => s.section_type === 'alarm_list');
      if (alarmSection && alarmSection.is_visible !== false) {
        return (
          <div key={section.section_id} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <DashboardWidgetRenderer 
                sectionType="regional_overview"
                sectionConfig={sectionConfig}
                dashboardData={dashboardData}
                activeAlarms={activeAlarms}
              />
            </div>
            <div>
              <DashboardWidgetRenderer 
                sectionType="alarm_list"
                sectionConfig={alarmSection.config || {}}
                dashboardData={dashboardData}
                activeAlarms={activeAlarms}
              />
            </div>
          </div>
        );
      }
    }

    // Skip alarm_list if it was already rendered with regional_overview
    if (sectionType === 'alarm_list') {
      const regionalSection = sections.find(s => s.section_type === 'regional_overview');
      if (regionalSection && regionalSection.is_visible !== false) {
        return null; // Already rendered with regional
      }
    }

    return (
      <div key={section.section_id} className="mb-4">
        <DashboardWidgetRenderer 
          sectionType={sectionType}
          sectionConfig={sectionConfig}
          dashboardData={dashboardData}
          activeAlarms={activeAlarms}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <AppHeader onLogout={onLogout} />
      <ModuleTabs />
      <MonitoringNav />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Compact Header with inline summary stats */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-md">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">
                  {template?.name || 'Operations Focus'}
                </h1>
              </div>
            </div>
            {/* Inline compact stats */}
            <div className="hidden md:flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-lg">
                <span className="text-xs text-gray-500">Substations</span>
                <span className="text-sm font-bold text-blue-700">{dashboardData?.total_substations || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-50 rounded-lg">
                <span className="text-xs text-gray-500">Assets</span>
                <span className="text-sm font-bold text-cyan-700">{dashboardData?.total_equipment || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 rounded-lg">
                <span className="text-xs text-gray-500">Critical</span>
                <span className="text-sm font-bold text-red-600">{dashboardData?.alarm_summary?.critical || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-lg">
                <span className="text-xs text-gray-500">Healthy</span>
                <span className="text-sm font-bold text-emerald-600">{dashboardData?.health_summary?.healthy || 0}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-[10px] text-gray-400 flex items-center gap-1 bg-white px-2 py-1 rounded-full border border-gray-200">
              <Clock className="h-3 w-3 text-blue-500" />
              {new Date().toLocaleTimeString()}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-1.5 bg-white border-gray-200 hover:bg-gray-50 text-xs h-7"
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Two-Column Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
          {/* Left Column - Region Risk Heatmap */}
          <div className="h-[340px]">
            <RegionRiskHeatmap 
              onSubstationSelect={setSelectedSubstation}
              selectedSubstation={selectedSubstation}
            />
          </div>
          
          {/* Right Column - Substation Risk Monitor (detailed bar chart) */}
          <div className="h-[340px]">
            <SubstationHealthMonitor 
              compactMode={true} 
              externalSelectedSubstation={selectedSubstation}
              onSubstationChange={setSelectedSubstation}
            />
          </div>
        </div>
        
        {/* Quick Actions - Below the main widgets */}
        <QuickActionsWidget />
      </main>
    </div>
  );
}

export default MonitoringDashboard;
