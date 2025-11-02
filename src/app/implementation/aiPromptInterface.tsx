'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
} from '@mui/material';
import { Send, Clear, Close } from '@mui/icons-material';
import { AIPromptInterfaceProps } from '@/app/types/AIPromptInterfaceProps';
import { ModelSelector } from '@/app/components/ModelSelector/ModelSelector';
import { ModelDropdown } from '@/app/components/ModelDropdown/ModelDropdown';
import { PromptTextarea } from '@/app/components/PromptTextarea/PromptTextarea';
import { APIKeyInput } from '@/app/components/APIKeyInput/APIKeyInput';
import { ResponseViewer } from '@/app/components/ResponseViewer/ResponseViewer';
import { getDefaultModel } from '@/app/config/modelConfig';

export const AIPromptInterfaceImpl = React.forwardRef<
  HTMLDivElement,
  AIPromptInterfaceProps
>(
  (
    {
      initialPrompt = '',
      initialApiKey = '',
      initialModel = 'openai',
      onSubmit,
      loading = false,
      error,
      className,
      disabled = false,
      ...props
    },
    ref
  ) => {
    interface ConversationItem {
      id: string;
      prompt: string;
      response: string;
      timestamp: Date;
      model: string;
      modelName: string;
    }

    const [prompt, setPrompt] = useState(initialPrompt);
    const [apiKey, setApiKey] = useState(initialApiKey);
    const [selectedModel, setSelectedModel] = useState(initialModel);
    const [selectedModelName, setSelectedModelName] = useState(
      getDefaultModel()?.id || 'gpt-4.1-mini'
    );
    const [formError, setFormError] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [conversations, setConversations] = useState<ConversationItem[]>([]);
    const [activeTab, setActiveTab] = useState(0);

    const validateForm = useCallback(() => {
      if (!prompt.trim()) {
        setFormError('Please enter a prompt');
        return false;
      }
      if (!apiKey.trim()) {
        setFormError('Please enter your API key');
        return false;
      }
      if (!selectedModel) {
        setFormError('Please select a model');
        return false;
      }
      setFormError('');
      return true;
    }, [prompt, apiKey, selectedModel]);

    const handleSubmit = useCallback(async () => {
      if (!validateForm()) return;

      if (onSubmit) {
        onSubmit(prompt.trim(), apiKey.trim(), selectedModel);
      } else {
        // Default behavior: call the API
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
          // MCP returns either data.data.response or data.response
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
      }
    }, [
      prompt,
      apiKey,
      selectedModel,
      selectedModelName,
      onSubmit,
      validateForm,
    ]);

    const handleClear = useCallback(() => {
      setPrompt('');
      setFormError('');
    }, []);

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
        if (formError) setFormError(''); // Clear error when user starts typing
      },
      [formError]
    );

    const handleApiKeyChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setApiKey(event.target.value);
        if (formError) setFormError(''); // Clear error when user starts typing
      },
      [formError]
    );

    const handleModelChange = useCallback(
      (model: string) => {
        setSelectedModel(model);
        if (formError) setFormError(''); // Clear error when user makes a selection
      },
      [formError]
    );

    const handleModelNameChange = useCallback(
      (modelName: string) => {
        setSelectedModelName(modelName);
        if (formError) setFormError(''); // Clear error when user makes a selection
      },
      [formError]
    );

    const canSubmit =
      !loading &&
      !isSubmitting &&
      !disabled &&
      prompt.trim() &&
      apiKey.trim() &&
      selectedModel;

    const isLoading = loading || isSubmitting;

    return (
      <Box
        ref={ref}
        className={className}
        sx={(theme) => ({
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing(3),
          maxWidth: '100%',
          margin: '0 auto',
        })}
        {...props}
      >
        <Paper
          elevation={1}
          sx={(theme) => ({
            padding: theme.spacing(3),
            borderRadius: theme.shape.borderRadius,
          })}
        >
          <Typography
            variant="h5"
            component="h1"
            gutterBottom
            sx={(theme) => ({
              fontWeight: theme.typography.fontWeightMedium,
              color: theme.palette.text.primary,
              marginBottom: theme.spacing(3),
            })}
          >
            AI Prompt Interface
          </Typography>

          <Grid container spacing={3}>
            {/* Configuration Section */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="h6"
                component="h2"
                gutterBottom
                sx={(theme) => ({
                  fontWeight: theme.typography.fontWeightMedium,
                  color: theme.palette.text.primary,
                  marginBottom: theme.spacing(2),
                })}
              >
                Configuration
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <ModelSelector
                  value={selectedModel}
                  onChange={handleModelChange}
                  disabled={disabled || isLoading}
                  helperText="OpenAI is currently the only available vendor"
                />

                <ModelDropdown
                  value={selectedModelName}
                  onChange={handleModelNameChange}
                  disabled={disabled || isLoading}
                  helperText="Select a model (pricing shown per 1M tokens)"
                  required
                />

                <APIKeyInput
                  value={apiKey}
                  onChange={handleApiKeyChange}
                  disabled={disabled || isLoading}
                  placeholder="sk-..."
                  helperText="Your OpenAI API key (not stored locally)"
                  required
                />
              </Box>
            </Grid>

            {/* Prompt Section */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="h6"
                component="h2"
                gutterBottom
                sx={(theme) => ({
                  fontWeight: theme.typography.fontWeightMedium,
                  color: theme.palette.text.primary,
                  marginBottom: theme.spacing(2),
                })}
              >
                Prompt
              </Typography>

              <PromptTextarea
                value={prompt}
                onChange={handlePromptChange}
                disabled={disabled || isLoading}
                placeholder="Try these sample prompts:
• Give me 10 observations of M31
• Give me 10 observations from DRAO collection
• Show me HST observations of the Crab Nebula
• Find JWST data for galaxy NGC 1234
• List all available GEMINI observations of Orion Nebula"
                helperText="Describe what you want the AI to help with regarding CADC data or CANFAR platform"
                maxLength={4000}
                minRows={6}
                maxRows={12}
                required
              />
            </Grid>
          </Grid>

          {/* Error Display */}
          {(formError || error) && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="error">{formError || error}</Alert>
            </Box>
          )}

          {/* Action Buttons */}
          <Box
            sx={(theme) => ({
              display: 'flex',
              justifyContent: 'flex-end',
              gap: theme.spacing(2),
              marginTop: theme.spacing(3),
              paddingTop: theme.spacing(2),
              borderTop: `1px solid ${theme.palette.divider}`,
            })}
          >
            <Button
              variant="outlined"
              startIcon={<Clear />}
              onClick={handleClear}
              disabled={disabled || isLoading || !prompt}
              size="large"
            >
              Clear
            </Button>
            <Button
              variant="contained"
              startIcon={
                isLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <Send />
                )
              }
              onClick={handleSubmit}
              disabled={!canSubmit}
              size="large"
              sx={(theme) => ({
                minWidth: '140px',
                fontWeight: theme.typography.fontWeightMedium,
              })}
            >
              {isLoading ? 'Generating...' : 'Generate'}
            </Button>
          </Box>
        </Paper>

        {/* Response Section with Tabs */}
        {conversations.length > 0 && (
          <Paper
            elevation={1}
            sx={(theme) => ({
              padding: theme.spacing(2),
              borderRadius: theme.shape.borderRadius,
            })}
          >
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
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
                sx={{ pt: 2 }}
              >
                {activeTab === index && (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
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
                      }}
                    >
                      {conv.prompt}
                    </Typography>

                    <ResponseViewer
                      title="AI Response"
                      content={conv.response}
                      loading={false}
                      error={error}
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
      </Box>
    );
  }
);

AIPromptInterfaceImpl.displayName = 'AIPromptInterfaceImpl';
