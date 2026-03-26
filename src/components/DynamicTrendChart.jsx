import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  LineChart,
  Table,
  BarChart3,
  Filter,
  Thermometer,
  Settings2
} from 'lucide-react';
import { 
  categorizeParameters, 
  sortConfigurationGroups,
  getParameterShortName,
  groupTestValuesWithConfig,
  isHiddenFromCharts,
  getCustomLabel
} from '../utils/parameterCategorization';

/**
 * DynamicTrendChart - Auto-generates trend charts and tables from test_values
 * 
 * Features:
 * - Automatically detects all parameters from test records
 * - Separates test conditions from actual measurements
 * - Groups parameters by configuration prefix (e.g., "HV-(LV+Gnd)")
 * - Allows user to select which parameters to trend
 * - Shows both chart and tabular views
 * - Works with any test type - no hardcoding needed
 * - Supports display_config from test template for custom grouping
 */
export const DynamicTrendChart = ({ testRecords, testName, displayConfig = null }) => {
  const [selectedParams, setSelectedParams] = useState([]);
  const [viewMode, setViewMode] = useState('chart'); // 'chart' or 'table'
  const [showParamSelector, setShowParamSelector] = useState(false);
  const [showTestConditions, setShowTestConditions] = useState(false);

  // Extract all unique parameter names from all test records
  const allParameters = useMemo(() => {
    const paramSet = new Set();
    testRecords.forEach(record => {
      if (record.test_values) {
        Object.keys(record.test_values).forEach(key => paramSet.add(key));
      }
    });
    return Array.from(paramSet).sort();
  }, [testRecords]);

  // Categorize parameters - use display_config if available, else auto-detect
  const categorizedParams = useMemo(() => {
    // If we have a display_config, use it for grouping
    if (displayConfig && Object.keys(displayConfig).length > 0) {
      const sampleValues = testRecords[0]?.test_values || {};
      const allValues = {};
      testRecords.forEach(record => {
        if (record.test_values) {
          Object.assign(allValues, record.test_values);
        }
      });
      return groupTestValuesWithConfig(allValues, displayConfig);
    }
    // Fall back to automatic categorization
    return categorizeParameters(allParameters);
  }, [allParameters, displayConfig, testRecords]);

  // Check if using new config-based grouping
  const usingDisplayConfig = displayConfig && Object.keys(displayConfig).length > 0;

  // Get sorted configuration group names
  const sortedConfigGroups = useMemo(() => {
    if (usingDisplayConfig) {
      // Use group order from display_config or object keys
      return categorizedParams.groupOrder || Object.keys(categorizedParams.configurationGroups);
    }
    return sortConfigurationGroups(Object.keys(categorizedParams.configurationGroups || {}));
  }, [categorizedParams, usingDisplayConfig]);

  // Group parameters by configuration prefix for display
  const groupedParameters = useMemo(() => {
    const groups = {};
    
    if (usingDisplayConfig) {
      // Use display_config-based grouping
      sortedConfigGroups.forEach(groupName => {
        const groupData = categorizedParams.configurationGroups[groupName];
        if (groupData && groupData.parameters) {
          groups[groupName] = Object.keys(groupData.parameters).map(fullName => ({
            full: fullName,
            short: getCustomLabel(getParameterShortName(fullName), displayConfig),
            color: groupData.color,
            chartType: groupData.chartType,
            showInChart: groupData.showInChart !== false
          }));
        }
      });
      
      // Add general readings if any
      if (categorizedParams.generalReadings && Object.keys(categorizedParams.generalReadings).length > 0) {
        groups['General Readings'] = Object.keys(categorizedParams.generalReadings).map(name => ({
          full: name,
          short: getCustomLabel(name, displayConfig),
          showInChart: !isHiddenFromCharts(name, displayConfig)
        }));
      }
    } else {
      // Use automatic categorization
      sortedConfigGroups.forEach(prefix => {
        const params = categorizedParams.configurationGroups?.[prefix];
        if (params && Array.isArray(params)) {
          groups[prefix] = params.map(fullName => ({
            full: fullName,
            short: getParameterShortName(fullName)
          }));
        }
      });
      
      // Add general readings if any
      if (categorizedParams.generalReadings?.length > 0) {
        groups['General Readings'] = categorizedParams.generalReadings.map(name => ({
          full: name,
          short: name
        }));
      }
    }
    
    return groups;
  }, [sortedConfigGroups, categorizedParams, usingDisplayConfig, displayConfig]);

  // Get all measurement parameters (for auto-selection)
  const allMeasurements = useMemo(() => {
    if (usingDisplayConfig) {
      const measurements = [];
      Object.values(categorizedParams.configurationGroups || {}).forEach(group => {
        if (group.parameters) {
          measurements.push(...Object.keys(group.parameters));
        }
      });
      if (categorizedParams.generalReadings) {
        measurements.push(...Object.keys(categorizedParams.generalReadings));
      }
      return measurements;
    }
    return categorizedParams.allMeasurements || [];
  }, [categorizedParams, usingDisplayConfig]);

  // Auto-select first few numeric parameters (excluding test conditions) if none selected
  useMemo(() => {
    if (selectedParams.length === 0 && allMeasurements.length > 0) {
      // Select up to 4 parameters that look like they contain numeric values
      // Skip parameters hidden from charts
      const numericParams = allMeasurements.filter(p => {
        // Skip if hidden from charts
        if (usingDisplayConfig && isHiddenFromCharts(p, displayConfig)) {
          return false;
        }
        const sample = testRecords.find(r => r.test_values?.[p]);
        if (sample) {
          const val = sample.test_values[p];
          // Check if value starts with a number
          return /^\d/.test(String(val).trim());
        }
        return false;
      }).slice(0, 4);
      
      if (numericParams.length > 0) {
        setSelectedParams(numericParams);
      }
    }
  }, [allMeasurements, testRecords, selectedParams.length, usingDisplayConfig, displayConfig]);

  // Prepare trend data for selected parameters
  const trendData = useMemo(() => {
    return testRecords
      .sort((a, b) => new Date(a.conducted_at || a.created_at) - new Date(b.conducted_at || b.created_at))
      .slice(-10) // Last 10 records
      .map(record => {
        const dataPoint = {
          date: new Date(record.conducted_at || record.created_at).toLocaleDateString(),
          fullDate: record.conducted_at || record.created_at,
          result: record.result,
          recordId: record.record_id,
        };
        
        selectedParams.forEach(param => {
          const rawValue = record.test_values?.[param] || '';
          // Extract numeric value (remove unit)
          const numMatch = String(rawValue).match(/^[\d.]+/);
          dataPoint[param] = numMatch ? parseFloat(numMatch[0]) : null;
          dataPoint[`${param}_raw`] = rawValue;
        });
        
        return dataPoint;
      });
  }, [testRecords, selectedParams]);

  // Calculate min/max for chart scaling
  const chartScale = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    
    trendData.forEach(point => {
      selectedParams.forEach(param => {
        const val = point[param];
        if (val !== null && !isNaN(val)) {
          min = Math.min(min, val);
          max = Math.max(max, val);
        }
      });
    });
    
    // Add 10% padding
    const padding = (max - min) * 0.1 || 10;
    return {
      min: Math.max(0, min - padding),
      max: max + padding
    };
  }, [trendData, selectedParams]);

  // Colors for different parameters
  const paramColors = [
    'rgb(59, 130, 246)',   // Blue
    'rgb(34, 197, 94)',    // Green
    'rgb(249, 115, 22)',   // Orange
    'rgb(168, 85, 247)',   // Purple
    'rgb(236, 72, 153)',   // Pink
    'rgb(20, 184, 166)',   // Teal
    'rgb(245, 158, 11)',   // Amber
    'rgb(239, 68, 68)',    // Red
  ];

  const toggleParam = (param) => {
    setSelectedParams(prev => 
      prev.includes(param) 
        ? prev.filter(p => p !== param)
        : [...prev, param]
    );
  };

  const selectAllInGroup = (groupParams) => {
    const fullNames = groupParams.map(p => p.full);
    const allSelected = fullNames.every(p => selectedParams.includes(p));
    
    if (allSelected) {
      setSelectedParams(prev => prev.filter(p => !fullNames.includes(p)));
    } else {
      setSelectedParams(prev => [...new Set([...prev, ...fullNames])]);
    }
  };

  // Show even with 1 record - users expect to see their data immediately
  if (testRecords.length < 1) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6 text-center text-muted-foreground">
          <LineChart className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No test records available for analysis</p>
        </CardContent>
      </Card>
    );
  }

  if (categorizedParams.allMeasurements.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6 text-center text-muted-foreground">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No parameter data available for trending</p>
          {categorizedParams.testConditions.length > 0 && (
            <p className="text-xs mt-1">({categorizedParams.testConditions.length} test conditions recorded)</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Dynamic Trend Analysis
            </CardTitle>
            <CardDescription>
              {testName} - Last {trendData.length} tests
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'chart' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-2"
                onClick={() => setViewMode('chart')}
              >
                <LineChart className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-2"
                onClick={() => setViewMode('table')}
              >
                <Table className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Parameter Selector Toggle */}
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setShowParamSelector(!showParamSelector)}
            >
              <Filter className="w-4 h-4 mr-1" />
              Parameters ({selectedParams.length})
              {showParamSelector ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Parameter Selector Panel */}
        {showParamSelector && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground">Select Parameters to Trend:</p>
              {categorizedParams.testConditions.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs px-2 text-muted-foreground"
                  onClick={() => setShowTestConditions(!showTestConditions)}
                >
                  <Thermometer className="w-3 h-3 mr-1" />
                  {showTestConditions ? 'Hide' : 'Show'} Test Conditions ({categorizedParams.testConditions.length})
                </Button>
              )}
            </div>
            
            {/* Test Conditions Section (collapsed by default) */}
            {showTestConditions && categorizedParams.testConditions.length > 0 && (
              <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <Thermometer className="w-3 h-3 text-amber-600" />
                  <span className="text-xs font-medium text-amber-700">Test Conditions</span>
                  <span className="text-xs text-amber-600">(Not included in trend charts)</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {categorizedParams.testConditions.map(name => (
                    <Badge key={name} variant="outline" className="text-xs bg-white border-amber-300 text-amber-700">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Measurement Parameters by Configuration Group */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {Object.entries(groupedParameters).map(([group, params]) => (
                <div key={group} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        group.toUpperCase().startsWith('HV') 
                          ? 'bg-red-50 border-red-300 text-red-700' 
                          : group.toUpperCase().startsWith('LV')
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-gray-50'
                      }`}
                    >
                      <Settings2 className="w-3 h-3 mr-1" />
                      {group}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 text-xs px-2"
                      onClick={() => selectAllInGroup(params)}
                    >
                      {params.every(p => selectedParams.includes(p.full)) ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-2">
                    {params.map(({ full, short }) => (
                      <label
                        key={full}
                        className="flex items-center gap-1.5 text-xs cursor-pointer hover:bg-background p-1 rounded"
                      >
                        <Checkbox
                          checked={selectedParams.includes(full)}
                          onCheckedChange={() => toggleParam(full)}
                          className="h-3 w-3"
                        />
                        <span className={selectedParams.includes(full) ? 'font-medium' : 'text-muted-foreground'}>
                          {short}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Parameters Legend */}
        {selectedParams.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedParams.map((param, idx) => (
              <Badge
                key={param}
                variant="secondary"
                className="text-xs cursor-pointer hover:opacity-90 transition-opacity border-2"
                style={{ 
                  backgroundColor: paramColors[idx % paramColors.length],
                  borderColor: paramColors[idx % paramColors.length],
                  color: '#ffffff'
                }}
                onClick={() => toggleParam(param)}
              >
                <span className="w-2 h-2 rounded-full mr-1.5 bg-white/30" />
                {getParameterShortName(param)}
                <span className="ml-1.5 opacity-70 hover:opacity-100">×</span>
              </Badge>
            ))}
          </div>
        )}

        {selectedParams.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Select parameters above to view trends</p>
          </div>
        ) : viewMode === 'chart' ? (
          /* Chart View */
          <div className="relative h-64 bg-background rounded-lg p-4 border">
            {/* Y-Axis Labels */}
            <div className="absolute left-0 top-4 bottom-8 flex flex-col justify-between text-[10px] text-muted-foreground w-14 pr-1 text-right">
              {[...Array(6)].map((_, i) => {
                const val = chartScale.max - (i * (chartScale.max - chartScale.min) / 5);
                return <span key={i}>{val.toFixed(0)}</span>;
              })}
            </div>
            
            {/* Chart Area */}
            <div className="absolute left-14 right-4 top-4 bottom-8">
              <svg className="w-full h-full" viewBox="0 0 1000 200" preserveAspectRatio="none">
                {/* Grid Lines */}
                {[...Array(6)].map((_, i) => (
                  <line key={i} x1="0" y1={i * 40} x2="1000" y2={i * 40} stroke="currentColor" strokeWidth="1" opacity="0.1" />
                ))}
                
                {/* Plot Lines for Each Parameter */}
                {selectedParams.map((param, paramIdx) => {
                  const color = paramColors[paramIdx % paramColors.length];
                  const points = trendData
                    .map((point, i) => {
                      if (point[param] === null) return null;
                      const x = trendData.length > 1 ? (i / (trendData.length - 1)) * 1000 : 500;
                      const y = 200 - ((point[param] - chartScale.min) / (chartScale.max - chartScale.min)) * 200;
                      return `${x},${Math.max(0, Math.min(200, y))}`;
                    })
                    .filter(p => p !== null);
                  
                  return (
                    <g key={param}>
                      {/* Line */}
                      <polyline
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        points={points.join(' ')}
                      />
                      {/* Data Points */}
                      {trendData.map((point, i) => {
                        if (point[param] === null) return null;
                        const x = trendData.length > 1 ? (i / (trendData.length - 1)) * 1000 : 500;
                        const y = 200 - ((point[param] - chartScale.min) / (chartScale.max - chartScale.min)) * 200;
                        return (
                          <circle
                            key={i}
                            cx={x}
                            cy={Math.max(0, Math.min(200, y))}
                            r="4"
                            fill={color}
                          >
                            <title>{`${param}: ${point[`${param}_raw`]}\n${point.date}`}</title>
                          </circle>
                        );
                      })}
                    </g>
                  );
                })}
              </svg>
            </div>
            
            {/* X-Axis Labels */}
            <div className="absolute left-14 right-4 bottom-0 flex justify-between text-[10px] text-muted-foreground">
              {trendData.map((point, i) => (
                <span key={i} className="text-center" style={{ width: `${100 / trendData.length}%` }}>
                  {point.date}
                </span>
              ))}
            </div>
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-semibold">Date</th>
                  <th className="text-left p-2 font-semibold">Result</th>
                  {selectedParams.map(param => (
                    <th key={param} className="text-left p-2 font-semibold">{param}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trendData.map((point, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="p-2">{point.date}</td>
                    <td className="p-2">
                      <Badge variant={point.result === 'Pass' ? 'default' : point.result === 'Fail' ? 'destructive' : 'secondary'} className="text-xs">
                        {point.result}
                      </Badge>
                    </td>
                    {selectedParams.map((param, pIdx) => (
                      <td key={param} className="p-2 font-mono">
                        <span style={{ color: paramColors[pIdx % paramColors.length] }}>
                          {point[`${param}_raw`] || '-'}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DynamicTrendChart;
