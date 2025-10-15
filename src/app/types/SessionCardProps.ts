import { CardProps } from '@mui/material';

export type SessionType =
  | 'notebook'
  | 'desktop'
  | 'carta'
  | 'contributednotebook'
  | 'contributeddesktop';
export type SessionStatus =
  | 'Running'
  | 'Pending'
  | 'Failed'
  | 'Terminating'
  | 'Unknown';

export interface SessionCardProps extends Omit<CardProps, 'onClick'> {
  sessionType: SessionType;
  sessionName: string;
  sessionId?: string; // Optional session ID for API calls
  status: SessionStatus;
  containerImage: string;
  startedTime: string; // UTC timestamp
  expiresTime: string; // UTC timestamp
  memoryUsage: string; // e.g., "<none>"
  memoryAllocated: string; // e.g., "8G"
  cpuUsage: string; // e.g., "<none>"
  cpuAllocated: string; // e.g., "2"
  connectUrl: string;
  onDelete?: () => void;
  onShowEvents?: () => void;
  onShowLogs?: () => void;
  onExtendTime?: () => void;
  onClick?: () => void;
  loading?: boolean;
  disableHover?: boolean;
}
