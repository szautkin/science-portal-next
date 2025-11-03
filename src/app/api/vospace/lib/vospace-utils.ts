/**
 * VOSpace Utilities
 *
 * Helper functions for working with VOSpace URIs and paths.
 * VOSpace uses URIs in the format: vos://cadc.nrc.ca~arc/path/to/node
 */

/**
 * VOSpace URI prefix for CADC VOSpace (Arc service)
 */
const VOSPACE_PREFIX = 'vos://cadc.nrc.ca~arc';

/**
 * Converts a regular path to a VOSpace URI
 *
 * @param path - The path to convert (e.g., "home/username/folder/file.txt")
 * @returns VOSpace URI (e.g., "vos://cadc.nrc.ca~arc/home/username/folder/file.txt")
 *
 * @example
 * toVOSpaceURI('home/user1/data') // => 'vos://cadc.nrc.ca~arc/home/user1/data'
 * toVOSpaceURI('/home/user1/data') // => 'vos://cadc.nrc.ca~arc/home/user1/data'
 */
export function toVOSpaceURI(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;

  // If already a VOSpace URI, return as-is
  if (cleanPath.startsWith('vos://')) {
    return cleanPath;
  }

  return `${VOSPACE_PREFIX}/${cleanPath}`;
}

/**
 * Extracts the path from a VOSpace URI
 *
 * @param uri - The VOSpace URI to parse
 * @returns The extracted path without the VOSpace prefix
 *
 * @example
 * fromVOSpaceURI('vos://cadc.nrc.ca~arc/home/user1/data') // => 'home/user1/data'
 */
export function fromVOSpaceURI(uri: string): string {
  if (uri.startsWith(VOSPACE_PREFIX)) {
    const path = uri.substring(VOSPACE_PREFIX.length);
    // Remove leading slash if present
    return path.startsWith('/') ? path.substring(1) : path;
  }

  // If not a VOSpace URI, return as-is (might be a regular path)
  return uri.startsWith('/') ? uri.substring(1) : uri;
}

/**
 * Normalizes a path by removing duplicate slashes and cleaning up
 *
 * @param path - The path to normalize
 * @returns Normalized path
 *
 * @example
 * normalizePath('//home//user1///data/') // => 'home/user1/data'
 * normalizePath('home/./user1/../user1/data') // => 'home/user1/data'
 */
export function normalizePath(path: string): string {
  if (!path) {
    return '';
  }

  // Remove leading/trailing slashes
  let normalized = path.replace(/^\/+|\/+$/g, '');

  // Replace multiple slashes with single slash
  normalized = normalized.replace(/\/+/g, '/');

  // Split into parts for path resolution
  const parts = normalized.split('/');
  const stack: string[] = [];

  for (const part of parts) {
    if (part === '..') {
      // Go up one level if possible
      if (stack.length > 0) {
        stack.pop();
      }
    } else if (part !== '.' && part !== '') {
      // Add to stack if not current directory or empty
      stack.push(part);
    }
  }

  return stack.join('/');
}

/**
 * Gets the parent path of a given path
 *
 * @param path - The path to get the parent of
 * @returns The parent path, or empty string if at root
 *
 * @example
 * getParentPath('home/user1/data/file.txt') // => 'home/user1/data'
 * getParentPath('home/user1/data') // => 'home/user1'
 * getParentPath('home') // => ''
 */
export function getParentPath(path: string): string {
  const normalized = normalizePath(path);

  if (!normalized) {
    return '';
  }

  const lastSlashIndex = normalized.lastIndexOf('/');

  if (lastSlashIndex === -1) {
    // No parent (we're at root level)
    return '';
  }

  return normalized.substring(0, lastSlashIndex);
}

/**
 * Gets the node name (filename or directory name) from a path
 *
 * @param path - The path to extract the node name from
 * @returns The node name
 *
 * @example
 * getNodeName('home/user1/data/file.txt') // => 'file.txt'
 * getNodeName('home/user1/data') // => 'data'
 * getNodeName('/home/user1/') // => 'user1'
 */
export function getNodeName(path: string): string {
  const normalized = normalizePath(path);

  if (!normalized) {
    return '';
  }

  const lastSlashIndex = normalized.lastIndexOf('/');

  if (lastSlashIndex === -1) {
    // No slash, the entire path is the name
    return normalized;
  }

  return normalized.substring(lastSlashIndex + 1);
}

/**
 * Joins path segments together, handling slashes properly
 *
 * @param segments - Path segments to join
 * @returns Joined path
 *
 * @example
 * joinPath('home', 'user1', 'data') // => 'home/user1/data'
 * joinPath('/home/', '/user1/', '/data/') // => 'home/user1/data'
 */
export function joinPath(...segments: string[]): string {
  const joined = segments.join('/');
  return normalizePath(joined);
}

/**
 * Checks if a path is a child of another path
 *
 * @param childPath - The potential child path
 * @param parentPath - The potential parent path
 * @returns True if childPath is a descendant of parentPath
 *
 * @example
 * isChildPath('home/user1/data/file.txt', 'home/user1') // => true
 * isChildPath('home/user1/data', 'home/user2') // => false
 */
export function isChildPath(childPath: string, parentPath: string): boolean {
  const normalizedChild = normalizePath(childPath);
  const normalizedParent = normalizePath(parentPath);

  if (!normalizedParent) {
    // Everything is a child of root
    return true;
  }

  return normalizedChild.startsWith(normalizedParent + '/');
}

/**
 * Sanitizes a filename to be safe for VOSpace URIs
 * Replaces spaces and special characters that cause issues in Unix paths
 *
 * @param filename - The filename to sanitize
 * @returns Sanitized filename safe for VOSpace URIs
 *
 * @example
 * sanitizeFilename('My File Name.txt') // => 'My_File_Name.txt'
 * sanitizeFilename('A1 LUXURY EVENTS 335.jpg') // => 'A1_LUXURY_EVENTS_335.jpg'
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) {
    return '';
  }

  // Replace spaces with underscores
  let sanitized = filename.replace(/\s+/g, '_');

  // Replace problematic characters with underscores
  // Keep: letters, numbers, dots, hyphens, underscores
  // Replace: everything else
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Remove multiple consecutive underscores
  sanitized = sanitized.replace(/_+/g, '_');

  // Remove leading/trailing underscores
  sanitized = sanitized.replace(/^_+|_+$/g, '');

  // Ensure we don't end up with an empty string
  if (!sanitized) {
    return 'file';
  }

  return sanitized;
}

/**
 * Sanitizes a full path by sanitizing only the filename portion
 * Keeps the directory structure intact
 *
 * @param path - The full path to sanitize
 * @returns Path with sanitized filename
 *
 * @example
 * sanitizePath('home/user/My File.txt') // => 'home/user/My_File.txt'
 */
export function sanitizePath(path: string): string {
  if (!path) {
    return '';
  }

  const normalized = normalizePath(path);
  const parentPath = getParentPath(normalized);
  const filename = getNodeName(normalized);
  const sanitizedFilename = sanitizeFilename(filename);

  if (parentPath) {
    return joinPath(parentPath, sanitizedFilename);
  }

  return sanitizedFilename;
}

/**
 * Validates that a path is safe and doesn't contain invalid characters
 *
 * @param path - The path to validate
 * @returns True if the path is valid
 */
export function isValidPath(path: string): boolean {
  if (!path) {
    return false;
  }

  // Check for null bytes and other problematic characters
  if (path.includes('\0') || path.includes('\r') || path.includes('\n')) {
    return false;
  }

  // After normalization, path should not be empty
  const normalized = normalizePath(path);

  return normalized.length > 0;
}
