'use client';

import {
  Card as MuiCard,
  CardContent,
  Box,
  Typography,
  IconButton,
  Chip,
  useTheme,
  Skeleton,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Flag as FlagIcon,
  Description as LogsIcon,
  Schedule as ExtendIcon,
  Science as JupyterIcon,
  Computer as DesktopIcon,
  StarBorder as CartaIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import {
  SessionCardProps,
  SessionType,
  SessionStatus,
} from '@/app/types/SessionCardProps';
import React, { useState, useMemo, useCallback } from 'react';
import { EventsModal } from '@/app/components/EventsModal/EventsModal';
import { DeleteSessionModal } from '@/app/components/DeleteSessionModal/DeleteSessionModal';
import { SessionRenewModal } from '@/app/components/SessionRenewModal/SessionRenewModal';
import type { SessionEvent } from '@/app/types/EventsModalProps';

const getSessionIcon = (type: SessionType): React.ReactNode => {
  switch (type) {
    case 'notebook':
    case 'contributednotebook':
      return <JupyterIcon />;
    case 'desktop':
    case 'contributeddesktop':
      return <DesktopIcon />;
    case 'carta':
      return <CartaIcon />;
    default:
      return <CodeIcon />;
  }
};

const getStatusColor = (
  status: SessionStatus
): 'success' | 'warning' | 'error' | 'default' => {
  switch (status) {
    case 'Running':
      return 'success';
    case 'Pending':
      return 'warning';
    case 'Failed':
      return 'error';
    case 'Terminating':
      return 'warning';
    default:
      return 'default';
  }
};

export const SessionCardImpl = React.forwardRef<
  HTMLDivElement,
  SessionCardProps
>(
  (
    {
      sessionType,
      sessionName,
      sessionId,
      status,
      containerImage,
      startedTime,
      expiresTime,
      memoryUsage,
      memoryAllocated,
      cpuUsage,
      cpuAllocated,
      connectUrl,
      onDelete,
      onShowEvents,
      onShowLogs,
      onExtendTime,
      onClick,
      loading = false,
      // disableHover = true, // Hover effects removed globally
      ...cardProps
    },
    ref
  ) => {
    const theme = useTheme();
    const [showEventsModal, setShowEventsModal] = useState(false);
    const [showLogsModal, setShowLogsModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showRenewModal, setShowRenewModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRenewing, setIsRenewing] = useState(false);

    // Generate mock events based on session status
    const mockEvents = useMemo<SessionEvent[]>(() => {
      const baseTime = new Date().toISOString();
      const events: SessionEvent[] = [];

      // Add events based on status
      if (status === 'Running' || status === 'Terminating') {
        events.push(
          {
            id: 'event-1',
            type: 'Normal',
            reason: 'Scheduled',
            message: `Successfully assigned ${sessionName} to node`,
            firstTime: baseTime,
            lastTime: baseTime,
          },
          {
            id: 'event-2',
            type: 'Normal',
            reason: 'Pulling',
            message: `Pulling image "${containerImage}"`,
            firstTime: baseTime,
            lastTime: baseTime,
          },
          {
            id: 'event-3',
            type: 'Normal',
            reason: 'Pulled',
            message: `Successfully pulled image "${containerImage}"`,
            firstTime: baseTime,
            lastTime: baseTime,
          },
          {
            id: 'event-4',
            type: 'Normal',
            reason: 'Created',
            message: `Created container ${sessionName}`,
            firstTime: baseTime,
            lastTime: baseTime,
          },
          {
            id: 'event-5',
            type: 'Normal',
            reason: 'Started',
            message: `Started container ${sessionName}`,
            firstTime: baseTime,
            lastTime: baseTime,
          }
        );
      }

      if (status === 'Pending') {
        events.push(
          {
            id: 'event-1',
            type: 'Normal',
            reason: 'Scheduled',
            message: `Successfully assigned ${sessionName} to node`,
            firstTime: baseTime,
            lastTime: baseTime,
          },
          {
            id: 'event-2',
            type: 'Warning',
            reason: 'Failed',
            message: `Failed to pull image "${containerImage}": connection timeout`,
            firstTime: baseTime,
            lastTime: baseTime,
          },
          {
            id: 'event-3',
            type: 'Warning',
            reason: 'BackOff',
            message: `Back-off pulling image "${containerImage}"`,
            firstTime: baseTime,
            lastTime: baseTime,
          }
        );
      }

      if (status === 'Failed') {
        events.push(
          {
            id: 'event-1',
            type: 'Normal',
            reason: 'Scheduled',
            message: `Successfully assigned ${sessionName} to node`,
            firstTime: baseTime,
            lastTime: baseTime,
          },
          {
            id: 'event-2',
            type: 'Error',
            reason: 'Failed',
            message: `Error: ImagePullBackOff - Container image "${containerImage}" not found`,
            firstTime: baseTime,
            lastTime: baseTime,
          },
          {
            id: 'event-3',
            type: 'Error',
            reason: 'Unhealthy',
            message: 'Liveness probe failed: connection refused',
            firstTime: baseTime,
            lastTime: baseTime,
          }
        );
      }

      if (status === 'Terminating') {
        events.push({
          id: 'event-6',
          type: 'Normal',
          reason: 'Killing',
          message: `Stopping container ${sessionName}`,
          firstTime: baseTime,
          lastTime: baseTime,
        });
      }

      return events;
    }, [status, sessionName, containerImage]);

    const handleCardClick = () => {
      if (onClick) {
        onClick();
      } else if (connectUrl && status === 'Running') {
        window.open(connectUrl, '_blank');
      }
    };

    const handleShowEvents = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowEventsModal(true);
      onShowEvents?.();
    };

    const handleShowLogs = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowLogsModal(true);
      onShowLogs?.();
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowDeleteModal(true);
    };

    const handleDeleteConfirm = useCallback(async () => {
      setIsDeleting(true);
      try {
        // Simulate deletion or call actual delete function
        await onDelete?.();
        // Wait a bit to show the deleting state
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } finally {
        setIsDeleting(false);
        setShowDeleteModal(false);
      }
    }, [onDelete]);

    const handleExtendClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowRenewModal(true);
      setIsRenewing(true);

      // Simulate renewal process
      setTimeout(() => {
        setIsRenewing(false);
        setTimeout(() => {
          setShowRenewModal(false);
          onExtendTime?.();
        }, 1000);
      }, 2000);
    };

    if (loading) {
      return (
        <MuiCard
          ref={ref}
          {...cardProps}
          elevation={0}
          variant="outlined"
          sx={{
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <CardContent>
            <Stack spacing={2}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Skeleton variant="circular" width={24} height={24} />
                  <Skeleton variant="text" width={150} />
                </Box>
                <Skeleton variant="rectangular" width={80} height={24} />
              </Box>
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width="100%" />
              <Box display="flex" gap={1} mt={2}>
                <Skeleton variant="circular" width={40} height={40} />
                <Skeleton variant="circular" width={40} height={40} />
                <Skeleton variant="circular" width={40} height={40} />
                <Skeleton variant="circular" width={40} height={40} />
              </Box>
            </Stack>
          </CardContent>
        </MuiCard>
      );
    }

    return (
      <>
        <MuiCard
          ref={ref}
          {...cardProps}
          onClick={handleCardClick}
          elevation={0}
          raised={false}
          variant="outlined"
          sx={{
            cursor: status === 'Running' ? 'pointer' : 'default',
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <CardContent
            sx={{
              [theme.breakpoints.down('sm')]: {
                padding: theme.spacing(2),
                '&:last-child': {
                  paddingBottom: theme.spacing(2),
                },
              },
            }}
          >
            {/* Header Section */}
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={2}
              sx={{
                [theme.breakpoints.down('sm')]: {
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 1,
                },
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                gap={1}
                sx={{
                  minWidth: 0, // Allow flexbox to shrink
                  flex: 1,
                  [theme.breakpoints.down('sm')]: {
                    width: '100%',
                  },
                }}
              >
                <Box
                  sx={{
                    color: theme.palette.primary.main,
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0, // Icon never shrinks
                  }}
                >
                  {getSessionIcon(sessionType)}
                </Box>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    minWidth: 0, // Allow text to shrink
                    [theme.breakpoints.down('sm')]: {
                      fontSize: theme.typography.body1.fontSize,
                    },
                  }}
                >
                  {sessionName}
                </Typography>
              </Box>
              <Chip
                label={status}
                color={getStatusColor(status)}
                size="small"
                sx={{
                  fontWeight: theme.typography.fontWeightMedium,
                  flexShrink: 0, // Chip never shrinks
                  [theme.breakpoints.down('sm')]: {
                    alignSelf: 'flex-start',
                    fontSize: theme.typography.caption.fontSize,
                    height: 'auto',
                    minHeight: '24px',
                  },
                }}
              />
            </Box>

            {/* Details Section */}
            <Stack spacing={1} mb={theme.spacing(2)}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 0,
                  [theme.breakpoints.up('sm')]: {
                    flexDirection: 'row',
                    alignItems: 'baseline',
                  },
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  component="span"
                  sx={{
                    flexShrink: 0,
                    [theme.breakpoints.down('sm')]: {
                      fontSize: theme.typography.caption.fontSize,
                      marginBottom: '2px',
                    },
                  }}
                >
                  Container:{' '}
                </Typography>
                <Typography
                  variant="body2"
                  component="span"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    minWidth: 0,
                    flex: 1,
                    [theme.breakpoints.down('sm')]: {
                      fontSize: theme.typography.caption.fontSize,
                    },
                  }}
                  title={containerImage} // Show full text on hover
                >
                  {containerImage}
                </Typography>
              </Box>

              <Box
                display="flex"
                gap={theme.spacing(3)}
                sx={{
                  [theme.breakpoints.down('sm')]: {
                    flexDirection: 'column',
                    gap: theme.spacing(1),
                  },
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    component="span"
                  >
                    Started:{' '}
                  </Typography>
                  <Typography
                    variant="body2"
                    component="span"
                    sx={{
                      [theme.breakpoints.down('sm')]: {
                        fontSize: theme.typography.caption.fontSize,
                      },
                    }}
                  >
                    {startedTime} UTC
                  </Typography>
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    component="span"
                  >
                    Expires:{' '}
                  </Typography>
                  <Typography
                    variant="body2"
                    component="span"
                    sx={{
                      [theme.breakpoints.down('sm')]: {
                        fontSize: theme.typography.caption.fontSize,
                      },
                    }}
                  >
                    {expiresTime} UTC
                  </Typography>
                </Box>
              </Box>

              <Box
                display="flex"
                gap={theme.spacing(3)}
                sx={{
                  [theme.breakpoints.down('sm')]: {
                    flexDirection: 'column',
                    gap: theme.spacing(1),
                  },
                }}
              >
                <Box
                  sx={{
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    [theme.breakpoints.up('sm')]: {
                      flexDirection: 'row',
                      alignItems: 'baseline',
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    component="span"
                    sx={{
                      flexShrink: 0,
                      [theme.breakpoints.down('sm')]: {
                        fontSize: theme.typography.caption.fontSize,
                        marginBottom: '2px',
                      },
                    }}
                  >
                    Memory:{' '}
                  </Typography>
                  <Typography
                    variant="body2"
                    component="span"
                    sx={{
                      [theme.breakpoints.down('sm')]: {
                        fontSize: theme.typography.caption.fontSize,
                      },
                    }}
                  >
                    {memoryUsage} / {memoryAllocated}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    [theme.breakpoints.up('sm')]: {
                      flexDirection: 'row',
                      alignItems: 'baseline',
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    component="span"
                    sx={{
                      flexShrink: 0,
                      [theme.breakpoints.down('sm')]: {
                        fontSize: theme.typography.caption.fontSize,
                        marginBottom: '2px',
                      },
                    }}
                  >
                    CPU:{' '}
                  </Typography>
                  <Typography
                    variant="body2"
                    component="span"
                    sx={{
                      [theme.breakpoints.down('sm')]: {
                        fontSize: theme.typography.caption.fontSize,
                      },
                    }}
                  >
                    {cpuUsage} / {cpuAllocated}
                  </Typography>
                </Box>
              </Box>
            </Stack>

            {/* Footer Actions */}
            <Box
              display="flex"
              gap={theme.spacing(0.5)}
              sx={{
                borderTop: 1,
                borderColor: theme.palette.divider,
                pt: theme.spacing(1.5),
                mt: theme.spacing(2),
                mx: theme.spacing(-2),
                px: theme.spacing(2),
                justifyContent: 'flex-start',
                flexWrap: 'wrap', // Allow wrapping on very small screens
                [theme.breakpoints.down('sm')]: {
                  justifyContent: 'space-evenly', // Better distribution on mobile
                  gap: theme.spacing(0.5), // Consistent gap
                  pt: theme.spacing(2), // More padding on mobile
                },
              }}
            >
              <Tooltip title="Delete session">
                <IconButton
                  size="small"
                  onClick={handleDeleteClick}
                  aria-label="Delete session"
                  sx={{
                    [theme.breakpoints.down('sm')]: {
                      minWidth: '44px',
                      minHeight: '44px', // Ensure touch-friendly size on mobile
                    },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="View events">
                <IconButton
                  size="small"
                  onClick={handleShowEvents}
                  aria-label="View events"
                  sx={{
                    [theme.breakpoints.down('sm')]: {
                      minWidth: '44px',
                      minHeight: '44px',
                    },
                  }}
                >
                  <FlagIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="View logs">
                <IconButton
                  size="small"
                  onClick={handleShowLogs}
                  aria-label="View logs"
                  sx={{
                    [theme.breakpoints.down('sm')]: {
                      minWidth: '44px',
                      minHeight: '44px',
                    },
                  }}
                >
                  <LogsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Extend time">
                <IconButton
                  size="small"
                  onClick={handleExtendClick}
                  aria-label="Extend time"
                  sx={{
                    [theme.breakpoints.down('sm')]: {
                      minWidth: '44px',
                      minHeight: '44px',
                    },
                  }}
                >
                  <ExtendIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </CardContent>
        </MuiCard>

        {/* Events Modal */}
        <EventsModal
          open={showEventsModal}
          sessionId={sessionId || sessionName}
          sessionName={sessionName}
          onClose={() => setShowEventsModal(false)}
          showRefreshButton={true}
          initialEvents={mockEvents}
        />

        {/* Logs Modal (Raw view only, parsing disabled) */}
        <EventsModal
          open={showLogsModal}
          sessionId={sessionId || sessionName}
          sessionName={`${sessionName} - Logs`}
          onClose={() => setShowLogsModal(false)}
          showRefreshButton={true}
          forceRawView={true}
          defaultView="raw"
          eventsEndpoint={`/science-portal/session/${sessionId || sessionName}?view=logs`}
          initialEvents={mockEvents}
        />

        {/* Delete Confirmation Modal */}
        <DeleteSessionModal
          open={showDeleteModal}
          sessionName={sessionName}
          sessionId={sessionId || ''}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
        />

        {/* Session Renewal Modal */}
        <SessionRenewModal
          open={showRenewModal}
          sessionName={sessionName}
          sessionId={sessionId}
          onClose={() => setShowRenewModal(false)}
          isRenewing={isRenewing}
        />
      </>
    );
  }
);

SessionCardImpl.displayName = 'SessionCardImpl';
