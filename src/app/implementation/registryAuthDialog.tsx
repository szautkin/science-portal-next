'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Alert,
  Box,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Info as InfoIcon,
  RestartAlt as ResetIcon,
} from '@mui/icons-material';
import { TextField } from '@/app/components/TextField/TextField';
import { RegistryAuthDialogProps } from '@/app/types/RegistryAuthDialogProps';

export const RegistryAuthDialogImpl = React.forwardRef<HTMLDivElement, RegistryAuthDialogProps>(
  (
    {
      open,
      onClose,
      onSave,
      initialUsername = '',
      initialSecret = '',
      initialContainerImage = '',
      onResetImage,
    },
    ref
  ) => {
    const [username, setUsername] = useState(initialUsername);
    const [secret, setSecret] = useState(initialSecret);
    const [containerImage, setContainerImage] = useState(initialContainerImage);

    // Update local state when initial values change
    useEffect(() => {
      setUsername(initialUsername);
      setSecret(initialSecret);
      setContainerImage(initialContainerImage);
    }, [initialUsername, initialSecret, initialContainerImage]);

    const handleSave = () => {
      onSave(username, secret, containerImage);
      onClose();
    };

    const handleClear = () => {
      setUsername('');
      setSecret('');
      onSave('', '', containerImage);
      onClose();
    };

    const handleResetImage = () => {
      if (onResetImage) {
        onResetImage();
      }
    };

    const hasCredentials = username.trim().length > 0 || secret.trim().length > 0;

    return (
      <Dialog
        ref={ref}
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <SettingsIcon color="primary" />
            <Typography variant="h6">Execution Settings</Typography>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Container Image Section */}
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Container Image
                </Typography>
                {onResetImage && (
                  <Tooltip title="Reset to default">
                    <IconButton size="small" onClick={handleResetImage}>
                      <ResetIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
              <TextField
                fullWidth
                value={containerImage}
                onChange={(e) => setContainerImage(e.target.value)}
                placeholder="images.canfar.net/private-test/python-runner:1.0.0"
                size="sm"
                helperText="Full path to container image including registry"
              />
            </Box>

            <Divider />

            {/* Registry Authentication Section */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Registry Authentication
              </Typography>
              <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Private container images require authentication.
                  Provide your registry username and password/token.
                </Typography>
              </Alert>
            </Box>

            {/* Username field */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                Registry Username
              </Typography>
              <TextField
                fullWidth
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter registry username"
                size="sm"
                autoComplete="username"
              />
            </Box>

            {/* Password/Token field */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                Registry Secret (Password/Token)
              </Typography>
              <TextField
                fullWidth
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Enter registry password or token"
                size="sm"
                autoComplete="current-password"
              />
            </Box>

            {/* Security note */}
            <Alert severity="warning" sx={{ mt: 1 }}>
              <Typography variant="caption">
                Credentials are only stored in memory during your session and are not persisted.
                They will be sent securely with your session launch request.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} variant="outlined" size="small">
            Cancel
          </Button>
          {hasCredentials && (
            <Button onClick={handleClear} variant="outlined" size="small" color="warning">
              Clear
            </Button>
          )}
          <Button
            onClick={handleSave}
            variant="contained"
            size="small"
            disabled={!containerImage.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
);

RegistryAuthDialogImpl.displayName = 'RegistryAuthDialogImpl';
