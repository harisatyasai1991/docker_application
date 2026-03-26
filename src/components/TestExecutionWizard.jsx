import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Camera, 
  Check, 
  AlertTriangle, 
  Clock, 
  ChevronRight,
  ChevronLeft,
  FileText,
  Upload,
  X,
  CheckCircle2,
  XCircle,
  Gauge,
  Copy,
  Smartphone,
  PauseCircle,
  SwitchCamera,
  FolderOpen,
  ListChecks,
  Square,
  CheckSquare,
  Hash,
  MessageSquare
} from 'lucide-react';
import { testExecutionAPI } from '../services/api';
import { offlineStorage } from '../services/offlineDB';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';
import { WifiOff, Wifi, HardDrive, Cloud } from 'lucide-react';
import { ImageCarousel } from './ImageCarousel';

export const TestExecutionWizard = ({ test, assetId, assetName, resumeExecution, onComplete, onCancel }) => {
  const { isOnline, isOffline } = useNetworkStatus();
  const [currentStep, setCurrentStep] = useState(resumeExecution?.current_step || 0);
  const [executionId, setExecutionId] = useState(resumeExecution?.execution_id || null);
  const [completedSteps, setCompletedSteps] = useState(resumeExecution?.steps_completed || []);
  const [completedStepsData, setCompletedStepsData] = useState({}); // Store data for each completed step {stepIndex: {notes, photo, params}}
  const [stepNotes, setStepNotes] = useState('');
  const [stepPhoto, setStepPhoto] = useState(null);
  const [stepPhotoPreview, setStepPhotoPreview] = useState(null);
  const [parameterReadings, setParameterReadings] = useState({}); // {paramName: {value, photo, photoPreview, isExternal, expectedFilename}}
  const [checklistData, setChecklistData] = useState({}); // {itemId: {checked, value, photo, photoPreview, comment}}
  const [stepPhotoExternal, setStepPhotoExternal] = useState(false); // Track if step photo is external
  const [stepPhotoFilename, setStepPhotoFilename] = useState(null); // Expected filename for step photo
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingStep, setIsEditingStep] = useState(false); // Track if we're editing a completed step
  const [showCompletionModal, setShowCompletionModal] = useState(false); // Completion dialog
  const [conclusionText, setConclusionText] = useState(''); // Final conclusion/summary
  const stepPhotoInputRef = useRef(null);
  const paramPhotoRefs = useRef({});
  
  // Camera modal state
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [cameraError, setCameraError] = useState(null);
  const [cameraTarget, setCameraTarget] = useState(null); // 'step' or {paramName: 'xxx'}
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Debug log
  console.log('TestExecutionWizard - Test object:', test);
  console.log('TestExecutionWizard - Asset ID:', assetId);
  console.log('TestExecutionWizard - Asset Name:', assetName);

  const steps = test.sop_steps || [];
  const totalSteps = steps.length;
  const actualCompletedCount = Array.isArray(completedSteps) ? completedSteps.filter(s => typeof s === 'number' || s?.step_number).length : Object.keys(completedStepsData).length;
  const progressPercentage = (actualCompletedCount / totalSteps) * 100;

  // Check if current step is already completed
  const isCurrentStepCompleted = completedSteps.includes(currentStep) || completedStepsData[currentStep];

  // Debug: Log when stepPhotoExternal changes
  React.useEffect(() => {
    console.log('[DEBUG] stepPhotoExternal state changed to:', stepPhotoExternal);
  }, [stepPhotoExternal]);

  // Debug: Log button disabled state
  React.useEffect(() => {
    const currentStepData = steps[currentStep];
    const isDisabled = 
      isSubmitting || 
      (currentStepData?.photo_required && !stepPhotoPreview && !stepPhotoExternal) ||
      (currentStepData?.parameters && currentStepData.parameters.some(p => 
        p.is_required && !parameterReadings[p.parameter_name]?.value
      ));
    console.log('[DEBUG] Complete Step button disabled:', isDisabled, {
      isSubmitting,
      photoRequired: currentStepData?.photo_required,
      hasPhotoPreview: !!stepPhotoPreview,
      isExternal: stepPhotoExternal,
      requiredParamsMissing: currentStepData?.parameters?.filter(p => 
        p.is_required && !parameterReadings[p.parameter_name]?.value
      )
    });
  }, [isSubmitting, stepPhotoPreview, stepPhotoExternal, currentStep, parameterReadings]);

  // Generate unique filename for external photos
  const generatePhotoFilename = (stepNum, paramIndex = null, type = 'PARAM') => {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0].replace('T', '-');
    const assetCode = assetId.split('-')[0] || 'ASSET'; // e.g., TRANSFORMER-0001 -> TRANSFORMER
    const testCode = test.test_code?.split('-')[0] || 'TEST'; // e.g., IR-TEST-001 -> IR
    
    if (type === 'STEP') {
      // General step photo: ASSET-TEST-SSTEP-TIMESTAMP
      return `${assetCode}-${testCode}-S${String(stepNum).padStart(2, '0')}-${timestamp}`;
    } else {
      // Parameter-specific photo: ASSET-TEST-SSTEP-PPARAM-TIMESTAMP
      return `${assetCode}-${testCode}-S${String(stepNum).padStart(2, '0')}-P${String(paramIndex + 1).padStart(2, '0')}-${timestamp}`;
    }
  };

  // Copy filename to clipboard
  const copyFilenameToClipboard = (filename) => {
    navigator.clipboard.writeText(filename).then(() => {
      toast.success('Filename copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy filename');
    });
  };

  // Compress photo for offline storage
  const compressPhoto = async (file) => {
    try {
      const options = {
        maxSizeMB: 0.5, // Target 500KB max
        maxWidthOrHeight: 800, // Max dimension 800px
        useWebWorker: true,
        fileType: 'image/jpeg',
      };
      
      const compressedFile = await imageCompression(file, options);
      console.log('Photo compressed:', file.size, '→', compressedFile.size);
      
      // Convert to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(compressedFile);
      });
    } catch (error) {
      console.error('Photo compression error:', error);
      throw error;
    }
  };

  // Check if we have an active offline session for this asset
  const getOfflineSession = async () => {
    try {
      const sessions = await offlineStorage.getAllSessions();
      return sessions.find(s => s.asset_id === assetId && s.sync_status === 'active');
    } catch (error) {
      console.error('Failed to get offline session:', error);
      return null;
    }
  };

  // Start test execution
  const startExecution = async () => {
    try {
      const executionData = {
        test_id: test.test_id,
        test_code: test.test_code,
        test_name: test.name || test.test_name,
        asset_id: assetId,
        asset_name: assetName,
        conducted_by: 'Current User', // TODO: Get from auth context
        total_steps: totalSteps,
        start_time: new Date().toISOString(),
        status: 'in_progress',
        steps_completed: [],
      };
      
      console.log('Starting test execution with data:', executionData);
      
      if (isOffline) {
        // Start offline - save to IndexedDB
        const offlineSession = await getOfflineSession();
        if (!offlineSession) {
          toast.error('No offline session found. Please download asset for offline testing first.');
          onCancel();
          return;
        }
        
        const executionId = `OFF-EXEC-${Date.now()}`;
        const offlineExecution = {
          ...executionData,
          execution_id: executionId,
          session_id: offlineSession.session_id,
          sync_status: 'pending',
        };
        
        await offlineStorage.saveTestExecution(offlineExecution);
        setExecutionId(executionId);
        
        toast.success(
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4" />
            <div>
              <div className="font-semibold">Started Offline</div>
              <div className="text-xs">Data will sync when online</div>
            </div>
          </div>
        );
      } else {
        // Start online - save to server
        const execution = await testExecutionAPI.start(executionData);
        setExecutionId(execution.execution_id);
        
        toast.success(
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4" />
            <span>Test execution started</span>
          </div>
        );
      }
    } catch (error) {
      toast.error(`Failed to start test execution: ${error.message || error}`);
      console.error('Test execution error:', error);
    }
  };

  // Initialize or resume execution on mount
  React.useEffect(() => {
    const initializeExecution = async () => {
      if (resumeExecution) {
        // Resuming an existing execution
        try {
          // Call resume API to update status
          await testExecutionAPI.resume(resumeExecution.execution_id);
          toast.success(`Resumed test: ${resumeExecution.test_name}`);
          toast.info(`Continuing from step ${resumeExecution.current_step + 1} of ${resumeExecution.total_steps}`);
        } catch (error) {
          toast.error('Failed to resume test execution');
          console.error(error);
        }
      } else if (!executionId && steps.length > 0) {
        // Starting a new execution
        await startExecution();
      }
    };

    initializeExecution();
  }, []);

  // Cleanup: abort execution if component unmounts without completing
  React.useEffect(() => {
    return () => {
      // Only abort if we have an execution that's not completed and not a resume
      if (executionId && !isOffline && !resumeExecution) {
        // Check if test was completed by looking at completedSteps
        const isCompleted = completedSteps.length >= totalSteps;
        if (!isCompleted) {
          // Fire and forget - abort the dangling execution
          testExecutionAPI.abort(executionId, 'User cancelled or navigated away').catch(() => {});
        }
      }
    };
  }, [executionId, completedSteps.length, totalSteps, isOffline, resumeExecution]);

  // Navigate to a specific step (including completed ones for editing)
  const navigateToStep = (stepIndex) => {
    // Check if navigating to a completed step
    const stepData = completedStepsData[stepIndex];
    
    if (stepData || completedSteps.includes(stepIndex)) {
      // Loading a completed step for editing
      setIsEditingStep(true);
      
      if (stepData) {
        // Load the saved data for this step
        setStepNotes(stepData.notes || '');
        setStepPhotoPreview(stepData.step_photo_base64 || null);
        setStepPhotoExternal(stepData.step_photo_is_external || false);
        setStepPhotoFilename(stepData.step_photo_expected_filename || null);
        
        // Load parameter readings
        const paramReadings = {};
        if (stepData.parameter_readings) {
          stepData.parameter_readings.forEach(reading => {
            paramReadings[reading.parameter_name] = {
              value: reading.observed_value || '',
              photoPreview: reading.photo_base64 || null,
              isExternal: reading.photo_is_external || false,
              expectedFilename: reading.photo_expected_filename || null
            };
          });
        }
        setParameterReadings(paramReadings);
      }
      
      toast.info(`Editing Step ${stepIndex + 1} - You can update notes, photos, and values`);
    } else {
      // Moving to a new incomplete step
      setIsEditingStep(false);
      // Reset form for new step
      setStepNotes('');
      setStepPhoto(null);
      setStepPhotoPreview(null);
      setStepPhotoExternal(false);
      setStepPhotoFilename(null);
      setParameterReadings({});
    }
    
    setCurrentStep(stepIndex);
  };

  // Handle step photo (general documentation)
  const handleStepPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setStepPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setStepPhotoPreview(reader.result);
        console.log('[DEBUG] Step photo preview set, length:', reader.result?.length);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerStepPhotoCapture = () => {
    stepPhotoInputRef.current?.click();
  };

  const removeStepPhoto = () => {
    setStepPhoto(null);
    setStepPhotoPreview(null);
    setStepPhotoExternal(false);
    setStepPhotoFilename(null);
    if (stepPhotoInputRef.current) {
      stepPhotoInputRef.current.value = '';
    }
  };

  // Camera modal functions
  const openCameraModal = async (target) => {
    setCameraTarget(target);
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
        setCameraError('No camera found on this device. Use "Choose from Files" instead.');
      } else {
        setCameraError(`Camera error: ${error.message}`);
      }
    }
  };

  const closeCameraModal = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
    setCameraError(null);
    setCameraTarget(null);
  };

  const switchCamera = async () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    
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

  const captureFromWebcam = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    if (cameraTarget === 'step') {
      // Step photo
      setStepPhotoPreview(imageData);
      setStepPhoto(null); // No file, just base64
      setStepPhotoExternal(false);
      toast.success('Step photo captured!');
    } else if (cameraTarget?.paramName) {
      // Parameter photo
      setParameterReadings(prev => ({
        ...prev,
        [cameraTarget.paramName]: {
          ...prev[cameraTarget.paramName],
          photo: null,
          photoPreview: imageData,
          isExternal: false
        }
      }));
      toast.success('Parameter photo captured!');
    }
    
    closeCameraModal();
  };

  // Handle parameter-specific photo
  const handleParameterPhotoChange = (paramName, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setParameterReadings(prev => ({
          ...prev,
          [paramName]: {
            ...prev[paramName],
            photo: file,
            photoPreview: reader.result
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeParameterPhoto = (paramName) => {
    setParameterReadings(prev => ({
      ...prev,
      [paramName]: {
        ...prev[paramName],
        photo: null,
        photoPreview: null
      }
    }));
    if (paramPhotoRefs.current[paramName]) {
      paramPhotoRefs.current[paramName].value = '';
    }
  };

  // Handle parameter value change
  const handleParameterValueChange = (paramName, value) => {
    setParameterReadings(prev => ({
      ...prev,
      [paramName]: {
        ...prev[paramName],
        value: value
      }
    }));
  };

  // Mark parameter photo as external (taken on another device)
  const markParameterPhotoAsExternal = (paramName, stepNum, paramIndex) => {
    const filename = generatePhotoFilename(stepNum, paramIndex);
    setParameterReadings(prev => ({
      ...prev,
      [paramName]: {
        ...prev[paramName],
        isExternal: true,
        expectedFilename: filename,
        photo: null,
        photoPreview: null
      }
    }));
    toast.info(`Photo marked as external. Use filename: ${filename}.jpg`);
  };

  // Mark step photo as external
  const markStepPhotoAsExternal = (stepNum) => {
    const filename = generatePhotoFilename(stepNum, null, 'STEP');
    console.log('[DEBUG] Marking step photo as external');
    console.log('[DEBUG] Setting stepPhotoExternal to true');
    setStepPhotoExternal(true);
    setStepPhotoFilename(filename);
    setStepPhoto(null);
    setStepPhotoPreview(null);
    console.log('[DEBUG] External photo filename:', filename);
    toast.info(`Step photo marked as external. Use filename: ${filename}.jpg`);
  };

  // Checklist item handlers
  const handleChecklistItemToggle = (itemId) => {
    setChecklistData(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        checked: !prev[itemId]?.checked
      }
    }));
  };

  const handleChecklistItemValue = (itemId, value) => {
    setChecklistData(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        value: value
      }
    }));
  };

  const handleChecklistItemComment = (itemId, comment) => {
    setChecklistData(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        comment: comment
      }
    }));
  };

  const handleChecklistItemPhoto = async (itemId, file) => {
    if (!file) return;
    
    try {
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      reader.onloadend = () => {
        setChecklistData(prev => ({
          ...prev,
          [itemId]: {
            ...prev[itemId],
            photo: compressedFile,
            photoPreview: reader.result
          }
        }));
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      toast.error('Failed to process photo');
    }
  };

  const removeChecklistItemPhoto = (itemId) => {
    setChecklistData(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        photo: null,
        photoPreview: null
      }
    }));
  };

  // Check if checklist step is valid (all required items completed)
  const isChecklistStepValid = (stepData) => {
    if (stepData.step_type !== 'checklist' || !stepData.checklist_items) return true;
    
    for (let idx = 0; idx < stepData.checklist_items.length; idx++) {
      const item = stepData.checklist_items[idx];
      const itemKey = item.id || `item-${idx}`;
      const itemData = checklistData[itemKey];
      if (item.is_required) {
        if (!itemData?.checked) return false;
        if (item.requires_value && !itemData?.value) return false;
        if (item.requires_photo && !itemData?.photo && !itemData?.photoPreview) return false;
      }
    }
    return true;
  };

  // Complete current step (or update if editing)
  const completeStep = async () => {
    if (!executionId) return;

    const currentStepData = steps[currentStep];
    const parameters = currentStepData.parameters || [];

    // Validation: Check if all required parameters have values
    for (const param of parameters) {
      if (param.is_required && !parameterReadings[param.parameter_name]?.value) {
        toast.error(`Please enter value for: ${param.parameter_name}`);
        return;
      }
    }

    // Validation: Check if step photo is required
    if (currentStepData.photo_required && !stepPhotoPreview && !stepPhotoExternal) {
      toast.error('Please capture step documentation photo or mark as external');
      return;
    }

    setIsSubmitting(true);
    try {
      // Build parameter readings array
      const paramReadings = await Promise.all(parameters.map(async param => {
        let photoBase64 = parameterReadings[param.parameter_name]?.photoPreview || null;
        
        // Compress photo if offline and photo exists
        if (isOffline && parameterReadings[param.parameter_name]?.photo) {
          try {
            photoBase64 = await compressPhoto(parameterReadings[param.parameter_name].photo);
          } catch (error) {
            console.error('Photo compression failed:', error);
          }
        }
        
        return {
          parameter_name: param.parameter_name,
          observed_value: parameterReadings[param.parameter_name]?.value || '',
          unit: param.unit,
          photo_base64: photoBase64,
          photo_is_external: parameterReadings[param.parameter_name]?.isExternal || false,
          photo_expected_filename: parameterReadings[param.parameter_name]?.expectedFilename || null
        };
      }));

      // Compress step photo if offline and exists
      let stepPhotoBase64 = stepPhotoPreview;
      if (isOffline && stepPhoto) {
        try {
          stepPhotoBase64 = await compressPhoto(stepPhoto);
        } catch (error) {
          console.error('Step photo compression failed:', error);
        }
      }

      const stepData = {
        step_number: currentStep + 1,
        title: currentStepData.title,
        completed_at: isEditingStep ? (completedStepsData[currentStep]?.completed_at || new Date().toISOString()) : new Date().toISOString(),
        parameter_readings: paramReadings,
        step_photo_base64: stepPhotoBase64 || null,
        step_photo_is_external: stepPhotoExternal,
        step_photo_expected_filename: stepPhotoFilename,
        notes: stepNotes || null,
        status: 'completed'
      };

      if (isOffline) {
        // Save offline - update local execution
        const execution = await offlineStorage.getTestExecution(executionId);
        if (execution) {
          execution.steps_completed = execution.steps_completed || [];
          if (isEditingStep) {
            // Find and update existing step
            const existingIdx = execution.steps_completed.findIndex(s => s.step_number === currentStep + 1);
            if (existingIdx >= 0) {
              execution.steps_completed[existingIdx] = stepData;
            } else {
              execution.steps_completed.push(stepData);
            }
          } else {
            execution.steps_completed.push(stepData);
          }
          await offlineStorage.saveTestExecution(execution);
        }
        
        toast.success(
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4" />
            <span>Step {currentStep + 1} {isEditingStep ? 'updated' : 'saved'} locally</span>
          </div>
        );
      } else {
        // Save online
        if (isEditingStep) {
          // Update existing step
          await testExecutionAPI.updateExistingStep(executionId, currentStep + 1, stepData);
          toast.success(
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4" />
              <span>Step {currentStep + 1} updated successfully</span>
            </div>
          );
        } else {
          // Add new step
          await testExecutionAPI.updateStep(executionId, stepData);
          toast.success(
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4" />
              <span>Step {currentStep + 1} completed</span>
            </div>
          );
        }
      }
      
      // Store step data locally for navigation
      setCompletedStepsData(prev => ({
        ...prev,
        [currentStep]: stepData
      }));
      
      // Update completed steps list if not already there
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }

      // Reset editing mode
      setIsEditingStep(false);
      
      // Reset for next step
      setStepNotes('');
      setStepPhoto(null);
      setStepPhotoPreview(null);
      setStepPhotoExternal(false);
      setStepPhotoFilename(null);
      setParameterReadings({});

      // Move to next step (only if not editing, or if editing and want to continue)
      if (!isEditingStep && currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
      } else if (isEditingStep) {
        // When editing, stay on step or show completion dialog if all done
        const allStepsCompleted = completedSteps.length >= totalSteps - 1 || Object.keys(completedStepsData).length >= totalSteps - 1;
        if (allStepsCompleted) {
          toast.info('All steps completed. You can review and submit for approval.');
        }
      } else {
        // All steps completed
        showCompletionDialog();
      }
    } catch (error) {
      toast.error(`Failed to ${isEditingStep ? 'update' : 'complete'} step`);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show completion dialog
  const showCompletionDialog = () => {
    const readyForReview = window.confirm(
      'All test steps completed! \n\nIs the testing done satisfactorily and ready to forward for review and approval?\n\nClick OK to submit for review, Cancel to continue editing'
    );
    
    if (!readyForReview) {
      toast.info('You can review and edit your entries before submitting');
      return;
    }
    
    // Show completion dialog instead of simple prompt
    setShowCompletionModal(true);
  };

  // Handle final submission from completion modal
  const handleFinalSubmission = async () => {
    if (!executionId) return;
    
    setIsSubmitting(true);
    try {
      await testExecutionAPI.complete(executionId, 'Pending Review', conclusionText);
      toast.success('Test completed and submitted for review!');
      setShowCompletionModal(false);
      onComplete && onComplete('Pending Review');
    } catch (error) {
      toast.error('Failed to complete test');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Complete entire test - Submit for review (legacy, kept for compatibility)
  const completeTest = async (finalResult, finalNotes) => {
    if (!executionId) return;

    try {
      await testExecutionAPI.complete(executionId, finalResult, finalNotes);
      toast.success('Test completed and submitted for review!');
      onComplete && onComplete(finalResult);
    } catch (error) {
      toast.error('Failed to complete test');
      console.error(error);
    }
  };

  // Abort test
  const abortTest = async () => {
    if (!window.confirm('Are you sure you want to abort this test?')) return;

    const reason = prompt('Reason for aborting (optional):');
    
    try {
      await testExecutionAPI.abort(executionId, reason);
      toast.warning('Test execution aborted');
      onCancel && onCancel();
    } catch (error) {
      toast.error('Failed to abort test');
      console.error(error);
    }
  };

  const pauseTest = async () => {
    if (!window.confirm('Pause this test? You can resume it later.')) return;

    const notes = prompt('Add note (optional):');
    
    try {
      await testExecutionAPI.pause(executionId, notes);
      toast.success('Test paused successfully');
      onCancel && onCancel();
    } catch (error) {
      toast.error('Failed to pause test');
      console.error(error);
    }
  };

  if (steps.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No SOP Steps Available</h3>
          <p className="text-muted-foreground">
            This test does not have standard operating procedure steps defined.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentStepData = steps[currentStep];

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card className="border-primary/50">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-2xl">{test.name || test.test_name}</CardTitle>
              <CardDescription className="text-base mt-2">
                {test.description}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              Step {currentStep + 1} of {totalSteps}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Current Step */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  {currentStep + 1}
                </div>
                <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
              </div>
              
              {currentStepData.estimated_duration && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-2">
                  <Clock className="w-4 h-4" />
                  <span>Estimated: {currentStepData.estimated_duration}</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Safety Note */}
          {currentStepData.safety_note && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-500 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                    Safety Notice
                  </p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    {currentStepData.safety_note}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Instruction with Reference Images on Right */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Instructions
            </h4>
            <div className="flex gap-4">
              {/* Left: Instructions */}
              <div className="flex-1 min-w-0">
                <div className="text-sm leading-relaxed p-4 bg-muted rounded-lg h-full">
                  {currentStepData.instruction}
                </div>
              </div>
              
              {/* Right: Reference Images Carousel (if any) */}
              {currentStepData.reference_images && currentStepData.reference_images.length > 0 && (
                <div className="flex-shrink-0">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <ImageCarousel 
                      images={currentStepData.reference_images}
                      imageSize="w-36 h-36"
                      showDots={true}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Checklist Items - For checklist type steps */}
          {currentStepData.step_type === 'checklist' && currentStepData.checklist_items && currentStepData.checklist_items.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center">
                <ListChecks className="w-4 h-4 mr-2 text-purple-600" />
                Checklist Items
                <Badge variant="outline" className="ml-2 text-xs">
                  {Object.values(checklistData).filter(d => d?.checked).length}/{currentStepData.checklist_items.length} completed
                </Badge>
              </h4>
              <div className="space-y-3">
                {currentStepData.checklist_items.map((item, idx) => {
                  // Use item.id if available, otherwise use index as fallback
                  const itemKey = item.id || `item-${idx}`;
                  const itemData = checklistData[itemKey] || {};
                  const isChecked = itemData.checked;
                  
                  return (
                    <Card key={itemKey} className={`border-2 transition-all ${isChecked ? 'border-green-300 bg-green-50/50 dark:bg-green-950/20' : 'border-border/50'}`}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Checkbox and Title Row */}
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => handleChecklistItemToggle(itemKey)}
                              className={`flex-shrink-0 mt-0.5 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                                isChecked 
                                  ? 'bg-green-500 border-green-500 text-white' 
                                  : 'border-gray-300 hover:border-primary'
                              }`}
                            >
                              {isChecked && <Check className="w-4 h-4" />}
                            </button>
                            <div className="flex-1">
                              <p className={`font-medium ${isChecked ? 'text-green-800 dark:text-green-200' : ''}`}>
                                {item.title}
                                {item.is_required && <span className="text-red-500 ml-1">*</span>}
                              </p>
                              
                              {/* Value Input */}
                              {item.requires_value && (
                                <div className="mt-2 flex items-center gap-2">
                                  <Hash className="w-4 h-4 text-muted-foreground" />
                                  <Input
                                    type="text"
                                    value={itemData.value || ''}
                                    onChange={(e) => handleChecklistItemValue(itemKey, e.target.value)}
                                    placeholder={item.value_label || 'Enter value'}
                                    className="flex-1 h-8 text-sm"
                                  />
                                  {item.value_unit && (
                                    <span className="text-sm text-muted-foreground min-w-[40px]">{item.value_unit}</span>
                                  )}
                                </div>
                              )}
                              
                              {/* Photo Upload */}
                              {item.requires_photo && (
                                <div className="mt-2">
                                  <div className="flex items-center gap-2">
                                    <Camera className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">Photo required</span>
                                  </div>
                                  {itemData.photoPreview ? (
                                    <div className="mt-2 relative inline-block">
                                      <img
                                        src={itemData.photoPreview}
                                        alt="Checklist item photo"
                                        className="w-20 h-20 object-cover rounded border"
                                      />
                                      <button
                                        onClick={() => removeChecklistItemPhoto(itemKey)}
                                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <label className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded cursor-pointer hover:bg-muted/80 text-xs">
                                      <Upload className="w-3 h-3" />
                                      Upload Photo
                                      <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleChecklistItemPhoto(itemKey, file);
                                        }}
                                      />
                                    </label>
                                  )}
                                </div>
                              )}
                              
                              {/* Comment */}
                              {item.allows_comment && (
                                <div className="mt-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">Comment (optional)</span>
                                  </div>
                                  <Textarea
                                    value={itemData.comment || ''}
                                    onChange={(e) => handleChecklistItemComment(itemKey, e.target.value)}
                                    placeholder="Add a comment..."
                                    className="text-sm min-h-[60px]"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Parameters to Record - Only for standard steps */}
          {currentStepData.step_type !== 'checklist' && currentStepData.parameters && currentStepData.parameters.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center">
                <Gauge className="w-4 h-4 mr-2" />
                Parameters to Record
              </h4>
              <div className="space-y-4">
                {currentStepData.parameters.map((param, idx) => (
                  <Card key={idx} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Parameter Name */}
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">
                            {param.parameter_name}
                            {param.is_required && <span className="text-red-500 ml-1">*</span>}
                          </h5>
                        </div>

                        {/* Expected vs Observed */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Expected Value */}
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Expected</p>
                            <div className="px-3 py-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                              <div className="flex items-baseline space-x-2">
                                <span className="font-semibold text-green-900 dark:text-green-100">
                                  {param.expected_value}
                                </span>
                                <span className="text-xs text-green-700 dark:text-green-300">
                                  {param.unit}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Observed Value */}
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Observed</p>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                step="any"
                                value={parameterReadings[param.parameter_name]?.value || ''}
                                onChange={(e) => handleParameterValueChange(param.parameter_name, e.target.value)}
                                placeholder="Enter value"
                                className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                              <div className="px-3 py-2 bg-muted rounded-lg border border-border font-medium text-xs min-w-[50px] text-center">
                                {param.unit}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Parameter Photo */}
                        {param.photo_allowed && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">Photo (Optional)</p>
                            <input
                              ref={el => paramPhotoRefs.current[param.parameter_name] = el}
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={(e) => handleParameterPhotoChange(param.parameter_name, e)}
                              className="hidden"
                            />
                            
                            {parameterReadings[param.parameter_name]?.isExternal ? (
                              /* External Photo Mode - Show expected filename */
                              <div className="border-2 border-blue-500 rounded-lg p-3 bg-blue-50">
                                <div className="flex items-start space-x-2 mb-2">
                                  <Smartphone className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-xs font-semibold text-blue-900 mb-1">External Photo</p>
                                    <p className="text-xs text-blue-700">Use this filename on your camera/phone:</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Input
                                    value={`${parameterReadings[param.parameter_name].expectedFilename}.jpg`}
                                    readOnly
                                    className="text-xs font-mono bg-white border-blue-300 text-blue-900"
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyFilenameToClipboard(parameterReadings[param.parameter_name].expectedFilename + '.jpg')}
                                    className="flex-shrink-0 border-blue-500 text-blue-600"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setParameterReadings(prev => ({
                                    ...prev,
                                    [param.parameter_name]: {
                                      ...prev[param.parameter_name],
                                      isExternal: false,
                                      expectedFilename: null
                                    }
                                  }))}
                                  className="w-full mt-2 text-xs text-blue-700 hover:text-blue-900"
                                >
                                  ← Use Device Camera Instead
                                </Button>
                              </div>
                            ) : parameterReadings[param.parameter_name]?.photoPreview ? (
                              /* Photo Captured - Show preview */
                              <div className="relative">
                                <img 
                                  src={parameterReadings[param.parameter_name].photoPreview} 
                                  alt={`${param.parameter_name} proof`}
                                  className="w-full h-32 object-cover rounded border"
                                />
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="absolute top-1 right-1"
                                  onClick={() => removeParameterPhoto(param.parameter_name)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              /* No Photo Yet - Show options */
                              <div className="space-y-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => paramPhotoRefs.current[param.parameter_name]?.click()}
                                  className="w-full"
                                >
                                  <Camera className="w-3 h-3 mr-2" />
                                  Take Photo Now
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => markParameterPhotoAsExternal(param.parameter_name, currentStep + 1, idx)}
                                  className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
                                >
                                  <Smartphone className="w-3 h-3 mr-2" />
                                  Use External Device
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step Photo Documentation */}
          {currentStepData.photo_required && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center">
                <Camera className="w-4 h-4 mr-2" />
                Step Photo Documentation <span className="text-red-500 ml-1">*</span>
              </h4>

              {stepPhotoExternal ? (
                /* External Step Photo Mode */
                <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
                  <div className="flex items-start space-x-3 mb-3">
                    <Smartphone className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-900 mb-1">External Step Photo</p>
                      <p className="text-xs text-blue-700 mb-3">
                        Use this filename when capturing the step documentation photo on your external device:
                      </p>
                      <div className="flex items-center space-x-2">
                        <Input
                          value={`${stepPhotoFilename}.jpg`}
                          readOnly
                          className="text-sm font-mono bg-white border-blue-300 text-blue-900"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => copyFilenameToClipboard(stepPhotoFilename + '.jpg')}
                          className="flex-shrink-0 border-blue-500 text-blue-600"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setStepPhotoExternal(false);
                      setStepPhotoFilename(null);
                    }}
                    className="w-full text-sm text-blue-700 hover:text-blue-900"
                  >
                    ← Use Device Camera Instead
                  </Button>
                </div>
              ) : stepPhotoPreview ? (
                /* Step Photo Captured */
                <div className="relative">
                  <img 
                    src={stepPhotoPreview} 
                    alt="Step documentation" 
                    className="w-full h-64 object-cover rounded-lg border-2 border-border"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={removeStepPhoto}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
              ) : (
                /* No Step Photo Yet - Show three options like offline page */
                <div className="space-y-3">
                  {/* Hidden file input */}
                  <input
                    ref={stepPhotoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleStepPhotoChange}
                    className="hidden"
                  />
                  
                  {/* Primary: Open Camera */}
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => openCameraModal('step')}
                    className="w-full gap-2 bg-amber-600 hover:bg-amber-700"
                  >
                    <Camera className="w-5 h-5" />
                    Open Camera
                  </Button>
                  
                  {/* Secondary options */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={triggerStepPhotoCapture}
                      className="flex-1 gap-2"
                    >
                      <FolderOpen className="w-4 h-4" />
                      Choose from Files
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => markStepPhotoAsExternal(currentStep + 1)}
                      className="flex-1 gap-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                    >
                      <Smartphone className="w-4 h-4" />
                      Mark as External
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    💻 Works on laptops, tablets & phones with camera
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <h4 className="font-semibold mb-2">Additional Notes (Optional)</h4>
            <Textarea
              value={stepNotes}
              onChange={(e) => setStepNotes(e.target.value)}
              placeholder="Enter any observations, measurements, or additional notes for this step..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={pauseTest}
                disabled={isSubmitting}
                className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
              >
                <PauseCircle className="w-4 h-4 mr-2" />
                Pause Test
              </Button>
              <Button
                variant="outline"
                onClick={abortTest}
                disabled={isSubmitting}
                className="border-red-500 text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Abort Test
              </Button>
            </div>

            <div className="flex items-center space-x-3">
              {/* Show editing indicator */}
              {isEditingStep && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                  Editing Step {currentStep + 1}
                </Badge>
              )}
              
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={() => navigateToStep(currentStep - 1)}
                  disabled={isSubmitting}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
              
              {/* Cancel edit button when editing */}
              {isEditingStep && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditingStep(false);
                    // Move to the next incomplete step
                    const nextIncomplete = steps.findIndex((_, idx) => !completedSteps.includes(idx) && !completedStepsData[idx]);
                    if (nextIncomplete >= 0) {
                      navigateToStep(nextIncomplete);
                    }
                  }}
                  disabled={isSubmitting}
                >
                  Cancel Edit
                </Button>
              )}
              
              <Button
                onClick={() => {
                  console.log('[DEBUG] Complete Step clicked');
                  console.log('[DEBUG] Photo preview exists:', !!stepPhotoPreview);
                  console.log('[DEBUG] Photo external:', stepPhotoExternal);
                  console.log('[DEBUG] Photo required:', currentStepData.photo_required);
                  completeStep();
                }}
                disabled={
                  isSubmitting || 
                  (currentStepData.photo_required && !stepPhotoPreview && !stepPhotoExternal) ||
                  (currentStepData.parameters && currentStepData.parameters.some(p => 
                    p.is_required && !parameterReadings[p.parameter_name]?.value
                  ))
                }
                className={`min-w-[150px] ${isEditingStep ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
              >
                {isSubmitting ? (
                  'Processing...'
                ) : isEditingStep ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                ) : currentStep === totalSteps - 1 ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Complete Test
                  </>
                ) : (
                  <>
                    Complete Step
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps Overview - Click to navigate/edit */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">All Steps</CardTitle>
            <p className="text-xs text-muted-foreground">Click completed steps to edit</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.includes(index) || completedStepsData[index];
              const isCurrent = index === currentStep;
              const canNavigate = isCompleted || index <= Math.max(...completedSteps, -1) + 1;
              
              return (
                <div
                  key={index}
                  onClick={() => canNavigate && navigateToStep(index)}
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                    isCompleted
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-500 cursor-pointer hover:bg-green-100'
                      : isCurrent
                      ? 'bg-primary/10 border-primary'
                      : canNavigate
                      ? 'bg-muted border-border cursor-pointer hover:bg-muted/80'
                      : 'bg-muted border-border opacity-50'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isCurrent
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted-foreground/20 text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{step.title}</p>
                    <div className="flex items-center gap-2">
                      {step.estimated_duration && (
                        <p className="text-xs text-muted-foreground">{step.estimated_duration}</p>
                      )}
                      {isCompleted && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                          <Check className="w-3 h-3 mr-1" />
                          {completedStepsData[index]?.notes ? 'Has notes' : 'Completed'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {isCompleted && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-600 hover:text-green-700 hover:bg-green-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateToStep(index);
                      }}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Submit for Review Button - Show when all steps are completed */}
          {(completedSteps.length >= totalSteps || Object.keys(completedStepsData).length >= totalSteps) && (
            <div className="mt-4 pt-4 border-t">
              <Button
                onClick={showCompletionDialog}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Submit Test for Review
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Camera Modal */}
      <Dialog open={showCameraModal} onOpenChange={closeCameraModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Camera Capture</DialogTitle>
            <DialogDescription>
              Position your camera to capture the photo
            </DialogDescription>
          </DialogHeader>
          
          {cameraError ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{cameraError}</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              
              <div className="flex justify-center space-x-2">
                <Button
                  variant="outline"
                  onClick={switchCamera}
                  disabled={!cameraStream}
                >
                  <SwitchCamera className="w-4 h-4 mr-2" />
                  Switch Camera
                </Button>
                <Button
                  onClick={captureFromWebcam}
                  disabled={!cameraStream}
                  className="px-8"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Capture Photo
                </Button>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={closeCameraModal}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Completion Modal - For entering conclusion */}
      <Dialog open={showCompletionModal} onOpenChange={setShowCompletionModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              Complete Test & Submit for Review
            </DialogTitle>
            <DialogDescription>
              All {totalSteps} steps have been completed. Please provide a conclusion summary before submitting.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Summary of completed steps */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Test Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Test Name:</span>
                  <span className="ml-2 font-medium">{test.name || test.test_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Steps Completed:</span>
                  <span className="ml-2 font-medium">{completedSteps.length} / {totalSteps}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Asset:</span>
                  <span className="ml-2 font-medium">{assetName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Parameters Recorded:</span>
                  <span className="ml-2 font-medium">
                    {Object.values(completedStepsData).reduce((acc, step) => 
                      acc + (step?.parameter_readings?.length || 0), 0
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Conclusion Text Area */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Conclusion / Test Summary <span className="text-muted-foreground">(Required)</span>
              </label>
              <Textarea
                value={conclusionText}
                onChange={(e) => setConclusionText(e.target.value)}
                placeholder="Enter your conclusion and observations for this test. This will appear in the final report.

Example:
- Overall equipment condition: Good/Fair/Poor
- Key findings from parameter readings
- Any anomalies or concerns observed
- Recommendations for maintenance/follow-up"
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This conclusion will be included in the test report and reviewed by the approver.
              </p>
            </div>

            {/* Quick Observation Buttons */}
            <div>
              <label className="text-sm font-medium mb-2 block">Quick Add</label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Equipment condition satisfactory',
                  'All parameters within normal limits',
                  'Minor deviation observed',
                  'Requires follow-up inspection',
                  'Maintenance recommended'
                ].map((text) => (
                  <Button
                    key={text}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setConclusionText(prev => 
                      prev ? `${prev}\n• ${text}` : `• ${text}`
                    )}
                  >
                    + {text}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowCompletionModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFinalSubmission}
              disabled={isSubmitting || !conclusionText.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                'Submitting...'
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Submit for Review
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
