'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SessionStatus } from '@/app/types/CodeRunnerTypes';
import { getAuthHeader } from '@/lib/auth/token-storage';

// Global singleton guard to prevent multiple polling instances for the same session
const activePollingInstances = new Map<string, string>(); // sessionId -> hookInstanceId

interface UseSessionPollingOptions {
  sessionId: string | null;
  scriptPath?: string | null; // Path to the script file in VOSpace
  enabled?: boolean;
  initialInterval?: number; // Initial polling interval in milliseconds (default: 2000)
  maxInterval?: number; // Maximum polling interval in milliseconds (default: 15000)
  backoffMultiplier?: number; // Exponential backoff multiplier (default: 1.5)
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
    initialInterval = 15000, // Start at 15 seconds - VERY respectful!
    maxInterval = 60000, // Max 60 seconds (1 minute) for long-running sessions
    backoffMultiplier = 2, // Double each time
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
  const [currentInterval, setCurrentInterval] = useState(initialInterval);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isRequestInFlightRef = useRef<boolean>(false); // Prevent concurrent requests
  const pollCountRef = useRef<number>(0); // Track number of polls
  const pollFunctionRef = useRef<(() => Promise<void>) | null>(null); // Stable reference to poll function
  const hookInstanceIdRef = useRef<string>(`hook-${Math.random().toString(36).slice(2, 9)}`); // Unique ID for debugging
  const maxRetries = 3;

