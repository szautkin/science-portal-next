'use client';

import {
  Select as MuiSelect,
  FormControl,
  InputLabel,
  FormHelperText,
  MenuItem,
  ListItemText,
  Tooltip,
} from '@mui/material';
import { ModelSelectorProps } from '@/app/types/ModelSelectorProps';
import React from 'react';

const defaultModels = [
  {
    id: 'openai',
    name: 'OpenAI',
    enabled: true,
    description: 'OpenAI GPT Models (Selected)',
  },
];

const sizeMapping = {
  sm: 'small',
  md: 'medium',
  lg: 'medium',
} as const;

export const ModelSelectorImpl = React.forwardRef<
  HTMLDivElement,
  ModelSelectorProps
>(
  (
    {
      size = 'md',
      label = 'AI Vendor',
      helperText,
      error = false,
      fullWidth = true,
      required = false,
      models = defaultModels,
      value = 'openai',
      onChange,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const muiSize = sizeMapping[size];
    const labelId = `model-selector-label-${Math.random().toString(36).substr(2, 9)}`;
    const helperTextId = helperText
      ? `model-selector-helper-${Math.random().toString(36).substr(2, 9)}`
      : undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleChange = (event: any) => {
      if (onChange) {
        onChange(event.target.value as string);
      }
    };

    return (
      <FormControl
        ref={ref}
        fullWidth={fullWidth}
        error={error}
        size={muiSize}
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
          value={value}
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
                maxHeight: '300px',
                '& .MuiList-root': {
                  padding: theme.spacing(0.5),
                },
                '& .MuiMenuItem-root': {
                  fontFamily: theme.typography.fontFamily,
                  fontSize:
                    size === 'sm'
                      ? theme.typography.body2.fontSize
                      : theme.typography.body1.fontSize,
                  padding: theme.spacing(1, 2),
                  margin: theme.spacing(0.25, 0.5),
                  borderRadius: `${Math.max(0, (theme.shape.borderRadius as number) - 2)}px`,
                  color: theme.palette.text.primary,
                  minHeight: 'auto',
                  transition: 'none',
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                  },
                  '&.Mui-focusVisible': {
                    backgroundColor: theme.palette.action.focus,
                  },
                  '&.Mui-disabled': {
                    color: theme.palette.text.disabled,
                    opacity: 0.6,
                  },
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
          {models.map((model) => (
            <MenuItem
              key={model.id}
              value={model.id}
              disabled={!model.enabled}
              sx={{
                '&.Mui-disabled': {
                  opacity: '0.6 !important',
                },
              }}
            >
              {model.description && model.enabled ? (
                <Tooltip title={model.description} placement="right">
                  <ListItemText
                    primary={model.name}
                    secondary={!model.enabled ? '(Coming soon)' : undefined}
                  />
                </Tooltip>
              ) : (
                <ListItemText
                  primary={model.name}
                  secondary={!model.enabled ? '(Coming soon)' : undefined}
                />
              )}
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

ModelSelectorImpl.displayName = 'ModelSelectorImpl';
