'use client';

import React, { useState, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Send, Settings, Close } from '@mui/icons-material';
import { AppBarWithAuth } from '@/app/components/AppBarWithAuth/AppBarWithAuth';
import { ThemeToggle } from '@/app/components/ThemeToggle/ThemeToggle';
import { PromptTextarea } from '@/app/components/PromptTextarea/PromptTextarea';
import { ResponseViewer } from '@/app/components/ResponseViewer/ResponseViewer';
import { ConfigPopover } from '@/app/components/ConfigPopover/ConfigPopover';
import { AIConfigProvider, useAIConfig } from '@/app/context/AIConfigContext';
import { appBarWithUserMenu, CanfarLogo, SRCNetLogo } from '@/stories/shared/navigation';
import { useAuthStatus } from '@/lib/hooks/useAuth';
import { getDefaultModel } from '@/app/config/modelConfig';

/**
 * Conversation item type
 */
interface ConversationItem {
  id: string;
  prompt: string;
  response: string;
  timestamp: Date;
  model: string;
  modelName: string;
}

/**
 * StarAI Interface Component
 *
 * The main interface component that handles user interactions,
 * API calls, and displays conversation results.
 */
function StarAIInterface() {
  const {
    selectedModel,
    selectedModelName,
    apiKey,
  } = useAIConfig();

  const [prompt, setPrompt] = useState('');
  const [formError, setFormError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [configAnchorEl, setConfigAnchorEl] = useState<HTMLElement | null>(null);

  const configPopoverOpen = Boolean(configAnchorEl);

  const validateForm = useCallback(() => {
    if (!prompt.trim()) {
      setFormError('Please enter a prompt');
      return false;
    }
    if (!apiKey.trim()) {
      setFormError('Please enter your API key in the settings');
      return false;
    }
    if (!selectedModel) {
      setFormError('Please select a model in the settings');
      return false;
    }
    setFormError('');
    return true;
  }, [prompt, apiKey, selectedModel]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFormError('');

    try {
      // Use MCP endpoint for StarAI queries with extended timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 420000); // 7 minutes timeout

      const res = await fetch('/api/ai/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          apiKey: apiKey.trim(),
          model: selectedModel,
          modelName: selectedModelName,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error?.message || 'Failed to generate response'
        );
      }

      // Set the response with HTML content from MCP
      const responseContent = data.data?.response || data.response || '';

      // Add to conversations array
      const newConversation: ConversationItem = {
        id: Date.now().toString(),
        prompt: prompt.trim(),
        response: responseContent,
        timestamp: new Date(),
        model: selectedModel,
        modelName: selectedModelName,
      };

      setConversations((prev) => {
        const updated = [...prev, newConversation];
        setActiveTab(updated.length - 1); // Set to the new tab
        return updated;
      });
      setPrompt(''); // Clear prompt for next query
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setFormError(
          'Request timed out after 7 minutes. The query may be complex. Please try a simpler query or try again later.'
        );
      } else {
        setFormError(
          err instanceof Error ? err.message : 'Failed to submit prompt'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    prompt,
    apiKey,
    selectedModel,
    selectedModelName,
    validateForm,
  ]);

  const handleTabChange = useCallback(
    (event: React.SyntheticEvent, newValue: number) => {
      setActiveTab(newValue);
    },
    []
  );

  const handleCloseTab = useCallback(
    (index: number) => {
      const newConversations = conversations.filter((_, i) => i !== index);
      setConversations(newConversations);

      // Adjust active tab if needed
      if (activeTab >= index && activeTab > 0) {
        setActiveTab(activeTab - 1);
      } else if (newConversations.length === 0) {
        setActiveTab(0);
      }
    },
    [conversations, activeTab]
  );

  const handlePromptChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setPrompt(event.target.value);
      if (formError) setFormError('');
    },
    [formError]
  );

  const handleConfigOpen = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setConfigAnchorEl(event.currentTarget);
    },
    []
  );

  const handleConfigClose = useCallback(() => {
    setConfigAnchorEl(null);
  }, []);

  const canSubmit =
    !isSubmitting &&
    prompt.trim() &&
    apiKey.trim() &&
    selectedModel;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'background.default',
        '@media print': {
          height: 'auto',
          backgroundColor: '#ffffff',
        },
      }}
    >
      {/* Top Section: Results Area (fixed with internal scroll) */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 180, // Height for fixed prompt area
          overflow: 'auto',
          '@media print': {
            position: 'static',
            overflow: 'visible',
            bottom: 'auto',
          },
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            py: 2,
            '@media print': {
              maxWidth: 'none !important',
              padding: '0 !important',
              margin: '0 !important',
            },
          }}
        >
          {conversations.length === 0 ? (
            <Box
              sx={{
                '@media print': {
                  display: 'none !important',
                },
              }}
            >
              {/* Header Section - Top Center */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  pt: 3,
                  pb: 4,
                }}
              >
                <Typography
                  variant="h4"
                  component="h1"
                  gutterBottom
                  sx={{ fontWeight: 'medium' }}
                >
                  StarAI
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  align="center"
                  sx={{ maxWidth: 600 }}
                >
                  Leverage StarAI to explore and analyze astronomical data from the
                  Canadian Astronomy Data Centre (CADC) and interact with the CANFAR
                  platform. Query datasets, generate analysis scripts, and get
                  assistance with data processing workflows.
                </Typography>
              </Box>

              {/* Placeholder Component - Empty Space */}
              <Paper
                elevation={0}
                sx={(theme) => ({
                  borderRadius: theme.shape.borderRadius,
                  border: `2px dashed ${theme.palette.divider}`,
                  backgroundColor: 'transparent',
                  minHeight: 400,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 2,
                  p: 4,
                })}
              >
                <Typography
                  variant="h6"
                  color="text.secondary"
                  align="center"
                  sx={{ fontWeight: 'normal' }}
                >
                  Your conversations will appear here
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                  sx={{ maxWidth: 500 }}
                >
                  Configure your AI settings using the{' '}
                  <Settings
                    fontSize="small"
                    sx={{ verticalAlign: 'middle', mx: 0.5 }}
                  />{' '}
                  icon below, then enter your prompt to get started.
                </Typography>
              </Paper>
            </Box>
          ) : (
            <Paper
              elevation={1}
              sx={(theme) => ({
                borderRadius: theme.shape.borderRadius,
                overflow: 'hidden',
                '@media print': {
                  boxShadow: 'none !important',
                  border: 'none !important',
                  borderRadius: '0 !important',
                  overflow: 'visible !important',
                },
              })}
            >
              <Box
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  '@media print': {
                    display: 'none !important',
                  },
                }}
              >
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                  aria-label="conversation tabs"
                >
                  {conversations.map((conv, index) => (
                    <Tab
                      key={conv.id}
                      label={
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{ maxWidth: 150 }}
                          >
                            {conv.prompt.substring(0, 30)}...
                          </Typography>
                          {conversations.length > 1 && (
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCloseTab(index);
                              }}
                              sx={{ p: 0.5 }}
                              aria-label={`Close tab ${index + 1}`}
                            >
                              <Close fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      }
                      sx={{ minHeight: 48 }}
                    />
                  ))}
                </Tabs>
              </Box>

              {conversations.map((conv, index) => (
                <Box
                  key={conv.id}
                  role="tabpanel"
                  hidden={activeTab !== index}
                  sx={{
                    p: 2,
                    '@media print': {
                      display: activeTab === index ? 'block !important' : 'none !important',
                      padding: '2cm !important',
                      pageBreakBefore: index > 0 ? 'always' : 'auto',
                    },
                  }}
                  id={`conversation-tabpanel-${index}`}
                  aria-labelledby={`conversation-tab-${index}`}
                >
                  {activeTab === index && (
                    <Box
                      sx={{
                        '@media print': {
                          '& > *': {
                            pageBreakInside: 'avoid',
                          },
                        },
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                        sx={{
                          '@media print': {
                            color: '#000000 !important',
                            fontSize: '14px !important',
                            fontWeight: 600,
                            marginBottom: '8px !important',
                          },
                        }}
                      >
                        Prompt ({conv.model} - {conv.modelName}):
                      </Typography>
                      <Typography
                        variant="body2"
                        paragraph
                        sx={{
                          mb: 2,
                          p: 2,
                          bgcolor: 'background.paper',
                          borderRadius: 1,
                          '@media print': {
                            backgroundColor: '#f5f5f5 !important',
                            padding: '12px !important',
                            marginBottom: '16px !important',
                            border: '1px solid #e0e0e0 !important',
                            borderRadius: '4px !important',
                            fontSize: '12px !important',
                            color: '#000000 !important',
                          },
                        }}
                      >
                        {conv.prompt}
                      </Typography>

                      <ResponseViewer
                        title="AI Response"
                        content={conv.response}
                        loading={false}
                        showCopyButton={true}
                        showDownloadButton={true}
                        maxHeight="60vh"
                      />
                    </Box>
                  )}
                </Box>
              ))}
            </Paper>
          )}
        </Container>
      </Box>

      {/* Bottom Section: Prompt Input Area (fixed at bottom) */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'background.default',
          borderTop: 1,
          borderColor: 'divider',
          pb: 3,
          pt: 2,
          '@media print': {
            display: 'none !important',
          },
        }}
      >
        <Container maxWidth="lg">
          {/* Error Display */}
          {formError && (
            <Box sx={{ mb: 2 }}>
              <Alert severity="error">{formError}</Alert>
            </Box>
          )}

          {/* Prompt Input Row */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 1.5,
            }}
          >
            {/* Prompt Textarea */}
            <Box sx={{ flex: 1 }}>
              <PromptTextarea
                value={prompt}
                onChange={handlePromptChange}
                disabled={isSubmitting}
                placeholder="Try these sample prompts:
