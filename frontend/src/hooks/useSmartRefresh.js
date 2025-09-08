import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../App';

export const useSmartRefresh = (fetchFunction, interval = 30000) => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const result = await fetchFunction();
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err);
      // Only set empty data if current data is null to prevent null pointer exceptions
      if (data === null) {
        setData([]);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, user]);

  // Avoid unnecessary re-fetches if user hasn't changed
  const stableUser = user?.id;

  useEffect(() => {
    if (stableUser) {
      fetchData();
      
      const intervalId = setInterval(fetchData, interval);
      return () => clearInterval(intervalId);
    }
  }, [fetchData, interval, stableUser]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh };
};
