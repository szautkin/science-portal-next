import { SessionCardProps } from './SessionCardProps';

export interface ActiveSessionsWidgetProps {
  sessions: SessionCardProps[];
  isLoading?: boolean;
  onRefresh?: () => void;
  title?: string;
  showSessionCount?: boolean;
  maxSessionsToShow?: number;
  emptyMessage?: string;
  layout?: 'column' | 'row' | 'responsive';
  sessionCardMaxWidth?: string | number;
}
