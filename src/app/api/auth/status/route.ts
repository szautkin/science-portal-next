/**
 * Auth Status API Route
 *
 * GET /api/auth/status
 * Returns current authentication status and user information (whoami)
 */

import { NextRequest } from 'next/server';
import {
  withErrorHandling,
  errorResponse,
  successResponse,
  fetchExternalApi,
  forwardAuthHeader,
  validateMethod,
  methodNotAllowed,
} from '@/app/api/lib/api-utils';
import { serverApiConfig } from '@/app/api/lib/server-config';
import { createLogger } from '@/app/api/lib/logger';

export interface User {
  username: string;
  email?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  institute?: string;
  internalID?: string;
  numericID?: string;
  uid?: number;
  gid?: number;
  homeDirectory?: string;
  identities?: Array<{
    type: string;
    value: string | number;
  }>;
  groups?: string[];
}

export interface AuthStatus {
  authenticated: boolean;
  user?: User;
}

export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = createLogger('/api/auth/status', 'GET');

  if (!validateMethod(request, ['GET'])) {
    logger.logError(405, 'Method not allowed');
    return methodNotAllowed(['GET']);
  }

  logger.logRequest(request);

  const authHeaders = forwardAuthHeader(request);
  const externalUrl = `${serverApiConfig.login.baseUrl}/whoami`;

  logger.logExternalCall(externalUrl, 'GET', { ...authHeaders, 'Accept': 'application/json' });

  const response = await fetchExternalApi(
    externalUrl,
    {
      method: 'GET',
      headers: {
        ...authHeaders,
        'Accept': 'application/json',
      },
    },
    serverApiConfig.login.timeout
  );

  logger.logExternalResponse(response.status, response.statusText);

  // If not authenticated, return unauthenticated status instead of error
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      logger.info('User not authenticated', { status: response.status });
      const result: AuthStatus = { authenticated: false };
      logger.logSuccess(200, result);
      return successResponse<AuthStatus>(result);
    }

    // For other errors, return error response
    const statusCode = response.status;
    let errorMessage = 'Failed to get authentication status';

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
      logger.logExternalResponse(statusCode, response.statusText, errorData);
    } catch {
      // If error response is not JSON, use default message
    }

    logger.logError(statusCode, errorMessage);
    return errorResponse(errorMessage, statusCode);
  }

  const cadcResponse: any = await response.json();
  logger.logExternalResponse(response.status, response.statusText, cadcResponse);

  // Parse CADC's complex XML-based JSON structure
  const cadcUser = cadcResponse.user || cadcResponse;

  // Extract username from posixDetails or identities
  const username = cadcUser.posixDetails?.username?.$ ||
                   cadcUser.identities?.$?.find((i: any) => i.identity?.['@type'] === 'HTTP')?.identity?.$ ||
                   '';

  // Extract personal details
  const firstName = cadcUser.personalDetails?.firstName?.$ || '';
  const lastName = cadcUser.personalDetails?.lastName?.$ || '';
  const email = cadcUser.personalDetails?.email?.$ || '';
  const institute = cadcUser.personalDetails?.institute?.$ || '';

  // Extract internal IDs
  const internalID = cadcUser.internalID?.uri?.$ || '';

  // Extract numeric ID from identities
  const numericIdentity = cadcUser.identities?.$?.find((i: any) => i.identity?.['@type'] === 'CADC');
  const numericID = numericIdentity?.identity?.$ || '';

  // Extract POSIX details
  const uid = cadcUser.posixDetails?.uid?.$ || 0;
  const gid = cadcUser.posixDetails?.gid?.$ || 0;
  const homeDirectory = cadcUser.posixDetails?.homeDirectory?.$ || '';

  // Parse all identities
  const identities = cadcUser.identities?.$?.map((item: any) => ({
    type: item.identity?.['@type'] || '',
    value: item.identity?.$ || '',
  })) || [];

  // Create complete user object with all CADC data
  const user: User = {
    username,
    email,
    displayName: firstName && lastName ? `${firstName} ${lastName}` : username,
    firstName,
    lastName,
    institute,
    internalID,
    numericID,
    uid: typeof uid === 'number' ? uid : parseInt(uid, 10),
    gid: typeof gid === 'number' ? gid : parseInt(gid, 10),
    homeDirectory,
    identities,
  };

  logger.info('User authenticated', { username: user.username, uid: user.uid });

  const result: AuthStatus = {
    authenticated: true,
    user,
  };

  logger.logSuccess(200, result);
  return successResponse<AuthStatus>(result);
});
