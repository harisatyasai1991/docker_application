import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { DMSLogo } from '../components/DMSLogo';
import { testExecutionAPI } from '../services/api';
import { 
  Upload,
  FolderOpen,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  File,
  Search,
  X,
  Eye,
  Activity,
  LogOut,
  Link2,
  Link2Off,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

export const PhotoSyncPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [testExecutions, setTestExecutions] = useState([]);
  const [isLoadingExecutions, setIsLoadingExecutions] = useState(false);
  const [matchResults, setMatchResults] = useState(null);
  const [isMatching, setIsMatching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [uploadComplete, setUploadComplete] = useState(false);

  // Load test executions on mount
  useEffect(() => {
    loadTestExecutions();
  }, []);

  // Load recent test executions from backend
  const loadTestExecutions = async () => {
    setIsLoadingExecutions(true);
    try {
      const executions = await testExecutionAPI.getAll({ days: 30, limit: 100 });
      setTestExecutions(executions);
      console.log('Loaded test executions:', executions.length);
    } catch (error) {
      toast.error('Failed to load test executions');
      console.error(error);
    } finally {
      setIsLoadingExecutions(false);
    }
  };

  // Parse filename to extract components
  const parseFilename = (filename) => {
    // Expected format: ASSETCODE-TESTCODE-S##-P##-TIMESTAMP.jpg
    // Example: TRANSFORMER-IR-S03-P01-20241121-143052.jpg
    const regex = /^([A-Z0-9]+)-([A-Z0-9]+)-S(\d+)(?:-P(\d+))?-(\d{8})-(\d{6})\.(jpg|jpeg|png|heic|tif|tiff)$/i;
    const match = filename.match(regex);
    
    if (!match) return null;
    
    return {
      assetCode: match[1],
      testCode: match[2],
      stepNumber: parseInt(match[3]),
      paramNumber: match[4] ? parseInt(match[4]) : null, // null means step photo
      date: match[5],
      time: match[6],
      extension: match[7],
      isStepPhoto: !match[4],
      isParameterPhoto: !!match[4]
    };
  };

  // Handle file selection
  const handleFileSelection = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
    toast.success(`${files.length} files selected`);
  };

  // Scan and parse files
  const scanFiles = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files first');
      return;
    }

    setIsScanning(true);
    
    try {
      const results = {
        totalFiles: selectedFiles.length,
        validPhotos: [],
        invalidPhotos: [],
        byAsset: {},
        byTest: {}
      };

      // Parse each file
      selectedFiles.forEach(file => {
        const parsed = parseFilename(file.name);
        
        if (parsed) {
          const photoInfo = {
            file: file,
            filename: file.name,
            size: file.size,
            sizeFormatted: formatFileSize(file.size),
            parsed: parsed,
            preview: URL.createObjectURL(file)
          };
          
          results.validPhotos.push(photoInfo);
          
          // Group by asset
          if (!results.byAsset[parsed.assetCode]) {
            results.byAsset[parsed.assetCode] = [];
          }
          results.byAsset[parsed.assetCode].push(photoInfo);
          
          // Group by test
          const testKey = `${parsed.assetCode}-${parsed.testCode}`;
          if (!results.byTest[testKey]) {
            results.byTest[testKey] = [];
          }
          results.byTest[testKey].push(photoInfo);
          
        } else {
          results.invalidPhotos.push({
            file: file,
            filename: file.name,
            reason: 'Invalid filename format'
          });
        }
      });

      setScanResults(results);
      toast.success(`Scan complete: ${results.validPhotos.length} valid, ${results.invalidPhotos.length} invalid`);
      
    } catch (error) {
      toast.error('Scan failed: ' + error.message);
      console.error(error);
    } finally {
      setIsScanning(false);
    }
  };

  // Match photos to test executions
  const matchPhotosToTests = async () => {
    if (!scanResults || scanResults.validPhotos.length === 0) {
      toast.error('No valid photos to match');
      return;
    }

    if (testExecutions.length === 0) {
      toast.error('No test executions found. Please conduct some tests first.');
      return;
    }

    setIsMatching(true);

    try {
      const results = {
        matched: [],
        unmatched: [],
        missingPhotos: [],
        testSummary: {}
      };

      // For each valid photo, try to match it to a test execution
      scanResults.validPhotos.forEach(photo => {
        const { parsed } = photo;
        
        // Find matching test execution
        const matchingExecution = testExecutions.find(exec => {
          // Match by asset_id and test_code
          const assetMatches = exec.asset_id.toUpperCase().includes(parsed.assetCode.toUpperCase());
          const testMatches = exec.test_code.toUpperCase().includes(parsed.testCode.toUpperCase());
          return assetMatches && testMatches;
        });

        if (matchingExecution) {
          // Found a match! Now find the specific step
          const step = matchingExecution.steps_completed?.find(s => s.step_number === parsed.stepNumber);
          
          if (step) {
            // Check if it's a parameter photo or step photo
            let matchType = null;
            let expectedFilename = null;

            if (parsed.isParameterPhoto && parsed.paramNumber) {
              // Try to match parameter
              const param = step.parameter_readings?.find((p, idx) => idx + 1 === parsed.paramNumber);
              if (param) {
                matchType = 'parameter';
                expectedFilename = param.photo_expected_filename;
              }
            } else if (parsed.isStepPhoto) {
              matchType = 'step';
              expectedFilename = step.step_photo_expected_filename;
            }

            results.matched.push({
              photo: photo,
              execution: matchingExecution,
              step: step,
              matchType: matchType,
              expectedFilename: expectedFilename,
              confidence: 100
            });

            // Track by test
            const testKey = matchingExecution.execution_id;
            if (!results.testSummary[testKey]) {
              results.testSummary[testKey] = {
                execution: matchingExecution,
                photos: []
              };
            }
            results.testSummary[testKey].photos.push(photo);

          } else {
            // Execution found but step not completed yet
            results.unmatched.push({
              photo: photo,
              reason: `Step ${parsed.stepNumber} not found in test execution`,
              possibleMatch: matchingExecution
            });
          }
        } else {
          // No matching execution found
          results.unmatched.push({
            photo: photo,
            reason: 'No matching test execution found',
            possibleMatch: null
          });
        }
      });

      // Check for missing photos in test executions
      testExecutions.forEach(exec => {
        exec.steps_completed?.forEach(step => {
          // Check step photo
          if (step.step_photo_is_external && step.step_photo_expected_filename) {
            const hasPhoto = results.matched.some(m => 
              m.execution.execution_id === exec.execution_id &&
              m.step.step_number === step.step_number &&
              m.matchType === 'step'
            );
            if (!hasPhoto) {
              results.missingPhotos.push({
                execution: exec,
                step: step,
                type: 'step',
                expectedFilename: step.step_photo_expected_filename
              });
            }
          }

          // Check parameter photos
          step.parameter_readings?.forEach((param, idx) => {
            if (param.photo_is_external && param.photo_expected_filename) {
              const hasPhoto = results.matched.some(m =>
                m.execution.execution_id === exec.execution_id &&
                m.step.step_number === step.step_number &&
                m.matchType === 'parameter'
              );
              if (!hasPhoto) {
                results.missingPhotos.push({
                  execution: exec,
                  step: step,
                  parameter: param,
                  type: 'parameter',
                  expectedFilename: param.photo_expected_filename
                });
              }
            }
          });
        });
      });

      setMatchResults(results);
      toast.success(`Matched ${results.matched.length} photos to ${Object.keys(results.testSummary).length} tests`);

    } catch (error) {
      toast.error('Matching failed: ' + error.message);
      console.error(error);
    } finally {
      setIsMatching(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Upload matched photos
  const uploadPhotos = async () => {
    if (!matchResults || matchResults.matched.length === 0) {
      toast.error('No photos to upload');
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: matchResults.matched.length });

    try {
      // Prepare photos data for upload
      const photosToUpload = [];
      
      for (let i = 0; i < matchResults.matched.length; i++) {
        const match = matchResults.matched[i];
        
        // Read file as base64
        const photoBase64 = await readFileAsBase64(match.photo.file);
        
        // Determine photo type and prepare data
        const photoData = {
          execution_id: match.execution.execution_id,
          step_number: match.step.step_number,
          photo_type: match.matchType,
          photo_base64: photoBase64
        };
        
        // Add parameter name if it's a parameter photo
        if (match.matchType === 'parameter') {
          // Find parameter name from step
          const paramIndex = match.photo.parsed.paramNumber - 1;
          const param = match.step.parameter_readings?.[paramIndex];
          if (param) {
            photoData.parameter_name = param.parameter_name;
          }
        }
        
        photosToUpload.push(photoData);
        
        // Update progress
        setUploadProgress({ current: i + 1, total: matchResults.matched.length });
      }
      
      // Send to backend
      const response = await testExecutionAPI.syncExternalPhotos({
        photos: photosToUpload
      });
      
      console.log('Upload response:', response);
      
      if (response.success_count > 0) {
        toast.success(`Successfully uploaded ${response.success_count} photos!`);
        setUploadComplete(true);
      }
      
      if (response.failed_count > 0) {
        toast.warning(`${response.failed_count} photos failed to upload`);
        console.error('Failed uploads:', response.results.failed);
      }
      
    } catch (error) {
      toast.error('Upload failed: ' + error.message);
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  // Helper to read file as base64
  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Reset and start over
  const resetScan = () => {
    setSelectedFiles([]);
    setScanResults(null);
    setMatchResults(null);
    setPreviewPhoto(null);
    setUploadComplete(false);
    setUploadProgress({ current: 0, total: 0 });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <DMSLogo size="sm" />
              <div className="border-l border-border h-8 mx-2" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Photo Sync</h1>
                <p className="text-xs text-muted-foreground">Upload external device photos</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
              >
                Back to Dashboard
              </Button>
              <Button 
                variant="outline" 
                onClick={onLogout}
                className="transition-smooth hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {!scanResults ? (
          /* Step 1: File Selection */
          <div className="max-w-3xl mx-auto">
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <Upload className="w-6 h-6 mr-3 text-primary" />
                  Select Photos to Sync
                </CardTitle>
                <CardDescription>
                  Choose photos from your device, PD recorder, or camera storage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* File Input */}
                <div>
                  <input
                    type="file"
                    id="photo-files"
                    multiple
                    accept="image/*,.jpg,.jpeg,.png,.heic,.tif,.tiff"
                    onChange={handleFileSelection}
                    className="hidden"
                  />
                  
                  <div
                    onClick={() => document.getElementById('photo-files').click()}
                    className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:bg-muted/50 transition"
                  >
                    <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                      {selectedFiles.length > 0 ? `${selectedFiles.length} files selected` : 'Select photos'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Click to browse files or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supported: JPG, PNG, HEIC, TIF
                    </p>
                  </div>
                </div>

                {/* Selected Files Preview */}
                {selectedFiles.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center justify-between">
                      <span>Selected Files ({selectedFiles.length})</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetScan}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Clear
                      </Button>
                    </h4>
                    <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-3">
                      {selectedFiles.slice(0, 10).map((file, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-sm">
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="flex-1 truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                      ))}
                      {selectedFiles.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center pt-2">
                          ...and {selectedFiles.length - 10} more
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Scan Button */}
                <Button
                  onClick={scanFiles}
                  disabled={selectedFiles.length === 0 || isScanning}
                  className="w-full h-12 text-base"
                  size="lg"
                >
                  {isScanning ? (
                    <>
                      <Activity className="w-5 h-5 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Scan & Parse Filenames
                    </>
                  )}
                </Button>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-sm text-blue-900 mb-2">Expected Filename Format:</h4>
                  <p className="text-xs font-mono text-blue-800 mb-2">
                    ASSET-TEST-S##-P##-YYYYMMDD-HHMMSS.jpg
                  </p>
                  <p className="text-xs text-blue-700">
                    Example: <span className="font-mono">TRANSFORMER-IR-S03-P01-20241121-143052.jpg</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Step 2: Scan Results */
          <div className="space-y-6">
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Files</p>
                      <p className="text-3xl font-bold">{scanResults.totalFiles}</p>
                    </div>
                    <File className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-500 bg-green-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700">Valid Photos</p>
                      <p className="text-3xl font-bold text-green-900">{scanResults.validPhotos.length}</p>
                    </div>
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-500 bg-orange-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-700">Invalid Files</p>
                      <p className="text-3xl font-bold text-orange-900">{scanResults.invalidPhotos.length}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Valid Photos List */}
            {scanResults.validPhotos.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Valid Photos ({scanResults.validPhotos.length})</CardTitle>
                      <CardDescription>Photos with correct filename format</CardDescription>
                    </div>
                    <Button
                      onClick={resetScan}
                      variant="outline"
                      size="sm"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Start Over
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {scanResults.validPhotos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                      >
                        {/* Thumbnail */}
                        <img
                          src={photo.preview}
                          alt={photo.filename}
                          className="w-16 h-16 object-cover rounded border cursor-pointer"
                          onClick={() => setPreviewPhoto(photo)}
                        />
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{photo.filename}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {photo.parsed.assetCode}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {photo.parsed.testCode}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Step {photo.parsed.stepNumber}
                            </Badge>
                            {photo.parsed.isParameterPhoto && (
                              <Badge variant="outline" className="text-xs">
                                Param {photo.parsed.paramNumber}
                              </Badge>
                            )}
                            {photo.parsed.isStepPhoto && (
                              <Badge variant="secondary" className="text-xs">
                                Step Photo
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Size */}
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{photo.sizeFormatted}</p>
                        </div>

                        {/* Preview Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewPhoto(photo)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Invalid Photos List */}
            {scanResults.invalidPhotos.length > 0 && (
              <Card className="border-orange-500">
                <CardHeader>
                  <CardTitle className="text-orange-900">Invalid Files ({scanResults.invalidPhotos.length})</CardTitle>
                  <CardDescription>These files don't match the expected filename format</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {scanResults.invalidPhotos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-3 p-3 border border-orange-300 bg-orange-50 rounded-lg"
                      >
                        <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-orange-900 truncate">{photo.filename}</p>
                          <p className="text-xs text-orange-700">{photo.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Next Step Button */}
            {scanResults.validPhotos.length > 0 && !matchResults && (
              <div className="flex justify-end">
                <Button
                  size="lg"
                  className="text-base"
                  onClick={matchPhotosToTests}
                  disabled={isMatching || isLoadingExecutions}
                >
                  {isMatching ? (
                    <>
                      <Activity className="w-5 h-5 mr-2 animate-spin" />
                      Matching...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-5 h-5 mr-2" />
                      Match Photos to Tests
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Matching Results */}
            {matchResults && (
              <div className="space-y-6 mt-8">
                <Separator />
                
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">Matching Results</h2>
                  <p className="text-muted-foreground">Photos matched to test execution records</p>
                </div>

                {/* Match Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-green-500 bg-green-50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-700">Matched</p>
                          <p className="text-3xl font-bold text-green-900">{matchResults.matched.length}</p>
                        </div>
                        <Link2 className="w-8 h-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-orange-500 bg-orange-50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-orange-700">Unmatched</p>
                          <p className="text-3xl font-bold text-orange-900">{matchResults.unmatched.length}</p>
                        </div>
                        <Link2Off className="w-8 h-8 text-orange-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-red-500 bg-red-50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-red-700">Missing</p>
                          <p className="text-3xl font-bold text-red-900">{matchResults.missingPhotos.length}</p>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tests with Matched Photos */}
                {Object.keys(matchResults.testSummary).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Tests with Matched Photos ({Object.keys(matchResults.testSummary).length})</CardTitle>
                      <CardDescription>Photos successfully matched to test execution records</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(matchResults.testSummary).map(([testKey, testData]) => (
                          <Card key={testKey} className="border-green-200 bg-green-50/50">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="font-semibold text-lg">{testData.execution.test_name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Asset: {testData.execution.asset_name} | 
                                    Conducted by: {testData.execution.conducted_by}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Execution ID: {testData.execution.execution_id}
                                  </p>
                                </div>
                                <Badge variant="outline" className="border-green-600 text-green-700">
                                  {testData.photos.length} {testData.photos.length === 1 ? 'photo' : 'photos'}
                                </Badge>
                              </div>
                              
                              {/* Photos for this test */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {testData.photos.map((photo, idx) => (
                                  <div
                                    key={idx}
                                    className="relative group cursor-pointer"
                                    onClick={() => setPreviewPhoto(photo)}
                                  >
                                    <img
                                      src={photo.preview}
                                      alt={photo.filename}
                                      className="w-full h-24 object-cover rounded border-2 border-green-300"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded">
                                      <Eye className="w-5 h-5 text-white" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Unmatched Photos */}
                {matchResults.unmatched.length > 0 && (
                  <Card className="border-orange-500">
                    <CardHeader>
                      <CardTitle className="text-orange-900">Unmatched Photos ({matchResults.unmatched.length})</CardTitle>
                      <CardDescription>These photos could not be matched to test executions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {matchResults.unmatched.map((item, idx) => (
                          <div key={idx} className="flex items-center space-x-3 p-3 border border-orange-300 bg-orange-50 rounded-lg">
                            <img
                              src={item.photo.preview}
                              alt={item.photo.filename}
                              className="w-16 h-16 object-cover rounded border cursor-pointer"
                              onClick={() => setPreviewPhoto(item.photo)}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-orange-900">{item.photo.filename}</p>
                              <p className="text-xs text-orange-700 mt-1">{item.reason}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Missing Photos */}
                {matchResults.missingPhotos.length > 0 && (
                  <Card className="border-red-500">
                    <CardHeader>
                      <CardTitle className="text-red-900">Missing Photos ({matchResults.missingPhotos.length})</CardTitle>
                      <CardDescription>These photos were expected but not found in your selection</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {matchResults.missingPhotos.map((item, idx) => (
                          <div key={idx} className="flex items-center space-x-3 p-3 border border-red-300 bg-red-50 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-red-900">
                                {item.execution.test_name} - Step {item.step.step_number}
                                {item.type === 'parameter' && ` - ${item.parameter.parameter_name}`}
                              </p>
                              <p className="text-xs text-red-700 font-mono mt-1">
                                Expected: {item.expectedFilename}.jpg
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Upload Progress */}
                {isUploading && (
                  <Card className="border-blue-500 bg-blue-50">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <Activity className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
                        <h3 className="text-lg font-semibold mb-2">Uploading Photos...</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {uploadProgress.current} of {uploadProgress.total} photos uploaded
                        </p>
                        <Progress 
                          value={(uploadProgress.current / uploadProgress.total) * 100} 
                          className="h-2"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Upload Complete */}
                {uploadComplete && (
                  <Card className="border-green-500 bg-green-50">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-600" />
                        <h3 className="text-2xl font-bold text-green-900 mb-2">Upload Complete! 🎉</h3>
                        <p className="text-green-700 mb-4">
                          All {matchResults.matched.length} photos have been successfully synced to their test execution records.
                        </p>
                        <div className="flex items-center justify-center space-x-3">
                          <Button
                            variant="outline"
                            onClick={() => navigate('/dashboard')}
                          >
                            Back to Dashboard
                          </Button>
                          <Button
                            onClick={resetScan}
                          >
                            Sync More Photos
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                {!uploadComplete && (
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={resetScan}
                      disabled={isUploading}
                    >
                      Start Over
                    </Button>
                    
                    <Button
                      size="lg"
                      disabled={matchResults.matched.length === 0 || isUploading}
                      onClick={uploadPhotos}
                    >
                      {isUploading ? (
                        <>
                          <Activity className="w-5 h-5 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 mr-2" />
                          Upload {matchResults.matched.length} Photos
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="max-w-4xl w-full bg-white rounded-lg overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <p className="font-semibold">{previewPhoto.filename}</p>
                <p className="text-sm text-muted-foreground">
                  {previewPhoto.parsed.assetCode} - {previewPhoto.parsed.testCode} - 
                  Step {previewPhoto.parsed.stepNumber}
                  {previewPhoto.parsed.isParameterPhoto && ` - Param ${previewPhoto.parsed.paramNumber}`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewPhoto(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4">
              <img
                src={previewPhoto.preview}
                alt={previewPhoto.filename}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
