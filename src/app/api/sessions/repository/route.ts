/**
 * Image Repository API Route
 *
 * Handles retrieving Image Repository hosts configured in SKAHA.
 * GET - Get image repository hosts
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
import type { ImageRepository } from '@/lib/api/skaha';

/**
 * GET /api/sessions/repository
 * List the Image Repository hosts configured as a JSON Array
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  if (!validateMethod(request, ['GET'])) {
    return methodNotAllowed(['GET']);
  }

  const authHeaders = forwardAuthHeader(request);

  const response = await fetchExternalApi(
    `${serverApiConfig.skaha.baseUrl}/v1/repository`,
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
    return errorResponse(
      'Failed to fetch image repositories',
      response.status
    );
  }

  const repositories: ImageRepository[] = await response.json();
  return successResponse(repositories);
});
