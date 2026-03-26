import React, { useEffect } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { offlineStorage } from '../services/offlineDB';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  WifiOff, 
  Wifi, 
  AlertCircle, 
  CheckCircle2,
  HardDrive,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

export const OfflineModeBanner = ({ onSyncClick }) => {
  const { isOnline, isOffline, wasOffline, resetOfflineFlag } = useNetworkStatus();
  const [pendingItems, setPendingItems] = React.useState(0);
  const [storageInfo, setStorageInfo] = React.useState(null);

  // Check pending sync items
  useEffect(() => {
    const checkPendingItems = async () => {
      try {
        const queue = await offlineStorage.getSyncQueue();
        const pendingExecutions = await offlineStorage.getAllPendingTestExecutions();
        setPendingItems(queue.length + pendingExecutions.length);
      } catch (error) {
        console.error('Failed to check pending items:', error);
      }
    };

    checkPendingItems();
    
    // Check every 10 seconds
    const intervalId = setInterval(checkPendingItems, 10000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Check storage usage
  useEffect(() => {
    const checkStorage = async () => {
      const info = await offlineStorage.getStorageEstimate();
      setStorageInfo(info);
    };

    checkStorage();
  }, []);

  // Show toast when coming back online
  useEffect(() => {
    if (wasOffline && isOnline && pendingItems > 0) {
      toast.success(
        <div>
          <div className="font-semibold">Back Online!</div>
          <div className="text-xs mt-1">You have {pendingItems} item(s) ready to sync</div>
        </div>,
        {
          duration: 5000,
          action: onSyncClick ? {
            label: 'Sync Now',
            onClick: onSyncClick,
          } : undefined,
        }
      );
      resetOfflineFlag();
    }
  }, [wasOffline, isOnline, pendingItems, resetOfflineFlag, onSyncClick]);

  // Don't show banner if online and no pending items
  if (isOnline && pendingItems === 0) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50">
      {isOffline ? (
        // Offline Mode Banner
        <Alert className="rounded-none border-x-0 border-t-0 bg-orange-50 border-orange-200">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-orange-600" />
                <span className="font-semibold text-orange-900">Offline Mode Active</span>
              </div>
              <Badge variant="outline" className="bg-orange-100 border-orange-300 text-orange-900">
                No Internet Connection
              </Badge>
              {pendingItems > 0 && (
                <div className="text-sm text-orange-800">
                  {pendingItems} item(s) pending sync
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-orange-700">
              <HardDrive className="w-3 h-3" />
              {storageInfo && (
                <span>{storageInfo.usageInMB} MB / {storageInfo.quotaInMB} MB used</span>
              )}
            </div>
          </AlertDescription>
        </Alert>
      ) : pendingItems > 0 ? (
        // Ready to Sync Banner
        <Alert className="rounded-none border-x-0 border-t-0 bg-blue-50 border-blue-200">
          <CheckCircle2 className="h-4 w-4 text-blue-600" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-blue-900">Online - Ready to Sync</span>
              </div>
              <Badge variant="outline" className="bg-blue-100 border-blue-300 text-blue-900">
                {pendingItems} item(s) pending
              </Badge>
            </div>
            {onSyncClick && (
              <Button 
                size="sm" 
                onClick={onSyncClick}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="w-3 h-3 mr-2" />
                Sync Now
              </Button>
            )}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
};
