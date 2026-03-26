/**
 * Parameter Categorization Utility
 * 
 * Automatically categorizes test parameters into logical groups:
 * 1. Test Conditions - Equipment info, environmental conditions (excluded from trend charts)
 * 2. Configuration Groups - Readings grouped by test configuration (e.g., HV-(LV+Gnd))
 * 3. General Readings - Parameters without specific configuration prefix
 * 
 * Also supports reading from display_config if provided (from Test Template)
 */

// Keywords that indicate a parameter is a test condition (not a measurement)
const TEST_CONDITION_KEYWORDS = [
  'serial',
  'temp',
  'temperature',
  'humidity',
  'rh',
  '%rh',
  'ambient',
  'date',
  'equipment',
  'location',
  'operator',
  'technician',
  'weather',
  'pressure',
  'altitude',
  'model',
  'manufacturer',
  'calibration',
  'certificate',
  'asset',
  'tag',
  'initial',
  'final',
  'environment',
  'condition'
];

/**
 * Match a parameter name against a pattern
 * Supports wildcards: * (any characters), ? (single character)
 * @param {string} paramName - The parameter name to check
 * @param {string} pattern - The pattern to match against
 * @returns {boolean} - True if matches
 */
export const matchesPattern = (paramName, pattern) => {
  if (!paramName || !pattern) return false;
  
  // Convert wildcard pattern to regex
  const regexPattern = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')  // Escape regex special chars
    .replace(/\\\*/g, '.*')  // Convert * to .*
    .replace(/\\\?/g, '.');   // Convert ? to .
  
  const regex = new RegExp(`^${regexPattern}$`, 'i');
  return regex.test(paramName);
};

/**
 * Check if a parameter matches any pattern in a list
 * @param {string} paramName - The parameter name
 * @param {string[]} patterns - Array of patterns
 * @returns {boolean} - True if matches any pattern
 */
export const matchesAnyPattern = (paramName, patterns) => {
  if (!patterns || !Array.isArray(patterns)) return false;
  return patterns.some(pattern => matchesPattern(paramName, pattern));
};

/**
 * Check if a parameter name indicates a test condition
 * @param {string} paramName - The parameter name to check
 * @returns {boolean} - True if it's a test condition
 */
export const isTestCondition = (paramName) => {
  if (!paramName) return false;
  const lowerName = paramName.toLowerCase();
  return TEST_CONDITION_KEYWORDS.some(keyword => lowerName.includes(keyword));
};

/**
 * Extract the configuration prefix from a parameter name
 * e.g., "HV-(LV+Gnd): IR @ 15 sec" -> "HV-(LV+Gnd)"
 * e.g., "HV-Gnd: IR @ 15 sec" -> "HV-Gnd"
 * @param {string} paramName - The parameter name
 * @returns {string|null} - The configuration prefix or null if none found
 */
export const extractConfigurationPrefix = (paramName) => {
  if (!paramName) return null;
  
  // Look for pattern "PREFIX: parameter" or "PREFIX - parameter"
  const colonMatch = paramName.match(/^([^:]+):/);
  if (colonMatch) {
    return colonMatch[1].trim();
  }
  
  // Also check for patterns like "HV-LV" without colon but with clear configuration indicators
  const configPatterns = [
    /^(HV[- ]*(LV|\(LV[^)]*\)|Gnd|\(Gnd[^)]*\)|E|\(E[^)]*\)))/i,
    /^(LV[- ]*(HV|\(HV[^)]*\)|Gnd|\(Gnd[^)]*\)|E|\(E[^)]*\)))/i,
    /^(Phase[- ]*[RYBA-C])/i,
    /^(Winding[- ]*\d*)/i,
    /^(Tap[- ]*\d*)/i,
  ];
  
  for (const pattern of configPatterns) {
    const match = paramName.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return null;
};

/**
 * Categorize a list of parameters into groups
 * @param {string[]} parameterNames - Array of parameter names
 * @returns {Object} - Categorized parameters
 */
export const categorizeParameters = (parameterNames) => {
  const result = {
    testConditions: [],
    configurationGroups: {}, // { "HV-(LV+Gnd)": ["param1", "param2"], ... }
    generalReadings: [],
    allMeasurements: [] // All non-condition parameters for convenience
  };

  if (!parameterNames || !Array.isArray(parameterNames)) {
    return result;
  }

  parameterNames.forEach(paramName => {
    if (isTestCondition(paramName)) {
      result.testConditions.push(paramName);
    } else {
      result.allMeasurements.push(paramName);
      
      const configPrefix = extractConfigurationPrefix(paramName);
      if (configPrefix) {
        if (!result.configurationGroups[configPrefix]) {
          result.configurationGroups[configPrefix] = [];
        }
        result.configurationGroups[configPrefix].push(paramName);
      } else {
        result.generalReadings.push(paramName);
      }
    }
  });

  return result;
};

/**
 * Get a display-friendly name for a configuration group
 * @param {string} configPrefix - The configuration prefix
 * @returns {string} - Display name
 */
