/**
 * Test Records Tab Content for Asset Detail Page
 * Shows historical test data with charts for analysis
 * Features:
 * - Test record selection
 * - Combined parameter trend charts showing degradation path
 * - Full Analysis modal with combined charts
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  ClipboardCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  User,
  FileText,
  AlertTriangle,
  CheckCircle,
  X,
  ChevronRight,
  BarChart3,
  Clock,
  Thermometer,
  Zap,
  Activity,
  RefreshCw,
  Eye,
  Maximize2,
  Layers,
  Download,
} from 'lucide-react';
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
import { testRecordsAPI, testsAPI } from '../services/api';

// Chart colors for different parameters
const PARAM_COLORS = {
  'HV-LV (MΩ)': '#3b82f6',
  'HV-Ground (MΩ)': '#10b981',
  'LV-Ground (MΩ)': '#8b5cf6',
  'Temperature (°C)': '#ef4444',
  'Humidity (%)': '#06b6d4',
  'PI Ratio': '#f59e0b',
  'R1 (1 min)': '#ec4899',
  'R10 (10 min)': '#14b8a6',
  'Test Voltage (V)': '#6366f1',
  'H2 (ppm)': '#3b82f6',
  'CH4 (ppm)': '#10b981',
  'C2H6 (ppm)': '#f59e0b',
  'C2H4 (ppm)': '#ef4444',
  'C2H2 (ppm)': '#dc2626',
  'CO (ppm)': '#8b5cf6',
  'CO2 (ppm)': '#06b6d4',
  'PD Level (pC)': '#3b82f6',
  'PDIV (kV)': '#10b981',
  'PDEV (kV)': '#f59e0b',
  'Max PD (pC)': '#ef4444',
  'Noise Level (pC)': '#6b7280',
};

// Default color for unknown parameters
const getParamColor = (param, index = 0) => {
  const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
  return PARAM_COLORS[param] || defaultColors[index % defaultColors.length];
};

// Test type icons and colors
const TEST_CONFIG = {
  'IR': { icon: Zap, color: '#3b82f6', name: 'Insulation Resistance', bgColor: 'bg-blue-50' },
  'PI': { icon: Activity, color: '#10b981', name: 'Polarization Index', bgColor: 'bg-emerald-50' },
  'DGA': { icon: Thermometer, color: '#f59e0b', name: 'Dissolved Gas Analysis', bgColor: 'bg-amber-50' },
  'PD': { icon: Activity, color: '#8b5cf6', name: 'Partial Discharge', bgColor: 'bg-purple-50' },
  'default': { icon: ClipboardCheck, color: '#6b7280', name: 'Test', bgColor: 'bg-gray-50' },
};

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatShortDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
};

// Extract numeric value from string like "45.2 °C" or "2450"
const extractNumericValue = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const match = value.match(/^[\d.]+/);
    return match ? parseFloat(match[0]) : null;
  }
  return null;
};

// Sort records chronologically by test_date (oldest first)
const sortRecordsChronologically = (records) => {
  return [...records].sort((a, b) => {
    const dateA = new Date(a.test_date || 0);
    const dateB = new Date(b.test_date || 0);
    return dateA - dateB; // Oldest first
  });
};

// Status badge component
const StatusBadge = ({ status }) => {
  const styles = {
    passed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    failed: 'bg-red-100 text-red-700 border-red-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    pending: 'bg-gray-100 text-gray-700 border-gray-200',
    'in-progress': 'bg-blue-100 text-blue-700 border-blue-200',
  };
  const icons = {
    passed: <CheckCircle className="w-3 h-3" />,
    failed: <X className="w-3 h-3" />,
    warning: <AlertTriangle className="w-3 h-3" />,
    pending: <Clock className="w-3 h-3" />,
    'in-progress': <Activity className="w-3 h-3" />,
  };
  
  const normalizedStatus = status?.toLowerCase() || 'pending';
  
  return (
    <Badge className={`${styles[normalizedStatus] || styles.pending} border text-xs px-2 py-0.5 flex items-center gap-1`}>
      {icons[normalizedStatus] || icons.pending}
      {status || 'Pending'}
    </Badge>
  );
};

// Combined Parameter Trend Chart - Shows degradation path from all test records
const ParameterTrendChart = ({ records, paramKey, color, height = 140, onOpenAnalysis }) => {
  // Helper to get parameter value from either 'parameters' or 'test_values'
  const getParamValue = (record, key) => {
    return record.parameters?.[key] ?? record.test_values?.[key];
  };

  // Sort records chronologically and build chart data
  const chartData = useMemo(() => {
    const sorted = sortRecordsChronologically(records);
    return sorted
      .filter(r => getParamValue(r, paramKey) !== undefined)
      .map(r => ({
        date: formatShortDate(r.test_date),
        fullDate: formatDate(r.test_date),
        value: extractNumericValue(getParamValue(r, paramKey)),
        testCode: r.test_code,
        status: r.status,
        testedBy: r.tested_by,
      }));
  }, [records, paramKey]);

  // Calculate trend direction
  const trendInfo = useMemo(() => {
    if (chartData.length < 2) return null;
    const first = chartData[0]?.value;
    const last = chartData[chartData.length - 1]?.value;
    if (first === null || last === null) return null;
    const change = last - first;
    const percentChange = Math.abs(change / first) * 100;
    return { change, percentChange, direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable' };
  }, [chartData]);

  if (chartData.length === 0) return null;

  // Get latest value for display
  const latestValue = chartData[chartData.length - 1]?.value;
  const latestRecord = records.find(r => getParamValue(r, paramKey));
  const displayValue = getParamValue(latestRecord, paramKey) || latestValue;

  return (
    <Card 
      className="border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
      onClick={() => onOpenAnalysis && onOpenAnalysis(paramKey)}
    >
      <CardContent className="p-3">
        {/* Header with parameter name and latest value */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 truncate">{paramKey}</p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold" style={{ color }}>{displayValue}</p>
              {trendInfo && (
                <div className="flex items-center gap-1">
                  {trendInfo.direction === 'up' && <TrendingUp className="w-4 h-4 text-amber-500" />}
                  {trendInfo.direction === 'down' && <TrendingDown className="w-4 h-4 text-blue-500" />}
                  {trendInfo.direction === 'stable' && <Minus className="w-4 h-4 text-gray-400" />}
                  <span className="text-[10px] text-gray-500">
                    {trendInfo.percentChange.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] h-4 px-1.5">
            {chartData.length} readings
          </Badge>
        </div>

        {/* Combined Trend Chart */}
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id={`gradient-${paramKey.replace(/[^a-zA-Z]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 9 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fontSize: 9 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                width={45}
                domain={['auto', 'auto']}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-2 border border-gray-200 rounded shadow-lg text-xs">
                      <p className="font-medium">{data.fullDate}</p>
                      <p style={{ color }}>{paramKey}: {data.value}</p>
                      <p className="text-gray-500">Test: {data.testCode}</p>
                      <p className="text-gray-500">By: {data.testedBy}</p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                fill={`url(#gradient-${paramKey.replace(/[^a-zA-Z]/g, '')})`}
                stroke="none"
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={{ r: 4, fill: color, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: color, strokeWidth: 2, stroke: '#fff' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Test record selector card
const TestRecordSelector = ({ record, isSelected, onSelect }) => {
  const config = TEST_CONFIG[record.test_type] || TEST_CONFIG.default;
  const TestIcon = config.icon;
  
  return (
    <div 
      className={`p-3 rounded-lg border cursor-pointer transition-all ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-sm' 
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
      onClick={() => onSelect(record)}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${config.bgColor}`}>
          <TestIcon className="w-4 h-4" style={{ color: config.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{record.test_name || config.name}</p>
            <StatusBadge status={record.status} />
          </div>
          <p className="text-xs text-gray-500">{formatShortDate(record.test_date)} • {record.tested_by}</p>
        </div>
      </div>
    </div>
  );
};

// Full Analysis Modal Component
const FullAnalysisModal = ({ isOpen, onClose, records, testType }) => {
  const [activeTab, setActiveTab] = useState('trends');
  const [selectedParams, setSelectedParams] = useState({});
  
  // Sort records chronologically
  const sortedRecords = useMemo(() => {
    return sortRecordsChronologically(
      records.filter(r => !testType || r.test_type === testType)
    );
  }, [records, testType]);

  // Get all unique parameters across records of same test type
  // Check both 'parameters' and 'test_values' for compatibility
  const allParams = useMemo(() => {
    const params = new Set();
    sortedRecords.forEach(r => {
      if (r.parameters) {
        Object.keys(r.parameters).forEach(k => params.add(k));
      }
      if (r.test_values) {
        Object.keys(r.test_values).forEach(k => params.add(k));
      }
    });
    return Array.from(params);
  }, [sortedRecords]);

  // Initialize selected params
  useEffect(() => {
    const initial = {};
    allParams.forEach(p => initial[p] = true);
    setSelectedParams(initial);
  }, [allParams]);

  // Build chart data for all records (chronologically sorted)
  const chartData = useMemo(() => {
    return sortedRecords.map((record) => {
      const point = {
        date: formatShortDate(record.test_date),
        fullDate: formatDate(record.test_date),
        testCode: record.test_code,
        status: record.status,
        testedBy: record.tested_by,
      };
      
      allParams.forEach(param => {
        // Check both parameters and test_values
        const value = record.parameters?.[param] ?? record.test_values?.[param];
        point[param] = extractNumericValue(value) || null;
      });
      
      return point;
    });
  }, [sortedRecords, allParams]);

  // Toggle parameter visibility
  const toggleParam = (param) => {
    setSelectedParams(prev => ({
      ...prev,
      [param]: !prev[param]
    }));
  };

  const config = TEST_CONFIG[testType] || TEST_CONFIG.default;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Full Analysis - {config.name} Tests
              <Badge variant="outline" className="text-xs ml-2">
                {sortedRecords.length} records
              </Badge>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full max-w-md grid-cols-2 flex-shrink-0">
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Time Trends
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Comparison
            </TabsTrigger>
          </TabsList>
          
          {/* Time Trends Tab */}
          <TabsContent value="trends" className="flex-1 overflow-y-auto mt-4">
            {/* Parameter toggles */}
            <div className="flex flex-wrap gap-2 mb-4">
              {allParams.map(param => (
                <Badge
                  key={param}
                  variant={selectedParams[param] ? 'default' : 'outline'}
                  className="cursor-pointer"
                  style={{ 
                    backgroundColor: selectedParams[param] ? getParamColor(param) : 'transparent',
                    borderColor: getParamColor(param),
                    color: selectedParams[param] ? 'white' : getParamColor(param),
                  }}
                  onClick={() => toggleParam(param)}
                >
                  {param}
                </Badge>
              ))}
            </div>
            
            {/* Individual charts for each parameter */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {allParams.filter(p => selectedParams[p]).map(param => (
                <Card key={param} className="border-gray-200">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: getParamColor(param) }}
                      />
                      {param}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 10 }}
                            tickLine={false}
                          />
                          <YAxis 
                            tick={{ fontSize: 10 }}
                            tickLine={false}
                            width={50}
                            domain={['auto', 'auto']}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.[0]) return null;
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-2 border border-gray-200 rounded shadow-lg text-xs">
                                  <p className="font-medium">{data.fullDate}</p>
                                  <p className="text-gray-600">{param}: {data[param]}</p>
                                  <p className="text-gray-500">Test: {data.testCode}</p>
                                  <p className="text-gray-500">By: {data.testedBy}</p>
                                </div>
                              );
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey={param}
                            fill={getParamColor(param)}
                            fillOpacity={0.1}
                            stroke="none"
                          />
                          <Line
                            type="monotone"
                            dataKey={param}
                            stroke={getParamColor(param)}
                            strokeWidth={2}
                            dot={{ r: 4, fill: getParamColor(param), strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6 }}
                            connectNulls
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Comparison Tab - All parameters overlaid */}
          <TabsContent value="comparison" className="flex-1 overflow-y-auto mt-4">
            <Card className="border-gray-200">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium">Multi-Parameter Comparison (Degradation Path)</CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                  All parameters overlaid chronologically - oldest to newest readings
                </p>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {/* Parameter toggles */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {allParams.map(param => (
                    <Badge
                      key={param}
                      variant={selectedParams[param] ? 'default' : 'outline'}
                      className="cursor-pointer text-xs"
                      style={{ 
                        backgroundColor: selectedParams[param] ? getParamColor(param) : 'transparent',
                        borderColor: getParamColor(param),
                        color: selectedParams[param] ? 'white' : getParamColor(param),
                      }}
                      onClick={() => toggleParam(param)}
                    >
                      {param}
                    </Badge>
                  ))}
                </div>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        width={60}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div className="bg-white p-3 border border-gray-200 rounded shadow-lg text-xs">
                              <p className="font-medium mb-2">{payload[0]?.payload?.fullDate}</p>
                              <p className="text-gray-500 mb-2">Test: {payload[0]?.payload?.testCode}</p>
                              {payload.map((entry, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <div 
                                    className="w-2 h-2 rounded-full" 
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span>{entry.name}: {entry.value}</span>
                                </div>
                              ))}
                            </div>
                          );
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '10px' }}
                        iconSize={8}
                      />
                      {allParams.filter(p => selectedParams[p]).map((param, i) => (
                        <Line
                          key={param}
                          type="monotone"
                          dataKey={param}
                          name={param}
                          stroke={getParamColor(param, i)}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Historical Readings Table */}
            <Card className="border-gray-200 mt-4">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium">Historical Readings (Chronological Order)</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 font-medium text-gray-500">Date</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-500">Test Code</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-500">Status</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-500">Tested By</th>
                        {allParams.slice(0, 4).map(param => (
                          <th key={param} className="text-right py-2 px-2 font-medium text-gray-500">
                            {param}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.map((row, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-2">{row.date}</td>
                          <td className="py-2 px-2 font-mono">{row.testCode}</td>
                          <td className="py-2 px-2">
                            <StatusBadge status={row.status} />
                          </td>
                          <td className="py-2 px-2">{row.testedBy}</td>
                          {allParams.slice(0, 4).map(param => (
                            <td key={param} className="text-right py-2 px-2 font-mono">
                              {row[param] ?? '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

// Main component
export const TestRecordsTab = ({ assetId, assetName }) => {
  const [testRecords, setTestRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTestType, setSelectedTestType] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDemoData, setIsDemoData] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  // Fetch test records for the asset
  useEffect(() => {
    const fetchTestRecords = async () => {
      if (!assetId) return;
      
      setLoading(true);
      setIsDemoData(false);
      try {
        const response = await testRecordsAPI.getAll({ asset_id: assetId });
        const records = response.records || response || [];
        const recordsArray = Array.isArray(records) ? records : [];
        
        // If no real records exist, use demo data for demonstration
        if (recordsArray.length === 0) {
          const demoRecords = generateDemoTestRecords();
          setTestRecords(demoRecords);
          setIsDemoData(true);
          // Select first record by default
          if (demoRecords.length > 0) {
            setSelectedRecord(demoRecords[0]);
          }
        } else {
          setTestRecords(recordsArray);
          setIsDemoData(false);
          if (recordsArray.length > 0) {
            // Sort and select most recent
            const sorted = sortRecordsChronologically(recordsArray);
            setSelectedRecord(sorted[sorted.length - 1]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch test records:', err);
        setError(err.message);
        // Set demo data for visualization on error
        const demoRecords = generateDemoTestRecords();
        setTestRecords(demoRecords);
        setIsDemoData(true);
        if (demoRecords.length > 0) {
          setSelectedRecord(demoRecords[0]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTestRecords();
  }, [assetId]);

  // Generate demo test records for visualization
  const generateDemoTestRecords = () => {
    const demoData = [
      // Insulation Resistance Tests - Multiple readings over time
      {
        record_id: 'REC-001',
        test_code: 'IR-2024-001',
        test_type: 'IR',
        test_name: 'Insulation Resistance Test',
        test_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Passed',
        tested_by: 'John Smith',
        parameters: {
          'HV-LV (MΩ)': '2450',
          'HV-Ground (MΩ)': '3200',
          'LV-Ground (MΩ)': '2890',
          'Temperature (°C)': '28.5',
          'Humidity (%)': '52'
        }
      },
      {
        record_id: 'REC-002',
        test_code: 'IR-2024-002',
        test_type: 'IR',
        test_name: 'Insulation Resistance Test',
        test_date: new Date(Date.now() - 67 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Passed',
        tested_by: 'Sarah Johnson',
        parameters: {
          'HV-LV (MΩ)': '2380',
          'HV-Ground (MΩ)': '3050',
          'LV-Ground (MΩ)': '2750',
          'Temperature (°C)': '31.2',
          'Humidity (%)': '48'
        }
      },
      {
        record_id: 'REC-009',
        test_code: 'IR-2023-003',
        test_type: 'IR',
        test_name: 'Insulation Resistance Test',
        test_date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Passed',
        tested_by: 'John Smith',
        parameters: {
          'HV-LV (MΩ)': '2520',
          'HV-Ground (MΩ)': '3180',
          'LV-Ground (MΩ)': '2920',
          'Temperature (°C)': '26.8',
          'Humidity (%)': '45'
        }
      },
      {
        record_id: 'REC-010',
        test_code: 'IR-2023-004',
        test_type: 'IR',
        test_name: 'Insulation Resistance Test',
        test_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Passed',
        tested_by: 'Mike Chen',
        parameters: {
          'HV-LV (MΩ)': '2680',
          'HV-Ground (MΩ)': '3350',
          'LV-Ground (MΩ)': '3100',
          'Temperature (°C)': '25.0',
          'Humidity (%)': '42'
        }
      },
      // Polarization Index Tests
      {
        record_id: 'REC-003',
        test_code: 'PI-2024-001',
        test_type: 'PI',
        test_name: 'Polarization Index Test',
        test_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Passed',
        tested_by: 'John Smith',
        parameters: {
          'PI Ratio': '2.8',
          'R1 (1 min)': '1850',
          'R10 (10 min)': '5180',
          'Temperature (°C)': '29.0',
          'Test Voltage (V)': '5000'
        }
      },
      {
        record_id: 'REC-004',
        test_code: 'PI-2024-002',
        test_type: 'PI',
        test_name: 'Polarization Index Test',
        test_date: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Passed',
        tested_by: 'Mike Chen',
        parameters: {
          'PI Ratio': '2.6',
          'R1 (1 min)': '1720',
          'R10 (10 min)': '4472',
          'Temperature (°C)': '27.5',
          'Test Voltage (V)': '5000'
        }
      },
      {
        record_id: 'REC-011',
        test_code: 'PI-2023-003',
        test_type: 'PI',
        test_name: 'Polarization Index Test',
        test_date: new Date(Date.now() - 280 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Passed',
        tested_by: 'Sarah Johnson',
        parameters: {
          'PI Ratio': '3.1',
          'R1 (1 min)': '1950',
          'R10 (10 min)': '6045',
          'Temperature (°C)': '24.5',
          'Test Voltage (V)': '5000'
        }
      },
      // Dissolved Gas Analysis Tests
      {
        record_id: 'REC-005',
        test_code: 'DGA-2024-001',
        test_type: 'DGA',
        test_name: 'Dissolved Gas Analysis',
        test_date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Passed',
        tested_by: 'Lab Technician',
        parameters: {
          'H2 (ppm)': '45',
          'CH4 (ppm)': '28',
          'C2H6 (ppm)': '12',
          'C2H4 (ppm)': '8',
          'C2H2 (ppm)': '0.5',
          'CO (ppm)': '320',
          'CO2 (ppm)': '2450'
        }
      },
      {
        record_id: 'REC-006',
        test_code: 'DGA-2024-002',
        test_type: 'DGA',
        test_name: 'Dissolved Gas Analysis',
        test_date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Warning',
        tested_by: 'Lab Technician',
        parameters: {
          'H2 (ppm)': '85',
          'CH4 (ppm)': '42',
          'C2H6 (ppm)': '18',
          'C2H4 (ppm)': '15',
          'C2H2 (ppm)': '1.2',
          'CO (ppm)': '480',
          'CO2 (ppm)': '2890'
        }
      },
      {
        record_id: 'REC-012',
        test_code: 'DGA-2023-003',
        test_type: 'DGA',
        test_name: 'Dissolved Gas Analysis',
        test_date: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Passed',
        tested_by: 'Lab Technician',
        parameters: {
          'H2 (ppm)': '32',
          'CH4 (ppm)': '22',
          'C2H6 (ppm)': '8',
          'C2H4 (ppm)': '5',
          'C2H2 (ppm)': '0.2',
          'CO (ppm)': '280',
          'CO2 (ppm)': '2100'
        }
      },
      // Partial Discharge Tests
      {
        record_id: 'REC-007',
        test_code: 'PD-2024-001',
        test_type: 'PD',
        test_name: 'Partial Discharge Test',
        test_date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Passed',
        tested_by: 'Mike Chen',
        parameters: {
          'PD Level (pC)': '125',
          'PDIV (kV)': '18.5',
          'PDEV (kV)': '15.2',
          'Max PD (pC)': '180',
          'Noise Level (pC)': '15'
        }
      },
      {
        record_id: 'REC-008',
        test_code: 'PD-2024-002',
        test_type: 'PD',
        test_name: 'Partial Discharge Test',
        test_date: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Failed',
        tested_by: 'Sarah Johnson',
        parameters: {
          'PD Level (pC)': '450',
          'PDIV (kV)': '12.8',
          'PDEV (kV)': '10.5',
          'Max PD (pC)': '680',
          'Noise Level (pC)': '18'
        }
      },
      {
        record_id: 'REC-013',
        test_code: 'PD-2023-003',
        test_type: 'PD',
        test_name: 'Partial Discharge Test',
        test_date: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Passed',
        tested_by: 'John Smith',
        parameters: {
          'PD Level (pC)': '95',
          'PDIV (kV)': '19.2',
          'PDEV (kV)': '16.0',
          'Max PD (pC)': '140',
          'Noise Level (pC)': '12'
        }
      }
    ];
    
    return demoData;
  };

  // Get unique test types
  const testTypes = useMemo(() => {
    const types = new Set(testRecords.map(r => r.test_type).filter(Boolean));
    return ['all', ...Array.from(types)];
  }, [testRecords]);

  // Filter records by test type and sort chronologically
  const filteredRecords = useMemo(() => {
    const filtered = selectedTestType === 'all' 
      ? testRecords 
      : testRecords.filter(r => r.test_type === selectedTestType);
    
    // Sort by date descending for display (newest first in list)
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.test_date || 0);
      const dateB = new Date(b.test_date || 0);
      return dateB - dateA; // Newest first for selector
    });
  }, [testRecords, selectedTestType]);

  // Get records of same type for charts (sorted chronologically - oldest first)
  const sameTypeRecords = useMemo(() => {
    if (!selectedRecord) return [];
    return sortRecordsChronologically(
      testRecords.filter(r => r.test_type === selectedRecord.test_type)
    );
  }, [testRecords, selectedRecord]);

  // Get all unique parameters for the selected test type
  // Check both 'parameters' and 'test_values' fields for compatibility
  const allParams = useMemo(() => {
    const params = new Set();
    sameTypeRecords.forEach(r => {
      // Check 'parameters' field (legacy/demo data)
      if (r.parameters) {
        Object.keys(r.parameters).forEach(k => params.add(k));
      }
      // Check 'test_values' field (actual test records)
      if (r.test_values) {
        Object.keys(r.test_values).forEach(k => params.add(k));
      }
    });
    return Array.from(params);
  }, [sameTypeRecords]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await testRecordsAPI.getAll({ asset_id: assetId });
      const records = response.records || response || [];
      setTestRecords(Array.isArray(records) ? records : []);
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle opening analysis modal
  const handleOpenAnalysis = () => {
    setShowAnalysisModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
          <p className="text-sm text-gray-500">Loading test records...</p>
        </div>
      </div>
    );
  }

  const currentTestConfig = TEST_CONFIG[selectedRecord?.test_type] || TEST_CONFIG.default;

  return (
    <div className="space-y-4">
      {/* Demo Data Indicator */}
      {isDemoData && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            Showing sample test records for demonstration. Conduct tests to see actual data.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <FileText className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-800">Test Records</h3>
              {isDemoData && (
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-amber-50 text-amber-700 border-amber-300">
                  Demo
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500">{testRecords.length} records found</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTestType} onValueChange={(value) => {
            setSelectedTestType(value);
            // Auto-select first record of new type
            if (value !== 'all') {
              const firstOfType = testRecords.find(r => r.test_type === value);
              if (firstOfType) setSelectedRecord(firstOfType);
            }
          }}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              {testTypes.map(type => (
                <SelectItem key={type} value={type} className="text-xs">
                  {type === 'all' ? 'All Types' : type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

      {filteredRecords.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Test Records List */}
          <div className="lg:col-span-1 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-600">Test Records</p>
              <Badge variant="outline" className="text-xs">
                {filteredRecords.length} tests
              </Badge>
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {filteredRecords.map((record) => (
                <TestRecordSelector
                  key={record.record_id}
                  record={record}
                  isSelected={selectedRecord?.record_id === record.record_id}
                  onSelect={setSelectedRecord}
                />
              ))}
            </div>
          </div>

          {/* Right Column - Combined Parameter Trend Charts */}
          <div className="lg:col-span-2">
            {selectedRecord && sameTypeRecords.length > 0 && (
              <>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${currentTestConfig.bgColor}`}>
                      <currentTestConfig.icon className="w-4 h-4" style={{ color: currentTestConfig.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {currentTestConfig.name} - Degradation Trends
                      </p>
                      <p className="text-xs text-gray-500">
                        Combined data from {sameTypeRecords.length} test records (chronological)
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenAnalysis}
                    className="h-8"
                  >
                    <Maximize2 className="w-4 h-4 mr-1" />
                    Full Analysis
                  </Button>
                </div>

                {/* Combined Parameter Trend Charts Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allParams.map((param, index) => (
                    <ParameterTrendChart
                      key={param}
                      records={sameTypeRecords}
                      paramKey={param}
                      color={getParamColor(param, index)}
                      height={120}
                      onOpenAnalysis={handleOpenAnalysis}
                    />
                  ))}
                </div>

                {/* Selected Test Info */}
                {selectedRecord && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs font-medium text-blue-800 mb-2">Selected Test Details</p>
                    <div className="flex flex-wrap gap-4 text-xs text-blue-700">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(selectedRecord.test_date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{selectedRecord.tested_by}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span className="font-mono">{selectedRecord.test_code}</span>
                      </div>
                      <StatusBadge status={selectedRecord.status} />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <ClipboardCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 text-sm">No test records found for this asset</p>
          <p className="text-gray-400 text-xs mt-1">Conduct a test to see records here</p>
        </div>
      )}

      {/* Full Analysis Modal */}
      <FullAnalysisModal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        records={testRecords}
        testType={selectedRecord?.test_type}
      />
    </div>
  );
};

export default TestRecordsTab;
