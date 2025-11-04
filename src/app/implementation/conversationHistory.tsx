'use client';

import React, { useCallback } from 'react';
import {
  Box,
  Tabs,
  Tab,
  IconButton,
  Typography,
  Paper,
  Button,
  Chip,
  Stack,
} from '@mui/material';
import {
  Close as CloseIcon,
  Code as CodeIcon,
  TextFields as TextIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { ConversationHistoryProps } from '@/app/types/ConversationHistoryProps';

export const ConversationHistoryImpl = React.forwardRef<
  HTMLDivElement,
  ConversationHistoryProps
>(
  (
    {
      conversations,
      activeTab,
      onTabChange,
      onCloseTab,
      onLoadCode,
      maxHeight = '600px',
      showEmptyState = true,
    },
    ref
  ) => {
    const theme = useTheme();

    const handleTabChange = useCallback(
      (_event: React.SyntheticEvent, newValue: number) => {
        onTabChange(newValue);
      },
      [onTabChange]
    );

    const handleCloseTab = useCallback(
      (event: React.MouseEvent, index: number) => {
        event.stopPropagation();
        onCloseTab(index);
      },
      [onCloseTab]
    );

    const handleLoadCode = useCallback(
      (code: string, language: string) => {
        onLoadCode?.(code, language);
      },
      [onLoadCode]
    );

    const handleCopyResponse = useCallback((content: string) => {
      navigator.clipboard.writeText(content);
    }, []);

    if (conversations.length === 0 && showEmptyState) {
      return (
        <Box ref={ref} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Paper
            variant="outlined"
            sx={{
              padding: theme.spacing(4),
              textAlign: 'center',
              minHeight: '300px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
            }}
          >
            <Typography variant="h6" color="text.secondary">
              No Conversations Yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start by entering a prompt below to generate code or get assistance.
            </Typography>
          </Paper>
        </Box>
      );
    }

    return (
      <Box ref={ref} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Tabs */}
        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            maxWidth: '100%',
            overflow: 'hidden',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                minHeight: 48,
                textTransform: 'none',
              },
            }}
          >
            {conversations.map((conv, index) => (
              <Tab
                key={conv.id}
                label={
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      maxWidth: 200,
                    }}
                  >
                    {conv.responseType === 'code' ? (
                      <CodeIcon fontSize="small" />
                    ) : (
                      <TextIcon fontSize="small" />
                    )}
                    <Typography
                      variant="body2"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {conv.prompt.slice(0, 30)}
                      {conv.prompt.length > 30 && '...'}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => handleCloseTab(e, index)}
                      sx={{
                        ml: 'auto',
                        padding: 0.5,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: 'auto',
            maxHeight,
          }}
        >
          {conversations.map((conv, index) => (
            <Box
              key={conv.id}
              role="tabpanel"
              hidden={activeTab !== index}
              sx={{
                padding: theme.spacing(2),
                display: activeTab === index ? 'block' : 'none',
              }}
            >
              {activeTab === index && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Prompt */}
                  <Paper variant="outlined" sx={{ padding: theme.spacing(2) }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="overline" color="text.secondary">
                        Prompt
                      </Typography>
                      <Chip
                        label={conv.model}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={conv.modelName}
                        size="small"
                        variant="outlined"
                      />
                    </Stack>
                    <Typography variant="body2">{conv.prompt}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                      {conv.timestamp.toLocaleString()}
                    </Typography>
                  </Paper>

                  {/* Response */}
                  <Paper variant="outlined" sx={{ padding: theme.spacing(2) }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mb: 1 }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="overline" color="text.secondary">
                          Response
                        </Typography>
                        <Chip
                          icon={
                            conv.responseType === 'code' ? (
                              <CodeIcon fontSize="small" />
                            ) : (
                              <TextIcon fontSize="small" />
                            )
                          }
                          label={conv.responseType}
                          size="small"
                          color={conv.responseType === 'code' ? 'primary' : 'default'}
                        />
                        {conv.code && conv.language && (
                          <Chip
                            label={conv.language.toUpperCase()}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                      <IconButton
                        size="small"
                        onClick={() => handleCopyResponse(conv.response)}
                      >
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Stack>

                    <Box
                      sx={{
                        overflowWrap: 'break-word',
                        wordBreak: 'break-word',
                        '& pre': {
                          backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
                          padding: theme.spacing(2),
                          borderRadius: 1,
                          overflow: 'auto',
                          maxWidth: '100%',
                        },
                        '& code': {
                          fontFamily: 'Monaco, Menlo, "Courier New", monospace',
                          fontSize: '13px',
                        },
                        '& p': {
                          marginTop: 0,
                          marginBottom: theme.spacing(1),
                        },
                      }}
                      dangerouslySetInnerHTML={{ __html: conv.response }}
                    />

                    {/* Load Code Button */}
                    {conv.code && conv.language && onLoadCode && (
                      <Button
                        variant="outlined"
                        startIcon={<CodeIcon />}
                        onClick={() => handleLoadCode(conv.code!, conv.language!)}
                        sx={{ mt: 2 }}
                      >
                        Load Code to Editor
                      </Button>
                    )}
                  </Paper>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    );
  }
);

ConversationHistoryImpl.displayName = 'ConversationHistoryImpl';