export const getConfigurationDisplayName = (configPrefix) => {
  if (!configPrefix) return 'General Readings';
  
  // Clean up common patterns for better display
  return configPrefix
    .replace(/[()]/g, ' ')
    .replace(/\+/g, ' + ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Sort configuration groups in a logical order
 * HV configurations first, then LV, then others
 * @param {string[]} configPrefixes - Array of configuration prefixes
 * @returns {string[]} - Sorted prefixes
 */
export const sortConfigurationGroups = (configPrefixes) => {
  return [...configPrefixes].sort((a, b) => {
    const aUpper = a.toUpperCase();
    const bUpper = b.toUpperCase();
    
    // HV configurations come first
    const aIsHV = aUpper.startsWith('HV');
    const bIsHV = bUpper.startsWith('HV');
    if (aIsHV && !bIsHV) return -1;
    if (!aIsHV && bIsHV) return 1;
    
    // LV configurations come second
    const aIsLV = aUpper.startsWith('LV');
    const bIsLV = bUpper.startsWith('LV');
    if (aIsLV && !bIsLV) return -1;
    if (!aIsLV && bIsLV) return 1;
    
    // Alphabetical for the rest
    return a.localeCompare(b);
  });
};

/**
 * Get the short name of a parameter (without configuration prefix)
 * e.g., "HV-(LV+Gnd): IR @ 15 sec" -> "IR @ 15 sec"
 * @param {string} paramName - Full parameter name
 * @returns {string} - Short name
 */
export const getParameterShortName = (paramName) => {
  if (!paramName) return '';
  
  const colonIndex = paramName.indexOf(':');
  if (colonIndex > -1) {
    return paramName.substring(colonIndex + 1).trim();
  }
  
  return paramName;
};

/**
 * Group test record values by category
 * @param {Object} testValues - The test_values or parameters object from a test record
 * @returns {Object} - Grouped values
 */
export const groupTestValues = (testValues) => {
  if (!testValues || typeof testValues !== 'object') {
    return { testConditions: {}, configurationGroups: {}, generalReadings: {} };
  }

  const paramNames = Object.keys(testValues);
  const categories = categorizeParameters(paramNames);
  
  const result = {
    testConditions: {},
    configurationGroups: {}, // { "HV-(LV+Gnd)": { "IR @ 15 sec": value, ... }, ... }
    generalReadings: {}
  };

  // Populate test conditions
  categories.testConditions.forEach(name => {
    result.testConditions[name] = testValues[name];
  });

  // Populate configuration groups
  Object.entries(categories.configurationGroups).forEach(([configPrefix, params]) => {
    result.configurationGroups[configPrefix] = {};
    params.forEach(fullName => {
      const shortName = getParameterShortName(fullName);
      result.configurationGroups[configPrefix][shortName] = {
        value: testValues[fullName],
        fullName: fullName
      };
    });
  });

  // Populate general readings
  categories.generalReadings.forEach(name => {
    result.generalReadings[name] = testValues[name];
  });

  return result;
};

/**
 * Check if a parameter should be hidden from charts based on display_config
 * @param {string} paramName - The parameter name
 * @param {Object} displayConfig - The display_config from template
 * @returns {boolean} - True if should be hidden from charts
 */
export const isHiddenFromCharts = (paramName, displayConfig) => {
  if (!displayConfig?.hidden_from_charts) return false;
  return matchesAnyPattern(paramName, displayConfig.hidden_from_charts) ||
         displayConfig.hidden_from_charts.includes(paramName);
};

/**
 * Check if a parameter should be hidden from tables based on display_config
 * @param {string} paramName - The parameter name
 * @param {Object} displayConfig - The display_config from template
 * @returns {boolean} - True if should be hidden from tables
 */
export const isHiddenFromTable = (paramName, displayConfig) => {
  if (!displayConfig?.hidden_from_table) return false;
  return matchesAnyPattern(paramName, displayConfig.hidden_from_table) ||
         displayConfig.hidden_from_table.includes(paramName);
};

/**
 * Get custom label for a parameter from display_config
 * @param {string} paramName - The original parameter name
 * @param {Object} displayConfig - The display_config from template
 * @returns {string} - The custom label or original name
 */
export const getCustomLabel = (paramName, displayConfig) => {
  if (!displayConfig?.custom_labels) return paramName;
  return displayConfig.custom_labels[paramName] || paramName;
};

/**
 * Group test record values using display_config if available
 * Falls back to automatic pattern matching if no config provided
 * 
 * @param {Object} testValues - The test_values object from a test record
 * @param {Object} displayConfig - Optional display_config from the test template
 * @returns {Object} - Grouped values with metadata
 */
export const groupTestValuesWithConfig = (testValues, displayConfig = null) => {
  if (!testValues || typeof testValues !== 'object') {
    return { 
      testConditions: {}, 
      configurationGroups: {}, 
      generalReadings: {},
      groupOrder: [],
      chartSettings: { default_type: 'line', show_data_points: true, show_trend_arrows: true }
    };
  }

  const paramNames = Object.keys(testValues);
  
  // If no display_config, fall back to automatic categorization
  if (!displayConfig || Object.keys(displayConfig).length === 0) {
    const result = groupTestValues(testValues);
    return {
      ...result,
      groupOrder: Object.keys(result.configurationGroups),
      chartSettings: { default_type: 'line', show_data_points: true, show_trend_arrows: true }
    };
  }

  const result = {
    testConditions: {},
    configurationGroups: {},
    generalReadings: {},
    groupOrder: displayConfig.display_order || [],
    chartSettings: displayConfig.chart_settings || { default_type: 'line', show_data_points: true, show_trend_arrows: true },
    hiddenFromCharts: displayConfig.hidden_from_charts || [],
    hiddenFromTable: displayConfig.hidden_from_table || [],
    customLabels: displayConfig.custom_labels || {}
  };

  // Track which parameters have been assigned to a group
  const assignedParams = new Set();

  // 1. First, identify test conditions from config
  const testConditionPatterns = displayConfig.test_conditions || [];
  paramNames.forEach(name => {
    const isCondition = testConditionPatterns.some(pattern => 
      matchesPattern(name, pattern) || pattern === name
    ) || isTestCondition(name); // Also check default keywords
    
    if (isCondition) {
      result.testConditions[name] = testValues[name];
      assignedParams.add(name);
    }
  });

  // 2. Assign parameters to configured groups
  if (displayConfig.parameter_groups && displayConfig.parameter_groups.length > 0) {
    displayConfig.parameter_groups.forEach(group => {
      const groupName = group.name;
      result.configurationGroups[groupName] = {
        color: group.color || null,
        chartType: group.chart_type || 'line',
        showInChart: group.show_in_chart !== false,
        showInTable: group.show_in_table !== false,
        parameters: {}
      };

      paramNames.forEach(name => {
        if (assignedParams.has(name)) return;

        // Check explicit parameter list first
        if (group.parameters && group.parameters.includes(name)) {
          result.configurationGroups[groupName].parameters[name] = testValues[name];
          assignedParams.add(name);
          return;
        }

        // Check patterns
        if (group.patterns && group.patterns.some(pattern => matchesPattern(name, pattern))) {
          result.configurationGroups[groupName].parameters[name] = testValues[name];
          assignedParams.add(name);
        }
      });

      // Add to group order if not already present
      if (!result.groupOrder.includes(groupName)) {
        result.groupOrder.push(groupName);
      }
    });
  }

  // 3. Try automatic grouping for unassigned parameters (using config prefix extraction)
  paramNames.forEach(name => {
    if (assignedParams.has(name)) return;

    const configPrefix = extractConfigurationPrefix(name);
    if (configPrefix) {
      // Create auto-detected group if not exists
      const autoGroupName = `Auto: ${configPrefix}`;
      if (!result.configurationGroups[autoGroupName]) {
        result.configurationGroups[autoGroupName] = {
          color: null,
          chartType: 'line',
          showInChart: true,
          showInTable: true,
          parameters: {},
          isAutoDetected: true
        };
      }
      result.configurationGroups[autoGroupName].parameters[name] = testValues[name];
      assignedParams.add(name);
      
      if (!result.groupOrder.includes(autoGroupName)) {
        result.groupOrder.push(autoGroupName);
      }
    }
  });

  // 4. Remaining parameters go to general readings
  paramNames.forEach(name => {
    if (!assignedParams.has(name)) {
      result.generalReadings[name] = testValues[name];
    }
  });

  return result;
};

/**
 * Get a flattened list of measurement parameters (excluding test conditions)
 * respecting display_config if provided
 * @param {Object} testValues - The test_values object
 * @param {Object} displayConfig - Optional display_config
 * @returns {string[]} - Array of parameter names that are measurements
 */
export const getMeasurementParameters = (testValues, displayConfig = null) => {
  if (!testValues) return [];
  
  const grouped = groupTestValuesWithConfig(testValues, displayConfig);
  const measurements = [];
  
  // Add parameters from all configuration groups
  Object.values(grouped.configurationGroups).forEach(group => {
    if (group.parameters) {
      measurements.push(...Object.keys(group.parameters));
    }
  });
  
  // Add general readings
  measurements.push(...Object.keys(grouped.generalReadings));
  
  return measurements;
};

/**
 * Get parameters for chart display (excluding hidden ones)
 * @param {Object} testValues - The test_values object
 * @param {Object} displayConfig - Optional display_config
 * @returns {string[]} - Array of parameter names to show in charts
 */
export const getChartParameters = (testValues, displayConfig = null) => {
  const measurements = getMeasurementParameters(testValues, displayConfig);
  
  if (!displayConfig?.hidden_from_charts) return measurements;
  
  return measurements.filter(name => !isHiddenFromCharts(name, displayConfig));
};

export default {
  isTestCondition,
  extractConfigurationPrefix,
  categorizeParameters,
  getConfigurationDisplayName,
  sortConfigurationGroups,
  getParameterShortName,
  groupTestValues,
  // New display_config-aware functions
  matchesPattern,
  matchesAnyPattern,
  isHiddenFromCharts,
  isHiddenFromTable,
  getCustomLabel,
  groupTestValuesWithConfig,
  getMeasurementParameters,
  getChartParameters
};
