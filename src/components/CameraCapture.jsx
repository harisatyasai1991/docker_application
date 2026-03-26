/**
 * Camera Capture Dialog Component
 * Uses MediaDevices API for direct camera access with live preview
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Camera, X, RefreshCw, Check, AlertTriangle } from 'lucide-react';

export function CameraCapture({ 
  open, 
  onOpenChange, 
  onCapture, 
  title = "Take Photo",
  description = "Position the subject in the camera view and tap capture"
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  
  const [hasPermission, setHasPermission] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' = back camera, 'user' = front
  const [capturedImage, setCapturedImage] = useState(null);

  // Start camera stream
  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setHasPermission(true);
      setIsLoading(false);
    } catch (err) {
      console.error('Camera error:', err);
      setHasPermission(false);
      setIsLoading(false);
      
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is in use by another application.');
      } else {
        setError(`Camera error: ${err.message}`);
      }
    }
  }, [facingMode]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Start camera when dialog opens
  useEffect(() => {
    if (open) {
      setCapturedImage(null);
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => stopCamera();
  }, [open, startCamera, stopCamera]);

  // Switch camera (front/back)
  const switchCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  // Capture photo from video stream
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageDataUrl);
  };

  // Confirm and return captured image
  const confirmCapture = () => {
    if (capturedImage && onCapture) {
      onCapture(capturedImage);
      onOpenChange(false);
    }
  };

  // Retake photo
  const retakePhoto = () => {
    setCapturedImage(null);
  };

  // Handle close
  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Camera className="h-5 w-5 text-cyan-500" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative bg-black aspect-video">
          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Loading state */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="text-center text-white">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm">Starting camera...</p>
              </div>
            </div>
          )}
          
          {/* Error state */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black p-6">
              <div className="text-center text-white max-w-sm">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
                <p className="text-sm mb-4">{error}</p>
                <Button 
                  variant="outline" 
                  onClick={startCamera}
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          )}
          
          {/* Video preview (hidden when image captured) */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${capturedImage ? 'hidden' : ''}`}
          />
          
          {/* Captured image preview */}
          {capturedImage && (
            <img 
              src={capturedImage} 
              alt="Captured" 
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Camera switch button (only when camera is active) */}
          {hasPermission && !capturedImage && !isLoading && (
            <Button
              variant="ghost"
              size="icon"
              onClick={switchCamera}
              className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white rounded-full"
              title="Switch camera"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="p-4 flex items-center justify-center gap-3 bg-muted/50">
          {!capturedImage ? (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-border"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={capturePhoto}
                disabled={!hasPermission || isLoading}
                className="bg-cyan-600 hover:bg-cyan-700 min-w-[140px]"
              >
                <Camera className="h-4 w-4 mr-2" />
                Capture
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={retakePhoto}
                className="border-border"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retake
              </Button>
              <Button
                onClick={confirmCapture}
                className="bg-green-600 hover:bg-green-700 min-w-[140px]"
              >
                <Check className="h-4 w-4 mr-2" />
                Use Photo
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CameraCapture;
