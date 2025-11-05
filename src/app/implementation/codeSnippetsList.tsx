'use client';

import React, { useCallback } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Paper,
  Button,
  Chip,
  Stack,
  Radio,
  Collapse,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { CodeSnippetsListProps } from '@/app/types/CodeSnippetsListProps';

export const CodeSnippetsListImpl = React.forwardRef<
  HTMLDivElement,
  CodeSnippetsListProps
>(
  (
    {
      snippets,
      selectedSnippetId,
      onSelectSnippet,
      onLoadSnippet,
      onToggleCollapse,
      onDeleteSnippet,
      maxHeight = '600px',
    },
    ref
  ) => {
    const theme = useTheme();

    const handleCopyCode = useCallback((code: string) => {
      navigator.clipboard.writeText(code);
    }, []);

    if (snippets.length === 0) {
      return (
        <Box ref={ref} sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Code Snippets
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
            <CodeIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
            <Typography variant="h6" color="text.secondary">
              No Code Snippets Yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Code snippets from AI responses will appear here.
            </Typography>
          </Paper>
        </Box>
      );
    }

    return (
      <Box ref={ref} sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {/* Header */}
        <Box sx={{ flexShrink: 0, mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Code Snippets</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            {selectedSnippetId && onLoadSnippet && (
              <Button
                size="small"
                variant="contained"
                startIcon={<CodeIcon />}
                onClick={onLoadSnippet}
              >
                Load to Editor
              </Button>
            )}
            <Typography variant="caption" color="text.secondary">
              {snippets.length} {snippets.length === 1 ? 'snippet' : 'snippets'}
            </Typography>
          </Stack>
        </Box>

        {/* Snippets Container - Scrollable */}
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
          {snippets.map((snippet, index) => (
            <Paper
              key={snippet.id}
              elevation={2}
              sx={{
                mb: index < snippets.length - 1 ? 2 : 0,
                padding: theme.spacing(1.5),
                backgroundColor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
                borderLeft: 4,
                borderColor: selectedSnippetId === snippet.id ? 'primary.main' : 'divider',
                transition: 'border-color 0.2s',
              }}
            >
              {/* Snippet Header */}
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Radio
                  size="small"
                  checked={selectedSnippetId === snippet.id}
                  onChange={() => onSelectSnippet(snippet.id)}
                  value={snippet.id}
                  title="Select this snippet"
                />
                <Chip
                  label={snippet.language.toUpperCase()}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={snippet.modelName}
                  size="small"
                  variant="outlined"
                />
                <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                  {snippet.timestamp.toLocaleTimeString()}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => onToggleCollapse(snippet.id)}
                  title={snippet.collapsed ? 'Expand' : 'Collapse'}
                >
                  {snippet.collapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                </IconButton>
              </Stack>

              {/* Snippet Title (if provided) */}
              {snippet.title && (
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  {snippet.title}
                </Typography>
              )}

              {/* Code Content - Collapsible */}
              <Collapse in={!snippet.collapsed}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
                    mb: 1,
                  }}
                >
                  <Typography
                    component="pre"
                    variant="body2"
                    sx={{
                      fontFamily: 'Monaco, Menlo, "Courier New", monospace',
                      fontSize: '12px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      margin: 0,
                      overflowX: 'auto',
                    }}
                  >
                    {snippet.code}
                  </Typography>
                </Paper>
              </Collapse>

              {/* Preview when collapsed */}
              {snippet.collapsed && (
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'Monaco, Menlo, "Courier New", monospace',
                    fontSize: '12px',
                    color: 'text.secondary',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    mb: 1,
                  }}
                >
                  {snippet.code.split('\n')[0]}...
                </Typography>
              )}

              {/* Action Buttons */}
              <Stack direction="row" spacing={1}>
                <IconButton
                  size="small"
                  onClick={() => handleCopyCode(snippet.code)}
                  title="Copy code"
                >
                  <CopyIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => onDeleteSnippet(snippet.id)}
                  title="Delete snippet"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Paper>
          ))}
        </Box>
      </Box>
    );
  }
);

CodeSnippetsListImpl.displayName = 'CodeSnippetsListImpl';
