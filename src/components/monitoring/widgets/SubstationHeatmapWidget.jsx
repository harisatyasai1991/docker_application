/**
 * Substation Heatmap Widget
 * Visual grid showing all substations color-coded by health score
 * Grouped by region with click-to-view detail panel
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { 
  Grid3X3,
  X,
  MapPin,
  Cpu,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Thermometer,
  Zap,
  ExternalLink,
  Map
} from 'lucide-react';
import { monitoringAPI } from '../../../services/api';

// Color scheme for health scores
const getHealthColor = (healthPercent) => {
  if (healthPercent >= 80) return { bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-600' };
  if (healthPercent >= 60) return { bg: 'bg-lime-500', text: 'text-white', border: 'border-lime-600' };
  if (healthPercent >= 40) return { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-600' };
  if (healthPercent >= 20) return { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-600' };
  return { bg: 'bg-red-500', text: 'text-white', border: 'border-red-600' };
};

// Region colors for backgrounds
const REGION_COLORS = {
  central: { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700', badge: 'bg-blue-500' },
  eastern: { bg: 'bg-rose-100', border: 'border-rose-400', text: 'text-rose-700', badge: 'bg-rose-500' },
  southern: { bg: 'bg-emerald-100', border: 'border-emerald-400', text: 'text-emerald-700', badge: 'bg-emerald-500' },
  western: { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-700', badge: 'bg-amber-500' }
};

const REGION_NAMES = {
  central: 'Central',
  eastern: 'Eastern', 
  southern: 'Southern',
  western: 'Western'
};

export function SubstationHeatmapWidget({ data, config = {} }) {
  const navigate = useNavigate();
  const [substations, setSubstations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubstation, setSelectedSubstation] = useState(null);
  const [substationDetail, setSubstationDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Fetch all substations with equipment data
  useEffect(() => {
    const fetchSubstations = async () => {
      try {
        const response = await monitoringAPI.getSubstations({ limit: 100 });
        const subs = response.substations || [];
        
        // Fetch equipment for each substation to calculate health
        const subsWithHealth = await Promise.all(
          subs.map(async (sub) => {
            try {
              const equipResponse = await monitoringAPI.getEquipment({ 
                substation_id: sub.substation_id,
                limit: 100 
              });
              const equipment = equipResponse.equipment || [];
              const total = equipment.length;
              const healthy = equipment.filter(e => e.health_status === 'healthy').length;
              const warning = equipment.filter(e => e.health_status === 'warning').length;
              const critical = equipment.filter(e => e.health_status === 'critical').length;
              const healthPercent = total > 0 ? Math.round((healthy / total) * 100) : 100;
              
              return {
                ...sub,
                equipment_total: total,
                equipment_healthy: healthy,
                equipment_warning: warning,
                equipment_critical: critical,
                health_percent: healthPercent
              };
            } catch (err) {
              return { ...sub, health_percent: 0, equipment_total: 0 };
            }
          })
        );
        
        setSubstations(subsWithHealth);
      } catch (error) {
        console.error('Error fetching substations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubstations();
  }, []);

  // Fetch detail when substation is selected
  const handleSubstationClick = async (substation) => {
    setSelectedSubstation(substation);
    setDetailLoading(true);
    
    try {
      const detail = await monitoringAPI.getSubstation(substation.substation_id);
      setSubstationDetail(detail);
    } catch (error) {
      console.error('Error fetching substation detail:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedSubstation(null);
    setSubstationDetail(null);
  };

  // Group substations by region
  const regionGroups = substations.reduce((acc, sub) => {
    const region = sub.region || 'unknown';
    if (!acc[region]) acc[region] = [];
    acc[region].push(sub);
    return acc;
  }, {});

  // Calculate region averages
  const regionStats = Object.entries(regionGroups).map(([region, subs]) => {
    const avgHealth = subs.length > 0 
      ? Math.round(subs.reduce((sum, s) => sum + s.health_percent, 0) / subs.length)
      : 0;
    return { region, count: subs.length, avgHealth };
  });

  if (loading) {
    return (
      <Card className="border-0 bg-white shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      <Card className="border-0 bg-white shadow-lg">
        <CardHeader className="border-b border-gray-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Grid3X3 className="h-5 w-5 text-blue-500" />
                Equipment Health Heatmap
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">Click on any substation to view details</p>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Health:</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-red-500"></div>
                <span>0%</span>
              </div>
              <div className="w-16 h-2 rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500"></div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-emerald-500"></div>
                <span>100%</span>
              </div>
            </div>
          </div>
          
          {/* Region Legend */}
          <div className="flex items-center gap-4 mt-4 text-sm">
            <span className="text-gray-500">Regions:</span>
            {Object.entries(REGION_COLORS).map(([region, colors]) => (
              <div key={region} className="flex items-center gap-1.5">
                <div className={`w-4 h-4 rounded border-2 ${colors.bg} ${colors.border}`}></div>
                <span className={colors.text}>
                  {REGION_NAMES[region]} ({regionGroups[region]?.length || 0})
                </span>
              </div>
            ))}
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          {/* Heatmap Grid - Grouped by Region */}
          <div className="space-y-4">
            {Object.entries(regionGroups).map(([region, subs]) => {
              const colors = REGION_COLORS[region] || REGION_COLORS.central;
              
              return (
                <div 
                  key={region}
                  className={`p-3 rounded-xl border-2 ${colors.bg} ${colors.border}`}
                >
                  {/* Region Header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>
                      {REGION_NAMES[region] || region}
                    </span>
                    <span className="text-xs text-gray-500">
                      {subs.length} substations
                    </span>
                  </div>
                  
                  {/* Substation Grid */}
                  <div className="flex flex-wrap gap-2">
                    {subs.map((sub) => {
                      const healthColors = getHealthColor(sub.health_percent);
                      const isSelected = selectedSubstation?.substation_id === sub.substation_id;
                      
                      return (
                        <button
                          key={sub.substation_id}
                          onClick={() => handleSubstationClick(sub)}
                          className={`
                            w-14 h-14 rounded-lg flex flex-col items-center justify-center
                            transition-all duration-200 cursor-pointer
                            ${healthColors.bg} ${healthColors.text}
                            ${isSelected ? 'ring-4 ring-blue-500 ring-offset-2 scale-110 z-10' : 'hover:scale-105 hover:shadow-lg'}
                          `}
                          title={sub.name}
                        >
                          <span className="text-lg font-bold">{sub.health_percent}%</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Summary Footer */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Total: <strong>{substations.length}</strong> substations across <strong>{Object.keys(regionGroups).length}</strong> regions
            </span>
            <div className="flex items-center gap-4">
              {regionStats.map(({ region, avgHealth }) => {
                const colors = REGION_COLORS[region] || REGION_COLORS.central;
                return (
                  <div key={region} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-full ${colors.badge}`}></div>
                    <span className={colors.text}>
                      {REGION_NAMES[region]}: <strong>{avgHealth}%</strong>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Panel - Slides in from right */}
      {selectedSubstation && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-300">Viewing:</span>
              <button 
                onClick={closeDetail}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {selectedSubstation.name || selectedSubstation.substation_id}
            </h2>
            <Badge className={`${REGION_COLORS[selectedSubstation.region]?.badge || 'bg-blue-500'} text-white border-0`}>
              <MapPin className="h-3 w-3 mr-1" />
              {REGION_NAMES[selectedSubstation.region] || selectedSubstation.region}
            </Badge>
          </div>

          {detailLoading ? (
            <div className="p-6 flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Overall Health Score */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">Overall Health</span>
                  <span className={`text-3xl font-bold ${
                    selectedSubstation.health_percent >= 80 ? 'text-emerald-500' :
                    selectedSubstation.health_percent >= 50 ? 'text-amber-500' : 'text-red-500'
                  }`}>
                    {selectedSubstation.health_percent}%
                  </span>
                </div>
                <Progress 
                  value={selectedSubstation.health_percent} 
                  className="h-3"
                />
              </div>

              {/* Equipment Breakdown */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                  <Cpu className="h-4 w-4 text-blue-500" />
                  Equipment Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm text-gray-600">Healthy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-600">{selectedSubstation.equipment_healthy || 0}</span>
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${selectedSubstation.equipment_total > 0 ? (selectedSubstation.equipment_healthy / selectedSubstation.equipment_total) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="text-sm text-gray-600">Warning</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-600">{selectedSubstation.equipment_warning || 0}</span>
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${selectedSubstation.equipment_total > 0 ? (selectedSubstation.equipment_warning / selectedSubstation.equipment_total) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-gray-600">Critical</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-red-600">{selectedSubstation.equipment_critical || 0}</span>
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${selectedSubstation.equipment_total > 0 ? (selectedSubstation.equipment_critical / selectedSubstation.equipment_total) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                  <span className="text-xs text-gray-500">
                    Total: <strong>{selectedSubstation.equipment_total || 0}</strong> equipment
                  </span>
                </div>
              </div>

              {/* Active Alarms */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Active Alarms
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {substationDetail?.active_alarms?.filter(a => a.severity === 'critical').length || selectedSubstation.critical_count || 0}
                    </p>
                    <p className="text-xs text-red-500 font-medium">Critical</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-amber-600">
                      {substationDetail?.active_alarms?.filter(a => a.severity === 'warning').length || selectedSubstation.warning_count || 0}
                    </p>
                    <p className="text-xs text-amber-500 font-medium">Warning</p>
                  </div>
                </div>
              </div>

              {/* Latest Readings Summary */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                  <Activity className="h-4 w-4 text-cyan-500" />
                  Latest Readings
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-cyan-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="h-4 w-4 text-cyan-600" />
                      <span className="text-xs text-cyan-700 font-medium">Max PD Level</span>
                    </div>
                    <p className="text-xl font-bold text-cyan-700">
                      {substationDetail?.equipment?.[0]?.latest_reading?.pd_level_pc?.toFixed(1) || '--'} <span className="text-sm font-normal">pC</span>
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Thermometer className="h-4 w-4 text-orange-600" />
                      <span className="text-xs text-orange-700 font-medium">Avg Temp</span>
                    </div>
                    <p className="text-xl font-bold text-orange-700">
                      {substationDetail?.equipment?.[0]?.latest_reading?.temperature_c?.toFixed(0) || '--'} <span className="text-sm font-normal">°C</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <Button 
                  className="w-full gap-2 bg-blue-500 hover:bg-blue-600"
                  onClick={() => navigate(`/monitoring/substations/${selectedSubstation.substation_id}`)}
                >
                  <ExternalLink className="h-4 w-4" />
                  View Full Details
                </Button>
                <Button 
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => navigate(`/monitoring/map?substation=${selectedSubstation.substation_id}`)}
                >
                  <Map className="h-4 w-4" />
                  View on Map
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Overlay when detail panel is open */}
      {selectedSubstation && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={closeDetail}
        />
      )}
    </div>
  );
}

export default SubstationHeatmapWidget;
