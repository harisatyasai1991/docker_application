/**
 * Online Monitoring Module - Substations List Page
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
  Building2, 
  Search, 
  MapPin,
  Cpu,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Filter,
  Wifi,
  WifiOff,
  Zap
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

const REGION_COLORS = {
  central: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  eastern: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  southern: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
  western: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
};

export function SubstationsPage({ onLogout }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [substations, setSubstations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState(searchParams.get('region') || 'all');

  const fetchSubstations = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedRegion && selectedRegion !== 'all') {
        params.region = selectedRegion;
      }
      
      const response = await monitoringAPI.getSubstations(params);
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
  }, [selectedRegion]);

  const handleRegionChange = (value) => {
    setSelectedRegion(value);
    if (value && value !== 'all') {
      setSearchParams({ region: value });
    } else {
      setSearchParams({});
    }
  };

  const filteredSubstations = substations.filter(ss => 
    ss.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ss.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getHealthBadge = (substation) => {
    if (substation.critical_count > 0) {
      return <Badge className="bg-red-100 text-red-700 border-0 font-semibold">Critical</Badge>;
    }
    if (substation.warning_count > 0) {
      return <Badge className="bg-amber-100 text-amber-700 border-0 font-semibold">Warning</Badge>;
    }
    return <Badge className="bg-emerald-100 text-emerald-700 border-0 font-semibold">Healthy</Badge>;
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
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-200">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              Substations
            </h1>
            <p className="text-gray-500 mt-1">Monitor SEC substations across all regions</p>
          </div>
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

        {/* Filters */}
        <Card className="border-0 bg-white shadow-lg mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search substations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-300"
                />
              </div>
              <Select value={selectedRegion} onValueChange={handleRegionChange}>
                <SelectTrigger className="w-full sm:w-[200px] bg-gray-50 border-gray-200">
                  <Filter className="h-4 w-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Select Region" />
                </SelectTrigger>
                <SelectContent>
                  {REGION_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Substations Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <p className="text-gray-500">Loading substations...</p>
            </div>
          </div>
        ) : filteredSubstations.length === 0 ? (
          <Card className="border-0 bg-white shadow-lg">
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No substations found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSubstations.map((substation) => {
              const regionColors = REGION_COLORS[substation.region] || REGION_COLORS.central;
              
              return (
                <Card 
                  key={substation.substation_id}
                  className="border-0 bg-white shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                  onClick={() => navigate(`/monitoring/substations/${substation.substation_id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                          {substation.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          <span className={`text-xs font-medium ${regionColors.text}`}>{substation.region_name}</span>
                        </CardDescription>
                      </div>
                      {getHealthBadge(substation)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Voltage</p>
                        <p className="font-bold text-blue-600">{substation.voltage_level}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Assets</p>
                        <p className="font-bold text-gray-800">{substation.equipment_count}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Alarms</p>
                        <p className={`font-bold ${substation.alarm_count > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {substation.alarm_count || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-sm">
                        {substation.connectivity_status === 'online' ? (
                          <>
                            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-emerald-600 font-medium">Online</span>
                          </>
                        ) : (
                          <>
                            <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                            <span className="text-red-600 font-medium">Offline</span>
                          </>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 text-sm text-gray-500 text-center">
          Showing {filteredSubstations.length} substations
        </div>
      </main>
    </div>
  );
}

export default SubstationsPage;
