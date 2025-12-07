import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useToast } from './use-toast';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheItem<T> {
    data: T;
    timestamp: number;
}

interface UseCachedFetchOptions {
    cacheKey?: string;
    skip?: boolean;
}

export function useCachedFetch<T>(url: string, options: UseCachedFetchOptions = {}) {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { toast } = useToast();

    // Use a ref to prevent race conditions or unnecessary re-renders
    const lastFetchTime = useRef<number>(0);

    useEffect(() => {
        if (options.skip) return;

        const fetchData = async () => {
            const storageKey = `cache_${options.cacheKey || url}`;

            // 1. Check LocalStorage
            try {
                const cachedParams = localStorage.getItem(storageKey);
                if (cachedParams) {
                    const parsedCache: CacheItem<T> = JSON.parse(cachedParams);
                    const age = Date.now() - parsedCache.timestamp;

                    if (age < CACHE_DURATION) {
                        // Cache is fresh (< 5 mins)
                        setData(parsedCache.data);
                        setIsLoading(false);
                        // Don't return here if we want to "revalidate" in background? 
                        // User requirement: "If cached data is older than 5 minutes, fetch new data in the background."
                        // So if fresh, we are done.
                        return;
                    } else {
                        // Cache is stale (> 5 mins)
                        // Show stale data immediately while fetching
                        setData(parsedCache.data);
                        setIsLoading(false);
                    }
                }
            } catch (e) {
                console.error("Cache parsing error", e);
                // Corrupted cache - define behavior: clear it
                localStorage.removeItem(storageKey);
            }

            // 2. Fetch from Network (if no cache or stale)
            try {
                // If we didn't find *any* data in cache, loading state should be true.
                // If we found stale data, we already set isLoading(false) above.

                const token = localStorage.getItem('authToken');
                const headers: Record<string, string> = {};
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const response = await axios.get(url, { headers });
                const newData = response.data;

                setData(newData);
                setIsLoading(false);

                // Update Cache
                try {
                    const cacheItem: CacheItem<T> = {
                        data: newData,
                        timestamp: Date.now()
                    };
                    localStorage.setItem(storageKey, JSON.stringify(cacheItem));
                } catch (e) {
                    console.warn("Failed to set localStorage", e);
                }

            } catch (err) {
                console.error("Fetch error", err);
                setError(err instanceof Error ? err : new Error('Unknown error'));

                // If we had stale data, we keep showing it.
                // We might want to show a toast that "Background sync failed"
                if (data) {
                    toast({
                        title: "Sync Failed",
                        description: "Could not refresh data. Showing cached version.",
                        variant: "destructive",
                    });
                } else {
                    // No data at all
                    setIsLoading(false);
                }
            }
        };

        fetchData();
    }, [url, options.cacheKey, options.skip]);

    // Manual refetch function
    const refetch = async () => {
        setIsLoading(true);
        // ... duplicate logic or extract fetcher. 
        // For simplicity, just triggering a re-mount logic might be trickier.
        // Let's just do a direct axios call here to update state.
        try {
            const token = localStorage.getItem('authToken');
            const headers: Record<string, string> = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await axios.get(url, { headers });
            setData(response.data);
            const storageKey = `cache_${options.cacheKey || url}`;
            localStorage.setItem(storageKey, JSON.stringify({
                data: response.data,
                timestamp: Date.now()
            }));
        } catch (err) {
            toast({ title: "Refetch Failed", description: "Could not update data", variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    return { data, isLoading, error, refetch };
}
