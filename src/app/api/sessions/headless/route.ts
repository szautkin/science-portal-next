/**
 * Headless Sessions API Route
 *
 * Handles launching headless (batch) sessions via Skaha v0 API.
 * Headless sessions use v0 endpoint while contributed sessions use v1.
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
import type { SessionLaunchParams } from '@/lib/api/skaha';
import { HTTP_STATUS } from '@/app/api/lib/http-constants';

/**
 * POST /api/sessions/headless
 * Launch a new headless (batch) session using Skaha v0 API
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const logger = createLogger('/api/sessions/headless', 'POST');

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

  // Validate that this is a headless session
  if (body.sessionType !== 'headless') {
    logger.logError(HTTP_STATUS.BAD_REQUEST, `Invalid session type for headless endpoint: ${body.sessionType}`);
    return errorResponse(
      'This endpoint only supports headless sessions. Use /api/sessions for other session types.',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // Build form data for SKAHA API
  const formData = new URLSearchParams();
  formData.append('name', body.sessionName);
  formData.append('image', body.containerImage);

  // Headless sessions use 'kind' parameter
  formData.append('kind', 'headless');

  // Add cores if provided
  if (body.cores) {
    formData.append('cores', body.cores.toString());
  }

  // Add ram if provided
  if (body.ram) {
    formData.append('ram', body.ram.toString());
  }

  // Add gpus if provided and > 0 (API doesn't accept 0)
  if (body.gpus && body.gpus > 0) {
    formData.append('gpus', body.gpus.toString());
  }

  // Add cmd arguments if provided (for headless sessions)
  // cmdArgs array: each element becomes a separate cmd parameter for SKAHA to build args array
  if (body.cmdArgs && body.cmdArgs.length > 0) {
    body.cmdArgs.forEach((arg) => {
      formData.append('cmd', arg);
    });
  } else if (body.cmd) {
    // Fallback to single cmd string for backward compatibility
    formData.append('cmd', body.cmd);
  }

  // Add env variables if provided (for headless sessions)
  if (body.env) {
    Object.entries(body.env).forEach(([key, value]) => {
      formData.append('env', `${key}=${value}`);
    });
  }

  const authHeaders = await forwardAuthHeader(request);

  // Build headers for the request
  const headers: HeadersInit = {
    ...authHeaders,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json',
  };

  // Add registry authentication header if credentials are provided
  if (body.registryUsername && body.registrySecret) {
    const registryAuth = Buffer.from(`${body.registryUsername}:${body.registrySecret}`).toString('base64');
    (headers as Record<string, string>)['x-skaha-registry-auth'] = registryAuth;
    logger.info(`Including registry auth for user: ${body.registryUsername}`);
  }

  logger.info(`Launching headless session: ${body.sessionName} with image: ${body.containerImage}`);

  // Use Skaha v0 API for headless sessions
  const response = await fetchExternalApi(
    `${serverApiConfig.skaha.baseUrl}/v0/session`,
    {
      method: 'POST',
      headers,
      body: formData.toString(),
    },
    serverApiConfig.skaha.timeout
  );

  if (!response.ok) {
    const errorText = await response.text();
    logger.logError(response.status, `Failed to launch headless session: ${response.statusText}`, errorText);

    // Parse and format error message for better user experience
    let userMessage = 'Failed to launch headless session';
    if (errorText) {
      // Remove extra newlines and whitespace
      const cleanedError = errorText.trim().replace(/\n+/g, ' ');

      // Check for specific error patterns
      if (cleanedError.includes('No authentication provided for unknown or private image')) {
        userMessage = 'This image requires authentication. Please provide registry username and password.';
      } else if (cleanedError.includes('authentication') || cleanedError.includes('unauthorized')) {
        userMessage = 'Authentication failed. Please check your registry credentials.';
      } else {
        // Use the error text if it's not too long
        userMessage = cleanedError.length > 200 ? 'Failed to launch headless session. Please check your configuration.' : cleanedError;
      }
    }

    return errorResponse(
      userMessage,
      response.status,
      errorText
    );
  }

  // SKAHA returns the session ID in the response body as text
  const sessionId = (await response.text()).trim();
  logger.info(`Successfully launched headless session: ${body.sessionName}, ID: ${sessionId}`);
  logger.logSuccess(HTTP_STATUS.CREATED, { sessionId, sessionName: body.sessionName });

  // Return the session ID and basic info
  return successResponse({
    id: sessionId,
    name: body.sessionName,
    type: body.sessionType,
    image: body.containerImage
  }, HTTP_STATUS.CREATED);
});
