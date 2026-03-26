import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Camera,
  Upload,
  Scan,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Thermometer,
  Zap,
  ZapOff,
  Activity,
  X,
  XCircle,
  Plus,
  Image as ImageIcon,
  Eye,
  FolderOpen,
  Video,
} from 'lucide-react';
import { dailyLogAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

const DailyLogFormModal = ({ 
  open, 
  onClose, 
  assetId, 
  assetType, 
  assetName,
  companyId,
  nameplateData,
  currentStatus,
  onLogCreated 
}) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [template, setTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [photos, setPhotos] = useState([]);
  const [notes, setNotes] = useState('');
  const [operationalStatus, setOperationalStatus] = useState(currentStatus || 'Energized');
  const [statusChangeReason, setStatusChangeReason] = useState('');
  const [ocrLoading, setOcrLoading] = useState({});
  const [previewPhoto, setPreviewPhoto] = useState(null);
  
  // Camera capture state
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [captureTargetParam, setCaptureTargetParam] = useState(null); // null for general photos
  
  const fileInputRef = useRef(null);
  const paramPhotoRefs = useRef({});
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (open && assetType && companyId) {
      loadTemplate();
      setOperationalStatus(currentStatus || 'Energized');
    }
  }, [open, assetType, companyId, currentStatus]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const response = await dailyLogAPI.getTemplate(assetType, companyId);
      setTemplate(response);
      
      // Initialize form data with default values
      const initialData = {};
      (response.parameters || []).forEach(param => {
        if (param.param_type === 'checkbox') {
          initialData[param.param_id] = false;
        } else if (param.param_type === 'status') {
          initialData[param.param_id] = currentStatus || 'Energized';
        } else {
          initialData[param.param_id] = '';
        }
        
        // Handle OLTC tap positions from nameplate
        if (param.derive_from_nameplate === 'tap_changer' && nameplateData) {
          param.derived_options = deriveOltcOptions(nameplateData);
        }
      });
      setFormData(initialData);
    } catch (error) {
      console.error('Failed to load template:', error);
      toast.error('Failed to load log template');
    } finally {
      setLoading(false);
    }
  };

  const deriveOltcOptions = (nameplate) => {
    const tapChanger = nameplate?.tap_changer || '';
    const tapPositions = nameplate?.tap_positions || '';
    
    // Try to parse ±X% format (e.g., "OLTC ±10%" means positions -10 to +10)
    const rangeMatch = tapChanger.match(/±(\d+)/);
    if (rangeMatch) {
      const range = parseInt(rangeMatch[1]);
      return Array.from({ length: range * 2 + 1 }, (_, i) => String(i - range));
    }
    
    // Try to parse tap_positions as number
    if (tapPositions) {
      const count = parseInt(tapPositions);
      if (!isNaN(count)) {
        return Array.from({ length: count }, (_, i) => String(i + 1));
      }
    }
    
    // Default fallback
    return Array.from({ length: 33 }, (_, i) => String(i + 1));
  };

  const handleInputChange = (paramId, value) => {
    setFormData(prev => ({ ...prev, [paramId]: value }));
  };

  // Open camera capture modal
  const openCameraCapture = (paramId = null) => {
    setCaptureTargetParam(paramId);
    setShowCameraModal(true);
  };

  // Effect to connect stream to video element when stream changes
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(err => {
        console.error('Error playing video:', err);
      });
    }
  }, [cameraStream]);

  // Start camera stream
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      setCameraStream(stream);
    } catch (err) {
      console.error('Camera access error:', err);
      toast.error('Could not access camera. Please check permissions or use file upload.');
    }
  };

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [cameraStream]);

  // Cleanup camera on unmount or modal close
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Capture photo from camera
  const captureFromCamera = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    const base64 = canvas.toDataURL('image/jpeg', 0.8);
    
    // Save the captured image
    if (captureTargetParam) {
      setFormData(prev => ({
        ...prev,
        [`${captureTargetParam}_photo`]: base64
      }));
    } else {
      setPhotos(prev => [...prev, {
        base64,
        description: '',
        captured_at: new Date().toISOString()
      }]);
    }
    
    // Close camera modal
    stopCamera();
    setShowCameraModal(false);
    setCaptureTargetParam(null);
    toast.success('Photo captured!');
  };

  // Handle file upload (alternative to camera)
  const handleFileUpload = (paramId = null) => {
    const input = paramId ? paramPhotoRefs.current[paramId] : fileInputRef.current;
    if (input) {
      input.click();
    }
    // Close camera modal if open
    if (showCameraModal) {
      stopCamera();
      setShowCameraModal(false);
    }
  };

  // Close camera modal
  const closeCameraModal = () => {
    stopCamera();
    setShowCameraModal(false);
    setCaptureTargetParam(null);
  };

  // Legacy function for backward compatibility
  const handlePhotoCapture = async (paramId = null) => {
    openCameraCapture(paramId);
  };

  const handleFileChange = async (event, paramId = null) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      
      if (paramId) {
        // This is a parameter-specific photo (for OCR)
        setFormData(prev => ({
          ...prev,
          [`${paramId}_photo`]: base64
        }));
      } else {
        // General photo
        setPhotos(prev => [...prev, {
          base64,
          description: '',
          captured_at: new Date().toISOString()
        }]);
      }
    };
    reader.readAsDataURL(file);
    
    // Reset the input
    event.target.value = '';
    
    // Close camera modal if open
    if (showCameraModal) {
      setShowCameraModal(false);
      setCaptureTargetParam(null);
    }
  };

  const handleOCR = async (paramId, imageBase64) => {
    try {
      setOcrLoading(prev => ({ ...prev, [paramId]: true }));
      
      // Get param config
      const param = template?.parameters?.find(p => p.param_id === paramId);
      
      const result = await dailyLogAPI.processOCR({
        image_base64: imageBase64,
        expected_parameters: param ? [{
          param_name: param.param_name,
          unit: param.unit,
          param_type: param.param_type
        }] : [],
        context: `Daily inspection for ${assetType} - ${param?.param_name || 'reading'}`
      });

      if (result.success && result.readings?.length > 0) {
        // Use the first reading
        const reading = result.readings[0];
        setFormData(prev => ({
          ...prev,
          [paramId]: reading.value,
          [`${paramId}_ocr_confidence`]: reading.confidence,
          [`${paramId}_ocr_raw`]: reading.raw_text
        }));
        toast.success(`OCR extracted: ${reading.value} ${reading.unit || ''}`);
      } else {
        toast.error(result.error || 'Could not extract reading from image');
      }
    } catch (error) {
      console.error('OCR failed:', error);
      toast.error('OCR processing failed');
    } finally {
      setOcrLoading(prev => ({ ...prev, [paramId]: false }));
    }
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      // Validate required fields
      const missingRequired = (template?.parameters || [])
        .filter(p => p.required)
        .filter(p => {
          const value = formData[p.param_id];
          if (p.param_type === 'checkbox') return false; // Checkboxes can be false
          return value === '' || value === null || value === undefined;
        });

      if (missingRequired.length > 0) {
        toast.error(`Please fill required fields: ${missingRequired.map(p => p.param_name).join(', ')}`);
        setSubmitting(false);
        return;
      }

      // Build readings array
      const readings = (template?.parameters || []).map(param => {
        const reading = {
          param_id: param.param_id,
          param_name: param.param_name,
          param_type: param.param_type,
          value: formData[param.param_id],
          unit: param.unit,
          captured_via_ocr: !!formData[`${param.param_id}_ocr_confidence`],
          ocr_confidence: formData[`${param.param_id}_ocr_confidence`],
          ocr_raw_text: formData[`${param.param_id}_ocr_raw`],
          // Include thresholds for status calculation
          warning_min: param.warning_min,
          warning_max: param.warning_max,
          critical_min: param.critical_min,
          critical_max: param.critical_max,
        };

        // Handle parameter photos
        if (formData[`${param.param_id}_photo`]) {
          reading.photo_base64 = formData[`${param.param_id}_photo`];
        }

        return reading;
      });

      // Prepare entry data
      const entryData = {
        asset_id: assetId,
        template_id: template?.template_id,
        log_date: format(new Date(), 'yyyy-MM-dd'),
        log_time: format(new Date(), 'HH:mm'),
        readings,
        operational_status: operationalStatus,
        status_change_reason: operationalStatus !== currentStatus ? statusChangeReason : undefined,
        photos,
        notes: notes || undefined,
        logged_by_user_id: currentUser?.user_id,
        logged_by_name: currentUser?.full_name || currentUser?.username,
      };

      const result = await dailyLogAPI.createEntry(entryData);
      
      toast.success('Daily log saved successfully!');
      
      if (result.status_changed) {
        toast.info(`Asset status changed to ${operationalStatus}`);
      }
      
      if (result.downtime_created) {
        toast.info('Downtime record created automatically');
      }

      onLogCreated?.(result.log_entry);
      onClose();
      
    } catch (error) {
      console.error('Failed to save log:', error);
      toast.error(error.message || 'Failed to save daily log');
    } finally {
      setSubmitting(false);
    }
  };

  const renderParameterInput = (param) => {
    const value = formData[param.param_id];
    const hasPhoto = formData[`${param.param_id}_photo`];
    const isOcrLoading = ocrLoading[param.param_id];

    switch (param.param_type) {
      case 'status':
        const statusOptions = template?.status_options || ['Energized', 'De-energized', 'Under Maintenance', 'Standby'];
        return (
          <div className="space-y-3">
            {/* Status Buttons */}
            <div className="flex flex-wrap gap-2" data-testid={`param-${param.param_id}`}>
              {statusOptions.map(opt => {
                const isSelected = operationalStatus === opt;
                const getStatusStyle = () => {
                  if (!isSelected) return 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300';
                  switch (opt) {
                    case 'Energized':
                      return 'bg-green-500 hover:bg-green-600 text-white border-green-500';
                    case 'De-energized':
                      return 'bg-red-500 hover:bg-red-600 text-white border-red-500';
                    case 'Under Maintenance':
                      return 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500';
                    case 'Standby':
                      return 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500';
                    default:
                      return 'bg-primary hover:bg-primary/90 text-white border-primary';
                  }
                };
                
                const getIcon = () => {
                  switch (opt) {
                    case 'Energized':
                      return <Zap className="w-4 h-4" />;
                    case 'De-energized':
                      return <ZapOff className="w-4 h-4" />;
                    case 'Under Maintenance':
                      return <Activity className="w-4 h-4" />;
                    case 'Standby':
                      return <Activity className="w-4 h-4" />;
                    default:
                      return null;
                  }
                };
                
                return (
                  <Button
                    key={opt}
                    type="button"
                    variant="outline"
                    className={`flex items-center gap-2 px-4 py-2 border-2 transition-all ${getStatusStyle()}`}
                    onClick={() => {
                      setOperationalStatus(opt);
                      handleInputChange(param.param_id, opt);
                    }}
                  >
                    {getIcon()}
                    {opt}
                  </Button>
                );
              })}
            </div>
            
            {/* Status Change Reason */}
            {operationalStatus !== currentStatus && (
              <div className="space-y-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <Label className="text-sm text-amber-700 font-medium">
                  Reason for status change *
                </Label>
                <Input
                  placeholder="Enter reason for changing status..."
                  value={statusChangeReason}
                  onChange={(e) => setStatusChangeReason(e.target.value)}
                  className="bg-white"
                />
              </div>
            )}
          </div>
        );

      case 'numeric':
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="number"
                value={value}
                onChange={(e) => handleInputChange(param.param_id, e.target.value ? parseFloat(e.target.value) : '')}
                placeholder={`Enter ${param.param_name.toLowerCase()}`}
                className="flex-1"
                data-testid={`param-${param.param_id}`}
              />
              {param.unit && (
                <span className="flex items-center px-3 bg-muted rounded-md text-sm">
                  {param.unit}
                </span>
              )}
            </div>
            
            {/* OCR Section */}
            {param.ocr_enabled && (
              <div className="flex gap-2 items-center">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  ref={el => paramPhotoRefs.current[param.param_id] = el}
                  onChange={(e) => handleFileChange(e, param.param_id)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePhotoCapture(param.param_id)}
                  disabled={isOcrLoading}
                >
                  <Camera className="w-4 h-4 mr-1" />
                  {hasPhoto ? 'Retake' : 'Capture'}
                </Button>
                
                {hasPhoto && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOCR(param.param_id, formData[`${param.param_id}_photo`])}
                      disabled={isOcrLoading}
                    >
                      {isOcrLoading ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Scan className="w-4 h-4 mr-1" />
                      )}
                      Read OCR
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewPhoto(formData[`${param.param_id}_photo`])}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </>
                )}
                
                {formData[`${param.param_id}_ocr_confidence`] && (
                  <Badge 
                    variant={formData[`${param.param_id}_ocr_confidence`] === 'high' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    OCR: {formData[`${param.param_id}_ocr_confidence`]}
                  </Badge>
                )}
              </div>
            )}
            
            {/* Threshold indicators */}
            {(param.warning_max || param.critical_max) && value && (
              <div className="text-xs flex gap-2 items-center">
                {value > param.critical_max && (
                  <span className="text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Critical High
                  </span>
                )}
                {value > param.warning_max && value <= param.critical_max && (
                  <span className="text-orange-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Warning High
                  </span>
                )}
                {value <= param.warning_max && (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Normal
                  </span>
                )}
              </div>
            )}
          </div>
        );

      case 'select':
        const options = param.derived_options || param.options || [];
        return (
          <Select
            value={String(value)}
            onValueChange={(val) => handleInputChange(param.param_id, val)}
          >
            <SelectTrigger data-testid={`param-${param.param_id}`}>
              <SelectValue placeholder={`Select ${param.param_name.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map(opt => (
                <SelectItem key={opt} value={String(opt)}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={value}
              onCheckedChange={(checked) => handleInputChange(param.param_id, checked)}
              data-testid={`param-${param.param_id}`}
            />
            <span className="text-sm text-muted-foreground">
              Check if {param.param_name.toLowerCase()}
            </span>
          </div>
        );

      case 'text':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleInputChange(param.param_id, e.target.value)}
            placeholder={`Enter ${param.param_name.toLowerCase()}`}
            rows={3}
            data-testid={`param-${param.param_id}`}
          />
        );

      case 'photo':
        return (
          <div className="space-y-2">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              ref={el => paramPhotoRefs.current[param.param_id] = el}
              onChange={(e) => handleFileChange(e, param.param_id)}
            />
            
            {hasPhoto ? (
              <div className="relative inline-block">
                <img 
                  src={formData[`${param.param_id}_photo`]}
                  alt="Captured"
                  className="w-32 h-32 object-cover rounded-md border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 w-6 h-6"
                  onClick={() => setFormData(prev => {
                    const newData = { ...prev };
                    delete newData[`${param.param_id}_photo`];
                    return newData;
                  })}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => handlePhotoCapture(param.param_id)}
                className="w-full h-24 border-dashed"
              >
                <div className="flex flex-col items-center gap-2">
                  <Camera className="w-6 h-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Capture Photo
                  </span>
                </div>
              </Button>
            )}
            
            {/* OCR for photo params */}
            {param.ocr_enabled && hasPhoto && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOCR(param.param_id, formData[`${param.param_id}_photo`])}
                disabled={isOcrLoading}
              >
                {isOcrLoading ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Scan className="w-4 h-4 mr-1" />
                )}
                Extract Reading via OCR
              </Button>
            )}
          </div>
        );

      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleInputChange(param.param_id, e.target.value)}
            placeholder={`Enter ${param.param_name.toLowerCase()}`}
            data-testid={`param-${param.param_id}`}
          />
        );
    }
  };

  // Compact version for tile/grid layout
  const renderCompactParameterInput = (param) => {
    const value = formData[param.param_id];
    const hasPhoto = formData[`${param.param_id}_photo`];
    const isOcrLoading = ocrLoading[param.param_id];

    switch (param.param_type) {
      case 'numeric':
        return (
          <div className="space-y-1">
            <div className="flex gap-1">
              <Input
                type="number"
                value={value}
                onChange={(e) => handleInputChange(param.param_id, e.target.value ? parseFloat(e.target.value) : '')}
                placeholder="0"
                className="h-9 text-center font-semibold"
                data-testid={`param-${param.param_id}`}
              />
              {param.unit && (
                <span className="flex items-center px-2 bg-muted rounded text-xs font-medium min-w-[32px] justify-center">
                  {param.unit}
                </span>
              )}
            </div>
            {param.ocr_enabled && (
              <div className="flex gap-1">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  ref={el => paramPhotoRefs.current[param.param_id] = el}
                  onChange={(e) => handleFileChange(e, param.param_id)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs flex-1"
                  onClick={() => handlePhotoCapture(param.param_id)}
                >
                  <Camera className="w-3 h-3 mr-1" />
                  {hasPhoto ? 'Retake' : 'Capture'}
                </Button>
                {hasPhoto && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => handleOCR(param.param_id, formData[`${param.param_id}_photo`])}
                    disabled={isOcrLoading}
                  >
                    {isOcrLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Scan className="w-3 h-3" />
                    )}
                  </Button>
                )}
              </div>
            )}
            {/* Threshold indicator */}
            {value && (param.warning_max || param.critical_max) && (
              <div className="text-[10px] text-center">
                {value > param.critical_max && (
                  <span className="text-red-600 font-medium">⚠ Critical</span>
                )}
                {value > param.warning_max && value <= param.critical_max && (
                  <span className="text-orange-600 font-medium">⚠ Warning</span>
                )}
                {value <= param.warning_max && (
                  <span className="text-green-600">✓ Normal</span>
                )}
              </div>
            )}
          </div>
        );

      case 'select':
        const options = param.derived_options || param.options || [];
        return (
          <Select
            value={String(value)}
            onValueChange={(val) => handleInputChange(param.param_id, val)}
          >
            <SelectTrigger className="h-9" data-testid={`param-${param.param_id}`}>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {options.map(opt => (
                <SelectItem key={opt} value={String(opt)}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <div 
            className={`flex items-center justify-center p-2 rounded-md cursor-pointer transition-colors ${
              value ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-50 text-gray-500'
            }`}
            onClick={() => handleInputChange(param.param_id, !value)}
            data-testid={`param-${param.param_id}`}
          >
            {value ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span className="ml-2 text-xs font-medium">
              {value ? 'Yes' : 'No'}
            </span>
          </div>
        );

      case 'text':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleInputChange(param.param_id, e.target.value)}
            placeholder="Enter..."
            rows={2}
            className="text-sm resize-none"
            data-testid={`param-${param.param_id}`}
          />
        );

      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleInputChange(param.param_id, e.target.value)}
            placeholder="Enter..."
            className="h-9"
            data-testid={`param-${param.param_id}`}
          />
        );
    }
  };

  // Group parameters by category
  const paramsByCategory = (template?.parameters || []).reduce((acc, param) => {
    const cat = param.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(param);
    return acc;
  }, {});

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-primary" />
              Daily Log - {assetName || assetType}
            </DialogTitle>
            <DialogDescription>
              Record daily readings and observations for this asset
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(90vh - 200px)' }}>
              <div className="space-y-4 pb-4">
                {/* Status Section - Full Width */}
                {paramsByCategory['Status'] && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Status
                    </h4>
                    {paramsByCategory['Status'].map(param => (
                      <div key={param.param_id}>
                        {renderParameterInput(param)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Main Parameters Grid - 2/3 columns */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(paramsByCategory)
                    .filter(([cat]) => cat !== 'Status' && cat !== 'Documentation')
                    .sort(([a], [b]) => {
                      const categoryOrder = ['Temperature', 'OLTC', 'Oil', 'Gas', 'Electrical', 'Mechanical', 'Environment', 'Inspection', 'General'];
                      const aIndex = categoryOrder.indexOf(a);
                      const bIndex = categoryOrder.indexOf(b);
                      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                      if (aIndex !== -1) return -1;
                      if (bIndex !== -1) return 1;
                      return a.localeCompare(b);
                    })
                    .flatMap(([category, params]) => 
                      params
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map(param => ({ ...param, category }))
                    )
                    .map(param => (
                      <div 
                        key={param.param_id} 
                        className={`
                          p-3 rounded-lg border bg-card hover:border-primary/50 transition-colors
                          ${param.param_type === 'checkbox' ? '' : ''}
                        `}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs font-medium text-muted-foreground truncate flex-1">
                            {param.param_name}
                            {param.required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          {param.ocr_enabled && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 ml-1">
                              OCR
                            </Badge>
                          )}
                        </div>
                        {renderCompactParameterInput(param)}
                      </div>
                    ))}
                </div>

                {/* Documentation Section - Full Width */}
                {paramsByCategory['Documentation'] && (
                  <div className="space-y-3 pt-2">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Documentation
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {paramsByCategory['Documentation']
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map(param => (
                          <div key={param.param_id} className="space-y-2">
                            <Label className="flex items-center gap-2 text-sm">
                              {param.param_name}
                              {param.ocr_enabled && (
                                <Badge variant="outline" className="text-xs">OCR</Badge>
                              )}
                            </Label>
                            {renderParameterInput(param)}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Additional Photos - Compact */}
                <div className="space-y-2 pt-2">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Additional Photos
                  </h4>
                  
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => handleFileChange(e)}
                  />
                  
                  <div className="flex flex-wrap gap-2">
                    {photos.map((photo, idx) => (
                      <div key={idx} className="relative">
                        <img 
                          src={photo.base64}
                          alt={`Photo ${idx + 1}`}
                          className="w-16 h-16 object-cover rounded-md border cursor-pointer"
                          onClick={() => setPreviewPhoto(photo.base64)}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 w-5 h-5"
                          onClick={() => removePhoto(idx)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="w-16 h-16 border-dashed"
                      onClick={() => handlePhotoCapture()}
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Notes - Compact */}
                <div className="space-y-2">
                  <Label className="text-sm">Additional Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter any observations..."
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="px-6 py-4 border-t gap-2">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || submitting}
              data-testid="submit-daily-log"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Save Log
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Preview Modal */}
      <Dialog open={!!previewPhoto} onOpenChange={() => setPreviewPhoto(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Photo Preview</DialogTitle>
          </DialogHeader>
          {previewPhoto && (
            <img 
              src={previewPhoto}
              alt="Preview"
              className="w-full h-auto max-h-[70vh] object-contain rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Camera Capture Modal */}
      <Dialog open={showCameraModal} onOpenChange={closeCameraModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Capture Photo
            </DialogTitle>
            <DialogDescription>
              Use camera to take a photo or upload from your device
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Camera Preview */}
            {cameraStream ? (
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: 'auto', minHeight: '300px', objectFit: 'cover' }}
                  className="rounded-lg"
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                {/* Capture overlay hint */}
                <div className="absolute bottom-2 left-0 right-0 text-center">
                  <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">
                    Position the meter/gauge in frame
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-muted/50 rounded-lg border-2 border-dashed">
                <Camera className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center mb-4">
                  Click "Open Camera" to start capturing
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {!cameraStream ? (
                <>
                  <Button 
                    onClick={startCamera}
                    className="flex items-center gap-2"
                  >
                    <Video className="w-4 h-4" />
                    Open Camera
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleFileUpload(captureTargetParam)}
                    className="flex items-center gap-2"
                  >
                    <FolderOpen className="w-4 h-4" />
                    Upload File
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={captureFromCamera}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Camera className="w-4 h-4" />
                    Capture
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={stopCamera}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </>
              )}
            </div>

            {/* Hidden file inputs */}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => handleFileChange(e, null)}
            />
            {captureTargetParam && (
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={el => paramPhotoRefs.current[captureTargetParam] = el}
                onChange={(e) => handleFileChange(e, captureTargetParam)}
              />
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeCameraModal}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DailyLogFormModal;
