import { useState, useEffect } from 'react';

/**
 * Hook to detect online/offline network status
 * Provides real-time updates and connectivity checking
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      console.log('✓ Network: Online');
      setWasOffline(isOnline === false); // User just came back online
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('✗ Network: Offline');
      setIsOnline(false);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic connectivity check (every 30 seconds)
    const intervalId = setInterval(() => {
      const currentStatus = navigator.onLine;
      if (currentStatus !== isOnline) {
        console.log('Network status changed via interval check:', currentStatus);
        setIsOnline(currentStatus);
        if (currentStatus && !isOnline) {
          setWasOffline(true);
        }
      }
    }, 30000);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [isOnline]);

  // Reset wasOffline flag after notification
  const resetOfflineFlag = () => {
    setWasOffline(false);
  };

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
    resetOfflineFlag,
  };
};
