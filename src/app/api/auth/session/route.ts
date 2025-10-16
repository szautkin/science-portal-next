/**
 * NextAuth Session API Route
 *
 * This endpoint is called by NextAuth's SessionProvider.
 * We use our custom auth system, so this returns the auth status
 * from our /api/auth/status endpoint.
 */

import { NextRequest } from 'next/server';
import {
  withErrorHandling,
  successResponse,
  fetchExternalApi,
  forwardCookies,
} from '@/app/api/lib/api-utils';
import { serverApiConfig } from '@/app/api/lib/server-config';

/**
 * GET /api/auth/session
 * Returns the current session status for NextAuth compatibility
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  try {
    const cookies = forwardCookies(request);

    // Call our custom auth status endpoint
    const response = await fetchExternalApi(
      `${serverApiConfig.login.baseUrl}/whoami`,
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
      // User not authenticated
      return successResponse(null);
    }

    const user = await response.json();

    // Return session in NextAuth format
    return successResponse({
      user: {
        name: user.displayName || user.username,
        email: user.email,
        image: null,
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    });
  } catch (error) {
    // Return null session on error (not authenticated)
    return successResponse(null);
  }
});
