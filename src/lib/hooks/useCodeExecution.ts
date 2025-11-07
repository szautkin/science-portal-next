'use client';

import { useState, useCallback } from 'react';
import {
  CodeLanguage,
  SessionConfig,
  CONTAINER_IMAGES,
  LANGUAGE_COMMANDS,
  FILE_EXTENSIONS,
} from '@/app/types/CodeRunnerTypes';
import { getAuthHeader } from '@/lib/auth/token-storage';

interface UseCodeExecutionOptions {
  onSuccess?: (sessionId: string) => void;
  onError?: (error: string) => void;
}

interface LaunchSessionParams {
  language: CodeLanguage;
  filePath: string;
  cores?: number;
  ram?: number;
  sessionName?: string;
  registryUsername?: string;
  registrySecret?: string;
  containerImage?: string;
}

export const useCodeExecution = (options: UseCodeExecutionOptions = {}) => {
  const {
    onSuccess,
    onError,
  } = options;

  const [isLaunching, setIsLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Launch a headless session to execute code
   */
  const launchSession = useCallback(
    async (params: LaunchSessionParams): Promise<string | null> => {
      const {
        language,
        filePath,
        cores,
        ram,
        sessionName,
        registryUsername,
        registrySecret,
        containerImage: customContainerImage,
      } = params;

      setIsLaunching(true);
      setError(null);

      try {
        // Use custom container image if provided, otherwise use default for language
        const imageToUse = customContainerImage || CONTAINER_IMAGES[language];

        // Generate session name/ID
        const generatedSessionName = sessionName || `starai-exec-${Date.now()}`;

        // Build session configuration
        // For python-runner image: Use environment variables instead of cmd args
        // to avoid SKAHA treating first arg as the executable
        const config: SessionConfig = {
          containerImage: imageToUse,
          cores: cores,
          ram: ram,
          gpus: 0,
          cmdArgs: [], // Empty - let ENTRYPOINT run without overrides
          env: {
            // Python-runner specific env vars
            PYTHON_RUNNER_SESSION_ID: generatedSessionName,
            PYTHON_RUNNER_SCRIPT_PATH: filePath,
            // Standard Python env vars
            PYTHONUNBUFFERED: '1',
            PYTHONDONTWRITEBYTECODE: '1',
            CODE_RUNNER_SESSION: 'true',
          },
        };

        // Build request payload - only include cores/ram if defined
        const payload: Record<string, unknown> = {
          sessionType: 'headless',
          sessionName: generatedSessionName,
          containerImage: config.containerImage,
          gpus: config.gpus,
          cmdArgs: config.cmdArgs,
          env: config.env,
        };

        // Only include cores if defined
        if (cores !== undefined) {
          payload.cores = cores;
        }

        // Only include ram if defined
        if (ram !== undefined) {
          payload.ram = ram;
        }

        // Include registry auth if provided
        if (registryUsername && registrySecret) {
          payload.registryUsername = registryUsername;
          payload.registrySecret = registrySecret;
        }

        console.log('[useCodeExecution] Launching session:', payload);

        // Get auth headers
        const authHeaders = getAuthHeader();

        // Launch session
        const response = await fetch('/api/sessions/headless', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          body: JSON.stringify(payload),
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Failed to launch session: ${response.statusText}`
          );
        }

        const data = await response.json();
        const sessionId = data.id || data.sessionId;

        if (!sessionId) {
          throw new Error('No session ID returned from API');
        }

        console.log('[useCodeExecution] Session launched:', sessionId);

        onSuccess?.(sessionId);
        return sessionId;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to launch session';
        console.error('[useCodeExecution] Error:', errorMessage, err);
        setError(errorMessage);
        onError?.(errorMessage);
        return null;
      } finally {
        setIsLaunching(false);
      }
    },
    [onSuccess, onError]
  );

  /**
   * Cancel execution (terminate session)
   */
  const cancelExecution = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      console.log('[useCodeExecution] Canceling session:', sessionId);

      const authHeaders = getAuthHeader();

      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          ...authHeaders,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel session: ${response.statusText}`);
      }

      console.log('[useCodeExecution] Session canceled:', sessionId);
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to cancel session';
      console.error('[useCodeExecution] Error canceling:', errorMessage, err);
      setError(errorMessage);
      return false;
    }
  }, []);

  return {
    launchSession,
    cancelExecution,
    isLaunching,
    error,
  };
};
