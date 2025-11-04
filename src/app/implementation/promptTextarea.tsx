'use client';

import React, { useState } from 'react';
import {
  TextareaAutosize,
  FormControl,
  InputLabel,
  FormHelperText,
  Typography,
  Box,
} from '@mui/material';
import { PromptTextareaProps } from '@/app/types/PromptTextareaProps';

export const PromptTextareaImpl = React.forwardRef<
  HTMLTextAreaElement,
  PromptTextareaProps
>(
  (
    {
      size = 'md',
      label = 'Prompt',
      helperText,
      error = false,
      errorMessage,
      fullWidth = true,
      required = false,
      maxRows = 20,
      minRows = 4,
      maxLength,
      showCharCount = true,
      disabled = false,
      value,
      onChange,
      modelInfo,
      ...props
    },
    ref
  ) => {
    const [charCount, setCharCount] = useState(
      typeof value === 'string' ? value.length : 0
    );

    const labelId = label
      ? `prompt-textarea-label-${Math.random().toString(36).substr(2, 9)}`
      : undefined;
    const helperTextId =
      helperText || errorMessage
        ? `prompt-textarea-helper-${Math.random().toString(36).substr(2, 9)}`
        : undefined;

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = event.target.value;

      if (maxLength && newValue.length > maxLength) {
        return; // Prevent input beyond max length
      }

      setCharCount(newValue.length);
      if (onChange) {
        onChange(event);
      }
    };

    const displayError =
      error || Boolean(errorMessage && errorMessage.length > 0);
    const displayHelperText = displayError ? errorMessage : helperText;

    return (
      <FormControl
        fullWidth={fullWidth}
        error={displayError}
        required={required}
        disabled={disabled}
        sx={(theme) => ({
          '& .MuiFormLabel-root': {
            fontFamily: theme.typography.fontFamily,
            fontSize:
              size === 'sm'
                ? theme.typography.body2.fontSize
                : theme.typography.body1.fontSize,
            fontWeight: theme.typography.fontWeightMedium,
            color: theme.palette.text.secondary,
            marginBottom: theme.spacing(1),
            display: 'block',
            position: 'relative',
            transform: 'none',
            '&.Mui-focused': {
              color: theme.palette.primary.main,
            },
            '&.Mui-error': {
              color: theme.palette.error.main,
            },
          },
          '& .MuiFormHelperText-root': {
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.caption.fontSize,
            marginTop: theme.spacing(0.5),
            '&.Mui-error': {
              color: theme.palette.error.main,
            },
          },
        })}
      >
        {label && (
          <InputLabel
            id={labelId}
            sx={(theme) => ({
              fontFamily: theme.typography.fontFamily,
              fontSize:
                size === 'sm'
                  ? theme.typography.body2.fontSize
                  : theme.typography.body1.fontSize,
              fontWeight: theme.typography.fontWeightMedium,
              color: displayError
                ? theme.palette.error.main
                : theme.palette.text.secondary,
              marginBottom: theme.spacing(1),
              position: 'relative',
              transform: 'none',
            })}
          >
            {label}
            {required && (
              <Typography component="span" color="error.main" sx={{ ml: 0.5 }}>
                *
              </Typography>
            )}
          </InputLabel>
        )}

        <TextareaAutosize
          ref={ref}
          minRows={minRows}
          maxRows={maxRows}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          aria-labelledby={labelId}
          aria-describedby={
            displayHelperText && helperTextId ? helperTextId : undefined
          }
          style={{
            width: '100%',
            fontFamily: 'inherit',
            fontSize: size === 'sm' ? '14px' : '16px',
            lineHeight: '1.5',
            padding: size === 'sm' ? '8px 12px' : '12px 16px',
            border: `1px solid ${displayError ? '#d32f2f' : '#e0e0e0'}`,
            borderRadius: '4px',
            backgroundColor: disabled ? '#f5f5f5' : '#ffffff',
            color: disabled ? '#757575' : '#212121',
            resize: 'vertical',
            outline: 'none',
            transition:
              'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
          }}
          onFocus={(e) => {
            if (!disabled) {
              e.target.style.borderColor = displayError ? '#d32f2f' : '#1976d2';
              e.target.style.borderWidth = '2px';
              e.target.style.boxShadow = displayError
                ? '0 0 0 0.2rem rgba(211, 47, 47, 0.25)'
                : '0 0 0 0.2rem rgba(25, 118, 210, 0.25)';
            }
          }}
          onBlur={(e) => {
            e.target.style.borderColor = displayError ? '#d32f2f' : '#e0e0e0';
            e.target.style.borderWidth = '1px';
            e.target.style.boxShadow = 'none';
          }}
          {...props}
        />

        <Box
          sx={(theme) => ({
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginTop: theme.spacing(0.5),
          })}
        >
          {displayHelperText && (
            <FormHelperText
              id={helperTextId}
              sx={(theme) => ({
                fontFamily: theme.typography.fontFamily,
                fontSize: theme.typography.caption.fontSize,
                margin: 0,
                flex: 1,
              })}
            >
              {displayHelperText}
            </FormHelperText>
          )}

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexShrink: 0,
            }}
          >
            {modelInfo && (
              <Typography
                variant="caption"
                sx={(theme) => ({
                  fontFamily: theme.typography.fontFamily,
                  color: theme.palette.text.secondary,
                  fontWeight: theme.typography.fontWeightMedium,
                })}
              >
                {modelInfo.vendor} • {modelInfo.modelName}
              </Typography>
            )}

            {showCharCount && maxLength && (
              <Typography
                variant="caption"
                sx={(theme) => ({
                  fontFamily: theme.typography.fontFamily,
                  color:
                    charCount > maxLength * 0.9
                      ? theme.palette.warning.main
                      : theme.palette.text.secondary,
                })}
              >
                {charCount}/{maxLength}
              </Typography>
            )}
          </Box>
        </Box>
      </FormControl>
    );
  }
);

PromptTextareaImpl.displayName = 'PromptTextareaImpl';
