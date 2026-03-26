/**
 * Dashboard Widget Components Index
 * Central registry for all dashboard widgets
 */

// Export all widget components
export { SummaryCardsWidget } from './SummaryCardsWidget';
export { RegionalOverviewWidget } from './RegionalOverviewWidget';
export { AlarmListWidget } from './AlarmListWidget';
export { QuickActionsWidget } from './QuickActionsWidget';
export { SubstationHeatmapWidget } from './SubstationHeatmapWidget';
export { SubstationHealthMonitor } from './SubstationHealthMonitor';
export { EquipmentTypeSummary } from './EquipmentTypeSummary';

// Widget Registry - maps widget types to components
export { WIDGET_REGISTRY, DashboardWidgetRenderer } from './WidgetRegistry';
