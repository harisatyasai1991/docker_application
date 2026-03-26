/**
 * Production Testing Module - Test Execution Page
 * Execute tests on production units with AI-powered OCR for meter readings
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { ProductionNav } from './ProductionNav';
import { CameraCapture } from '../../components/CameraCapture';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { 
  Gauge, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Save,
  ArrowRight,
  Package,
  Zap,
  Camera,
  Upload,
  Loader2,
  Sparkles,
  Image as ImageIcon,
  FolderOpen,
  RefreshCw,
  Wrench,
  Clock
} from 'lucide-react';
import { productionAPI } from '../../services/api';
import { toast } from 'sonner';
import { Checkbox } from '../../components/ui/checkbox';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '../../components/ui/dialog';

export function TestExecutionPage({ onLogout }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedUnitId = searchParams.get('unit_id');
  const fileInputRef = useRef(null);
  const serialScanRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [scanningSerial, setScanningSerial] = useState(false);
  const [units, setUnits] = useState([]);
  const [testSpecs, setTestSpecs] = useState([]);
  
  // Form state
  const [selectedUnitId, setSelectedUnitId] = useState(preselectedUnitId || '');
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedTestCode, setSelectedTestCode] = useState('');
  const [selectedSpec, setSelectedSpec] = useState(null);
  const [readings, setReadings] = useState([]);
  const [notes, setNotes] = useState('');
  
  // OCR state for meter reading
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  
  // Serial scan state
  const [serialScanPreview, setSerialScanPreview] = useState(null);
  const [serialScanResult, setSerialScanResult] = useState(null);
  
  // Camera dialog state
  const [serialCameraOpen, setSerialCameraOpen] = useState(false);
  const [meterCameraOpen, setMeterCameraOpen] = useState(false);
  
  // OCR filled fields tracking
  const [ocrFilledFields, setOcrFilledFields] = useState([]);

  // Equipment selection state
  const [availableEquipment, setAvailableEquipment] = useState([]);
  const [recommendedEquipment, setRecommendedEquipment] = useState([]);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState([]);
  const [equipmentValidation, setEquipmentValidation] = useState(null);
  const [isEquipmentDialogOpen, setIsEquipmentDialogOpen] = useState(false);
  const [equipmentValidationError, setEquipmentValidationError] = useState(null);

  // Fetch available units for testing
  const fetchUnits = async () => {
    try {
      const [pendingRes, testingRes] = await Promise.all([
        productionAPI.getUnits({ test_status: 'pending', limit: '200' }),
        productionAPI.getUnits({ test_status: 'testing', limit: '200' })
      ]);
      
      const pendingUnits = pendingRes.units || [];
      const testingUnits = testingRes.units || [];
      
      setUnits([...pendingUnits, ...testingUnits]);
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const fetchTestSpecs = async () => {
    try {
      const response = await productionAPI.getTestSpecs();
      setTestSpecs(response.test_specs || []);
    } catch (error) {
      console.error('Error fetching test specs:', error);
    }
  };

  // Fetch available equipment for testing
  const fetchEquipment = async () => {
    try {
      const response = await productionAPI.getEquipmentList({ status: 'active' });
      setAvailableEquipment(response.equipment || []);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    }
  };

  // Fetch recommended equipment based on operator/batch assignments
  const fetchRecommendedEquipment = async (batchId = null) => {
    try {
      const params = {};
      if (batchId) params.batch_id = batchId;
      const response = await productionAPI.getRecommendedEquipment(params);
      setRecommendedEquipment(response.recommended_equipment || []);
      
      // Auto-select recommended equipment
      if (response.recommended_equipment?.length > 0) {
        setSelectedEquipmentIds(response.recommended_equipment.map(eq => eq.equipment_id));
      }
    } catch (error) {
      console.error('Error fetching recommended equipment:', error);
    }
  };

  // Validate selected equipment before starting test
  const validateEquipment = async () => {
    if (selectedEquipmentIds.length === 0) {
      setEquipmentValidation(null);
      setEquipmentValidationError(null);
      return true;
    }

    try {
      const response = await productionAPI.validateEquipmentForTest(selectedEquipmentIds.join(','));
      setEquipmentValidation(response);
      
      if (!response.can_proceed) {
        const failedEquipment = response.validation_results.filter(v => !v.valid);
        setEquipmentValidationError(failedEquipment.map(v => v.reason).join('\n\n'));
        return false;
      }
      
      setEquipmentValidationError(null);
      return true;
    } catch (error) {
      console.error('Error validating equipment:', error);
      toast.error('Failed to validate equipment');
      return false;
    }
  };

  const handleEquipmentSelection = (equipmentId) => {
    setSelectedEquipmentIds(prev => {
      if (prev.includes(equipmentId)) {
        return prev.filter(id => id !== equipmentId);
      }
      return [...prev, equipmentId];
    });
    // Clear validation when selection changes
    setEquipmentValidation(null);
    setEquipmentValidationError(null);
  };

  useEffect(() => {
    fetchUnits();
    fetchTestSpecs();
    fetchEquipment();
    fetchRecommendedEquipment();
  }, []);

  // When unit is selected, fetch its details
  useEffect(() => {
    if (selectedUnitId) {
      const fetchUnitDetails = async () => {
        try {
          setLoading(true);
          const response = await productionAPI.getUnit(selectedUnitId);
          setSelectedUnit(response);
          setSelectedTestCode(''); // Reset test selection
          setSelectedSpec(null);
          setReadings([]);
          resetOCR();
        } catch (error) {
          console.error('Error fetching unit details:', error);
          toast.error('Failed to load unit details');
        } finally {
          setLoading(false);
        }
      };
      fetchUnitDetails();
    } else {
      setSelectedUnit(null);
      setSelectedTestCode('');
      setSelectedSpec(null);
      setReadings([]);
      resetOCR();
    }
  }, [selectedUnitId]);

  // When test is selected, load spec and initialize readings
  useEffect(() => {
    if (selectedTestCode && selectedUnit) {
      // Find the applicable test spec
      const spec = testSpecs.find(s => 
        s.test_code === selectedTestCode &&
        (s.applicable_products.includes('*') || s.applicable_products.includes(selectedUnit.product_id))
      );
      
      if (spec) {
        setSelectedSpec(spec);
        // Initialize readings array
        const initialReadings = spec.parameters.map(param => ({
          param_id: param.param_id,
          param_name: param.param_name,
          unit: param.unit,
          final_value: param.data_type === 'select' ? '' : null,
          data_type: param.data_type,
          options: param.options || [],
          tolerance: param.tolerance,
          ocr_filled: false
        }));
        setReadings(initialReadings);
        resetOCR();
      } else {
        setSelectedSpec(null);
        setReadings([]);
        toast.warning('No test specification found for this test');
      }
    }
  }, [selectedTestCode, selectedUnit, testSpecs]);

  const resetOCR = () => {
    setUploadedImage(null);
    setImagePreview(null);
    setOcrResult(null);
    setOcrFilledFields([]);
  };

  // Handle camera capture for serial number
  const handleSerialCameraCapture = async (imageDataUrl) => {
    setSerialScanPreview(imageDataUrl);
    
    try {
      setScanningSerial(true);
      
      // Convert to base64 (remove data URL prefix)
      const base64 = imageDataUrl.split(',')[1];
      
      // Call serial OCR API
      const result = await productionAPI.identifySerialNumber(base64);
      setSerialScanResult(result);
      
      if (result.success && result.match_found && result.matched_unit) {
        const matchedUnitId = result.matched_unit.unit_id;
        const matchedUnitStatus = result.matched_unit.test_status;
        
        // Check if the matched unit is in our available units list (pending/testing only)
        const isInDropdown = units.some(u => u.unit_id === matchedUnitId);
        
        if (isInDropdown) {
          // SUCCESS: Found, matched, and available for testing
          setSelectedUnitId(matchedUnitId);
          toast.success(`Unit found: ${matchedUnitId}`, {
            description: result.matched_unit.product_name
          });
        } else if (matchedUnitStatus === 'passed' || matchedUnitStatus === 'failed') {
          // Unit exists but already tested
          toast.warning(`Unit already tested`, {
            description: `"${matchedUnitId}" has status "${matchedUnitStatus}". View unit details to see completed tests.`,
            duration: 6000,
            action: {
              label: 'View Unit',
              onClick: () => navigate(`/production/units/${matchedUnitId}`)
            }
          });
          // Update result to show this state in preview
          setSerialScanResult({
            ...result,
            already_tested: true,
            test_status: matchedUnitStatus
          });
        } else {
          // Unit exists but not in dropdown for some other reason
          setSelectedUnitId(matchedUnitId);
          toast.success(`Unit found: ${matchedUnitId}`, {
            description: result.matched_unit.product_name
          });
        }
      } else if (result.success && result.primary_serial) {
        // PARTIAL: Serial detected but no match in database
        toast.error(`Serial number not in system`, {
          description: `"${result.primary_serial}" was detected but doesn't match any registered unit. Please select manually or register this unit first.`,
          duration: 6000
        });
      } else if (!result.success && result.error) {
        // FAILED: OCR couldn't read the image
        toast.error('Could not read serial number', {
          description: result.error || 'Please try again with a clearer image or select manually.',
          duration: 5000
        });
      } else {
        // FAILED: No serial detected
        toast.warning('No serial number detected', {
          description: 'Please ensure the label is clearly visible and try again, or select manually.',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Serial scan error:', error);
      toast.error('Failed to scan serial number', {
        description: 'An error occurred. Please try again or select manually.'
      });
    } finally {
      setScanningSerial(false);
    }
  };

  // Handle camera capture for meter reading - auto-trigger extraction
  const handleMeterCameraCapture = async (imageDataUrl) => {
    setImagePreview(imageDataUrl);
    setUploadedImage({ name: 'camera-capture.jpg', type: 'image/jpeg' });
    
    // Auto-trigger extraction after capture for faster workflow
    if (selectedSpec) {
      // Small delay to let state update and show image preview
      setTimeout(() => {
        handleExtractReadingsFromImage(imageDataUrl);
      }, 300);
    }
  };

  // Extract readings from a specific image (used by auto-extract)
  const handleExtractReadingsFromImage = async (imageDataUrl) => {
    if (!imageDataUrl || !selectedSpec) return;

    try {
      setExtracting(true);
      
      // Get base64 from imageDataUrl
      let base64;
      if (imageDataUrl.startsWith('data:')) {
        base64 = imageDataUrl.split(',')[1];
      } else {
        base64 = imageDataUrl;
      }

      // Call OCR API
      const result = await productionAPI.extractMeterReading(
        base64,
        selectedSpec.test_spec_id,
        `${selectedSpec.test_name} test for ${selectedUnit.product_name}`
      );

      setOcrResult(result);

      if (result.success && result.readings && result.readings.length > 0) {
        let filledCount = 0;
        let skippedCount = 0;  // Count fields that already had values
        let confirmedCount = 0;  // Count fields where OCR matched existing value
        const filledFields = [];
        const newReadings = [...readings];

        // Helper function to check if a field already has a value
        const hasExistingValue = (reading) => {
          return reading.final_value !== null && 
                 reading.final_value !== '' && 
                 reading.final_value !== undefined;
        };

        // Helper function to check if values are essentially the same
        const valuesMatch = (existing, newValue) => {
          const existingStr = String(existing).toLowerCase().trim();
          const newStr = String(newValue).toLowerCase().trim();
          return existingStr === newStr || 
                 parseFloat(existing) === parseFloat(newValue);
        };

        // First try matched parameters if available
        if (result.matched_parameters) {
          result.matched_parameters.forEach((matched) => {
            const readingIndex = newReadings.findIndex(
              r => r.param_id === matched.param_id
            );
            if (readingIndex !== -1 && matched.matched_reading !== null) {
              const currentReading = newReadings[readingIndex];
              
              // Check if field already has a value
              if (hasExistingValue(currentReading)) {
                // Check if OCR found the same value (confirmation)
                if (valuesMatch(currentReading.final_value, matched.matched_reading)) {
                  // Same value - mark as confirmed but don't change
                  confirmedCount++;
                } else {
                  // Different value - keep user's value, count as skipped
                  skippedCount++;
                }
                // Don't overwrite existing value in either case
                return;
              }
              
              // Field is empty - fill it
              newReadings[readingIndex].final_value = matched.matched_reading;
              newReadings[readingIndex].ocr_filled = true;
              newReadings[readingIndex].ocr_confidence = matched.ocr_confidence;
              filledFields.push({
                name: newReadings[readingIndex].param_name,
                value: matched.matched_reading,
                unit: newReadings[readingIndex].unit || ''
              });
              filledCount++;
            }
          });
        }

        // If no matched parameters, try direct matching
        if (filledCount === 0 && confirmedCount === 0 && result.readings) {
          result.readings.forEach((ocrReading) => {
            const ocrValue = ocrReading.value;
            const ocrUnit = (ocrReading.unit || '').toLowerCase().replace('ω', 'ohm');
            const ocrLabel = (ocrReading.label || '').toLowerCase();
            
            let readingIndex = -1;
            
            if (ocrUnit) {
              readingIndex = newReadings.findIndex(r => {
                const paramUnit = (r.unit || '').toLowerCase().replace('ω', 'ohm');
                return paramUnit && (paramUnit.includes(ocrUnit) || ocrUnit.includes(paramUnit));
              });
            }
            
            if (readingIndex === -1 && ocrLabel) {
              readingIndex = newReadings.findIndex(r => {
                const paramName = (r.param_name || '').toLowerCase();
                return paramName.includes(ocrLabel) || ocrLabel.includes(paramName);
              });
            }
            
            if (readingIndex === -1 && typeof ocrValue === 'string') {
              const normalizedValue = ocrValue.toLowerCase();
              if (['pass', 'fail', 'passed', 'failed', 'ok', 'ng', 'yes', 'no'].includes(normalizedValue)) {
                readingIndex = newReadings.findIndex(r => {
                  if (r.data_type === 'select' && r.options) {
                    return r.options.some(opt => 
                      opt.toLowerCase() === normalizedValue ||
                      opt.toLowerCase() === 'pass' || 
                      opt.toLowerCase() === 'fail'
                    );
                  }
                  return false;
                });
              }
            }
            
            if (readingIndex !== -1) {
              const currentReading = newReadings[readingIndex];
              
              // Check if field already has a value (ADDITIVE MODE)
              if (hasExistingValue(currentReading)) {
                let finalValue = ocrValue;
                if (currentReading.data_type === 'select' && currentReading.options) {
                  const normalizedOcrValue = String(ocrValue).toLowerCase();
                  const matchingOption = currentReading.options.find(opt => 
                    opt.toLowerCase() === normalizedOcrValue ||
                    (normalizedOcrValue === 'passed' && opt.toLowerCase() === 'pass') ||
                    (normalizedOcrValue === 'failed' && opt.toLowerCase() === 'fail')
                  );
                  if (matchingOption) {
                    finalValue = matchingOption;
                  }
                }
                
                // Check if OCR found the same value (confirmation)
                if (valuesMatch(currentReading.final_value, finalValue)) {
                  confirmedCount++;
                } else {
                  skippedCount++;
                }
                // Don't overwrite existing value
                return;
              }
              
              // Field is empty - fill it
              let finalValue = ocrValue;
              if (currentReading.data_type === 'select' && currentReading.options) {
                const normalizedOcrValue = String(ocrValue).toLowerCase();
                const matchingOption = currentReading.options.find(opt => 
                  opt.toLowerCase() === normalizedOcrValue ||
                  (normalizedOcrValue === 'passed' && opt.toLowerCase() === 'pass') ||
                  (normalizedOcrValue === 'failed' && opt.toLowerCase() === 'fail')
                );
                if (matchingOption) {
                  finalValue = matchingOption;
                }
              }
              
              newReadings[readingIndex].final_value = finalValue;
              newReadings[readingIndex].ocr_filled = true;
              newReadings[readingIndex].ocr_confidence = ocrReading.confidence;
              filledFields.push({
                name: newReadings[readingIndex].param_name,
                value: finalValue,
                unit: newReadings[readingIndex].unit || ''
              });
              filledCount++;
            }
          });
        }

        setReadings(newReadings);
        setOcrFilledFields(filledFields);

        // Build informative toast message
        if (filledCount > 0 || confirmedCount > 0) {
          let message = '';
          if (filledCount > 0) {
            message = `AI filled ${filledCount} field(s)`;
          }
          if (confirmedCount > 0) {
            message += message ? `, confirmed ${confirmedCount}` : `AI confirmed ${confirmedCount} existing value(s)`;
          }
          if (skippedCount > 0) {
            message += ` (${skippedCount} kept unchanged)`;
          }
          toast.success(message);
        } else if (skippedCount > 0) {
          toast.info(`All ${skippedCount} matched field(s) already have values. Use "Clear & Rescan" for a fresh start.`);
        } else {
          toast.info('AI found readings but could not match to form fields.');
        }
      } else {
        toast.warning(result.error || 'Could not extract readings from the image.');
      }
    } catch (error) {
      console.error('OCR error:', error);
      toast.error('Failed to extract readings.');
    } finally {
      setExtracting(false);
    }
  };

  // Handle serial number scan from file
  const handleSerialScan = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = async (e) => {
      // Use the same handler as camera capture
      await handleSerialCameraCapture(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const updateReading = (index, value, fromOCR = false) => {
    const newReadings = [...readings];
    if (newReadings[index].data_type === 'number') {
      newReadings[index].final_value = parseFloat(value) || null;
    } else {
      newReadings[index].final_value = value;
    }
    if (fromOCR) {
      newReadings[index].ocr_filled = true;
    }
    setReadings(newReadings);
  };

  const validateReadings = () => {
    // Check if all required readings have values
    for (const reading of readings) {
      if (reading.final_value === null || reading.final_value === '') {
        return false;
      }
    }
    return true;
  };

  const getToleranceStatus = (reading) => {
    if (reading.final_value === null || !reading.tolerance) return null;
    
    const value = reading.final_value;
    const tol = reading.tolerance;
    
    switch (tol.type) {
      case 'max':
        if (value > tol.value) return 'fail';
        if (tol.warning_threshold && value > tol.warning_threshold) return 'warning';
        return 'pass';
      case 'min':
        if (value < tol.value) return 'fail';
        return 'pass';
      case 'range':
        if (value < tol.min || value > tol.max) return 'fail';
        return 'pass';
      case 'exact':
        if (value !== tol.value) return 'fail';
        return 'pass';
      default:
        return null;
    }
  };

  const getToleranceLabel = (tolerance) => {
    if (!tolerance) return '-';
    switch (tolerance.type) {
      case 'max':
        return `< ${tolerance.value}`;
      case 'min':
        return `> ${tolerance.value}`;
      case 'range':
        return `${tolerance.min} - ${tolerance.max}`;
      case 'exact':
        return `= ${tolerance.value}`;
      default:
        return '-';
    }
  };

  // Handle file upload
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    setUploadedImage(file);
    
    // Create preview and auto-trigger extraction
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target.result;
      setImagePreview(imageDataUrl);
      
      // Auto-trigger extraction after file load for faster workflow
      if (selectedSpec) {
        setTimeout(() => {
          handleExtractReadingsFromImage(imageDataUrl);
        }, 300);
      }
    };
    reader.readAsDataURL(file);
  };

  // Extract readings using OCR (wrapper for manual trigger)
  const handleExtractReadings = async () => {
    if (!imagePreview || !selectedSpec) return;
    await handleExtractReadingsFromImage(imagePreview);
  };

  // Clear all readings and rescan - for fresh start
  const handleClearAndRescan = async () => {
    if (!imagePreview || !selectedSpec) return;
    
    // Reset all readings to empty values
    const clearedReadings = readings.map(r => ({
      ...r,
      final_value: r.data_type === 'number' ? null : '',
      ocr_filled: false,
      ocr_confidence: null
    }));
    setReadings(clearedReadings);
    setOcrFilledFields([]);
    setOcrResult(null);
    
    // Rescan with cleared fields
    toast.info('Cleared all fields. Re-analyzing...');
    
    // Small delay to ensure state is updated
    setTimeout(async () => {
      await handleExtractReadingsFromImage(imagePreview);
    }, 100);
  };

  const handleSubmit = async () => {
    if (!validateReadings()) {
      toast.error('Please fill in all readings');
      return;
    }

    // Validate equipment before submission
    if (selectedEquipmentIds.length > 0) {
      const equipmentValid = await validateEquipment();
      if (!equipmentValid) {
        toast.error('Equipment validation failed. Please check equipment calibration status.');
        return;
      }
    }

    try {
      setSubmitting(true);
      
      // Prepare image base64 for storage (remove data URL prefix if present)
      let imageBase64ForStorage = null;
      if (imagePreview) {
        imageBase64ForStorage = imagePreview.startsWith('data:') 
          ? imagePreview.split(',')[1] 
          : imagePreview;
      }
      
      const payload = {
        unit_id: selectedUnitId,
        test_spec_id: selectedSpec.test_spec_id,
        test_code: selectedTestCode,
        readings: readings.map(r => ({
          param_id: r.param_id,
          param_name: r.param_name,
          unit: r.unit,
          final_value: r.final_value,
          ocr_raw_value: String(r.final_value),
          ocr_confidence: r.ocr_filled ? (r.ocr_confidence || 0.9) : 1.0,
          was_manually_edited: !r.ocr_filled,
          entry_method: r.ocr_filled ? 'ai_ocr' : 'manual'  // Track entry method for AI analytics
        })),
        captured_image_base64: imageBase64ForStorage,  // Send actual image for storage
        notes: notes,
        equipment_used: selectedEquipmentIds  // Include equipment traceability
      };

      const response = await productionAPI.submitTestExecution(payload);
      
      if (response.overall_result === 'pass') {
        toast.success('Test passed!');
      } else {
        toast.warning('Test failed - one or more parameters out of tolerance');
      }

      // Refresh unit to get updated status
      const unitResponse = await productionAPI.getUnit(selectedUnitId);
      setSelectedUnit(unitResponse);
      
      // Reset form for next test
      setSelectedTestCode('');
      setSelectedSpec(null);
      setReadings([]);
      setNotes('');
      resetOCR();
      setSelectedEquipmentIds([]);
      setEquipmentValidation(null);
      
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error(error.detail || 'Failed to submit test');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader onLogout={onLogout} />
      <ProductionNav />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Gauge className="h-8 w-8 text-cyan-400" />
            Execute Test
          </h1>
          <p className="text-muted-foreground mt-1">Record test results for a production unit</p>
        </div>

        {/* Step 1: Select Unit */}
        <Card className="bg-card border-border mb-6">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Package className="h-5 w-5 text-cyan-400" />
              Step 1: Select Unit
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Scan serial number label or select manually from dropdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Serial Number Scanner - Camera and File options */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Camera Capture Button */}
                  <Button
                    variant="outline"
                    className={`h-auto py-4 px-4 border-2 border-dashed flex items-center justify-center gap-3 
                      ${serialScanPreview ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-border hover:border-cyan-500/50 hover:bg-cyan-500/5'}`}
                    onClick={() => setSerialCameraOpen(true)}
                    disabled={scanningSerial}
                    data-testid="serial-camera-btn"
                  >
                    {scanningSerial ? (
                      <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
                    ) : (
                      <Camera className="h-6 w-6 text-cyan-500" />
                    )}
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">Take Photo</p>
                      <p className="text-xs text-muted-foreground">Open camera</p>
                    </div>
                  </Button>
                  
                  {/* File Upload Button */}
                  <Button
                    variant="outline"
                    className="h-auto py-4 px-4 border-2 border-dashed flex items-center justify-center gap-3 border-border hover:border-cyan-500/50 hover:bg-cyan-500/5"
                    onClick={() => serialScanRef.current?.click()}
                    disabled={scanningSerial}
                    data-testid="serial-upload-btn"
                  >
                    <input
                      ref={serialScanRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSerialScan(e.target.files?.[0])}
                      className="hidden"
                      data-testid="serial-upload-input"
                    />
                    <FolderOpen className="h-6 w-6 text-muted-foreground" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">Browse Files</p>
                      <p className="text-xs text-muted-foreground">Select from device</p>
                    </div>
                  </Button>
                </div>
                
                {/* Scan Result Preview */}
                {serialScanPreview && (
                  <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg border border-border">
                    <img src={serialScanPreview} alt="Serial scan" className="h-16 rounded" />
                    <div className="flex-1">
                      {scanningSerial ? (
                        <div className="flex items-center gap-2 text-cyan-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Identifying serial number...</span>
                        </div>
                      ) : serialScanResult?.match_found && !serialScanResult?.already_tested ? (
                        <div className="flex items-center gap-2 text-green-500">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Found: {serialScanResult.matched_unit?.unit_id}</span>
                        </div>
                      ) : serialScanResult?.already_tested ? (
                        <div>
                          <div className="flex items-center gap-2 text-amber-500">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm font-medium">Already Tested: {serialScanResult.matched_unit?.unit_id}</span>
                          </div>
                          <p className="text-xs text-amber-400 mt-1">
                            Status: <span className="capitalize">{serialScanResult.test_status}</span>. 
                            <button 
                              onClick={() => navigate(`/production/units/${serialScanResult.matched_unit?.unit_id}`)}
                              className="underline ml-1 hover:text-amber-300"
                            >
                              View completed tests
                            </button>
                          </p>
                        </div>
                      ) : serialScanResult?.primary_serial ? (
                        <div>
                          <div className="flex items-center gap-2 text-red-500">
                            <XCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">Not Found: &quot;{serialScanResult.primary_serial}&quot;</span>
                          </div>
                          <p className="text-xs text-red-400 mt-1">This serial number is not registered. Please select manually or register the unit first.</p>
                        </div>
                      ) : serialScanResult?.success === false ? (
                        <div>
                          <div className="flex items-center gap-2 text-amber-500">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm">Could not read serial number</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Please try with a clearer image or select manually.</p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Processing image...</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSerialScanPreview(null);
                        setSerialScanResult(null);
                      }}
                      className="text-muted-foreground"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-muted-foreground text-sm">or select manually</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              
              {/* Manual Selection Dropdown */}
              <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
                <SelectTrigger className="bg-muted border-border text-foreground" data-testid="select-unit">
                  <SelectValue placeholder="Select a production unit..." />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border max-h-60">
                  {units.map(unit => (
                    <SelectItem key={unit.unit_id} value={unit.unit_id}>
                      <span className="font-mono">{unit.unit_id}</span>
                      <span className="text-muted-foreground ml-2">- {unit.product_name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedUnit && (
                <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Product</p>
                      <p className="text-foreground">{selectedUnit.product_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Category</p>
                      <p className="text-foreground">{selectedUnit.product_category}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <Badge variant="outline" className={
                        selectedUnit.test_status === 'passed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        selectedUnit.test_status === 'failed' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      }>
                        {selectedUnit.test_status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tests Completed</p>
                      <p className="text-foreground">
                        {selectedUnit.completed_tests?.length || 0} / {selectedUnit.required_tests?.length || 0}
                      </p>
                    </div>
                  </div>
                  
                  {/* Pending tests */}
                  {selectedUnit.pending_tests?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Pending Tests</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedUnit.pending_tests.map(test => (
                          <Badge 
                            key={test} 
                            variant="outline" 
                            className="bg-orange-500/10 text-orange-400 border-orange-500/30"
                          >
                            {test}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Select Test */}
        {selectedUnit && selectedUnit.pending_tests?.length > 0 && (
          <Card className="bg-card border-border mb-6">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Zap className="h-5 w-5 text-cyan-400" />
                Step 2: Select Test
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedTestCode} onValueChange={setSelectedTestCode}>
                <SelectTrigger className="bg-muted border-border text-foreground" data-testid="select-test">
                  <SelectValue placeholder="Select test to execute..." />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border">
                  {selectedUnit.pending_tests.map(testCode => {
                    const spec = testSpecs.find(s => s.test_code === testCode);
                    return (
                      <SelectItem key={testCode} value={testCode}>
                        <span className="font-medium">{testCode}</span>
                        {spec && <span className="text-muted-foreground ml-2">- {spec.test_name}</span>}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {selectedSpec && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border/50">
                  <h4 className="text-foreground font-medium mb-2">{selectedSpec.test_name}</h4>
                  {selectedSpec.instructions && (
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap">{selectedSpec.instructions}</p>
                  )}
                  {selectedSpec.safety_notes && (
                    <div className="mt-3 p-2 bg-red-500/10 rounded border border-red-500/30">
                      <p className="text-red-400 text-sm flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        {selectedSpec.safety_notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Upload Image for OCR (Optional) */}
        {selectedSpec && readings.length > 0 && (
          <Card className="bg-card border-border mb-6">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                Step 3: AI-Powered Reading (Optional)
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Capture or upload a photo of the meter display to automatically extract readings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Camera and File Upload Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Camera Capture Button */}
                  <Button
                    variant="outline"
                    className={`h-auto py-6 px-4 border-2 border-dashed flex flex-col items-center justify-center gap-2 
                      ${imagePreview ? 'border-amber-500/50 bg-amber-500/5' : 'border-border hover:border-amber-500/50 hover:bg-amber-500/5'}`}
                    onClick={() => setMeterCameraOpen(true)}
                    disabled={extracting}
                    data-testid="meter-camera-btn"
                  >
                    <Camera className="h-8 w-8 text-amber-500" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">Take Photo</p>
                      <p className="text-xs text-muted-foreground">Open device camera</p>
                    </div>
                  </Button>
                  
                  {/* File Upload Button */}
                  <Button
                    variant="outline"
                    className="h-auto py-6 px-4 border-2 border-dashed flex flex-col items-center justify-center gap-2 border-border hover:border-amber-500/50 hover:bg-amber-500/5"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={extracting}
                    data-testid="meter-upload-btn"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      data-testid="meter-upload-input"
                    />
                    <FolderOpen className="h-8 w-8 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">Browse Files</p>
                      <p className="text-xs text-muted-foreground">Select from device</p>
                    </div>
                  </Button>
                </div>
                
                <p className="text-xs text-center text-muted-foreground">
                  Supports: JPG, PNG, WEBP (max 10MB)
                </p>
                
                {/* Extracting indicator - shown during auto-extraction */}
                {extracting && !imagePreview && (
                  <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                    <span className="text-sm">Analyzing image with AI...</span>
                  </div>
                )}
                
                {/* Image Preview + OCR Results - Side by side layout */}
                {imagePreview && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left: Image Preview */}
                    <div className="relative p-4 bg-muted/50 rounded-lg border border-border">
                      <img 
                        src={imagePreview} 
                        alt="Meter reading" 
                        className="w-full h-auto max-h-64 object-contain rounded-lg shadow-lg"
                      />
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setMeterCameraOpen(true)}
                            className="text-xs"
                          >
                            <Camera className="h-3 w-3 mr-1" />
                            Retake
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setUploadedImage(null);
                              setImagePreview(null);
                              setOcrResult(null);
                              setOcrFilledFields([]);
                            }}
                            className="text-xs text-muted-foreground"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                        {ocrResult && !extracting && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExtractReadingsFromImage(imagePreview)}
                              className="text-xs text-muted-foreground hover:text-foreground"
                              title="Re-analyze (keeps existing values)"
                            >
                              <Sparkles className="h-3 w-3 mr-1" />
                              Re-analyze
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleClearAndRescan}
                              className="text-xs text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                              title="Clear all fields and rescan from scratch"
                              data-testid="clear-rescan-btn"
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Clear & Rescan
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {/* Extracting indicator overlay */}
                      {extracting && (
                        <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                            <span className="text-sm">Analyzing...</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Right: OCR Results */}
                    <div className={`p-4 rounded-lg text-sm border ${
                      ocrResult 
                        ? ocrResult.success 
                          ? 'bg-card border-border'
                          : 'bg-destructive/10 border-destructive/30'
                        : 'bg-muted/30 border-border border-dashed'
                    }`}>
                      {!ocrResult && !extracting && (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                          <p className="text-sm">Waiting for analysis...</p>
                        </div>
                      )}
                      
                      {extracting && (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                          <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-2" />
                            <p className="text-sm">Extracting readings...</p>
                          </div>
                        </div>
                      )}
                      
                      {ocrResult && !extracting && (
                        <>
                          {ocrResult.success ? (
                            <>
                              <p className="font-medium flex items-center gap-2 text-foreground">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                {ocrResult.readings?.length || 0} reading(s) detected
                              </p>
                              
                              {/* Show all detected readings */}
                              {ocrResult.readings && ocrResult.readings.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-border">
                                  <p className="text-xs text-muted-foreground mb-2 font-medium">
                                    Extracted Values:
                                  </p>
                                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                    {ocrResult.readings.map((reading, idx) => {
                                      const matchedField = ocrFilledFields.find(f => 
                                        f.value === reading.value || 
                                        String(f.value) === String(reading.value)
                                      );
                                      const isMatched = !!matchedField;
                                      
                                      return (
                                        <div 
                                          key={idx} 
                                          className={`flex items-center justify-between text-xs rounded px-2 py-1.5 border ${
                                            isMatched 
                                              ? 'bg-green-500/10 border-green-500/30' 
                                              : 'bg-amber-500/10 border-amber-500/30'
                                          }`}
                                        >
                                          <div className="flex items-center gap-1.5">
                                            {isMatched ? (
                                              <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                                            ) : (
                                              <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />
                                            )}
                                            <span className="text-foreground truncate">
                                              {reading.label || reading.description || `Reading ${idx + 1}`}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1 flex-shrink-0">
                                            <span className="font-mono font-semibold text-foreground">
                                              {reading.value}{reading.unit ? ` ${reading.unit}` : ''}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  
                                  {/* Summary */}
                                  <div className="mt-2 pt-2 border-t border-border flex items-center gap-3 text-xs">
                                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                                      <CheckCircle className="h-3 w-3" />
                                      {ocrFilledFields.length} filled
                                    </span>
                                    {ocrResult.readings.length - ocrFilledFields.length > 0 && (
                                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                                        <AlertTriangle className="h-3 w-3" />
                                        {ocrResult.readings.length - ocrFilledFields.length} manual
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {ocrResult.meter_type && (
                                <p className="text-xs mt-2 text-muted-foreground">
                                  Meter: {ocrResult.meter_type}
                                </p>
                              )}
                            </>
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              <p className="flex items-center gap-2 text-destructive">
                                <AlertTriangle className="h-4 w-4" />
                                {ocrResult.error || 'Could not extract readings'}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Enter/Verify Readings */}
        {selectedSpec && readings.length > 0 && (
          <Card className="bg-card border-border mb-6">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Gauge className="h-5 w-5 text-cyan-400" />
                Step {imagePreview ? '4' : '3'}: {ocrResult?.success ? 'Verify' : 'Enter'} Readings
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {ocrResult?.success 
                  ? 'Verify AI-extracted values and make corrections if needed'
                  : 'Enter test measurements for each parameter'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {readings.map((reading, index) => {
                  const toleranceStatus = getToleranceStatus(reading);
                  
                  return (
                    <div 
                      key={reading.param_id} 
                      className={`p-4 rounded-lg border ${
                        toleranceStatus === 'fail' ? 'bg-red-500/10 border-red-500/30' :
                        toleranceStatus === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
                        toleranceStatus === 'pass' ? 'bg-green-500/10 border-green-500/30' :
                        'bg-muted/50 border-border/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <Label className="text-foreground flex items-center gap-2">
                            {reading.param_name}
                            {reading.ocr_filled && (
                              <Badge variant="outline" className="text-xs bg-amber-500/20 text-amber-400 border-amber-500/30">
                                AI filled
                              </Badge>
                            )}
                          </Label>
                          <div className="flex items-center gap-2 mt-2">
                            {reading.data_type === 'select' ? (
                              <Select 
                                value={String(reading.final_value || '')} 
                                onValueChange={(val) => updateReading(index, val)}
                              >
                                <SelectTrigger className="w-full bg-card border-slate-600 text-foreground">
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent className="bg-muted border-border">
                                  {(reading.options || []).map(opt => (
                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                type={reading.data_type === 'number' ? 'number' : 'text'}
                                step={reading.data_type === 'number' ? 'any' : undefined}
                                value={reading.final_value ?? ''}
                                onChange={(e) => updateReading(index, e.target.value)}
                                className={`bg-card border-slate-600 text-foreground ${
                                  reading.ocr_filled ? 'ring-2 ring-amber-500/30' : ''
                                }`}
                                placeholder={`Enter ${reading.param_name.toLowerCase()}...`}
                                data-testid={`input-${reading.param_id}`}
                              />
                            )}
                            {reading.unit && (
                              <span className="text-muted-foreground text-sm w-16">{reading.unit}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Tolerance</p>
                          <p className="text-sm text-foreground/80">{getToleranceLabel(reading.tolerance)}</p>
                          {toleranceStatus && (
                            <div className="mt-1">
                              {toleranceStatus === 'pass' && <CheckCircle className="h-5 w-5 text-green-400 inline" />}
                              {toleranceStatus === 'fail' && <XCircle className="h-5 w-5 text-red-400 inline" />}
                              {toleranceStatus === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-400 inline" />}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Equipment Selection for Traceability */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <Label className="text-foreground flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-cyan-600" />
                        Test Equipment
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Select equipment used for this test (for traceability)
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEquipmentDialogOpen(true)}
                      data-testid="select-equipment-btn"
                    >
                      Select Equipment ({selectedEquipmentIds.length})
                    </Button>
                  </div>

                  {/* Show selected equipment */}
                  {selectedEquipmentIds.length > 0 && (
                    <div className="space-y-2">
                      {selectedEquipmentIds.map(eqId => {
                        const eq = availableEquipment.find(e => e.equipment_id === eqId);
                        const validation = equipmentValidation?.validation_results?.find(v => v.equipment_id === eqId);
                        
                        return (
                          <div 
                            key={eqId} 
                            className={`flex items-center justify-between p-2 rounded text-sm ${
                              validation?.valid === false 
                                ? 'bg-red-50 border border-red-300 dark:bg-red-950/30' 
                                : 'bg-muted'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Wrench className="w-4 h-4 text-muted-foreground" />
                              <span>{eq?.name || eqId}</span>
                              <span className="text-muted-foreground">({eq?.serial_number})</span>
                            </div>
                            {validation && (
                              validation.valid ? (
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Valid
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800 text-xs">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Invalid
                                </Badge>
                              )
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Validation error message */}
                  {equipmentValidationError && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-300 rounded-lg dark:bg-red-950/30">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-red-800 dark:text-red-200">Cannot Proceed with Test</p>
                          <p className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap mt-1">
                            {equipmentValidationError}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="pt-4">
                  <Label className="text-foreground">Notes (Optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any observations or notes..."
                    className="mt-2 bg-muted border-border text-foreground"
                    rows={2}
                    data-testid="test-notes"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        {selectedSpec && readings.length > 0 && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedTestCode('');
                setSelectedSpec(null);
                setReadings([]);
                setNotes('');
                resetOCR();
              }}
              className="border-border text-foreground/80"
              data-testid="cancel-test-btn"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !validateReadings()}
              className="bg-cyan-600 hover:bg-cyan-700"
              data-testid="submit-test-btn"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Submit Test Results
                </>
              )}
            </Button>
          </div>
        )}

        {/* All tests completed message */}
        {selectedUnit && selectedUnit.pending_tests?.length === 0 && (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-16 w-16 mx-auto text-green-400 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">All Tests Completed!</h3>
              <p className="text-muted-foreground mb-4">
                This unit has completed all required tests.
                {selectedUnit.test_status === 'passed' && !selectedUnit.certificate_id && (
                  ' You can now generate a certificate.'
                )}
              </p>
              {selectedUnit.test_status === 'passed' && !selectedUnit.certificate_id && (
                <Button
                  onClick={() => navigate(`/production/certificates/generate?unit_id=${selectedUnit.unit_id}`)}
                  className="bg-amber-600 hover:bg-amber-700"
                  data-testid="generate-cert-btn"
                >
                  Generate Certificate
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Camera Dialogs */}
      <CameraCapture
        open={serialCameraOpen}
        onOpenChange={setSerialCameraOpen}
        onCapture={handleSerialCameraCapture}
        title="Scan Serial Number"
        description="Position the serial number label in the camera view"
      />
      
      <CameraCapture
        open={meterCameraOpen}
        onOpenChange={setMeterCameraOpen}
        onCapture={handleMeterCameraCapture}
        title="Capture Meter Reading"
        description="Position the meter display in the camera view for clear reading"
      />

      {/* Equipment Selection Dialog */}
      <Dialog open={isEquipmentDialogOpen} onOpenChange={setIsEquipmentDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-cyan-600" />
              Select Test Equipment
            </DialogTitle>
            <DialogDescription>
              Choose equipment used for this test. Equipment with expired calibration cannot be used.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {/* Recommended Equipment Section */}
            {recommendedEquipment.length > 0 && (
              <div className="mb-4">
                <Label className="text-sm text-muted-foreground mb-2 block">Recommended for You</Label>
                <div className="space-y-2">
                  {recommendedEquipment.map(eq => (
                    <div 
                      key={eq.equipment_id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedEquipmentIds.includes(eq.equipment_id)
                          ? 'bg-cyan-50 border-cyan-300 dark:bg-cyan-950/30'
                          : 'hover:bg-muted'
                      } ${eq.calibration_status === 'expired' ? 'opacity-50' : ''}`}
                      onClick={() => eq.calibration_status !== 'expired' && handleEquipmentSelection(eq.equipment_id)}
                    >
                      <Checkbox
                        checked={selectedEquipmentIds.includes(eq.equipment_id)}
                        disabled={eq.calibration_status === 'expired'}
                        onCheckedChange={() => eq.calibration_status !== 'expired' && handleEquipmentSelection(eq.equipment_id)}
                      />
                      <Wrench className="w-5 h-5 text-cyan-600" />
                      <div className="flex-1">
                        <div className="font-medium">{eq.name}</div>
                        <div className="text-sm text-muted-foreground">
                          S/N: {eq.serial_number} | {eq.category}
                        </div>
                      </div>
                      {eq.calibration_status === 'expired' ? (
                        <Badge className="bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          Expired
                        </Badge>
                      ) : eq.calibration_status === 'expiring_soon' ? (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Expiring Soon
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Calibrated
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Available Equipment */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">All Available Equipment</Label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {availableEquipment
                  .filter(eq => !recommendedEquipment.find(r => r.equipment_id === eq.equipment_id))
                  .map(eq => (
                    <div 
                      key={eq.equipment_id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedEquipmentIds.includes(eq.equipment_id)
                          ? 'bg-cyan-50 border-cyan-300 dark:bg-cyan-950/30'
                          : 'hover:bg-muted'
                      } ${eq.calibration_status === 'expired' ? 'opacity-50' : ''}`}
                      onClick={() => eq.calibration_status !== 'expired' && handleEquipmentSelection(eq.equipment_id)}
                    >
                      <Checkbox
                        checked={selectedEquipmentIds.includes(eq.equipment_id)}
                        disabled={eq.calibration_status === 'expired'}
                        onCheckedChange={() => eq.calibration_status !== 'expired' && handleEquipmentSelection(eq.equipment_id)}
                      />
                      <Wrench className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="font-medium">{eq.name}</div>
                        <div className="text-sm text-muted-foreground">
                          S/N: {eq.serial_number} | {eq.category}
                        </div>
                      </div>
                      {eq.calibration_status === 'expired' ? (
                        <Badge className="bg-red-100 text-red-800 text-xs">Expired</Badge>
                      ) : eq.calibration_status === 'expiring_soon' ? (
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">Expiring</Badge>
                      ) : eq.calibration_status === 'valid' ? (
                        <Badge className="bg-green-100 text-green-800 text-xs">Valid</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800 text-xs">No Cal</Badge>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <p className="text-sm text-muted-foreground flex-1">
              {selectedEquipmentIds.length} equipment selected
            </p>
            <Button variant="outline" onClick={() => setIsEquipmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-cyan-600 hover:bg-cyan-700"
              onClick={() => {
                validateEquipment();
                setIsEquipmentDialogOpen(false);
              }}
            >
              Confirm Selection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TestExecutionPage;
