/**
 * Storage Raw API Route
 *
 * GET /api/storage/raw/[username]?name= - Get raw storage data (XML) for VOSpace
 * This endpoint is used by userStorageWidget.tsx to fetch raw XML data
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  withErrorHandling,
  errorResponse,
  fetchExternalApi,
  forwardAuthHeader
} from '@/app/api/lib/api-utils';
import { serverApiConfig } from '@/app/api/lib/server-config';

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { username: string } }
) => {
  const username = params.username;
  const searchParams = request.nextUrl.searchParams;
  const name = searchParams.get('name') || '';

  if (!username) {
    return errorResponse('Username is required', 400);
  }

  if (!name) {
    return errorResponse('Name parameter is required', 400);
  }

  const authHeaders = forwardAuthHeader(request);
  const storageUrl = serverApiConfig.storage.baseUrl;

  const response = await fetchExternalApi(
    `${storageUrl}${name}`,
    {
      method: 'GET',
      headers: {
        ...authHeaders,
        'Accept': 'application/xml',
      },
    },
    serverApiConfig.storage.timeout
  );

  if (!response.ok) {
    return errorResponse('Failed to fetch storage data', response.status);
  }

  const xmlText = await response.text();

  // Create response with XML content type
  return new NextResponse(xmlText, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
    },
  });
});
