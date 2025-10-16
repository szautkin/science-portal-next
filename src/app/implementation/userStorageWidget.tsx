'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Paper,
  Typography,
  IconButton,
  Box,
  LinearProgress,
  Alert,
  Grid,
  Skeleton,
  Popover,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  HelpOutline as HelpOutlineIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import {
  UserStorageWidgetProps,
  StorageData,
  StorageCardData,
} from '@/app/types/UserStorageWidgetProps';

// Test data for development
const TEST_DATA: StorageData = {
  size: 11281596360,
  quota: 200000000000,
  date: 'Jun 11, 2025, 11:27:58 PM PDT',
  usage: 94,
};

// Utility functions
const convertToFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 B';
  const thresh = 1024;
  if (Math.abs(bytes) < thresh) return `${bytes} B`;

  const units = ['KB', 'MB', 'GB', 'TB', 'PB'];
  let u = -1;
  let size = bytes;

  do {
    size /= thresh;
    ++u;
  } while (Math.abs(size) >= thresh && u < units.length - 1);

  return `${size.toFixed(size < 10 ? 2 : 1)} ${units[u]}`;
};

const formatDateUTC = (dateString: string): string => {
  if (!dateString) return 'Unknown';
  try {
    const date = new Date(dateString);
    return date
      .toISOString()
      .replace('T', ' ')
      .replace(/\.\d{3}Z$/, ' UTC');
  } catch {
    return 'Unknown';
  }
};

// Storage Card Component
interface StorageCardProps {
  label: string;
  value: string;
  isLoading: boolean;
  isWarning?: boolean;
}

const StorageCard: React.FC<StorageCardProps> = ({
  label,
  value,
  isLoading,
  isWarning,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        height: '100%',
        borderRadius: 2,
        backgroundColor: 'background.paper',
        border: `1px solid ${theme.palette.divider}`,
        p: 2,
        cursor: 'default',
        userSelect: 'none',
      }}
    >
      {isLoading ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
          }}
        >
          <Skeleton variant="text" width="30%" height={20} />
          <Skeleton variant="text" width="40%" height={20} />
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
          }}
        >
          <Typography variant="body2" fontWeight="bold" color="text.primary">
            {label}:
          </Typography>
          <Typography
            variant="body2"
            fontWeight="bold"
            color={isWarning ? 'error.main' : 'primary.main'}
          >
            {value}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export const UserStorageWidgetImpl = React.forwardRef<
  HTMLDivElement,
  UserStorageWidgetProps
