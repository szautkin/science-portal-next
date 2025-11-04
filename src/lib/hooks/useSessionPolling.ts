'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SessionStatus } from '@/app/types/CodeRunnerTypes';
import { getAuthHeader } from '@/lib/auth/token-storage';

interface UseSessionPollingOptions {
  sessionId: string | null;
  scriptPath?: string | null; // Path to the script file in VOSpace
  enabled?: boolean;
  interval?: number; // milliseconds
  maxDuration?: number; // milliseconds
  onStatusChange?: (status: SessionStatus) => void;
  onComplete?: (logs: string) => void;
  onError?: (error: string) => void;
  onTimeout?: () => void;
}

interface SessionData {
  id: string;
  name: string;
  status: SessionStatus;
  type?: string;
  image?: string;
  [key: string]: unknown;
}

export const useSessionPolling = (options: UseSessionPollingOptions) => {
  const {
    sessionId,
    scriptPath = null,
    enabled = true,
    interval = 2000,
    maxDuration = 600000, // 10 minutes
    onStatusChange,
    onComplete,
    onError,
    onTimeout,
  } = options;

  const [status, setStatus] = useState<SessionStatus>('Unknown');
  const [isPolling, setIsPolling] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const maxRetries = 3;

  /**
   * Fetch session status
   */
  const fetchStatus = useCallback(async (): Promise<SessionStatus | null> => {
    if (!sessionId) return null;

    try {
      const authHeaders = getAuthHeader();

      const response = await fetch(`/api/sessions/${sessionId}`, {
        headers: {
          ...authHeaders,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Session not found - might be too early or already deleted
          return 'Unknown';
        }
        throw new Error(`Failed to fetch session status: ${response.statusText}`);
      }

      const data: SessionData = await response.json();
      return data.status || 'Unknown';
    } catch (err) {
      console.error('[useSessionPolling] Error fetching status:', err);
      throw err;
    }
  }, [sessionId]);

  /**
   * Fetch session logs
   */
  const fetchLogs = useCallback(async (): Promise<string | null> => {
    if (!sessionId) return null;

    try {
      const authHeaders = getAuthHeader();

      const response = await fetch(`/api/sessions/${sessionId}/logs`, {
        headers: {
          ...authHeaders,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        console.warn('[useSessionPolling] Failed to fetch logs:', response.statusText);
        return null;
      }

      const logs = await response.text();
      return logs;
    } catch (err) {
      console.error('[useSessionPolling] Error fetching logs:', err);
      return null;
    }
  }, [sessionId]);

  /**
   * Fetch results file from VOSpace
   */
  const fetchResultsFile = useCallback(async (scriptPath: string): Promise<string | null> => {
    if (!scriptPath) return null;

    try {
      // Generate results file path from script path
      // e.g., /arc/home/user/starai/script_123.py -> /arc/home/user/starai/script_123_results.txt
      const pathParts = scriptPath.split('/');
      const filename = pathParts[pathParts.length - 1];
      const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
      const resultsFilename = `${nameWithoutExt}_results.txt`;
      const resultsPath = pathParts.slice(0, -1).concat(resultsFilename).join('/');

      console.log('[useSessionPolling] Fetching results file:', resultsPath);

      const authHeaders = getAuthHeader();

      const response = await fetch(`/api/vospace/transfer?path=${encodeURIComponent(resultsPath)}`, {
        headers: {
          ...authHeaders,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('[useSessionPolling] Results file not found (404):', resultsPath);
        } else if (response.status === 500) {
          console.warn('[useSessionPolling] Server error fetching results file (500):', resultsPath);
          console.warn('[useSessionPolling] File might not exist yet or VOSpace error');
        } else {
          console.warn('[useSessionPolling] Failed to fetch results file:', response.status, resultsPath);
        }
        return null;
      }

      const resultsContent = await response.text();
      console.log('[useSessionPolling] Successfully fetched results file, length:', resultsContent.length);
      return resultsContent;
    } catch (err) {
      console.error('[useSessionPolling] Error fetching results file:', err);
      return null;
    }
  }, []);

  /**
   * Poll session status
   */
  const poll = useCallback(async () => {
    try {
      const currentStatus = await fetchStatus();

      if (!currentStatus) {
        return;
      }

      setStatus(currentStatus);
      onStatusChange?.(currentStatus);
      setRetryCount(0); // Reset retry count on successful fetch

      // Check if session is in terminal state
      if (currentStatus === 'Succeeded') {
        console.log('[useSessionPolling] Session succeeded, fetching results');

        // Try to fetch results file first, fall back to logs
        let results = null;
        if (scriptPath) {
          results = await fetchResultsFile(scriptPath);
        }

        // If no results file, get logs
        if (!results) {
          console.log('[useSessionPolling] No results file found, fetching logs');
          results = await fetchLogs();
        }

        onComplete?.(results || 'Execution completed successfully');
        setIsPolling(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else if (currentStatus === 'Failed' || currentStatus === 'Error') {
        console.log('[useSessionPolling] Session failed');
        const logs = await fetchLogs();
        onError?.(logs || 'Execution failed');
        setIsPolling(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }

      // Check elapsed time
      if (startTimeRef.current) {
        const elapsed = Date.now() - startTimeRef.current;
        setElapsedTime(elapsed);

        if (elapsed > maxDuration) {
          console.log('[useSessionPolling] Polling timeout reached');
          onTimeout?.();
          setIsPolling(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }
    } catch (err) {
      console.error('[useSessionPolling] Polling error:', err);
      setRetryCount((prev) => prev + 1);

      if (retryCount >= maxRetries) {
        const errorMessage =
          err instanceof Error ? err.message : 'Polling failed after multiple retries';
        onError?.(errorMessage);
        setIsPolling(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }
  }, [
    fetchStatus,
    fetchLogs,
    onStatusChange,
    onComplete,
    onError,
    onTimeout,
    maxDuration,
    retryCount,
    scriptPath,
    fetchResultsFile,
  ]);

  /**
   * Start polling
   */
  const startPolling = useCallback(() => {
    if (!sessionId || !enabled) return;

    console.log('[useSessionPolling] Starting polling for session:', sessionId);
    setIsPolling(true);
    startTimeRef.current = Date.now();
    setElapsedTime(0);
    setRetryCount(0);

    // Immediate first poll
    poll();

    // Set up interval
    intervalRef.current = setInterval(poll, interval);
  }, [sessionId, enabled, poll, interval]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    console.log('[useSessionPolling] Stopping polling');
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    startTimeRef.current = null;
  }, []);

  /**
   * Effect: Start/stop polling based on enabled and sessionId
   */
  useEffect(() => {
    if (enabled && sessionId) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, sessionId, startPolling, stopPolling]);

  return {
    status,
    isPolling,
    elapsedTime,
    startPolling,
    stopPolling,
  };
};
