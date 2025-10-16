/**
 * Session Detail API Routes
 *
 * Handles individual session operations.
 * GET - Get session details
 * DELETE - Terminate a session
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
import type { Session } from '@/lib/api/skaha';

/**
 * GET /api/sessions/[id]
 * Get details for a specific session
 */
export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  if (!validateMethod(request, ['GET'])) {
    return methodNotAllowed(['GET']);
  }

  const sessionId = params.id;
  const authHeaders = forwardAuthHeader(request);

  const response = await fetchExternalApi(
    `${serverApiConfig.skaha.baseUrl}/v1/session/${sessionId}`,
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
      'Session not found',
      response.status
    );
  }

  const session: Session = await response.json();
  return successResponse(session);
});

/**
 * DELETE /api/sessions/[id]
 * Terminate a session
 */
export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  if (!validateMethod(request, ['DELETE'])) {
    return methodNotAllowed(['DELETE']);
  }

  const sessionId = params.id;
  const authHeaders = forwardAuthHeader(request);

  const response = await fetchExternalApi(
    `${serverApiConfig.skaha.baseUrl}/v1/session/${sessionId}`,
    {
      method: 'DELETE',
      headers: {
        ...authHeaders,
      },
    },
    serverApiConfig.skaha.timeout
  );

  if (!response.ok) {
    return errorResponse(
      'Failed to terminate session',
      response.status
    );
  }

  return successResponse({ success: true }, 204);
});
