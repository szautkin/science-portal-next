'use client';

import React, { useCallback, useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Chip,
  Stack,
  Typography,
  LinearProgress,
  Tooltip,
  IconButton,
  Badge,
} from '@mui/material';
import {
  Save as SaveIcon,
  PlayArrow as PlayIcon,
  Check as CheckIcon,
  Edit as EditIcon,
  Folder as FolderIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { CodeEditorProps } from '@/app/types/CodeEditorProps';
import { RegistryAuthDialog } from '@/app/components/RegistryAuthDialog/RegistryAuthDialog';

export const CodeEditorImpl = React.forwardRef<HTMLDivElement, CodeEditorProps>(
  (
    {
      code,
      language,
      onChange,
      onStore,
      onRun,
      isStoring,
      isExecuting,
      isModified,
      storedFilePath,
      readOnly = false,
      height = '400px',
      showLineNumbers = true,
      theme: editorTheme,
      placeholder = 'Your code will appear here...',
      registryUsername = '',
      registrySecret = '',
      containerImage = '',
      onSettingsChange,
      onResetImage,
    },
    ref
  ) => {
    const theme = useTheme();
    const isDarkMode = editorTheme === 'dark' || theme.palette.mode === 'dark';

    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

    const handleCodeChange = useCallback(
      (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(event.target.value);
      },
      [onChange]
    );

    const handleSettingsDialogOpen = useCallback(() => {
      setSettingsDialogOpen(true);
    }, []);

    const handleSettingsDialogClose = useCallback(() => {
      setSettingsDialogOpen(false);
    }, []);

    const handleSettingsSave = useCallback(
      (username: string, secret: string, image: string) => {
        onSettingsChange?.(username, secret, image);
      },
      [onSettingsChange]
    );

    const canStore = code.trim().length > 0 && !isStoring && !isExecuting;
    const canRun = storedFilePath !== null && !isExecuting;

    return (
      <Box ref={ref} sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
        {/* Header with language and status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={language.toUpperCase()}
              size="small"
              color="primary"
              variant="outlined"
            />
            {storedFilePath && (
              <Tooltip title={storedFilePath}>
                <Chip
                  icon={isModified ? <EditIcon /> : <CheckIcon />}
                  label={isModified ? 'Modified' : 'Stored'}
                  size="small"
                  color={isModified ? 'warning' : 'success'}
                  variant="outlined"
                />
              </Tooltip>
            )}
          </Stack>

          {storedFilePath && (
            <Tooltip title={storedFilePath}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  maxWidth: '300px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                <FolderIcon fontSize="small" />
                {storedFilePath.split('/').pop()}
              </Typography>
            </Tooltip>
          )}
        </Box>

        {/* Code editor */}
        <Box
          sx={{
            position: 'relative',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            overflow: 'hidden',
            backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
            flex: 1,
            minHeight: 0,
          }}
        >
          {(isStoring || isExecuting) && (
            <LinearProgress
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1,
              }}
            />
          )}
          <TextField
            multiline
            fullWidth
            value={code}
            onChange={handleCodeChange}
            disabled={readOnly || isExecuting}
            placeholder={placeholder}
            variant="outlined"
            minRows={1}
            maxRows={1}
            InputProps={{
              sx: {
                fontFamily: 'Monaco, Menlo, "Courier New", monospace',
                fontSize: '14px',
                lineHeight: 1.5,
                padding: 0,
                height: '100%',
                alignItems: 'flex-start',
                '& textarea': {
                  padding: theme.spacing(2),
                  height: '100% !important',
                  overflow: 'auto !important',
                  color: isDarkMode ? '#d4d4d4' : '#000000',
                  backgroundColor: 'transparent',
                  resize: 'none',
                  '&::placeholder': {
                    color: theme.palette.text.disabled,
                    opacity: 1,
                  },
                },
                '& fieldset': {
                  border: 'none',
                },
              },
            }}
            sx={{
              height: '100%',
              '& .MuiInputBase-root': {
                height: '100%',
                padding: 0,
                alignItems: 'flex-start',
              },
            }}
          />
        </Box>

        {/* Action buttons */}
        <Stack direction="row" spacing={2} sx={{ flexShrink: 0, alignItems: 'center' }}>
          <Button
            variant="contained"
            startIcon={isStoring ? null : <SaveIcon />}
            onClick={onStore}
            disabled={!canStore}
            color="primary"
          >
            {isStoring ? 'Storing...' : storedFilePath ? 'Update' : 'Store'}
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={isExecuting ? null : <PlayIcon />}
              onClick={onRun}
              disabled={!canRun}
              color="success"
            >
              {isExecuting ? 'Running...' : 'Run'}
            </Button>

            <Tooltip title="Configure execution settings">
              <IconButton
                size="small"
                onClick={handleSettingsDialogOpen}
                color={registryUsername ? 'success' : 'default'}
                sx={{
                  border: 1,
                  borderColor: registryUsername ? 'success.main' : 'divider',
                }}
              >
                <Badge
                  variant="dot"
                  color="success"
                  invisible={!registryUsername}
                >
                  <SettingsIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>
          </Box>

          {!storedFilePath && (
            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
              Store code before running
            </Typography>
          )}

          {storedFilePath && isModified && (
            <Typography variant="caption" color="warning.main" sx={{ alignSelf: 'center' }}>
              Code modified - will update on next run
            </Typography>
          )}
        </Stack>

        {/* Instructions */}
        {!code && (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Paste or write your {language} code above, then click Store to save it to VOSpace.
            Once stored, you can run it in a containerized environment.
          </Typography>
        )}

        {/* Settings Dialog */}
        <RegistryAuthDialog
          open={settingsDialogOpen}
          onClose={handleSettingsDialogClose}
          onSave={handleSettingsSave}
          initialUsername={registryUsername}
          initialSecret={registrySecret}
          initialContainerImage={containerImage}
          onResetImage={onResetImage}
        />
      </Box>
    );
  }
);

CodeEditorImpl.displayName = 'CodeEditorImpl';
