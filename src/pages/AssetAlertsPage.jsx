import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { AppHeader } from '../components/AppHeader';
import { PageNavigation } from '../components/PageNavigation';
import { LoadingSpinner, ErrorMessage } from '../components/LoadingStates';
import { DMSLogo } from '../components/DMSLogo';
import { useAPIData } from '../hooks/useAPI';
import { assetsAPI, alertsAPI } from '../services/api';
import { 
  Activity,
  AlertTriangle,
  AlertCircle,
  Bell,
  Clock,
  CheckCircle2,
  XCircle,
  Info,
  Zap,
  ThermometerSun,
  LogOut
} from 'lucide-react';

export const AssetAlertsPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const { assetType, assetId } = useParams();

  // Fetch asset data from API
  const { data: asset, loading: assetLoading, error: assetError } = useAPIData(
    () => assetsAPI.getById(assetId),
    [assetId]
  );

  // Fetch all alerts for this asset from API
  const { data: allAlerts, loading: alertsLoading, error: alertsError } = useAPIData(
    () => alertsAPI.getAll({ asset_id: assetId }),
    [assetId]
  );

  const assetTypeNames = {
    transformer: 'Transformer',
    switchgear: 'Switch Gear',
    motors: 'Motors',
    generators: 'Generators',
    cables: 'Cables',
    ups: 'UPS'
  };

  // Helper function to get icon based on alert category
  const getAlertIcon = (category) => {
    const iconMap = {
      'Temperature': ThermometerSun,
      'Voltage': Zap,
      'Maintenance': AlertTriangle,
      'Communication': XCircle,
      'Efficiency': Activity,
      'Load': AlertCircle,
      'PD': AlertCircle,
      'Vibration': Activity,
      'default': Bell
    };
    return iconMap[category] || iconMap.default;
  };

  // Filter alerts by status
  const activeAlerts = allAlerts?.filter(alert => alert.status === 'active').map(alert => ({
    ...alert,
    icon: getAlertIcon(alert.category),
    actionRequired: alert.severity === 'critical' || alert.severity === 'warning'
  })) || [];

  const resolvedAlerts = allAlerts?.filter(alert => alert.status === 'resolved' || alert.status === 'acknowledged').map(alert => ({
    ...alert,
    icon: getAlertIcon(alert.category)
  })) || [];

  const getSeverityBadge = (severity) => {
    const config = {
      critical: {
        className: 'bg-[hsl(var(--status-critical))] text-[hsl(var(--status-critical-foreground))]',
        label: 'Critical'
      },
      warning: {
        className: 'bg-[hsl(var(--status-warning))] text-[hsl(var(--status-warning-foreground))]',
        label: 'Warning'
      },
      info: {
        className: 'bg-primary text-primary-foreground',
        label: 'Info'
      }
    };
    
    const { className, label } = config[severity] || config.info;
    return <Badge className={`${className} border-0`}>{label}</Badge>;
  };

  const handleAcknowledge = (alertId) => {
    console.log(`Acknowledging alert ${alertId}`);
    // In real app, this would update the alert status
  };

  const handleResolve = (alertId) => {
    console.log(`Resolving alert ${alertId}`);
    // In real app, this would mark the alert as resolved
  };

  // Show loading state
  if (assetLoading || alertsLoading) {
    return (
      <div className="min-h-screen">
        <LoadingSpinner size="lg" text="Loading alerts..." />
      </div>
    );
  }

  // Show error state
  if (assetError || alertsError) {
    return (
      <div className="min-h-screen">
        <ErrorMessage error={assetError || alertsError} retry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          {/* Mobile Layout */}
          <div className="flex md:hidden flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-sm font-bold text-foreground">Alerts</h1>
                <p className="text-xs text-muted-foreground truncate max-w-[130px]">{asset?.asset_name || 'Asset'}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-[hsl(var(--status-critical))] text-[hsl(var(--status-critical))]">
                  {activeAlerts.length}
                </Badge>
                <DMSLogo size="sm" />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={onLogout}
                  className="transition-smooth hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Activity className="w-5 h-5 text-primary animate-pulse" strokeWidth={2.5} />
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                DMS Insight<sup className="text-xs text-primary">™</sup>
              </h1>
            </div>
            {/* Navigation */}
            <PageNavigation 
              showAssetActionsSelector={true}
              currentAssetType={assetType}
              currentAssetId={assetId}
              breadcrumbs={[
                { label: 'Asset Dashboard', link: '/dashboard' },
                { label: assetTypeNames[assetType], link: `/assets/${assetType}` },
                { label: asset?.asset_name || 'Asset', link: `/assets/${assetType}/${assetId}` },
                { label: 'Alerts', link: null }
              ]}
            />
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex flex-col items-center">
                  <DMSLogo size="sm" />
                  <p className="text-[10px] font-semibold text-primary tracking-wider mt-1">FROM DATA TO DECISIONS</p>
                </div>
                <div className="border-l border-border h-8 mx-2" />
                <div>
                  <h1 className="text-xl font-bold text-foreground">Asset Alerts</h1>
                  <p className="text-xs text-muted-foreground">{asset?.asset_name || 'Asset'}</p>
                </div>
              </div>
              <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-3">
                <Activity className="w-7 h-7 text-primary animate-pulse" strokeWidth={2.5} />
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent drop-shadow-sm tracking-tight">
                    DMS Insight<sup className="text-base ml-0.5 text-primary">™</sup>
                  </h1>
                  <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 rounded-full mt-1"></div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-[hsl(var(--status-critical))] text-[hsl(var(--status-critical))]">
                  {activeAlerts.length} Active
                </Badge>
                <Button 
                  variant="outline" 
                  onClick={onLogout}
                  className="transition-smooth hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
            {/* Navigation */}
            <PageNavigation 
              showAssetActionsSelector={true}
              currentAssetType={assetType}
              currentAssetId={assetId}
              breadcrumbs={[
                { label: 'Asset Dashboard', link: '/dashboard' },
                { label: assetTypeNames[assetType], link: `/assets/${assetType}` },
                { label: asset?.asset_name || 'Asset', link: `/assets/${assetType}/${assetId}` },
                { label: 'Alerts', link: null }
              ]}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Alerts & Notifications</h2>
          <p className="text-lg text-muted-foreground">
            Monitor and manage alerts for {asset?.asset_name}
          </p>
        </div>

        {/* Alert Statistics */}
        <Card className="mb-8 border-border/50 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="w-5 h-5 mr-2 text-primary" />
              Alert Statistics (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground mb-1">9</p>
                <p className="text-sm text-muted-foreground">Total Alerts</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-[hsl(var(--status-critical))] mb-1">2</p>
                <p className="text-sm text-muted-foreground">Critical</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-[hsl(var(--status-warning))] mb-1">4</p>
                <p className="text-sm text-muted-foreground">Warning</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary mb-1">3</p>
                <p className="text-sm text-muted-foreground">Info</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Active and Resolved Alerts */}
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="active" className="relative">
              Active Alerts
              {activeAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[hsl(var(--status-critical))] text-white text-xs rounded-full flex items-center justify-center">
                  {activeAlerts.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>

          {/* Active Alerts Tab */}
          <TabsContent value="active" className="space-y-4">
            {activeAlerts.length === 0 ? (
              <Card className="border-border/50 shadow-md">
                <CardContent className="p-12 text-center">
                  <CheckCircle2 className="w-16 h-16 text-[hsl(var(--status-healthy))] mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Active Alerts</h3>
                  <p className="text-muted-foreground">All systems operating normally</p>
                </CardContent>
              </Card>
            ) : (
              activeAlerts.map((alert) => {
                const Icon = alert.icon;
                return (
                  <Card key={alert.alert_id} className="border-border/50 shadow-md hover:shadow-lg transition-smooth">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            alert.severity === 'critical' ? 'bg-[hsl(var(--status-critical))]/10' :
                            alert.severity === 'warning' ? 'bg-[hsl(var(--status-warning))]/10' :
                            'bg-primary/10'
                          }`}>
                            <Icon className={`w-6 h-6 ${
                              alert.severity === 'critical' ? 'text-[hsl(var(--status-critical))]' :
                              alert.severity === 'warning' ? 'text-[hsl(var(--status-warning))]' :
                              'text-primary'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <CardTitle className="text-lg">{alert.title}</CardTitle>
                              {getSeverityBadge(alert.severity)}
                            </div>
                            <CardDescription className="text-sm mb-3">
                              {alert.message}
                            </CardDescription>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(alert.triggered_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button 
                          variant="outline" 
                          className="flex-1 transition-smooth"
                          onClick={() => handleAcknowledge(alert.alert_id)}
                        >
                          <Bell className="w-4 h-4 mr-2" />
                          Acknowledge
                        </Button>
                        {alert.actionRequired && (
                          <Button 
                            className="flex-1 bg-primary hover:bg-primary-dark transition-smooth"
                            onClick={() => handleResolve(alert.alert_id)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Mark as Resolved
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* Resolved Alerts Tab */}
          <TabsContent value="resolved" className="space-y-4">
            {resolvedAlerts.length === 0 ? (
              <Card className="border-border/50 shadow-md">
                <CardContent className="p-12 text-center">
                  <Info className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Resolved Alerts</h3>
                  <p className="text-muted-foreground">No alerts have been resolved yet</p>
                </CardContent>
              </Card>
            ) : (
              resolvedAlerts.map((alert) => {
                const Icon = alert.icon;
                return (
                  <Card key={alert.alert_id} className="border-border/50 shadow-md opacity-80">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="w-12 h-12 rounded-lg bg-[hsl(var(--status-healthy))]/10 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-6 h-6 text-[hsl(var(--status-healthy))]" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <CardTitle className="text-lg">{alert.title}</CardTitle>
                              <Badge variant="outline" className="border-[hsl(var(--status-healthy))] text-[hsl(var(--status-healthy))]">
                                {alert.status === 'resolved' ? 'Resolved' : 'Acknowledged'}
                              </Badge>
                            </div>
                            <CardDescription className="text-sm mb-3">
                              {alert.message}
                            </CardDescription>
                            <div className="space-y-1">
                              <div className="flex items-center text-xs text-muted-foreground">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Triggered: {new Date(alert.triggered_at).toLocaleString()}
                              </div>
                              {alert.resolved_at && (
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Resolved: {new Date(alert.resolved_at).toLocaleString()}
                                </div>
                              )}
                              {alert.acknowledged_at && !alert.resolved_at && (
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Bell className="w-3 h-3 mr-1" />
                                  Acknowledged: {new Date(alert.acknowledged_at).toLocaleString()} by {alert.acknowledged_by}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};
