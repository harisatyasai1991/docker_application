/**
 * Online Monitoring Module - Equipment Detail Page
 * Clean, bright white theme
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { ModuleTabs } from '../../components/ModuleTabs';
import { MonitoringNav } from './MonitoringNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  Cpu, 
  ArrowLeft,
  RefreshCw,
  Activity,
  Thermometer,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
  Settings,
  CalendarDays,
  BarChart3,
  ExternalLink,
  ClipboardList,
  Info,
  Crown,
  Phone,
  Mail
} from 'lucide-react';
import { monitoringAPI, assetsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

export function EquipmentDetailPage({ onLogout }) {
  const { equipmentId } = useParams();
  const navigate = useNavigate();
  const { hasModuleAccess } = useAuth();
  const [loading, setLoading] = useState(true);
  const [equipment, setEquipment] = useState(null);
  const [readings, setReadings] = useState([]);
  const [timeRange, setTimeRange] = useState(24);
  
  // Asset Performance module states
  const [showModulePrompt, setShowModulePrompt] = useState(false);
  const [showAssetNotFound, setShowAssetNotFound] = useState(false);
  const [checkingAsset, setCheckingAsset] = useState(false);
  const [linkedAsset, setLinkedAsset] = useState(null);

  const fetchEquipmentData = async () => {
    try {
      setLoading(true);
      const [eqResponse, readingsResponse] = await Promise.all([
        monitoringAPI.getEquipmentDetail(equipmentId),
        monitoringAPI.getEquipmentReadings(equipmentId, { hours: timeRange })
      ]);
      
      setEquipment(eqResponse);
      setReadings(readingsResponse.readings || []);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      toast.error('Failed to load equipment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipmentData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchEquipmentData, 30000);
    return () => clearInterval(interval);
  }, [equipmentId, timeRange]);

  // Handle Asset Performance navigation
  const handleViewAssetPerformance = async () => {
    // Check if Asset Management module is enabled
    if (!hasModuleAccess('asset_management')) {
      setShowModulePrompt(true);
      return;
    }

    // Check if asset is onboarded in Asset Management
    setCheckingAsset(true);
    try {
      // Try to find asset by equipment code
      const equipmentCode = equipment?.code || equipment?.equipment_id;
      const response = await assetsAPI.findByEquipmentCode(equipmentCode);
      
      if (response?.found && response?.asset) {
        setLinkedAsset(response.asset);
        // Navigate to asset detail page
        const assetType = response.asset.asset_type || 'equipment';
        navigate(`/assets/${assetType}/${response.asset.asset_id}`);
      } else {
        // Asset not found - show helpful dialog
        setShowAssetNotFound(true);
      }
    } catch (error) {
      console.error('Error checking asset:', error);
      // If API fails, show not found dialog
      setShowAssetNotFound(true);
    } finally {
      setCheckingAsset(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        <AppHeader onLogout={onLogout} />
        <ModuleTabs />
        <MonitoringNav />
        <div className="flex items-center justify-center h-[calc(100vh-128px)]">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
            <p className="text-gray-500">Loading equipment data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        <AppHeader onLogout={onLogout} />
        <ModuleTabs />
        <MonitoringNav />
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <Cpu className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Equipment not found</p>
          <Button onClick={() => navigate('/monitoring/equipment')} className="mt-4">
            Back to Equipment
          </Button>
        </div>
      </div>
    );
  }

  const getHealthBadge = (status) => {
    switch(status) {
      case 'healthy':
        return <Badge className="bg-emerald-100 text-emerald-700 border-0 text-base px-4 py-1 font-semibold">Healthy</Badge>;
      case 'warning':
        return <Badge className="bg-amber-100 text-amber-700 border-0 text-base px-4 py-1 font-semibold">Warning</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-700 border-0 text-base px-4 py-1 font-semibold">Critical</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 border-0 text-base px-4 py-1">Unknown</Badge>;
    }
  };

  const getTrendIcon = (trend) => {
    switch(trend) {
      case 'improving':
        return <TrendingDown className="h-5 w-5 text-emerald-500" />;
      case 'degrading':
        return <TrendingUp className="h-5 w-5 text-red-500" />;
      default:
        return <Minus className="h-5 w-5 text-gray-400" />;
    }
  };

  // Prepare chart data
  const chartData = readings.map(r => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    pd: r.readings?.pd_level_pc || 0,
    temp: r.readings?.temperature_c || 0,
    timestamp: r.timestamp
  })).reverse();

  const thresholds = equipment.thresholds || {};
  const currentReadings = equipment.current_readings || {};
  const alarms = equipment.alarms || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <AppHeader onLogout={onLogout} />
      <ModuleTabs />
      <MonitoringNav />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="mb-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl shadow-lg shadow-cyan-200">
                  <Cpu className="h-6 w-6 text-white" />
                </div>
                {equipment.name}
              </h1>
              {getHealthBadge(equipment.health_status)}
            </div>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-500" />
              {equipment.substation_name} | <span className="capitalize">{equipment.equipment_type?.replace(/_/g, ' ')}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Asset Performance Button */}
            <Button 
              size="sm"
              onClick={handleViewAssetPerformance}
              disabled={checkingAsset}
              className="gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-md"
            >
              {checkingAsset ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <BarChart3 className="h-4 w-4" />
              )}
              Asset Performance
              <ExternalLink className="h-3 w-3 opacity-70" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchEquipmentData}
              className="gap-2 bg-white border-gray-200 hover:bg-gray-50 hover:border-blue-300 shadow-sm"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2 bg-white border-gray-200 hover:bg-gray-50 hover:border-blue-300 shadow-sm"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        {/* Current Readings */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <Card className={`border-0 shadow-lg ${
            currentReadings.pd_level_pc > thresholds.pd_critical_pc 
              ? 'bg-gradient-to-br from-red-50 to-white shadow-red-100' 
              : currentReadings.pd_level_pc > thresholds.pd_warning_pc 
                ? 'bg-gradient-to-br from-amber-50 to-white shadow-amber-100' 
                : 'bg-white shadow-emerald-100/50'
          }`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">PD Level</p>
                  <p className={`text-4xl font-bold mt-1 ${
                    currentReadings.pd_level_pc > thresholds.pd_critical_pc ? 'text-red-500' :
                    currentReadings.pd_level_pc > thresholds.pd_warning_pc ? 'text-amber-500' :
                    'text-emerald-500'
                  }`}>
                    {currentReadings.pd_level_pc?.toFixed(1) || 0} <span className="text-lg">pC</span>
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                  currentReadings.pd_level_pc > thresholds.pd_critical_pc ? 'bg-red-100' :
                  currentReadings.pd_level_pc > thresholds.pd_warning_pc ? 'bg-amber-100' :
                  'bg-emerald-100'
                }`}>
                  <Activity className={`h-6 w-6 ${
                    currentReadings.pd_level_pc > thresholds.pd_critical_pc ? 'text-red-600' :
                    currentReadings.pd_level_pc > thresholds.pd_warning_pc ? 'text-amber-600' :
                    'text-emerald-600'
                  }`} />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Threshold: {thresholds.pd_warning_pc}/{thresholds.pd_critical_pc} pC
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-lg shadow-orange-100/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Temperature</p>
                  <p className="text-4xl font-bold text-gray-800 mt-1">
                    {currentReadings.temperature_c?.toFixed(1) || 0}<span className="text-lg">°C</span>
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Thermometer className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Threshold: {thresholds.temp_warning_c}/{thresholds.temp_critical_c}°C
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Trend</p>
                  <p className="text-xl font-bold text-gray-800 capitalize flex items-center gap-2 mt-3">
                    {getTrendIcon(equipment.trend)}
                    {equipment.trend || 'Stable'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Based on last 7 days
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-lg shadow-cyan-100/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">PD Count</p>
                  <p className="text-4xl font-bold text-gray-800 mt-1">
                    {currentReadings.pd_count_per_sec || 0}<span className="text-lg">/sec</span>
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-cyan-100 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-cyan-600" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Pulses per second
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="border-0 bg-white shadow-lg">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <Activity className="h-5 w-5 text-cyan-500" />
                    PD Level Trend
                  </CardTitle>
                  <CardDescription className="text-gray-500">Partial discharge readings over time</CardDescription>
                </div>
                <div className="flex gap-1">
                  {[24, 48, 168].map(h => (
                    <Button
                      key={h}
                      variant={timeRange === h ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTimeRange(h)}
                      className={timeRange === h ? 'bg-cyan-500 hover:bg-cyan-600' : 'border-gray-200'}
                    >
                      {h === 168 ? '7d' : `${h}h`}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#9CA3AF"
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      domain={[0, 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <defs>
                      <linearGradient id="pdGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="pd" 
                      stroke="#06B6D4" 
                      strokeWidth={2}
                      fill="url(#pdGradient)"
                      name="PD Level (pC)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-lg">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Thermometer className="h-5 w-5 text-orange-500" />
                Temperature Trend
              </CardTitle>
              <CardDescription className="text-gray-500">Equipment temperature over time</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#9CA3AF"
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      domain={['dataMin - 5', 'dataMax + 5']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <defs>
                      <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="temp" 
                      stroke="#F97316" 
                      strokeWidth={2}
                      fill="url(#tempGradient)"
                      name="Temperature (°C)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Equipment Info & Alarms */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-0 bg-white shadow-lg">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-gray-800">Equipment Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Type</span>
                <span className="font-medium text-gray-800 capitalize">{equipment.equipment_type?.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Manufacturer</span>
                <span className="font-medium text-gray-800">{equipment.manufacturer}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Rating</span>
                <span className="font-medium text-gray-800">{equipment.rating}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Installation</span>
                <span className="font-medium text-gray-800">{equipment.installation_date}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Sensor ID</span>
                <span className="text-xs font-mono text-gray-600">{equipment.sensor_info?.sensor_id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Last Maintenance</span>
                <span className="font-medium text-gray-800">{equipment.last_maintenance}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Next Maintenance</span>
                <span className="font-medium text-blue-600">{equipment.next_maintenance}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-lg lg:col-span-2">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Alarm History
              </CardTitle>
              <CardDescription className="text-gray-500">Recent alarms for this equipment</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {alarms.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="h-7 w-7 text-emerald-500" />
                  </div>
                  <p className="text-gray-800 font-medium">No alarm history</p>
                  <p className="text-gray-500 text-xs mt-1">Equipment running normally</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alarms.map((alarm) => (
                    <div 
                      key={alarm.alarm_id}
                      className={`p-3 rounded-xl border-2 ${
                        alarm.status === 'resolved' 
                          ? 'bg-gray-50 border-gray-200' 
                          : alarm.severity === 'critical' 
                            ? 'bg-red-50 border-red-200' 
                            : 'bg-amber-50 border-amber-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={`border-0 font-semibold ${
                              alarm.status === 'resolved'
                                ? 'bg-gray-200 text-gray-600'
                                : alarm.severity === 'critical' 
                                  ? 'bg-red-500 text-white'
                                  : 'bg-amber-500 text-white'
                            }`}
                          >
                            {alarm.severity}
                          </Badge>
                          <Badge className={`border-0 font-medium capitalize ${
                            alarm.status === 'resolved' 
                              ? 'bg-emerald-100 text-emerald-700'
                              : alarm.status === 'acknowledged'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-red-100 text-red-700'
                          }`}>
                            {alarm.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(alarm.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800">{alarm.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Value: {alarm.value} pC | Threshold: {alarm.threshold} pC
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Module Not Available Dialog */}
      <Dialog open={showModulePrompt} onOpenChange={setShowModulePrompt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <DialogTitle className="text-xl">Asset Performance Module</DialogTitle>
            </div>
            <DialogDescription className="text-left">
              Unlock comprehensive asset management capabilities
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-100">
              <h4 className="font-semibold text-gray-800 mb-3">What you'll get:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                  <span>Complete asset lifecycle history & maintenance records</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                  <span>Offline & online test results with trend analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                  <span>Predictive maintenance recommendations</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                  <span>Digital nameplate & QR code integration</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                  <span>Compliance tracking & certification management</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800">
                  Contact your administrator to enable the <strong>Asset Performance Management</strong> module for your organization.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowModulePrompt(false)}
            >
              Maybe Later
            </Button>
            <Button 
              className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
              onClick={() => {
                setShowModulePrompt(false);
                toast.info('Please contact your system administrator to enable Asset Performance module');
              }}
            >
              <Mail className="h-4 w-4 mr-2" />
              Contact Admin
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Asset Not Onboarded Dialog */}
      <Dialog open={showAssetNotFound} onOpenChange={setShowAssetNotFound}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-100 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <DialogTitle className="text-xl">Asset Not Onboarded</DialogTitle>
            </div>
            <DialogDescription className="text-left">
              This equipment hasn't been registered in the Asset Performance module yet.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Card className="border-gray-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3 mb-3">
                  <Cpu className="h-5 w-5 text-cyan-500" />
                  <div>
                    <p className="font-medium text-gray-800">{equipment?.name}</p>
                    <p className="text-sm text-gray-500">{equipment?.code || 'No code assigned'}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Equipment Type: <span className="capitalize">{equipment?.equipment_type?.replace(/_/g, ' ')}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Substation: {equipment?.substation_name}
                </p>
              </CardContent>
            </Card>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Next Steps
              </h4>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-500">1.</span>
                  <span>Contact your Asset Administrator to register this equipment</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-500">2.</span>
                  <span>Provide the equipment code: <code className="bg-blue-100 px-1 rounded">{equipment?.code || equipment?.equipment_id}</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-500">3.</span>
                  <span>Once onboarded, you can access full performance history</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                Need help? Contact DMS Insight Support
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowAssetNotFound(false)}
            >
              Close
            </Button>
            <Button 
              className="flex-1"
              onClick={() => {
                // Copy equipment details to clipboard
                const details = `Equipment: ${equipment?.name}\nCode: ${equipment?.code || 'N/A'}\nType: ${equipment?.equipment_type}\nSubstation: ${equipment?.substation_name}`;
                navigator.clipboard.writeText(details);
                toast.success('Equipment details copied to clipboard');
              }}
            >
              Copy Details
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EquipmentDetailPage;
