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
import { createLogger } from '@/app/api/lib/logger';
import type { SkahaSessionResponse, SessionLaunchParams } from '@/lib/api/skaha';

/**
 * GET /api/sessions
 * List all active sessions for the current user
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = createLogger('/api/sessions', 'GET');
  logger.logRequest(request);

  if (!validateMethod(request, ['GET'])) {
    return methodNotAllowed(['GET']);
  }

  const authHeaders = forwardAuthHeader(request);

  const response = await fetchExternalApi(
    `${serverApiConfig.skaha.baseUrl}/v1/session`,
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
    logger.logError(response.status, `Failed to fetch sessions: ${response.statusText}`);
    return errorResponse(
      'Failed to fetch sessions',
      response.status
    );
  }

  const sessions: SkahaSessionResponse[] = await response.json();
  logger.info(`Retrieved ${sessions.length} session(s)`);
  logger.logSuccess(200, { count: sessions.length });
  return successResponse(sessions);
});

/**
 * POST /api/sessions
 * Launch a new session
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const logger = createLogger('/api/sessions', 'POST');

  if (!validateMethod(request, ['POST'])) {
    return methodNotAllowed(['POST']);
  }

  const body = await getRequestBody<SessionLaunchParams>(request);
  logger.logRequest(request, body);

  // Validate required fields
  if (!body.sessionType || !body.sessionName || !body.containerImage) {
    logger.logError(400, 'Missing required fields: sessionType, sessionName, containerImage');
    return errorResponse(
      'Missing required fields: sessionType, sessionName, containerImage',
      400
    );
  }

  if (!body.cores || !body.ram) {
    logger.logError(400, 'Missing required fields: cores, ram');
    return errorResponse(
      'Missing required fields: cores, ram',
      400
    );
  }

  const authHeaders = forwardAuthHeader(request);

  const response = await fetchExternalApi(
    `${serverApiConfig.skaha.baseUrl}/v1/session`,
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
    logger.logError(response.status, `Failed to launch session: ${response.statusText}`, errorText);
    return errorResponse(
      'Failed to launch session',
      response.status,
      errorText
    );
  }

  const session: SkahaSessionResponse = await response.json();
  logger.info(`Successfully launched session: ${session.name}`);
  logger.logSuccess(201, { sessionId: session.id, sessionName: session.name });
  return successResponse(session, 201);
});