>(
  (
    {
      title = 'User Home Storage',
      isAuthenticated = false,
      name,
      storageUrl,
      isLoading = false,
      data: externalData,
      errorMessage,
      onRefresh,
      showRefreshButton = true,
      helpUrl,
      helpContent,
      showProgressIndicator = true,
      progressPercentage = 0,
      warningThreshold = 90,
      emptyMessage = 'No storage data available',
      dateFormatter = formatDateUTC,
      fileSizeFormatter = convertToFileSize,
      testMode = false,
    },
    ref
  ) => {
    const theme = useTheme();
    const [internalData, setInternalData] = useState<StorageData | null>(null);
    const [internalLoading, setInternalLoading] = useState(false);
    const [internalError, setInternalError] = useState<string | undefined>();
    const [helpAnchorEl, setHelpAnchorEl] = useState<HTMLElement | null>(null);

    // Use external data if provided, otherwise use internal data or test data
    const currentData = useMemo(() => {
      if (externalData !== undefined) return externalData;
      if (testMode) return TEST_DATA;
      return internalData;
    }, [externalData, testMode, internalData]);

    const currentLoading =
      externalData !== undefined ? isLoading : internalLoading;
    const currentError =
      externalData !== undefined ? errorMessage : internalError;

    // Card configuration
    const cardConfigs = useMemo(
      () => [
        {
          key: 'size' as keyof StorageData,
          label: 'Used',
          formatter: fileSizeFormatter,
        },
        {
          key: 'quota' as keyof StorageData,
          label: 'Quota',
          formatter: fileSizeFormatter,
        },
        {
          key: 'usage' as keyof StorageData,
          label: 'Usage',
          formatter: (val: number) => `${(val || 0).toFixed(1)}%`,
        },
      ],
      [fileSizeFormatter]
    );

    // Memoized card data
    const cardData: StorageCardData[] = useMemo(() => {
      return cardConfigs.map((config) => ({
        label: config.label,
        value: config.formatter((currentData?.[config.key] as number) ?? 0),
        isWarning:
          config.key === 'usage' &&
          currentData?.usage !== undefined &&
          currentData.usage > warningThreshold,
      }));
    }, [currentData, cardConfigs, warningThreshold]);

    const lastUpdate = useMemo(() => {
      return currentData?.date ? dateFormatter(currentData.date) : null;
    }, [currentData?.date, dateFormatter]);

    // Internal fetch function
    const fetchStorageData = useCallback(async () => {
      if (!storageUrl || !name || name === 'Login') return;

      setInternalLoading(true);
      setInternalError(undefined);

      try {
        const response = await fetch(`/api/storage/raw/${name}?name=${encodeURIComponent(name)}`, {
          headers: { Accept: 'application/xml' },
          credentials: 'include',
        });

        if (!response.ok) {
          setInternalError(`HTTP ${response.status}`);
          return;
        }

        const xmlString = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlString, 'text/xml');

        // Parse the XML data (simplified version - you'd need the actual parseVospaceXML utility)
        const sizeElement = xml.querySelector('size');
        const quotaElement = xml.querySelector('quota');
        const dateElement = xml.querySelector('date');

        const size = sizeElement
          ? parseInt(sizeElement.textContent || '0', 10)
          : 0;
        const quota = quotaElement
          ? parseInt(quotaElement.textContent || '0', 10)
          : 0;
        const usage = quota > 0 ? (size / quota) * 100 : 0;

        const parsedData: StorageData = {
          size,
          quota,
          date: dateElement?.textContent || new Date().toISOString(),
          usage,
        };

        setInternalData(parsedData);
      } catch (err) {
        console.error('Storage data fetch error:', err);
        setInternalError('Failed to fetch storage data');
      } finally {
        setInternalLoading(false);
      }
    }, [storageUrl, name]);

    const handleRefresh = useCallback(() => {
      if (onRefresh) {
        onRefresh();
      } else if (isAuthenticated && name && name !== 'Login') {
        fetchStorageData();
      }
    }, [onRefresh, isAuthenticated, name, fetchStorageData]);

    const handleHelpClick = useCallback(
      (event: React.MouseEvent<HTMLElement>) => {
        if (helpUrl) {
          window.open(helpUrl, '_blank', 'noopener,noreferrer');
        } else if (helpContent) {
          setHelpAnchorEl(event.currentTarget);
        }
      },
      [helpUrl, helpContent]
    );

    const handleHelpClose = useCallback(() => {
      setHelpAnchorEl(null);
    }, []);

    // Auto-fetch on mount if authenticated
    useEffect(() => {
      if (
        externalData === undefined &&
        !testMode &&
        isAuthenticated &&
        name &&
        name !== 'Login'
      ) {
        fetchStorageData();
      }
    }, [externalData, testMode, isAuthenticated, name, fetchStorageData]);

    return (
      <Paper
        ref={ref}
        elevation={0}
        variant="outlined"
        sx={{
          position: 'relative',
          padding: theme.spacing(2),
          overflow: 'hidden',
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          maxWidth: 600,
          // Better mobile padding
          [theme.breakpoints.down('sm')]: {
            padding: theme.spacing(1.5),
            borderRadius: 2,
          },
        }}
        component="div"
      >
        {/* Error Alert */}
        {currentError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {currentError}
          </Alert>
        )}

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
              flexWrap: 'wrap',
            }}
          >
            <Typography
              variant="h6"
              component="h2"
              sx={{
                [theme.breakpoints.down('sm')]: {
                  fontSize: theme.typography.body1.fontSize,
                  fontWeight: theme.typography.fontWeightBold,
                },
              }}
            >
              {title}
            </Typography>
            {(helpUrl || helpContent) && (
              <Tooltip title="More information">
                <IconButton
                  size="small"
                  onClick={handleHelpClick}
                  sx={{ p: 0.5 }}
                >
                  <HelpOutlineIcon sx={{ fontSize: theme.spacing(2.5) }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          {showRefreshButton && (
            <Tooltip title="Refresh storage">
              <IconButton
                aria-label="refresh storage"
                onClick={handleRefresh}
                disabled={currentLoading}
                size="small"
                sx={{
                  [theme.breakpoints.down('sm')]: {
                    alignSelf: 'flex-end',
                    mt: -1,
                  },
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Progress Bar */}
        {showProgressIndicator && (
          <LinearProgress
            color={currentLoading ? 'primary' : 'success'}
            variant={currentLoading ? 'indeterminate' : 'determinate'}
            value={
              currentLoading
                ? undefined
                : progressPercentage > 0
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
        )}

        {/* Storage Cards or Empty State */}
        {!currentData && !currentLoading ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 4,
              color: theme.palette.text.secondary,
            }}
          >
            <Typography variant="body2">{emptyMessage}</Typography>
          </Box>
        ) : (
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2} direction="column">
              {cardData.map((card, index) => (
                <Grid size={12} key={index}>
                  <StorageCard
                    label={card.label}
                    value={card.value}
                    isLoading={currentLoading}
                    isWarning={card.isWarning}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Last Update Timestamp */}
        {lastUpdate && !currentLoading && (
          <Box
            sx={{
              textAlign: 'center',
              mt: 2,
              color: theme.palette.text.secondary,
            }}
          >
            <Typography variant="caption">
              Last update:{' '}
              <Typography
                component="span"
                variant="caption"
                color="text.primary"
              >
                {lastUpdate}
              </Typography>
            </Typography>
          </Box>
        )}

        {/* Help Popover */}
        {helpContent && (
          <Popover
            open={Boolean(helpAnchorEl)}
            anchorEl={helpAnchorEl}
            onClose={handleHelpClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
          >
            <Box sx={{ p: 2, maxWidth: 300 }}>
              <Typography variant="subtitle2" gutterBottom>
                User Home Storage
              </Typography>
              <Typography variant="body2">{helpContent}</Typography>
            </Box>
          </Popover>
        )}
      </Paper>
    );
  }
);

UserStorageWidgetImpl.displayName = 'UserStorageWidgetImpl';
