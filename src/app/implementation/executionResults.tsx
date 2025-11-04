'use client';

import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Stack,
  Chip,
  Button,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
  PlayArrow as RunningIcon,
  Stop as StopIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { ExecutionResultsProps } from '@/app/types/ExecutionResultsProps';
import { ExecutionStatus } from '@/app/types/CodeRunnerTypes';

export const ExecutionResultsImpl = React.forwardRef<
  HTMLDivElement,
  ExecutionResultsProps
>(
  (
    {
      status,
      results,
      error,
      sessionId,
      startTime,
      endTime,
      onCancel,
      showLogs = true,
      height = '400px',
    },
    ref
  ) => {
    const theme = useTheme();

    // Calculate execution duration
    const duration = useMemo(() => {
      if (!startTime) return null;
      const end = endTime || new Date();
      const diff = end.getTime() - startTime.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;

      if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
      }
      return `${seconds}s`;
    }, [startTime, endTime]);

    // Get status display information
    const statusInfo = useMemo(() => {
      const configs: Record<
        ExecutionStatus,
        {
          label: string;
          color: 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
          icon: React.ReactNode;
        }
      > = {
        idle: {
          label: 'Not Started',
          color: 'default',
          icon: <PendingIcon />,
        },
        storing: {
          label: 'Storing Code',
          color: 'info',
          icon: <CircularProgress size={16} />,
        },
        running: {
          label: 'Running',
          color: 'primary',
          icon: <RunningIcon />,
        },
        polling: {
          label: 'Running',
          color: 'primary',
          icon: <CircularProgress size={16} />,
        },
        completed: {
          label: 'Completed',
          color: 'success',
          icon: <SuccessIcon />,
        },
        error: {
          label: 'Failed',
          color: 'error',
          icon: <ErrorIcon />,
        },
      };
      return configs[status] || configs.idle;
    }, [status]);

    // Copy results to clipboard
    const handleCopy = () => {
      navigator.clipboard.writeText(results || error || '');
    };

    // Download results as text file
    const handleDownload = () => {
      const content = results || error || '';
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `execution_results_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    const isRunning = status === 'running' || status === 'polling' || status === 'storing';
    const hasResults = results || error;

    return (
      <Box ref={ref} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
        {/* Header with status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              icon={statusInfo.icon as React.ReactElement}
              label={statusInfo.label}
              size="small"
              color={statusInfo.color}
            />
            {sessionId && (
              <Tooltip title={`Session ID: ${sessionId}`}>
                <Chip label={sessionId.slice(0, 8)} size="small" variant="outlined" />
              </Tooltip>
            )}
            {duration && (
              <Typography variant="caption" color="text.secondary">
                {duration}
              </Typography>
            )}
          </Stack>

          <Stack direction="row" spacing={1}>
            {isRunning && onCancel && (
              <Button
                size="small"
                startIcon={<StopIcon />}
                onClick={onCancel}
                color="error"
                variant="outlined"
              >
                Cancel
              </Button>
            )}
            {hasResults && (
              <>
                <Tooltip title="Copy to clipboard">
                  <IconButton size="small" onClick={handleCopy}>
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download as file">
                  <IconButton size="small" onClick={handleDownload}>
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Stack>
        </Box>

        {/* Error display */}
        {error && status === 'error' && (
          <Alert severity="error" sx={{ flexShrink: 0 }}>
            <Typography variant="body2" component="div">
              <strong>Execution Failed:</strong> {error}
            </Typography>
          </Alert>
        )}

        {/* Results area */}
        <Paper
          variant="outlined"
          sx={{
            position: 'relative',
            flex: 1,
            minHeight: 0,
            maxHeight: '100%',
            overflow: 'auto',
            padding: theme.spacing(2),
            backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
            fontFamily: 'Monaco, Menlo, "Courier New", monospace',
            fontSize: '13px',
            lineHeight: 1.6,
          }}
        >
          {isRunning && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                minHeight: '200px',
              }}
            >
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                {status === 'storing' && 'Storing code to VOSpace...'}
                {status === 'running' && 'Launching execution environment...'}
                {status === 'polling' && 'Executing code...'}
              </Typography>
              {duration && (
                <Typography variant="caption" color="text.secondary">
                  Elapsed: {duration}
                </Typography>
              )}
            </Box>
          )}

          {!isRunning && status === 'idle' && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '200px',
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No execution results yet. Run your code to see output here.
              </Typography>
            </Box>
          )}

          {!isRunning && hasResults && (
            <Box
              component="pre"
              sx={{
                margin: 0,
                padding: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: error ? theme.palette.error.main : theme.palette.text.primary,
              }}
            >
              {results || error}
            </Box>
          )}

          {!isRunning && status === 'completed' && !hasResults && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '200px',
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Execution completed successfully with no output.
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Footer info */}
        {showLogs && sessionId && (
          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
            View detailed logs in the SKAHA dashboard for session: {sessionId}
          </Typography>
        )}
      </Box>
    );
  }
);

ExecutionResultsImpl.displayName = 'ExecutionResultsImpl';
