import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for polling data at regular intervals
 * @param {Function} fetchFn - Function to fetch data
 * @param {number} interval - Polling interval in ms
 * @param {boolean} enabled - Whether polling is enabled
 */
export function usePolling(fetchFn, interval = 5000, enabled = true) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const savedCallback = useRef(fetchFn);

    // Remember the latest callback
    useEffect(() => {
        savedCallback.current = fetchFn;
    }, [fetchFn]);

    const fetchData = useCallback(async () => {
        try {
            const result = await savedCallback.current();
            setData(result);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Polling
    useEffect(() => {
        if (!enabled) return;

        const id = setInterval(fetchData, interval);
        return () => clearInterval(id);
    }, [enabled, interval, fetchData]);

    const refetch = useCallback(() => {
        setLoading(true);
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch };
}

/**
 * Hook for fetching data once with optional manual refetch
 * @param {Function} fetchFn - Function to fetch data
 * @param {Array} deps - Dependencies that trigger refetch
 */
export function useFetch(fetchFn, deps = []) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await fetchFn();
            setData(result);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    }, [fetchFn]);

    useEffect(() => {
        fetchData();
    }, [...deps, fetchData]);

    return { data, loading, error, refetch: fetchData };
}

export default usePolling;
