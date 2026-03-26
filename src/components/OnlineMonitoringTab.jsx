/**
 * Online Monitoring Tab Content for Asset Detail Page
 * Shows real-time sensor readings with values and trend sparklines
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Activity, 
  Thermometer, 
  Droplets, 
  Gauge, 
  Zap, 
  Waves,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  X,
  ExternalLink,
  RefreshCw,
  Clock,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { moduleLinksAPI, monitoringAPI } from '../services/api';
import { TrendAnalysisModal } from './TrendAnalysisModal';

// Generate realistic demo sensor data with trends
const generateSensorData = (baseValue, variance, points = 24) => {
  const data = [];
  let value = baseValue;
  for (let i = 0; i < points; i++) {
    value = value + (Math.random() - 0.5) * variance;
    value = Math.max(0, value); // Don't go below 0
    data.push({ value: Math.round(value * 10) / 10 });
  }
  return data;
};

// Calculate trend from data
const calculateTrend = (data) => {
  if (data.length < 2) return 'stable';
  const first = data.slice(0, Math.floor(data.length / 2)).reduce((a, b) => a + b.value, 0) / Math.floor(data.length / 2);
  const second = data.slice(Math.floor(data.length / 2)).reduce((a, b) => a + b.value, 0) / Math.ceil(data.length / 2);
  const diff = second - first;
  if (diff > 2) return 'up';
  if (diff < -2) return 'down';
  return 'stable';
};

// Sensor parameter definitions
const SENSOR_PARAMS = [
  { 
    id: 'pd_level', 
    name: 'PD Level', 
    unit: 'pC', 
    icon: Activity,
    baseValue: 15, 
    variance: 8,
    thresholds: { warning: 50, critical: 100 },
    color: '#3b82f6'
  },
  { 
    id: 'temperature', 
    name: 'Temperature', 
    unit: '°C', 
    icon: Thermometer,
    baseValue: 45, 
    variance: 5,
    thresholds: { warning: 65, critical: 85 },
    color: '#ef4444'
  },
  { 
    id: 'humidity', 
    name: 'Humidity', 
    unit: '%', 
    icon: Droplets,
    baseValue: 35, 
    variance: 10,
    thresholds: { warning: 60, critical: 80 },
    color: '#06b6d4'
  },
  { 
    id: 'oil_level', 
    name: 'Oil Level', 
    unit: '%', 
    icon: Gauge,
    baseValue: 85, 
    variance: 3,
    thresholds: { warning: 70, critical: 50, inverse: true },
    color: '#f59e0b'
  },
  { 
    id: 'load_current', 
    name: 'Load Current', 
    unit: 'A', 
    icon: Zap,
    baseValue: 250, 
    variance: 50,
    thresholds: { warning: 400, critical: 500 },
    color: '#8b5cf6'
  },
  { 
    id: 'vibration', 
    name: 'Vibration', 
    unit: 'mm/s', 
    icon: Waves,
    baseValue: 2.5, 
    variance: 1.5,
    thresholds: { warning: 5, critical: 8 },
    color: '#10b981'
  },
];

// Get status based on value and thresholds
const getStatus = (value, thresholds) => {
  if (thresholds.inverse) {
    if (value <= thresholds.critical) return 'critical';
    if (value <= thresholds.warning) return 'warning';
    return 'healthy';
  }
  if (value >= thresholds.critical) return 'critical';
  if (value >= thresholds.warning) return 'warning';
  return 'healthy';
};

// Trend icon component
const TrendIcon = ({ trend, className }) => {
  if (trend === 'up') return <TrendingUp className={`${className} text-amber-500`} />;
  if (trend === 'down') return <TrendingDown className={`${className} text-blue-500`} />;
  return <Minus className={`${className} text-gray-400`} />;
};

// Status icon component - just icon, no text
const StatusIcon = ({ status }) => {
  if (status === 'healthy') {
    return (
      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
        <CheckCircle className="w-4 h-4 text-emerald-600" />
      </div>
    );
  }
  // Warning or Critical - show X
  return (
    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
      status === 'critical' ? 'bg-red-100' : 'bg-amber-100'
    }`}>
      <X className={`w-4 h-4 ${status === 'critical' ? 'text-red-600' : 'text-amber-600'}`} />
    </div>
  );
};

// Mini sparkline chart component
const Sparkline = ({ data, color, status }) => {
  const strokeColor = status === 'critical' ? '#ef4444' : status === 'warning' ? '#f59e0b' : color;
  return (
    <div className="h-10 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={strokeColor}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Sensor parameter row component
const SensorRow = ({ param, data, value, status, trend, onClick }) => {
  const Icon = param.icon;
  return (
    <div 
      onClick={onClick}
      className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
        status === 'critical' 
          ? 'bg-red-50 border-red-200 hover:bg-red-100' 
          : status === 'warning'
          ? 'bg-amber-50 border-amber-200 hover:bg-amber-100'
          : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-blue-300'
      }`}
      data-testid={`sensor-row-${param.id}`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${
          status === 'critical' 
            ? 'bg-red-100' 
            : status === 'warning'
            ? 'bg-amber-100'
            : 'bg-white'
        }`}>
          <Icon className={`w-4 h-4 ${
            status === 'critical' 
              ? 'text-red-600' 
              : status === 'warning'
              ? 'text-amber-600'
              : 'text-gray-600'
          }`} style={{ color: status === 'healthy' ? param.color : undefined }} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800">{param.name}</p>
          <p className="text-xs text-gray-500">{param.unit}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Sparkline - clickable indicator */}
        <div className="relative group">
          <Sparkline data={data} color={param.color} status={status} />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <BarChart3 className="w-4 h-4 text-blue-500" />
          </div>
        </div>
        
        {/* Current Value + Trend */}
        <div className="flex items-center gap-2 min-w-[70px] justify-end">
          <span className={`text-lg font-bold ${
            status === 'critical' 
              ? 'text-red-600' 
              : status === 'warning'
              ? 'text-amber-600'
              : 'text-gray-800'
          }`}>
            {value}
          </span>
          <TrendIcon trend={trend} className="w-4 h-4" />
        </div>
        
        {/* Status Icon */}
        <StatusIcon status={status} />
      </div>
    </div>
  );
};

