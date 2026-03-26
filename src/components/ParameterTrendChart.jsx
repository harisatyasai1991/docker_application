import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Star,
  Activity,
  Info,
  ChevronDown,
  ChevronUp,
  Thermometer,
  Settings2
} from 'lucide-react';
import { 
  categorizeParameters, 
  sortConfigurationGroups,
  getParameterShortName,
  isTestCondition
} from '../utils/parameterCategorization';

// Color palette for chart lines
const CHART_COLORS = [
  { line: 'rgb(59, 130, 246)', fill: 'rgba(59, 130, 246, 0.1)', name: 'Blue' },     // Latest
  { line: 'rgb(34, 197, 94)', fill: 'rgba(34, 197, 94, 0.1)', name: 'Green' },
  { line: 'rgb(249, 115, 22)', fill: 'rgba(249, 115, 22, 0.1)', name: 'Orange' },
  { line: 'rgb(168, 85, 247)', fill: 'rgba(168, 85, 247, 0.1)', name: 'Purple' },
  { line: 'rgb(236, 72, 153)', fill: 'rgba(236, 72, 153, 0.1)', name: 'Pink' },     // Oldest
];

const SIGNATURE_COLOR = { line: 'rgb(234, 179, 8)', fill: 'rgba(234, 179, 8, 0.2)', name: 'Gold' };

// Helper to extract numeric value from string like "45.2 °C" or "88 Ω"
const extractNumericValue = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const match = value.match(/^[\d.]+/);
    return match ? parseFloat(match[0]) : null;
  }
  return null;
};

// Helper to extract unit from value
const extractUnit = (value) => {
  if (typeof value === 'string') {
    const match = value.match(/[^\d.\s]+.*$/);
    return match ? match[0].trim() : '';
  }
  return '';
};

// Calculate trend direction
const calculateTrend = (values) => {
  if (values.length < 2) return 'stable';
  const recent = values.slice(-3);
  const first = recent[0];
  const last = recent[recent.length - 1];
  const diff = last - first;
  const percentChange = Math.abs(diff / first) * 100;
  
  if (percentChange < 2) return 'stable';
  return diff > 0 ? 'up' : 'down';
};

// Check for anomaly (value deviates more than threshold from average)
const isAnomaly = (value, allValues, threshold = 0.25) => {
  if (allValues.length < 2) return false;
  const avg = allValues.reduce((a, b) => a + b, 0) / allValues.length;
  const deviation = Math.abs(value - avg) / avg;
  return deviation > threshold;
};

