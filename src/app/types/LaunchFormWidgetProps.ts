import { SessionLaunchFormProps } from './SessionLaunchFormProps';

export interface LaunchFormWidgetProps extends SessionLaunchFormProps {
  isLoading?: boolean;
  onRefresh?: () => void;
  title?: string;
  showProgressIndicator?: boolean;
  progressPercentage?: number;
  helpUrl?: string;
}
