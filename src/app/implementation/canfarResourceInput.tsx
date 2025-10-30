'use client';

import React, { useState, useEffect } from 'react';
import { Box, TextField, IconButton, useTheme, FormHelperText } from '@mui/material';
import { KeyboardArrowUp, KeyboardArrowDown } from '@mui/icons-material';
import { CanfarResourceInputProps } from '@/app/types/CanfarResourceInputProps';

export const CanfarResourceInputImpl = React.forwardRef<HTMLDivElement, CanfarResourceInputProps>(
  ({ value, options, onChange, onBlur, onValidationChange, disabled = false, label, error = false, helperText }, ref) => {
    const theme = useTheme();
    const [inputValue, setInputValue] = useState(String(value));
    const [internalError, setInternalError] = useState(false);
    const [invalidValue, setInvalidValue] = useState<string>('');

    // Update input value when prop value changes
    useEffect(() => {
      setInputValue(String(value));
      setInternalError(false);
      setInvalidValue('');
      // Notify parent that error is cleared
      if (onValidationChange) {
        onValidationChange(false);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    // Find current index in options array
    const currentIndex = options.findIndex((opt) => opt === value);
    const isAtMax = currentIndex >= options.length - 1;
    const isAtMin = currentIndex <= 0;

    const handleIncrement = () => {
      if (currentIndex < options.length - 1) {
        const newValue = options[currentIndex + 1];
        onChange(newValue);
        setInputValue(String(newValue));
        setInternalError(false);
        setInvalidValue('');
        // Clear validation error - enable button
        if (onValidationChange) {
          onValidationChange(false);
        }
      }
    };

    const handleDecrement = () => {
      if (currentIndex > 0) {
        const newValue = options[currentIndex - 1];
        onChange(newValue);
        setInputValue(String(newValue));
        setInternalError(false);
        setInvalidValue('');
        // Clear validation error - enable button
        if (onValidationChange) {
          onValidationChange(false);
        }
      }
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      // Limit to 4 digits
      if (newValue.length <= 4) {
        setInputValue(newValue);

        // Check if the new value is valid
        const numValue = Number(newValue);
        const isValid = options.includes(numValue);

        if (!isValid && newValue !== '') {
          // Invalid value while typing - disable button
          setInternalError(true);
          setInvalidValue(newValue);
          if (onValidationChange) {
            onValidationChange(true);
          }
        } else {
          // Valid value or empty - clear error
          setInternalError(false);
          setInvalidValue('');
          if (onValidationChange) {
            onValidationChange(false);
          }
        }
      }
    };

    const handleInputBlur = () => {
      const numValue = Number(inputValue);

      // Check if the value is in the options array
      if (options.includes(numValue)) {
        onChange(numValue);
        setInternalError(false);
        setInvalidValue('');
        // Clear validation error - enable button
        if (onValidationChange) {
          onValidationChange(false);
        }
      } else {
        // Invalid value - store it for error message, reset to valid value
        const invalidValueToShow = inputValue;
        setInvalidValue(invalidValueToShow);
        setInputValue(String(value)); // Reset to current valid value

        // Keep error visible but enable button since we reset to valid
        setInternalError(true);
        // Clear validation error - enable button
        if (onValidationChange) {
          onValidationChange(false);
        }
      }

      if (onBlur) {
        onBlur();
      }
    };

    const showError = error || internalError;
    const errorMessage = internalError && invalidValue
      ? `Value ${invalidValue} is not supported`
      : helperText;

    return (
      <Box ref={ref} sx={{ width: '100%', position: 'relative' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'stretch',
            position: 'relative',
          }}
        >
          {/* Input Field */}
          <TextField
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            disabled={disabled}
            error={showError}
            fullWidth
            size="small"
            inputProps={{
              maxLength: 4,
              'aria-label': label,
              style: { paddingRight: '48px' }, // Make room for buttons
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                paddingRight: 0,
              },
              '& input[type=number]': {
                MozAppearance: 'textfield',
              },
              '& input[type=number]::-webkit-outer-spin-button': {
                WebkitAppearance: 'none',
                margin: 0,
              },
              '& input[type=number]::-webkit-inner-spin-button': {
                WebkitAppearance: 'none',
                margin: 0,
              },
            }}
          />

          {/* Button Container - positioned absolutely inside the input */}
          <Box
            sx={{
              position: 'absolute',
              right: 1,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              flexDirection: 'column',
              height: 'calc(100% - 2px)',
              border: `1px solid ${showError ? theme.palette.error.main : theme.palette.divider}`,
              borderRadius: '4px',
              overflow: 'hidden',
              backgroundColor: theme.palette.background.paper,
            }}
          >
            {/* Increment Button */}
            <IconButton
              onClick={handleIncrement}
              disabled={disabled || isAtMax}
              size="small"
              aria-label={`Increase ${label}`}
              sx={{
                borderRadius: 0,
                padding: '2px 4px',
                minWidth: '24px',
                height: '50%',
                borderBottom: `1px solid ${theme.palette.divider}`,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
                '& .MuiSvgIcon-root': {
                  fontSize: '1rem',
                },
              }}
            >
              <KeyboardArrowUp />
            </IconButton>

            {/* Decrement Button */}
            <IconButton
              onClick={handleDecrement}
              disabled={disabled || isAtMin}
              size="small"
              aria-label={`Decrease ${label}`}
              sx={{
                borderRadius: 0,
                padding: '2px 4px',
                minWidth: '24px',
                height: '50%',
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
                '& .MuiSvgIcon-root': {
                  fontSize: '1rem',
                },
              }}
            >
              <KeyboardArrowDown />
            </IconButton>
          </Box>
        </Box>

        {/* Error/Helper Text - Absolutely positioned, no layout shift */}
        {showError && errorMessage && (
          <FormHelperText
            error
            sx={{
              position: 'absolute',
              left: 0,
              top: '100%',
              mt: 0.5,
              whiteSpace: 'nowrap',
              zIndex: 1,
            }}
          >
            {errorMessage}
          </FormHelperText>
        )}
      </Box>
    );
  }
);

CanfarResourceInputImpl.displayName = 'CanfarResourceInputImpl';
