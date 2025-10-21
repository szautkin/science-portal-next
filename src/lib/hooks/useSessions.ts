/**
 * TanStack Query hooks for Skaha Sessions
 *
 * Provides hooks for fetching, creating, and managing Skaha sessions.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import {
  getSessions,
  getSession,
  launchSession,
  deleteSession,
  renewSession,
  getSessionLogs,
  getSessionEvents,
  type Session,
  type SessionLaunchParams,
} from '@/lib/api/skaha';

/**
 * Query keys for sessions
 */
export const sessionKeys = {
  all: ['sessions'] as const,
  lists: () => [...sessionKeys.all, 'list'] as const,
  list: () => [...sessionKeys.lists()] as const,
  details: () => [...sessionKeys.all, 'detail'] as const,
  detail: (id: string) => [...sessionKeys.details(), id] as const,
  logs: (id: string) => [...sessionKeys.all, 'logs', id] as const,
  events: (id: string) => [...sessionKeys.all, 'events', id] as const,
};

/**
 * Get all active sessions
 *
 * @param isAuthenticated - Whether the user is authenticated (optional, defaults to true for backward compatibility)
 * @example
 * ```tsx
 * const { data: authStatus } = useAuthStatus();
 * const { data: sessions, isLoading, refetch } = useSessions(authStatus?.authenticated);
 * ```
 */
export function useSessions(
  isAuthenticated?: boolean,
  options?: Omit<UseQueryOptions<Session[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: sessionKeys.list(),
    queryFn: getSessions,
    // Only fetch if authenticated (default to true for backward compatibility)
    enabled: isAuthenticated !== false,
    // No auto-refresh - only manual refresh and on user actions (delete, launch, extend)
    ...options,
  });
}

/**
 * Get a specific session by ID
 *
 * @example
 * ```tsx
 * const { data: session } = useSession('session-123');
 * ```
 */
export function useSession(
  sessionId: string,
  options?: Omit<UseQueryOptions<Session>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: sessionKeys.detail(sessionId),
    queryFn: () => getSession(sessionId),
    enabled: !!sessionId,
    ...options,
  });
}

/**
 * Get session logs
 *
 * @example
 * ```tsx
 * const { data: logs } = useSessionLogs('session-123');
 * ```
 */
export function useSessionLogs(
  sessionId: string,
  options?: Omit<UseQueryOptions<string>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: sessionKeys.logs(sessionId),
    queryFn: () => getSessionLogs(sessionId),
    enabled: !!sessionId,
    ...options,
  });
}

/**
 * Get session events
 *
 * @example
 * ```tsx
 * const { data: events } = useSessionEvents('session-123');
 * ```
 */
export function useSessionEvents(
  sessionId: string,
  options?: Omit<UseQueryOptions<any[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: sessionKeys.events(sessionId),
    queryFn: () => getSessionEvents(sessionId),
    enabled: !!sessionId,
    ...options,
  });
}

/**
 * Launch a new session
 *
 * @example
 * ```tsx
 * const { mutate: launch, isPending } = useLaunchSession();
 *
 * launch({
 *   sessionType: 'notebook',
 *   sessionName: 'my-analysis',
 *   containerImage: 'images.canfar.net/ml:latest',
 *   cores: 2,
 *   ram: 8,
 * });
 * ```
 */
export function useLaunchSession(
  options?: UseMutationOptions<Session, Error, SessionLaunchParams>
) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, ...restOptions } = options || {};

  return useMutation({
    ...restOptions,
    mutationFn: launchSession,
    onSuccess: (...args) => {
      // Call user's onSuccess callback if provided
      userOnSuccess?.(...args);

      // Wait 30 seconds before refetching to allow backend to create session
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: sessionKeys.list() });
      }, 30000);
    },
  });
}

/**
 * Delete/terminate a session
 *
 * @example
 * ```tsx
 * const { mutate: remove } = useDeleteSession();
 *
 * remove('session-123');
 * ```
 */
export function useDeleteSession(options?: UseMutationOptions<void, Error, string>) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, ...restOptions } = options || {};

  return useMutation({
    ...restOptions,
    mutationFn: deleteSession,
    onSuccess: (data, sessionId, ...rest) => {
      // Call user's onSuccess callback if provided
      userOnSuccess?.(data, sessionId, ...rest);

      // Wait 30 seconds before refetching to allow backend to process deletion
      setTimeout(() => {
        // Invalidate sessions list
        queryClient.invalidateQueries({ queryKey: sessionKeys.list() });
        // Remove the specific session from cache
        queryClient.removeQueries({ queryKey: sessionKeys.detail(sessionId) });
      }, 30000);
    },
  });
}

/**
 * Renew/extend a session
 *
 * @example
 * ```tsx
 * const { mutate: renew } = useRenewSession();
 *
 * renew({ sessionId: 'session-123', hours: 2 });
 * ```
 */
export function useRenewSession(
  options?: UseMutationOptions<Session, Error, { sessionId: string; hours: number }>
) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, ...restOptions } = options || {};

  return useMutation({
    ...restOptions,
    mutationFn: ({ sessionId, hours }) => renewSession(sessionId, hours),
    onSuccess: (updatedSession, variables, ...rest) => {
      // Call user's onSuccess callback if provided
      userOnSuccess?.(updatedSession, variables, ...rest);

      // Wait 30 seconds before refetching to allow backend to process renewal
      setTimeout(() => {
        // Update the specific session in cache
        queryClient.setQueryData(sessionKeys.detail(updatedSession.id), updatedSession);
        // Invalidate sessions list to show updated expiry
        queryClient.invalidateQueries({ queryKey: sessionKeys.list() });
      }, 30000);
    },
  });
}
