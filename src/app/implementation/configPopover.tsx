'use client';

import React, { useCallback } from 'react';
import {
  Popover,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import { ConfigPopoverProps } from '@/app/types/ConfigPopoverProps';
import { useAIConfig } from '@/app/context/AIConfigContext';
import { ModelSelector } from '@/app/components/ModelSelector/ModelSelector';
import { ModelDropdown } from '@/app/components/ModelDropdown/ModelDropdown';
import { APIKeyInput } from '@/app/components/APIKeyInput/APIKeyInput';

/**
 * ConfigPopoverImpl component
 *
 * Implementation of a configuration popover that displays AI model and API key settings.
 * Uses AIConfigContext to manage state and provides a clean interface for configuring
 * the AI assistant.
 *
 * @internal This is the implementation component. Use ConfigPopover instead.
 */
export const ConfigPopoverImpl = React.forwardRef<
  HTMLDivElement,
  ConfigPopoverProps
>(({ open, onClose, anchorEl, disabled = false, className }, ref) => {
  const {
    selectedModel,
    selectedModelName,
    apiKey,
    setSelectedModel,
    setSelectedModelName,
    setApiKey,
  } = useAIConfig();

  const handleModelChange = useCallback(
    (model: string) => {
      setSelectedModel(model);
    },
    [setSelectedModel]
  );

  const handleModelNameChange = useCallback(
    (modelName: string) => {
      setSelectedModelName(modelName);
    },
    [setSelectedModelName]
  );

  const handleApiKeyChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setApiKey(event.target.value);
    },
    [setApiKey]
  );

  return (
    <Popover
      ref={ref}
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      className={className}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      slotProps={{
        paper: {
          elevation: 8,
          sx: {
            mt: 1,
            minWidth: 400,
            maxWidth: 500,
            borderRadius: 2,
          },
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Typography
          variant="h6"
          component="h2"
          gutterBottom
          sx={(theme) => ({
            fontWeight: theme.typography.fontWeightMedium,
            color: theme.palette.text.primary,
            mb: 2,
          })}
        >
          AI Configuration
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <ModelSelector
            value={selectedModel}
            onChange={handleModelChange}
            disabled={disabled}
            helperText="Select the AI vendor"
            fullWidth
            label="AI Vendor"
          />

          <ModelDropdown
            value={selectedModelName}
            onChange={handleModelNameChange}
            disabled={disabled}
            helperText="Select a model (pricing shown per 1M tokens)"
            fullWidth
            label="Model"
            required
          />

          <APIKeyInput
            value={apiKey}
            onChange={handleApiKeyChange}
            disabled={disabled}
            placeholder="sk-..."
            helperText="Your API key (not stored permanently)"
            fullWidth
            label="API Key"
            required
            showToggle
          />
        </Box>

        <Box
          sx={(theme) => ({
            mt: 2,
            pt: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
          })}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block' }}
          >
            Your API key is used only for this session and is not stored on our
            servers.
          </Typography>
        </Box>
      </Box>
    </Popover>
  );
});

ConfigPopoverImpl.displayName = 'ConfigPopoverImpl';