// Mini sparkline chart for a single parameter
const ParameterSparkline = ({ 
  paramName, 
  displayName,
  records, 
  signatureRecord,
  showSignature,
  isTestCondition,
  onHover 
}) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  
  // Use displayName if provided, otherwise use paramName
  const labelName = displayName || paramName;
  
  // Extract values for this parameter from all records
  const dataPoints = useMemo(() => {
    return records.map((record, idx) => {
      const rawValue = record.test_values?.[paramName];
      const numericValue = extractNumericValue(rawValue);
      const unit = extractUnit(rawValue);
      return {
        recordId: record.record_id || record.id,
        date: record.test_date || record.testDate,
        value: numericValue,
        rawValue: rawValue,
        unit: unit,
        result: record.result || record.final_result,
        conductor: record.conductor,
        index: idx,
        isSignature: false
      };
    }).filter(d => d.value !== null);
  }, [records, paramName]);

  // Get signature value if exists
  const signatureValue = useMemo(() => {
    if (!signatureRecord || !showSignature) return null;
    const rawValue = signatureRecord.test_values?.[paramName];
    const numericValue = extractNumericValue(rawValue);
    return numericValue;
  }, [signatureRecord, paramName, showSignature]);

  if (dataPoints.length === 0) return null;

  // Calculate chart dimensions
  const values = dataPoints.map(d => d.value);
  if (signatureValue !== null) values.push(signatureValue);
  
  const minVal = Math.min(...values) * 0.9;
  const maxVal = Math.max(...values) * 1.1;
  const range = maxVal - minVal || 1;
  
  // Calculate average for anomaly detection
  const avgValue = dataPoints.reduce((sum, d) => sum + d.value, 0) / dataPoints.length;
  
  // Trend calculation
  const trend = calculateTrend(dataPoints.map(d => d.value));
  const trendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-red-500' : trend === 'down' ? 'text-green-500' : 'text-gray-400';
  
  // SVG dimensions - responsive width
  const width = 260;
  const height = 70;
  const padding = { top: 8, right: 25, bottom: 18, left: 8 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Calculate point positions
  const points = dataPoints.map((d, i) => ({
    ...d,
    x: padding.left + (i / Math.max(dataPoints.length - 1, 1)) * chartWidth,
    y: padding.top + chartHeight - ((d.value - minVal) / range) * chartHeight,
    isAnomaly: isAnomaly(d.value, dataPoints.map(p => p.value))
  }));
  
  // Signature line Y position
  const signatureY = signatureValue !== null 
    ? padding.top + chartHeight - ((signatureValue - minVal) / range) * chartHeight
    : null;

  // Create path for line
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  
  // Create path for area fill
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;

  const latestValue = dataPoints[dataPoints.length - 1];
  const unit = latestValue?.unit || '';

  return (
    <div className={`bg-white rounded-lg border p-2 hover:shadow-md transition-shadow overflow-hidden ${
      isTestCondition ? 'border-amber-200' : ''
    }`}>
      {/* Parameter Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <span className="text-xs font-medium text-gray-700 truncate">{labelName.replace(/_/g, ' ')}</span>
          {unit && <span className="text-[10px] text-muted-foreground flex-shrink-0">({unit})</span>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {React.createElement(trendIcon, { className: `w-3 h-3 ${trendColor}` })}
          <span className="text-xs font-bold">{latestValue?.value?.toFixed(2)}</span>
        </div>
      </div>
      
      {/* SVG Chart */}
      <TooltipProvider>
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="overflow-hidden">
          {/* Grid lines */}
          <line 
            x1={padding.left} y1={padding.top} 
            x2={padding.left} y2={height - padding.bottom} 
            stroke="#e5e7eb" strokeWidth="1"
          />
          <line 
            x1={padding.left} y1={height - padding.bottom} 
            x2={width - padding.right} y2={height - padding.bottom} 
            stroke="#e5e7eb" strokeWidth="1"
          />
          
          {/* Average line (dotted) */}
          <line
            x1={padding.left}
            y1={padding.top + chartHeight - ((avgValue - minVal) / range) * chartHeight}
            x2={width - padding.right}
            y2={padding.top + chartHeight - ((avgValue - minVal) / range) * chartHeight}
            stroke="#9ca3af"
            strokeWidth="1"
            strokeDasharray="4,4"
            opacity="0.5"
          />
          
          {/* Signature/Benchmark line */}
          {signatureY !== null && (
            <g>
              <line
                x1={padding.left}
                y1={signatureY}
                x2={width - padding.right}
                y2={signatureY}
                stroke={SIGNATURE_COLOR.line}
                strokeWidth="2"
                strokeDasharray="6,3"
              />
              <text
                x={width - padding.right - 20}
                y={signatureY - 3}
                fill={SIGNATURE_COLOR.line}
                fontSize="9"
                fontWeight="bold"
              >
                FAT
              </text>
            </g>
          )}
          
          {/* Area fill */}
          <path d={areaPath} fill={CHART_COLORS[0].fill} />
          
          {/* Line */}
          <path d={linePath} fill="none" stroke={CHART_COLORS[0].line} strokeWidth="2" />
          
          {/* Data points */}
          {points.map((point, i) => (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <g>
                  {/* Anomaly highlight ring */}
                  {point.isAnomaly && (
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="10"
                      fill="none"
                      stroke="rgb(239, 68, 68)"
                      strokeWidth="2"
                      strokeDasharray="3,2"
                      opacity="0.6"
                    />
                  )}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="5"
                    fill={point.isAnomaly ? 'rgb(239, 68, 68)' : CHART_COLORS[0].line}
                    stroke="white"
                    strokeWidth="2"
                    className="cursor-pointer hover:r-6"
                    onMouseEnter={() => setHoveredPoint(point)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                </g>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-white border shadow-lg p-2">
                <div className="text-xs">
                  <div className="font-bold">{point.value?.toFixed(2)} {point.unit}</div>
                  <div className="text-muted-foreground">
                    {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  {point.isAnomaly && (
                    <div className="text-red-500 font-medium mt-1">⚠️ Deviation detected</div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
          
          {/* X-axis labels (first and last date) */}
          {points.length > 0 && (
            <>
              <text x={points[0].x} y={height - 5} fill="#6b7280" fontSize="9" textAnchor="start">
                {new Date(points[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </text>
              {points.length > 1 && (
                <text x={points[points.length - 1].x} y={height - 5} fill="#6b7280" fontSize="9" textAnchor="end">
                  {new Date(points[points.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </text>
              )}
            </>
          )}
        </svg>
      </TooltipProvider>
      
      {/* Anomaly indicator */}
      {points.some(p => p.isAnomaly) && (
        <div className="flex items-center gap-1 mt-1 text-[10px] text-red-500">
          <AlertTriangle className="w-2.5 h-2.5" />
          <span>Deviation detected</span>
        </div>
      )}
    </div>
  );
};

// Main Parameter Trend Chart Component
export const ParameterTrendChart = ({ testRecords, allTestRecords }) => {
  const [signatureRecordId, setSignatureRecordId] = useState(null);
  const [showSignature, setShowSignature] = useState(true);
  const [expanded, setExpanded] = useState(true);
  
  // Get last 5 records (or fewer if not available)
  const last5Records = useMemo(() => {
    if (!testRecords || testRecords.length === 0) return [];
    // Sort by date descending and take last 5
    const sorted = [...testRecords].sort((a, b) => {
      const dateA = new Date(a.test_date || a.testDate);
      const dateB = new Date(b.test_date || b.testDate);
      return dateA - dateB; // Oldest first for chart
    });
    return sorted.slice(-5);
  }, [testRecords]);

  // Get the signature/benchmark record
  const signatureRecord = useMemo(() => {
    if (!signatureRecordId) return null;
    // Look in all records (could be older than last 5)
    return allTestRecords?.find(r => (r.record_id || r.id) === signatureRecordId) || null;
  }, [signatureRecordId, allTestRecords]);

  // Extract all unique parameter names from the last 5 records
  const parameterNames = useMemo(() => {
    const names = new Set();
    last5Records.forEach(record => {
      if (record.test_values) {
        Object.keys(record.test_values).forEach(key => names.add(key));
      }
    });
    return Array.from(names);
  }, [last5Records]);

  // Categorize parameters using the utility
  const categorizedParams = useMemo(() => {
    return categorizeParameters(parameterNames);
  }, [parameterNames]);

  // Get sorted configuration group names
  const sortedConfigGroups = useMemo(() => {
    return sortConfigurationGroups(Object.keys(categorizedParams.configurationGroups));
  }, [categorizedParams.configurationGroups]);

  // State to show/hide test conditions
  const [showTestConditions, setShowTestConditions] = useState(false);

  // Show even with 1 record - users expect to see data immediately
  if (last5Records.length < 1) {
    return (
      <Card className="mb-6 border-blue-200 bg-gradient-to-br from-blue-50 to-transparent">
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-600" />
            Parameter Trend Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No test records available for trend analysis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-blue-200 bg-gradient-to-br from-blue-50 to-transparent overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm flex items-center">
              <Activity className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
              Parameter Trend Analysis - Last {last5Records.length} Tests
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              Compare parameter values across test records to identify deviations
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setExpanded(!expanded)}
            className="ml-2 flex-shrink-0"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="pt-2 overflow-hidden">
          {/* Controls Row */}
          <div className="flex flex-wrap items-center gap-2 mb-3 p-2 bg-white/50 rounded-lg border text-xs">
            {/* Signature/Benchmark Selector */}
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500" />
              <Label className="text-xs font-medium">Benchmark:</Label>
              <Select value={signatureRecordId || 'none'} onValueChange={(val) => setSignatureRecordId(val === 'none' ? null : val)}>
                <SelectTrigger className="w-[160px] h-7 text-xs">
                  <SelectValue placeholder="Select baseline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {(allTestRecords || testRecords)?.map(record => (
                    <SelectItem key={record.record_id || record.id} value={record.record_id || record.id}>
                      {new Date(record.test_date || record.testDate).toLocaleDateString('en-US', { 
                        month: 'short', day: 'numeric', year: 'numeric' 
                      })} - {record.conductor || 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Show Signature Toggle */}
            {signatureRecordId && (
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="showSignature" 
                  checked={showSignature} 
                  onCheckedChange={setShowSignature}
                />
                <Label htmlFor="showSignature" className="text-xs cursor-pointer">
                  Show benchmark line
                </Label>
              </div>
            )}
            
            {/* Legend */}
            <div className="flex items-center gap-2 ml-auto flex-wrap">
              <div className="flex items-center gap-1 text-[10px]">
                <div className="w-3 h-0.5 bg-gray-400" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #9ca3af, #9ca3af 3px, transparent 3px, transparent 6px)' }} />
                <span className="text-muted-foreground">Avg</span>
              </div>
              {signatureRecordId && (
                <div className="flex items-center gap-1 text-[10px]">
                  <div className="w-3 h-0.5" style={{ backgroundColor: SIGNATURE_COLOR.line }} />
                  <span className="text-yellow-600">FAT</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-[10px]">
                <div className="w-2 h-2 rounded-full border border-red-500" />
                <span className="text-red-500">Anomaly</span>
              </div>
            </div>
          </div>

          {/* Parameter Charts Grid - Grouped by Configuration */}
          {categorizedParams.allMeasurements.length > 0 ? (
            <div className="space-y-4">
              {/* Test Conditions Toggle (if any) */}
              {categorizedParams.testConditions.length > 0 && (
                <div className="mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                    onClick={() => setShowTestConditions(!showTestConditions)}
                  >
                    <Thermometer className="w-3 h-3 mr-1" />
                    {showTestConditions ? 'Hide' : 'Show'} Test Conditions ({categorizedParams.testConditions.length})
                    {showTestConditions ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                  </Button>
                  
                  {showTestConditions && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {categorizedParams.testConditions.map(paramName => (
                          <ParameterSparkline
                            key={paramName}
                            paramName={paramName}
                            records={last5Records}
                            signatureRecord={signatureRecord}
                            showSignature={showSignature && signatureRecordId}
                            isTestCondition={true}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Configuration Groups */}
              {sortedConfigGroups.map(configPrefix => (
                <div key={configPrefix} className={`p-3 rounded-lg border ${
                  configPrefix.toUpperCase().startsWith('HV') 
                    ? 'bg-red-50/50 border-red-200' 
                    : configPrefix.toUpperCase().startsWith('LV')
                    ? 'bg-blue-50/50 border-blue-200'
                    : 'bg-gray-50/50 border-gray-200'
                }`}>
                  <h5 className={`text-xs font-semibold mb-2 flex items-center ${
                    configPrefix.toUpperCase().startsWith('HV') 
                      ? 'text-red-700' 
                      : configPrefix.toUpperCase().startsWith('LV')
                      ? 'text-blue-700'
                      : 'text-gray-700'
                  }`}>
                    <Settings2 className="w-3 h-3 mr-1" />
                    {configPrefix}
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {categorizedParams.configurationGroups[configPrefix].map(fullParamName => (
                      <ParameterSparkline
                        key={fullParamName}
                        paramName={fullParamName}
                        displayName={getParameterShortName(fullParamName)}
                        records={last5Records}
                        signatureRecord={signatureRecord}
                        showSignature={showSignature && signatureRecordId}
                      />
                    ))}
                  </div>
                </div>
              ))}
              
              {/* General Readings (no configuration prefix) */}
              {categorizedParams.generalReadings.length > 0 && (
                <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-200">
                  <h5 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                    <Activity className="w-3 h-3 mr-1" />
                    General Readings
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {categorizedParams.generalReadings.map(paramName => (
                      <ParameterSparkline
                        key={paramName}
                        paramName={paramName}
                        records={last5Records}
                        signatureRecord={signatureRecord}
                        showSignature={showSignature && signatureRecordId}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No parameter data available for chart display</p>
              {categorizedParams.testConditions.length > 0 && (
                <p className="text-xs mt-1">({categorizedParams.testConditions.length} test conditions recorded)</p>
              )}
            </div>
          )}

          {/* Parameter Values Data Table - Grouped by Configuration */}
          {categorizedParams.allMeasurements.length > 0 && (
            <div className="mt-4 pt-3 border-t">
              <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
                <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Parameter Values Comparison
              </h4>
              
              {/* Grouped Tables */}
              <div className="space-y-4">
                {/* Configuration Group Tables */}
                {sortedConfigGroups.map(configPrefix => (
                  <div key={configPrefix} className={`rounded-lg border overflow-hidden ${
                    configPrefix.toUpperCase().startsWith('HV') 
                      ? 'border-red-200' 
                      : configPrefix.toUpperCase().startsWith('LV')
                      ? 'border-blue-200'
                      : 'border-gray-200'
                  }`}>
                    <div className={`px-2 py-1.5 flex items-center gap-1 ${
                      configPrefix.toUpperCase().startsWith('HV') 
                        ? 'bg-red-50 text-red-700' 
                        : configPrefix.toUpperCase().startsWith('LV')
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-gray-50 text-gray-700'
                    }`}>
                      <Settings2 className="w-3 h-3" />
                      <span className="text-xs font-semibold">{configPrefix}</span>
                    </div>
                    <div className="overflow-x-auto bg-white">
                      <table className="w-full text-[10px]">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="text-left p-2 font-semibold text-gray-700 sticky left-0 bg-gray-50 min-w-[100px]">
                              Parameter
                            </th>
                            {last5Records.map((record, idx) => {
                              const isSignature = (record.record_id || record.id) === signatureRecordId;
                              const isLatest = idx === last5Records.length - 1;
                              return (
                                <th 
                                  key={record.record_id || record.id} 
                                  className={`text-center p-2 font-semibold min-w-[70px] ${
                                    isSignature ? 'bg-yellow-50 text-yellow-700' : 
                                    isLatest ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                  }`}
                                >
                                  <div>{new Date(record.test_date || record.testDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                </th>
                              );
                            })}
                            <th className="text-center p-2 font-semibold text-gray-700 bg-gray-100 min-w-[50px]">Avg</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categorizedParams.configurationGroups[configPrefix].map((fullParamName, paramIdx) => {
                            const shortName = getParameterShortName(fullParamName);
                            const values = last5Records.map(record => {
                              const rawValue = record.test_values?.[fullParamName];
                              if (typeof rawValue === 'number') return rawValue;
                              if (typeof rawValue === 'string') {
                                const match = rawValue.match(/^[\d.]+/);
                                return match ? parseFloat(match[0]) : null;
                              }
                              return null;
                            }).filter(v => v !== null);
                            
                            const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
                            
                            return (
                              <tr key={fullParamName} className={paramIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                <td className="p-2 font-medium text-gray-700 sticky left-0 bg-inherit border-r">
                                  <div className="truncate max-w-[100px]" title={shortName}>{shortName}</div>
                                </td>
                                {last5Records.map((record, idx) => {
                                  const rawValue = record.test_values?.[fullParamName];
                                  let numValue = null;
                                  if (typeof rawValue === 'number') numValue = rawValue;
                                  else if (typeof rawValue === 'string') {
                                    const match = rawValue.match(/^[\d.]+/);
                                    numValue = match ? parseFloat(match[0]) : null;
                                  }
                                  const isAnomaly = numValue !== null && avg !== null && Math.abs(numValue - avg) / avg > 0.25;
                                  const isSignature = (record.record_id || record.id) === signatureRecordId;
                                  const isLatest = idx === last5Records.length - 1;
                                  
                                  return (
                                    <td 
                                      key={record.record_id || record.id}
                                      className={`p-2 text-center ${isSignature ? 'bg-yellow-50' : isLatest ? 'bg-blue-50' : ''} ${isAnomaly ? 'text-red-600 font-bold' : ''}`}
                                    >
                                      {numValue !== null ? (
                                        <span>{numValue.toFixed(2)}{isAnomaly && <span className="ml-0.5 text-red-500">⚠</span>}</span>
                                      ) : <span className="text-gray-300">-</span>}
                                    </td>
                                  );
                                })}
                                <td className="p-2 text-center bg-gray-100 font-medium">{avg !== null ? avg.toFixed(2) : '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
                
                {/* General Readings Table */}
                {categorizedParams.generalReadings.length > 0 && (
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-2 py-1.5 bg-gray-50 flex items-center gap-1">
                      <Activity className="w-3 h-3 text-gray-600" />
                      <span className="text-xs font-semibold text-gray-700">General Readings</span>
                    </div>
                    <div className="overflow-x-auto bg-white">
                      <table className="w-full text-[10px]">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="text-left p-2 font-semibold text-gray-700 sticky left-0 bg-gray-50 min-w-[100px]">Parameter</th>
                            {last5Records.map((record, idx) => {
                              const isLatest = idx === last5Records.length - 1;
                              return (
                                <th key={record.record_id || record.id} className={`text-center p-2 font-semibold min-w-[70px] ${isLatest ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
                                  <div>{new Date(record.test_date || record.testDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                </th>
                              );
                            })}
                            <th className="text-center p-2 font-semibold text-gray-700 bg-gray-100 min-w-[50px]">Avg</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categorizedParams.generalReadings.map((paramName, paramIdx) => {
                            const values = last5Records.map(record => {
                              const rawValue = record.test_values?.[paramName];
                              if (typeof rawValue === 'number') return rawValue;
                              if (typeof rawValue === 'string') {
                                const match = rawValue.match(/^[\d.]+/);
                                return match ? parseFloat(match[0]) : null;
                              }
                              return null;
                            }).filter(v => v !== null);
                            
                            const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
                            
                            return (
                              <tr key={paramName} className={paramIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                <td className="p-2 font-medium text-gray-700 sticky left-0 bg-inherit border-r">
                                  <div className="truncate max-w-[100px]" title={paramName}>{paramName.replace(/_/g, ' ')}</div>
                                </td>
                                {last5Records.map((record, idx) => {
                                  const rawValue = record.test_values?.[paramName];
                                  let numValue = null;
                                  if (typeof rawValue === 'number') numValue = rawValue;
                                  else if (typeof rawValue === 'string') {
                                    const match = rawValue.match(/^[\d.]+/);
                                    numValue = match ? parseFloat(match[0]) : null;
                                  }
                                  const isAnomaly = numValue !== null && avg !== null && Math.abs(numValue - avg) / avg > 0.25;
                                  const isLatest = idx === last5Records.length - 1;
                                  
                                  return (
                                    <td key={record.record_id || record.id} className={`p-2 text-center ${isLatest ? 'bg-blue-50' : ''} ${isAnomaly ? 'text-red-600 font-bold' : ''}`}>
                                      {numValue !== null ? (
                                        <span>{numValue.toFixed(2)}{isAnomaly && <span className="ml-0.5 text-red-500">⚠</span>}</span>
                                      ) : <span className="text-gray-300">-</span>}
                                    </td>
                                  );
                                })}
                                <td className="p-2 text-center bg-gray-100 font-medium">{avg !== null ? avg.toFixed(2) : '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3 mt-2 text-[9px] text-muted-foreground">
                <span><span className="text-red-500 font-bold">⚠</span> = Anomaly (&gt;25% deviation)</span>
              </div>
            </div>
          )}

          {/* Test Records Timeline */}
          <div className="mt-4 pt-3 border-t">
            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
              <Activity className="w-3 h-3 text-blue-600" />
              Test Timeline ({last5Records.length} records)
            </h4>
            <div className="flex items-stretch gap-1 overflow-x-auto pb-1">
              {last5Records.map((record, idx) => {
                const isSignature = (record.record_id || record.id) === signatureRecordId;
                return (
                  <div 
                    key={record.record_id || record.id}
                    className={`flex-1 min-w-[70px] max-w-[100px] p-1.5 rounded border text-center ${
                      isSignature 
                        ? 'bg-yellow-50 border-yellow-300' 
                        : idx === last5Records.length - 1 
                          ? 'bg-blue-50 border-blue-300' 
                          : 'bg-white'
                    }`}
                  >
                    {isSignature && (
                      <Badge variant="outline" className="mb-0.5 text-[9px] px-1 py-0 bg-yellow-100 text-yellow-700 border-yellow-300">
                        <Star className="w-2 h-2 mr-0.5" /> FAT
                      </Badge>
                    )}
                    {idx === last5Records.length - 1 && !isSignature && (
                      <Badge variant="outline" className="mb-0.5 text-[9px] px-1 py-0 bg-blue-100 text-blue-700 border-blue-300">
                        Latest
                      </Badge>
                    )}
                    <div className="text-[10px] font-medium">
                      {new Date(record.test_date || record.testDate).toLocaleDateString('en-US', { 
                        month: 'short', day: 'numeric' 
                      })}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-[9px] px-1 py-0 ${
                        record.result === 'Pass' || record.final_result === 'Pass'
                          ? 'bg-green-50 text-green-700 border-green-300'
                          : record.result === 'Fail' || record.final_result === 'Fail'
                            ? 'bg-red-50 text-red-700 border-red-300'
                            : 'bg-gray-50 text-gray-700 border-gray-300'
                      }`}
                    >
                      {record.result || record.final_result || 'Done'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ParameterTrendChart;
