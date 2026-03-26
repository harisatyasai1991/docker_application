/**
 * Substation Health Monitor Widget
 * 3-column layout:
 * - Left: Substation list sorted by risk (highest risk first)
 * - Center: Vertical bar chart for equipment risk (sorted highest first)
 * - Right: Equipment detail panel when bar is clicked
 * 
 * RISK SCORE: 100% = Critical (needs attention), 10% = Healthy (running fine)
 * Taller bars = More attention needed
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { 
  Building2,
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
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { monitoringAPI } from '../../../services/api';

// Color for RISK scores (inverted - high risk = red, low risk = green)
const getRiskColor = (riskPercent) => {
  if (riskPercent >= 80) return { bg: 'bg-red-500', hover: 'hover:bg-red-400', text: 'text-red-700', light: 'bg-red-100' };
  if (riskPercent >= 60) return { bg: 'bg-orange-500', hover: 'hover:bg-orange-400', text: 'text-orange-700', light: 'bg-orange-100' };
  if (riskPercent >= 40) return { bg: 'bg-amber-500', hover: 'hover:bg-amber-400', text: 'text-amber-700', light: 'bg-amber-100' };
  if (riskPercent >= 20) return { bg: 'bg-lime-500', hover: 'hover:bg-lime-400', text: 'text-lime-700', light: 'bg-lime-100' };
  return { bg: 'bg-emerald-500', hover: 'hover:bg-emerald-400', text: 'text-emerald-700', light: 'bg-emerald-100' };
};

// Region colors
const REGION_COLORS = {
  central: { badge: 'bg-blue-500', text: 'text-blue-700' },
  eastern: { badge: 'bg-rose-500', text: 'text-rose-700' },
  southern: { badge: 'bg-emerald-500', text: 'text-emerald-700' },
  western: { badge: 'bg-amber-500', text: 'text-amber-700' }
};

const REGION_NAMES = {
  central: 'Central',
  eastern: 'Eastern', 
  southern: 'Southern',
  western: 'Western'
};

export function SubstationHealthMonitor({ data, config = {}, compactMode = false, externalSelectedSubstation = null, onSubstationChange = null }) {
  const navigate = useNavigate();
  const [substations, setSubstations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubstation, setSelectedSubstation] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [equipmentLoading, setEquipmentLoading] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [equipmentDetail, setEquipmentDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [hoveredEquipment, setHoveredEquipment] = useState(null);

  // Handle external substation selection (from heatmap)
  useEffect(() => {
    if (externalSelectedSubstation && externalSelectedSubstation.substation_id !== selectedSubstation?.substation_id) {
      handleSubstationSelect(externalSelectedSubstation);
    }
  }, [externalSelectedSubstation]);

  // Fetch all substations with equipment risk
  useEffect(() => {
    const fetchSubstations = async () => {
      try {
        const response = await monitoringAPI.getSubstations({ limit: 100 });
        const subs = response.substations || [];
        
        // Fetch equipment for each substation to calculate risk
        const subsWithRisk = await Promise.all(
          subs.map(async (sub) => {
            try {
              const equipResponse = await monitoringAPI.getEquipment({ 
                substation_id: sub.substation_id,
                limit: 100 
              });
              const equip = equipResponse.equipment || [];
              const total = equip.length;
              const healthy = equip.filter(e => e.health_status === 'healthy').length;
              const warning = equip.filter(e => e.health_status === 'warning').length;
              const critical = equip.filter(e => e.health_status === 'critical').length;
              
              // RISK SCORE: Higher = worse (critical equipment ratio)
              // 100% = all critical, 10% = all healthy
              const riskPercent = total > 0 
                ? Math.round(10 + ((critical * 90 + warning * 45) / total))
                : 10;
              
              return {
                ...sub,
                equipment_total: total,
                equipment_healthy: healthy,
                equipment_warning: warning,
                equipment_critical: critical,
                risk_percent: Math.min(100, riskPercent) // Cap at 100%
              };
            } catch (err) {
              return { ...sub, risk_percent: 10, equipment_total: 0 };
            }
          })
        );
        
        // Sort by RISK (highest risk first - needs attention)
        subsWithRisk.sort((a, b) => b.risk_percent - a.risk_percent);
        setSubstations(subsWithRisk);
        
        // Auto-select first (highest risk) substation
        if (subsWithRisk.length > 0) {
          handleSubstationSelect(subsWithRisk[0]);
        }
      } catch (error) {
        console.error('Error fetching substations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubstations();
  }, []);

  // Handle substation selection - fetch its equipment
  const handleSubstationSelect = async (substation) => {
    setSelectedSubstation(substation);
    setSelectedEquipment(null);
    setEquipmentDetail(null);
    setEquipmentLoading(true);
    
    // Notify parent component if callback provided
    if (onSubstationChange) {
      onSubstationChange(substation);
    }
    
    try {
      const response = await monitoringAPI.getEquipment({ 
        substation_id: substation.substation_id,
        limit: 100 
      });
      let equip = response.equipment || [];
      
      // Calculate RISK score for each equipment (inverted from health)
      // 100% = critical (needs attention), 10% = healthy (running fine)
      equip = equip.map(e => {
        let riskScore = 10; // Base: healthy = 10%
        if (e.health_status === 'warning') riskScore = 55;
        if (e.health_status === 'critical') riskScore = 90;
        
        // Add variation based on latest reading
        if (e.latest_reading?.pd_level_pc) {
          const pdLevel = e.latest_reading.pd_level_pc;
          if (pdLevel > 50) riskScore = Math.min(100, riskScore + 10);
          else if (pdLevel > 20) riskScore = Math.min(100, riskScore + 5);
        }
        return { ...e, risk_score: riskScore };
      });
      
      // Sort by RISK (highest risk first - taller bars first)
      equip.sort((a, b) => b.risk_score - a.risk_score);
      setEquipment(equip);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      setEquipment([]);
    } finally {
      setEquipmentLoading(false);
    }
  };

  // Handle equipment bar click - fetch detail
  const handleEquipmentClick = async (equip) => {
    setSelectedEquipment(equip);
    setDetailLoading(true);
    
    try {
      const detail = await monitoringAPI.getEquipmentDetail(equip.equipment_id);
      setEquipmentDetail(detail);
    } catch (error) {
      console.error('Error fetching equipment detail:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedEquipment(null);
    setEquipmentDetail(null);
  };

  if (loading) {
    return (
      <Card className="border-0 bg-white shadow-lg h-full">
        <CardContent className="pt-6 h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-gray-500 text-sm">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Count equipment by status for selected substation
  const criticalCount = equipment.filter(e => e.health_status === 'critical').length;
  const warningCount = equipment.filter(e => e.health_status === 'warning').length;
  const healthyCount = equipment.filter(e => e.health_status === 'healthy').length;

  return (
    <Card className={`border-0 bg-white shadow-lg overflow-hidden ${compactMode ? 'h-full flex flex-col' : ''}`}>
      <CardHeader className="border-b border-gray-100 py-2 px-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <TrendingUp className="h-4 w-4 text-red-500 shrink-0" />
            {/* Substation Selector Dropdown (for compact mode) */}
            {compactMode ? (
              <Select 
                value={selectedSubstation?.substation_id || ''} 
                onValueChange={(value) => {
                  const sub = substations.find(s => s.substation_id === value);
                  if (sub) handleSubstationSelect(sub);
                }}
              >
                <SelectTrigger className="h-7 text-xs w-[200px] border-gray-200 bg-white">
                  <SelectValue placeholder="Select Substation">
                    {selectedSubstation ? (
                      <span className="flex items-center gap-1.5">
                        <span className="truncate font-medium text-gray-700">{selectedSubstation.name}</span>
                        <Badge className={`text-[8px] px-1.5 py-0 ${getRiskColor(selectedSubstation.risk_percent).bg} text-white border-0`}>
                          {selectedSubstation.risk_percent}%
                        </Badge>
                      </span>
                    ) : 'Select Substation'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {substations.sort((a, b) => b.risk_percent - a.risk_percent).map(sub => {
                    const colors = getRiskColor(sub.risk_percent);
                    return (
                      <SelectItem key={sub.substation_id} value={sub.substation_id}>
                        <div className="flex items-center justify-between gap-3 w-full min-w-[180px]">
                          <span className="truncate text-gray-700">{sub.name}</span>
                          <Badge 
                            className={`text-[9px] px-1.5 py-0.5 shrink-0 ${colors.bg} text-white border-0`}
                          >
                            {sub.risk_percent}%
                          </Badge>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            ) : (
              <CardTitle className="text-gray-800 text-sm">Substation Risk Monitor</CardTitle>
            )}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-2 text-[10px] shrink-0">
            <div className="flex items-center gap-1">
              <div className="w-2 h-5 rounded bg-red-500"></div>
              <span className="text-gray-500">Critical</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-3 rounded bg-amber-500"></div>
              <span className="text-gray-500">Warning</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-1.5 rounded bg-emerald-500"></div>
              <span className="text-gray-500">Healthy</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={`p-0 ${compactMode ? 'flex-1' : ''}`}>
        <div className={`flex ${compactMode ? 'h-full' : 'h-[240px]'}`}>
          {/* Left Column - Substation List (hidden in compact mode) */}
          {!compactMode && (
            <div className="w-48 border-r border-gray-100 overflow-y-auto bg-gray-50/50">
              <div className="px-2 py-1.5 border-b border-gray-100 bg-white sticky top-0 z-10">
                <h3 className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                  Substations ({substations.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {substations.map((sub) => {
                  const colors = getRiskColor(sub.risk_percent);
                  const isSelected = selectedSubstation?.substation_id === sub.substation_id;
                  const regionColors = REGION_COLORS[sub.region] || REGION_COLORS.central;
                  
                  return (
                    <button
                      key={sub.substation_id}
                      onClick={() => handleSubstationSelect(sub)}
                      className={`w-full px-2 py-1 text-left transition-all duration-150 flex items-center gap-2 ${
                        isSelected 
                          ? 'bg-blue-50 border-l-2 border-blue-500' 
                          : 'hover:bg-gray-100 border-l-2 border-transparent'
                      }`}
                    >
                      {/* Risk indicator bar */}
                      <div className={`w-1 h-5 rounded-full ${colors.bg}`}></div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[11px] font-medium truncate ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                          {sub.name}
                        </span>
                        <span className={`text-[11px] font-bold ${colors.text} shrink-0`}>
                          {sub.risk_percent}%
                        </span>
                      </div>
                      <Badge className={`${regionColors.badge} text-white border-0 text-[7px] px-1 py-0`}>
                        {REGION_NAMES[sub.region] || sub.region}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          )}

          {/* Center - Vertical Bar Chart with Equipment Summary */}
          <div className="flex-1 p-2 overflow-hidden">
            {selectedSubstation ? (
              <div className="h-full flex flex-col">
                {/* Substation Header - Compact */}
                <div className="flex items-center justify-between mb-1 pb-1 border-b border-gray-100">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-500" />
                      {selectedSubstation.name}
                    </h3>
                    <p className="text-[10px] text-gray-500">
                      {equipment.length} equipment • Click bar for details
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Status summary */}
                    <div className="flex items-center gap-2 text-xs">
                      {criticalCount > 0 && (
                        <span className="flex items-center gap-0.5 text-red-600 font-medium">
                          <XCircle className="h-3 w-3" />
                          {criticalCount}
                        </span>
                      )}
                      {warningCount > 0 && (
                        <span className="flex items-center gap-0.5 text-amber-600 font-medium">
                          <AlertTriangle className="h-3 w-3" />
                          {warningCount}
                        </span>
                      )}
                      <span className="flex items-center gap-0.5 text-emerald-600 font-medium">
                        <CheckCircle className="h-3 w-3" />
                        {healthyCount}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getRiskColor(selectedSubstation.risk_percent).text}`}>
                        {selectedSubstation.risk_percent}%
                      </div>
                      <p className="text-[9px] text-gray-400">Risk</p>
                    </div>
                  </div>
                </div>

                {equipmentLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : equipment.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                    No equipment found
                  </div>
                ) : (
                  <>
                    {/* Vertical Bar Chart Container - reduced height */}
                    <div className="flex-1 bg-gradient-to-b from-gray-50 to-white rounded-lg p-2 relative" style={{ minHeight: '120px', maxHeight: '140px' }}>
                      {/* Y-axis labels (Risk %) */}
                      <div className="absolute left-0 top-1 bottom-4 w-7 flex flex-col justify-between text-[8px] text-gray-400">
                        <span>100%</span>
                        <span>50%</span>
                        <span>0%</span>
                      </div>
                      
                      {/* Grid lines */}
                      <div className="absolute left-8 right-2 top-1 bottom-4 flex flex-col justify-between pointer-events-none">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="border-t border-gray-200 border-dashed"></div>
                        ))}
                      </div>

                      {/* Bars Container */}
                      <div className="ml-8 mr-2 absolute top-1 bottom-4 left-0 right-0 flex items-end gap-0.5 pl-8 pr-2">
                        {equipment.map((equip, index) => {
                          const colors = getRiskColor(equip.risk_score);
                          const isSelected = selectedEquipment?.equipment_id === equip.equipment_id;
                          const isHovered = hoveredEquipment?.equipment_id === equip.equipment_id;
                          const barHeight = Math.max(equip.risk_score, 5);
                          
                          return (
                            <div
                              key={equip.equipment_id}
                              className="relative flex flex-col items-center h-full"
                              style={{ minWidth: equipment.length > 20 ? '16px' : '22px' }}
                            >
                              {isHovered && (
                                <div className="absolute bottom-full mb-1 px-2 py-1 bg-gray-900 text-white text-[10px] rounded shadow-lg whitespace-nowrap z-20">
                                  <div className="font-medium">{equip.name}</div>
                                  <div className="text-gray-300">Risk: {equip.risk_score}%</div>
                                </div>
                              )}
                              
                              <div className="w-full h-full flex items-end">
                                <button
                                  onClick={() => handleEquipmentClick(equip)}
                                  onMouseEnter={() => setHoveredEquipment(equip)}
                                  onMouseLeave={() => setHoveredEquipment(null)}
                                  className={`
                                    w-full rounded-t transition-all duration-200 cursor-pointer
                                    ${colors.bg} ${colors.hover}
                                    ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 z-10' : ''}
                                    ${isHovered ? 'opacity-90 scale-x-110' : ''}
                                  `}
                                  style={{ 
                                    height: `${barHeight}%`,
                                    minHeight: '6px'
                                  }}
                                  title={`${equip.name}: ${equip.risk_score}% risk`}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Equipment Types Summary - Inside chart area */}
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-[10px] font-semibold text-gray-600 flex items-center gap-1">
                          <Cpu className="h-3 w-3 text-blue-500" />
                          Assets by Type
                        </h4>
                        <span className="text-[9px] text-gray-400">{equipment.length} total</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(() => {
                          const typeMap = {};
                          equipment.forEach(eq => {
                            const type = eq.equipment_type || 'unknown';
                            if (!typeMap[type]) {
                              typeMap[type] = { type, count: 0, critical: 0, warning: 0, healthy: 0 };
                            }
                            typeMap[type].count++;
                            if (eq.health_status === 'critical') typeMap[type].critical++;
                            else if (eq.health_status === 'warning') typeMap[type].warning++;
                            else typeMap[type].healthy++;
                          });
                          
                          return Object.values(typeMap).sort((a, b) => b.count - a.count).map(item => {
                            const displayName = item.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                            const hasCritical = item.critical > 0;
                            const hasWarning = item.warning > 0;
                            
                            return (
                              <div 
                                key={item.type}
                                className={`px-2 py-1 rounded border text-[10px] ${
                                  hasCritical ? 'bg-red-50 border-red-200' : 
                                  hasWarning ? 'bg-amber-50 border-amber-200' : 
                                  'bg-emerald-50 border-emerald-200'
                                }`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium text-gray-700">{displayName}</span>
                                  <span className="font-bold text-gray-900">{item.count}</span>
                                  <div className="flex items-center gap-0.5 text-[8px]">
                                    {item.critical > 0 && (
                                      <span className="flex items-center text-red-600">
                                        <XCircle className="h-2 w-2" />{item.critical}
                                      </span>
                                    )}
                                    {item.warning > 0 && (
                                      <span className="flex items-center text-amber-600">
                                        <AlertTriangle className="h-2 w-2" />{item.warning}
                                      </span>
                                    )}
                                    {item.healthy > 0 && (
                                      <span className="flex items-center text-emerald-600">
                                        <CheckCircle className="h-2 w-2" />{item.healthy}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <MapPin className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm font-medium">No Substation Selected</p>
                <p className="text-xs">{compactMode ? 'Click on heatmap to select' : 'Select from the list on the left'}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Equipment Type Summary - Substation Specific */}
      </CardContent>

      {/* Right Panel - Equipment Detail */}
      {selectedEquipment && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 z-40"
            onClick={closeDetail}
          />
          <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300 ease-out">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-300">Asset Details</span>
                <button 
                  onClick={closeDetail}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <h2 className="text-xl font-bold mb-2">{selectedEquipment.name}</h2>
              <div className="flex items-center gap-2">
                <Badge className={`${
                  selectedEquipment.health_status === 'healthy' ? 'bg-emerald-500' :
                  selectedEquipment.health_status === 'warning' ? 'bg-amber-500' :
                  'bg-red-500'
                } text-white border-0`}>
                  {selectedEquipment.health_status?.toUpperCase()}
                </Badge>
                <span className="text-sm text-slate-300">{selectedEquipment.equipment_type}</span>
              </div>
            </div>

            {detailLoading ? (
              <div className="p-6 flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Risk Score */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600">Risk Score</span>
                    <span className={`text-3xl font-bold ${getRiskColor(selectedEquipment.risk_score).text}`}>
                      {selectedEquipment.risk_score}%
                    </span>
                  </div>
                  <Progress value={selectedEquipment.risk_score} className="h-3" />
                  <p className="text-xs text-gray-400 mt-2">
                    {selectedEquipment.risk_score >= 80 ? '⚠️ Needs immediate attention' :
                     selectedEquipment.risk_score >= 50 ? '⚡ Monitor closely' :
                     '✓ Running normally'}
                  </p>
                </div>

                {/* Latest PD Reading */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                    <Activity className="h-4 w-4 text-cyan-500" />
                    Latest Readings
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-cyan-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="h-4 w-4 text-cyan-600" />
                        <span className="text-xs text-cyan-700 font-medium">PD Level</span>
                      </div>
                      <p className="text-xl font-bold text-cyan-700">
                        {equipmentDetail?.latest_reading?.pd_level_pc?.toFixed(1) || 
                         selectedEquipment.latest_reading?.pd_level_pc?.toFixed(1) || '--'} 
                        <span className="text-sm font-normal">pC</span>
                      </p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Thermometer className="h-4 w-4 text-orange-600" />
                        <span className="text-xs text-orange-700 font-medium">Temperature</span>
                      </div>
                      <p className="text-xl font-bold text-orange-700">
                        {equipmentDetail?.latest_reading?.temperature_c?.toFixed(0) ||
                         selectedEquipment.latest_reading?.temperature_c?.toFixed(0) || '--'} 
                        <span className="text-sm font-normal">°C</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Alarms */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Active Alarms
                  </h3>
                  {equipmentDetail?.alarms?.length > 0 ? (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {equipmentDetail.alarms.filter(a => a.status !== 'resolved').slice(0, 3).map((alarm, idx) => (
                        <div key={idx} className={`p-2 rounded-lg text-xs ${
                          alarm.severity === 'critical' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {alarm.message || `${alarm.severity} alarm`}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">No active alarms</span>
                    </div>
                  )}
                </div>

                {/* Equipment Info */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                    <Cpu className="h-4 w-4 text-blue-500" />
                    Equipment Info
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type</span>
                      <span className="font-medium text-gray-800">{selectedEquipment.equipment_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">ID</span>
                      <span className="font-medium text-gray-800 text-xs">{selectedEquipment.equipment_id}</span>
                    </div>
                    {selectedEquipment.manufacturer && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Manufacturer</span>
                        <span className="font-medium text-gray-800">{selectedEquipment.manufacturer}</span>
                      </div>
                    )}
                    {selectedEquipment.rating && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Rating</span>
                        <span className="font-medium text-gray-800">{selectedEquipment.rating}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Button 
                    className="w-full gap-2 bg-blue-500 hover:bg-blue-600"
                    onClick={() => navigate(`/monitoring/equipment/${selectedEquipment.equipment_id}`)}
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Full Details
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
}

export default SubstationHealthMonitor;
