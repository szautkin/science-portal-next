'use client';

import React, { useState, useCallback } from 'react';
import {
  Paper,
  Typography,
  Box,
  IconButton,
  Toolbar,
  CircularProgress,
  Alert,
  Tooltip,
  Snackbar,
} from '@mui/material';
import {
  ContentCopy,
  Download,
  Fullscreen,
  FullscreenExit,
} from '@mui/icons-material';
import { ResponseViewerProps } from '@/app/types/ResponseViewerProps';

export const ResponseViewerImpl = React.forwardRef<
  HTMLDivElement,
  ResponseViewerProps
>(
  (
    {
      content,
      loading = false,
      error,
      title = 'Response',
      showCopyButton = true,
      showDownloadButton = true,
      onCopy,
      onDownload,
      className,
      maxHeight = '600px',
      ...props
    },
    ref
  ) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    const handleCopy = useCallback(async () => {
      if (!content) return;

      try {
        await navigator.clipboard.writeText(content);
        setCopySuccess(true);
        if (onCopy) {
          onCopy();
        }
      } catch (err) {
        console.error('Failed to copy content:', err);
      }
    }, [content, onCopy]);

    const handleDownload = useCallback(() => {
      if (!content) return;

      const blob = new Blob([content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ai-response.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (onDownload) {
        onDownload();
      }
    }, [content, onDownload]);

    const handleFullscreen = () => {
      setIsFullscreen(!isFullscreen);
    };

    const handleCloseCopySnackbar = () => {
      setCopySuccess(false);
    };

    const renderContent = () => {
      if (loading) {
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '200px',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Generating response...
            </Typography>
          </Box>
        );
      }

      if (error) {
        return (
          <Alert severity="error" sx={{ margin: 2 }}>
            <Typography variant="body2">{error}</Typography>
          </Alert>
        );
      }

      if (!content) {
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '200px',
              color: 'text.secondary',
            }}
          >
            <Typography variant="body1">
              No response yet. Submit a prompt to see results here.
            </Typography>
          </Box>
        );
      }

      return (
        <Box
          sx={{
            padding: 2,
            '& > *': {
              maxWidth: '100%',
            },
            // Safe HTML rendering styles
            '& img': {
              maxWidth: '100%',
              height: 'auto',
            },
            '& pre': {
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              backgroundColor: 'action.hover',
              padding: 1,
              borderRadius: 1,
              overflow: 'auto',
            },
            '& code': {
              backgroundColor: 'action.hover',
              padding: '2px 4px',
              borderRadius: '3px',
              fontFamily: 'monospace',
            },
            '& table': {
              borderCollapse: 'collapse',
              width: '100%',
              marginTop: 1,
              marginBottom: 1,
            },
            '& th, & td': {
              border: '1px solid',
              borderColor: 'divider',
              padding: 1,
              textAlign: 'left',
            },
            '& th': {
              backgroundColor: 'action.hover',
              fontWeight: 'bold',
            },
          }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    };

    return (
      <>
        <Paper
          ref={ref}
          className={className}
          elevation={2}
          sx={(theme) => ({
            borderRadius: theme.shape.borderRadius,
            overflow: 'hidden',
            ...(isFullscreen && {
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: theme.zIndex.modal,
              borderRadius: 0,
            }),
            '@media print': {
              position: 'static !important',
              height: 'auto !important',
              overflow: 'visible !important',
              boxShadow: 'none !important',
              borderRadius: '0 !important',
              pageBreakInside: 'avoid',
            },
          })}
          {...props}
        >
          <Toolbar
            variant="dense"
            sx={(theme) => ({
              backgroundColor: theme.palette.action.hover,
              borderBottom: `1px solid ${theme.palette.divider}`,
              minHeight: '48px !important',
            })}
          >
            <Typography
              variant="h6"
              component="h2"
              sx={{ flexGrow: 1, fontSize: '1rem', fontWeight: 600 }}
            >
              {title}
            </Typography>

            {showCopyButton && content && (
              <Tooltip title="Copy to clipboard">
                <IconButton
                  size="small"
                  onClick={handleCopy}
                  disabled={loading}
                  sx={{ marginRight: 0.5 }}
                >
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {showDownloadButton && content && (
              <Tooltip title="Download as HTML">
                <IconButton
                  size="small"
                  onClick={handleDownload}
                  disabled={loading}
                  sx={{ marginRight: 0.5 }}
                >
                  <Download fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
              <IconButton size="small" onClick={handleFullscreen}>
                {isFullscreen ? (
                  <FullscreenExit fontSize="small" />
                ) : (
                  <Fullscreen fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Toolbar>

          <Box
            sx={{
              maxHeight: isFullscreen ? 'calc(100vh - 48px)' : maxHeight,
              overflow: 'auto',
              backgroundColor: 'background.paper',
              '@media print': {
                maxHeight: 'none !important',
                overflow: 'visible !important',
                height: 'auto !important',
              },
            }}
          >
            {renderContent()}
          </Box>
        </Paper>

        <Snackbar
          open={copySuccess}
          autoHideDuration={2000}
          onClose={handleCloseCopySnackbar}
          message="Content copied to clipboard"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </>
    );
  }
);

ResponseViewerImpl.displayName = 'ResponseViewerImpl';
