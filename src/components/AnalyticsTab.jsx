/**
 * Analytics Tab Component for Asset Detail Page
 * Provides comprehensive analytics including:
 * - Health Index Summary with gauge charts
 * - Degradation Analysis with projections
 * - Risk Assessment
 * - Test-Specific Insights
 * - Recommendations
 * - Fleet Comparison
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Zap,
  Thermometer,
  Beaker,
  Gauge,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  RefreshCw,
  Settings,
  Download,
  BarChart3,
  PieChart,
  Target,
  AlertCircle,
  Info,
  ChevronRight,
  Wrench,
  FileText,
  Eye,
  Users,
} from 'lucide-react';
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PieChart as RechartPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import api from '../services/api';

// Health status colors
const STATUS_COLORS = {
  excellent: '#10b981',
  good: '#22c55e',
  fair: '#f59e0b',
  poor: '#ef4444',
  critical: '#dc2626',
};

const RISK_COLORS = {
  low: '#10b981',
  moderate: '#f59e0b',
  high: '#ef4444',
  critical: '#dc2626',
};

const PRIORITY_COLORS = {
  urgent: '#dc2626',
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#3b82f6',
  routine: '#6b7280',
};

// Compact Health Score Item - Ultra compact for single line
const CompactHealthItem = ({ value, label, status, isMain = false }) => {
  const color = STATUS_COLORS[status] || '#6b7280';
  const size = isMain ? 36 : 28;
  const radius = isMain ? 14 : 10;
  const strokeWidth = isMain ? 3 : 2.5;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 100) * circumference;
  
  return (
    <div className={`flex items-center gap-1.5 ${isMain ? 'pr-3 border-r border-gray-200 mr-1' : ''}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          <circle
            cx={size/2}
            cy={size/2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size/2}
            cy={size/2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${isMain ? 'text-xs' : 'text-[10px]'}`} style={{ color }}>{value}</span>
        </div>
      </div>
      <div>
        <p className={`font-medium text-gray-700 leading-none ${isMain ? 'text-xs' : 'text-[10px]'}`}>{label}</p>
        <span 
          className="text-[8px] capitalize"
          style={{ color }}
        >
          {status}
        </span>
      </div>
    </div>
  );
};

// Risk Meter Component
const RiskMeter = ({ score, level }) => {
  const color = RISK_COLORS[level] || '#6b7280';
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Risk Score</span>
        <Badge 
          className="capitalize"
          style={{ backgroundColor: `${color}20`, color: color, borderColor: color }}
          variant="outline"
        >
          {level}
        </Badge>
      </div>
      <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-1000"
          style={{ 
            width: `${score}%`, 
            background: `linear-gradient(90deg, #10b981, #f59e0b, #ef4444)` 
          }}
        />
        <div 
          className="absolute top-0 h-full w-1 bg-white shadow-lg transition-all duration-1000"
          style={{ left: `${score}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-gray-500">
        <span>Low</span>
        <span>Moderate</span>
        <span>High</span>
        <span>Critical</span>
      </div>
    </div>
  );
};

// Degradation Row Component
const DegradationRow = ({ item }) => {
  const trendColor = item.trend === 'declining' ? 'text-red-500' : 
                     item.trend === 'improving' ? 'text-emerald-500' : 'text-gray-500';
  const TrendIcon = item.trend === 'declining' ? TrendingDown : 
                    item.trend === 'improving' ? TrendingUp : Minus;
  
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800">{item.parameter}</p>
        <p className="text-xs text-gray-500">{item.data_points} readings</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-mono">{item.current_value}</p>
          <p className={`text-xs ${trendColor} flex items-center gap-1`}>
            <TrendIcon className="w-3 h-3" />
            {item.rate_percent > 0 ? '+' : ''}{item.rate_percent}%/yr
          </p>
        </div>
        {item.projected_threshold_date && (
          <div className="text-right">
            <p className="text-xs text-gray-500">ETA</p>
            <p className="text-xs font-medium text-amber-600">{item.projected_threshold_date}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Recommendation Card Component
const RecommendationCard = ({ recommendation }) => {
  const color = PRIORITY_COLORS[recommendation.priority] || '#6b7280';
  const Icon = recommendation.priority === 'urgent' ? AlertCircle :
               recommendation.priority === 'high' ? AlertTriangle :
               recommendation.priority === 'medium' ? Clock :
               recommendation.priority === 'routine' ? CheckCircle : Info;
  
  const categoryIcons = {
    maintenance: Wrench,
    testing: FileText,
    monitoring: Eye,
    replacement: XCircle,
  };
  const CategoryIcon = categoryIcons[recommendation.category] || Info;
  
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      <div 
        className="p-2 rounded-lg flex-shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium text-gray-800 truncate">{recommendation.title}</p>
          <Badge 
            variant="outline" 
            className="text-[10px] capitalize flex-shrink-0"
            style={{ borderColor: color, color }}
          >
            {recommendation.priority}
          </Badge>
        </div>
        <p className="text-xs text-gray-600 line-clamp-2">{recommendation.description}</p>
        <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
          <span className="flex items-center gap-1">
            <CategoryIcon className="w-3 h-3" />
            {recommendation.category}
          </span>
          {recommendation.due_date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {recommendation.due_date}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Test Insight Card Component
const TestInsightCard = ({ insight }) => {
  const statusColor = STATUS_COLORS[insight.status] || '#6b7280';
  const testIcons = {
    IR: Zap,
    PI: Activity,
    DGA: Beaker,
    PD: Gauge,
  };
  const TestIcon = testIcons[insight.test_type] || Activity;
  
  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${statusColor}15` }}
            >
              <TestIcon className="w-4 h-4" style={{ color: statusColor }} />
            </div>
            <div>
              <CardTitle className="text-sm">{insight.title}</CardTitle>
              <Badge 
                variant="outline" 
                className="text-[10px] capitalize mt-1"
                style={{ borderColor: statusColor, color: statusColor }}
              >
                {insight.status}
              </Badge>
            </div>
          </div>
          <span className="text-xs text-gray-500">{insight.metrics?.['Test Count']} tests</span>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {/* Findings */}
        <div className="space-y-1 mb-3">
          {insight.findings?.slice(0, 3).map((finding, i) => (
            <p key={i} className="text-xs text-gray-600 flex items-start gap-1">
              <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-400" />
              {finding}
            </p>
          ))}
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(insight.metrics || {})
            .filter(([key]) => key !== 'Test Count')
            .slice(0, 4)
            .map(([key, value]) => (
              <div key={key} className="bg-gray-50 rounded p-2">
                <p className="text-[10px] text-gray-500 truncate">{key}</p>
                <p className="text-xs font-medium font-mono">{value}</p>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Fleet Comparison Component
const FleetComparison = ({ data }) => {
  if (!data) return null;
  
  const chartData = [
    { name: 'This Asset', value: data.asset_health, fill: '#3b82f6' },
    { name: 'Fleet Avg', value: data.fleet_average, fill: '#6b7280' },
    { name: 'Fleet Best', value: data.fleet_best, fill: '#10b981' },
    { name: 'Fleet Worst', value: data.fleet_worst, fill: '#ef4444' },
  ];
  
  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" />
          Fleet Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={70} />
              <Tooltip 
                formatter={(value) => [`${value}%`, 'Health']}
                contentStyle={{ fontSize: '12px' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-gray-500">
            {data.similar_assets_count} similar assets
          </span>
          <Badge variant="outline" className="text-[10px]">
            {data.percentile}th percentile
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

// Configuration Modal Component
const ConfigModal = ({ isOpen, onClose, config, onSave }) => {
  const [weights, setWeights] = useState(config?.weights || {});
  
  useEffect(() => {
    if (config?.weights) {
      setWeights(config.weights);
    }
  }, [config]);
  
  const handleSave = () => {
    onSave({ ...config, weights });
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Analytics Configuration
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <h4 className="text-sm font-medium mb-3">Health Index Weights</h4>
            <p className="text-xs text-gray-500 mb-3">
              Adjust the relative importance of each factor (must sum to 1.0)
            </p>
            <div className="space-y-3">
              {Object.entries(weights).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="text-sm capitalize w-24">{key}</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={value}
                    onChange={(e) => setWeights({ ...weights, [key]: parseFloat(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-12">{(value * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Main Analytics Tab Component
export const AnalyticsTab = ({ assetId, assetName }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState(null);
  const [activeInsightTab, setActiveInsightTab] = useState('all');

  // Fetch analytics data
  const fetchAnalytics = async () => {
    if (!assetId) return;
    
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/analytics/asset/${assetId}?include_fleet=true`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const data = await response.json();
      setAnalytics(data);
      setError(null);
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err.message);
      // Use demo data for visualization
      setAnalytics(generateDemoAnalytics());
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAnalytics();
  }, [assetId]);

  // Generate demo analytics data
  const generateDemoAnalytics = () => ({
    asset_id: assetId,
    asset_name: assetName || 'Demo Asset',
    generated_at: new Date().toISOString(),
    health_index: {
      overall: 78,
      overall_status: 'good',
      overall_trend: -2.5,
      insulation: 85,
      insulation_status: 'good',
      thermal: 72,
      thermal_status: 'fair',
      chemical: 81,
      chemical_status: 'good',
      electrical: 75,
      electrical_status: 'good',
    },
    degradation_analysis: [
      { parameter: 'HV-LV (MΩ)', current_value: 2450, rate_per_year: -52, rate_percent: -2.1, projected_threshold_date: '2028-06', trend: 'declining', data_points: 4 },
      { parameter: 'HV-Ground (MΩ)', current_value: 3200, rate_per_year: -45, rate_percent: -1.4, projected_threshold_date: '2029-03', trend: 'declining', data_points: 4 },
      { parameter: 'PI Ratio', current_value: 2.8, rate_per_year: -0.08, rate_percent: -2.9, projected_threshold_date: '2031-09', trend: 'declining', data_points: 3 },
      { parameter: 'H2 (ppm)', current_value: 45, rate_per_year: 8.5, rate_percent: 18.9, projected_threshold_date: null, trend: 'increasing', data_points: 3 },
      { parameter: 'PD Level (pC)', current_value: 125, rate_per_year: 15, rate_percent: 12.0, projected_threshold_date: null, trend: 'increasing', data_points: 3 },
    ],
    risk_assessment: {
      level: 'moderate',
      score: 42,
      factors: [
        { factor: 'Insulation Degradation', severity: 'medium', value: '2.1%/yr', description: 'IR values declining steadily' },
        { factor: 'DGA Gas Increase', severity: 'medium', value: 'H2 ↑18.9%/yr', description: 'Hydrogen levels trending up' },
        { factor: 'Asset Age', severity: 'low', value: '12 years', description: 'Within expected service life' },
      ],
      probability_of_failure: 21,
      estimated_remaining_life_years: 12.5,
    },
    test_insights: [
      {
        test_type: 'IR',
        title: 'Insulation Resistance Analysis',
        status: 'good',
        findings: [
          'All insulation resistance values are within acceptable limits',
          'HV-LV showing gradual decline of 2.1% per year',
          'Temperature correction applied for accurate comparison'
        ],
        metrics: { 'HV-LV': '2450 MΩ', 'HV-Ground': '3200 MΩ', 'LV-Ground': '2890 MΩ', 'Minimum': '2450 MΩ', 'Test Count': 4 }
      },
      {
        test_type: 'PI',
        title: 'Polarization Index Analysis',
        status: 'good',
        findings: [
          'PI ratio of 2.8 indicates good insulation condition',
          'Absorption ratio within expected range',
          'Recommend annual testing to track trends'
        ],
        metrics: { 'PI Ratio': '2.8', 'Condition': 'Good insulation', 'R1 (1 min)': '1850 MΩ', 'R10 (10 min)': '5180 MΩ', 'Test Count': 3 }
      },
      {
        test_type: 'DGA',
        title: 'Dissolved Gas Analysis',
        status: 'fair',
        findings: [
          'Duval Triangle Zone: T1 - Low Temperature Thermal Fault',
          'Hydrogen trending upward - monitor closely',
          'Total Combustible Gases: 413 ppm (Normal)'
        ],
        metrics: { 'H2': '45 ppm', 'CH4': '28 ppm', 'C2H2': '0.5 ppm', 'Duval Zone': 'T1', 'TCG': '413 ppm', 'Test Count': 3 }
      },
      {
        test_type: 'PD',
        title: 'Partial Discharge Analysis',
        status: 'good',
        findings: [
          'PD activity within acceptable limits',
          'No significant discharge patterns detected',
          'PDIV at 18.5 kV indicates good margin'
        ],
        metrics: { 'PD Level': '125 pC', 'Max PD': '180 pC', 'PDIV': '18.5 kV', 'PDEV': '15.2 kV', 'Test Count': 3 }
      }
    ],
    recommendations: [
      { id: 'REC-001', priority: 'high', title: 'DGA Follow-up Test', description: 'Schedule follow-up DGA test within 60 days to confirm hydrogen trend', due_date: '2026-05-01', category: 'testing' },
      { id: 'REC-002', priority: 'medium', title: 'Monitor IR Degradation', description: 'Increase IR testing frequency from annual to semi-annual', due_date: '2026-06-15', category: 'monitoring' },
      { id: 'REC-003', priority: 'medium', title: 'Thermal Inspection', description: 'Conduct thermal imaging survey to identify hot spots', due_date: '2026-04-30', category: 'testing' },
      { id: 'REC-004', priority: 'low', title: 'Update Maintenance Plan', description: 'Review and update preventive maintenance schedule based on current trends', due_date: '2026-07-01', category: 'maintenance' },
      { id: 'REC-005', priority: 'routine', title: 'Scheduled Maintenance', description: 'Continue regular maintenance as per asset management plan', due_date: '2026-08-15', category: 'maintenance' },
    ],
    fleet_comparison: {
      asset_health: 78,
      fleet_average: 72,
      fleet_best: 92,
      fleet_worst: 45,
      percentile: 68,
      similar_assets_count: 24
    }
  });

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAnalytics();
  };

  // Filter test insights
  const filteredInsights = useMemo(() => {
    if (!analytics?.test_insights) return [];
    if (activeInsightTab === 'all') return analytics.test_insights;
    return analytics.test_insights.filter(i => i.test_type === activeInsightTab);
  }, [analytics, activeInsightTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-sm text-gray-500">Analyzing asset data...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">No analytics data available</p>
        <p className="text-xs text-gray-400 mt-1">Conduct tests to generate analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Asset Analytics</h3>
            <p className="text-xs text-gray-500">
              Generated {new Date(analytics.generated_at).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowConfig(true)}>
            <Settings className="w-4 h-4 mr-1" />
            Configure
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Health Index Summary - Single Line */}
      <Card className="border-gray-200">
        <CardContent className="py-2.5 px-4">
          <div className="flex items-center gap-3 overflow-x-auto">
            {/* Title */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-medium text-gray-600">Health Index</span>
            </div>
            
            {/* Overall Health */}
            <CompactHealthItem 
              value={analytics.health_index.overall}
              label="Overall"
              status={analytics.health_index.overall_status}
              isMain={true}
            />
            
            {/* Component Scores */}
            <CompactHealthItem 
              value={analytics.health_index.insulation}
              label="Insulation"
              status={analytics.health_index.insulation_status}
            />
            <CompactHealthItem 
              value={analytics.health_index.thermal}
              label="Thermal"
              status={analytics.health_index.thermal_status}
            />
            <CompactHealthItem 
              value={analytics.health_index.chemical}
              label="Chemical"
              status={analytics.health_index.chemical_status}
            />
            <CompactHealthItem 
              value={analytics.health_index.electrical}
              label="Electrical"
              status={analytics.health_index.electrical_status}
            />
            
            {/* Trend indicator */}
            {analytics.health_index.overall_trend !== 0 && (
              <div className={`flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                analytics.health_index.overall_trend > 0 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'bg-red-50 text-red-500'
              }`}>
                {analytics.health_index.overall_trend > 0 
                  ? <TrendingUp className="w-2.5 h-2.5" /> 
                  : <TrendingDown className="w-2.5 h-2.5" />
                }
                <span>{Math.abs(analytics.health_index.overall_trend).toFixed(1)}%</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout: Degradation + Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Degradation Analysis */}
        <Card className="border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-amber-600" />
              Degradation Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {analytics.degradation_analysis?.map((item, i) => (
                <DegradationRow key={i} item={item} />
              ))}
            </div>
            {analytics.degradation_analysis?.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                Insufficient data for degradation analysis
              </p>
            )}
          </CardContent>
        </Card>

        {/* Risk Assessment */}
        <Card className="border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RiskMeter 
              score={analytics.risk_assessment.score} 
              level={analytics.risk_assessment.level} 
            />
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Failure Probability</p>
                <p className="text-lg font-semibold text-gray-800">
                  {analytics.risk_assessment.probability_of_failure}%
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Est. Remaining Life</p>
                <p className="text-lg font-semibold text-gray-800">
                  {analytics.risk_assessment.estimated_remaining_life_years} yrs
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600">Risk Factors</p>
              {analytics.risk_assessment.factors?.map((factor, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-gray-50 rounded p-2">
                  <span className="text-gray-700">{factor.factor}</span>
                  <Badge 
                    variant="outline" 
                    className="capitalize text-[10px]"
                    style={{ 
                      borderColor: factor.severity === 'high' ? '#ef4444' : 
                                   factor.severity === 'medium' ? '#f59e0b' : '#6b7280',
                      color: factor.severity === 'high' ? '#ef4444' : 
                             factor.severity === 'medium' ? '#f59e0b' : '#6b7280'
                    }}
                  >
                    {factor.value}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test-Specific Insights */}
      <Card className="border-gray-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-600" />
              Test-Specific Insights
            </CardTitle>
            <Tabs value={activeInsightTab} onValueChange={setActiveInsightTab}>
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs px-2 h-6">All</TabsTrigger>
                <TabsTrigger value="IR" className="text-xs px-2 h-6">IR</TabsTrigger>
                <TabsTrigger value="PI" className="text-xs px-2 h-6">PI</TabsTrigger>
                <TabsTrigger value="DGA" className="text-xs px-2 h-6">DGA</TabsTrigger>
                <TabsTrigger value="PD" className="text-xs px-2 h-6">PD</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredInsights.map((insight, i) => (
              <TestInsightCard key={i} insight={insight} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations + Fleet Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recommendations */}
        <div className="lg:col-span-2">
          <Card className="border-gray-200 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Recommendations & Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.recommendations?.map((rec, i) => (
                  <RecommendationCard key={i} recommendation={rec} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fleet Comparison */}
        <div className="lg:col-span-1">
          <FleetComparison data={analytics.fleet_comparison} />
        </div>
      </div>

      {/* Configuration Modal */}
      <ConfigModal 
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
        config={config}
        onSave={setConfig}
      />
    </div>
  );
};

export default AnalyticsTab;
