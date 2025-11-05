'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Paper,
  Stack,
  Chip,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
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
      maxHeight = '600px',
      showEmptyState = true,
    },
    ref
  ) => {
    const theme = useTheme();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleCopyContent = useCallback((content: string) => {
      navigator.clipboard.writeText(content);
    }, []);

    const handleDeleteConversation = useCallback(
      (index: number) => {
        onCloseTab(index);
      },
      [onCloseTab]
    );

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversations.length]);

    if (conversations.length === 0 && showEmptyState) {
      return (
        <Box ref={ref} sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Conversation
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              flex: 1,
              minHeight: 0,
              padding: theme.spacing(4),
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
            }}
          >
            <Typography variant="h6" color="text.secondary">
              No Messages Yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start by entering a prompt below to generate code or get assistance.
            </Typography>
          </Paper>
        </Box>
      );
    }

    return (
      <Box ref={ref} sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {/* Header */}
        <Box sx={{ flexShrink: 0, mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Conversation</Typography>
          <Typography variant="caption" color="text.secondary">
            {conversations.length} {conversations.length === 1 ? 'message' : 'messages'}
          </Typography>
        </Box>

        {/* Chat Messages Container - Scrollable */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            maxHeight: '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
            pr: 1,
            pb: 1,
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '4px',
              '&:hover': {
                background: 'rgba(0,0,0,0.3)',
              },
            },
          }}
        >
          {conversations.map((conv, index) => (
            <Box key={conv.id} sx={{ mb: index < conversations.length - 1 ? 2 : 0 }}>
              {/* User Prompt Bubble - only show if prompt exists */}
              {conv.prompt && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'flex-start',
                    gap: 1,
                    mb: conv.response ? 2 : 0,
                  }}
                >
                  <Paper
                    elevation={1}
                    sx={{
                      padding: theme.spacing(1.5, 2),
                      maxWidth: '75%',
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                      borderRadius: 2,
                      borderBottomRightRadius: 4,
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {conv.prompt}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block' }}>
                      {conv.timestamp.toLocaleTimeString()}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {/* Assistant Response Bubble - only show if response exists */}
              {conv.response && (
                <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  alignItems: 'flex-start',
                  gap: 1,
                }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    padding: theme.spacing(1.5, 2),
                    maxWidth: '85%',
                    backgroundColor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
                    borderRadius: 2,
                    borderBottomLeftRadius: 4,
                  }}
                >
                  {/* Response Header */}
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Chip
                      label={conv.modelName}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>

                  {/* Response Content - Text only */}
                  <Box
                    sx={{
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                      '& p': {
                        marginTop: 0,
                        marginBottom: theme.spacing(1),
                      },
                    }}
                    dangerouslySetInnerHTML={{ __html: conv.response }}
                  />

                  {/* Action Buttons */}
                  <Stack direction="row" spacing={1} sx={{ mt: 2, alignItems: 'center' }}>
                    <IconButton
                      size="small"
                      onClick={() => handleCopyContent(conv.response)}
                      title="Copy content"
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteConversation(index)}
                      title="Delete message"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Paper>
              </Box>
              )}
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>
      </Box>
    );
  }
);

ConversationHistoryImpl.displayName = 'ConversationHistoryImpl';
