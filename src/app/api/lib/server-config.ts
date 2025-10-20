/**
 * Server-Side API Configuration
 *
 * Configuration for server-side API calls to external services.
 * These environment variables are NOT exposed to the client.
 */

/**
 * Check if using OIDC authentication mode
 */
function isOIDCMode(): boolean {
  return process.env.NEXT_USE_CANFAR !== 'true';
}

/**
 * Get Skaha API base URL based on auth mode
 * - OIDC mode: Uses NEXT_PUBLIC_SRC_SKAHA_API (src.canfar.net/skaha - accepts SKA IAM tokens)
 * - CANFAR mode: Uses SKAHA_API (ws-uv.canfar.net/skaha - accepts CANFAR auth)
 */
function getSkahaBaseUrl(): string {
  if (isOIDCMode()) {
    // OIDC mode: Use SRC Skaha API that accepts SKA IAM tokens
    const srcSkahaApi = process.env.NEXT_PUBLIC_SRC_SKAHA_API || process.env.SRC_SKAHA_API || 'https://src.canfar.net/skaha';
    console.log('🔍 Server config - OIDC mode, using SRC Skaha API:', srcSkahaApi);
    return srcSkahaApi;
  } else {
    // CANFAR mode: Use standard CANFAR Skaha API
    const canfarSkahaApi = process.env.SKAHA_API || process.env.NEXT_PUBLIC_SKAHA_API;
    console.log('🔍 Server config - CANFAR mode, using CANFAR Skaha API:', canfarSkahaApi);
    return canfarSkahaApi || '';
  }
}

/**
 * Get Storage API base URL based on auth mode
 * - OIDC mode: Uses SRC Cavern API (src.canfar.net/cavern - accepts SKA IAM tokens)
 * - CANFAR mode: Uses SERVICE_STORAGE_API (standard CANFAR storage)
 */
function getStorageBaseUrl(): string {
  if (isOIDCMode()) {
    // OIDC mode: Use SRC Cavern API that accepts SKA IAM tokens
    const srcCavernApi = process.env.NEXT_PUBLIC_SRC_CAVERN_API || process.env.SRC_CAVERN_API || 'https://src.canfar.net/cavern';
    console.log('🔍 Server config - OIDC mode, using SRC Cavern API:', srcCavernApi);
    return srcCavernApi;
  } else {
    // CANFAR mode: Use standard CANFAR storage API
    const canfarStorageApi = process.env.SERVICE_STORAGE_API || process.env.NEXT_PUBLIC_SERVICE_STORAGE_API;
    console.log('🔍 Server config - CANFAR mode, using CANFAR Storage API:', canfarStorageApi);
    return canfarStorageApi || '';
  }
}

/**
 * Server-side API configuration
 * Uses server-only environment variables (without NEXT_PUBLIC_ prefix)
 * In OIDC mode, uses SRC endpoints (src.canfar.net)
 * In CANFAR mode, uses CANFAR endpoints (ws-*.canfar.net)
 */
export const serverApiConfig = {
  storage: {
    baseUrl: getStorageBaseUrl(),
    timeout: parseInt(process.env.API_TIMEOUT || process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10),
  },
  login: {
    baseUrl: process.env.LOGIN_API || process.env.NEXT_PUBLIC_LOGIN_API || '',
    timeout: parseInt(process.env.API_TIMEOUT || process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10),
  },
  skaha: {
    baseUrl: getSkahaBaseUrl(),
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