• Give me 10 observations of M31
• Give me 10 observations from DRAO collection
• Show me HST observations of the Crab Nebula
• Find JWST data for galaxy NGC 1234
• List all available GEMINI observations of Orion Nebula"
                maxLength={4000}
                minRows={3}
                maxRows={6}
                fullWidth
                aria-label="AI prompt input"
                modelInfo={{
                  vendor: selectedModel,
                  modelName: selectedModelName,
                }}
              />
            </Box>

            {/* Settings Button */}
            <Tooltip title="Configuration">
              <IconButton
                onClick={handleConfigOpen}
                disabled={isSubmitting}
                color="primary"
                sx={{
                  width: 48,
                  height: 48,
                  mb: 0.5,
                }}
                aria-label="Open configuration settings"
              >
                <Settings />
              </IconButton>
            </Tooltip>

            {/* Send Button */}
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!canSubmit}
              startIcon={
                isSubmitting ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <Send />
                )
              }
              sx={{
                minWidth: 120,
                height: 48,
                mb: 0.5,
              }}
              aria-label="Send prompt"
            >
              {isSubmitting ? 'Sending...' : 'Send'}
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Config Popover */}
      <ConfigPopover
        open={configPopoverOpen}
        onClose={handleConfigClose}
        anchorEl={configAnchorEl}
        disabled={isSubmitting}
      />
    </Box>
  );
}

