import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../App';

export const useSmartRefresh = (fetchFunction, interval = 30000) => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    try {
      const result = await fetchFunction();
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, user]);

  useEffect(() => {
    if (user) {
      fetchData();
      
      const intervalId = setInterval(fetchData, interval);
      return () => clearInterval(intervalId);
    }
  }, [fetchData, interval, user]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh };
};
