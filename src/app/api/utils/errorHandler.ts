import { NextResponse } from 'next/server';

export interface ApiError {
  success: false;
  error: string;
  message?: string;
  details?: unknown;
  statusCode: number;
}

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// Standard error responses
export const ErrorResponses = {
  BadRequest: (message: string = 'Bad Request', details?: unknown) =>
    NextResponse.json<ApiError>(
      {
        success: false,
        error: 'BAD_REQUEST',
        message,
        details,
        statusCode: 400,
      },
      { status: 400 }
    ),

  Unauthorized: (message: string = 'Authentication required') =>
    NextResponse.json<ApiError>(
      {
        success: false,
        error: 'UNAUTHORIZED',
        message,
        statusCode: 401,
      },
      { status: 401 }
    ),

  Forbidden: (message: string = 'Access denied') =>
    NextResponse.json<ApiError>(
      {
        success: false,
        error: 'FORBIDDEN',
        message,
        statusCode: 403,
      },
      { status: 403 }
    ),

  NotFound: (message: string = 'Resource not found') =>
    NextResponse.json<ApiError>(
      {
        success: false,
        error: 'NOT_FOUND',
        message,
        statusCode: 404,
      },
      { status: 404 }
    ),

  ValidationError: (message: string = 'Validation failed', details?: unknown) =>
    NextResponse.json<ApiError>(
      {
        success: false,
        error: 'VALIDATION_ERROR',
        message,
        details,
        statusCode: 422,
      },
      { status: 422 }
    ),

  InternalError: (message: string = 'Internal server error') =>
    NextResponse.json<ApiError>(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message,
        statusCode: 500,
      },
      { status: 500 }
    ),
};

// Success response helper
export const SuccessResponse = <T = unknown>(
  data: T,
  message?: string,
  status: number = 200
) =>
  NextResponse.json<ApiSuccess<T>>(
    {
      success: true,
      data,
      message,
    },
    { status }
  );

// Error handler wrapper
export async function handleApiError(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    console.error('API Error:', error);

    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('validation')) {
        return ErrorResponses.ValidationError(error.message);
      }

      if (error.message.includes('not found')) {
        return ErrorResponses.NotFound(error.message);
      }

      // Generic error with message
      return ErrorResponses.InternalError(
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'An unexpected error occurred'
      );
    }

    return ErrorResponses.InternalError();
  }
}

// Request body parser with error handling
export async function parseRequestBody<T>(request: Request): Promise<T | null> {
  try {
    const contentType = request.headers.get('content-type');

    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Content-Type must be application/json');
    }

    const body = await request.json();
    return body;
  } catch (error) {
    console.error('Failed to parse request body:', error);
    return null;
  }
}