export const OnlineMonitoringTab = ({ assetId, assetName, assetPhoto, linkedEquipment }) => {
  const navigate = useNavigate();
  const [sensorData, setSensorData] = useState({});
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [equipmentDetails, setEquipmentDetails] = useState(null);
  const [showTrendModal, setShowTrendModal] = useState(false);

  // Generate initial sensor data
  useEffect(() => {
    generateAllSensorData();
    
    // Fetch equipment details if linked
    if (linkedEquipment && linkedEquipment.length > 0) {
      fetchEquipmentDetails(linkedEquipment[0].equipment_id);
    }
  }, [linkedEquipment]);

  const fetchEquipmentDetails = async (equipmentId) => {
    try {
      const response = await monitoringAPI.getEquipmentDetail(equipmentId);
      setEquipmentDetails(response);
    } catch (error) {
      console.error('Failed to fetch equipment details:', error);
    }
  };

  const generateAllSensorData = () => {
    const newData = {};
    SENSOR_PARAMS.forEach(param => {
      const data = generateSensorData(param.baseValue, param.variance);
      const currentValue = data[data.length - 1].value;
      newData[param.id] = {
        data,
        value: currentValue,
        status: getStatus(currentValue, param.thresholds),
        trend: calculateTrend(data)
      };
    });
    setSensorData(newData);
    setLastUpdated(new Date());
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      generateAllSensorData();
      setIsRefreshing(false);
    }, 500);
  };

  // Get overall health status
  const overallStatus = Object.values(sensorData).some(s => s.status === 'critical') 
    ? 'critical'
    : Object.values(sensorData).some(s => s.status === 'warning')
    ? 'warning'
    : 'healthy';

  const hasLinkedEquipment = linkedEquipment && linkedEquipment.length > 0;

  return (
    <div className="space-y-4">
      {/* Header with status and refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            overallStatus === 'critical' 
              ? 'bg-red-100' 
              : overallStatus === 'warning'
              ? 'bg-amber-100'
              : 'bg-emerald-100'
          }`}>
            <Activity className={`w-5 h-5 ${
              overallStatus === 'critical' 
                ? 'text-red-600' 
                : overallStatus === 'warning'
                ? 'text-amber-600'
                : 'text-emerald-600'
            }`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Real-time Monitoring</h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusIcon status={overallStatus} />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column - Asset Photo */}
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden border border-gray-200">
            <img 
              src={assetPhoto} 
              alt={assetName}
              className="w-full h-48 object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
              <p className="text-white text-sm font-medium">Live Monitoring Active</p>
            </div>
            
            {/* Status indicator overlay */}
            <div className="absolute top-2 right-2">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                overallStatus === 'critical'
                  ? 'bg-red-500 text-white'
                  : overallStatus === 'warning'
                  ? 'bg-amber-500 text-white'
                  : 'bg-emerald-500 text-white'
              }`}>
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                {overallStatus === 'healthy' ? 'Normal' : overallStatus.charAt(0).toUpperCase() + overallStatus.slice(1)}
              </div>
            </div>
          </div>

          {/* Equipment Info Card */}
          {hasLinkedEquipment && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-600 font-medium">Linked Equipment</p>
                    <p className="text-sm font-semibold text-gray-800">{linkedEquipment[0].name || linkedEquipment[0].code}</p>
                    <p className="text-xs text-gray-500">{linkedEquipment[0].substation_name}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/monitoring/equipment/${linkedEquipment[0].equipment_id}`)}
                    className="h-8 text-blue-600 border-blue-300 hover:bg-blue-100"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No linked equipment message */}
          {!hasLinkedEquipment && (
            <Card className="border-gray-200 bg-gray-50">
              <CardContent className="p-4 text-center">
                <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">No monitoring equipment linked</p>
                <p className="text-xs text-gray-500 mt-1">Link this asset to online monitoring equipment to see real-time data</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Sensor Parameters */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Click any parameter for detailed analysis</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTrendModal(true)}
              className="h-7 text-xs"
            >
              <BarChart3 className="w-3 h-3 mr-1" />
              Full Analysis
            </Button>
          </div>
          {SENSOR_PARAMS.map(param => (
            <SensorRow
              key={param.id}
              param={param}
              data={sensorData[param.id]?.data || []}
              value={sensorData[param.id]?.value || 0}
              status={sensorData[param.id]?.status || 'healthy'}
              trend={sensorData[param.id]?.trend || 'stable'}
              onClick={() => setShowTrendModal(true)}
            />
          ))}
        </div>
      </div>
      
      {/* Trend Analysis Modal */}
      <TrendAnalysisModal
        isOpen={showTrendModal}
        onClose={() => setShowTrendModal(false)}
        assetName={assetName}
        initialData={sensorData}
      />
    </div>
  );
};

export default OnlineMonitoringTab;
