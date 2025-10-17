/**
 * TanStack Query hooks for Skaha Images and Repositories
 *
 * Provides hooks for fetching container images and image repositories.
 */

import {
  useQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';
import {
  getContainerImages,
  getImageRepositories,
  type ImagesByTypeAndProject,
  type ImageRepository,
} from '@/lib/api/skaha';

/**
 * Query keys for images
 */
export const imageKeys = {
  all: ['images'] as const,
  lists: () => [...imageKeys.all, 'list'] as const,
  list: () => [...imageKeys.lists()] as const,
  repositories: () => [...imageKeys.all, 'repositories'] as const,
};

/**
 * Get all available container images grouped by type and project
 *
 * @param isAuthenticated - Whether the user is authenticated (optional, defaults to true for backward compatibility)
 * @example
 * ```tsx
 * const { data: authStatus } = useAuthStatus();
 * const { data: imagesByType, isLoading, refetch } = useContainerImages(authStatus?.authenticated);
 * // imagesByType is structured as:
 * // {
 * //   notebook: {
 * //     canucs: [{ id, registry, project, name, imageName, version, label }, ...],
 * //     skaha: [...]
 * //   },
 * //   desktop: { ... }
 * // }
 * ```
 */
export function useContainerImages(
  isAuthenticated?: boolean,
  options?: Omit<UseQueryOptions<ImagesByTypeAndProject>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: imageKeys.list(),
    queryFn: getContainerImages,
    // Only fetch if authenticated (default to true for backward compatibility)
    enabled: isAuthenticated !== false,
    // Cache images for 5 minutes since they don't change frequently
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Get image repository hosts
 *
 * @param isAuthenticated - Whether the user is authenticated (optional, defaults to true for backward compatibility)
 * @example
 * ```tsx
 * const { data: authStatus } = useAuthStatus();
 * const { data: repositories, isLoading } = useImageRepositories(authStatus?.authenticated);
 * ```
 */
export function useImageRepositories(
  isAuthenticated?: boolean,
  options?: Omit<UseQueryOptions<ImageRepository[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: imageKeys.repositories(),
    queryFn: getImageRepositories,
    // Only fetch if authenticated (default to true for backward compatibility)
    enabled: isAuthenticated !== false,
    // Cache repository hosts for 10 minutes since they rarely change
    staleTime: 10 * 60 * 1000,
    ...options,
  });
}
