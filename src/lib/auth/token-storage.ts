/**
 * Token Storage Utilities
 *
 * Manages authentication tokens in browser storage.
 * Uses localStorage by default for persistence across page reloads.
 */

const TOKEN_KEY = 'canfar_auth_token';

/**
 * Save authentication token
 *
 * @param token - The authentication token to store
 */
export function saveToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Get authentication token
 *
 * @returns The stored token or null if not found
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Remove authentication token
 */
export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Check if token exists
 */
export function hasToken(): boolean {
  return getToken() !== null;
}

/**
 * Get Authorization header value
 *
 * @returns Object with Authorization header or empty object if no token
 */
export function getAuthHeader(): Record<string, string> {
  const token = getToken();
  if (!token) return {};

  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Clear all auth-related storage
 */
export function clearAuth(): void {
  removeToken();
}
