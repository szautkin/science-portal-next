import { CardProps } from '@mui/material';

export type SessionType =
  | 'notebook'
  | 'desktop'
  | 'headless'
  | 'carta'
  | 'contributed'
  | 'firefly'
  | 'contributednotebook'
  | 'contributeddesktop';
export type SessionStatus =
  | 'Running'
  | 'Pending'
  | 'Failed'
  | 'Terminating'
  | 'Error'
  | 'Unknown';

export interface SessionCardProps extends Omit<CardProps, 'onClick'> {
  id?: string;
  sessionType: SessionType;
  sessionName: string;
  sessionId?: string; // Optional session ID for API calls
  status: SessionStatus;
  containerImage: string;
  startedTime: string; // UTC timestamp
  expiresTime: string; // UTC timestamp
  memoryUsage?: string; // e.g., "<none>" - optional to match API
  memoryAllocated: string; // e.g., "8G"
  cpuUsage?: string; // e.g., "<none>" - optional to match API
  cpuAllocated: string; // e.g., "2"
  connectUrl?: string; // optional to match API
  requestedRAM?: string;
  requestedCPU?: string;
  onDelete?: () => void;
  onShowEvents?: () => void;
  onShowLogs?: () => void;
  onExtendTime?: () => void;
  onClick?: () => void;
  loading?: boolean;
  disableHover?: boolean;
}
