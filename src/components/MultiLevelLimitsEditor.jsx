import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { AlertTriangle, CheckCircle, XCircle, Minus } from 'lucide-react';

/**
 * Multi-Level Parameter Limits Editor
 * Allows defining LOW/MEDIUM/HIGH thresholds for test parameters
 * Can be used for any parameter requiring multiple threshold levels
 */

const LEVEL_CONFIG = {
  low: {
    label: 'LOW',
    color: 'bg-green-100 text-green-700 border-green-300',
    bgColor: 'bg-green-50',
    icon: CheckCircle,
    description: 'Good / Acceptable'
  },
  medium: {
    label: 'MEDIUM',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    bgColor: 'bg-yellow-50',
    icon: AlertTriangle,
    description: 'Warning'
  },
  high: {
    label: 'HIGH',
    color: 'bg-red-100 text-red-700 border-red-300',
    bgColor: 'bg-red-50',
    icon: XCircle,
    description: 'Critical / Fail'
  }
};

const OPERATORS = [
  { value: '<=', label: '≤ (Less than or equal)' },
  { value: '>=', label: '≥ (Greater than or equal)' },
  { value: '<', label: '< (Less than)' },
  { value: '>', label: '> (Greater than)' },
  { value: 'range', label: 'Range (between)' },
  { value: 'na', label: 'N/A (Not Applicable)' },
];

// Single level limit editor
const LevelLimitEditor = ({ level, levelConfig, limit, onChange, unit }) => {
  const [operator, setOperator] = useState(limit?.operator || '<=');
  const [value, setValue] = useState(limit?.value || '');
  const [minValue, setMinValue] = useState(limit?.min_value || '');
  const [maxValue, setMaxValue] = useState(limit?.max_value || '');

  useEffect(() => {
    if (limit) {
      setOperator(limit.operator || '<=');
      setValue(limit.value || '');
      setMinValue(limit.min_value || '');
      setMaxValue(limit.max_value || '');
    }
  }, [limit]);

  const handleChange = (newOperator, newValue, newMin, newMax) => {
    const op = newOperator !== undefined ? newOperator : operator;
    const val = newValue !== undefined ? newValue : value;
    const min = newMin !== undefined ? newMin : minValue;
    const max = newMax !== undefined ? newMax : maxValue;

    let displayText = '';
    if (op === 'na') {
      displayText = 'N/A';
    } else if (op === 'range') {
      displayText = `${min}-${max}${unit}`;
    } else {
      displayText = `${op}${val}${unit}`;
    }

    onChange({
      level,
      operator: op,
      value: op !== 'range' && op !== 'na' ? parseFloat(val) || null : null,
      min_value: op === 'range' ? parseFloat(min) || null : null,
      max_value: op === 'range' ? parseFloat(max) || null : null,
      display_text: displayText
    });
  };

  const Icon = levelConfig.icon;

  return (
    <div className={`p-3 rounded-lg border ${levelConfig.bgColor}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${levelConfig.color.split(' ')[1]}`} />
        <Badge className={levelConfig.color}>{levelConfig.label}</Badge>
        <span className="text-xs text-muted-foreground">{levelConfig.description}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Select 
          value={operator} 
          onValueChange={(val) => {
            setOperator(val);
            handleChange(val, value, minValue, maxValue);
          }}
        >
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPERATORS.map(op => (
              <SelectItem key={op.value} value={op.value}>
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {operator === 'range' ? (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              placeholder="Min"
              value={minValue}
              onChange={(e) => {
                setMinValue(e.target.value);
                handleChange(operator, value, e.target.value, maxValue);
              }}
              className="w-20 bg-white"
            />
            <Minus className="w-4 h-4 text-muted-foreground" />
            <Input
              type="number"
              placeholder="Max"
              value={maxValue}
              onChange={(e) => {
                setMaxValue(e.target.value);
                handleChange(operator, value, minValue, e.target.value);
              }}
              className="w-20 bg-white"
            />
            <span className="text-sm text-muted-foreground">{unit}</span>
          </div>
        ) : operator === 'na' ? (
          <span className="text-sm text-muted-foreground italic">Not Applicable</span>
        ) : (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              placeholder="Value"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                handleChange(operator, e.target.value, minValue, maxValue);
              }}
              className="w-24 bg-white"
            />
            <span className="text-sm text-muted-foreground">{unit}</span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Main Multi-Level Limits Editor Component
 */
export const MultiLevelLimitsEditor = ({ 
  parameter,
  onUpdate,
  unit = ''
}) => {
  const [useMultiLevel, setUseMultiLevel] = useState(parameter?.use_multi_level || false);
  const [limits, setLimits] = useState(parameter?.multi_level_limits || [
    { level: 'low', operator: '<=', value: null, min_value: null, max_value: null, display_text: '' },
    { level: 'medium', operator: 'range', value: null, min_value: null, max_value: null, display_text: '' },
    { level: 'high', operator: '>=', value: null, min_value: null, max_value: null, display_text: '' },
  ]);

  const handleToggleMultiLevel = (enabled) => {
    setUseMultiLevel(enabled);
    onUpdate({
      ...parameter,
      use_multi_level: enabled,
      multi_level_limits: enabled ? limits : null
    });
  };

  const handleLimitChange = (updatedLimit) => {
    const newLimits = limits.map(l => 
      l.level === updatedLimit.level ? updatedLimit : l
    );
    setLimits(newLimits);
    onUpdate({
      ...parameter,
      use_multi_level: useMultiLevel,
      multi_level_limits: newLimits
    });
  };

  const getLimitForLevel = (level) => {
    return limits.find(l => l.level === level) || { level, operator: '<=', value: null };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            checked={useMultiLevel}
            onCheckedChange={handleToggleMultiLevel}
            id="multi-level-toggle"
          />
          <Label htmlFor="multi-level-toggle" className="text-sm font-medium cursor-pointer">
            Use Multi-Level Limits (LOW/MEDIUM/HIGH)
          </Label>
        </div>
      </div>

      {useMultiLevel && (
        <div className="space-y-2 mt-3">
          {['low', 'medium', 'high'].map(level => (
            <LevelLimitEditor
              key={level}
              level={level}
              levelConfig={LEVEL_CONFIG[level]}
              limit={getLimitForLevel(level)}
              onChange={handleLimitChange}
              unit={unit}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Display component for showing multi-level limits in read-only mode
 */
export const MultiLevelLimitsDisplay = ({ limits, unit }) => {
  if (!limits || limits.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {limits.map((limit, index) => {
        const config = LEVEL_CONFIG[limit.level];
        if (!config) return null;
        
        return (
          <Badge key={index} variant="outline" className={`${config.color} text-xs`}>
            {config.label}: {limit.display_text || 'N/A'}
          </Badge>
        );
      })}
    </div>
  );
};

export default MultiLevelLimitsEditor;
