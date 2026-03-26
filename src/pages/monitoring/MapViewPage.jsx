/**
 * Online Monitoring Module - Map View Page
 * Interactive map showing all substations with status indicators
 * Clean, bright white theme
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AppHeader } from '../../components/AppHeader';
import { ModuleTabs } from '../../components/ModuleTabs';
import { MonitoringNav } from './MonitoringNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  Map as MapIcon, 
  Building2, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Filter,
  Cpu,
  Zap,
  Layers,
  Navigation
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { monitoringAPI } from '../../services/api';
import { toast } from 'sonner';

// Custom marker icons for different statuses
const createCustomIcon = (status) => {
  const colors = {
    healthy: { bg: '#10B981', border: '#059669' },
    warning: { bg: '#F59E0B', border: '#D97706' },
    critical: { bg: '#EF4444', border: '#DC2626' },
    offline: { bg: '#6B7280', border: '#4B5563' }
  };
  
  const color = colors[status] || colors.healthy;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${color.bg};
        border: 3px solid ${color.border};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

// Map bounds controller component
function MapBoundsController({ substations, getCoordinates }) {
  const map = useMap();
  
  useEffect(() => {
    if (substations.length > 0) {
      const bounds = substations
        .map(s => {
          const { lat, lng } = getCoordinates(s);
          return lat && lng ? [lat, lng] : null;
        })
        .filter(Boolean);
      
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [substations, map, getCoordinates]);
  
  return null;
}

// Legend component
function MapLegend() {
  return (
    <div className="absolute bottom-6 left-6 z-[1000] bg-white rounded-xl shadow-lg p-4 border border-gray-200">
      <h4 className="font-semibold text-gray-800 mb-3 text-sm">Status Legend</h4>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-emerald-600"></div>
          <span className="text-xs text-gray-600">Healthy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-amber-600"></div>
          <span className="text-xs text-gray-600">Warning</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-red-600"></div>
          <span className="text-xs text-gray-600">Critical</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-500 border-2 border-gray-600"></div>
          <span className="text-xs text-gray-600">Offline</span>
        </div>
      </div>
    </div>
  );
}

const REGION_OPTIONS = [
  { value: 'all', label: 'All Regions' },
  { value: 'central', label: 'Central Region' },
  { value: 'eastern', label: 'Eastern Region' },
  { value: 'southern', label: 'Southern Region' },
  { value: 'western', label: 'Western Region' },
];

const REGION_COLORS = {
  central: 'bg-blue-100 text-blue-700 border-blue-200',
  eastern: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  southern: 'bg-orange-100 text-orange-700 border-orange-200',
  western: 'bg-purple-100 text-purple-700 border-purple-200',
};

export function MapViewPage({ onLogout }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [substations, setSubstations] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedSubstation, setSelectedSubstation] = useState(null);

  const fetchSubstations = async () => {
    try {
      setLoading(true);
      const response = await monitoringAPI.getSubstations({});
      setSubstations(response.substations || []);
    } catch (error) {
      console.error('Error fetching substations:', error);
      toast.error('Failed to load substations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubstations();
  }, []);

  // Filter substations by region
  const filteredSubstations = useMemo(() => {
    if (selectedRegion === 'all') return substations;
    return substations.filter(s => s.region === selectedRegion);
  }, [substations, selectedRegion]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const filtered = filteredSubstations;
    return {
      total: filtered.length,
      healthy: filtered.filter(s => !s.critical_count && !s.warning_count).length,
      warning: filtered.filter(s => s.warning_count > 0 && !s.critical_count).length,
      critical: filtered.filter(s => s.critical_count > 0).length,
      totalEquipment: filtered.reduce((sum, s) => sum + (s.equipment_count || 0), 0),
      totalAlarms: filtered.reduce((sum, s) => sum + (s.alarm_count || 0), 0)
    };
  }, [filteredSubstations]);

  // Get substation status
  const getSubstationStatus = (substation) => {
    if (substation.connectivity_status === 'offline') return 'offline';
    if (substation.critical_count > 0) return 'critical';
    if (substation.warning_count > 0) return 'warning';
    return 'healthy';
  };

  // Helper to get coordinates from substation
  const getCoordinates = (substation) => {
    // Coordinates can be at top level or nested in location object
    const lat = substation.latitude || substation.location?.latitude;
    const lng = substation.longitude || substation.location?.longitude;
    return { lat, lng };
  };

  // Saudi Arabia center coordinates
  const saudiArabiaCenter = [24.7136, 46.6753];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        <AppHeader onLogout={onLogout} />
        <ModuleTabs />
        <MonitoringNav />
        <div className="flex items-center justify-center h-[calc(100vh-128px)]">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-gray-500">Loading map data...</p>
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
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-200">
                <MapIcon className="h-6 w-6 text-white" />
              </div>
              Map View
            </h1>
            <p className="text-gray-500 mt-1">Geographic overview of SEC substations</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-[180px] bg-white border-gray-200 shadow-sm">
                <Filter className="h-4 w-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Filter Region" />
              </SelectTrigger>
              <SelectContent>
                {REGION_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchSubstations}
              className="gap-2 bg-white border-gray-200 hover:bg-gray-50 hover:border-blue-300 shadow-sm"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <Card className="border-0 bg-white shadow-md">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                  <p className="text-xs text-gray-500">Substations</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 bg-white shadow-md">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-md">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{stats.healthy}</p>
                  <p className="text-xs text-gray-500">Healthy</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 bg-white shadow-md">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-md">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{stats.warning}</p>
                  <p className="text-xs text-gray-500">Warning</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 bg-white shadow-md">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-md">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
                  <p className="text-xs text-gray-500">Critical</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 bg-white shadow-md">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-md">
                  <Cpu className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalEquipment}</p>
                  <p className="text-xs text-gray-500">Assets</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 bg-white shadow-md">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">{stats.totalAlarms}</p>
                  <p className="text-xs text-gray-500">Active Alarms</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map Container */}
        <Card className="border-0 bg-white shadow-lg overflow-hidden">
          <div className="relative h-[600px]">
            <MapContainer
              center={saudiArabiaCenter}
              zoom={6}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <MapBoundsController substations={filteredSubstations} getCoordinates={getCoordinates} />
              
              {filteredSubstations
                .filter(s => {
                  const { lat, lng } = getCoordinates(s);
                  return lat && lng;
                })
                .map((substation) => {
                  const status = getSubstationStatus(substation);
                  const { lat, lng } = getCoordinates(substation);
                  
                  return (
                    <Marker
                      key={substation.substation_id}
                      position={[lat, lng]}
                      icon={createCustomIcon(status)}
                      eventHandlers={{
                        click: () => setSelectedSubstation(substation)
                      }}
                    >
                      <Popup className="custom-popup">
                        <div className="p-2 min-w-[220px]">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-gray-800">{substation.name}</h3>
                            <Badge className={`border-0 text-xs ${
                              status === 'critical' ? 'bg-red-100 text-red-700' :
                              status === 'warning' ? 'bg-amber-100 text-amber-700' :
                              status === 'offline' ? 'bg-gray-100 text-gray-700' :
                              'bg-emerald-100 text-emerald-700'
                            }`}>
                              {status}
                            </Badge>
                          </div>
                          <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${REGION_COLORS[substation.region] || ''}`}>
                            {substation.region_name}
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p><span className="text-gray-400">Voltage:</span> {substation.voltage_level}</p>
                            <p><span className="text-gray-400">Equipment:</span> {substation.equipment_count}</p>
                            <p><span className="text-gray-400">Alarms:</span> <span className={substation.alarm_count > 0 ? 'text-amber-600 font-medium' : ''}>{substation.alarm_count || 0}</span></p>
                          </div>
                          <Button
                            size="sm"
                            className="w-full mt-3 bg-blue-500 hover:bg-blue-600 text-white"
                            onClick={() => navigate(`/monitoring/substations/${substation.substation_id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
            </MapContainer>
            
            {/* Legend */}
            <MapLegend />
            
            {/* Region Quick Filter */}
            <div className="absolute top-4 right-4 z-[1000] bg-white rounded-xl shadow-lg p-3 border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-500" />
                Quick Filter
              </h4>
              <div className="flex flex-wrap gap-2">
                {REGION_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedRegion(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedRegion === opt.value
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Substation List Below Map */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Navigation className="h-5 w-5 text-blue-500" />
            Substations in {selectedRegion === 'all' ? 'All Regions' : REGION_OPTIONS.find(r => r.value === selectedRegion)?.label}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredSubstations.map((substation) => {
              const status = getSubstationStatus(substation);
              
              return (
                <Card 
                  key={substation.substation_id}
                  className={`border-0 shadow-md cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                    status === 'critical' ? 'bg-gradient-to-br from-red-50 to-white' :
                    status === 'warning' ? 'bg-gradient-to-br from-amber-50 to-white' :
                    'bg-white'
                  }`}
                  onClick={() => navigate(`/monitoring/substations/${substation.substation_id}`)}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-800 text-sm">{substation.name}</h3>
                        <p className={`text-xs font-medium ${REGION_COLORS[substation.region]?.split(' ')[1] || 'text-gray-500'}`}>
                          {substation.region_name}
                        </p>
                      </div>
                      <Badge className={`border-0 text-xs ${
                        status === 'critical' ? 'bg-red-100 text-red-700' :
                        status === 'warning' ? 'bg-amber-100 text-amber-700' :
                        status === 'offline' ? 'bg-gray-100 text-gray-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Cpu className="h-3 w-3" />
                        {substation.equipment_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <AlertTriangle className={`h-3 w-3 ${substation.alarm_count > 0 ? 'text-amber-500' : ''}`} />
                        {substation.alarm_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {substation.voltage_level}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
      
      {/* Custom CSS for Leaflet popups */}
      <style>{`
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 0;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        .leaflet-popup-content {
          margin: 0;
        }
        .leaflet-popup-tip {
          background: white;
        }
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}

export default MapViewPage;
