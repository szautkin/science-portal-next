import { ExecutionStatus } from './CodeRunnerTypes';

export interface ExecutionResultsProps {
  /** Execution status */
  status: ExecutionStatus;
  /** Execution results/output */
  results: string;
  /** Error message if any */
  error: string | null;
  /** Session ID */
  sessionId: string | null;
  /** Execution start time */
  startTime?: Date;
  /** Execution end time */
  endTime?: Date;
  /** Cancel execution handler */
  onCancel?: () => void;
  /** Whether to show detailed logs */
  showLogs?: boolean;
  /** Height of results area */
  height?: string | number;
}
