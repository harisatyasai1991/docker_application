/**
 * Trend Analysis Modal - Advanced charting for Online Monitoring
 * Features:
 * - Time range selection (24h, 48h, 7d)
 * - Grouped charts by unit type
 * - Duval Triangle for DGA analysis
 * - Multi-chart comparison with synchronized cursors
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import {
  Activity,
  Thermometer,
  Droplets,
  Gauge,
  Zap,
  Waves,
  Clock,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  Triangle,
  TrendingUp,
  Layers,
  BarChart3,
  RefreshCw,
  Download,
  Settings,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '../lib/utils';

// Time range options
const TIME_RANGES = [
  { id: '24h', label: '24 Hours', hours: 24, interval: 1 },
  { id: '48h', label: '48 Hours', hours: 48, interval: 2 },
  { id: '7d', label: '7 Days', hours: 168, interval: 6 },
];

// Parameter definitions with grouping
const PARAMETERS = [
  { id: 'pd_level', name: 'PD Level', unit: 'pC', group: 'electrical', color: '#3b82f6', icon: Activity, baseValue: 15, variance: 8 },
  { id: 'temperature', name: 'Temperature', unit: '°C', group: 'thermal', color: '#ef4444', icon: Thermometer, baseValue: 45, variance: 5 },
  { id: 'humidity', name: 'Humidity', unit: '%', group: 'environmental', color: '#06b6d4', icon: Droplets, baseValue: 35, variance: 10 },
  { id: 'oil_level', name: 'Oil Level', unit: '%', group: 'environmental', color: '#f59e0b', icon: Gauge, baseValue: 85, variance: 3 },
  { id: 'load_current', name: 'Load Current', unit: 'A', group: 'electrical', color: '#8b5cf6', icon: Zap, baseValue: 250, variance: 50 },
  { id: 'vibration', name: 'Vibration', unit: 'mm/s', group: 'mechanical', color: '#10b981', icon: Waves, baseValue: 2.5, variance: 1.5 },
];

// Chart groups for overlaying same-unit parameters
const CHART_GROUPS = [
  { id: 'pd', name: 'Partial Discharge', params: ['pd_level'], unit: 'pC' },
  { id: 'thermal', name: 'Temperature', params: ['temperature'], unit: '°C' },
  { id: 'environmental', name: 'Environmental (%)', params: ['humidity', 'oil_level'], unit: '%' },
  { id: 'electrical', name: 'Load Current', params: ['load_current'], unit: 'A' },
  { id: 'mechanical', name: 'Vibration', params: ['vibration'], unit: 'mm/s' },
];

// Duval Triangle zones (simplified)
const DUVAL_ZONES = [
  { name: 'PD', description: 'Partial Discharge', color: '#3b82f6' },
  { name: 'D1', description: 'Low Energy Discharge', color: '#8b5cf6' },
  { name: 'D2', description: 'High Energy Discharge', color: '#a855f7' },
  { name: 'T1', description: 'Thermal < 300°C', color: '#f59e0b' },
  { name: 'T2', description: 'Thermal 300-700°C', color: '#f97316' },
  { name: 'T3', description: 'Thermal > 700°C', color: '#ef4444' },
  { name: 'DT', description: 'Thermal + Discharge', color: '#ec4899' },
];

// Generate time series data
const generateTimeSeriesData = (hours, intervalHours, params) => {
  const data = [];
  const now = new Date();
  const points = Math.floor(hours / intervalHours);
  
  // Initialize running values for each parameter
  const runningValues = {};
  params.forEach(p => {
    runningValues[p.id] = p.baseValue;
  });
  
  for (let i = points; i >= 0; i--) {
    const time = new Date(now.getTime() - i * intervalHours * 60 * 60 * 1000);
    const point = {
      time: time.toISOString(),
      timeLabel: hours <= 48 
        ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : time.toLocaleDateString([], { month: 'short', day: 'numeric' }),
    };
    
    params.forEach(p => {
      // Random walk with mean reversion
      const change = (Math.random() - 0.5) * p.variance;
      const meanReversion = (p.baseValue - runningValues[p.id]) * 0.1;
      runningValues[p.id] = Math.max(0, runningValues[p.id] + change + meanReversion);
      point[p.id] = Math.round(runningValues[p.id] * 10) / 10;
    });
    
    data.push(point);
  }
  
  return data;
};

// Generate Duval Triangle data points
const generateDuvalData = () => {
  // Simulated DGA readings over time
  const readings = [];
  for (let i = 0; i < 10; i++) {
    const ch4 = 20 + Math.random() * 30;
    const c2h4 = 10 + Math.random() * 25;
    const c2h2 = 5 + Math.random() * 15;
    const total = ch4 + c2h4 + c2h2;
    
    readings.push({
      date: new Date(Date.now() - (9 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      ch4: Math.round((ch4 / total) * 100),
      c2h4: Math.round((c2h4 / total) * 100),
      c2h2: Math.round((c2h2 / total) * 100),
      zone: DUVAL_ZONES[Math.floor(Math.random() * DUVAL_ZONES.length)].name,
    });
  }
  return readings;
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  
  // Filter out duplicate entries (from Area + Line having same dataKey)
  const uniquePayload = payload.filter((entry, index, self) => 
    index === self.findIndex(e => e.dataKey === entry.dataKey)
  );
  
  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      {uniquePayload.map((entry, index) => {
        const param = PARAMETERS.find(p => p.id === entry.dataKey);
        return (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-700">{param?.name || entry.name}:</span>
            <span className="font-semibold">{entry.value} {param?.unit}</span>
          </div>
        );
      })}
    </div>
  );
};

// Duval Triangle SVG Component
const DuvalTriangle = ({ data }) => {
  const width = 300;
  const height = 260;
  const padding = 30;
  
  // Triangle vertices
  const top = { x: width / 2, y: padding };
  const left = { x: padding, y: height - padding };
  const right = { x: width - padding, y: height - padding };
  
  // Convert percentages to triangle coordinates
  const getPoint = (ch4, c2h4, c2h2) => {
    const total = ch4 + c2h4 + c2h2;
    const a = ch4 / total;
    const b = c2h4 / total;
    const c = c2h2 / total;
    
    const x = left.x * a + right.x * b + top.x * c;
    const y = left.y * a + right.y * b + top.y * c;
    
    return { x, y };
  };
  
  const latestPoint = data.length > 0 ? getPoint(data[data.length - 1].ch4, data[data.length - 1].c2h4, data[data.length - 1].c2h2) : null;
  
  return (
    <div className="flex flex-col items-center">
      <svg width={width} height={height} className="overflow-visible">
        {/* Triangle outline */}
        <polygon
          points={`${top.x},${top.y} ${left.x},${left.y} ${right.x},${right.y}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="2"
        />
        
        {/* Zone regions (simplified) */}
        <polygon
          points={`${top.x},${top.y} ${(top.x + left.x) / 2},${(top.y + left.y) / 2} ${(top.x + right.x) / 2},${(top.y + right.y) / 2}`}
          fill="#3b82f620"
          stroke="#3b82f6"
          strokeWidth="1"
        />
        
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((ratio, i) => (
          <g key={i}>
            <line
              x1={left.x + (top.x - left.x) * ratio}
              y1={left.y + (top.y - left.y) * ratio}
              x2={left.x + (right.x - left.x) * ratio}
              y2={left.y}
              stroke="#e5e7eb"
              strokeDasharray="2,2"
            />
          </g>
        ))}
        
        {/* Historical points */}
        {data.slice(0, -1).map((point, i) => {
          const pos = getPoint(point.ch4, point.c2h4, point.c2h2);
          return (
            <circle
              key={i}
              cx={pos.x}
              cy={pos.y}
              r="4"
              fill="#94a3b8"
              opacity={0.5 + (i / data.length) * 0.5}
            />
          );
        })}
        
        {/* Latest point */}
        {latestPoint && (
          <g>
            <circle
              cx={latestPoint.x}
              cy={latestPoint.y}
              r="8"
              fill="#3b82f6"
              stroke="#fff"
              strokeWidth="2"
            />
            <circle
              cx={latestPoint.x}
              cy={latestPoint.y}
              r="12"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              opacity="0.5"
            >
              <animate
                attributeName="r"
                from="8"
                to="16"
                dur="1.5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                from="0.5"
                to="0"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        )}
        
        {/* Labels */}
        <text x={top.x} y={top.y - 10} textAnchor="middle" className="text-xs fill-gray-600">C₂H₂</text>
        <text x={left.x - 10} y={left.y + 15} textAnchor="middle" className="text-xs fill-gray-600">CH₄</text>
        <text x={right.x + 10} y={right.y + 15} textAnchor="middle" className="text-xs fill-gray-600">C₂H₄</text>
      </svg>
      
      {/* Legend */}
      <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
        {DUVAL_ZONES.slice(0, 4).map(zone => (
          <div key={zone.name} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: zone.color }} />
            <span>{zone.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Parameter visibility toggle component
const ParameterToggle = ({ param, visible, onToggle }) => {
  const Icon = param.icon;
  return (
    <button
      onClick={() => onToggle(param.id)}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
        visible
          ? "bg-gray-100 text-gray-800 border border-gray-300"
          : "bg-gray-50 text-gray-400 border border-gray-200"
      )}
    >
      <div 
        className="w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: visible ? param.color : '#d1d5db' }}
      />
      <span>{param.name}</span>
      {visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
    </button>
  );
};

// Single chart panel component
const ChartPanel = ({ group, data, visibleParams, cursorTime, onCursorMove }) => {
  const groupParams = PARAMETERS.filter(p => group.params.includes(p.id) && visibleParams.includes(p.id));
  
  if (groupParams.length === 0) return null;
  
  return (
    <Card className="border-gray-200">
      <CardHeader className="py-2 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-700">{group.name}</CardTitle>
          <Badge variant="outline" className="text-xs">{group.unit}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-2">
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={data}
              onMouseMove={(e) => e && e.activeLabel && onCursorMove(e.activeLabel)}
              onMouseLeave={() => onCursorMove(null)}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="timeLabel" 
                tick={{ fontSize: 10 }} 
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 10 }} 
                tickLine={false}
                width={40}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              {groupParams.length > 1 && <Legend wrapperStyle={{ fontSize: '10px' }} />}
              
              {groupParams.map((param, idx) => (
                <React.Fragment key={param.id}>
                  <defs>
                    <linearGradient id={`gradient-${param.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={param.color} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={param.color} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey={param.id}
                    fill={`url(#gradient-${param.id})`}
                    stroke="none"
                    legendType="none"
                    tooltipType="none"
                  />
                  <Line
                    type="monotone"
                    dataKey={param.id}
                    name={param.name}
                    stroke={param.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2 }}
                  />
                </React.Fragment>
              ))}
              
              {/* Synchronized cursor line */}
              {cursorTime && (
                <ReferenceLine
                  x={cursorTime}
                  stroke="#6366f1"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Modal Component
export const TrendAnalysisModal = ({ isOpen, onClose, assetName, initialData }) => {
  const [timeRange, setTimeRange] = useState('24h');
  const [activeTab, setActiveTab] = useState('trends');
  const [visibleParams, setVisibleParams] = useState(PARAMETERS.map(p => p.id));
  const [cursorTime, setCursorTime] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Generate data based on time range
  const chartData = useMemo(() => {
    const range = TIME_RANGES.find(r => r.id === timeRange);
    return generateTimeSeriesData(range.hours, range.interval, PARAMETERS);
  }, [timeRange]);
  
  // Duval data
  const duvalData = useMemo(() => generateDuvalData(), []);
  
  // Toggle parameter visibility
  const toggleParam = useCallback((paramId) => {
    setVisibleParams(prev => 
      prev.includes(paramId) 
        ? prev.filter(id => id !== paramId)
        : [...prev, paramId]
    );
  }, []);
  
  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Trend Analysis</DialogTitle>
                <p className="text-sm text-gray-500">{assetName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("w-4 h-4 mr-1", isRefreshing && "animate-spin")} />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-hidden flex flex-col px-6 pb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2 flex-shrink-0 mb-4">
              <TabsList className="bg-gray-100">
                <TabsTrigger value="trends" className="data-[state=active]:bg-white">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Time Trends
                </TabsTrigger>
                <TabsTrigger value="comparison" className="data-[state=active]:bg-white">
                  <Layers className="w-4 h-4 mr-1" />
                  Comparison
                </TabsTrigger>
                <TabsTrigger value="duval" className="data-[state=active]:bg-white">
                  <Triangle className="w-4 h-4 mr-1" />
                  Duval Triangle
                </TabsTrigger>
              </TabsList>
              
              {/* Time Range Selector */}
              {activeTab !== 'duval' && (
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                  {TIME_RANGES.map(range => (
                    <button
                      key={range.id}
                      onClick={() => setTimeRange(range.id)}
                      className={cn(
                        "px-3 py-1 rounded text-sm font-medium transition-all",
                        timeRange === range.id
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Trends Tab */}
            <TabsContent value="trends" className="flex-1 overflow-y-auto mt-0 pr-2">
              {/* Parameter toggles */}
              <div className="flex flex-wrap gap-2 mb-4">
                {PARAMETERS.map(param => (
                  <ParameterToggle
                    key={param.id}
                    param={param}
                    visible={visibleParams.includes(param.id)}
                    onToggle={toggleParam}
                  />
                ))}
              </div>
              
              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {CHART_GROUPS.map(group => (
                  <ChartPanel
                    key={group.id}
                    group={group}
                    data={chartData}
                    visibleParams={visibleParams}
                    cursorTime={cursorTime}
                    onCursorMove={setCursorTime}
                  />
                ))}
              </div>
              
              {/* Synchronized cursor indicator */}
              {cursorTime && (
                <div className="mt-2 text-center text-xs text-gray-500">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Cursor synchronized across all charts
                </div>
              )}
            </TabsContent>
            
            {/* Comparison Tab */}
            <TabsContent value="comparison" className="flex-1 overflow-y-auto mt-0 pr-2">
              <div className="space-y-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Multi-Parameter Overlay</CardTitle>
                    <p className="text-xs text-gray-500">Compare multiple parameters on synchronized timeline (like oscilloscope)</p>
                  </CardHeader>
                  <CardContent>
                    {/* Parameter toggles */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {PARAMETERS.map(param => (
                        <ParameterToggle
                          key={param.id}
                          param={param}
                          visible={visibleParams.includes(param.id)}
                          onToggle={toggleParam}
                        />
                      ))}
                    </div>
                    
                    {/* Combined chart */}
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="timeLabel" 
                            tick={{ fontSize: 10 }} 
                            tickLine={false}
                          />
                          <YAxis 
                            yAxisId="left"
                            tick={{ fontSize: 10 }} 
                            tickLine={false}
                            width={50}
                            label={{ value: 'Primary', angle: -90, position: 'insideLeft', fontSize: 10 }}
                          />
                          <YAxis 
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 10 }} 
                            tickLine={false}
                            width={50}
                            label={{ value: 'Secondary', angle: 90, position: 'insideRight', fontSize: 10 }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                          
                          {PARAMETERS.filter(p => visibleParams.includes(p.id)).map((param, idx) => (
                            <Line
                              key={param.id}
                              yAxisId={idx < 3 ? "left" : "right"}
                              type="monotone"
                              dataKey={param.id}
                              name={param.name}
                              stroke={param.color}
                              strokeWidth={2}
                              dot={false}
                              activeDot={{ r: 4 }}
                            />
                          ))}
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Individual stacked charts for detailed comparison */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Individual Parameter Trends</h4>
                  <div className="space-y-2">
                    {PARAMETERS.filter(p => visibleParams.includes(p.id)).map(param => (
                      <Card key={param.id} className="border-gray-200">
                        <CardContent className="p-2">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: param.color }} />
                            <span className="text-xs font-medium">{param.name}</span>
                            <span className="text-xs text-gray-400">({param.unit})</span>
                          </div>
                          <div className="h-20">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={chartData}>
                                <XAxis dataKey="timeLabel" hide />
                                <YAxis hide domain={['auto', 'auto']} />
                                <Line
                                  type="monotone"
                                  dataKey={param.id}
                                  stroke={param.color}
                                  strokeWidth={1.5}
                                  dot={false}
                                />
                                {cursorTime && (
                                  <ReferenceLine x={cursorTime} stroke="#6366f1" strokeDasharray="3 3" />
                                )}
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Duval Triangle Tab */}
            <TabsContent value="duval" className="flex-1 overflow-y-auto mt-0 pr-2">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Duval Triangle Visualization */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Triangle className="w-4 h-4" />
                      Duval Triangle - DGA Analysis
                    </CardTitle>
                    <p className="text-xs text-gray-500">Dissolved Gas Analysis for transformer oil</p>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <DuvalTriangle data={duvalData} />
                  </CardContent>
                </Card>
                
                {/* DGA Readings Table */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Historical DGA Readings</CardTitle>
                    <p className="text-xs text-gray-500">Gas concentrations over time</p>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-auto max-h-60">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="text-left p-2">Date</th>
                            <th className="text-right p-2">CH₄ %</th>
                            <th className="text-right p-2">C₂H₄ %</th>
                            <th className="text-right p-2">C₂H₂ %</th>
                            <th className="text-center p-2">Zone</th>
                          </tr>
                        </thead>
                        <tbody>
                          {duvalData.map((row, i) => {
                            const zone = DUVAL_ZONES.find(z => z.name === row.zone);
                            return (
                              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="p-2">{row.date}</td>
                                <td className="text-right p-2">{row.ch4}</td>
                                <td className="text-right p-2">{row.c2h4}</td>
                                <td className="text-right p-2">{row.c2h2}</td>
                                <td className="text-center p-2">
                                  <Badge 
                                    className="text-[10px]"
                                    style={{ 
                                      backgroundColor: `${zone?.color}20`,
                                      color: zone?.color,
                                      borderColor: zone?.color
                                    }}
                                  >
                                    {row.zone}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Zone Legend */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-600 mb-2">Fault Type Legend</p>
                      <div className="grid grid-cols-2 gap-2">
                        {DUVAL_ZONES.map(zone => (
                          <div key={zone.name} className="flex items-center gap-2 text-xs">
                            <div 
                              className="w-3 h-3 rounded" 
                              style={{ backgroundColor: zone.color }}
                            />
                            <span className="font-medium">{zone.name}:</span>
                            <span className="text-gray-500">{zone.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrendAnalysisModal;
