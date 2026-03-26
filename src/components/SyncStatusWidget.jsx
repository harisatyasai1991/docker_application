import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { offlineStorage } from '../services/offlineDB';
import { 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Wifi,
  WifiOff,
} from 'lucide-react';

export const SyncStatusWidget = ({ onSyncClick }) => {
  const { isOnline } = useNetworkStatus();
  const [pendingItems, setPendingItems] = useState([]);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load pending items
  useEffect(() => {
    const loadPendingItems = async () => {
      setLoading(true);
      try {
        const sessions = await offlineStorage.getAllSessions();
        const activeSessions = sessions.filter(s => s.sync_status === 'active');
        
        const items = [];
        
        for (const session of activeSessions) {
          const executions = await offlineStorage.getPendingTestExecutions(session.session_id);
          
          for (const exec of executions) {
            const photos = await offlineStorage.getPendingPhotos(exec.execution_id);
            items.push({
              type: 'execution',
              data: exec,
              photos: photos.length,
              sessionId: session.session_id,
            });
          }
        }
        
        setPendingItems(items);
        
        // Get last sync time from localStorage
        const lastSync = localStorage.getItem('last_sync_time');
        if (lastSync) {
          setLastSyncTime(new Date(lastSync));
        }
      } catch (error) {
        console.error('Failed to load pending items:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPendingItems();
    
    // Refresh every 30 seconds
    const intervalId = setInterval(loadPendingItems, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  const getTotalSize = () => {
    // Rough estimate: each execution ~100KB, each photo ~200KB
    const executionSize = pendingItems.length * 0.1; // MB
    const photoSize = pendingItems.reduce((acc, item) => acc + (item.photos * 0.2), 0); // MB
    return (executionSize + photoSize).toFixed(2);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Loading Sync Status...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (pendingItems.length === 0) {
    return (
      <Card className="w-full border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-green-900">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="font-medium">All Synced</span>
          </div>
          {lastSyncTime && (
            <div className="text-xs text-green-700 mt-1">
              Last sync: {lastSyncTime.toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Sync Status
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                <Wifi className="w-3 h-3 mr-1" />
                Online
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                <WifiOff className="w-3 h-3 mr-1" />
                Offline
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary */}
        <div className="p-3 bg-muted/50 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Pending Items:</span>
            <span className="font-semibold">{pendingItems.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Photos:</span>
            <span className="font-semibold">
              {pendingItems.reduce((acc, item) => acc + item.photos, 0)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Estimated Size:</span>
            <span className="font-semibold">~{getTotalSize()} MB</span>
          </div>
        </div>

        {/* Pending Items List */}
        <ScrollArea className="h-32">
          <div className="space-y-2">
            {pendingItems.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 bg-muted/30 rounded text-xs">
                <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium">Test Execution</div>
                  <div className="text-muted-foreground">
                    Session: {item.sessionId.substring(0, 16)}...
                  </div>
                  {item.photos > 0 && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <ImageIcon className="w-3 h-3" />
                      <span>{item.photos} photo(s)</span>
                    </div>
                  )}
                </div>
                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  Pending
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Last Sync */}
        {lastSyncTime && (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3" />
            <span>Last sync: {lastSyncTime.toLocaleString()}</span>
          </div>
        )}

        {/* Sync Button */}
        {onSyncClick && (
          <Button 
            className="w-full" 
            onClick={onSyncClick}
            disabled={!isOnline}
          >
            {isOnline ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Now
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 mr-2" />
                Offline - Cannot Sync
              </>
            )}
          </Button>
        )}

        {!isOnline && (
          <div className="text-xs text-center text-muted-foreground">
            Connect to internet to sync pending items
          </div>
        )}
      </CardContent>
    </Card>
  );
};
