/**
 * Sessions API Routes
 *
 * Handles listing all sessions and launching new sessions.
 * GET - List all active sessions
 * POST - Launch a new session
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
import type { Session, SessionLaunchParams } from '@/lib/api/skaha';

/**
 * GET /api/sessions
 * List all active sessions for the current user
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  if (!validateMethod(request, ['GET'])) {
    return methodNotAllowed(['GET']);
  }

  const authHeaders = forwardAuthHeader(request);

  const response = await fetchExternalApi(
    `${serverApiConfig.skaha.baseUrl}/session`,
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
      'Failed to fetch sessions',
      response.status
    );
  }

  const sessions: Session[] = await response.json();
  return successResponse(sessions);
});

/**
 * POST /api/sessions
 * Launch a new session
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  if (!validateMethod(request, ['POST'])) {
    return methodNotAllowed(['POST']);
  }

  const body = await getRequestBody<SessionLaunchParams>(request);

  // Validate required fields
  if (!body.sessionType || !body.sessionName || !body.containerImage) {
    return errorResponse(
      'Missing required fields: sessionType, sessionName, containerImage',
      400
    );
  }

  if (!body.cores || !body.ram) {
    return errorResponse(
      'Missing required fields: cores, ram',
      400
    );
  }

  const authHeaders = forwardAuthHeader(request);

  const response = await fetchExternalApi(
    `${serverApiConfig.skaha.baseUrl}/session`,
    {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    },
    serverApiConfig.skaha.timeout
  );

  if (!response.ok) {
    const errorText = await response.text();
    return errorResponse(
      'Failed to launch session',
      response.status,
      errorText
    );
  }

  const session: Session = await response.json();
  return successResponse(session, 201);
});
