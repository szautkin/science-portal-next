/**
 * TanStack Query hooks for Authentication
 *
 * Provides hooks for user authentication and authorization.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import {
  login,
  logout,
  getAuthStatus,
  getUserDetails,
  checkPermission,
  type User,
  type LoginCredentials,
  type AuthStatus,
} from '@/lib/api/login';

/**
 * Query keys for auth
 */
export const authKeys = {
  all: ['auth'] as const,
  status: () => [...authKeys.all, 'status'] as const,
  user: (username: string) => [...authKeys.all, 'user', username] as const,
  permission: (username: string, resource: string, permission: string) =>
    [...authKeys.all, 'permission', username, resource, permission] as const,
};

/**
 * Get current authentication status
 *
 * @example
 * ```tsx
 * const { data: authStatus } = useAuthStatus();
 *
 * if (authStatus?.authenticated) {
 *   console.log('User:', authStatus.user);
 * }
 * ```
 */
export function useAuthStatus(
  options?: Omit<UseQueryOptions<AuthStatus>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: authKeys.status(),
    queryFn: getAuthStatus,
    // Don't provide initialData - let it check token on mount
    // Keep auth status fresh for 1 minute
    staleTime: 60000,
    // Cache for 5 minutes
    gcTime: 5 * 60 * 1000,
    // Refetch on window focus to catch session expiry
    refetchOnWindowFocus: true,
    // Retry once on failure
    retry: 1,
    ...options,
  });
}

/**
 * Get user details
 *
 * @example
 * ```tsx
 * const { data: user } = useUserDetails('janedoe');
 * ```
 */
export function useUserDetails(
  username: string,
  options?: Omit<UseQueryOptions<User>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: authKeys.user(username),
    queryFn: () => getUserDetails(username),
    enabled: !!username,
    ...options,
  });
}

/**
 * Check user permission
 *
 * @example
 * ```tsx
 * const { data: canWrite } = usePermission('janedoe', '/vospace/janedoe/data', 'write');
 * ```
 */
export function usePermission(
  username: string,
  resource: string,
  permission: 'read' | 'write' | 'execute',
  options?: Omit<UseQueryOptions<boolean>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: authKeys.permission(username, resource, permission),
    queryFn: () => checkPermission(username, resource, permission),
    enabled: !!username && !!resource,
    ...options,
  });
}

/**
 * Login mutation
 *
 * @example
 * ```tsx
 * const { mutate: loginUser, isPending } = useLogin();
 *
 * loginUser({
 *   username: 'janedoe',
 *   password: 'secret',
 * });
 * ```
 */
export function useLogin(options?: UseMutationOptions<User, Error, LoginCredentials>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: () => {
      // Invalidate auth status to refetch with new user
      queryClient.invalidateQueries({ queryKey: authKeys.status() });
    },
    ...options,
  });
}

/**
 * Logout mutation
 *
 * @example
 * ```tsx
 * const { mutate: logoutUser } = useLogout();
 *
 * logoutUser();
 * ```
 */
export function useLogout(options?: UseMutationOptions<void, Error, void>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Clear all queries on logout
      queryClient.clear();
    },
    ...options,
  });
}
