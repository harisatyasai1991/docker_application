// Comprehensive switchgear test data with PRPD patterns and visualizations

export const switchgearTests = {
  // IR Thermography Test
  'IR-THERMO-001': {
    id: 'IR-THERMO-001',
    name: 'Infrared Thermography',
    category: 'Thermal',
    description: 'Non-contact temperature measurement to detect hot spots, loose connections, and overloaded components in switchgear.',
    applicableStandards: [
      'IEEE 62.2 - Guide for Diagnostic Field Testing of Electric Power Apparatus - Electrical Machinery',
      'NETA ATS-2021 - Standard for Acceptance Testing Specifications',
      'ASTM E1934 - Standard Guide for Examining Electrical and Mechanical Equipment with Infrared Thermography'
    ],
    parameters: [
      { name: 'Ambient Temperature', limit: 'Record', unit: '°C' },
      { name: 'Load Current', limit: 'Record', unit: 'A' },
      { name: 'Temperature Rise (ΔT)', limit: '< 40°C above ambient', unit: '°C', severity: { normal: 0-15, warning: 15-40, critical: '>40' } },
      { name: 'Hot Spot Temperature', limit: '< 90°C', unit: '°C', severity: { normal: '<70', warning: '70-90', critical: '>90' } }
    ],
    testType: 'thermal',
    hasHeatmap: true,
    equipment: [
      'Infrared Camera (resolution ≥ 320x240)',
      'Emissivity reference tape',
      'Clamp-on ammeter',
      'Ambient thermometer',
      'PPE (Arc-rated clothing, face shield)'
    ],
    safetyPrecautions: [
      'Maintain safe working distance from energized equipment',
      'Wear appropriate arc-rated PPE',
      'Ensure camera is rated for environment',
      'Never touch energized components',
      'Follow NFPA 70E guidelines'
    ]
  },

  // Acoustic Partial Discharge
  'PD-ACOUSTIC-001': {
    id: 'PD-ACOUSTIC-001',
    name: 'Acoustic Partial Discharge Detection',
    category: 'Partial Discharge',
    description: 'Ultrasonic detection of partial discharge activity using acoustic sensors to identify insulation defects.',
    applicableStandards: [
      'IEC 60270 - High-voltage test techniques - Partial discharge measurements',
      'IEEE 400.3 - Guide for Partial Discharge Testing of Shielded Power Cable Systems',
      'IEC 62478 - High voltage test techniques - Measurement of partial discharges by electromagnetic and acoustic methods'
    ],
    parameters: [
      { name: 'PD Magnitude', limit: '< 500 pC', unit: 'pC', severity: { normal: '<100', warning: '100-500', critical: '>500' } },
      { name: 'PD Frequency', limit: 'Monitor', unit: 'pulses/sec' },
      { name: 'Acoustic Intensity', limit: '< 40 dB', unit: 'dB', severity: { normal: '<30', warning: '30-40', critical: '>40' } },
      { name: 'Background Noise', limit: 'Record', unit: 'dB' }
    ],
    testType: 'pd',
    hasPRPD: true,
    pdType: 'acoustic',
    equipment: [
      'Acoustic PD detector with ultrasonic sensor',
      'Directional ultrasonic probe',
      'PD analyzer',
      'Oscilloscope',
      'Calibration source'
    ],
    safetyPrecautions: [
      'Equipment must be energized - maintain safe distance',
      'Use insulated tools only',
      'Wear hearing protection when testing',
      'Follow arc flash safety protocols',
      'Never touch equipment during test'
    ]
  },

  // UHF Partial Discharge
  'PD-UHF-001': {
    id: 'PD-UHF-001',
    name: 'UHF Partial Discharge Detection',
    category: 'Partial Discharge',
    description: 'Ultra-High Frequency (300 MHz - 3 GHz) detection method for identifying PD sources with excellent noise immunity.',
    applicableStandards: [
      'IEC 60270 - Partial discharge measurements',
      'IEC TS 62478 - High voltage test techniques - Measurement of partial discharges',
      'CIGRE WG D1.33 - Guidelines for Unconventional PD Measurements'
    ],
    parameters: [
      { name: 'UHF Signal Amplitude', limit: '< -30 dBm', unit: 'dBm', severity: { normal: '<-50', warning: '-50 to -30', critical: '>-30' } },
      { name: 'PD Pulse Count', limit: '< 50 pulses/min', unit: 'pulses/min', severity: { normal: '<10', warning: '10-50', critical: '>50' } },
      { name: 'Frequency Range', limit: '300-1500 MHz', unit: 'MHz' },
      { name: 'Time of Arrival Difference', limit: 'Record', unit: 'ns' }
    ],
    testType: 'pd',
    hasPRPD: true,
    pdType: 'uhf',
    equipment: [
      'UHF PD detector with antenna',
      'UHF sensors (internal/external)',
      'Spectrum analyzer',
      'Time Domain Reflectometer (TDR)',
      'PD localization software'
    ],
    safetyPrecautions: [
      'Online testing - equipment remains energized',
      'Maintain minimum approach distance',
      'Ensure UHF sensors properly installed',
      'Use RF safety precautions',
      'Coordinate with operations team'
    ]
  },

  // TEV (Transient Earth Voltage)
  'PD-TEV-001': {
    id: 'PD-TEV-001',
    name: 'TEV (Transient Earth Voltage) Detection',
    category: 'Partial Discharge',
    description: 'Detection of electromagnetic emissions from PD activity through metallic enclosure using capacitive coupling.',
    applicableStandards: [
      'IEC 60270 - Partial discharge measurements',
      'IEEE 400 - Guide for Field Testing of Shielded Power Cable Systems',
      'BS EN 50601-1 - Portable systems for measurement of partial discharges'
    ],
    parameters: [
      { name: 'TEV Magnitude', limit: '< 20 dBmV', unit: 'dBmV', severity: { normal: '<10', warning: '10-20', critical: '>20' } },
      { name: 'Repetition Rate', limit: '< 100 pulses/sec', unit: 'pulses/sec', severity: { normal: '<20', warning: '20-100', critical: '>100' } },
      { name: 'Pulse Width', limit: 'Record', unit: 'ns' },
      { name: 'Frequency Content', limit: '3-100 MHz', unit: 'MHz' }
    ],
    testType: 'pd',
    hasPRPD: true,
    pdType: 'tev',
    equipment: [
      'TEV detector with capacitive sensor',
      'Handheld TEV probe',
      'Data logger',
      'Grounding mat',
      'PPE'
    ],
    safetyPrecautions: [
      'Non-intrusive online test',
      'Maintain safe distance from live parts',
      'Ensure proper grounding of equipment',
      'Be aware of electromagnetic fields',
      'Use insulated probes'
    ]
  },

  // HFCT (High Frequency Current Transformer)
  'PD-HFCT-001': {
    id: 'PD-HFCT-001',
    name: 'HFCT Partial Discharge Detection',
    category: 'Partial Discharge',
    description: 'High Frequency Current Transformer method for detecting PD pulses in the frequency range 100 kHz - 50 MHz.',
    applicableStandards: [
      'IEC 60270 - Partial discharge measurements',
      'IEEE 400.3 - Guide for PD Testing of Shielded Power Cable Systems',
      'IEC 62478 - Electromagnetic and acoustic PD measurement methods'
    ],
    parameters: [
      { name: 'HFCT Signal Amplitude', limit: '< 50 mV', unit: 'mV', severity: { normal: '<10', warning: '10-50', critical: '>50' } },
      { name: 'Apparent Charge', limit: '< 300 pC', unit: 'pC', severity: { normal: '<100', warning: '100-300', critical: '>300' } },
      { name: 'Pulse Repetition Rate', limit: '< 200 pulses/sec', unit: 'pulses/sec' },
      { name: 'Phase Correlation', limit: 'Monitor', unit: 'degrees' }
    ],
    testType: 'pd',
    hasPRPD: true,
    pdType: 'hfct',
    equipment: [
      'HFCT sensors (split-core)',
      'PD analyzer with HFCT input',
      'Oscilloscope (≥ 200 MHz bandwidth)',
      'Calibration pulse generator',
      'Laptop with analysis software'
    ],
    safetyPrecautions: [
      'Install HFCT sensors on grounding cables',
      'Equipment must be de-energized for sensor installation',
      'Verify proper sensor coupling',
      'Follow LOTO procedures',
      'Test can be conducted online after installation'
    ]
  },

  // Online Contact Resistance
  'CONTACT-RES-001': {
    id: 'CONTACT-RES-001',
    name: 'Online Contact Resistance Measurement',
    category: 'Electrical',
    description: 'Measurement of contact resistance in circuit breakers and switches to detect deterioration, oxidation, or loose connections.',
    applicableStandards: [
      'IEEE C37.09 - Test Procedures for AC High-Voltage Circuit Breakers',
      'IEC 62271-100 - High-voltage switchgear - Circuit breakers',
      'NETA MTS-2019 - Maintenance Testing Specifications'
    ],
    parameters: [
      { name: 'Contact Resistance', limit: '< 100 μΩ', unit: 'μΩ', severity: { normal: '<50', warning: '50-100', critical: '>100' } },
      { name: 'Phase-to-Phase Variation', limit: '< 20%', unit: '%', severity: { normal: '<10', warning: '10-20', critical: '>20' } },
      { name: 'Baseline Comparison', limit: '< 50% increase', unit: '%' },
      { name: 'Temperature', limit: 'Record', unit: '°C' }
    ],
    testType: 'resistance',
    hasTrendChart: true,
    equipment: [
      'Micro-ohmmeter (DLRO)',
      'High current test set (≥ 100A)',
      'Kelvin probes',
      'Infrared thermometer',
      'Calibration standard'
    ],
    safetyPrecautions: [
      'De-energize and isolate circuit breaker',
      'Verify zero voltage with voltage detector',
      'Apply LOTO procedures',
      'Check for stored energy (springs, capacitors)',
      'Use insulated test leads'
    ]
  },

  // Busbar & Cable Joint Temperature
  'TEMP-MON-001': {
    id: 'TEMP-MON-001',
    name: 'Busbar & Cable Joint Temperature Monitoring',
    category: 'Thermal',
    description: 'Continuous or periodic temperature monitoring of busbars and cable joints to detect overheating and prevent failures.',
    applicableStandards: [
      'IEEE 605 - Guide for Bus Design in Air Insulated Substations',
      'IEC 61439-1 - Low-voltage switchgear assemblies - General rules',
      'NFPA 70B - Recommended Practice for Electrical Equipment Maintenance'
    ],
    parameters: [
      { name: 'Busbar Temperature', limit: '< 90°C at rated current', unit: '°C', severity: { normal: '<70', warning: '70-90', critical: '>90' } },
      { name: 'Cable Joint Temperature', limit: '< 80°C', unit: '°C', severity: { normal: '<60', warning: '60-80', critical: '>80' } },
      { name: 'Temperature Rise (ΔT)', limit: '< 50°C above ambient', unit: '°C' },
      { name: 'Load Current', limit: 'Record', unit: 'A' }
    ],
    testType: 'temperature',
    hasDistributionChart: true,
    equipment: [
      'Fiber optic temperature sensors',
      'RTD (PT100) sensors',
      'Infrared camera',
      'Data acquisition system',
      'Temperature monitoring software'
    ],
    safetyPrecautions: [
      'Can be performed on energized equipment',
      'Maintain safe working distance',
      'Use arc-rated PPE when accessing',
      'Ensure sensors properly installed',
      'Never touch live parts'
    ]
  },

  // Circuit Breaker Monitoring
  'CB-MON-001': {
    id: 'CB-MON-001',
    name: 'Circuit Breaker Condition Monitoring',
    category: 'Mechanical',
    description: 'Comprehensive monitoring of circuit breaker operations including timing, travel, coil current, and contact wear.',
    applicableStandards: [
      'IEEE C37.09 - Test Procedures for AC High-Voltage Circuit Breakers',
      'IEC 62271-100 - High-voltage switchgear - Circuit breakers',
      'IEEE C37.59 - Requirements for Conversion of Power Switchgear Equipment'
    ],
    parameters: [
      { name: 'Operating Time (Open)', limit: '< 50 ms', unit: 'ms', severity: { normal: '<40', warning: '40-50', critical: '>50' } },
      { name: 'Operating Time (Close)', limit: '< 60 ms', unit: 'ms', severity: { normal: '<50', warning: '50-60', critical: '>60' } },
      { name: 'Contact Travel', limit: 'Per manufacturer spec', unit: 'mm' },
      { name: 'Coil Current', limit: 'Within ±10% of baseline', unit: 'A' },
      { name: 'Operation Counter', limit: 'Track', unit: 'ops' }
    ],
    testType: 'mechanical',
    hasTravelCurve: true,
    equipment: [
      'Circuit breaker analyzer',
      'Linear motion transducer',
      'Current probes',
      'Timing analyzer',
      'Laptop with CB analysis software'
    ],
    safetyPrecautions: [
      'De-energize and rack out breaker',
      'Apply LOTO',
      'Discharge stored energy',
      'Use proper PPE',
      'Ensure control power isolated'
    ]
  },

  // Protective Relay Testing
  'RELAY-TEST-001': {
    id: 'RELAY-TEST-001',
    name: 'Protective Relay Testing',
    category: 'Protection',
    description: 'Functional testing of protective relays including pickup values, timing, and coordination verification.',
    applicableStandards: [
      'IEEE C37.90 - Standard for Relays and Relay Systems',
      'IEEE 242 - Recommended Practice for Protection and Coordination',
      'NERC PRC Standards - Protection and Control'
    ],
    parameters: [
      { name: 'Overcurrent Pickup', limit: 'Per settings (±5%)', unit: 'A', severity: { normal: '±2%', warning: '±2-5%', critical: '>±5%' } },
      { name: 'Time Delay Accuracy', limit: '±10% or ±0.1s', unit: 's' },
      { name: 'Instantaneous Trip', limit: 'Per settings', unit: 'A' },
      { name: 'Ground Fault Pickup', limit: 'Per settings', unit: 'A' }
    ],
    testType: 'protection',
    hasCoordinationCurve: true,
    equipment: [
      'Protective relay test set',
      'Current injection set',
      'Voltage injection set',
      'Timing meter',
      'PC with relay software'
    ],
    safetyPrecautions: [
      'Coordinate with system operators',
      'Remove relay from service',
      'Verify isolation from CT/PT circuits',
      'Use proper test currents/voltages',
      'Document all settings changes'
    ]
  },

  // Power Quality Analysis
  'PQ-ANALYSIS-001': {
    id: 'PQ-ANALYSIS-001',
    name: 'Power Quality Analysis',
    category: 'Power Quality',
    description: 'Comprehensive analysis of voltage, current harmonics, sags, swells, and power factor to ensure IEEE 519 compliance.',
    applicableStandards: [
      'IEEE 519 - Harmonic Control in Electrical Power Systems',
      'IEC 61000-4-30 - Power quality measurement methods',
      'IEEE 1159 - Recommended Practice for Monitoring Electric Power Quality'
    ],
    parameters: [
      { name: 'Total Harmonic Distortion (THDv)', limit: '< 5%', unit: '%', severity: { normal: '<3', warning: '3-5', critical: '>5' } },
      { name: 'Total Harmonic Distortion (THDi)', limit: '< 15%', unit: '%', severity: { normal: '<8', warning: '8-15', critical: '>15' } },
      { name: 'Voltage Unbalance', limit: '< 2%', unit: '%', severity: { normal: '<1', warning: '1-2', critical: '>2' } },
      { name: 'Power Factor', limit: '> 0.90', unit: 'pu', severity: { normal: '>0.95', warning: '0.90-0.95', critical: '<0.90' } }
    ],
    testType: 'powerquality',
    hasHarmonicChart: true,
    equipment: [
      'Power quality analyzer',
      'Current probes (3-phase)',
      'Voltage probes',
      'Data logger',
      'Analysis software'
    ],
    safetyPrecautions: [
      'Connect to energized system - use caution',
      'Verify voltage ratings of equipment',
      'Use insulated test leads',
      'Wear appropriate PPE',
      'Follow electrical safety procedures'
    ]
  },

  // Arc Flash Detection
  'ARC-FLASH-001': {
    id: 'ARC-FLASH-001',
    name: 'Arc Flash Detection & Analysis',
    category: 'Safety',
    description: 'Arc flash hazard analysis including incident energy calculation, arc flash boundary determination, and detection system testing.',
    applicableStandards: [
      'IEEE 1584 - Guide for Performing Arc Flash Hazard Calculations',
      'NFPA 70E - Standard for Electrical Safety in the Workplace',
      'IEC 61641 - Enclosed low-voltage switchgear under fault conditions'
    ],
    parameters: [
      { name: 'Incident Energy', limit: 'Document', unit: 'cal/cm²', severity: { normal: '<1.2', warning: '1.2-8', critical: '>8' } },
      { name: 'Arc Flash Boundary', limit: 'Calculate per IEEE 1584', unit: 'inches' },
      { name: 'Arc Flash Detection Time', limit: '< 100 ms', unit: 'ms', severity: { normal: '<50', warning: '50-100', critical: '>100' } },
      { name: 'Fault Clearing Time', limit: 'Per coordination study', unit: 'ms' }
    ],
    testType: 'arcflash',
    hasEnergyChart: true,
    equipment: [
      'Arc flash light sensors',
      'Current sensors',
      'Arc flash relay',
      'Incident energy calculator software',
      'Personal protective equipment (PPE)'
    ],
    safetyPrecautions: [
      'CRITICAL - High hazard testing',
      'Wear maximum arc-rated PPE',
      'Maintain arc flash boundary',
      'Use remote operation when possible',
      'Have emergency response plan',
      'Never test alone'
    ]
  }
};

