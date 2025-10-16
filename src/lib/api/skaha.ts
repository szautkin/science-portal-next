/**
 * Skaha Platform API Client
 *
 * Handles all interactions with the Skaha platform for managing sessions,
 * retrieving platform load, and working with container images.
 * Uses Bearer token authentication from token storage.
 */

import { getAuthHeader } from '@/lib/auth/token-storage';

export type SessionType = 'notebook' | 'desktop' | 'headless' | 'carta' | 'contributednotebook' | 'contributeddesktop';
export type SessionStatus = 'Running' | 'Pending' | 'Terminating' | 'Error' | 'Failed' | 'Unknown';

export interface Session {
  id: string;
  sessionId?: string;
  sessionType: SessionType;
  sessionName: string;
  status: SessionStatus;
  containerImage: string;
  startedTime: string;
  expiresTime: string;
  memoryUsage?: string;
  memoryAllocated: string;
  cpuUsage?: string;
  cpuAllocated: string;
  connectUrl?: string;
  requestedRAM?: string;
  requestedCPU?: string;
}

export interface PlatformLoadMetric {
  name: string;
  used: number;
  free: number;
  headless?: number;
  [key: string]: number | string | undefined;
}

export interface PlatformLoad {
  cpu: PlatformLoadMetric;
  ram: PlatformLoadMetric;
  instances: PlatformLoadMetric;
  maxValues: {
    cpu: number;
    ram: number;
    instances: number;
  };
  lastUpdate: string | Date; // Support both string (from API) and Date for backward compatibility
}

export interface ContainerImage {
  id: string;
  name: string;
  types: SessionType[];
}

export interface SessionLaunchParams {
  sessionType: SessionType;
  sessionName: string;
  containerImage: string;
  cores: number;
  ram: number;
  env?: Record<string, string>;
  cmd?: string;
}

/**
 * Get all active sessions for the current user
 */
export async function getSessions(): Promise<Session[]> {
  const authHeaders = getAuthHeader();
  const response = await fetch('/api/sessions', {
    method: 'GET',
    headers: { 'Accept': 'application/json', ...authHeaders },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch sessions: ${response.status}`);
  }

  return response.json();
}

/**
 * Get details for a specific session
 */
export async function getSession(sessionId: string): Promise<Session> {
  const authHeaders = getAuthHeader();
  const response = await fetch(`/api/sessions/${sessionId}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json', ...authHeaders },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch session ${sessionId}: ${response.status}`);
  }

  return response.json();
}

/**
 * Launch a new session
 */
export async function launchSession(params: SessionLaunchParams): Promise<Session> {
  const authHeaders = getAuthHeader();
  const response = await fetch('/api/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders,
    },
    credentials: 'include',
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Failed to launch session: ${response.status}`);
  }

  return response.json();
}

/**
 * Delete/terminate a session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const authHeaders = getAuthHeader();
  const response = await fetch(`/api/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: { 'Accept': 'application/json', ...authHeaders },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete session ${sessionId}: ${response.status}`);
  }
}

/**
 * Get platform load statistics
 */
export async function getPlatformLoad(): Promise<PlatformLoad> {
  const authHeaders = getAuthHeader();
  const response = await fetch('/api/sessions/platform-load', {
    method: 'GET',
    headers: { 'Accept': 'application/json', ...authHeaders },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch platform load: ${response.status}`);
  }

  return response.json();
}

/**
 * Get available container images
 */
export async function getContainerImages(): Promise<ContainerImage[]> {
  const authHeaders = getAuthHeader();
  const response = await fetch('/api/sessions/images', {
    method: 'GET',
    headers: { 'Accept': 'application/json', ...authHeaders },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch container images: ${response.status}`);
  }

  return response.json();
}

/**
 * Get session logs
 */
export async function getSessionLogs(sessionId: string): Promise<string> {
  const authHeaders = getAuthHeader();
  const response = await fetch(`/api/sessions/${sessionId}/logs`, {
    method: 'GET',
    headers: { 'Accept': 'text/plain', ...authHeaders },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch logs for session ${sessionId}: ${response.status}`);
  }

  return response.text();
}

/**
 * Get session events
 */
export async function getSessionEvents(sessionId: string): Promise<any[]> {
  const authHeaders = getAuthHeader();
  const response = await fetch(`/api/sessions/${sessionId}/events`, {
    method: 'GET',
    headers: { 'Accept': 'application/json', ...authHeaders },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch events for session ${sessionId}: ${response.status}`);
  }

  return response.json();
}

/**
 * Extend session expiry time
 */
export async function renewSession(
  sessionId: string,
  additionalHours: number
): Promise<Session> {
  const authHeaders = getAuthHeader();
  const response = await fetch(`/api/sessions/${sessionId}/renew`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders,
    },
    credentials: 'include',
    body: JSON.stringify({ hours: additionalHours }),
  });

  if (!response.ok) {
    throw new Error(`Failed to renew session ${sessionId}: ${response.status}`);
  }

  return response.json();
}
