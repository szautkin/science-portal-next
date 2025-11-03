/**
 * VOSpace Transfer API Route
 *
 * POST /api/vospace/transfer - Upload file (multipart or JSON with content)
 * GET /api/vospace/transfer?path=... - Download file
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  withErrorHandling,
  errorResponse,
  successResponse,
  forwardAuthHeader,
} from '@/app/api/lib/api-utils';
import { serverApiConfig } from '@/app/api/lib/server-config';
import { HTTP_STATUS } from '@/app/api/lib/http-constants';
import { createVOSpaceClient } from '../lib/vospace-client';

/**
 * Request body for JSON upload
 */
interface UploadRequest {
  path: string;
  content: string;
  encoding?: 'utf8' | 'base64';
  title?: string;
}

/**
 * POST - Upload file
 * Supports both multipart/form-data and JSON with content
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Get authentication token
  const authHeaders = await forwardAuthHeader(request);

  if (!authHeaders.Authorization) {
    return errorResponse('Authentication required', HTTP_STATUS.UNAUTHORIZED);
  }

  // Extract token from authorization header
  const bearerToken = (authHeaders.Authorization as string).replace('Bearer ', '');

  if (!bearerToken) {
    return errorResponse('Invalid authentication token', HTTP_STATUS.UNAUTHORIZED);
  }

  const contentType = request.headers.get('content-type') || '';

  let path: string;
  let content: Buffer | string;
  let title: string | undefined;

  // Handle multipart/form-data
  if (contentType.includes('multipart/form-data')) {
    try {
      const formData = await request.formData();

      // Get path from form data
      const pathField = formData.get('path');
      if (!pathField || typeof pathField !== 'string') {
        return errorResponse('Path is required in form data', HTTP_STATUS.BAD_REQUEST);
      }
      path = pathField;

      // Get file from form data
      const file = formData.get('file');
      if (!file || !(file instanceof Blob)) {
        return errorResponse('File is required in form data', HTTP_STATUS.BAD_REQUEST);
      }

      // Get optional title
      const titleField = formData.get('title');
      if (titleField && typeof titleField === 'string') {
        title = titleField;
      }

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      content = Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Failed to parse multipart form data:', error);
      return errorResponse('Invalid multipart form data', HTTP_STATUS.BAD_REQUEST);
    }
  }
  // Handle JSON with content
  else if (contentType.includes('application/json')) {
    try {
      const body: UploadRequest = await request.json();

      if (!body.path) {
        return errorResponse('Path is required', HTTP_STATUS.BAD_REQUEST);
      }

      if (!body.content && body.content !== '') {
        return errorResponse('Content is required', HTTP_STATUS.BAD_REQUEST);
      }

      path = body.path;
      title = body.title;

      // Handle encoding
      if (body.encoding === 'base64') {
        content = Buffer.from(body.content, 'base64');
      } else {
        content = body.content;
      }
    } catch (error) {
      console.error('Failed to parse JSON body:', error);
      return errorResponse('Invalid JSON in request body', HTTP_STATUS.BAD_REQUEST);
    }
  } else {
    return errorResponse(
      'Content-Type must be multipart/form-data or application/json',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // Create VOSpace client
  const client = createVOSpaceClient(
    serverApiConfig.vospace.baseUrl,
    serverApiConfig.vospace.timeout
  );

  try {
    await client.uploadFile(path, content, bearerToken);
    return successResponse(
      { success: true, message: 'File uploaded successfully', path },
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    console.error('Failed to upload file to VOSpace:', error);

    if (error instanceof Error) {
      if (error.message.includes('403')) {
        return errorResponse('Access forbidden', HTTP_STATUS.FORBIDDEN, error.message);
      }
      if (error.message.includes('401')) {
        return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED, error.message);
      }
      if (error.message.includes('404')) {
        return errorResponse('Parent directory not found', HTTP_STATUS.NOT_FOUND, error.message);
      }
      if (error.message.includes('413') || error.message.includes('too large')) {
        return errorResponse('File too large', HTTP_STATUS.BAD_REQUEST, error.message);
      }
      return errorResponse(error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return errorResponse('Failed to upload file', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET - Download file
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  // Get path from query params
  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get('path');

  if (!path) {
    return errorResponse('Path query parameter is required', HTTP_STATUS.BAD_REQUEST);
  }

  // Get authentication token
  const authHeaders = await forwardAuthHeader(request);

  if (!authHeaders.Authorization) {
    return errorResponse('Authentication required', HTTP_STATUS.UNAUTHORIZED);
  }

  // Extract token from authorization header
  const bearerToken = (authHeaders.Authorization as string).replace('Bearer ', '');

  if (!bearerToken) {
    return errorResponse('Invalid authentication token', HTTP_STATUS.UNAUTHORIZED);
  }

  // Create VOSpace client
  const client = createVOSpaceClient(
    serverApiConfig.vospace.baseUrl,
    serverApiConfig.vospace.timeout
  );

  try {
    const content = await client.downloadFile(path, bearerToken);

    // Extract filename from path
    const pathParts = path.split('/');
    const filename = pathParts[pathParts.length - 1] || 'download';

    // Determine content type based on file extension
    const contentType = getContentType(filename);

    // Return file as response
    return new NextResponse(content, {
      status: HTTP_STATUS.OK,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': content.length.toString(),
      },
    });
  } catch (error) {
    console.error('Failed to download file from VOSpace:', error);

    if (error instanceof Error) {
      if (error.message.includes('404')) {
        return errorResponse('File not found', HTTP_STATUS.NOT_FOUND, error.message);
      }
      if (error.message.includes('403')) {
        return errorResponse('Access forbidden', HTTP_STATUS.FORBIDDEN, error.message);
      }
      if (error.message.includes('401')) {
        return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED, error.message);
      }
      return errorResponse(error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return errorResponse('Failed to download file', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * Helper function to determine content type from filename
 */
function getContentType(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    // Text files
    txt: 'text/plain',
    md: 'text/markdown',
    csv: 'text/csv',
    log: 'text/plain',

    // Code files
    js: 'application/javascript',
    ts: 'application/typescript',
    json: 'application/json',
    xml: 'application/xml',
    html: 'text/html',
    css: 'text/css',
    py: 'text/x-python',
    sh: 'application/x-sh',
    yml: 'text/yaml',
    yaml: 'text/yaml',

    // Image files
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',

    // Document files
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

    // Archive files
    zip: 'application/zip',
    tar: 'application/x-tar',
    gz: 'application/gzip',
    bz2: 'application/x-bzip2',

    // FITS files (astronomy)
    fits: 'application/fits',
    fit: 'application/fits',
  };

  return extension && mimeTypes[extension]
    ? mimeTypes[extension]
    : 'application/octet-stream';
}