  /**
   * Calculate next polling interval with ULTRA-AGGRESSIVE exponential backoff
   */
  const calculateNextInterval = useCallback((currentPollCount: number, sessionStatus: SessionStatus): number => {
    // ULTRA-AGGRESSIVE: Double on EVERY poll for all statuses
    // Poll 1: 15s, Poll 2: 30s, Poll 3+: 60s
    const baseInterval = Math.min(
      initialInterval * Math.pow(backoffMultiplier, currentPollCount - 1),
      maxInterval
    );

    // Minimal jitter (±5%) to prevent thundering herd
    const jitter = baseInterval * 0.05 * (Math.random() - 0.5);
    const nextInterval = Math.max(initialInterval, baseInterval + jitter);

    return nextInterval;
  }, [initialInterval, maxInterval, backoffMultiplier]);

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
   * Poll session status with smart backoff and request deduplication
   */
  const poll = useCallback(async () => {
    // Prevent concurrent requests
    if (isRequestInFlightRef.current) {
      console.log(`[useSessionPolling:${hookInstanceIdRef.current}] Skipping poll - request already in flight`);
      return;
    }

    isRequestInFlightRef.current = true;
    const pollFn = pollFunctionRef.current;
    const hookId = hookInstanceIdRef.current;

    console.log(`[useSessionPolling:${hookId}] Poll #${pollCountRef.current + 1} starting`);

    try {
      const currentStatus = await fetchStatus();

      if (!currentStatus) {
        isRequestInFlightRef.current = false;
        return;
      }

      setStatus(currentStatus);
      onStatusChange?.(currentStatus);
      setRetryCount(0); // Reset retry count on successful fetch

      // Increment poll count for backoff calculation
      pollCountRef.current += 1;

      // Check if session is in terminal state
      if (currentStatus === 'Succeeded') {
        console.log(`[useSessionPolling:${hookId}] Session succeeded, fetching results`);

        // Try to fetch results file first, fall back to logs
        let results = null;
        if (scriptPath) {
          results = await fetchResultsFile(scriptPath);
        }

        // If no results file, get logs
        if (!results) {
          console.log(`[useSessionPolling:${hookId}] No results file found, fetching logs`);
          results = await fetchLogs();
        }

        onComplete?.(results || 'Execution completed successfully');

        // Unregister from singleton guard
        if (sessionId) {
          activePollingInstances.delete(sessionId);
        }

        setIsPolling(false);
        if (intervalRef.current) {
          clearTimeout(intervalRef.current);
          intervalRef.current = null;
        }
        isRequestInFlightRef.current = false;
        return;
      } else if (currentStatus === 'Failed' || currentStatus === 'Error') {
        console.log(`[useSessionPolling:${hookId}] Session failed`);
        const logs = await fetchLogs();
        onError?.(logs || 'Execution failed');

        // Unregister from singleton guard
        if (sessionId) {
          activePollingInstances.delete(sessionId);
        }

        setIsPolling(false);
        if (intervalRef.current) {
          clearTimeout(intervalRef.current);
          intervalRef.current = null;
        }
        isRequestInFlightRef.current = false;
        return;
      }

      // Check elapsed time
      if (startTimeRef.current) {
        const elapsed = Date.now() - startTimeRef.current;
        setElapsedTime(elapsed);

        if (elapsed > maxDuration) {
          console.log(`[useSessionPolling:${hookId}] Polling timeout reached`);
          onTimeout?.();

          // Unregister from singleton guard
          if (sessionId) {
            activePollingInstances.delete(sessionId);
          }

          setIsPolling(false);
          if (intervalRef.current) {
            clearTimeout(intervalRef.current);
            intervalRef.current = null;
          }
          isRequestInFlightRef.current = false;
          return;
        }
      }

      // Calculate and schedule next poll with dynamic interval
      const nextInterval = calculateNextInterval(pollCountRef.current, currentStatus);
      setCurrentInterval(nextInterval);

      console.log(`[useSessionPolling:${hookId}] Scheduling next poll in ${Math.round(nextInterval / 1000)}s (status: ${currentStatus})`);

      // Schedule next poll using the ref to always get the latest function
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
      intervalRef.current = setTimeout(() => pollFn?.(), nextInterval);

    } catch (err) {
      console.error('[useSessionPolling] Polling error:', err);
      setRetryCount((prev) => prev + 1);

      if (retryCount >= maxRetries) {
        const errorMessage =
          err instanceof Error ? err.message : 'Polling failed after multiple retries';
        onError?.(errorMessage);

        // Unregister from singleton guard
        if (sessionId) {
          activePollingInstances.delete(sessionId);
        }

        setIsPolling(false);
        if (intervalRef.current) {
          clearTimeout(intervalRef.current);
          intervalRef.current = null;
        }
        isRequestInFlightRef.current = false;
        return;
      }

      // Retry with exponential backoff on error
      const retryInterval = initialInterval * Math.pow(2, retryCount);
      console.log(`[useSessionPolling] Retrying in ${retryInterval}ms (attempt ${retryCount + 1}/${maxRetries})`);

      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
      intervalRef.current = setTimeout(() => pollFn?.(), retryInterval);
    } finally {
      isRequestInFlightRef.current = false;
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
    calculateNextInterval,
    initialInterval,
  ]);

  /**
   * Keep poll function ref updated
   */
  useEffect(() => {
    pollFunctionRef.current = poll;
  }, [poll]);

  /**
   * Start polling with smart backoff and GLOBAL SINGLETON GUARD
   */
  const startPolling = useCallback(() => {
    if (!sessionId || !enabled) return;

    const hookId = hookInstanceIdRef.current;

    // GLOBAL SINGLETON GUARD: Check if another instance is already polling this session
    const existingInstance = activePollingInstances.get(sessionId);
    if (existingInstance && existingInstance !== hookId) {
      console.warn(`[useSessionPolling:${hookId}] ⚠️  BLOCKED: Another instance (${existingInstance}) is already polling session ${sessionId}`);
      return;
    }

    // Prevent duplicate polling if already polling locally
    if (isPolling) {
      console.log(`[useSessionPolling:${hookId}] Already polling locally, skipping startPolling`);
      return;
    }

    // Register this instance as the active poller for this session
    activePollingInstances.set(sessionId, hookId);
    console.log(`[useSessionPolling:${hookId}] ✅ Starting polling for session: ${sessionId} (REGISTERED AS SINGLETON)`);

    setIsPolling(true);
    startTimeRef.current = Date.now();
    setElapsedTime(0);
    setRetryCount(0);
    pollCountRef.current = 0; // Reset poll count
    isRequestInFlightRef.current = false; // Reset request flag
    setCurrentInterval(initialInterval);

    // Start first poll immediately (subsequent polls are scheduled by poll() itself)
    poll();
  }, [sessionId, enabled, poll, initialInterval, isPolling]);

  /**
   * Stop polling and unregister from GLOBAL SINGLETON GUARD
   */
  const stopPolling = useCallback(() => {
    const hookId = hookInstanceIdRef.current;
    console.log(`[useSessionPolling:${hookId}] Stopping polling`);

    // Unregister from global singleton guard if this is the active instance
    if (sessionId && activePollingInstances.get(sessionId) === hookId) {
      activePollingInstances.delete(sessionId);
      console.log(`[useSessionPolling:${hookId}] ❌ Unregistered from global singleton guard`);
    }

    setIsPolling(false);
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
    startTimeRef.current = null;
    pollCountRef.current = 0;
    isRequestInFlightRef.current = false;
  }, [sessionId]);

  /**
   * Effect: Start/stop polling based on enabled and sessionId
   *
   * IMPORTANT: We only depend on sessionId and enabled to prevent
   * constant re-creation of the polling loop. The functions use refs
   * which are stable across renders.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, sessionId]);

  return {
    status,
    isPolling,
    elapsedTime,
    currentInterval,
    startPolling,
    stopPolling,
  };
};
