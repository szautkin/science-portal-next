/**
 * Context API Route
 *
 * Handles retrieving available CPU cores and RAM for the calling user.
 * GET - Get context information (available resources)
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
import { HTTP_STATUS } from '@/app/api/lib/http-constants';
import { serverApiConfig } from '@/app/api/lib/server-config';
import { createLogger } from '@/app/api/lib/logger';

/**
 * GET /api/sessions/context
 * Get available CPU cores and RAM for the calling user
 *
 * Returns:
 * - Available CPU cores
 * - Available RAM
 * - Default values for cores and RAM
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = createLogger('/api/sessions/context', 'GET');
  logger.logRequest(request);

  if (!validateMethod(request, ['GET'])) {
    return methodNotAllowed(['GET']);
  }

  const authHeaders = await forwardAuthHeader(request);

  const response = await fetchExternalApi(
    `${serverApiConfig.skaha.baseUrl}/v1/context`,
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
    logger.logError(response.status, `Failed to fetch context: ${response.statusText}`);
    return errorResponse(
      'Failed to fetch context',
      response.status
    );
  }

  const context = await response.json();

  // Log the fetched GPU options
  console.log('🎮 Fetched GPU options from API:', context?.gpus);

  // Check environment variable to determine if we use dynamic GPU values
  const useDynamicGpuValues = process.env.NEXT_PUBLIC_DYNAMIC_GPU_VALUES === 'true';

  if (context && context.gpus) {
    if (!useDynamicGpuValues) {
      // Use hardcoded [0, 1] when dynamic GPU values are disabled
      context.gpus.options = [0, 1];
      console.log('🎮 Using hardcoded GPU options:', context.gpus.options);
    } else {
      // Use values from API when dynamic GPU values are enabled
      console.log('🎮 Using dynamic GPU options from API:', context.gpus.options);
    }
  }

  logger.info('Successfully retrieved context information');
  logger.logSuccess(HTTP_STATUS.OK, context);
  return successResponse(context);
});
