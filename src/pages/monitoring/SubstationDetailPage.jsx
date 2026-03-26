/**
 * Online Monitoring Module - Substation Detail Page
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
  Building2, 
  Cpu, 
  AlertTriangle, 
  CheckCircle, 
  ArrowLeft,
  RefreshCw,
  MapPin,
  Zap,
  Box,
  Link as LinkIcon,
  CircleDot,
  Thermometer,
  Activity
} from 'lucide-react';
import { monitoringAPI } from '../../services/api';
import { toast } from 'sonner';

const EQUIPMENT_ICONS = {
  power_transformer: Zap,
  gis_switchgear: Box,
  cable_termination: LinkIcon,
  cable_joint: LinkIcon,
  bushing: CircleDot
};

const EQUIPMENT_COLORS = {
  power_transformer: { icon: 'text-amber-600', bg: 'bg-amber-100' },
  gis_switchgear: { icon: 'text-blue-600', bg: 'bg-blue-100' },
  cable_termination: { icon: 'text-emerald-600', bg: 'bg-emerald-100' },
  cable_joint: { icon: 'text-purple-600', bg: 'bg-purple-100' },
  bushing: { icon: 'text-orange-600', bg: 'bg-orange-100' }
};

export function SubstationDetailPage({ onLogout }) {
  const { substationId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [substation, setSubstation] = useState(null);

  const fetchSubstationData = async () => {
    try {
      setLoading(true);
      const response = await monitoringAPI.getSubstation(substationId);
      setSubstation(response);
    } catch (error) {
      console.error('Error fetching substation:', error);
      toast.error('Failed to load substation data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubstationData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSubstationData, 30000);
    return () => clearInterval(interval);
  }, [substationId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        <AppHeader onLogout={onLogout} />
        <ModuleTabs />
        <MonitoringNav />
        <div className="flex items-center justify-center h-[calc(100vh-128px)]">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-gray-500">Loading substation data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!substation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        <AppHeader onLogout={onLogout} />
        <ModuleTabs />
        <MonitoringNav />
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Substation not found</p>
          <Button onClick={() => navigate('/monitoring/substations')} className="mt-4">
            Back to Substations
          </Button>
        </div>
      </div>
    );
  }

  const equipment = substation.equipment || [];
  const alarms = substation.active_alarms || [];
  
  // Group equipment by type
  const equipmentByType = equipment.reduce((acc, eq) => {
    if (!acc[eq.equipment_type]) {
      acc[eq.equipment_type] = [];
    }
    acc[eq.equipment_type].push(eq);
    return acc;
  }, {});

  const getHealthBadge = (status) => {
    switch(status) {
      case 'healthy':
        return <Badge className="bg-emerald-100 text-emerald-700 border-0 font-semibold">Healthy</Badge>;
      case 'warning':
        return <Badge className="bg-amber-100 text-amber-700 border-0 font-semibold">Warning</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-700 border-0 font-semibold">Critical</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 border-0">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <AppHeader onLogout={onLogout} />
      <ModuleTabs />
      <MonitoringNav />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/monitoring/substations')}
              className="mb-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Substations
            </Button>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-200">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              {substation.name}
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              {substation.region_name} | {substation.voltage_level}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchSubstationData}
            className="gap-2 bg-white border-gray-200 hover:bg-gray-50 hover:border-blue-300 shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <Card className="border-0 bg-white shadow-lg shadow-cyan-100/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Assets</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{equipment.length}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-200">
                  <Cpu className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 bg-white shadow-lg shadow-emerald-100/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Healthy</p>
                  <p className="text-3xl font-bold text-emerald-500 mt-1">
                    {equipment.filter(e => e.health_status === 'healthy').length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 bg-white shadow-lg shadow-amber-100/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Warning</p>
                  <p className="text-3xl font-bold text-amber-500 mt-1">
                    {equipment.filter(e => e.health_status === 'warning').length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-200">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 bg-white shadow-lg shadow-red-100/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Critical</p>
                  <p className="text-3xl font-bold text-red-500 mt-1">
                    {equipment.filter(e => e.health_status === 'critical').length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-lg shadow-red-200">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assets List */}
          <div className="lg:col-span-2">
            <Card className="border-0 bg-white shadow-lg">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Cpu className="h-5 w-5 text-cyan-500" />
                  Monitored Assets
                </CardTitle>
                <CardDescription className="text-gray-500">Click on asset to view details</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {Object.entries(equipmentByType).map(([type, items]) => {
                  const Icon = EQUIPMENT_ICONS[type] || Cpu;
                  const colors = EQUIPMENT_COLORS[type] || { icon: 'text-cyan-600', bg: 'bg-cyan-100' };
                  const typeName = type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                  
                  return (
                    <div key={type} className="mb-6 last:mb-0">
                      <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${colors.icon}`}>
                        <div className={`p-1.5 rounded-lg ${colors.bg}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        {typeName} ({items.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {items.map((eq) => (
                          <div 
                            key={eq.equipment_id}
                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                              eq.health_status === 'critical' 
                                ? 'bg-red-50 border-red-200 hover:border-red-300' 
                                : eq.health_status === 'warning'
                                  ? 'bg-amber-50 border-amber-200 hover:border-amber-300'
                                  : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                            }`}
                            onClick={() => navigate(`/monitoring/equipment/${eq.equipment_id}`)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm text-gray-800">{eq.name}</span>
                              {getHealthBadge(eq.health_status)}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex items-center gap-1">
                                <Activity className={`h-3 w-3 ${eq.current_readings?.pd_level_pc > 10 ? 'text-amber-500' : 'text-gray-400'}`} />
                                <span className={eq.current_readings?.pd_level_pc > 10 ? 'text-amber-600 font-medium' : 'text-gray-600'}>
                                  {eq.current_readings?.pd_level_pc?.toFixed(1) || 0} pC
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Thermometer className="h-3 w-3 text-gray-400" />
                                <span className="text-gray-600">
                                  {eq.current_readings?.temperature_c?.toFixed(1) || 0}°C
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Active Alarms */}
          <div>
            <Card className="border-0 bg-white shadow-lg">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Active Alarms
                </CardTitle>
                <CardDescription className="text-gray-500">{alarms.length} alarms at this substation</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {alarms.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle className="h-7 w-7 text-emerald-500" />
                    </div>
                    <p className="text-gray-800 font-medium">No active alarms</p>
                    <p className="text-gray-500 text-xs mt-1">All systems normal</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alarms.map((alarm) => (
                      <div 
                        key={alarm.alarm_id}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                          alarm.severity === 'critical' 
                            ? 'bg-red-50 border-red-200 hover:border-red-300' 
                            : 'bg-amber-50 border-amber-200 hover:border-amber-300'
                        }`}
                        onClick={() => navigate(`/monitoring/equipment/${alarm.equipment_id}`)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Badge 
                            className={`border-0 font-semibold ${
                              alarm.severity === 'critical' 
                                ? 'bg-red-500 text-white'
                                : 'bg-amber-500 text-white'
                            }`}
                          >
                            {alarm.severity}
                          </Badge>
                          <span className="text-xs text-gray-500 capitalize">
                            {alarm.status}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-800">{alarm.equipment_name}</p>
                        <p className="text-xs text-gray-600 mt-1">{alarm.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(alarm.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SubstationDetailPage;
