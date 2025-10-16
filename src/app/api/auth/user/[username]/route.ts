/**
 * User Details API Route
 *
 * GET /api/auth/user/[username]
 * Returns detailed information for a specific user
 */

import { NextRequest } from 'next/server';
import {
  withErrorHandling,
  errorResponse,
  successResponse,
  fetchExternalApi,
  forwardCookies,
  validateMethod,
  methodNotAllowed,
} from '@/app/api/lib/api-utils';
import { serverApiConfig } from '@/app/api/lib/server-config';

export interface User {
  username: string;
  email?: string;
  displayName?: string;
  groups?: string[];
}

interface RouteContext {
  params: Promise<{
    username: string;
  }>;
}

export const GET = withErrorHandling(
  async (request: NextRequest, context: RouteContext) => {
    if (!validateMethod(request, ['GET'])) {
      return methodNotAllowed(['GET']);
    }

    const { username } = await context.params;

    if (!username) {
      return errorResponse('Username parameter is required', 400);
    }

    const cookies = forwardCookies(request);

    const response = await fetchExternalApi(
      `${serverApiConfig.login.baseUrl}/users/${encodeURIComponent(username)}`,
      {
        method: 'GET',
        headers: {
          ...cookies,
          'Accept': 'application/json',
        },
      },
      serverApiConfig.login.timeout
    );

    if (!response.ok) {
      const statusCode = response.status;
      let errorMessage = 'Failed to get user details';

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If error response is not JSON, use default message
        if (statusCode === 404) {
          errorMessage = `User '${username}' not found`;
        } else if (statusCode === 401) {
          errorMessage = 'Authentication required';
        } else if (statusCode === 403) {
          errorMessage = 'Access forbidden';
        }
      }

      return errorResponse(errorMessage, statusCode);
    }

    const user: User = await response.json();
    return successResponse(user);
  }
);
