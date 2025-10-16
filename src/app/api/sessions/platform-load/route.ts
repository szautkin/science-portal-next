/**
 * Platform Load API Route
 *
 * Handles retrieving platform load/context information.
 * GET - Get platform load statistics
 */

import { NextRequest } from 'next/server';
import {
  withErrorHandling,
  validateMethod,
  methodNotAllowed,
  errorResponse,
  successResponse,
  fetchExternalApi,
  forwardAuthHeader
} from '@/app/api/lib/api-utils';
import { serverApiConfig } from '@/app/api/lib/server-config';
import { createLogger } from '@/app/api/lib/logger';
import type { PlatformLoad } from '@/lib/api/skaha';

/**
 * GET /api/sessions/platform-load
 * Get platform load statistics
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = createLogger('/api/sessions/platform-load', 'GET');
  logger.logRequest(request);

  if (!validateMethod(request, ['GET'])) {
    return methodNotAllowed(['GET']);
  }

  const authHeaders = forwardAuthHeader(request);

  const response = await fetchExternalApi(
    `${serverApiConfig.skaha.baseUrl}/v1/session?view=stats`,
    {
      method: 'GET',
      headers: {
        ...authHeaders,
        'Accept': 'application/json',
      },
    },
    serverApiConfig.skaha.timeout
  );

  if (!response.ok) {
    logger.logError(response.status, `Failed to fetch platform load: ${response.statusText}`);
    return errorResponse(
      'Failed to fetch platform load',
      response.status
    );
  }

  const data = await response.json();

  // Transform API response to PlatformLoad interface
  // Use ISO string for consistent serialization and to avoid hydration mismatch
  const lastUpdate = new Date().toISOString();

  const platformLoad: PlatformLoad = {
    cpu: {
      name: 'CPU',
      used: data.availableCores - data.requestedCores,
      free: data.requestedCores,
    },
    ram: {
      name: 'RAM',
      used: data.availableRAM - data.requestedRAM,
      free: data.requestedRAM,
    },
    instances: {
      name: 'Instances',
      used: data.currentSessions,
      free: data.maxSessions - data.currentSessions,
      headless: data.headlessSessions,
    },
    maxValues: {
      cpu: data.availableCores,
      ram: data.availableRAM,
      instances: data.maxSessions,
    },
    lastUpdate: lastUpdate as any, // Cast to match PlatformLoad type
  };

  logger.info(`Platform stats - Sessions: ${data.currentSessions}/${data.maxSessions}, CPU: ${data.requestedCores}/${data.availableCores}, RAM: ${data.requestedRAM}/${data.availableRAM}`);
  logger.logSuccess(200, platformLoad);
  return successResponse(platformLoad);
});
