import { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { offlineStorage } from '../services/offlineDB';
import { testExecutionAPI } from '../services/api';
import { toast } from 'sonner';
import { Cloud, HardDrive, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

/**
 * Hook to manage automatic syncing of offline data when connectivity is restored
 */
export const useSyncEngine = () => {
  const { isOnline, wasOffline, resetOfflineFlag } = useNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const [pendingCount, setPendingCount] = useState(0);

  // Check for pending data
  const checkPendingData = useCallback(async () => {
    try {
      const pendingExecutions = await offlineStorage.getAllPendingTestExecutions();
      setPendingCount(pendingExecutions.length);
      return pendingExecutions.length;
    } catch (error) {
      console.error('Failed to check pending data:', error);
      return 0;
    }
  }, []);

  // Sync a single test execution
  const syncTestExecution = async (execution) => {
    try {
      console.log('Syncing execution:', execution.execution_id);
      
      // Prepare data for server
      const syncData = {
        test_id: execution.test_id,
        test_code: execution.test_code,
        test_name: execution.test_name,
        asset_id: execution.asset_id,
        asset_name: execution.asset_name,
        conducted_by: execution.conducted_by,
        total_steps: execution.total_steps,
        start_time: execution.start_time,
        status: execution.status,
        steps_completed: execution.steps_completed || [],
      };

      // Start the execution on server if it doesn't exist
      // The server will use the offline execution_id if provided
      const response = await testExecutionAPI.syncOfflineExecution({
        ...syncData,
        offline_execution_id: execution.execution_id,
        session_id: execution.session_id,
      });

      console.log('✓ Synced execution:', response);
      
      // Mark as synced in IndexedDB
      const dbEntry = await offlineStorage.getTestExecution(execution.execution_id);
      if (dbEntry) {
        await offlineStorage.markAsSynced('test_executions', dbEntry.id);
      }

      return { success: true, execution_id: response.execution_id };
    } catch (error) {
      console.error('Failed to sync execution:', error);
      return { success: false, error: error.message };
    }
  };

  // Main sync function
  const syncPendingData = useCallback(async () => {
    if (isSyncing || !isOnline) return;

    setIsSyncing(true);
    
    try {
      const pendingExecutions = await offlineStorage.getAllPendingTestExecutions();
      
      if (pendingExecutions.length === 0) {
        console.log('No pending data to sync');
        setIsSyncing(false);
        return;
      }

      console.log(`Starting sync: ${pendingExecutions.length} test executions`);
      
      // Show sync started toast
      toast.info(
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <div>
            <div className="font-semibold">Syncing Offline Data</div>
            <div className="text-xs">{pendingExecutions.length} test execution(s) to sync</div>
          </div>
        </div>,
        { duration: 3000 }
      );

      setSyncProgress({ current: 0, total: pendingExecutions.length });

      let successCount = 0;
      let failCount = 0;

      // Sync each execution
      for (let i = 0; i < pendingExecutions.length; i++) {
        const execution = pendingExecutions[i];
        setSyncProgress({ current: i + 1, total: pendingExecutions.length });

        const result = await syncTestExecution(execution);
        
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      // Show completion toast
      if (successCount > 0 && failCount === 0) {
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <div>
              <div className="font-semibold">Sync Complete</div>
              <div className="text-xs">{successCount} test execution(s) synced successfully</div>
            </div>
          </div>,
          { duration: 5000 }
        );
      } else if (successCount > 0 && failCount > 0) {
        toast.warning(
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <div>
              <div className="font-semibold">Sync Partially Complete</div>
              <div className="text-xs">{successCount} synced, {failCount} failed</div>
            </div>
          </div>,
          { duration: 5000 }
        );
      } else {
        toast.error(
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <div>
              <div className="font-semibold">Sync Failed</div>
              <div className="text-xs">Failed to sync offline data. Will retry later.</div>
            </div>
          </div>,
          { duration: 5000 }
        );
      }

      // Update pending count
      await checkPendingData();
      
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Sync failed. Will retry automatically.');
    } finally {
      setIsSyncing(false);
      setSyncProgress({ current: 0, total: 0 });
    }
  }, [isSyncing, isOnline, checkPendingData]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (wasOffline && isOnline) {
      console.log('Connection restored - starting auto-sync');
      resetOfflineFlag();
      
      // Small delay to ensure connection is stable
      setTimeout(() => {
        syncPendingData();
      }, 2000);
    }
  }, [wasOffline, isOnline, resetOfflineFlag, syncPendingData]);

  // Check pending data on mount and periodically
  useEffect(() => {
    checkPendingData();

    // Check every 60 seconds
    const interval = setInterval(() => {
      checkPendingData();
    }, 60000);

    return () => clearInterval(interval);
  }, [checkPendingData]);

  return {
    isSyncing,
    syncProgress,
    pendingCount,
    syncPendingData,
    checkPendingData,
  };
};