/**
 * StarAI Page Component
 *
 * Main page component that wraps the StarAI interface with
 * necessary providers and layout components.
 */
export default function StarAIPage() {
  const isOIDCMode = process.env.NEXT_PUBLIC_USE_CANFAR !== 'true';
  const defaultModel = getDefaultModel();

  return (
    <AIConfigProvider
      initialModel="openai"
      initialModelName={defaultModel?.id || 'gpt-4.1-mini'}
      initialApiKey=""
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          backgroundColor: 'background.default',
          '@media print': {
            minHeight: 'auto',
            backgroundColor: '#ffffff',
          },
        }}
      >
        {/* AppBar with StarAI wordmark */}
        <Box
          sx={{
            '@media print': {
              display: 'none !important',
            },
          }}
        >
          <AppBarWithAuth
            variant="surface"
            position="fixed"
            elevation={0}
            wordmark="StarAI"
            logoHref="/"
            logo={isOIDCMode ? <SRCNetLogo /> : <CanfarLogo />}
            links={isOIDCMode ? [] : appBarWithUserMenu.links}
            accountButton={<ThemeToggle size="md" />}
            showLoginButton={true}
          />
        </Box>

        {/* Main content area */}
        <Box
          component="main"
          sx={{
            position: 'fixed',
            top: 64,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden',
            '@media print': {
              position: 'static',
              overflow: 'visible',
            },
          }}
        >
          <StarAIInterface />
        </Box>

      </Box>
    </AIConfigProvider>
  );
}