// Generate mock test history for switchgear
export const generateSwitchgearTestHistory = (assetId) => {
  const testTypes = Object.keys(switchgearTests);
  const history = [];
  
  const now = new Date();
  for (let i = 0; i < 30; i++) {
    const testDate = new Date(now);
    testDate.setDate(testDate.getDate() - (i * 30)); // Monthly tests
    
    testTypes.forEach(testId => {
      const test = switchgearTests[testId];
      const passed = Math.random() > 0.15; // 85% pass rate
      
      history.push({
        id: `${testId}-${assetId}-${i}`,
        testType: test.name,
        testId: testId,
        testDate: testDate.toISOString().split('T')[0],
        conductor: ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Emily Brown'][Math.floor(Math.random() * 4)],
        result: passed ? 'Pass' : (Math.random() > 0.5 ? 'Warning' : 'Fail'),
        fileName: `${testId}_${testDate.toISOString().split('T')[0]}.pdf`,
        fileType: 'pdf',
        fileSize: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
        testValues: generateTestValues(test, passed)
      });
    });
  }
  
  return history.sort((a, b) => new Date(b.testDate) - new Date(a.testDate));
};

// Generate realistic test values based on test type
function generateTestValues(test, passed) {
  const values = {};
  
  test.parameters.forEach(param => {
    let value;
    const severity = param.severity;
    
    if (param.unit === 'pC') {
      // Partial discharge magnitude
      if (passed) {
        value = Math.random() * (severity ? parseFloat(severity.normal.replace('<', '')) : 100);
      } else {
        value = Math.random() * 300 + (severity ? parseFloat(severity.critical.replace('>', '')) : 500);
      }
    } else if (param.unit === '°C') {
      // Temperature
      if (passed) {
        value = Math.random() * 30 + 40; // 40-70°C
      } else {
        value = Math.random() * 30 + 85; // 85-115°C
      }
    } else if (param.unit === 'μΩ') {
      // Resistance
      if (passed) {
        value = Math.random() * 40 + 10; // 10-50 μΩ
      } else {
        value = Math.random() * 100 + 100; // 100-200 μΩ
      }
    } else if (param.unit === 'ms') {
      // Timing
      if (passed) {
        value = Math.random() * 20 + 30; // 30-50 ms
      } else {
        value = Math.random() * 30 + 60; // 60-90 ms
      }
    } else if (param.unit === '%') {
      // Percentage
      if (passed) {
        value = Math.random() * 3 + 1; // 1-4%
      } else {
        value = Math.random() * 10 + 8; // 8-18%
      }
    } else {
      value = Math.random() * 100;
    }
    
    values[param.name] = Math.round(value * 100) / 100;
  });
  
  // Add PRPD data for PD tests
  if (test.hasPRPD) {
    values.prpdData = generatePRPDPattern(test.pdType);
  }
  
  // Add thermal data for IR tests
  if (test.hasHeatmap) {
    values.thermalData = generateThermalData();
  }
  
  return values;
}

