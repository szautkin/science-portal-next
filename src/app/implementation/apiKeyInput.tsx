'use client';

import React, { useState, useCallback } from 'react';
import {
  TextField as MuiTextField,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { APIKeyInputProps } from '@/app/types/APIKeyInputProps';

const sizeMapping = {
  sm: 'small',
  md: 'medium',
  lg: 'medium',
} as const;

export const APIKeyInputImpl = React.forwardRef<
  HTMLDivElement,
  APIKeyInputProps
>(
  (
    {
      size = 'md',
      showToggle = true,
      pattern,
      validate,
      showValidation = true,
      label = 'API Key',
      placeholder = 'Enter your API key...',
      fullWidth = true,
      value,
      onChange,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [isValidated, setIsValidated] = useState(false);

    const muiSize = sizeMapping[size];

    const handleClickShowPassword = () => {
      setShowPassword(!showPassword);
    };

    const validateInput = useCallback(
      (inputValue: string) => {
        if (!inputValue || inputValue.length === 0) {
          setValidationError(null);
          setIsValidated(false);
          return;
        }

        let error: string | null = null;

        // Custom validation function takes precedence
        if (validate) {
          error = validate(inputValue);
        } else if (pattern) {
          const regex = new RegExp(pattern);
          if (!regex.test(inputValue)) {
            error = 'Invalid API key format';
          }
        } else {
          // Default validation for common API key patterns
          if (inputValue.length < 10) {
            error = 'API key appears to be too short';
          } else if (!/^[a-zA-Z0-9\-_]+$/.test(inputValue)) {
            error = 'API key contains invalid characters';
          }
        }

        setValidationError(error);
        setIsValidated(error === null && inputValue.length > 0);
      },
      [validate, pattern]
    );

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;

      if (showValidation) {
        validateInput(newValue);
      }

      if (onChange) {
        onChange(event);
      }
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      if (showValidation) {
        validateInput(event.target.value);
      }

      if (onBlur) {
        onBlur(event);
      }
    };

    const getValidationIcon = () => {
      if (!showValidation || !value) return null;

      if (validationError) {
        return (
          <Tooltip title={validationError}>
            <ErrorIcon color="error" />
          </Tooltip>
        );
      }

      if (isValidated) {
        return (
          <Tooltip title="Valid API key format">
            <CheckCircle color="success" />
          </Tooltip>
        );
      }

      return null;
    };

    const displayError = props.error || validationError !== null;
    const displayHelperText = props.error
      ? props.helperText
      : validationError || props.helperText;

    return (
      <MuiTextField
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        size={muiSize}
        variant="outlined"
        fullWidth={fullWidth}
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        error={displayError}
        helperText={displayHelperText}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {getValidationIcon()}
              {showToggle && (
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPassword}
                  onMouseDown={(e) => e.preventDefault()}
                  edge="end"
                  size={size === 'sm' ? 'small' : 'medium'}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              )}
            </InputAdornment>
          ),
        }}
        sx={(theme) => ({
          fontFamily: theme.typography.fontFamily,
          '& .MuiInputLabel-root': {
            fontFamily: theme.typography.fontFamily,
            fontSize:
              size === 'sm'
                ? theme.typography.body2.fontSize
                : theme.typography.body1.fontSize,
            fontWeight: theme.typography.fontWeightMedium,
            color: theme.palette.text.secondary,
            '&.Mui-focused': {
              color: theme.palette.primary.main,
            },
            '&.Mui-error': {
              color: theme.palette.error.main,
            },
          },
          '& .MuiOutlinedInput-root': {
            borderRadius: `${theme.shape.borderRadius}px`,
            fontFamily: theme.typography.fontFamily,
            fontSize:
              size === 'sm'
                ? theme.typography.body2.fontSize
                : theme.typography.body1.fontSize,
            backgroundColor: theme.palette.background.default,
            transition: 'none',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.divider,
              borderWidth: '1px',
            },
            '&.Mui-focused': {
              backgroundColor: theme.palette.background.paper,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.primary.main,
                borderWidth: '2px',
              },
            },
            '&.Mui-error': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.error.main,
              },
            },
            '&.Mui-disabled': {
              backgroundColor: theme.palette.action.disabledBackground,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.action.disabled,
              },
            },
          },
          '& .MuiFormHelperText-root': {
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.caption.fontSize,
            marginTop: theme.spacing(0.5),
            color: theme.palette.text.secondary,
            '&.Mui-error': {
              color: theme.palette.error.main,
            },
          },
          '& .MuiInputBase-input': {
            padding:
              size === 'sm' ? theme.spacing(1, 1.5) : theme.spacing(1.5, 2),
            color: theme.palette.text.primary,
            fontFamily: 'monospace', // Use monospace for API keys
            '&::placeholder': {
              color: theme.palette.text.secondary,
              opacity: 1,
              fontFamily: theme.typography.fontFamily,
            },
            '&.Mui-disabled': {
              color: theme.palette.text.disabled,
            },
          },
        })}
        {...props}
      />
    );
  }
);

APIKeyInputImpl.displayName = 'APIKeyInputImpl';
