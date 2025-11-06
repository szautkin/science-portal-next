/**
 * TanStack Query hooks for VOSpace Storage
 *
 * Provides hooks for managing CANFAR VOSpace file operations.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { getAuthHeader } from '@/lib/auth/token-storage';

/**
 * VOSpace node types from the API
 */
export enum VONodeType {
  ContainerNode = 'vos:ContainerNode',
  DataNode = 'vos:DataNode',
  LinkNode = 'vos:LinkNode',
  UnstructuredDataNode = 'vos:UnstructuredDataNode',
  StructuredDataNode = 'vos:StructuredDataNode',
}

/**
 * VOSpace node interface
 */
export interface VONode {
  uri: string;
  type: VONodeType;
  name: string;
  size?: number;
  created?: string;
  modified?: string;
  properties?: Record<string, string>;
  nodes?: VONode[];
  isPublic?: boolean;
  target?: string;
}

/**
 * Query keys for VOSpace
 */
export const vospaceKeys = {
  all: ['vospace'] as const,
  nodes: () => [...vospaceKeys.all, 'nodes'] as const,
  nodeList: (path: string) => [...vospaceKeys.nodes(), path] as const,
  nodeDetail: (path: string) => [...vospaceKeys.nodes(), path, 'detail'] as const,
};

/**
 * Get nodes in a directory
 *
 * @param path - Directory path to list
 * @param isAuthenticated - Whether the user is authenticated
 * @example
 * ```tsx
 * const { data: nodes, isLoading, refetch } = useVOSpaceNodes('home/username');
 * ```
 */
export function useVOSpaceNodes(
  path: string,
  isAuthenticated?: boolean,
  options?: Omit<UseQueryOptions<VONode[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: vospaceKeys.nodeList(path),
    queryFn: async () => {
      const authHeaders = getAuthHeader();

      const response = await fetch(`/api/vospace/nodes/${path}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...authHeaders,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to list nodes: ${response.statusText}`);
      }

      const data = await response.json();
      return data as VONode[];
    },
    enabled: !!path && isAuthenticated !== false,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Create folder mutation parameters
 */
export interface CreateFolderParams {
  path: string;
  title?: string;
}

/**
 * Create a new folder
 *
 * @example
 * ```tsx
 * const { mutate: createFolder, isPending } = useCreateVOSpaceFolder();
 *
 * createFolder({
 *   path: 'home/username/new-folder',
 *   title: 'My New Folder',
 * });
 * ```
 */
export function useCreateVOSpaceFolder(
  options?: UseMutationOptions<void, Error, CreateFolderParams>
) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, ...restOptions } = options || {};

  return useMutation({
    ...restOptions,
    mutationFn: async ({ path, title }: CreateFolderParams) => {
      const authHeaders = getAuthHeader();

      const response = await fetch(`/api/vospace/nodes/${path}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...authHeaders,
        },
        credentials: 'include',
        body: JSON.stringify({
          type: 'folder',
          title,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create folder: ${response.statusText}`);
      }
    },
    onSuccess: (data, variables, ...rest) => {
      // Invalidate the parent directory listing
      const parentPath = variables.path.split('/').slice(0, -1).join('/') || '';
      queryClient.invalidateQueries({ queryKey: vospaceKeys.nodeList(parentPath) });

      // Call user's onSuccess callback if provided
      userOnSuccess?.(data, variables, ...rest);
    },
  });
}

/**
 * Upload file mutation parameters
 */
export interface UploadFileParams {
  path: string;
  file: File;
  title?: string;
}

/**
 * Upload a file to VOSpace
 *
 * @example
 * ```tsx
 * const { mutate: uploadFile, isPending } = useUploadVOSpaceFile();
 *
 * uploadFile({
 *   path: 'home/username/file.txt',
 *   file: fileObject,
 * });
 * ```
 */
