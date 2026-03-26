/**
 * Online Monitoring Module - Analytics Page
 * Comprehensive analytics and reporting for PD monitoring
 * Clean, bright white theme
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { ModuleTabs } from '../../components/ModuleTabs';
import { MonitoringNav } from './MonitoringNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  PieChart,
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Calendar,
  Building2,
  Cpu,
  Zap,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { monitoringAPI } from '../../services/api';
import { toast } from 'sonner';

const COLORS = {
  healthy: '#10B981',
  warning: '#F59E0B',
  critical: '#EF4444',
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  tertiary: '#06B6D4'
};

const EQUIPMENT_TYPE_COLORS = {
  power_transformer: '#F59E0B',
  gis_switchgear: '#3B82F6',
  cable_termination: '#10B981',
  cable_joint: '#8B5CF6',
  bushing: '#F97316'
};

const PERIOD_OPTIONS = [
  { value: '7', label: 'Last 7 Days' },
  { value: '14', label: 'Last 14 Days' },
  { value: '30', label: 'Last 30 Days' },
];

const REGION_OPTIONS = [
  { value: 'all', label: 'All Regions' },
  { value: 'central', label: 'Central Region' },
  { value: 'eastern', label: 'Eastern Region' },
  { value: 'southern', label: 'Southern Region' },
  { value: 'western', label: 'Western Region' },
];

export function AnalyticsPage({ onLogout }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7');
  const [selectedRegion, setSelectedRegion] = useState('all');
  
  // Data states
  const [pdTrends, setPdTrends] = useState([]);
  const [healthDistribution, setHealthDistribution] = useState({ by_health_status: {}, by_equipment_type: {} });
  const [alarmStats, setAlarmStats] = useState([]);
  const [regionalData, setRegionalData] = useState([]);
  const [topProblematicEquipment, setTopProblematicEquipment] = useState([]);
  const [summaryStats, setSummaryStats] = useState(null);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const regionParam = selectedRegion !== 'all' ? selectedRegion : null;
      
      // Fetch all analytics data in parallel
      const [trendsRes, healthRes, summaryRes, alarmsRes, equipmentRes] = await Promise.all([
        monitoringAPI.getPDTrends({ days: selectedPeriod, region: regionParam }),
        monitoringAPI.getHealthDistribution(regionParam),
        monitoringAPI.getDashboardSummary(),
        monitoringAPI.getAlarms({ limit: 100 }),
        monitoringAPI.getEquipment({ health_status: 'critical', limit: 10 })
      ]);
      
      setPdTrends(trendsRes.daily_trends || []);
      setHealthDistribution(healthRes);
      setSummaryStats(summaryRes);
      
      // Process alarm data for trend analysis
      const alarms = alarmsRes.alarms || [];
      const alarmsByDate = {};
      alarms.forEach(alarm => {
        const date = new Date(alarm.created_at).toLocaleDateString();
        if (!alarmsByDate[date]) {
          alarmsByDate[date] = { date, critical: 0, warning: 0 };
        }
        if (alarm.severity === 'critical') {
          alarmsByDate[date].critical++;
        } else {
          alarmsByDate[date].warning++;
        }
      });
      setAlarmStats(Object.values(alarmsByDate).slice(-7));
      
      // Get top problematic equipment
      setTopProblematicEquipment(equipmentRes.equipment || []);
      
      // Get regional data
      const regionsRes = await monitoringAPI.getRegions();
      setRegionalData(regionsRes.regions || []);
      
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod, selectedRegion]);

  // Prepare health distribution data for pie chart
  const healthPieData = useMemo(() => {
    const data = healthDistribution.by_health_status || {};
    return [
      { name: 'Healthy', value: data.healthy || 0, color: COLORS.healthy },
      { name: 'Warning', value: data.warning || 0, color: COLORS.warning },
      { name: 'Critical', value: data.critical || 0, color: COLORS.critical },
    ].filter(d => d.value > 0);
  }, [healthDistribution]);

  // Prepare equipment type distribution data
  const equipmentTypeData = useMemo(() => {
    const data = healthDistribution.by_equipment_type || {};
    return Object.entries(data).map(([type, statuses]) => ({
      name: type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      type,
      healthy: statuses.healthy || 0,
      warning: statuses.warning || 0,
      critical: statuses.critical || 0,
      total: (statuses.healthy || 0) + (statuses.warning || 0) + (statuses.critical || 0)
    }));
  }, [healthDistribution]);

  // Calculate trend indicators
  const calculateTrend = (data, key) => {
    if (!data || data.length < 2) return { direction: 'stable', value: 0 };
    const recent = data.slice(-3).reduce((sum, d) => sum + (d[key] || 0), 0) / 3;
    const older = data.slice(0, 3).reduce((sum, d) => sum + (d[key] || 0), 0) / 3;
    const change = older > 0 ? ((recent - older) / older) * 100 : 0;
    return {
      direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
      value: Math.abs(change).toFixed(1)
    };
  };

  const pdTrend = calculateTrend(pdTrends, 'avg_pd_level');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        <AppHeader onLogout={onLogout} />
        <ModuleTabs />
        <MonitoringNav />
        <div className="flex items-center justify-center h-[calc(100vh-128px)]">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-gray-500">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <AppHeader onLogout={onLogout} />
      <ModuleTabs />
      <MonitoringNav />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl shadow-lg shadow-purple-200">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              Analytics
            </h1>
            <p className="text-gray-500 mt-1">PD monitoring insights and trends</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-[160px] bg-white border-gray-200 shadow-sm">
                <Filter className="h-4 w-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                {REGION_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[150px] bg-white border-gray-200 shadow-sm">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchAnalyticsData}
              className="gap-2 bg-white border-gray-200 hover:bg-gray-50 hover:border-blue-300 shadow-sm"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 bg-white shadow-md">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Avg PD Level</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {pdTrends.length > 0 ? pdTrends[pdTrends.length - 1]?.avg_pd_level?.toFixed(1) : '0'} 
                    <span className="text-sm font-normal text-gray-500 ml-1">pC</span>
                  </p>
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  pdTrend.direction === 'up' ? 'text-red-500' : 
                  pdTrend.direction === 'down' ? 'text-emerald-500' : 'text-gray-400'
                }`}>
                  {pdTrend.direction === 'up' ? <ArrowUpRight className="h-4 w-4" /> :
                   pdTrend.direction === 'down' ? <ArrowDownRight className="h-4 w-4" /> :
                   <Minus className="h-4 w-4" />}
                  {pdTrend.value}%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-md">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Critical Assets</p>
                  <p className="text-2xl font-bold text-red-500">
                    {healthDistribution.by_health_status?.critical || 0}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-md">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Active Alarms</p>
                  <p className="text-2xl font-bold text-amber-500">
                    {summaryStats?.alarm_summary?.critical + summaryStats?.alarm_summary?.warning || 0}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-md">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Health Score</p>
                  <p className="text-2xl font-bold text-emerald-500">
                    {summaryStats?.total_equipment > 0 
                      ? Math.round((summaryStats?.health_summary?.healthy / summaryStats?.total_equipment) * 100)
                      : 0}%
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* PD Level Trend Chart */}
          <Card className="border-0 bg-white shadow-lg">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Activity className="h-5 w-5 text-cyan-500" />
                PD Level Trend
              </CardTitle>
              <CardDescription className="text-gray-500">
                Average and maximum PD levels over time
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[280px]">
                {pdTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={pdTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#9CA3AF"
                        tick={{ fill: '#6B7280', fontSize: 11 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        tick={{ fill: '#6B7280', fontSize: 11 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value, name) => [
                          `${value.toFixed(2)} pC`,
                          name === 'avg_pd_level' ? 'Average PD' : 'Max PD'
                        ]}
                      />
                      <defs>
                        <linearGradient id="avgPdGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="maxPdGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="avg_pd_level" 
                        stroke="#06B6D4" 
                        strokeWidth={2}
                        fill="url(#avgPdGradient)"
                        name="avg_pd_level"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="max_pd_level" 
                        stroke="#EF4444" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        fill="url(#maxPdGradient)"
                        name="max_pd_level"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No trend data available
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                  <span className="text-xs text-gray-500">Average PD</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-red-500" style={{ borderStyle: 'dashed' }}></div>
                  <span className="text-xs text-gray-500">Max PD</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health Distribution Pie Chart */}
          <Card className="border-0 bg-white shadow-lg">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <PieChart className="h-5 w-5 text-purple-500" />
                Asset Health Distribution
              </CardTitle>
              <CardDescription className="text-gray-500">
                Current health status breakdown
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[280px]">
                {healthPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={healthPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {healthPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px'
                        }}
                        formatter={(value, name) => [`${value} equipment`, name]}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value) => <span className="text-gray-600 text-sm">{value}</span>}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No health data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Asset Type Breakdown */}
          <Card className="border-0 bg-white shadow-lg">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Cpu className="h-5 w-5 text-blue-500" />
                Health by Asset Type
              </CardTitle>
              <CardDescription className="text-gray-500">
                Status breakdown by asset category
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[280px]">
                {equipmentTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={equipmentTypeData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis type="number" stroke="#9CA3AF" tick={{ fill: '#6B7280', fontSize: 11 }} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        stroke="#9CA3AF" 
                        tick={{ fill: '#6B7280', fontSize: 11 }}
                        width={120}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="healthy" stackId="a" fill={COLORS.healthy} name="Healthy" />
                      <Bar dataKey="warning" stackId="a" fill={COLORS.warning} name="Warning" />
                      <Bar dataKey="critical" stackId="a" fill={COLORS.critical} name="Critical" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No asset data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Regional Comparison */}
          <Card className="border-0 bg-white shadow-lg">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Building2 className="h-5 w-5 text-emerald-500" />
                Regional Comparison
              </CardTitle>
              <CardDescription className="text-gray-500">
                Asset and alarm distribution by region
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[280px]">
                {regionalData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={regionalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="region_name" 
                        stroke="#9CA3AF"
                        tick={{ fill: '#6B7280', fontSize: 10 }}
                        tickFormatter={(value) => value.replace(' Region', '')}
                      />
                      <YAxis stroke="#9CA3AF" tick={{ fill: '#6B7280', fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="equipment_count" fill={COLORS.primary} name="Equipment" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="alarm_count" fill={COLORS.warning} name="Alarms" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No regional data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Problematic Assets Table */}
        <Card className="border-0 bg-white shadow-lg">
          <CardHeader className="border-b border-gray-100 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Critical Assets Requiring Attention
                </CardTitle>
                <CardDescription className="text-gray-500">
                  Assets with critical PD levels or health status
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/monitoring/equipment?health_status=critical')}
                className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              >
                View All Critical
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {topProblematicEquipment.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="pb-3 pr-4">Asset</th>
                      <th className="pb-3 pr-4">Substation</th>
                      <th className="pb-3 pr-4">Type</th>
                      <th className="pb-3 pr-4">PD Level</th>
                      <th className="pb-3 pr-4">Temperature</th>
                      <th className="pb-3 pr-4">Trend</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {topProblematicEquipment.map((eq) => (
                      <tr 
                        key={eq.equipment_id}
                        className="hover:bg-red-50/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/monitoring/equipment/${eq.equipment_id}`)}
                      >
                        <td className="py-3 pr-4">
                          <span className="font-medium text-gray-800">{eq.name}</span>
                        </td>
                        <td className="py-3 pr-4 text-gray-600">{eq.substation_name}</td>
                        <td className="py-3 pr-4">
                          <span className="text-sm text-gray-500 capitalize">
                            {eq.equipment_type?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`font-semibold ${
                            eq.current_readings?.pd_level_pc > 20 ? 'text-red-600' : 'text-amber-600'
                          }`}>
                            {eq.current_readings?.pd_level_pc?.toFixed(1) || 0} pC
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-gray-600">
                          {eq.current_readings?.temperature_c?.toFixed(1) || 0}°C
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1">
                            {eq.trend === 'degrading' ? (
                              <TrendingUp className="h-4 w-4 text-red-500" />
                            ) : eq.trend === 'improving' ? (
                              <TrendingDown className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <Minus className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-sm text-gray-500 capitalize">{eq.trend || 'stable'}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <Badge className="bg-red-100 text-red-700 border-0 font-semibold">
                            Critical
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-emerald-500" />
                </div>
                <p className="text-gray-800 font-medium">No critical equipment</p>
                <p className="text-gray-500 text-sm mt-1">All equipment is operating within normal parameters</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default AnalyticsPage;
