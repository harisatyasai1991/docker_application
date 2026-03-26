import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  Settings2,
  Eye,
  EyeOff,
  Palette,
  GripVertical,
  LineChart,
  BarChart3,
  Save
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import { Checkbox } from './ui/checkbox';

/**
 * DisplayConfigEditor - Visual editor for test template display configuration
 * 
 * Allows configuring:
 * - Parameter groups (with colors, patterns, chart types)
 * - Test conditions (environmental/contextual params)
 * - Hidden parameters (from charts or tables)
 * - Display order
 * - Custom labels
 */
export const DisplayConfigEditor = ({ 
  config = {}, 
  parameters = [], // List of parameter names from the template
  onChange,
  onSave 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState(() => ({
    parameter_groups: config.parameter_groups || [],
    test_conditions: config.test_conditions || [],
    hidden_from_charts: config.hidden_from_charts || [],
    hidden_from_table: config.hidden_from_table || [],
    chart_settings: config.chart_settings || {
      default_type: 'line',
      show_data_points: true,
      show_trend_arrows: true
    },
    display_order: config.display_order || [],
    custom_labels: config.custom_labels || {}
  }));

  // Update parent when local config changes
  const updateConfig = (newConfig) => {
    setLocalConfig(newConfig);
    if (onChange) {
      onChange(newConfig);
    }
  };

  // Add a new parameter group
  const addParameterGroup = () => {
    const newGroup = {
      name: `Group ${localConfig.parameter_groups.length + 1}`,
      color: '#3b82f6',
      patterns: [],
      parameters: [],
      chart_type: 'line',
      show_in_chart: true,
      show_in_table: true
    };
    updateConfig({
      ...localConfig,
      parameter_groups: [...localConfig.parameter_groups, newGroup]
    });
  };

  // Update a parameter group
  const updateGroup = (index, updates) => {
    const newGroups = [...localConfig.parameter_groups];
    newGroups[index] = { ...newGroups[index], ...updates };
    updateConfig({ ...localConfig, parameter_groups: newGroups });
  };

  // Remove a parameter group
  const removeGroup = (index) => {
    const newGroups = localConfig.parameter_groups.filter((_, i) => i !== index);
    updateConfig({ ...localConfig, parameter_groups: newGroups });
  };

  // Add parameter to a group
  const addParameterToGroup = (groupIndex, paramName) => {
    const newGroups = [...localConfig.parameter_groups];
    if (!newGroups[groupIndex].parameters.includes(paramName)) {
      newGroups[groupIndex].parameters = [...newGroups[groupIndex].parameters, paramName];
      updateConfig({ ...localConfig, parameter_groups: newGroups });
    }
  };

  // Remove parameter from a group
  const removeParameterFromGroup = (groupIndex, paramName) => {
    const newGroups = [...localConfig.parameter_groups];
    newGroups[groupIndex].parameters = newGroups[groupIndex].parameters.filter(p => p !== paramName);
    updateConfig({ ...localConfig, parameter_groups: newGroups });
  };

  // Add pattern to a group
  const addPatternToGroup = (groupIndex, pattern) => {
    if (!pattern.trim()) return;
    const newGroups = [...localConfig.parameter_groups];
    if (!newGroups[groupIndex].patterns.includes(pattern)) {
      newGroups[groupIndex].patterns = [...newGroups[groupIndex].patterns, pattern];
      updateConfig({ ...localConfig, parameter_groups: newGroups });
    }
  };

  // Remove pattern from a group
  const removePatternFromGroup = (groupIndex, pattern) => {
    const newGroups = [...localConfig.parameter_groups];
    newGroups[groupIndex].patterns = newGroups[groupIndex].patterns.filter(p => p !== pattern);
    updateConfig({ ...localConfig, parameter_groups: newGroups });
  };

  // Toggle test condition
  const toggleTestCondition = (paramName) => {
    const current = localConfig.test_conditions || [];
    const newConditions = current.includes(paramName)
      ? current.filter(p => p !== paramName)
      : [...current, paramName];
    updateConfig({ ...localConfig, test_conditions: newConditions });
  };

  // Toggle hidden from charts
  const toggleHiddenFromCharts = (paramName) => {
    const current = localConfig.hidden_from_charts || [];
    const newHidden = current.includes(paramName)
      ? current.filter(p => p !== paramName)
      : [...current, paramName];
    updateConfig({ ...localConfig, hidden_from_charts: newHidden });
  };

  // Get parameters not yet assigned to any group
  const unassignedParams = parameters.filter(p => {
    const isInGroup = localConfig.parameter_groups.some(g => g.parameters?.includes(p));
    return !isInGroup;
  });

  // Color presets
  const colorPresets = [
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Gray', value: '#6b7280' },
  ];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            <span>Display Configuration</span>
            {localConfig.parameter_groups.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {localConfig.parameter_groups.length} groups
              </Badge>
            )}
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <Card className="border-2 border-dashed border-blue-200 bg-blue-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-blue-600" />
              Test Records Display Configuration
            </CardTitle>
            <CardDescription className="text-xs">
              Configure how test records are displayed in charts and tables. 
              This configuration is exported/imported with the template.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Parameter Groups Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Parameter Groups</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={addParameterGroup}
                  className="h-7 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Group
                </Button>
              </div>

              {localConfig.parameter_groups.length === 0 ? (
                <p className="text-xs text-gray-500 italic">
                  No groups defined. Parameters will be auto-grouped by prefix patterns.
                </p>
              ) : (
                <div className="space-y-3">
                  {localConfig.parameter_groups.map((group, groupIndex) => (
                    <Card key={groupIndex} className="bg-white">
                      <CardContent className="p-3 space-y-3">
                        {/* Group header */}
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-gray-400" />
                          <Input
                            value={group.name}
                            onChange={(e) => updateGroup(groupIndex, { name: e.target.value })}
                            className="flex-1 h-8 text-sm font-medium"
                            placeholder="Group Name"
                          />
                          <input
                            type="color"
                            value={group.color || '#3b82f6'}
                            onChange={(e) => updateGroup(groupIndex, { color: e.target.value })}
                            className="w-8 h-8 rounded cursor-pointer border"
                            title="Group Color"
                          />
                          <Select 
                            value={group.chart_type || 'line'} 
                            onValueChange={(value) => updateGroup(groupIndex, { chart_type: value })}
                          >
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="line">
                                <span className="flex items-center gap-1">
                                  <LineChart className="w-3 h-3" /> Line
                                </span>
                              </SelectItem>
                              <SelectItem value="bar">
                                <span className="flex items-center gap-1">
                                  <BarChart3 className="w-3 h-3" /> Bar
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeGroup(groupIndex)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Visibility toggles */}
                        <div className="flex items-center gap-4 text-xs">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <Checkbox
                              checked={group.show_in_chart !== false}
                              onCheckedChange={(checked) => updateGroup(groupIndex, { show_in_chart: checked })}
                              className="h-3 w-3"
                            />
                            <Eye className="w-3 h-3" />
                            Show in Chart
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <Checkbox
                              checked={group.show_in_table !== false}
                              onCheckedChange={(checked) => updateGroup(groupIndex, { show_in_table: checked })}
                              className="h-3 w-3"
                            />
                            <Eye className="w-3 h-3" />
                            Show in Table
                          </label>
                        </div>

                        {/* Patterns */}
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">
                            Patterns (wildcards: * = any, ? = single char)
                          </Label>
                          <div className="flex flex-wrap gap-1">
                            {group.patterns?.map((pattern, pIndex) => (
                              <Badge 
                                key={pIndex} 
                                variant="outline" 
                                className="text-xs cursor-pointer hover:bg-red-50"
                                onClick={() => removePatternFromGroup(groupIndex, pattern)}
                              >
                                {pattern}
                                <Trash2 className="w-2 h-2 ml-1" />
                              </Badge>
                            ))}
                            <Input
                              placeholder="Add pattern..."
                              className="h-6 w-32 text-xs"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  addPatternToGroup(groupIndex, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                            />
                          </div>
                        </div>

                        {/* Explicit parameters */}
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">
                            Explicit Parameters
                          </Label>
                          <div className="flex flex-wrap gap-1">
                            {group.parameters?.map((param, pIndex) => (
                              <Badge 
                                key={pIndex} 
                                style={{ backgroundColor: group.color + '20', borderColor: group.color }}
                                className="text-xs cursor-pointer hover:bg-red-50"
                                onClick={() => removeParameterFromGroup(groupIndex, param)}
                              >
                                {param}
                                <Trash2 className="w-2 h-2 ml-1" />
                              </Badge>
                            ))}
                          </div>
                          {unassignedParams.length > 0 && (
                            <Select onValueChange={(value) => addParameterToGroup(groupIndex, value)}>
                              <SelectTrigger className="h-7 text-xs w-48">
                                <SelectValue placeholder="Add parameter..." />
                              </SelectTrigger>
                              <SelectContent>
                                {unassignedParams.map((param) => (
                                  <SelectItem key={param} value={param} className="text-xs">
                                    {param}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Test Conditions Section */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Test Conditions
                <span className="text-xs font-normal text-gray-500 ml-2">
                  (Environmental/contextual - excluded from trend analysis)
                </span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {parameters.map((param) => {
                  const isCondition = localConfig.test_conditions?.includes(param);
                  return (
                    <label
                      key={param}
                      className={`
                        flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer border
                        ${isCondition 
                          ? 'bg-amber-100 border-amber-300 text-amber-800' 
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}
                      `}
                    >
                      <Checkbox
                        checked={isCondition}
                        onCheckedChange={() => toggleTestCondition(param)}
                        className="h-3 w-3"
                      />
                      {param}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Hidden from Charts Section */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Hide from Charts
                <span className="text-xs font-normal text-gray-500 ml-2">
                  (Show only in tables)
                </span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {parameters.map((param) => {
                  const isHidden = localConfig.hidden_from_charts?.includes(param);
                  return (
                    <label
                      key={param}
                      className={`
                        flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer border
                        ${isHidden 
                          ? 'bg-gray-200 border-gray-400 text-gray-700' 
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}
                      `}
                    >
                      <Checkbox
                        checked={isHidden}
                        onCheckedChange={() => toggleHiddenFromCharts(param)}
                        className="h-3 w-3"
                      />
                      {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {param}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Chart Settings */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Chart Settings</Label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs">
                  <span>Default Chart Type:</span>
                  <Select 
                    value={localConfig.chart_settings?.default_type || 'line'} 
                    onValueChange={(value) => updateConfig({
                      ...localConfig,
                      chart_settings: { ...localConfig.chart_settings, default_type: value }
                    })}
                  >
                    <SelectTrigger className="w-24 h-7">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">Line</SelectItem>
                      <SelectItem value="bar">Bar</SelectItem>
                    </SelectContent>
                  </Select>
                </label>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <Checkbox
                    checked={localConfig.chart_settings?.show_data_points !== false}
                    onCheckedChange={(checked) => updateConfig({
                      ...localConfig,
                      chart_settings: { ...localConfig.chart_settings, show_data_points: checked }
                    })}
                    className="h-3 w-3"
                  />
                  Show Data Points
                </label>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <Checkbox
                    checked={localConfig.chart_settings?.show_trend_arrows !== false}
                    onCheckedChange={(checked) => updateConfig({
                      ...localConfig,
                      chart_settings: { ...localConfig.chart_settings, show_trend_arrows: checked }
                    })}
                    className="h-3 w-3"
                  />
                  Show Trend Arrows
                </label>
              </div>
            </div>

            {/* Save Button */}
            {onSave && (
              <div className="pt-2 border-t">
                <Button onClick={() => onSave(localConfig)} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Save Display Configuration
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default DisplayConfigEditor;
