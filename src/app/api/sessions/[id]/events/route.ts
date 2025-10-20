/**
 * Session Events API Route
 *
 * Handles retrieving events for a specific session.
 * GET - Get session events
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

/**
 * GET /api/sessions/[id]/events
 * Get events for a specific session
 */
export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  if (!validateMethod(request, ['GET'])) {
    return methodNotAllowed(['GET']);
  }

  const sessionId = params.id;
  const authHeaders = await forwardAuthHeader(request);

  const response = await fetchExternalApi(
    `${serverApiConfig.skaha.baseUrl}/v1/session/${sessionId}/events`,
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
      'Failed to fetch session events',
      response.status
    );
  }

  const events = await response.json();
  return successResponse(events);
});
