/**
 * Token Storage Utilities
 *
 * Manages authentication tokens in browser storage.
 * Uses localStorage by default for persistence across page reloads.
 *
 * Note: When using OIDC mode, tokens are managed by NextAuth via cookies.
 * This storage is only used for CANFAR mode.
 */

const TOKEN_KEY = 'canfar_auth_token';

/**
 * Check if currently using OIDC authentication mode
 */
function isOIDCMode(): boolean {
  return typeof window !== 'undefined' &&
         process.env.NEXT_PUBLIC_USE_CANFAR !== 'true';
}

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
 * Returns Bearer token from localStorage for both OIDC and CANFAR modes
 *
 * @returns Object with Authorization header or empty object if no token
 */
export function getAuthHeader(): Record<string, string> {
  const token = getToken();

  console.log('\n' + '🔑'.repeat(40));
  console.log('🔑 getAuthHeader() - Reading token from localStorage');
  console.log('🔑'.repeat(40));
  if (token) {
    console.log('✅ Token found in localStorage');
    console.log('📋 Token length:', token.length);
    console.log('📋 First 100 chars:', token.substring(0, 100));
    console.log('📋 FULL TOKEN:');
    console.log(token);
    console.log('🔑'.repeat(40) + '\n');

    return {
      Authorization: `Bearer ${token}`,
    };
  }

  console.log('❌ No token found in localStorage');
  console.log('🔑'.repeat(40) + '\n');
  return {};
}

/**
 * Clear all auth-related storage
 */
export function clearAuth(): void {
  removeToken();
}
