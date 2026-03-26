/**
 * Online Monitoring Module - Equipment List Page
 * Clean, bright white theme
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { ModuleTabs } from '../../components/ModuleTabs';
import { MonitoringNav } from './MonitoringNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { 
  Cpu, 
  Search, 
  Filter,
  RefreshCw,
  Activity,
  Thermometer,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Building2
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

const REGION_OPTIONS = [
  { value: 'all', label: 'All Regions' },
  { value: 'central', label: 'Central Region' },
  { value: 'eastern', label: 'Eastern Region' },
  { value: 'southern', label: 'Southern Region' },
  { value: 'western', label: 'Western Region' },
];

const HEALTH_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'healthy', label: 'Healthy' },
  { value: 'warning', label: 'Warning' },
  { value: 'critical', label: 'Critical' },
];

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'power_transformer', label: 'Power Transformer' },
  { value: 'gis_switchgear', label: 'GIS Switchgear' },
  { value: 'cable_termination', label: 'Cable Termination' },
  { value: 'cable_joint', label: 'Cable Joint' },
  { value: 'bushing', label: 'Bushing' },
];

export function EquipmentListPage({ onLogout }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [equipment, setEquipment] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState(searchParams.get('region') || 'all');
  const [selectedHealth, setSelectedHealth] = useState(searchParams.get('health_status') || 'all');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || 'all');

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedRegion !== 'all') params.region = selectedRegion;
      if (selectedHealth !== 'all') params.health_status = selectedHealth;
      if (selectedType !== 'all') params.equipment_type = selectedType;
      
      const response = await monitoringAPI.getEquipment(params);
      setEquipment(response.equipment || []);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      toast.error('Failed to load equipment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [selectedRegion, selectedHealth, selectedType]);

  const updateFilters = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const handleRegionChange = (value) => {
    setSelectedRegion(value);
    updateFilters('region', value);
  };

  const handleHealthChange = (value) => {
    setSelectedHealth(value);
    updateFilters('health_status', value);
  };

  const handleTypeChange = (value) => {
    setSelectedType(value);
    updateFilters('type', value);
  };

  const filteredEquipment = equipment.filter(eq => 
    eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    eq.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    eq.substation_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const getTrendIcon = (trend) => {
    switch(trend) {
      case 'improving':
        return <TrendingDown className="h-4 w-4 text-emerald-500" />;
      case 'degrading':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getHealthCardStyle = (status) => {
    switch(status) {
      case 'critical':
        return 'border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-white';
      case 'warning':
        return 'border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50 to-white';
      default:
        return 'border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50 to-white';
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
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl shadow-lg shadow-cyan-200">
                <Cpu className="h-6 w-6 text-white" />
              </div>
              Assets
            </h1>
            <p className="text-gray-500 mt-1">Monitor all assets across substations</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchEquipment}
            className="gap-2 bg-white border-gray-200 hover:bg-gray-50 hover:border-blue-300 shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-0 bg-white shadow-lg mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-300"
                />
              </div>
              <Select value={selectedRegion} onValueChange={handleRegionChange}>
                <SelectTrigger className="bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Select Region" />
                </SelectTrigger>
                <SelectContent>
                  {REGION_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedHealth} onValueChange={handleHealthChange}>
                <SelectTrigger className="bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Health Status" />
                </SelectTrigger>
                <SelectContent>
                  {HEALTH_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedType} onValueChange={handleTypeChange}>
                <SelectTrigger className="bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Asset Type" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Equipment List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
              <p className="text-gray-500">Loading assets...</p>
            </div>
          </div>
        ) : filteredEquipment.length === 0 ? (
          <Card className="border-0 bg-white shadow-lg">
            <CardContent className="py-12 text-center">
              <Cpu className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No assets found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredEquipment.map((eq) => (
              <Card 
                key={eq.equipment_id}
                className={`border-0 shadow-md cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.005] ${getHealthCardStyle(eq.health_status)}`}
                onClick={() => navigate(`/monitoring/equipment/${eq.equipment_id}`)}
              >
                <CardContent className="py-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl shadow-sm ${
                        eq.health_status === 'critical' ? 'bg-red-100' :
                        eq.health_status === 'warning' ? 'bg-amber-100' :
                        'bg-emerald-100'
                      }`}>
                        <Cpu className={`h-6 w-6 ${
                          eq.health_status === 'critical' ? 'text-red-600' :
                          eq.health_status === 'warning' ? 'text-amber-600' :
                          'text-emerald-600'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-800">{eq.name}</h3>
                          {getHealthBadge(eq.health_status)}
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="h-3 w-3" />
                          {eq.substation_name}
                        </p>
                        <p className="text-xs text-gray-400 capitalize mt-0.5">
                          {eq.equipment_type.replace(/_/g, ' ')} | {eq.manufacturer}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center px-4 py-2 bg-gray-50 rounded-lg">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1">PD Level</p>
                        <div className="flex items-center justify-center gap-2">
                          <Activity className={`h-4 w-4 ${
                            eq.current_readings?.pd_level_pc > 20 ? 'text-red-500' :
                            eq.current_readings?.pd_level_pc > 10 ? 'text-amber-500' :
                            'text-emerald-500'
                          }`} />
                          <span className={`font-bold ${
                            eq.current_readings?.pd_level_pc > 20 ? 'text-red-600' :
                            eq.current_readings?.pd_level_pc > 10 ? 'text-amber-600' :
                            'text-gray-800'
                          }`}>
                            {eq.current_readings?.pd_level_pc?.toFixed(1) || 0} pC
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-center px-4 py-2 bg-gray-50 rounded-lg">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1">Temperature</p>
                        <div className="flex items-center justify-center gap-2">
                          <Thermometer className="h-4 w-4 text-orange-500" />
                          <span className="font-bold text-gray-800">
                            {eq.current_readings?.temperature_c?.toFixed(1) || 0}°C
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-center px-4 py-2 bg-gray-50 rounded-lg">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1">Trend</p>
                        <div className="flex items-center justify-center gap-1">
                          {getTrendIcon(eq.trend)}
                          <span className="text-sm text-gray-600 capitalize">{eq.trend}</span>
                        </div>
                      </div>
                      
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 text-sm text-gray-500 text-center">
          Showing {filteredEquipment.length} of {equipment.length} assets
        </div>
      </main>
    </div>
  );
}

export default EquipmentListPage;