export function useUploadVOSpaceFile(
  options?: UseMutationOptions<void, Error, UploadFileParams>
) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, ...restOptions } = options || {};

  return useMutation({
    ...restOptions,
    mutationFn: async ({ path, file, title }: UploadFileParams) => {
      const authHeaders = getAuthHeader();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', path);
      if (title) {
        formData.append('title', title);
      }

      const response = await fetch('/api/vospace/transfer', {
        method: 'POST',
        headers: authHeaders,
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to upload file: ${response.statusText}`);
      }
    },
    onSuccess: (data, variables, ...rest) => {
      // Invalidate the parent directory listing
      const parentPath = variables.path.split('/').slice(0, -1).join('/') || '';
      queryClient.invalidateQueries({ queryKey: vospaceKeys.nodeList(parentPath) });

      // Call user's onSuccess callback if provided
      userOnSuccess?.(data, variables, ...rest);
    },
  });
}

/**
 * Delete node mutation
 *
 * @example
 * ```tsx
 * const { mutate: deleteNode, isPending } = useDeleteVOSpaceNode();
 *
 * deleteNode('home/username/file.txt');
 * ```
 */
export function useDeleteVOSpaceNode(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, ...restOptions } = options || {};

  return useMutation({
    ...restOptions,
    mutationFn: async (path: string) => {
      const authHeaders = getAuthHeader();

      const response = await fetch(`/api/vospace/nodes/${path}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          ...authHeaders,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete node: ${response.statusText}`);
      }
    },
    onSuccess: (data, path, ...rest) => {
      // Invalidate the parent directory listing
      const parentPath = path.split('/').slice(0, -1).join('/') || '';
      queryClient.invalidateQueries({ queryKey: vospaceKeys.nodeList(parentPath) });

      // Call user's onSuccess callback if provided
      userOnSuccess?.(data, path, ...rest);
    },
  });
}

/**
 * Download file hook
 * Note: This doesn't use React Query as it triggers a browser download
 * Uses fetch with Authorization header to download file, then creates blob URL
 *
 * @example
 * ```tsx
 * const downloadFile = useDownloadVOSpaceFile();
 *
 * downloadFile('home/username/file.txt');
 * ```
 */
export function useDownloadVOSpaceFile() {
  return async (path: string) => {
    try {
      const downloadUrl = `/api/vospace/transfer?path=${encodeURIComponent(path)}`;
      const filename = path.split('/').pop() || 'download';

      console.log('[VOSpace Download] Fetching file:', path);

      // Fetch the file with authorization header
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: getAuthHeader(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Download failed: ${response.status} ${response.statusText}. ${errorText}`);
      }

      // Get the blob from response
      const blob = await response.blob();
      console.log('[VOSpace Download] File downloaded, size:', blob.size);

      // Create a blob URL and trigger download
      const blobUrl = URL.createObjectURL(blob);

      try {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log('[VOSpace Download] Download triggered for:', filename);
      } finally {
        // Clean up the blob URL - use requestAnimationFrame to ensure download starts
        requestAnimationFrame(() => {
          URL.revokeObjectURL(blobUrl);
        });
      }
    } catch (error) {
      console.error('Failed to download file:', error);
      throw error;
    }
  };
}

/**
 * Utility hook to create a folder programmatically
 *
 * @example
 * ```tsx
 * const createFolder = useCreateFolder();
 *
 * await createFolder({
 *   path: 'home/username/my-folder',
 *   title: 'My Folder'
 * });
 * ```
 */
export function useCreateFolder() {
  return async (params: { path: string; title?: string }): Promise<void> => {
    const { path, title } = params;

    try {
      console.log('[VOSpace] Creating folder:', path);

      const response = await fetch(`/api/vospace/nodes/${path}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          type: 'folder',
          title
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create folder: ${response.status} ${response.statusText}. ${errorText}`);
      }

      console.log('[VOSpace] Folder created successfully:', path);
    } catch (error) {
      console.error('[VOSpace] Failed to create folder:', error);
      throw error;
    }
  };
}

/**
 * Utility hook to create a file with content programmatically
 *
 * @example
 * ```tsx
 * const createFile = useCreateFile();
 *
 * // Create a text file
 * await createFile({
 *   path: 'home/username',
 *   filename: 'hello.txt',
 *   content: 'Hello, World!',
 *   contentType: 'text/plain'
 * });
 *
 * // Create a Python file
 * await createFile({
 *   path: 'home/username',
 *   filename: 'script.py',
 *   content: 'print("Hello")',
 *   contentType: 'text/x-python'
 * });
 *
 * // Create a JSON file
 * await createFile({
 *   path: 'home/username',
 *   filename: 'config.json',
 *   content: JSON.stringify({ key: 'value' }, null, 2),
 *   contentType: 'application/json'
 * });
 * ```
 */
export function useCreateFile() {
  return async (params: {
    path: string;
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }): Promise<void> => {
    const { path, filename, content, contentType = 'application/octet-stream' } = params;

    try {
      console.log('[VOSpace] Creating file:', `${path}/${filename}`);

      // Create a File object from the content
      // Convert Buffer to Uint8Array for Web API compatibility
      const blob = typeof content === 'string'
        ? new Blob([content], { type: contentType })
        : new Blob([new Uint8Array(content)], { type: contentType });

      const file = new File([blob], filename, { type: contentType });

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', `${path}/${filename}`);

      // Upload the file
      const response = await fetch('/api/vospace/transfer', {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create file: ${response.status} ${response.statusText}. ${errorText}`);
      }

      console.log('[VOSpace] File created successfully:', `${path}/${filename}`);
    } catch (error) {
      console.error('[VOSpace] Failed to create file:', error);
      throw error;
    }
  };
}
