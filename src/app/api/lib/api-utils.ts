/**
 * API Route Utilities
 *
 * Shared utilities for Next.js API routes including error handling,
 * response formatting, and request validation.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Standard API error response
 */
export interface ApiError {
  error: string;
  message: string;
  status: number;
  details?: unknown;
}

/**
 * Creates a standardized error response
 */
export function errorResponse(
  message: string,
  status: number = 500,
  details?: unknown
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      error: getErrorName(status),
      message,
      status,
      details,
    },
    { status }
  );
}

/**
 * Creates a standardized success response
 */
export function successResponse<T>(
  data: T,
  status: number = 200
): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * Gets error name from status code
 */
function getErrorName(status: number): string {
  const errorNames: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    408: 'Request Timeout',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
  };
  return errorNames[status] || 'Error';
}

/**
 * Validates HTTP method
 */
export function validateMethod(
  request: NextRequest,
  allowedMethods: string[]
): boolean {
  return allowedMethods.includes(request.method);
}

/**
 * Extracts and validates JSON body from request
 */
export async function getRequestBody<T>(request: NextRequest): Promise<T> {
  try {
    return await request.json();
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}

/**
 * Fetches from external API with error handling
 */
export async function fetchExternalApi(
  url: string,
  options: RequestInit = {},
  timeout: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      credentials: 'include',
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`External API timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Forwards cookies from client request to external API
 * @deprecated Use forwardAuthHeader instead for Bearer token authentication
 */
export function forwardCookies(clientRequest: NextRequest): HeadersInit {
  const cookieHeader = clientRequest.headers.get('cookie');
  return cookieHeader
    ? { Cookie: cookieHeader }
    : {};
}

/**
 * Forwards Authorization header from client request to external API
 *
 * Extracts the Bearer token from the Authorization header and returns
 * it in a format suitable for external API calls.
 */
export function forwardAuthHeader(clientRequest: NextRequest): HeadersInit {
  const authHeader = clientRequest.headers.get('authorization');
  return authHeader
    ? { Authorization: authHeader }
    : {};
}

/**
 * Extracts Bearer token from Authorization header
 *
 * @returns The token string or null if not found
 */
export function getBearerToken(clientRequest: NextRequest): string | null {
  const authHeader = clientRequest.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Copies cookies from external API response to client response
 */
export function copyCookies(
  externalResponse: Response,
  clientResponse: NextResponse
): NextResponse {
  const setCookieHeaders = externalResponse.headers.get('set-cookie');
  if (setCookieHeaders) {
    clientResponse.headers.set('set-cookie', setCookieHeaders);
  }
  return clientResponse;
}

/**
 * Handles method not allowed
 */
export function methodNotAllowed(allowedMethods: string[]): NextResponse {
  return errorResponse(
    `Method not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
    405
  );
}

/**
 * Wraps API route handler with error handling
 */
export function withErrorHandling(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('API Route Error:', error);

      if (error instanceof Error) {
        // Handle specific error types
        if (error.message.includes('timeout')) {
          return errorResponse('Request timeout', 504, error.message);
        }
        if (error.message.includes('Invalid JSON')) {
          return errorResponse('Invalid request body', 400, error.message);
        }
        return errorResponse(error.message, 500);
      }

      return errorResponse('An unexpected error occurred', 500);
    }
  };
}
