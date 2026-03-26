import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { DMSLogo } from '../components/DMSLogo';
import { PageNavigation } from '../components/PageNavigation';
import { LoadingSpinner, ErrorMessage } from '../components/LoadingStates';
import { useAPIData } from '../hooks/useAPI';
import { assetsAPI, testRecordsAPI } from '../services/api';
import { 
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  ThermometerSun,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Calendar,
  LogOut
} from 'lucide-react';

// Asset-specific parameter definitions
const assetParameters = {
  transformer: {
    params: [
      { name: 'Vibration Velocity', unit: 'mm/s', weight: 0.5, color: 'rgb(59, 130, 246)' },
      { name: 'Oil Temperature', unit: '°C', weight: 0.3, color: 'rgb(249, 115, 22)' },
      { name: 'Oil Quality Index', unit: '%', weight: 0.2, color: 'rgb(34, 197, 94)' }
    ]
  },
  motors: {
    params: [
      { name: 'Vibration Velocity', unit: 'mm/s', weight: 0.5, color: 'rgb(59, 130, 246)' },
      { name: 'Bearing Temperature', unit: '°C', weight: 0.3, color: 'rgb(249, 115, 22)' },
      { name: 'Current Draw', unit: 'A', weight: 0.2, color: 'rgb(34, 197, 94)' }
    ]
  },
  generators: {
    params: [
      { name: 'Vibration Velocity', unit: 'mm/s', weight: 0.4, color: 'rgb(59, 130, 246)' },
      { name: 'Winding Temperature', unit: '°C', weight: 0.3, color: 'rgb(249, 115, 22)' },
      { name: 'Frequency Stability', unit: 'Hz', weight: 0.3, color: 'rgb(34, 197, 94)' }
    ]
  },
  switchgear: {
    params: [
      { name: 'Contact Resistance', unit: 'µΩ', weight: 0.5, color: 'rgb(59, 130, 246)' },
      { name: 'Operating Temperature', unit: '°C', weight: 0.3, color: 'rgb(249, 115, 22)' },
      { name: 'Insulation Resistance', unit: 'MΩ', weight: 0.2, color: 'rgb(34, 197, 94)' }
    ]
  },
  cables: {
    params: [
      { name: 'Insulation Resistance', unit: 'MΩ', weight: 0.5, color: 'rgb(59, 130, 246)' },
      { name: 'Cable Temperature', unit: '°C', weight: 0.3, color: 'rgb(249, 115, 22)' },
      { name: 'Capacitance', unit: 'nF', weight: 0.2, color: 'rgb(34, 197, 94)' }
    ]
  },
  ups: {
    params: [
      { name: 'Battery Voltage', unit: 'V', weight: 0.4, color: 'rgb(59, 130, 246)' },
      { name: 'Battery Temperature', unit: '°C', weight: 0.3, color: 'rgb(249, 115, 22)' },
      { name: 'Load Percentage', unit: '%', weight: 0.3, color: 'rgb(34, 197, 94)' }
    ]
  }
};

// Generate 24 months of historical data with a critical event
const generateHistoricalData = (assetType) => {
  const data = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 24);
  
  for (let i = 0; i < 24; i++) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + i);
    
    // Create a critical event around month 16-18
    const isCriticalPeriod = i >= 16 && i <= 18;
    const isRecovery = i === 18;
    
    const p1 = isCriticalPeriod ? (i === 17 ? 8.5 : 6.2) : (3.5 + Math.random() * 0.8);
    const p2 = isCriticalPeriod ? (i === 17 ? 85 : 78) : (65 + Math.random() * 5);
    const p3 = isCriticalPeriod ? (i === 17 ? 45 : 62) : (85 + Math.random() * 8);
    
    const ahi = isCriticalPeriod ? (i === 17 ? 48 : 58) : (82 + Math.random() * 12);
    
    data.push({
      month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      param1: Number(p1.toFixed(1)),
      param2: Number(p2.toFixed(1)),
      param3: Number(p3.toFixed(1)),
      ahi: Number(ahi.toFixed(0))
    });
  }
  
  return data;
};

