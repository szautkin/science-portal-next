'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Paper,
  Typography,
  IconButton,
  Box,
  LinearProgress,
  Link,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  HelpOutline as HelpOutlineIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { LaunchFormWidgetProps } from '@/app/types/LaunchFormWidgetProps';
import { SessionLaunchForm } from '@/app/components/SessionLaunchForm/SessionLaunchForm';
import { SessionRequestModal } from '@/app/components/SessionRequestModal/SessionRequestModal';
import { SessionFormData } from '@/app/types/SessionLaunchFormProps';
import { SessionRequestStatus } from '@/app/types/SessionRequestModalProps';

export function LaunchFormWidgetImpl({
  isLoading = false,
  onRefresh,
  title = 'Launch New Session',
  showProgressIndicator = false,
  progressPercentage = 0,
  helpUrl,
  imagesByType = {},
  repositoryHosts = [],
  activeSessions = [],
  ...sessionLaunchFormProps
}: LaunchFormWidgetProps) {
  const theme = useTheme();

  const [modalOpen, setModalOpen] = useState(false);
  const [requestStatus, setRequestStatus] =
    useState<SessionRequestStatus>('requesting');
  const [requestError, setRequestError] = useState<string | undefined>();
  const [sessionData, setSessionData] = useState<SessionFormData | null>(null);
  const [selectedSessionType, setSelectedSessionType] = useState<string>('notebook');
  const [launchedSession, setLaunchedSession] = useState<any>(null);

  const handleLaunch = useCallback(
    async (formData: SessionFormData) => {
      setSessionData(formData);
      setModalOpen(true);
      setRequestStatus('requesting');
      setRequestError(undefined);
      setLaunchedSession(null);

      try {
        // Import launchSession and getSession from skaha API
        const { launchSession, getSession } = await import('@/lib/api/skaha');

        // Determine which image to use
        const imageToUse = formData.image
          ? `${formData.repositoryHost}/${formData.image}`
          : formData.containerImage;

        // Build launch parameters
        const launchParams = {
          sessionType: formData.type,
          sessionName: formData.sessionName,
          containerImage: imageToUse,
          cores: formData.cores,
          ram: formData.memory,
        };

        // Launch the session and get the session ID
        const initialSession = await launchSession(launchParams);

        // Call the original onLaunch if provided
        if (sessionLaunchFormProps.onLaunch) {
          await sessionLaunchFormProps.onLaunch(formData);
        }

        setRequestStatus('provisioning');

        // Poll for session details to get the connectURL and status
        let attempts = 0;
        const maxAttempts = 10; // Try for about 10 seconds
        let sessionDetails = initialSession;

        while (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1000));

          try {
            sessionDetails = await getSession(initialSession.id);

            // If session is Running and has a connectUrl, we're done
            if (sessionDetails.status === 'Running' && sessionDetails.connectUrl) {
              setLaunchedSession(sessionDetails);
              setRequestStatus('success');
              return;
            }

            // If session failed, show error
            if (sessionDetails.status === 'Failed' || sessionDetails.status === 'Error') {
              setRequestStatus('error');
              setRequestError('Session failed to start. Please try again.');
              return;
            }
          } catch (fetchError) {
            console.warn('Failed to fetch session details, retrying...', fetchError);
          }

          attempts++;
        }

        // If we've exhausted attempts, session is still pending
        setLaunchedSession(sessionDetails);
        setRequestStatus('success');
      } catch (error) {
        setRequestStatus('error');
        setRequestError(
          error instanceof Error ? error.message : 'An unknown error occurred'
        );
      }
    },
    [sessionLaunchFormProps]
  );

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleRetry = useCallback(() => {
    if (sessionData) {
      handleLaunch(sessionData);
    }
  }, [sessionData, handleLaunch]);

  const handleConnect = useCallback(() => {
    // Open the session in a new tab using the connectURL from the API response
    if (launchedSession?.connectUrl) {
      window.open(launchedSession.connectUrl, '_blank', 'noopener,noreferrer');
    } else {
      console.error('No connectURL available for session');
    }
    setModalOpen(false);
  }, [launchedSession]);

  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{
        position: 'relative',
        padding: theme.spacing(2),
        overflow: 'hidden',
        borderRadius: theme.shape.borderRadius,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        // Better mobile padding
        [theme.breakpoints.down('sm')]: {
          padding: theme.spacing(1.5),
          borderRadius: 2,
        },
      }}
      component="div"
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing(1),
          // Better mobile layout for header
          [theme.breakpoints.down('sm')]: {
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 1,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            // Ensure title wraps nicely on very small screens
            flexWrap: 'wrap',
          }}
        >
          <Typography
            variant="h6"
            component="h2"
            sx={{
              // Smaller text on mobile if needed
              [theme.breakpoints.down('sm')]: {
                fontSize: theme.typography.body1.fontSize,
                fontWeight: theme.typography.fontWeightBold,
              },
            }}
          >
            {title}
          </Typography>
          {helpUrl && (
            <Link
              href={helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              <HelpOutlineIcon sx={{ fontSize: theme.spacing(2.5) }} />
            </Link>
          )}
        </Box>
        {onRefresh && (
          <IconButton
            aria-label="refresh"
            onClick={onRefresh}
            disabled={isLoading}
            size="small"
            sx={{
              // Position refresh button better on mobile
              [theme.breakpoints.down('sm')]: {
                alignSelf: 'flex-end',
                mt: -1,
              },
            }}
          >
            <RefreshIcon />
          </IconButton>
        )}
      </Box>

      {/* Loading Bar */}
      <LinearProgress
        color={isLoading ? 'primary' : 'success'}
        variant={isLoading ? 'indeterminate' : 'determinate'}
        value={
          isLoading
            ? undefined
            : showProgressIndicator
              ? progressPercentage
              : 100
        }
        sx={{
          width: '100%',
          height: 4,
          marginBottom: theme.spacing(2),
          borderRadius: 2,
          '& .MuiLinearProgress-bar': {
            borderRadius: 2,
          },
        }}
      />

      {/* Content - SessionLaunchForm */}
      <Box sx={{ marginBottom: theme.spacing(2) }}>
        <SessionLaunchForm
          {...sessionLaunchFormProps}
          imagesByType={imagesByType}
          onLaunch={handleLaunch}
          isLoading={isLoading}
          onSessionTypeChange={setSelectedSessionType}
          repositoryHosts={repositoryHosts}
          activeSessions={activeSessions}
        />
      </Box>

      {/* Session Request Modal */}
      <SessionRequestModal
        open={modalOpen}
        sessionName={sessionData?.sessionName || ''}
        sessionType={sessionData?.type || ''}
        status={requestStatus}
        errorMessage={requestError}
        sessionUrl={launchedSession?.connectUrl}
        onClose={handleModalClose}
        onConnect={
          launchedSession?.status === 'Running' && launchedSession?.connectUrl
            ? handleConnect
            : undefined
        }
        onRetry={handleRetry}
      />
    </Paper>
  );
}
