/**
 * Server-Side API Configuration
 *
 * Configuration for server-side API calls to external services.
 * These environment variables are NOT exposed to the client.
 */

/**
 * Server-side API configuration
 * Uses server-only environment variables (without NEXT_PUBLIC_ prefix)
 */
export const serverApiConfig = {
  storage: {
    baseUrl: process.env.SERVICE_STORAGE_API || process.env.NEXT_PUBLIC_SERVICE_STORAGE_API || '',
    timeout: parseInt(process.env.API_TIMEOUT || process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10),
  },
  login: {
    baseUrl: process.env.LOGIN_API || process.env.NEXT_PUBLIC_LOGIN_API || '',
    timeout: parseInt(process.env.API_TIMEOUT || process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10),
  },
  skaha: {
    baseUrl: process.env.SKAHA_API || process.env.NEXT_PUBLIC_SKAHA_API || '',
    timeout: parseInt(process.env.API_TIMEOUT || process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10),
  },
} as const;

/**
 * Validates that all required server configuration is present
 */
export function validateServerConfig(): void {
  const required = [
    { name: 'SERVICE_STORAGE_API', value: serverApiConfig.storage.baseUrl },
    { name: 'LOGIN_API', value: serverApiConfig.login.baseUrl },
    { name: 'SKAHA_API', value: serverApiConfig.skaha.baseUrl },
  ];

  const missing = required.filter(({ value }) => !value);

  if (missing.length > 0) {
    const missingNames = missing.map(({ name }) => name).join(', ');
    console.warn(
      `Missing server environment variables: ${missingNames}. ` +
      `Falling back to NEXT_PUBLIC_ versions.`
    );
  }
}

// Validate on import (server-side only)
if (typeof window === 'undefined') {
  validateServerConfig();
}