export const AssetAnalyticsPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const { assetType, assetId } = useParams();

  // Fetch asset data from API
  const { data: asset, loading: assetLoading, error: assetError } = useAPIData(
    () => assetsAPI.getById(assetId),
    [assetId]
  );

  // Fetch test records from API for analytics
  const { data: testRecords, loading: recordsLoading, error: recordsError } = useAPIData(
    () => testRecordsAPI.getAll({ asset_id: assetId }),
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
  
  // Get asset-specific parameters
  const paramConfig = assetParameters[assetType] || assetParameters.transformer;
  const historicalData = useMemo(() => generateHistoricalData(assetType), [assetType]);
  
  // Calculate predictive metrics based on asset health score
  const currentAHI = asset?.health_score || 85;
  const previousAHI = historicalData[historicalData.length - 2]?.ahi || currentAHI;
  const degradationRate = previousAHI - currentAHI;
  const pof = Math.max(5, Math.min(95, 100 - currentAHI + (degradationRate * 2)));
  const monthsToFailure = degradationRate > 0 ? Math.ceil((currentAHI - 50) / degradationRate) : 24;
  const predictedFailureDate = new Date();
  predictedFailureDate.setMonth(predictedFailureDate.getMonth() + monthsToFailure);
  
  // Calculate risk scores for heatmap
  const calculateRiskScore = (currentVal, previousVal, weight) => {
    const roc = Math.abs((currentVal - previousVal) / previousVal);
    return roc * weight * 100;
  };

  // Mock analytics data
  const kpiMetrics = [
    {
      title: 'Uptime',
      value: '98.5%',
      change: '+2.3%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-[hsl(var(--status-healthy))]',
      bgColor: 'bg-[hsl(var(--status-healthy))]/10'
    },
    {
      title: 'Efficiency',
      value: '92.8%',
      change: '+1.5%',
      trend: 'up',
      icon: Zap,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Load Factor',
      value: '78.2%',
      change: '-0.8%',
      trend: 'down',
      icon: Gauge,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10'
    },
    {
      title: 'Avg Temperature',
      value: '68°C',
      change: '+3.2°C',
      trend: 'up',
      icon: ThermometerSun,
      color: 'text-[hsl(var(--status-warning))]',
      bgColor: 'bg-[hsl(var(--status-warning))]/10'
    }
  ];

  const insights = [
    {
      title: 'Optimal Performance Window',
      description: 'Asset operates most efficiently between 6 AM - 10 PM',
      type: 'positive',
      icon: TrendingUp
    },
    {
      title: 'Temperature Trend',
      description: 'Average operating temperature increased by 3.2°C this month',
      type: 'warning',
      icon: ThermometerSun
    },
    {
      title: 'Maintenance Correlation',
      description: 'Efficiency improved by 5% post last maintenance cycle',
      type: 'positive',
      icon: TrendingUp
    },
    {
      title: 'Load Pattern Analysis',
      description: 'Peak load hours: 9 AM - 5 PM on weekdays',
      type: 'info',
      icon: Gauge
    }
  ];

  // Show loading state
  if (assetLoading || recordsLoading) {
    return (
      <div className="min-h-screen">
        <LoadingSpinner size="lg" text="Loading analytics..." />
      </div>
    );
  }

  // Show error state
  if (assetError || recordsError) {
    return (
      <div className="min-h-screen">
        <ErrorMessage error={assetError || recordsError} retry={() => window.location.reload()} />
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
                <h1 className="text-sm font-bold text-foreground">Analytics</h1>
                <p className="text-xs text-muted-foreground truncate max-w-[150px]">{asset?.asset_name || 'Asset'}</p>
              </div>
              <div className="flex items-center gap-3">
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
                { label: 'Analytics', link: null }
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
                  <h1 className="text-xl font-bold text-foreground">Asset Analytics</h1>
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
              <Button 
                variant="outline" 
                onClick={onLogout}
                className="transition-smooth hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
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
                { label: 'Analytics', link: null }
              ]}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Performance Analytics</h2>
          <p className="text-lg text-muted-foreground">
            Detailed insights and trends for {asset?.asset_name}
          </p>
        </div>

        {/* Two Column Layout: Chart + Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column: Asset Health Analysis Chart */}
          <Card className="border-border/50 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2 text-primary" />
                Asset Health Analysis
              </CardTitle>
              <CardDescription>
                Historical trends (24 months)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Top Pane: Line Chart */}
              <div className="mb-6">
                <div className="relative h-64 bg-muted/20 rounded-lg p-4 border border-border">
                  {/* Y-Axis Labels - Left (Parameters) */}
                  <div className="absolute left-0 top-0 bottom-10 flex flex-col justify-between text-xs text-muted-foreground w-8">
                    <span>10</span>
                    <span>8</span>
                    <span>6</span>
                    <span>4</span>
                    <span>2</span>
                    <span>0</span>
                  </div>
                  
                  {/* Y-Axis Labels - Right (AHI) */}
                  <div className="absolute right-0 top-0 bottom-10 flex flex-col justify-between text-xs text-muted-foreground w-8 items-end pr-1">
                    <span>100</span>
                    <span>80</span>
                    <span>60</span>
                    <span>40</span>
                    <span>20</span>
                    <span>0</span>
                  </div>
                  
                  {/* Chart Area */}
                  <div className="absolute left-8 right-8 top-4 bottom-10">
                    {/* Reference Lines */}
                    <div className="absolute inset-0">
                      {/* AHI Warning Line (70) */}
                      <div className="absolute left-0 right-0 border-t-2 border-dashed border-yellow-500/50" style={{ top: '30%' }}>
                        <span className="absolute right-0 -top-3 text-xs text-yellow-600 bg-background px-1">Warning (70)</span>
                      </div>
                      {/* AHI Critical Line (50) */}
                      <div className="absolute left-0 right-0 border-t-2 border-dashed border-red-500/50" style={{ top: '50%' }}>
                        <span className="absolute right-0 -top-3 text-xs text-red-600 bg-background px-1">Critical (50)</span>
                      </div>
                    </div>
                    
                    {/* SVG Chart */}
                    <svg className="w-full h-full" viewBox="0 0 1000 240" preserveAspectRatio="none">
                      {/* Grid Lines */}
                      <line x1="0" y1="48" x2="1000" y2="48" stroke="currentColor" strokeWidth="1" opacity="0.1" />
                      <line x1="0" y1="96" x2="1000" y2="96" stroke="currentColor" strokeWidth="1" opacity="0.1" />
                      <line x1="0" y1="144" x2="1000" y2="144" stroke="currentColor" strokeWidth="1" opacity="0.1" />
                      <line x1="0" y1="192" x2="1000" y2="192" stroke="currentColor" strokeWidth="1" opacity="0.1" />
                      
                      {/* Parameter 1 Line */}
                      <polyline
                        fill="none"
                        stroke={paramConfig.params[0].color}
                        strokeWidth="3"
                        points={historicalData.map((d, i) => 
                          `${(i / (historicalData.length - 1)) * 1000},${240 - (d.param1 / 10) * 240}`
                        ).join(' ')}
                      />
                      
                      {/* Parameter 2 Line */}
                      <polyline
                        fill="none"
                        stroke={paramConfig.params[1].color}
                        strokeWidth="3"
                        points={historicalData.map((d, i) => 
                          `${(i / (historicalData.length - 1)) * 1000},${240 - (d.param2 / 100) * 240}`
                        ).join(' ')}
                      />
                      
                      {/* Parameter 3 Line */}
                      <polyline
                        fill="none"
                        stroke={paramConfig.params[2].color}
                        strokeWidth="3"
                        points={historicalData.map((d, i) => 
                          `${(i / (historicalData.length - 1)) * 1000},${240 - (d.param3 / 100) * 240}`
                        ).join(' ')}
                      />
                      
                      {/* AHI Line */}
                      <polyline
                        fill="none"
                        stroke="rgb(139, 92, 246)"
                        strokeWidth="4"
                        strokeDasharray="5,5"
                        points={historicalData.map((d, i) => 
                          `${(i / (historicalData.length - 1)) * 1000},${240 - (d.ahi / 100) * 240}`
                        ).join(' ')}
                      />
                    </svg>
                  </div>
                  
                  {/* X-Axis Labels */}
                  <div className="absolute left-8 right-8 bottom-0 h-10 flex justify-between items-end text-xs text-muted-foreground">
                    {historicalData.filter((_, i) => i % 6 === 0).map((d, i) => (
                      <span key={i}>{d.month}</span>
                    ))}
                  </div>
                </div>
                
                {/* Chart Legend */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {paramConfig.params.map((param, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <div className="w-6 h-1 rounded" style={{ backgroundColor: param.color }} />
                      <span className="text-xs text-muted-foreground truncate">{param.name}</span>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2 col-span-2">
                    <div className="w-6 h-1 rounded bg-purple-500" style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgb(139, 92, 246), rgb(139, 92, 246) 5px, transparent 5px, transparent 10px)' }} />
                    <span className="text-xs text-muted-foreground">AHI Score</span>
                  </div>
                </div>
              </div>
              
              {/* Bottom Pane: Risk Heatmap */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-2">Risk Heatmap</h3>
                <div className="space-y-1">
                  {paramConfig.params.map((param, paramIdx) => (
                    <div key={paramIdx} className="flex items-center space-x-2">
                      <div className="w-20 text-xs text-muted-foreground truncate" title={param.name}>{param.name}</div>
                      <div className="flex-1 flex space-x-0.5 h-6">
                        {historicalData.map((d, i) => {
                          if (i === 0) return <div key={i} className="flex-1 bg-white border border-border/30" />;
                          const prev = historicalData[i - 1];
                          const curr = d;
                          const paramKey = `param${paramIdx + 1}`;
                          const riskScore = calculateRiskScore(curr[paramKey], prev[paramKey], param.weight);
                          const color = riskScore < 20 ? 'rgb(255, 255, 255)' : 
                                       riskScore < 40 ? 'rgb(254, 240, 138)' :
                                       riskScore < 60 ? 'rgb(253, 224, 71)' :
                                       riskScore < 80 ? 'rgb(251, 146, 60)' : 'rgb(239, 68, 68)';
                          return (
                            <div 
                              key={i} 
                              className="flex-1 border border-border/30"
                              style={{ backgroundColor: color }}
                              title={`${param.name}: ${riskScore.toFixed(1)}% risk`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Heatmap Legend */}
                <div className="flex items-center justify-between mt-3 text-xs">
                  <span className="text-muted-foreground">Risk:</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-3 bg-white border border-border" />
                    <div className="w-4 h-3 bg-yellow-200" />
                    <div className="w-4 h-3 bg-orange-400" />
                    <div className="w-4 h-3 bg-red-500" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column: AI-Powered Insights */}
          <Card className="border-border/50 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2 text-accent" />
                AI-Powered Insights
              </CardTitle>
              <CardDescription>
                Intelligent recommendations based on historical data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.map((insight, index) => {
                  const Icon = insight.icon;
                  const getBgColor = () => {
                    if (insight.type === 'positive') return 'bg-[hsl(var(--status-healthy))]/10';
                    if (insight.type === 'warning') return 'bg-[hsl(var(--status-warning))]/10';
                    return 'bg-primary/10';
                  };
                  const getIconColor = () => {
                    if (insight.type === 'positive') return 'text-[hsl(var(--status-healthy))]';
                    if (insight.type === 'warning') return 'text-[hsl(var(--status-warning))]';
                    return 'text-primary';
                  };
                  
                  return (
                    <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-smooth">
                      <div className={`w-10 h-10 rounded-lg ${getBgColor()} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${getIconColor()}`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Predictive Failure Summary */}
        <Card className="mb-8 border-primary/30 shadow-lg bg-gradient-to-br from-primary/5 to-purple-500/5">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Predictive Failure Summary
            </CardTitle>
            <CardDescription>
              AI-powered predictive maintenance analytics based on current degradation trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Probability of Failure */}
              <div className="p-6 rounded-lg border-2 border-border bg-background">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Current Probability of Failure (PoF)</span>
                  <AlertTriangle className={`w-5 h-5 ${pof > 70 ? 'text-red-500' : pof > 40 ? 'text-yellow-500' : 'text-green-500'}`} />
                </div>
                <div className="mb-4">
                  <span className={`text-5xl font-bold ${pof > 70 ? 'text-red-500' : pof > 40 ? 'text-yellow-500' : 'text-green-500'}`}>
                    {pof.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all ${pof > 70 ? 'bg-red-500' : pof > 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${pof}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Based on current Asset Health Index: {currentAHI}
                </p>
              </div>
              
              {/* Predicted Time to Failure */}
              <div className="p-6 rounded-lg border-2 border-border bg-background">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Predicted Time to Failure (PTTF)</span>
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-foreground">
                    {predictedFailureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <p className="text-sm text-muted-foreground mt-1">
                    (~{monthsToFailure} months)
                  </p>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/50">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <p className="text-xs">
                    {monthsToFailure < 6 ? 'Urgent: Schedule maintenance immediately' :
                     monthsToFailure < 12 ? 'Plan maintenance within next quarter' :
                     'Continue routine monitoring'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Additional Context */}
            <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Predictions are based on historical degradation patterns and assume no intervention. 
                Actual failure time may vary based on operating conditions, maintenance actions, and environmental factors.
                {currentAHI < 60 && ' ⚠️ Current health score is below recommended threshold - immediate attention recommended.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpiMetrics.map((metric, index) => {
            const Icon = metric.icon;
            const TrendIcon = metric.trend === 'up' ? ArrowUpRight : ArrowDownRight;
            return (
              <Card key={index} className="border-border/50 shadow-md hover:shadow-lg transition-smooth">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg ${metric.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${metric.color}`} />
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${metric.trend === 'up' ? 'border-[hsl(var(--status-healthy))] text-[hsl(var(--status-healthy))]' : 'border-[hsl(var(--status-warning))] text-[hsl(var(--status-warning))]'}`}
                    >
                      <TrendIcon className="w-3 h-3 mr-1" />
                      {metric.change}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{metric.title}</p>
                  <p className={`text-3xl font-bold ${metric.color}`}>{metric.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
};
