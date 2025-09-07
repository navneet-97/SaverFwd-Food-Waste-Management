import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../App';

export const useSmartRefresh = ({
  fetchFunction,
  interval = 5000,
  onDataChange = null,
  silentRefresh = true
}) => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const lastDataRef = useRef(null);
  const intervalRef = useRef(null);
  const fetchFunctionRef = useRef(fetchFunction);
  const onDataChangeRef = useRef(onDataChange);

  // Update refs when props change
  useEffect(() => {
    fetchFunctionRef.current = fetchFunction;
  }, [fetchFunction]);
  
  useEffect(() => {
    onDataChangeRef.current = onDataChange;
  }, [onDataChange]);

  // Optimized data comparison to detect changes
  const hasDataChanged = useCallback((newData) => {
    if (!lastDataRef.current) return true;
    
    // Quick length comparison first
    if (Array.isArray(newData) && Array.isArray(lastDataRef.current)) {
      if (newData.length !== lastDataRef.current.length) return true;
    }
    
    // Deep comparison only if necessary
    try {
      return JSON.stringify(newData) !== JSON.stringify(lastDataRef.current);
    } catch (error) {
      console.warn('Error comparing data:', error);
      return true; // Assume changed if comparison fails
    }
  }, []);

  // Enhanced fetch with change detection
  const fetchData = useCallback(async (isManual = false) => {
    if (!user) return;

    try {
      if (isManual) setIsRefreshing(true);
      
      const newData = await fetchFunctionRef.current();
      
      // Check if data actually changed
      if (hasDataChanged(newData)) {
        setData(newData);
        lastDataRef.current = newData;
        
        // Trigger callback if data changed
        if (onDataChangeRef.current && !loading) {
          onDataChangeRef.current(newData, lastDataRef.current);
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Smart refresh error:', err);
      setError(err);
      
      // Only show error toast for manual refresh
      if (isManual) {
        // Import toast dynamically to avoid circular deps
        const { toast } = await import('sonner');
        toast.error('Failed to refresh data');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [hasDataChanged, user, loading]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  // Start/stop smart polling
  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    
    intervalRef.current = setInterval(() => {
      fetchData(false); // Silent refresh
    }, interval);
  }, [fetchData, interval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Initial load and dependency tracking
  useEffect(() => {
    if (user) {
      fetchData(false);
      
      if (!silentRefresh) {
        startPolling();
      }
    }
    
    return () => stopPolling();
  }, [user, silentRefresh]);

  // Smart polling management based on page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else if (!document.hidden && user) {
        fetchData(false); // Refresh when page becomes visible
        if (!silentRefresh) {
          startPolling();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, silentRefresh, startPolling, stopPolling, fetchData]);

  return {
    data,
    loading,
    isRefreshing,
    error,
    refresh,
    startPolling,
    stopPolling
  };
};