// Generate PRPD (Phase Resolved Partial Discharge) pattern
function generatePRPDPattern(pdType) {
  const pattern = {
    phases: [],
    magnitudes: [],
    pulseCount: 0
  };
  
  // Generate 360 phase points (0-360 degrees)
  for (let phase = 0; phase < 360; phase++) {
    // Different PD types have different phase patterns
    let magnitude = 0;
    
    switch (pdType) {
      case 'acoustic':
        // Surface discharge pattern - concentrated around voltage peaks
        if ((phase >= 80 && phase <= 100) || (phase >= 260 && phase <= 280)) {
          magnitude = Math.random() * 400 + 100;
        } else {
          magnitude = Math.random() * 50;
        }
        break;
        
      case 'uhf':
        // Corona discharge - symmetrical around peaks
        if ((phase >= 70 && phase <= 110) || (phase >= 250 && phase <= 290)) {
          magnitude = Math.random() * 300 + 50;
        } else {
          magnitude = Math.random() * 30;
        }
        break;
        
      case 'tev':
        // Internal void discharge - leading edge of voltage
        if ((phase >= 20 && phase <= 80) || (phase >= 200 && phase <= 260)) {
          magnitude = Math.random() * 500 + 100;
        } else {
          magnitude = Math.random() * 40;
        }
        break;
        
      case 'hfct':
        // Slot discharge - specific patterns
        if ((phase >= 30 && phase <= 60) || (phase >= 120 && phase <= 150) || 
            (phase >= 210 && phase <= 240) || (phase >= 300 && phase <= 330)) {
          magnitude = Math.random() * 350 + 80;
        } else {
          magnitude = Math.random() * 25;
        }
        break;
        
      default:
        magnitude = Math.random() * 200;
    }
    
    if (magnitude > 50) {
      pattern.phases.push(phase);
      pattern.magnitudes.push(Math.round(magnitude));
      pattern.pulseCount++;
    }
  }
  
  return pattern;
}

// Generate thermal heatmap data
function generateThermalData() {
  const width = 20;
  const height = 15;
  const data = [];
  
  // Create hotspot in random location
  const hotspotX = Math.floor(Math.random() * width);
  const hotspotY = Math.floor(Math.random() * height);
  const hotspotTemp = Math.random() * 30 + 70; // 70-100°C
  
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      // Calculate distance from hotspot
      const distance = Math.sqrt(Math.pow(x - hotspotX, 2) + Math.pow(y - hotspotY, 2));
      const temp = hotspotTemp - (distance * 5) + Math.random() * 5;
      row.push(Math.max(25, Math.min(100, temp))); // Clamp between 25-100°C
    }
    data.push(row);
  }
  
  return {
    width,
    height,
    data,
    hotspotX,
    hotspotY,
    maxTemp: hotspotTemp,
    minTemp: 25,
    avgTemp: (hotspotTemp + 25) / 2
  };
}

export default switchgearTests;
