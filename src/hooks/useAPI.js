/**
 * Custom React Hooks for API calls with loading and error states
 * Includes automatic retry for rrweb clone errors
 */

import { useState, useEffect, useRef } from 'react';

const MAX_RETRIES = 3;
const RETRY_DELAY = 100;

/**
 * Generic hook for fetching data from API
 * @param {Function} apiFn - API function to call
 * @param {Array} dependencies - Dependencies array for useEffect
 * @param {*} initialData - Initial data value
 */
export function useAPIData(apiFn, dependencies = [], initialData = null) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const retryCountRef = useRef(0);

  useEffect(() => {
    let isMounted = true;
    retryCountRef.current = 0;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiFn();
        
        if (isMounted) {
          setData(result);
          setLoading(false);
          retryCountRef.current = 0;
        }
      } catch (err) {
        // Handle rrweb clone error with automatic retry
        const isCloneError = err?.message?.includes('clone') || 
                            err?.message?.includes('Response body is already used');
        
        if (isCloneError && retryCountRef.current < MAX_RETRIES && isMounted) {
          retryCountRef.current += 1;
          console.warn(`Retrying API call due to clone error (attempt ${retryCountRef.current}/${MAX_RETRIES})`);
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCountRef.current));
          if (isMounted) {
            fetchData(); // Retry
          }
          return;
        }
        
        if (isMounted) {
          // Provide a user-friendly error message for clone errors
          if (isCloneError) {
            setError('Network issue detected. Please refresh the page.');
          } else {
            setError(err.message || 'Failed to fetch data');
          }
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, dependencies);

  return { data, loading, error, setData };
}

/**
 * Hook for mutating data (POST, PUT, DELETE)
 */
export function useAPIMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const mutate = async (apiFn, ...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFn(...args);
      setData(result);
      setLoading(false);
      return { success: true, data: result };
    } catch (err) {
      const errorMsg = err.message || 'Operation failed';
      setError(errorMsg);
      setLoading(false);
      return { success: false, error: errorMsg };
    }
  };

  const reset = () => {
    setLoading(false);
    setError(null);
    setData(null);
  };

  return { mutate, loading, error, data, reset };
}

/**
 * Hook with manual refetch capability
 */
export function useAPIDataWithRefetch(apiFn, dependencies = [], initialData = null) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const retryCountRef = useRef(0);

  useEffect(() => {
    let isMounted = true;
    retryCountRef.current = 0;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiFn();
        
        if (isMounted) {
          setData(result);
          setLoading(false);
          retryCountRef.current = 0;
        }
      } catch (err) {
        // Handle rrweb clone error with automatic retry
        const isCloneError = err?.message?.includes('clone') || 
                            err?.message?.includes('Response body is already used');
        
        if (isCloneError && retryCountRef.current < MAX_RETRIES && isMounted) {
          retryCountRef.current += 1;
          console.warn(`Retrying API call due to clone error (attempt ${retryCountRef.current}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCountRef.current));
          if (isMounted) {
            fetchData();
          }
          return;
        }
        
        if (isMounted) {
          if (isCloneError) {
            setError('Network issue detected. Please refresh the page.');
          } else {
            setError(err.message || 'Failed to fetch data');
          }
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [...dependencies, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  return { data, loading, error, setData, refetch };
}
