'use client';

import React from 'react';
import {
  Select as MuiSelect,
  FormControl,
  InputLabel,
  FormHelperText,
  MenuItem,
  ListItemText,
  Typography,
  Box,
} from '@mui/material';
import { ModelDropdownProps } from '@/app/types/ModelDropdownProps';
import { openAIModels, getDefaultModel } from '@/app/config/modelConfig';

const sizeMapping = {
  sm: 'small',
  md: 'medium',
  lg: 'medium',
} as const;

export const ModelDropdownImpl = React.forwardRef<
  HTMLDivElement,
  ModelDropdownProps
>(
  (
    {
      size = 'md',
      label = 'Model',
      helperText,
      error = false,
      fullWidth = true,
      required = false,
      value,
      onChange,
      disabled = false,
      className,
      ...props
    },
    ref
  ) => {
    const muiSize = sizeMapping[size];
    const labelId = `model-dropdown-label-${Math.random().toString(36).substr(2, 9)}`;
    const helperTextId = helperText
      ? `model-dropdown-helper-${Math.random().toString(36).substr(2, 9)}`
      : undefined;

    const defaultModel = getDefaultModel();
    const selectedValue = value || defaultModel?.id || '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleChange = (event: any) => {
      if (onChange) {
        onChange(event.target.value as string);
      }
    };

    const formatPrice = (price: number) => {
      return price < 1 ? `$${price.toFixed(3)}` : `$${price.toFixed(2)}`;
    };

    return (
      <FormControl
        ref={ref}
        fullWidth={fullWidth}
        error={error}
        size={muiSize}
        required={required}
        disabled={disabled}
        className={className}
        sx={(theme) => ({
          '& .MuiFormLabel-root': {
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
        <InputLabel
          id={labelId}
          sx={(theme) => ({
            fontFamily: theme.typography.fontFamily,
            fontSize:
              size === 'sm'
                ? theme.typography.body2.fontSize
                : theme.typography.body1.fontSize,
            fontWeight: theme.typography.fontWeightMedium,
          })}
        >
          {label}
        </InputLabel>
        <MuiSelect
          labelId={labelId}
          value={selectedValue}
          label={label}
          onChange={handleChange}
          required={required}
          disabled={disabled}
          aria-describedby={error && helperTextId ? helperTextId : undefined}
          sx={(theme) => ({
            fontFamily: theme.typography.fontFamily,
            fontSize:
              size === 'sm'
                ? theme.typography.body2.fontSize
                : theme.typography.body1.fontSize,
            borderRadius: `${theme.shape.borderRadius}px`,
            backgroundColor: theme.palette.background.default,
            transition: 'none',
            '& .MuiOutlinedInput-notchedOutline': {
              borderRadius: `${theme.shape.borderRadius}px`,
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
            '& .MuiSelect-select': {
              padding:
                size === 'sm' ? theme.spacing(1, 1.5) : theme.spacing(1.5, 2),
              paddingRight: `${theme.spacing(4)} !important`,
              fontFamily: theme.typography.fontFamily,
              fontSize: 'inherit',
              color: theme.palette.text.primary,
              '&.Mui-disabled': {
                color: theme.palette.text.disabled,
              },
            },
            '& .MuiSelect-icon': {
              color: theme.palette.action.active,
              transition: 'none',
              '&.MuiSelect-iconOpen': {
                transform: 'rotate(180deg)',
                color: theme.palette.primary.main,
              },
              '&.Mui-disabled': {
                color: theme.palette.action.disabled,
              },
            },
          })}
          MenuProps={{
            PaperProps: {
              sx: (theme) => ({
                borderRadius: `${theme.shape.borderRadius}px`,
                backgroundColor: theme.palette.background.paper,
                boxShadow: theme.shadows[8],
                border: `1px solid ${theme.palette.divider}`,
                marginTop: theme.spacing(0.5),
                maxHeight: '400px',
                '& .MuiList-root': {
                  padding: theme.spacing(0.5),
                },
              }),
            },
            transformOrigin: {
              vertical: 'top',
              horizontal: 'left',
            },
            anchorOrigin: {
              vertical: 'bottom',
              horizontal: 'left',
            },
          }}
          {...props}
        >
          {openAIModels.map((model) => (
            <MenuItem
              key={model.id}
              value={model.id}
              disabled={!model.enabled}
              sx={(theme) => ({
                fontFamily: theme.typography.fontFamily,
                fontSize:
                  size === 'sm'
                    ? theme.typography.body2.fontSize
                    : theme.typography.body1.fontSize,
                padding: theme.spacing(1.5, 2),
                margin: theme.spacing(0.25, 0.5),
                borderRadius: `${Math.max(0, (theme.shape.borderRadius as number) - 2)}px`,
                minHeight: 'auto',
                transition: 'none',
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  '& .MuiTypography-root': {
                    color: theme.palette.primary.contrastText,
                  },
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  },
                },
                '&:hover:not(.Mui-selected)': {
                  backgroundColor: theme.palette.action.hover,
                },
                '&.Mui-focusVisible:not(.Mui-selected)': {
                  backgroundColor: theme.palette.action.focus,
                },
                '&.Mui-disabled': {
                  opacity: 0.6,
                },
              })}
            >
              <Box sx={{ width: '100%' }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 0.5,
                  }}
                >
                  <ListItemText
                    primary={model.name}
                    primaryTypographyProps={{
                      fontWeight: model.isDefault ? 600 : 400,
                    }}
                  />
                  {model.isDefault && (
                    <Typography
                      variant="caption"
                      sx={(theme) => ({
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        fontSize: '0.7rem',
                        fontWeight: 500,
                      })}
                    >
                      Default
                    </Typography>
                  )}
                </Box>
                <Typography
                  variant="caption"
                  sx={(theme) => ({
                    color: theme.palette.text.secondary,
                    display: 'block',
                    fontSize: '0.75rem',
                    lineHeight: 1.4,
                  })}
                >
                  Input: {formatPrice(model.pricing.input)}/1M • Output:{' '}
                  {formatPrice(model.pricing.output)}/1M
                </Typography>
                {model.description && (
                  <Typography
                    variant="caption"
                    sx={(theme) => ({
                      color: theme.palette.text.disabled,
                      display: 'block',
                      fontSize: '0.7rem',
                      fontStyle: 'italic',
                      mt: 0.25,
                    })}
                  >
                    {model.description}
                  </Typography>
                )}
              </Box>
            </MenuItem>
          ))}
        </MuiSelect>
        {helperText && (
          <FormHelperText
            id={helperTextId}
            sx={(theme) => ({
              fontFamily: theme.typography.fontFamily,
              fontSize: theme.typography.caption.fontSize,
              marginTop: theme.spacing(0.5),
            })}
          >
            {helperText}
          </FormHelperText>
        )}
      </FormControl>
    );
  }
);

ModelDropdownImpl.displayName = 'ModelDropdownImpl';
