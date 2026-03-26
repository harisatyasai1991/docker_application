// Mock test data for different asset types with standards and SOPs

export const assetTests = {
  transformer: [
    {
      id: 'OIL-001',
      name: 'Transformer Oil Analysis (Dissolved Gas Analysis - DGA)',
      category: 'Chemical',
      description: 'Comprehensive analysis of dissolved gases in transformer oil to detect incipient faults and assess insulation condition.',
      applicableStandards: [
        'IEEE C57.104 - Guide for the Interpretation of Gases Generated in Oil-Immersed Transformers',
        'IEC 60599 - Mineral oil-filled electrical equipment in service - Guidance on the interpretation of dissolved and free gases analysis',
        'ASTM D3612 - Standard Test Method for Analysis of Gases Dissolved in Electrical Insulating Oil by Gas Chromatography'
      ],
      parameters: [
        { name: 'Hydrogen (H2)', limit: '< 100 ppm', unit: 'ppm' },
        { name: 'Methane (CH4)', limit: '< 120 ppm', unit: 'ppm' },
        { name: 'Ethane (C2H6)', limit: '< 65 ppm', unit: 'ppm' },
        { name: 'Ethylene (C2H4)', limit: '< 50 ppm', unit: 'ppm' },
        { name: 'Acetylene (C2H2)', limit: '< 3 ppm', unit: 'ppm' },
        { name: 'Carbon Monoxide (CO)', limit: '< 540 ppm', unit: 'ppm' },
        { name: 'Carbon Dioxide (CO2)', limit: '< 2500 ppm', unit: 'ppm' }
      ],
      equipment: [
        'Gas Chromatograph',
        'Oil sampling syringe (50-100ml)',
        'Sample bottles (glass, hermetically sealed)',
        'PPE (gloves, safety glasses)'
      ],
      safetyPrecautions: [
        'Ensure transformer is de-energized if required by procedure',
        'Use appropriate PPE at all times',
        'Handle oil samples carefully to avoid contamination',
        'Be aware of hot surfaces on energized equipment',
        'Follow lockout/tagout procedures'
      ],
      sop: [
        {
          step: 1,
          title: 'Preparation',
          description: 'Review transformer history, previous test results, and verify test equipment calibration. Ensure all required PPE and sampling equipment are available.'
        },
        {
          step: 2,
          title: 'Sample Collection',
          description: 'Locate oil sampling valve (typically at bottom drain or sampling valve). Clean the valve area thoroughly. Flush valve with oil to remove any contaminants. Fill sample bottle completely, leaving no air space. Seal immediately and label with transformer ID, date, and location.'
        },
        {
          step: 3,
          title: 'Sample Handling',
          description: 'Transport samples in upright position. Avoid temperature extremes. Submit to laboratory within 24 hours if possible. Store in cool, dark place if delay is unavoidable.'
        },
        {
          step: 4,
          title: 'Laboratory Analysis',
          description: 'Laboratory performs gas chromatography analysis following ASTM D3612. Results reported in ppm (parts per million) for each gas component.'
        },
        {
          step: 5,
          title: 'Results Interpretation',
          description: 'Compare results against IEEE C57.104 key gas method and Duval Triangle. Evaluate trends by comparing with historical data. Calculate gas generation rates if previous data available. Identify fault type: thermal, electrical discharge, or cellulose decomposition.'
        },
        {
          step: 6,
          title: 'Documentation',
          description: 'Record all test data in transformer maintenance log. Update condition assessment. Generate test report with recommendations. Schedule follow-up testing if abnormal conditions detected.'
        }
      ],
      frequency: 'Annual (or more frequent if abnormal conditions detected)',
      duration: '30-45 minutes (sampling) + 2-3 days (lab analysis)'
    },
    {
      id: 'INS-001',
      name: 'Insulation Resistance Test (Megger Test)',
      category: 'Electrical',
      description: 'Measurement of insulation resistance between windings and ground to assess the condition of transformer insulation system.',
      applicableStandards: [
        'IEEE 43 - Recommended Practice for Testing Insulation Resistance of Rotating Machinery',
        'IEEE C57.12.90 - Standard Test Code for Liquid-Immersed Distribution, Power, and Regulating Transformers',
        'IEC 60076-1 - Power transformers - General'
      ],
      parameters: [
        { name: 'HV to Ground', limit: '> 1000 MΩ', unit: 'MΩ' },
        { name: 'LV to Ground', limit: '> 1000 MΩ', unit: 'MΩ' },
        { name: 'HV to LV', limit: '> 1000 MΩ', unit: 'MΩ' },
        { name: 'Polarization Index (PI)', limit: '> 2.0', unit: 'ratio' }
      ],
      equipment: [
        'Insulation Resistance Tester (Megger) - 5kV or 10kV',
        'Test leads with proper insulation',
        'Thermometer for temperature recording',
        'Cleaning materials for terminals'
      ],
      safetyPrecautions: [
        'De-energize transformer and verify zero voltage',
        'Discharge capacitive charge before and after testing',
        'Use proper lockout/tagout procedures',
        'Keep personnel clear during test',
        'Ground transformer after test'
      ],
      sop: [
        {
          step: 1,
          title: 'Preparation and Safety',
          description: 'Isolate transformer from all sources. Verify de-energization with voltage tester. Apply locks and tags. Discharge any residual charge. Record ambient temperature and transformer nameplate data.'
        },
        {
          step: 2,
          title: 'Terminal Preparation',
          description: 'Clean all terminals and connection points. Remove any temporary grounds. Disconnect bushings from external connections. Ensure all test surfaces are dry and clean.'
        },
        {
          step: 3,
          title: 'Test Setup',
          description: 'Select appropriate test voltage (typically 5kV for distribution transformers). Connect megger leads: positive to winding under test, negative to ground/tank. Verify all other windings are grounded.'
        },
        {
          step: 4,
          title: 'Conduct IR Test',
          description: 'Apply test voltage. Record reading at 1 minute. Continue test for 10 minutes total. Record reading at 10 minutes. Calculate Polarization Index (10-min reading / 1-min reading). Test each winding combination: HV-Ground, LV-Ground, HV-LV.'
        },
        {
          step: 5,
          title: 'Discharge and Ground',
          description: 'After each test, ground the winding for at least 4 times the test duration. Use discharge stick connected to ground. Verify complete discharge before moving to next test.'
        },
        {
          step: 6,
          title: 'Results Evaluation',
          description: 'Compare readings with previous test results. Correct for temperature (readings decrease with higher temperature). Evaluate Polarization Index: PI > 2.0 is good, 1.0-2.0 is questionable, < 1.0 is poor. Investigate any significant decrease from baseline values.'
        },
        {
          step: 7,
          title: 'Documentation',
          description: 'Record all readings, temperature, humidity, and test conditions. Update transformer test history. Recommend corrective action if needed. Restore transformer connections and grounds.'
        }
      ],
      frequency: 'Annual or before commissioning',
      duration: '1-2 hours'
    },
    {
      id: 'TTR-001',
      name: 'Turns Ratio Test',
      category: 'Electrical',
      description: 'Verification of the voltage transformation ratio between primary and secondary windings to detect shorted turns or incorrect tap settings.',
      applicableStandards: [
        'IEEE C57.12.90 - Standard Test Code for Liquid-Immersed Transformers',
        'IEC 60076-1 - Power transformers - General'
      ],
      parameters: [
        { name: 'Ratio Deviation', limit: '< 0.5%', unit: '%' },
        { name: 'Phase Angle', limit: '± 0.5°', unit: 'degrees' }
      ],
      equipment: [
        'Transformer Turns Ratio (TTR) Tester',
        'Test leads',
        'Voltage source (if not built into TTR)'
      ],
      safetyPrecautions: [
        'De-energize transformer completely',
        'Verify isolation from all sources',
        'Use proper lockout/tagout',
        'Check for back-feed possibilities'
      ],
      sop: [
        {
          step: 1,
          title: 'Setup and Preparation',
          description: 'De-energize and isolate transformer. Record nameplate ratio and tap position. Connect TTR tester to appropriate terminals. Set expected ratio on tester.'
        },
        {
          step: 2,
          title: 'Ratio Measurement',
          description: 'Apply test voltage to primary winding. Measure induced voltage on secondary. Calculate measured ratio. Test all phases (A-B, B-C, C-A). Test all tap positions if equipped with tap changer.'
        },
        {
          step: 3,
          title: 'Results Analysis',
          description: 'Compare measured ratio with nameplate ratio. Calculate deviation percentage: (Measured - Expected) / Expected × 100. Verify all phases have similar ratios. Check that tap changer produces expected ratio changes.'
        },
        {
          step: 4,
          title: 'Documentation',
          description: 'Record all ratios for each phase and tap position. Document any deviations exceeding tolerance. Update test records. Recommend further testing if significant deviations found.'
        }
      ],
      frequency: 'Triennial or after fault/abnormal event',
      duration: '30-60 minutes'
    },
    {
      id: 'PD-001',
      name: 'Partial Discharge (PD) Test / Assessment',
      category: 'Diagnostic',
      description: 'Detection and measurement of partial discharge activity in transformer insulation system to identify deterioration and potential failure points before complete breakdown occurs.',
      applicableStandards: [
        'IEC 60270 - High-voltage test techniques - Partial discharge measurements',
        'IEEE 400.3 - Guide for Partial Discharge Testing of Shielded Power Cable Systems in a Field Environment',
        'IEC 60076-3 - Power transformers - Insulation levels, dielectric tests and external clearances in air',
        'CIGRÉ Technical Brochure 676 - Partial Discharge Detection System for GIS'
      ],
      parameters: [
        { name: 'PD Magnitude', limit: '< 500 pC (new equipment), < 1000 pC (in-service)', unit: 'pC' },
        { name: 'Phase Resolved PD Pattern', limit: 'No corona or surface discharge patterns', unit: '-' },
        { name: 'Noise Level', limit: '< 50 pC', unit: 'pC' },
        { name: 'Number of PD Pulses', limit: 'Trending analysis', unit: 'pulses/cycle' }
      ],
      equipment: [
        'Partial Discharge Detector/Analyzer',
        'High Frequency Current Transformer (HFCT)',
        'Ultrasonic sensors (acoustic method)',
        'Coupling capacitors',
        'TEV (Transient Earth Voltage) sensors',
        'Electromagnetic interference filters'
      ],
      safetyPrecautions: [
        'Transformer must be energized for online PD testing - maintain safe clearances',
        'For offline testing, follow high-voltage safety procedures',
        'Use appropriate PPE including insulated gloves and face shield',
        'Establish safety barriers around test area',
        'Be aware of electromagnetic fields during energized testing',
        'Never touch measurement equipment during energized testing',
        'Follow arc flash protection requirements'
      ],
      sop: [
        {
          step: 1,
          title: 'Pre-Test Assessment and Planning',
          description: 'Review transformer history and previous PD test results. Determine test method: online (in-service) or offline. For online testing, verify safe working distance and PPE requirements. Identify noise sources in surrounding area. Obtain transformer nameplate data and insulation specifications. Review single-line diagram and grounding configuration.'
        },
        {
          step: 2,
          title: 'Equipment Setup and Calibration',
          description: 'Set up PD detection system according to manufacturer instructions. For electrical method: install HFCT sensors on grounding leads of bushings or connect coupling capacitors. For acoustic method: position ultrasonic sensors on transformer tank. For TEV method: place TEV sensors at ground points. Calibrate equipment using known PD calibrator (typically 100-1000 pC). Verify background noise level is acceptable (< 50 pC).'
        },
        {
          step: 3,
          title: 'Background Noise Assessment',
          description: 'Measure ambient electromagnetic noise without transformer energized (if offline test). Identify and document external noise sources: nearby switchgear, overhead lines, communication systems. Set up noise filters and shielding as needed. Establish noise rejection settings in PD analyzer. Record baseline noise spectrum for comparison.'
        },
        {
          step: 4,
          title: 'PD Measurement - Electrical Detection',
          description: 'Start PD measurement system. Capture data continuously for minimum 15-30 minutes per test location. Record PD magnitude (pC) vs. phase angle (PRPD pattern). Monitor PD repetition rate and pulse count. Test all three phases separately if possible. Record maximum PD magnitude, average magnitude, and total pulse count. Save all waveforms and PRPD patterns for analysis.'
        },
        {
          step: 5,
          title: 'PD Measurement - Acoustic/UHF Detection (if applicable)',
          description: 'Position ultrasonic sensors systematically across transformer tank. Scan for PD sources using acoustic detection method. Triangulate PD source location using multiple sensors. Record acoustic signals and correlate with electrical measurements. Map PD activity locations on transformer diagram. Use thermal imaging if hot spots suspected.'
        },
        {
          step: 6,
          title: 'PD Pattern Recognition and Analysis',
          description: 'Analyze Phase-Resolved PD (PRPD) patterns to identify discharge type: Internal discharge (elliptical pattern centered around 90° and 270°), Surface discharge (asymmetric pattern with activity in rising edges), Corona discharge (symmetric pattern at voltage peaks 0° and 180°), Floating component (random pattern across all phases). Measure PD inception voltage (PDIV) and extinction voltage (PDEV) if performing offline test. Compare patterns with IEC 60270 standard patterns.'
        },
        {
          step: 7,
          title: 'Severity Assessment and Trending',
          description: 'Compare current PD levels with acceptance criteria: New equipment < 500 pC, In-service equipment < 1000 pC, Critical threshold > 2000 pC (immediate action). Evaluate trend from previous measurements. Calculate rate of change (pC/year). Assess distribution of PD across phases. Correlate PD data with DGA results if available. Determine if PD is stable, increasing, or decreasing.'
        },
        {
          step: 8,
          title: 'Location and Source Identification',
          description: 'Correlate acoustic, electrical, and TEV data to pinpoint PD source. Identify suspected component: bushing, tap changer, winding insulation, core ground, accessories. Evaluate accessibility for repair. Estimate remaining insulation life based on PD severity. Determine if PD is internal (critical) or external (less critical).'
        },
        {
          step: 9,
          title: 'Results Documentation and Recommendations',
          description: 'Generate comprehensive PD test report including: all PRPD patterns and waveforms, PD magnitude values and statistics, source location and type identification, comparison with previous tests and acceptance criteria, severity assessment and risk level. Provide recommendations: Continue monitoring (low PD, stable), Increased testing frequency (moderate PD, increasing trend), Plan for repair/replacement (high PD, rapid increase), Emergency action (critical PD levels > 5000 pC or evidence of tracking). Update transformer condition assessment. Schedule follow-up testing interval based on severity.'
        },
        {
          step: 10,
          title: 'Post-Test Actions and Safety',
          description: 'If offline test: discharge transformer per safety procedures. Remove all test equipment and sensors. Verify transformer grounding is restored. For high PD levels: notify operations team immediately, implement enhanced monitoring, consider load reduction if critical. Update asset management system with PD data. Create work orders for recommended actions. Brief maintenance team on findings.'
        }
      ],
      frequency: 'Annual for critical transformers, biennial for standard units, or based on condition/risk assessment',
      duration: '2-4 hours for online testing, 4-8 hours for comprehensive offline testing'
    }
  ],
  switchgear: [
    {
      id: 'CR-001',
      name: 'Contact Resistance Test',
      category: 'Electrical',
      description: 'Measurement of electrical resistance across circuit breaker contacts to detect wear, contamination, or inadequate contact pressure.',
      applicableStandards: [
        'IEEE C37.09 - Test Procedures for AC High-Voltage Circuit Breakers',
        'IEC 62271-100 - High-voltage switchgear - Circuit-breakers',
        'NETA ATS - Acceptance Testing Specifications'
      ],
      parameters: [
        { name: 'Contact Resistance', limit: '< 100 µΩ (typical)', unit: 'µΩ' },
        { name: 'Phase-to-Phase Variation', limit: '< 50%', unit: '%' }
      ],
      equipment: [
        'Micro-ohmmeter or Low Resistance Ohmmeter (DLRO)',
        'High current source (100-200A)',
        'Test leads with proper current capacity',
        'Contact cleaning materials'
      ],
      safetyPrecautions: [
        'De-energize circuit breaker and verify',
        'Rack-out or isolate breaker from bus',
        'Use appropriate PPE',
        'Ensure proper ventilation when testing'
      ],
      sop: [
        {
          step: 1,
          title: 'Preparation',
          description: 'Isolate circuit breaker. Rack-out to test position if applicable. Clean contact surfaces. Record breaker nameplate data and last maintenance date.'
        },
        {
          step: 2,
          title: 'Test Setup',
          description: 'Connect DLRO leads across each phase. Ensure good connection at both line and load sides. Set test current (typically 100A minimum). Verify connections are tight and clean.'
        },
        {
          step: 3,
          title: 'Conduct Test',
          description: 'Close breaker contacts. Apply test current. Allow reading to stabilize. Record resistance for each phase. Open breaker and repeat test 2-3 times. Calculate average resistance for each phase.'
        },
        {
          step: 4,
          title: 'Results Evaluation',
          description: 'Compare readings with manufacturer specifications and baseline values. Check for consistency between phases. Calculate percentage variation. Investigate high resistance or significant increase from baseline.'
        },
        {
          step: 5,
          title: 'Documentation and Recommendations',
          description: 'Record all measurements and test conditions. Compare with historical trend. Recommend contact cleaning, adjustment, or replacement if readings exceed limits. Update maintenance records.'
        }
      ],
      frequency: 'Annual or per manufacturer recommendations',
      duration: '45-90 minutes per breaker'
    },
    {
      id: 'TIM-001',
      name: 'Circuit Breaker Timing Test',
      category: 'Mechanical',
      description: 'Measurement of circuit breaker opening and closing times, contact travel, and velocity to verify proper mechanical operation.',
      applicableStandards: [
        'IEEE C37.09 - Test Procedures for AC High-Voltage Circuit Breakers',
        'IEEE C37.10 - Guide for Investigation, Analysis, and Reporting of Power Circuit Breaker Failures',
        'IEC 62271-100 - Circuit-breakers specifications'
      ],
      parameters: [
        { name: 'Opening Time', limit: 'Per manufacturer (typically 3-5 cycles)', unit: 'ms' },
        { name: 'Closing Time', limit: 'Per manufacturer (typically 5-8 cycles)', unit: 'ms' },
        { name: 'Contact Travel', limit: 'Per manufacturer spec', unit: 'mm' },
        { name: 'Velocity', limit: 'Per manufacturer spec', unit: 'm/s' }
      ],
      equipment: [
        'Circuit Breaker Analyzer',
        'Motion transducers',
        'Test leads and adapters',
        'Control voltage source'
      ],
      safetyPrecautions: [
        'Isolate breaker from system',
        'Remove or bypass protective relays',
        'Ensure adequate clearances',
        'Keep hands clear of moving parts'
      ],
      sop: [
        {
          step: 1,
          title: 'Pre-Test Setup',
          description: 'Isolate breaker. Install motion transducers on each pole. Connect analyzer to breaker control circuit. Connect timing contacts to analyzer. Verify control power availability.'
        },
        {
          step: 2,
          title: 'Timing Tests',
          description: 'Perform close-open (CO) operation. Record closing time for each pole. Record opening time for each pole. Calculate pole span (difference between first and last pole). Repeat for multiple operations (typically 5 operations).'
        },
        {
          step: 3,
          title: 'Travel and Velocity',
          description: 'Measure contact travel distance. Measure maximum velocity during closing. Measure maximum velocity during opening. Record velocity curves for analysis.'
        },
        {
          step: 4,
          title: 'Analysis',
          description: 'Compare times with manufacturer specifications. Check for consistency between poles. Evaluate pole span (should be minimal). Assess velocity curves for abnormalities. Compare with baseline and trending data.'
        },
        {
          step: 5,
          title: 'Reporting',
          description: 'Document all timing values. Generate velocity and travel curves. Identify any deviations from specifications. Recommend adjustments or maintenance as needed.'
        }
      ],
      frequency: 'Triennial or after major faults',
      duration: '2-3 hours per breaker'
    }
  ],
  motors: [
    {
      id: 'VIB-001',
      name: 'Vibration Analysis',
      category: 'Mechanical',
      description: 'Measurement and analysis of motor vibration levels to detect bearing wear, misalignment, unbalance, and other mechanical issues.',
      applicableStandards: [
        'ISO 10816 - Mechanical vibration - Evaluation of machine vibration by measurements on non-rotating parts',
        'ISO 20816-1 - Measurement and evaluation of mechanical vibration of machines',
        'NEMA MG1 - Motors and Generators'
      ],
      parameters: [
        { name: 'Velocity RMS (Overall)', limit: '< 7.1 mm/s (Zone C)', unit: 'mm/s' },
        { name: 'Displacement', limit: 'Per motor rating', unit: 'μm' },
        { name: 'Acceleration', limit: 'Per frequency analysis', unit: 'g' }
      ],
      equipment: [
        'Vibration analyzer',
        'Accelerometers (triaxial)',
        'Magnetic mounts',
        'Data collector with FFT capability'
      ],
      safetyPrecautions: [
        'Be aware of rotating equipment',
        'Secure loose clothing and hair',
        'Use hearing protection if required',
        'Maintain safe distance from coupling guards'
      ],
      sop: [
        {
          step: 1,
          title: 'Preparation and Setup',
          description: 'Verify motor is at normal operating temperature and load. Identify measurement points: motor drive end bearing, motor non-drive end bearing, driven equipment bearings. Clean measurement points. Mark points for repeatability.'
        },
        {
          step: 2,
          title: 'Data Collection',
          description: 'Mount accelerometer at each measurement point. Collect data in horizontal, vertical, and axial directions. Record overall vibration levels (RMS velocity). Capture FFT spectrum for each point and direction. Record phase measurements if diagnosing specific issues.'
        },
        {
          step: 3,
          title: 'Frequency Analysis',
          description: 'Analyze spectrum for characteristic frequencies: 1X RPM (unbalance), 2X RPM (misalignment), bearing frequencies (bearing defects), subsynchronous (fluid instability), electrical frequencies (2X line frequency for electrical issues).'
        },
        {
          step: 4,
          title: 'Severity Assessment',
          description: 'Compare overall levels to ISO 10816 zones. Compare to baseline and trending data. Evaluate rate of change. Assess severity of specific frequency components. Determine fault progression stage.'
        },
        {
          step: 5,
          title: 'Diagnosis and Recommendations',
          description: 'Identify fault type and location. Estimate remaining useful life. Recommend corrective actions: balancing, alignment, bearing replacement, etc. Determine urgency: continue operation, increased monitoring, or immediate shutdown.'
        },
        {
          step: 6,
          title: 'Documentation',
          description: 'Save all waveforms and spectra. Update vibration database. Generate trend plots. Document findings and recommendations. Schedule follow-up measurements as appropriate.'
        }
      ],
      frequency: 'Monthly for critical motors, quarterly for others',
      duration: '30-60 minutes per motor'
    },
    {
      id: 'INS-002',
      name: 'Motor Insulation Resistance Test',
      category: 'Electrical',
      description: 'Measurement of winding insulation resistance to assess motor insulation system condition and detect moisture or insulation degradation.',
      applicableStandards: [
        'IEEE 43 - Recommended Practice for Testing Insulation Resistance of Rotating Machinery',
        'NEMA MG1 - Motors and Generators',
        'IEC 60034-1 - Rotating electrical machines'
      ],
      parameters: [
        { name: 'Minimum IR', limit: '(kV rating + 1) × 1 MΩ', unit: 'MΩ' },
        { name: 'Polarization Index', limit: '> 2.0 for Class B, > 3.0 for Class F', unit: 'ratio' }
      ],
      equipment: [
        'Insulation tester (500V to 5000V)',
        'Thermometer',
        'Cleaning materials',
        'Discharge equipment'
      ],
      safetyPrecautions: [
        'De-energize motor completely',
        'Discharge windings before and after test',
        'Lock out and tag out',
        'Keep personnel clear during test'
      ],
      sop: [
        {
          step: 1,
          title: 'Motor Preparation',
          description: 'Disconnect motor from power source. Remove ground connections. Separate motor leads from starter. Record motor nameplate voltage and insulation class. Measure and record winding temperature.'
        },
        {
          step: 2,
          title: 'Test Voltage Selection',
          description: 'Select test voltage based on motor voltage rating: 500V for motors rated < 1000V, 1000V for motors 1000-2500V, 2500V-5000V for higher voltage motors. Never exceed 2X rated voltage + 1000V.'
        },
        {
          step: 3,
          title: 'Insulation Resistance Test',
          description: 'Connect tester positive lead to motor windings. Connect negative lead to motor frame/ground. Apply test voltage. Read and record IR at 1 minute. Continue for 10 minutes. Read and record IR at 10 minutes. Test phase-to-phase if three-phase motor.'
        },
        {
          step: 4,
          title: 'Calculate Polarization Index',
          description: 'Calculate PI = 10-minute reading / 1-minute reading. PI > 2.0 indicates good insulation (Class B). PI > 3.0 indicates good insulation (Class F/H). PI < 1.0 indicates contaminated or deteriorated insulation.'
        },
        {
          step: 5,
          title: 'Temperature Correction',
          description: 'Correct readings to 40°C standard: For each 10°C above 40°C, halve the reading. For each 10°C below 40°C, double the reading. Use corrected values for comparison with historical data.'
        },
        {
          step: 6,
          title: 'Results Interpretation',
          description: 'Compare with IEEE 43 minimum values. Evaluate trend from previous tests. Investigate if IR < minimum or significantly decreased. Consider moisture content, contamination, or aging. Recommend cleaning, drying, or replacement as needed.'
        }
      ],
      frequency: 'Annual or before/after major maintenance',
      duration: '30-45 minutes per motor'
    }
  ],
  generators: [
    {
      id: 'LOAD-001',
      name: 'Generator Load Bank Test',
      category: 'Performance',
      description: 'Loading generator to rated capacity using resistive load bank to verify performance, temperature rise, and voltage regulation.',
      applicableStandards: [
        'IEEE 115 - Test Procedures for Synchronous Machines',
        'NFPA 110 - Standard for Emergency and Standby Power Systems',
        'ISO 8528 - Reciprocating internal combustion engine driven alternating current generating sets'
      ],
      parameters: [
        { name: 'Voltage Regulation', limit: '± 0.5% at rated load', unit: '%' },
        { name: 'Frequency', limit: '60 Hz ± 0.5 Hz', unit: 'Hz' },
        { name: 'Load Capability', limit: '100% nameplate rating', unit: '%' },
        { name: 'Temperature Rise', limit: 'Per insulation class', unit: '°C' }
      ],
      equipment: [
        'Load bank (rated capacity)',
        'Power quality analyzer',
        'Infrared thermometer',
        'Tachometer',
        'Sound level meter'
      ],
      safetyPrecautions: [
        'Verify proper ventilation',
        'Ensure load bank is properly grounded',
        'Monitor exhaust temperature',
        'Keep personnel clear of hot surfaces',
        'Have fire extinguisher available'
      ],
      sop: [
        {
          step: 1,
          title: 'Pre-Test Checks',
          description: 'Verify generator maintenance is current. Check coolant level, oil level, fuel level. Inspect belts, hoses, and connections. Verify battery condition. Test control panel functions. Set up load bank and connect to generator output.'
        },
        {
          step: 2,
          title: 'Preliminary Run',
          description: 'Start generator in manual mode. Allow 5-10 minute warm-up at no load. Record no-load voltage and frequency. Check for unusual noises or vibration. Verify all gauges reading normal.'
        },
        {
          step: 3,
          title: 'Load Test - 25% Load',
          description: 'Apply 25% of rated load. Allow stabilization (10-15 minutes). Record voltage, current, frequency, power factor. Measure temperature at key points. Record any deviations from normal.'
        },
        {
          step: 4,
          title: 'Load Test - 50% Load',
          description: 'Increase to 50% of rated load. Stabilize for 15-20 minutes. Record all electrical parameters. Monitor temperatures. Check voltage regulation. Verify frequency stability.'
        },
        {
          step: 5,
          title: 'Load Test - 75% and 100% Load',
          description: 'Increase to 75% load, stabilize, record data. Increase to 100% load. Run at full load minimum 1 hour (2 hours preferred). Record data every 15 minutes. Monitor for any abnormalities. Check temperature rise at bearings, windings (if accessible), exhaust.'
        },
        {
          step: 6,
          title: 'Performance Analysis',
          description: 'Calculate voltage regulation: (No-load V - Full-load V) / Full-load V. Verify frequency stability across load range. Assess temperature rise against limits. Evaluate power factor and efficiency. Compare fuel consumption with specifications.'
        },
        {
          step: 7,
          title: 'Cool Down and Documentation',
          description: 'Reduce load gradually. Run at no-load for 5 minutes cool down. Shutdown and secure generator. Document all test data. Compare with previous tests. Generate report with recommendations.'
        }
      ],
      frequency: 'Annual (minimum per NFPA 110)',
      duration: '3-4 hours including preparation'
    },
    {
      id: 'PROT-001',
      name: 'Protection Relay Testing',
      category: 'Protection',
      description: 'Verification of generator protection relay settings and operation to ensure proper response to fault conditions.',
      applicableStandards: [
        'IEEE C37.102 - Guide for AC Generator Protection',
        'IEC 61850 - Communication networks and systems for power utility automation',
        'ANSI/IEEE C37.2 - Electrical Power System Device Function Numbers'
      ],
      parameters: [
        { name: 'Overcurrent (51) Pickup', limit: 'Per coordination study', unit: 'A' },
        { name: 'Differential (87) Slope', limit: '15-40%', unit: '%' },
        { name: 'Under/Over Voltage (27/59)', limit: '90-110% rated', unit: '%' },
        { name: 'Under/Over Frequency (81)', limit: '58-62 Hz', unit: 'Hz' }
      ],
      equipment: [
        'Relay test set',
        'CT/PT ratio standard',
        'Timing test equipment',
        'Multimeter'
      ],
      safetyPrecautions: [
        'Generator must be isolated',
        'Never short-circuit CT secondaries',
        'Use proper lockout/tagout',
        'Verify test equipment calibration'
      ],
      sop: [
        {
          step: 1,
          title: 'Review and Preparation',
          description: 'Review protection coordination study. Obtain relay settings sheets. Verify generator is isolated and tagged out. Prepare relay test equipment. Document existing settings before testing.'
        },
        {
          step: 2,
          title: 'Overcurrent Protection (51)',
          description: 'Inject increasing current into relay. Verify pickup point. Test time delay at various multiples of pickup. Compare actual operation with time-current curve. Verify instantaneous element if present.'
        },
        {
          step: 3,
          title: 'Differential Protection (87G)',
          description: 'Test minimum operating current. Verify slope percentage. Test CT ratio compensation. Simulate internal fault. Simulate external fault with CT error. Verify blocking on CT circuit open.'
        },
        {
          step: 4,
          title: 'Voltage and Frequency Protection',
          description: 'Test undervoltage (27): verify pickup and time delay. Test overvoltage (59): verify pickup and time delay. Test underfrequency (81U): verify setpoint. Test overfrequency (81O): verify setpoint. Verify independent operation of each element.'
        },
        {
          step: 5,
          title: 'Loss of Field (40)',
          description: 'Inject test currents to simulate loss of excitation. Verify relay operates in loss-of-field region. Test time delay. Verify relay does not operate for stable power swing. Document impedance trajectory.'
        },
        {
          step: 6,
          title: 'Ground Fault Protection (51N/59N)',
          description: 'Test ground overcurrent element. Verify neutral overvoltage protection if present. Check coordination with other ground relays. Verify settings match protection study.'
        },
        {
          step: 7,
          title: 'Final Verification',
          description: 'Perform complete functional test. Verify all alarm and trip contacts. Test indication lights. Restore all settings. Update protection as-found/as-left sheets. Generate comprehensive test report.'
        }
      ],
      frequency: 'Triennial or per regulatory requirements',
      duration: '4-6 hours'
    }
  ],
  cables: [
    {
      id: 'HIPOT-001',
      name: 'High-Potential (Hi-Pot) Test',
      category: 'Electrical',
      description: 'Application of high voltage to cable insulation to verify dielectric strength and detect weaknesses before failure.',
      applicableStandards: [
        'IEEE 400.2 - Guide for Field Testing of Shielded Power Cable Systems Using Very Low Frequency (VLF)',
        'IEC 60502 - Power cables with extruded insulation',
        'ICEA T-27-581 - Recommended Test Procedures for Shielded Power Cable Systems'
      ],
      parameters: [
        { name: 'Test Voltage (AC)', limit: '2.0 × Uo for 15 minutes', unit: 'kV' },
        { name: 'Test Voltage (VLF)', limit: '2.5 × Uo for 30 minutes', unit: 'kV' },
        { name: 'Leakage Current', limit: 'Stable or decreasing', unit: 'mA' }
      ],
      equipment: [
        'VLF hipot tester or AC hipot',
        'High voltage probe',
        'Leakage current monitor',
        'Grounding equipment'
      ],
      safetyPrecautions: [
        'Cable must be isolated and de-energized',
        'Establish safety perimeter',
        'Post warning signs',
        'Discharge cable before and after test',
        'Never approach energized cable'
      ],
      sop: [
        {
          step: 1,
          title: 'Pre-Test Preparation',
          description: 'Verify cable is de-energized and isolated. Identify cable route and connections. Disconnect cable from equipment at both ends. Bond cable shields and grounds. Verify no personnel near cable route. Post warning signs and barriers.'
        },
        {
          step: 2,
          title: 'Cable Preparation',
          description: 'Clean cable terminations. Remove any surface contamination. Connect grounding leads to shields. Prepare phase under test for high voltage connection. Ground other phases solidly.'
        },
        {
          step: 3,
          title: 'Test Setup',
          description: 'Connect hipot tester to phase under test. Connect ground return to cable shield/ground. Set test voltage (2.0 × Uo for AC, 2.5 × Uo for VLF). Set test duration (15 min AC, 30 min VLF). Enable leakage current monitoring.'
        },
        {
          step: 4,
          title: 'Voltage Application',
          description: 'Verify area is clear. Apply test voltage gradually (typically 2-3 kV steps). Monitor leakage current continuously. Watch for signs of failure: rapid current increase, smoke, burning smell. Record current at intervals. Maintain test voltage for specified duration.'
        },
        {
          step: 5,
          title: 'Test Results Evaluation',
          description: 'Evaluate leakage current trend: stable or decreasing is passing, increasing indicates deterioration. Compare with baseline data if available. Check for any partial discharge activity. Document any anomalies or trip conditions.'
        },
        {
          step: 6,
          title: 'Post-Test Procedures',
          description: 'Reduce voltage to zero slowly. Discharge cable thoroughly (minimum 5 × test duration). Ground cable and verify complete discharge. Remove test equipment. Restore cable connections if test passed. Tag cable for further investigation if failed.'
        },
        {
          step: 7,
          title: 'Documentation',
          description: 'Record test voltage, duration, and leakage current. Document pass/fail status. Update cable test history. Generate test report with recommendations. Schedule retests or repairs as needed.'
        }
      ],
      frequency: 'Every 5 years or after suspected damage',
      duration: '1-2 hours per cable phase'
    },
    {
      id: 'TDR-001',
      name: 'Time Domain Reflectometry (TDR) / Cable Fault Location',
      category: 'Diagnostic',
      description: 'Use of TDR technology to locate cable faults, splices, and measure cable length accurately.',
      applicableStandards: [
        'IEEE 1234 - Guide for Fault-Locating Techniques on Shielded Power Cable Systems',
        'IEC 60840 - Tests for power cables with extruded insulation'
      ],
      parameters: [
        { name: 'Distance Accuracy', limit: '± 1% or ± 1 meter', unit: 'm' },
        { name: 'Fault Type', limit: 'Identifiable', unit: '-' }
      ],
      equipment: [
        'TDR tester',
        'Cable specifications (velocity factor)',
        'Cable route drawings',
        'Portable generator if needed'
      ],
      safetyPrecautions: [
        'De-energize cable before testing',
        'Verify no voltage present',
        'Be aware of stored charge in long cables',
        'Use proper PPE'
      ],
      sop: [
        {
          step: 1,
          title: 'Setup and Cable Data',
          description: 'De-energize and isolate cable. Gather cable specifications: insulation type, conductor size, installed length. Determine velocity factor (VF) from cable data: PE = 0.67-0.70, XLPE = 0.67-0.69, EPR = 0.70-0.75. Input VF into TDR tester.'
        },
        {
          step: 2,
          title: 'Baseline TDR Test',
          description: 'Connect TDR to cable phase. Select appropriate pulse width: short cables use narrow pulse, long cables use wider pulse. Capture baseline waveform. Identify cable end reflection. Verify measured length matches installed length (± 2%).'
        },
        {
          step: 3,
          title: 'Fault Detection',
          description: 'Analyze waveform for anomalies: step change (open circuit), inverted reflection (short circuit), multiple reflections (splice or joint), gradual change (moisture or degradation). Measure distance to fault from waveform. Record fault signature characteristics.'
        },
        {
          step: 4,
          title: 'Verification and Triangulation',
          description: 'Test from opposite end of cable. Calculate fault location from both ends. Compare readings: should correlate within 1-2%. Use cable route drawings to identify approximate fault location. Consider splice locations and known cable characteristics.'
        },
        {
          step: 5,
          title: 'Advanced Diagnostics',
          description: 'If fault is intermittent, perform multiple tests. Use impulse current method for high-resistance faults. Apply decay test for leakage faults. Document all waveforms for analysis.'
        },
        {
          step: 6,
          title: 'Documentation and Reporting',
          description: 'Record fault location(s) with distance from both ends. Document fault type and characteristics. Save all TDR waveforms. Mark fault location on cable route drawings. Provide coordinates for excavation team. Generate fault location report.'
        }
      ],
      frequency: 'As needed for fault location',
      duration: '30-60 minutes'
    }
  ],
  ups: [
    {
      id: 'BATT-001',
      name: 'Battery Capacity and Load Test',
      category: 'Electrical',
      description: 'Discharge test of UPS battery bank to verify capacity and ability to support load for required runtime.',
      applicableStandards: [
        'IEEE 450 - Recommended Practice for Maintenance, Testing, and Replacement of Vented Lead-Acid Batteries',
        'IEEE 1188 - Recommended Practice for Maintenance, Testing, and Replacement of Valve-Regulated Lead-Acid (VRLA) Batteries',
        'IEC 62040-3 - UPS performance and test requirements'
      ],
      parameters: [
        { name: 'Battery Capacity', limit: '> 80% rated capacity', unit: '%' },
        { name: 'End Voltage', limit: 'Per manufacturer spec', unit: 'V/cell' },
        { name: 'Runtime', limit: 'Meet design requirement', unit: 'minutes' }
      ],
      equipment: [
        'Battery load bank',
        'Battery analyzer',
        'Multimeter',
        'Infrared thermometer',
        'Hydrometer (for flooded batteries)'
      ],
      safetyPrecautions: [
        'Ensure adequate ventilation',
        'Use eye protection and acid-resistant gloves',
        'Have spill kit available',
        'No smoking or open flames',
        'Be aware of electrical shock hazards'
      ],
      sop: [
        {
          step: 1,
          title: 'Pre-Test Inspection',
          description: 'Perform visual inspection of batteries. Check for corrosion, leaks, cracks, bulging. Verify ventilation is adequate. Measure and record ambient temperature. For flooded batteries: check electrolyte level, measure specific gravity of pilot cells. Clean terminals if needed.'
        },
        {
          step: 2,
          title: 'Baseline Measurements',
          description: 'Measure float voltage of entire bank. Measure individual cell/unit voltages. Record any voltage variations. Measure battery temperature. Verify battery is fully charged. Check battery age and service history.'
        },
        {
          step: 3,
          title: 'Capacity Test Setup',
          description: 'Calculate required discharge current (typically C8 or C10 rate). Connect battery load bank to battery terminals. Set load bank for constant current discharge. Set end voltage per manufacturer (typically 1.75V/cell for LA). Prepare to record voltage, current, and time.'
        },
        {
          step: 4,
          title: 'Discharge Test',
          description: 'Disconnect charger or rectifier. Initiate discharge at calculated rate. Record bank voltage every 15 minutes. Record cell voltages every 30 minutes. Monitor battery temperature throughout. Continue until end voltage is reached. Record total discharge time.'
        },
        {
          step: 5,
          title: 'Capacity Calculation',
          description: 'Calculate actual capacity: Capacity (Ah) = Discharge current × Time (hours). Calculate capacity percentage: (Actual capacity / Rated capacity) × 100%. Compare actual runtime with design requirements. Identify any weak cells showing premature voltage drop.'
        },
        {
          step: 6,
          title: 'Recharge and Post-Test',
          description: 'Reconnect charger and begin recharge. Monitor charging current and voltage. Verify battery returns to float voltage. For flooded batteries: check electrolyte levels, add distilled water if needed. Allow battery to stabilize before returning to service.'
        },
        {
          step: 7,
          title: 'Analysis and Reporting',
          description: 'Evaluate test results: > 90% capacity = excellent, 80-90% = acceptable, < 80% = investigate or replace. Identify any weak cells for monitoring or replacement. Compare with previous test results. Update battery test records. Schedule next test based on results and battery age.'
        }
      ],
      frequency: 'Annual (minimum), more frequent for critical applications',
      duration: '4-8 hours depending on discharge rate'
    },
    {
      id: 'TRANS-001',
      name: 'UPS Transfer Time Test',
      category: 'Performance',
      description: 'Measurement of UPS transfer time between AC and battery mode to verify seamless power transfer capability.',
      applicableStandards: [
        'IEC 62040-3 - UPS performance and test requirements',
        'IEEE 1100 - Powering and Grounding Electronic Equipment'
      ],
      parameters: [
        { name: 'Transfer to Battery', limit: '< 4 ms (typical)', unit: 'ms' },
        { name: 'Transfer to AC', limit: '< 6 ms (typical)', unit: 'ms' },
        { name: 'Voltage Deviation', limit: '< 10%', unit: '%' }
      ],
      equipment: [
        'Power quality analyzer',
        'Oscilloscope with current probes',
        'UPS bypass switch'
      ],
      safetyPrecautions: [
        'Coordinate with facility management',
        'Notify all affected personnel',
        'Verify critical loads can tolerate brief interruption',
        'Have backup plan ready'
      ],
      sop: [
        {
          step: 1,
          title: 'Pre-Test Planning',
          description: 'Review critical loads on UPS. Notify all stakeholders of test schedule. Verify battery is fully charged. Check UPS for any alarms or issues. Set up monitoring equipment. Document current UPS configuration and load.'
        },
        {
          step: 2,
          title: 'Monitoring Setup',
          description: 'Connect power quality analyzer to UPS output. Set analyzer to capture transfer events. Configure trigger levels for voltage deviation. Set sampling rate for high-resolution capture (µs range). Monitor input voltage, output voltage, and frequency.'
        },
        {
          step: 3,
          title: 'Simulated Power Failure Test',
          description: 'Announce test initiation. Open input breaker to simulate power failure. Analyzer captures transfer event. UPS should transfer to battery within specification. Record transfer time, voltage dip, frequency change. Close input breaker after 30-60 seconds.'
        },
        {
          step: 4,
          title: 'Return to AC Test',
          description: 'Analyzer captures return transfer. Record transfer time and transients. Verify smooth return to AC mode. Check for voltage or frequency deviations. Verify load continues uninterrupted.'
        },
        {
          step: 5,
          title: 'Bypass Transfer Test',
          description: 'Transfer UPS to bypass mode. Measure transfer time. Check load continuity. Return UPS to normal mode. Measure transfer time. Verify all transfers within specifications.'
        },
        {
          step: 6,
          title: 'Results Analysis',
          description: 'Review captured waveforms. Calculate actual transfer times. Evaluate voltage and frequency deviations. Compare with UPS specifications. Assess impact on connected loads. Document any anomalies.'
        },
        {
          step: 7,
          title: 'Reporting',
          description: 'Generate test report with transfer times. Include waveform captures. Compare with previous test data. Recommend any necessary adjustments. Update UPS maintenance records. Schedule next test.'
        }
      ],
      frequency: 'Annual or after major maintenance',
      duration: '1-2 hours'
    }
  ]
};
