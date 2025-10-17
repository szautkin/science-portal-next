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
import { HTTP_STATUS } from '@/app/api/lib/http-constants';

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
  logger.logSuccess(HTTP_STATUS.OK, { count: sessions.length });
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
    logger.logError(HTTP_STATUS.BAD_REQUEST, 'Missing required fields: sessionType, sessionName, containerImage');
    return errorResponse(
      'Missing required fields: sessionType, sessionName, containerImage',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // Build form data for SKAHA API
  const formData = new URLSearchParams();
  formData.append('name', body.sessionName);
  formData.append('image', body.containerImage);

  // Add type if provided (for non-headless sessions)
  if (body.sessionType && body.sessionType !== 'headless') {
    formData.append('type', body.sessionType);
  }

  // Add cores if provided
  if (body.cores) {
    formData.append('cores', body.cores.toString());
  }

  // Add ram if provided
  if (body.ram) {
    formData.append('ram', body.ram.toString());
  }

  // Add cmd if provided (for headless sessions)
  if (body.cmd) {
    formData.append('cmd', body.cmd);
  }

  // Add env variables if provided (for headless sessions)
  if (body.env) {
    Object.entries(body.env).forEach(([key, value]) => {
      formData.append('env', `${key}=${value}`);
    });
  }

  const authHeaders = forwardAuthHeader(request);

  logger.info(`Launching session: ${body.sessionName} with image: ${body.containerImage}`);

  const response = await fetchExternalApi(
    `${serverApiConfig.skaha.baseUrl}/v1/session`,
    {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData.toString(),
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

  // SKAHA returns the session ID in the response body as text
  const sessionId = await response.text();
  logger.info(`Successfully launched session: ${body.sessionName}, ID: ${sessionId}`);
  logger.logSuccess(HTTP_STATUS.CREATED, { sessionId, sessionName: body.sessionName });

  // Return the session ID and basic info
  return successResponse({
    id: sessionId,
    name: body.sessionName,
    type: body.sessionType,
    image: body.containerImage
  }, HTTP_STATUS.CREATED);
});
