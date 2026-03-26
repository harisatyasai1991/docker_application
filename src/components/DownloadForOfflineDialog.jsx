import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { useAPIData } from '../hooks/useAPI';
import { offlineAPI, testsAPI } from '../services/api';
import { offlineStorage } from '../services/offlineDB';
import { LoadingSpinner } from './LoadingStates';
import { toast } from 'sonner';
import { 
  Download, 
  CheckCircle2, 
  HardDrive, 
  FileText,
  Smartphone,
  ShoppingCart,
  X,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Multi-select dropdown for Sales Orders
const SalesOrderMultiSelect = ({ selectedSOs, onChange, salesOrders }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSO = (soId) => {
    if (selectedSOs.includes(soId)) {
      onChange(selectedSOs.filter(id => id !== soId));
    } else {
      onChange([...selectedSOs, soId]);
    }
  };

  const selectedSOsData = salesOrders?.filter(so => selectedSOs.includes(so.so_id)) || [];

  return (
    <div className="space-y-2">
      <div
        className="border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedSOs.length === 0 ? (
          <span className="text-muted-foreground text-sm">Select Sales Orders (required)</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedSOsData.map(so => (
              <Badge key={so.so_id} variant="secondary" className="flex items-center gap-1">
                <ShoppingCart className="w-3 h-3" />
                {so.so_number}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSO(so.so_id);
                  }}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {isOpen && (
        <ScrollArea className="h-48 border rounded-lg p-2">
          {salesOrders?.map(so => (
            <div
              key={so.so_id}
              className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded cursor-pointer"
              onClick={() => toggleSO(so.so_id)}
            >
              <Checkbox
                checked={selectedSOs.includes(so.so_id)}
                onCheckedChange={() => toggleSO(so.so_id)}
              />
              <div className="flex-1">
                <div className="font-medium text-sm">{so.so_number}</div>
                <div className="text-xs text-muted-foreground">{so.customer_name}</div>
                {so.project_name && (
                  <div className="text-xs text-muted-foreground italic">{so.project_name}</div>
                )}
              </div>
            </div>
          ))}
        </ScrollArea>
      )}
    </div>
  );
};

export const DownloadForOfflineDialog = ({ open, onClose, asset }) => {
  const { currentUser, isMaster } = useAuth();
  const [selectedSOs, setSelectedSOs] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch sales orders - only active ones, filtered by company for non-master users
  const { data: salesOrders, loading: soLoading } = useAPIData(
    () => offlineAPI.getSalesOrders({
      status: 'active',
      ...(isMaster && isMaster() ? {} : { company_id: currentUser?.company_id })
    }),
    [currentUser]
  );

  // Fetch tests for this asset type - fallback to all tests if none found
  const { data: tests, loading: testsLoading } = useAPIData(
    async () => {
      const assetType = asset?.asset_type || asset?.category;
      let assetTests = await testsAPI.getByAssetType(assetType);
      
      // If no tests found for this specific asset type, get all tests from catalogue
      if (!assetTests || assetTests.length === 0) {
        assetTests = await testsAPI.getTestCatalogue();
      }
      
      return Array.isArray(assetTests) ? assetTests : [];
    },
    [asset]
  );

  const toggleTest = (testId) => {
    if (selectedTests.includes(testId)) {
      setSelectedTests(selectedTests.filter(id => id !== testId));
    } else {
      setSelectedTests([...selectedTests, testId]);
    }
  };

  const estimateSize = () => {
    // Rough estimation: asset (50KB) + test (20KB each)
    const assetSize = 0.05; // MB
    const testSize = selectedTests.length * 0.02; // MB
    return (assetSize + testSize).toFixed(2);
  };

  const getDeviceInfo = () => {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      onLine: navigator.onLine,
    };
  };

  const handleDownload = async () => {
    // Validation
    if (selectedSOs.length === 0) {
      toast.error('Please select at least one Sales Order');
      return;
    }
    if (selectedTests.length === 0) {
      toast.error('Please select at least one test');
      return;
    }

    setIsDownloading(true);
    try {
      // Create offline session
      const sessionData = {
        asset_id: asset.asset_id,
        user_name: currentUser?.full_name || currentUser?.username || 'Unknown',
        user_id: currentUser?.user_id,
        sales_orders: selectedSOs,
        selected_tests: selectedTests,
        device_info: getDeviceInfo(),
      };

      let session;
      try {
        session = await offlineAPI.createSession(sessionData);
      } catch (sessionError) {
        // Handle rrweb clone error specifically
        if (sessionError?.message?.includes('clone')) {
          console.warn('Retrying session creation due to clone error...');
          // Wait a moment and retry
          await new Promise(resolve => setTimeout(resolve, 100));
          session = await offlineAPI.createSession(sessionData);
        } else {
          throw sessionError;
        }
      }

      // Lock the asset for offline testing
      try {
        await offlineAPI.lockAsset(asset.asset_id, {
          session_id: session.session_id,
          locked_by: currentUser?.full_name || currentUser?.username || 'Unknown'
        });
      } catch (lockError) {
        // Handle rrweb clone error or other lock errors gracefully
        if (!lockError?.message?.includes('clone')) {
          console.warn('Failed to lock asset:', lockError);
        }
        // Continue even if lock fails - asset might already be locked
      }

      // Save to IndexedDB with version hash for sync reference
      await offlineStorage.saveSession({
        ...session,
        version_hash: session.version_hash || session.data_snapshot?.asset?.version_hash
      });
      await offlineStorage.saveAsset(session.data_snapshot.asset);
      await offlineStorage.saveTests(session.data_snapshot.tests);

      // Check storage
      const storageInfo = await offlineStorage.getStorageEstimate();
      console.log('Storage after download:', storageInfo);

      // === NEW: Also download as JSON file for portable offline use ===
      const offlineFileData = {
        session_id: session.session_id,
        version_hash: session.version_hash || session.data_snapshot?.asset?.version_hash,
        asset: session.data_snapshot.asset,
        tests: session.data_snapshot.tests,
        sales_orders: selectedSOs,
        created_at: new Date().toISOString(),
        created_by: currentUser?.full_name || currentUser?.username,
        file_version: '1.0',
        instructions: 'Load this file in the Offline Testing page (/offline-testing) to conduct tests without internet.'
      };

      const blob = new Blob([JSON.stringify(offlineFileData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `offline_${asset.asset_id}_${session.session_id}.json`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);

      toast.success(
        <div>
          <div className="font-semibold">Downloaded for Offline Testing</div>
          <div className="text-xs mt-1">Session ID: {session.session_id}</div>
          <div className="text-xs text-green-600 mt-1">JSON file saved to your device</div>
          <div className="text-xs text-amber-600 mt-1">Asset is now locked for editing</div>
        </div>
      );

      onClose();
      // Refresh page to show lock indicator
      window.location.reload();
    } catch (error) {
      console.error('Download error:', error);
      // Better error message handling for rrweb clone errors
      let errorMsg = 'Failed to download for offline';
      if (error?.message) {
        if (error.message.includes('clone')) {
          errorMsg = 'Network issue detected. Please try again.';
        } else {
          errorMsg = error.message;
        }
      } else if (error?.response?.data?.detail) {
        errorMsg = error.response.data.detail;
      }
      toast.error(errorMsg);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Download for Offline Testing
          </DialogTitle>
          <DialogDescription>
            Download asset data and tests for offline field work
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable content area with visible scrollbar */}
        <div 
          className="flex-1 overflow-y-auto min-h-0" 
          style={{ 
            maxHeight: 'calc(85vh - 180px)',
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 #f1f5f9'
          }}
        >
          <div className="space-y-6 py-4">
            {/* Asset Info */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2">Asset Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>{' '}
                  <span className="font-medium">{asset?.asset_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">ID:</span>{' '}
                  <span className="font-medium">{asset?.asset_id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>{' '}
                  <span className="font-medium">{asset?.asset_type || asset?.category}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Location:</span>{' '}
                  <span className="font-medium">{asset?.location || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Sales Orders Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Sales Orders <span className="text-destructive">*</span>
              </Label>
              {soLoading ? (
                <div className="flex items-center justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              ) : (
                <SalesOrderMultiSelect
                  selectedSOs={selectedSOs}
                  onChange={setSelectedSOs}
                  salesOrders={salesOrders}
                />
              )}
              <p className="text-xs text-muted-foreground">
                Select one or more sales orders for this offline session
              </p>
            </div>

            {/* Tests Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Test Templates <span className="text-destructive">*</span>
              </Label>
              {testsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              ) : tests && tests.length > 0 ? (
                <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                  {tests.map(test => (
                    <div
                      key={test.test_id}
                      className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded cursor-pointer"
                      onClick={() => toggleTest(test.test_id)}
                    >
                      <Checkbox
                        checked={selectedTests.includes(test.test_id)}
                        onCheckedChange={() => toggleTest(test.test_id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{test.test_name || test.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {test.parameters?.length || 0} parameters • {test.sop_steps?.length || 0} steps
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border rounded-lg border-dashed">
                  <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No tests available for this asset type</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Select tests you plan to conduct offline
              </p>
            </div>

            {/* Storage Estimate */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <HardDrive className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="flex-1 text-sm text-blue-900">
                  <div className="font-medium mb-1">Storage Estimate</div>
                  <div className="text-xs space-y-1">
                    <div>Asset data: ~0.05 MB</div>
                    <div>Tests: ~{(selectedTests.length * 0.02).toFixed(2)} MB ({selectedTests.length} test{selectedTests.length !== 1 ? 's' : ''})</div>
                    <div className="font-medium pt-1 border-t border-blue-300">
                      Total: ~{estimateSize()} MB
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Device Info */}
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              <span>Device: {navigator.platform} • {navigator.onLine ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>

        {/* Actions - Fixed at bottom */}
        <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t mt-2">
          <Button variant="outline" onClick={onClose} disabled={isDownloading}>
            Cancel
          </Button>
          <Button onClick={handleDownload} disabled={isDownloading || selectedSOs.length === 0 || selectedTests.length === 0}>
            {isDownloading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download for Offline
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
