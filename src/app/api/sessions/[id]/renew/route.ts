/**
 * Session Renew API Route
 *
 * Handles extending session expiry time.
 * POST - Extend session expiry
 */

import { NextRequest } from 'next/server';
import {
  withErrorHandling,
  validateMethod,
  methodNotAllowed,
  errorResponse,
  successResponse,
  fetchExternalApi,
  forwardAuthHeader,
  getRequestBody,
} from '@/app/api/lib/api-utils';
import { serverApiConfig } from '@/app/api/lib/server-config';
import type { Session } from '@/lib/api/skaha';

interface RenewSessionParams {
  hours: number;
}

/**
 * POST /api/sessions/[id]/renew
 * Extend session expiry time
 */
export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  if (!validateMethod(request, ['POST'])) {
    return methodNotAllowed(['POST']);
  }

  const sessionId = params.id;
  const body = await getRequestBody<RenewSessionParams>(request);

  // Validate required fields
  if (!body.hours || typeof body.hours !== 'number') {
    return errorResponse(
      'Missing or invalid required field: hours (must be a number)',
      400
    );
  }

  const authHeaders = forwardAuthHeader(request);

  const response = await fetchExternalApi(
    `${serverApiConfig.skaha.baseUrl}/session/${sessionId}/renew`,
    {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ hours: body.hours }),
    },
    serverApiConfig.skaha.timeout
  );

  if (!response.ok) {
    return errorResponse(
      'Failed to renew session',
      response.status
    );
  }

  const session: Session = await response.json();
  return successResponse(session);
});
