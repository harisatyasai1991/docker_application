/**
 * Widget Registry
 * Maps widget/section types to their React components
 * Provides a centralized renderer for dynamic dashboard building
 */
import React from 'react';
import { SummaryCardsWidget } from './SummaryCardsWidget';
import { RegionalOverviewWidget } from './RegionalOverviewWidget';
import { AlarmListWidget } from './AlarmListWidget';
import { QuickActionsWidget } from './QuickActionsWidget';
import { SubstationHeatmapWidget } from './SubstationHeatmapWidget';
import { SubstationHealthMonitor } from './SubstationHealthMonitor';
import { EquipmentTypeSummary } from './EquipmentTypeSummary';

// Registry of all available widgets
export const WIDGET_REGISTRY = {
  summary_cards: {
    component: SummaryCardsWidget,
    name: 'Summary Cards',
    description: 'KPI cards showing key metrics',
    defaultConfig: { cards: ['substations', 'equipment', 'critical_alarms', 'health'] }
  },
  regional_overview: {
    component: RegionalOverviewWidget,
    name: 'Regional Overview',
    description: 'Region-based summary cards',
    defaultConfig: { show_map_link: true }
  },
  alarm_list: {
    component: AlarmListWidget,
    name: 'Active Alarms',
    description: 'List of active alarms',
    defaultConfig: { limit: 5, show_view_all: true }
  },
  quick_actions: {
    component: QuickActionsWidget,
    name: 'Quick Actions',
    description: 'Navigation shortcuts',
    defaultConfig: {}
  },
  substation_heatmap: {
    component: SubstationHeatmapWidget,
    name: 'Substation Heatmap',
    description: 'Visual heatmap of substation health with click-to-view details',
    defaultConfig: {}
  },
  substation_health_monitor: {
    component: SubstationHealthMonitor,
    name: 'Substation Health Monitor',
    description: '3-column view: substation list, equipment bars, detail panel',
    defaultConfig: {}
  },
  equipment_type_summary: {
    component: EquipmentTypeSummary,
    name: 'Equipment Type Summary',
    description: 'Asset breakdown by type with status counts',
    defaultConfig: {}
  }
};

/**
 * Dynamic Widget Renderer
 * Renders a widget based on its type from the registry
 */
export function DashboardWidgetRenderer({ 
  sectionType, 
  sectionConfig = {}, 
  dashboardData = {}, 
  activeAlarms = []
}) {
  const widgetDef = WIDGET_REGISTRY[sectionType];
  
  if (!widgetDef) {
    console.warn(`Unknown widget type: ${sectionType}`);
    return (
      <div className="p-4 bg-gray-100 rounded-lg text-gray-500 text-sm">
        Unknown widget type: {sectionType}
      </div>
    );
  }

  const WidgetComponent = widgetDef.component;
  const mergedConfig = { ...widgetDef.defaultConfig, ...sectionConfig };

  return (
    <WidgetComponent 
      data={dashboardData} 
      alarms={activeAlarms}
      config={mergedConfig}
    />
  );
}

export default WIDGET_REGISTRY;
