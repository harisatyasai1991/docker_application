import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { toast } from 'sonner';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import {
  Upload,
  Download,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  WifiOff,
  Play,
  Save,
  FolderOpen,
  ClipboardCheck,
  Activity,
  Camera,
  Clock,
  User,
  Building,
  FileText,
  ChevronRight,
  RefreshCw,
  X,
  SwitchCamera,
  Video
} from 'lucide-react';

export const OfflineTestingPage = () => {
  const { isOnline, isOffline } = useNetworkStatus();
  const fileInputRef = useRef(null);
  
  // State
  const [offlineData, setOfflineData] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [testResults, setTestResults] = useState({});
  const [isTestingActive, setIsTestingActive] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Photo state
  const [stepPhotos, setStepPhotos] = useState({}); // {testId: {stepIndex: {photo, preview, isExternal, filename}}}
  const cameraInputRef = useRef(null);  // For mobile camera capture
  const galleryInputRef = useRef(null); // For gallery selection
  
  // Camera modal state (for laptop/desktop webcam)
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' for front, 'environment' for back
  const [cameraError, setCameraError] = useState(null);
  const [captureTarget, setCaptureTarget] = useState({ testId: null, stepIndex: null });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Load saved offline data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('dms_offline_session');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setOfflineData(parsed);
        // Also load any saved test results
        const savedResults = localStorage.getItem('dms_offline_results');
        if (savedResults) {
          setTestResults(JSON.parse(savedResults));
        }
      } catch (e) {
        console.error('Failed to load saved offline data:', e);
      }
    }
  }, []);

  // Save results to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(testResults).length > 0) {
      localStorage.setItem('dms_offline_results', JSON.stringify(testResults));
    }
  }, [testResults]);

  // Handle JSON file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Please select a JSON file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Validate the JSON structure
        if (!data.session_id || !data.asset || !data.tests) {
          toast.error('Invalid offline testing file format');
          return;
        }

        setOfflineData(data);
        localStorage.setItem('dms_offline_session', JSON.stringify(data));
        toast.success(`Loaded offline session: ${data.session_id}`);
      } catch (error) {
        toast.error('Failed to parse JSON file');
        console.error(error);
      }
    };
    reader.readAsText(file);
  };

  // Start a test
  const handleStartTest = (test) => {
    setSelectedTest(test);
    setCurrentStep(0);
    setIsTestingActive(true);
    
    // Initialize results for this test if not exists
    if (!testResults[test.test_id]) {
      setTestResults(prev => ({
        ...prev,
        [test.test_id]: {
          test_id: test.test_id,
          test_name: test.test_name || test.name,
          started_at: new Date().toISOString(),
          status: 'in_progress',
          steps: [],
          parameters: {}
        }
      }));
    }
  };

  // Save step result
  const handleSaveStep = (stepIndex, stepData) => {
    const testId = selectedTest.test_id;
    const photoData = getStepPhoto(testId, stepIndex);
    
    setTestResults(prev => {
      const updated = { ...prev };
      if (!updated[testId].steps) updated[testId].steps = [];
      updated[testId].steps[stepIndex] = {
        ...stepData,
        completed_at: new Date().toISOString(),
        // Include photo information
        photo: photoData ? {
          hasPhoto: !!photoData.preview,
          isExternal: photoData.isExternal || false,
          filename: photoData.filename || null,
          // Store base64 preview for later sync (compressed)
          photoData: photoData.preview || null
        } : null
      };
      return updated;
    });
    toast.success(`Step ${stepIndex + 1} saved`);
  };

  // Save parameter reading
  const handleSaveParameter = (paramName, value, unit) => {
    const testId = selectedTest.test_id;
    setTestResults(prev => ({
      ...prev,
      [testId]: {
        ...prev[testId],
        parameters: {
          ...prev[testId]?.parameters,
          [paramName]: { value, unit, recorded_at: new Date().toISOString() }
        }
      }
    }));
  };

  // Complete test
  const handleCompleteTest = () => {
    const testId = selectedTest.test_id;
    setTestResults(prev => ({
      ...prev,
      [testId]: {
        ...prev[testId],
        status: 'completed',
        completed_at: new Date().toISOString()
      }
    }));
    setIsTestingActive(false);
    setSelectedTest(null);
    toast.success('Test completed! Results saved locally.');
  };

  // Download results as JSON
  const handleDownloadResults = () => {
    if (!offlineData) return;

    const exportData = {
      ...offlineData,
      test_results: testResults,
      exported_at: new Date().toISOString(),
      sync_status: 'pending'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `offline_results_${offlineData.session_id}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Results downloaded as JSON file');
  };

  // Helper function to make fetch requests with retry for rrweb clone errors
  const fetchWithRetry = async (url, options, maxRetries = 3) => {
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);
        // Read response as text first to avoid clone issues
        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
        return { ok: response.ok, status: response.status, data };
      } catch (error) {
        lastError = error;
        // If it's a clone error, wait and retry
        if (error?.message?.includes('clone')) {
          console.warn(`Retry attempt ${attempt + 1} due to clone error`);
          await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  };

  // Sync results to server
  const handleSyncToServer = async () => {
    if (!isOnline) {
      toast.error('No internet connection. Please connect to sync.');
      return;
    }

    setIsSyncing(true);
    try {
      const syncData = {
        session_id: offlineData.session_id,
        asset_id: offlineData.asset.asset_id,
        version_hash: offlineData.version_hash,
        test_results: testResults,
        synced_at: new Date().toISOString()
      };

      const response = await fetchWithRetry(
        `${process.env.REACT_APP_BACKEND_URL}/api/offline-sessions/sync`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(syncData)
        }
      );

      if (!response.ok) {
        throw new Error(response.data?.detail || 'Sync failed');
      }

      const result = response.data;
      
      // Clear local data after successful sync
      localStorage.removeItem('dms_offline_session');
      localStorage.removeItem('dms_offline_results');
      setOfflineData(null);
      setTestResults({});
      
      toast.success('Results synced successfully!');
      setShowSyncDialog(false);
    } catch (error) {
      console.error('Sync error:', error);
      toast.error(`Sync failed: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Generate unique filename for external photos
  const generatePhotoFilename = (testId, stepIndex) => {
    const timestamp = Date.now();
    const assetId = offlineData?.asset?.asset_id || 'ASSET';
    const testCode = selectedTest?.test_code || testId;
    return `${assetId}-${testCode}-S${String(stepIndex + 1).padStart(2, '0')}-${timestamp}.jpg`;
  };

  // Handle photo capture
  const handlePhotoCapture = (e, testId, stepIndex) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setStepPhotos(prev => ({
        ...prev,
        [testId]: {
          ...prev[testId],
          [stepIndex]: {
            photo: file,
            preview: reader.result,
            isExternal: false,
            filename: file.name
          }
        }
      }));
      toast.success('Photo captured');
    };
    reader.readAsDataURL(file);
  };

  // Mark photo as external (taken on different device)
  const handleMarkPhotoExternal = (testId, stepIndex) => {
    const filename = generatePhotoFilename(testId, stepIndex);
    setStepPhotos(prev => ({
      ...prev,
      [testId]: {
        ...prev[testId],
        [stepIndex]: {
          photo: null,
          preview: null,
          isExternal: true,
          filename: filename
        }
      }
    }));
    toast.success(
      <div>
        <p className="font-semibold">Photo marked as external</p>
        <p className="text-xs mt-1">Use filename: <code className="bg-muted px-1 rounded">{filename}</code></p>
      </div>,
      { duration: 8000 }
    );
  };

  // Clear photo for a step
  const handleClearPhoto = (testId, stepIndex) => {
    setStepPhotos(prev => {
      const updated = { ...prev };
      if (updated[testId]) {
        delete updated[testId][stepIndex];
      }
      return updated;
    });
  };

  // Get photo data for a step
  const getStepPhoto = (testId, stepIndex) => {
    return stepPhotos[testId]?.[stepIndex] || null;
  };

  // Open camera modal for webcam capture (works on laptop/desktop/tablet)
  const openCameraModal = async (testId, stepIndex) => {
    setCaptureTarget({ testId, stepIndex });
    setCameraError(null);
    setShowCameraModal(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      setCameraStream(stream);
      
      // Wait for modal to render, then attach stream to video
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (error) {
      console.error('Camera access error:', error);
      if (error.name === 'NotAllowedError') {
        setCameraError('Camera access denied. Please allow camera permissions in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        setCameraError('No camera found on this device. Use "Choose from Gallery" instead.');
      } else {
        setCameraError(`Camera error: ${error.message}`);
      }
    }
  };

  // Close camera modal and stop stream
  const closeCameraModal = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
    setCameraError(null);
    setCaptureTarget({ testId: null, stepIndex: null });
  };

  // Switch between front and back camera
  const switchCamera = async () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    
    // Stop current stream
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: newMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Switch camera error:', error);
      toast.error('Failed to switch camera');
    }
  };

  // Capture photo from video stream
  const captureFromWebcam = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    const filename = generatePhotoFilename(captureTarget.testId, captureTarget.stepIndex);
    
    // Save the photo
    setStepPhotos(prev => ({
      ...prev,
      [captureTarget.testId]: {
        ...prev[captureTarget.testId],
        [captureTarget.stepIndex]: {
          photo: null,
          preview: imageData,
          isExternal: false,
          filename: filename
        }
      }
    }));
    
    toast.success('Photo captured!');
    closeCameraModal();
  };

  // Check if current step requirements are met
  const isStepComplete = (testId, stepIndex, stepData) => {
    if (!stepData) return true; // No step data means no requirements
    
    // Check photo requirement
    if (stepData.photo_required) {
      const photoData = getStepPhoto(testId, stepIndex);
      if (!photoData || (!photoData.preview && !photoData.isExternal)) {
        return false;
      }
    }
    
    // Check parameter requirements
    const stepParams = stepData.parameters || [];
    if (stepParams.length > 0) {
      const testResult = testResults[testId];
      for (const param of stepParams) {
        const paramName = param.parameter_name || param.name;
        const paramValue = testResult?.parameters?.[paramName]?.value;
        if (!paramValue || paramValue === '') {
          return false;
        }
      }
    }
    
    return true;
  };

  // Get validation message for current step
  const getStepValidationMessage = (testId, stepIndex, stepData) => {
    if (!stepData) return null;
    
    const missing = [];
    
    // Check photo
    if (stepData.photo_required) {
      const photoData = getStepPhoto(testId, stepIndex);
      if (!photoData || (!photoData.preview && !photoData.isExternal)) {
        missing.push('Photo required');
      }
    }
    
    // Check parameters
    const stepParams = stepData.parameters || [];
    if (stepParams.length > 0) {
      const testResult = testResults[testId];
      for (const param of stepParams) {
        const paramName = param.parameter_name || param.name;
        const paramValue = testResult?.parameters?.[paramName]?.value;
        if (!paramValue || paramValue === '') {
          missing.push(`${paramName} value required`);
        }
      }
    }
    
    return missing.length > 0 ? missing.join(', ') : null;
  };

  // Clear offline data
  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all offline data? This cannot be undone.')) {
      localStorage.removeItem('dms_offline_session');
      localStorage.removeItem('dms_offline_results');
      setOfflineData(null);
      setTestResults({});
      setStepPhotos({});
      setSelectedTest(null);
      setIsTestingActive(false);
      toast.success('Offline data cleared');
    }
  };

  // Render test execution wizard
  const renderTestExecution = () => {
    if (!selectedTest) return null;

    const steps = selectedTest.sop_steps || [];
    const currentStepData = steps[currentStep];
    const stepResult = testResults[selectedTest.test_id]?.steps?.[currentStep] || {};

    return (
      <Card className="border-primary/50">
        <CardHeader className="bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{selectedTest.test_name || selectedTest.name}</CardTitle>
              <CardDescription>Step {currentStep + 1} of {steps.length || 1}</CardDescription>
            </div>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
              <Clock className="w-3 h-3 mr-1" />
              In Progress
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {steps.length > 0 ? (
            <div className="space-y-6">
              {/* Step Progress */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {steps.map((step, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium cursor-pointer transition-all ${
                      idx === currentStep
                        ? 'bg-primary text-primary-foreground'
                        : testResults[selectedTest.test_id]?.steps?.[idx]
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                    onClick={() => setCurrentStep(idx)}
                  >
                    {testResults[selectedTest.test_id]?.steps?.[idx] ? '✓' : idx + 1}
                  </div>
                ))}
              </div>

              {/* Current Step */}
              {currentStepData && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">{currentStepData.title}</h4>
                    <p className="text-sm text-muted-foreground">{currentStepData.instruction}</p>
                  </div>

                  {/* Parameters for this step */}
                  {currentStepData.parameters?.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Parameters</Label>
                      {currentStepData.parameters.map((param, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <Label className="w-40 text-sm">{param.parameter_name}</Label>
                          <Input
                            type="number"
                            placeholder={`Enter value`}
                            className="w-32"
                            value={testResults[selectedTest.test_id]?.parameters?.[param.parameter_name]?.value || ''}
                            onChange={(e) => handleSaveParameter(param.parameter_name, e.target.value, param.unit)}
                          />
                          <span className="text-sm text-muted-foreground">{param.unit}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Photo Capture Section */}
                  {currentStepData.photo_required && (
                    <div className="space-y-3 p-4 border rounded-lg bg-amber-50/50 border-amber-200">
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-amber-600" />
                        <Label className="text-sm font-medium text-amber-800">Photo Required for this Step</Label>
                      </div>
                      
                      {(() => {
                        const photoData = getStepPhoto(selectedTest.test_id, currentStep);
                        
                        if (photoData?.preview) {
                          // Photo captured
                          return (
                            <div className="space-y-2">
                              <img 
                                src={photoData.preview} 
                                alt="Step photo" 
                                className="max-h-48 rounded-lg border"
                              />
                              <div className="flex gap-2">
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Photo Captured
                                </Badge>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleClearPhoto(selectedTest.test_id, currentStep)}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          );
                        } else if (photoData?.isExternal) {
                          // Marked as external
                          return (
                            <div className="space-y-2">
                              <Alert className="bg-blue-50 border-blue-200">
                                <Camera className="w-4 h-4 text-blue-600" />
                                <AlertDescription className="text-blue-800">
                                  <p className="font-medium">Photo will be taken on external device</p>
                                  <p className="text-xs mt-1">
                                    Save photo with filename: <code className="bg-blue-100 px-1 rounded font-mono">{photoData.filename}</code>
                                  </p>
                                </AlertDescription>
                              </Alert>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleClearPhoto(selectedTest.test_id, currentStep)}
                              >
                                Clear & Re-capture
                              </Button>
                            </div>
                          );
                        } else {
                          // No photo yet - show camera, gallery and external options
                          return (
                            <div className="space-y-3">
                              {/* Hidden input for gallery selection */}
                              <input
                                type="file"
                                ref={galleryInputRef}
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handlePhotoCapture(e, selectedTest.test_id, currentStep)}
                              />
                              
                              {/* Primary action - Open Camera (works on all devices) */}
                              <Button
                                variant="default"
                                size="default"
                                onClick={() => openCameraModal(selectedTest.test_id, currentStep)}
                                className="w-full gap-2 bg-amber-600 hover:bg-amber-700"
                              >
                                <Camera className="w-5 h-5" />
                                Open Camera
                              </Button>
                              
                              {/* Secondary actions */}
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => galleryInputRef.current?.click()}
                                  className="gap-2 flex-1"
                                >
                                  <FolderOpen className="w-4 h-4" />
                                  Choose from Files
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMarkPhotoExternal(selectedTest.test_id, currentStep)}
                                  className="gap-2 text-blue-600 border-blue-300 flex-1"
                                >
                                  <FileText className="w-4 h-4" />
                                  Mark as External
                                </Button>
                              </div>
                              
                              <p className="text-xs text-muted-foreground text-center">
                                💻 Works on laptops, tablets & phones with camera
                              </p>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Notes</Label>
                    <Textarea
                      placeholder="Add any observations or notes..."
                      value={stepResult.notes || ''}
                      onChange={(e) => {
                        const testId = selectedTest.test_id;
                        setTestResults(prev => {
                          const updated = { ...prev };
                          if (!updated[testId].steps) updated[testId].steps = [];
                          updated[testId].steps[currentStep] = {
                            ...updated[testId].steps[currentStep],
                            notes: e.target.value
                          };
                          return updated;
                        });
                      }}
                    />
                  </div>

                  {/* Step Validation Message */}
                  {!isStepComplete(selectedTest.test_id, currentStep, currentStepData) && (
                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <AlertDescription className="text-amber-800">
                        <span className="font-medium">Required: </span>
                        {getStepValidationMessage(selectedTest.test_id, currentStep, currentStepData)}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Step Actions */}
                  <div className="flex items-center justify-between pt-4">
                    <Button
                      variant="outline"
                      disabled={currentStep === 0}
                      onClick={() => setCurrentStep(prev => prev - 1)}
                    >
                      Previous
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleSaveStep(currentStep, { ...stepResult, status: 'completed' })}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Step
                      </Button>
                      {currentStep < steps.length - 1 ? (
                        <Button 
                          onClick={() => {
                            handleSaveStep(currentStep, { ...stepResult, status: 'completed' });
                            setCurrentStep(prev => prev + 1);
                          }}
                          disabled={!isStepComplete(selectedTest.test_id, currentStep, currentStepData)}
                          title={!isStepComplete(selectedTest.test_id, currentStep, currentStepData) ? 
                            getStepValidationMessage(selectedTest.test_id, currentStep, currentStepData) : ''}
                        >
                          Next Step
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleCompleteTest} 
                          className="bg-green-600 hover:bg-green-700"
                          disabled={!isStepComplete(selectedTest.test_id, currentStep, currentStepData)}
                          title={!isStepComplete(selectedTest.test_id, currentStep, currentStepData) ? 
                            getStepValidationMessage(selectedTest.test_id, currentStep, currentStepData) : ''}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Complete Test
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // No SOP steps - simple parameter entry
            <div className="space-y-6">
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  No SOP steps defined. Enter test parameters directly below.
                </AlertDescription>
              </Alert>

              {selectedTest.parameters?.map((param, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Label className="w-48 text-sm">{param.name}</Label>
                  <Input
                    type="number"
                    placeholder={`Enter value`}
                    className="w-32"
                    value={testResults[selectedTest.test_id]?.parameters?.[param.name]?.value || ''}
                    onChange={(e) => handleSaveParameter(param.name, e.target.value, param.unit)}
                  />
                  <span className="text-sm text-muted-foreground">{param.unit}</span>
                  <span className="text-xs text-muted-foreground">({param.limit})</span>
                </div>
              ))}

              <div className="flex justify-end pt-4">
                <Button onClick={handleCompleteTest} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Complete Test
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-primary">DMS Insight</h1>
                <p className="text-xs text-muted-foreground">Offline Testing Mode</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isOnline ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                  <Wifi className="w-3 h-3 mr-1" />
                  Online
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                  <WifiOff className="w-3 h-3 mr-1" />
                  Offline
                </Badge>
              )}
              {offlineData && (
                <Button variant="outline" size="sm" onClick={() => setShowSyncDialog(true)}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!offlineData ? (
          // No data loaded - show upload interface
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileJson className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Load Offline Testing Data</CardTitle>
              <CardDescription>
                Upload a JSON file downloaded from the online system to begin offline testing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                className="border-2 border-dashed border-muted rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  JSON files only (.json)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have a file? Go to the online system, select an asset, and click "Download for Offline Testing"
                </p>
              </div>
            </CardContent>
          </Card>
        ) : isTestingActive && selectedTest ? (
          // Test execution view
          <div className="max-w-4xl mx-auto">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => {
                if (window.confirm('Exit test? Progress is saved locally.')) {
                  setIsTestingActive(false);
                  setSelectedTest(null);
                }
              }}
            >
              ← Back to Tests
            </Button>
            {renderTestExecution()}
          </div>
        ) : (
          // Main offline testing interface
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Asset Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Asset Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Asset Name</Label>
                  <p className="font-medium">{offlineData.asset?.asset_name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Asset ID</Label>
                  <p className="font-mono text-sm">{offlineData.asset?.asset_id}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <p className="capitalize">{offlineData.asset?.asset_type}</p>
                </div>
                <Separator />
                <div>
                  <Label className="text-xs text-muted-foreground">Session ID</Label>
                  <p className="font-mono text-xs">{offlineData.session_id}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Downloaded</Label>
                  <p className="text-sm">{new Date(offlineData.created_at).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Available Tests */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5" />
                    Available Tests
                  </CardTitle>
                  <Badge>{offlineData.tests?.length || 0} tests</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {offlineData.tests?.map((test) => {
                      const result = testResults[test.test_id];
                      const isCompleted = result?.status === 'completed';
                      const isInProgress = result?.status === 'in_progress';

                      return (
                        <Card
                          key={test.test_id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            isCompleted ? 'border-green-500 bg-green-50/50' :
                            isInProgress ? 'border-amber-500 bg-amber-50/50' :
                            'border-border'
                          }`}
                          onClick={() => !isCompleted && handleStartTest(test)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{test.test_name || test.name}</h4>
                                  {isCompleted && (
                                    <Badge className="bg-green-500">
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      Completed
                                    </Badge>
                                  )}
                                  {isInProgress && (
                                    <Badge variant="outline" className="border-amber-500 text-amber-700">
                                      In Progress
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {test.parameters?.length || 0} parameters • {test.sop_steps?.length || 0} steps
                                  {test.sop_steps?.some(s => s.photo_required) && (
                                    <span className="ml-2 inline-flex items-center text-amber-600">
                                      <Camera className="w-3 h-3 mr-1" />
                                      {test.sop_steps.filter(s => s.photo_required).length} photos
                                    </span>
                                  )}
                                </p>
                              </div>
                              {!isCompleted && (
                                <Button size="sm" variant={isInProgress ? "default" : "outline"}>
                                  <Play className="w-4 h-4 mr-1" />
                                  {isInProgress ? 'Resume' : 'Start'}
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>

                {/* Actions */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <Button variant="outline" onClick={handleClearData}>
                    Clear Data
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleDownloadResults}>
                      <Download className="w-4 h-4 mr-2" />
                      Download Results
                    </Button>
                    {isOnline && (
                      <Button onClick={() => setShowSyncDialog(true)}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sync to Server
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Sync Dialog */}
      <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sync Results to Server</DialogTitle>
            <DialogDescription>
              Upload your offline test results to the server. Make sure you're connected to the internet.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              {isOnline ? (
                <>
                  <Wifi className="w-5 h-5 text-green-600" />
                  <span className="text-sm">Connected to internet</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-amber-600" />
                  <span className="text-sm text-amber-700">No internet connection</span>
                </>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm"><strong>Session:</strong> {offlineData?.session_id}</p>
              <p className="text-sm"><strong>Tests completed:</strong> {Object.values(testResults).filter(r => r.status === 'completed').length}</p>
            </div>

            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                After syncing, local data will be cleared. Make sure to download a backup first if needed.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSyncDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSyncToServer} disabled={!isOnline || isSyncing}>
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Camera Capture Modal - Works on laptop/desktop/tablet */}
      <Dialog open={showCameraModal} onOpenChange={(open) => !open && closeCameraModal()}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Camera Capture
            </DialogTitle>
            <DialogDescription>
              Position the subject in the frame and click "Capture Photo"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {cameraError ? (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>{cameraError}</AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Video preview */}
                <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Camera switch button (for devices with multiple cameras) */}
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                    onClick={switchCamera}
                    title="Switch camera"
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Hidden canvas for capture */}
                <canvas ref={canvasRef} className="hidden" />
              </>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={closeCameraModal} className="gap-2">
              <X className="w-4 h-4" />
              Cancel
            </Button>
            {!cameraError && (
              <Button onClick={captureFromWebcam} className="gap-2 bg-amber-600 hover:bg-amber-700">
                <Camera className="w-4 h-4" />
                Capture Photo
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OfflineTestingPage;
