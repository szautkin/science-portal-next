/**
 * Session Renew API Route
 *
 * Handles extending session expiry time.
 * POST - Extend session expiry using SKAHA action API
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
import { createLogger } from '@/app/api/lib/logger';
import type { SkahaSessionResponse } from '@/lib/api/skaha';

interface RenewSessionParams {
  hours?: number; // Optional - SKAHA uses configured expiry time if not specified
}

/**
 * POST /api/sessions/[id]/renew
 * Extend session expiry time
 *
 * According to SKAHA API docs: POST /v1/session/{sessionID}?action=renew
 * This sets the session expiry time based on the configured expiry time in skaha.sessionexpiry
 */
export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const logger = createLogger('/api/sessions/[id]/renew', 'POST');

  if (!validateMethod(request, ['POST'])) {
    return methodNotAllowed(['POST']);
  }

  const sessionId = params.id;

  // Log the incoming request
  logger.logRequest(request);
  logger.info(`Renewing session: ${sessionId}`);

  const authHeaders = forwardAuthHeader(request);

  // SKAHA API: POST /v1/session/{sessionID} with action=renew as form data
  const response = await fetchExternalApi(
    `${serverApiConfig.skaha.baseUrl}/v1/session/${sessionId}`,
    {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: 'action=renew',
    },
    serverApiConfig.skaha.timeout
  );

  if (!response.ok) {
    logger.logError(response.status, `Failed to renew session: ${response.statusText}`);
    return errorResponse(
      'Failed to renew session',
      response.status
    );
  }

  const session: SkahaSessionResponse = await response.json();
  logger.info(`Successfully renewed session: ${session.name}, new expiry: ${session.expiryTime}`);
  logger.logSuccess(200, { sessionId: session.id, expiryTime: session.expiryTime });
  return successResponse(session);
});
