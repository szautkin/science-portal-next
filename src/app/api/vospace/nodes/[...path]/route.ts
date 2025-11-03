/**
 * VOSpace Nodes API Route
 *
 * GET /api/vospace/nodes/[...path] - List directory contents or get node metadata
 * PUT /api/vospace/nodes/[...path] - Create file or folder
 * DELETE /api/vospace/nodes/[...path] - Delete node
 * POST /api/vospace/nodes/[...path] - Update node properties
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
import { createVOSpaceClient } from '../../lib/vospace-client';
import { VONode } from '../../lib/vospace-xml';

/**
 * Request body for creating nodes
 */
interface CreateNodeRequest {
  type: 'file' | 'folder' | 'container';
  title?: string;
}

/**
 * Request body for updating properties
 */
interface UpdatePropertiesRequest {
  properties: Record<string, string>;
}

/**
 * GET - List directory contents or get node metadata
 */
export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) => {
  // Await params to comply with Next.js 15
  const resolvedParams = await params;

  // Extract path from URL params
  const path = resolvedParams.path ? resolvedParams.path.join('/') : '';

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
    // Check if requesting detailed node info or listing
    const searchParams = request.nextUrl.searchParams;
    const detail = searchParams.get('detail');

    if (detail === 'metadata') {
      // Get single node metadata
      const node = await client.getNode(path, bearerToken);
      return successResponse<VONode>(node);
    } else {
      // List directory contents
      const nodes = await client.listNodes(path, bearerToken);
      return successResponse<VONode[]>(nodes);
    }
  } catch (error) {
    console.error('Failed to list/get VOSpace nodes:', error);

    if (error instanceof Error) {
      if (error.message.includes('404')) {
        return errorResponse('Node not found', HTTP_STATUS.NOT_FOUND, error.message);
      }
      if (error.message.includes('403')) {
        return errorResponse('Access forbidden', HTTP_STATUS.FORBIDDEN, error.message);
      }
      if (error.message.includes('401')) {
        return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED, error.message);
      }
      return errorResponse(error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return errorResponse('Failed to access VOSpace', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * PUT - Create file or folder
 */
export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) => {
  // Await params to comply with Next.js 15
  const resolvedParams = await params;

  // Extract path from URL params
  const path = resolvedParams.path ? resolvedParams.path.join('/') : '';

  if (!path) {
    return errorResponse('Path is required', HTTP_STATUS.BAD_REQUEST);
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

  // Parse request body
  let body: CreateNodeRequest;
  try {
    body = await request.json();
  } catch (error) {
    return errorResponse('Invalid JSON in request body', HTTP_STATUS.BAD_REQUEST);
  }

  if (!body.type) {
    return errorResponse('Node type is required (file, folder, or container)', HTTP_STATUS.BAD_REQUEST);
  }

  // Create VOSpace client
  const client = createVOSpaceClient(
    serverApiConfig.vospace.baseUrl,
    serverApiConfig.vospace.timeout
  );

  try {
    if (body.type === 'folder' || body.type === 'container') {
      // Create a container node (directory)
      await client.createFolder(path, body.title, bearerToken);
      return successResponse({ success: true, message: 'Folder created successfully' }, HTTP_STATUS.CREATED);
    } else if (body.type === 'file') {
      // Create a data node (file metadata only)
      await client.createDataNode(path, body.title, bearerToken);
      return successResponse({ success: true, message: 'File node created successfully' }, HTTP_STATUS.CREATED);
    } else {
      return errorResponse(`Invalid node type: ${body.type}`, HTTP_STATUS.BAD_REQUEST);
    }
  } catch (error) {
    console.error('Failed to create VOSpace node:', error);

    if (error instanceof Error) {
      if (error.message.includes('409') || error.message.includes('exists')) {
        return errorResponse('Node already exists', HTTP_STATUS.CONFLICT, error.message);
      }
      if (error.message.includes('403')) {
        return errorResponse('Access forbidden', HTTP_STATUS.FORBIDDEN, error.message);
      }
      if (error.message.includes('401')) {
        return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED, error.message);
      }
      if (error.message.includes('404')) {
        return errorResponse('Parent directory not found', HTTP_STATUS.NOT_FOUND, error.message);
      }
      return errorResponse(error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return errorResponse('Failed to create node', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * DELETE - Delete node
 */
export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) => {
  // Await params to comply with Next.js 15
  const resolvedParams = await params;

  // Extract path from URL params
  const path = resolvedParams.path ? resolvedParams.path.join('/') : '';

  if (!path) {
    return errorResponse('Path is required', HTTP_STATUS.BAD_REQUEST);
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
    await client.deleteNode(path, bearerToken);
    return successResponse({ success: true, message: 'Node deleted successfully' });
  } catch (error) {
    console.error('Failed to delete VOSpace node:', error);

    if (error instanceof Error) {
      if (error.message.includes('404')) {
        return errorResponse('Node not found', HTTP_STATUS.NOT_FOUND, error.message);
      }
      if (error.message.includes('403')) {
        return errorResponse('Access forbidden', HTTP_STATUS.FORBIDDEN, error.message);
      }
      if (error.message.includes('401')) {
        return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED, error.message);
      }
      return errorResponse(error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return errorResponse('Failed to delete node', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * POST - Update node properties
 */
export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) => {
  // Await params to comply with Next.js 15
  const resolvedParams = await params;

  // Extract path from URL params
  const path = resolvedParams.path ? resolvedParams.path.join('/') : '';

  if (!path) {
    return errorResponse('Path is required', HTTP_STATUS.BAD_REQUEST);
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

  // Parse request body
  let body: UpdatePropertiesRequest;
  try {
    body = await request.json();
  } catch (error) {
    return errorResponse('Invalid JSON in request body', HTTP_STATUS.BAD_REQUEST);
  }

  if (!body.properties || typeof body.properties !== 'object') {
    return errorResponse('Properties object is required', HTTP_STATUS.BAD_REQUEST);
  }

  // Create VOSpace client
  const client = createVOSpaceClient(
    serverApiConfig.vospace.baseUrl,
    serverApiConfig.vospace.timeout
  );

  try {
    await client.updateProperties(path, body.properties, bearerToken);
    return successResponse({ success: true, message: 'Properties updated successfully' });
  } catch (error) {
    console.error('Failed to update VOSpace node properties:', error);

    if (error instanceof Error) {
      if (error.message.includes('404')) {
        return errorResponse('Node not found', HTTP_STATUS.NOT_FOUND, error.message);
      }
      if (error.message.includes('403')) {
        return errorResponse('Access forbidden', HTTP_STATUS.FORBIDDEN, error.message);
      }
      if (error.message.includes('401')) {
        return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED, error.message);
      }
      return errorResponse(error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return errorResponse('Failed to update properties', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});
