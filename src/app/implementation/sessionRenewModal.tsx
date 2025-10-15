'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { SessionRenewModalProps } from '@/app/types/SessionRenewModalProps';

export const SessionRenewModalImpl = React.forwardRef<
  HTMLDivElement,
  SessionRenewModalProps
>(({ open, sessionName, sessionId, onClose, isRenewing = true }, ref) => {
  const theme = useTheme();

  return (
    <Dialog
      ref={ref}
      open={open}
      onClose={isRenewing ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="renew-session-dialog-title"
      aria-describedby="renew-session-dialog-description"
    >
      <DialogTitle id="renew-session-dialog-title">
        Renew Session Request
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing(2),
            py: theme.spacing(2),
          }}
        >
          <Typography
            id="renew-session-dialog-description"
            variant="body1"
            sx={{ flex: 1 }}
          >
            Extending session time
          </Typography>
          <CircularProgress size={24} />
        </Box>
        {sessionName && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Session: {sessionName}
            {sessionId && ` (${sessionId})`}
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
});

SessionRenewModalImpl.displayName = 'SessionRenewModalImpl';
