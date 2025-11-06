'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Alert,
  Paper,
  Grid,
  IconButton,
  Button,
  Tooltip,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from '@mui/material';
import { Settings as SettingsIcon, Send as SendIcon } from '@mui/icons-material';
import { PromptTextarea } from '@/app/components/PromptTextarea/PromptTextarea';
import { ConfigPopover } from '@/app/components/ConfigPopover/ConfigPopover';
import { CodeEditor } from '@/app/components/CodeEditor/CodeEditor';
import { ExecutionResults } from '@/app/components/ExecutionResults/ExecutionResults';
import { ConversationHistory } from '@/app/components/ConversationHistory/ConversationHistory';
import { CodeSnippetsList } from '@/app/components/CodeSnippetsList';
import { useAIConfig } from '@/app/context/AIConfigContext';
import { useCodeRunner } from '@/app/context/CodeRunnerContext';
import { useCodeExecution } from '@/lib/hooks/useCodeExecution';
import { useSessionPolling } from '@/lib/hooks/useSessionPolling';
import { useCreateFile, useCreateFolder } from '@/lib/hooks/useVOSpace';
import { useAuthStatus } from '@/lib/hooks/useAuth';
import { getAuthHeader } from '@/lib/auth/token-storage';
import { STARAI_SYSTEM_PROMPT } from '@/lib/prompts/starai-system-prompt';
import {
  ConversationItem,
  CodeSnippet,
  CodeLanguage,
  FILE_EXTENSIONS,
  CONTENT_TYPES,
  StorageInfo,
} from '@/app/types/CodeRunnerTypes';

/**
 * StarAI Runner Interface Component
 */
export const StarAIRunnerInterface: React.FC = () => {
  const { data: authStatus } = useAuthStatus();
  const { selectedModel, selectedModelName, apiKey } = useAIConfig();
  const {
    currentCode,
    setCurrentCode,
    codeLanguage,
    setCodeLanguage,
    isCodeModified,
    setIsCodeModified,
    isExecuting,
    sessionId,
    executionStatus,
    executionResults,
    executionError,
    setExecutionState,
    storageInfo,
    setStorageInfo,
    isStoring,
    setIsStoring,
    storageError,
    setStorageError,
    conversations,
    activeConversationTab,
    setActiveConversationTab,
    addConversation,
    removeConversation,
    addError,
    registryUsername,
    registrySecret,
    setRegistryAuth,
    containerImage,
    setContainerImage,
    resetContainerImage,
  } = useCodeRunner();

  // Local UI state
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [configPopoverOpen, setConfigPopoverOpen] = useState(false);
  const [configAnchorEl, setConfigAnchorEl] = useState<HTMLElement | null>(null);
  const [leftTab, setLeftTab] = useState<'code' | 'logs' | 'results'>('code');
  const [executionStartTime, setExecutionStartTime] = useState<Date | null>(null);
  const [resultsFileContent, setResultsFileContent] = useState<string>('');
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  // Context inclusion state (default to true)
  const [includeCode, setIncludeCode] = useState(true);
  const [includeLogs, setIncludeLogs] = useState(true);
  const [includeResults, setIncludeResults] = useState(true);
  const [includeConversation, setIncludeConversation] = useState(true);

  // Code snippets state - displayed in LEFT panel
  const [codeSnippets, setCodeSnippets] = useState<CodeSnippet[]>([]);
  const [selectedSnippetId, setSelectedSnippetId] = useState<string | null>(null);

  // Code snippets handlers
  const handleToggleCollapse = useCallback((id: string) => {
    setCodeSnippets(prev =>
      prev.map(snippet =>
        snippet.id === id ? { ...snippet, collapsed: !snippet.collapsed } : snippet
      )
    );
  }, []);

  const handleDeleteSnippet = useCallback((id: string) => {
    setCodeSnippets(prev => prev.filter(snippet => snippet.id !== id));
    if (selectedSnippetId === id) {
      setSelectedSnippetId(null);
    }
  }, [selectedSnippetId]);

  const handleLoadSnippet = useCallback(() => {
    if (!selectedSnippetId) return;
    const snippet = codeSnippets.find(s => s.id === selectedSnippetId);
    if (snippet) {
      setCurrentCode(snippet.code);
      setCodeLanguage(snippet.language);
      setIsCodeModified(false);
      setStorageInfo(null); // Reset storage info since this is a new code
    }
  }, [selectedSnippetId, codeSnippets, setCurrentCode, setCodeLanguage, setIsCodeModified, setStorageInfo]);

  // Hooks
  const { launchSession, cancelExecution: cancelExecutionHook } = useCodeExecution({
    onSuccess: (newSessionId) => {
      console.log('[StarAIRunner] Session launched:', newSessionId);
      setExecutionState({
        sessionId: newSessionId,
        executionStatus: 'polling',
      });
    },
    onError: (error) => {
      console.error('[StarAIRunner] Execution error:', error);
      setExecutionState({
        executionStatus: 'error',
        executionError: error,
        isExecuting: false,
      });
      addError({
        type: 'execution',
        severity: 'error',
        message: error,
        dismissible: true,
      });
    },
  });

  // Session polling
  useSessionPolling({
    sessionId,
    scriptPath: storageInfo?.filePath || null,
    enabled: executionStatus === 'polling',
    onStatusChange: (status) => {
      console.log('[StarAIRunner] Session status:', status);
    },
    onComplete: (results) => {
      console.log('[StarAIRunner] Execution completed');
      setExecutionState({
        executionStatus: 'completed',
        executionResults: results,
        isExecuting: false,
      });
      setLeftTab('logs'); // Show execution logs first

      // Auto-fetch results file after a short delay (to ensure file is written)
      setTimeout(() => {
        fetchResultsFile();
      }, 1000);
    },
    onError: (error) => {
      console.error('[StarAIRunner] Execution error:', error);
      setExecutionState({
        executionStatus: 'error',
        executionError: error,
        isExecuting: false,
      });
      setLeftTab('logs'); // Show error logs
    },
    onTimeout: () => {
      console.warn('[StarAIRunner] Execution timeout');
      setExecutionState({
        executionStatus: 'error',
        executionError: 'Execution timeout (10 minutes)',
        isExecuting: false,
      });
      setLeftTab('logs'); // Show timeout in logs
    },
  });

  // VOSpace file/folder creation hooks
  const createFile = useCreateFile();
  const createFolder = useCreateFolder();

  /**
   * Handle prompt change
   */
  const handlePromptChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setPrompt(event.target.value);
      setFormError('');
    },
    []
  );

  /**
   * Validate form
   */
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

  /**
   * Extract ALL code blocks from response
   */
  const extractAllCode = useCallback((response: string): Array<{ code: string; language: CodeLanguage }> => {
    const codeBlockRegex = /```(\w+)\n([\s\S]*?)```/g;
    const matches = Array.from(response.matchAll(codeBlockRegex));
    const codeBlocks: Array<{ code: string; language: CodeLanguage }> = [];

    for (const match of matches) {
      const [, language, code] = match;
      const normalizedLang = language.toLowerCase();

      // Map to supported languages
      let mappedLang: CodeLanguage | null = null;
      if (normalizedLang === 'python' || normalizedLang === 'py') {
        mappedLang = 'python';
      } else if (normalizedLang === 'javascript' || normalizedLang === 'js') {
        mappedLang = 'javascript';
      } else if (normalizedLang === 'bash' || normalizedLang === 'sh' || normalizedLang === 'shell') {
        mappedLang = 'bash';
      }

      if (mappedLang) {
        codeBlocks.push({ code: code.trim(), language: mappedLang });
      }
    }

    return codeBlocks;
  }, []);

  /**
   * Strip code blocks from text, leaving only explanatory text
   */
  const stripCodeBlocks = useCallback((text: string): string => {
    return text.replace(/```(\w+)\n[\s\S]*?```/g, '').trim();
  }, []);

  /**
   * Build context-enriched prompt
   */
  const buildContextualPrompt = useCallback((userPrompt: string) => {
    let contextualPrompt = userPrompt.trim();

    // Add context sections if selected
    const contextSections: string[] = [];

    // Include conversation history (last 10 messages max to avoid token limits)
    if (includeConversation && conversations.length > 0) {
      const recentConversations = conversations.slice(-10);
      const conversationText = recentConversations
        .map((conv) => {
          const parts: string[] = [];
          if (conv.prompt) {
            parts.push(`User: ${conv.prompt}`);
          }
          if (conv.response) {
            // Strip HTML tags for cleaner context
            const cleanResponse = conv.response.replace(/<[^>]*>/g, '');
            parts.push(`Assistant: ${cleanResponse}`);
          }
          return parts.join('\n');
        })
        .join('\n\n');

      if (conversationText) {
        contextSections.push(`
### Conversation History
${conversationText}
`);
      }
    }

    if (includeCode && currentCode.trim()) {
      contextSections.push(`
### Current Code (${codeLanguage})
\`\`\`${codeLanguage}
${currentCode}
\`\`\`
`);
    }

    if (includeLogs && executionResults.trim()) {
      contextSections.push(`
### Execution Logs
\`\`\`
${executionResults}
\`\`\`
`);
    }

    if (includeResults && resultsFileContent.trim()) {
      contextSections.push(`
### Results File Content
\`\`\`
${resultsFileContent}
\`\`\`
`);
    }

    // Build final prompt with context
    if (contextSections.length > 0) {
      contextualPrompt = `${contextualPrompt}

---

**Context provided:**

${contextSections.join('\n')}`;
    }

    return contextualPrompt;
  }, [includeConversation, includeCode, includeLogs, includeResults, conversations, currentCode, codeLanguage, executionResults, resultsFileContent]);

  /**
   * Handle prompt submission
   */
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFormError('');

    const userPrompt = prompt.trim();

    // Build the contextual prompt with user's input
    const contextualPrompt = buildContextualPrompt(userPrompt);

    // Immediately show user's message in conversation
    const userMessageId = Date.now().toString();
    const userMessage: ConversationItem = {
      id: userMessageId,
      prompt: userPrompt,
      response: '', // Empty for now
      responseType: 'text',
      timestamp: new Date(),
      model: selectedModel,
      modelName: selectedModelName,
    };
    addConversation(userMessage);

    // Clear prompt immediately after adding to conversation
    setPrompt('');

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 420000); // 7 minutes

    try {
      const response = await fetch('/api/ai/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: contextualPrompt,
          apiKey,
          modelName: selectedModelName,
          systemPrompt: STARAI_SYSTEM_PROMPT,
        }),
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const responseContent = data.data?.response || data.response || '';

      // Extract ALL code blocks for LEFT panel
      const codeBlocks = extractAllCode(responseContent);

      // Create code snippets for each code block found
      if (codeBlocks.length > 0) {
        const newSnippets: CodeSnippet[] = codeBlocks.map((block, index) => ({
          id: `${Date.now()}_${index}`,
          code: block.code,
          language: block.language,
          timestamp: new Date(),
          modelName: selectedModelName,
          collapsed: false,
          title: `Code snippet ${index + 1}`,
        }));
        setCodeSnippets(prev => [...prev, ...newSnippets]);

        // Auto-select the first snippet
        if (newSnippets.length > 0) {
          setSelectedSnippetId(newSnippets[0].id);
        }
      }

      // Strip code blocks from response text for RIGHT panel (conversation)
      const textOnly = stripCodeBlocks(responseContent);

      // Add AI response as a new conversation item (text only, no code)
      const aiResponse: ConversationItem = {
        id: Date.now().toString() + '_response',
        prompt: '', // Empty prompt for AI responses
        response: textOnly,
        responseType: 'text', // Always text now, code goes to LEFT panel
        timestamp: new Date(),
        model: selectedModel,
        modelName: selectedModelName,
        // No code/language fields - code is in LEFT panel now
      };

      addConversation(aiResponse);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setFormError('Request timeout. Please try again.');
      } else {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setFormError(errorMessage);
        addError({
          type: 'prompt',
          severity: 'error',
          message: errorMessage,
          dismissible: true,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    validateForm,
    buildContextualPrompt,
    apiKey,
    selectedModel,
    selectedModelName,
    extractAllCode,
    stripCodeBlocks,
    addConversation,
    setCodeSnippets,
    setSelectedSnippetId,
    addError,
    prompt,
  ]);

  /**
   * Handle code storage
   * Returns the storage info if successful, null otherwise
   */
  const handleStoreCode = useCallback(async (): Promise<StorageInfo | null> => {
    if (!currentCode.trim()) {
      setStorageError('No code to store');
      return null;
    }

    if (!authStatus?.authenticated || !authStatus?.user?.username) {
      setStorageError('User not authenticated');
      return null;
    }

    setIsStoring(true);
    setStorageError(null);

    try {
      // Generate filename
      const timestamp = Date.now();
      const extension = FILE_EXTENSIONS[codeLanguage];
      const filename = `starai_script_${timestamp}${extension}`;
      const directory = 'home/' + authStatus.user.username + '/starai';

      console.log('[StarAIRunner] Storing code to:', directory + '/' + filename);

      // Ensure the starai directory exists
      try {
        console.log('[StarAIRunner] Creating directory if needed:', directory);
        await createFolder({
          path: directory,
          title: 'StarAI Code Runner Scripts',
        });
      } catch (folderErr) {
        // Folder might already exist, which is fine
        console.log('[StarAIRunner] Folder creation note:', folderErr instanceof Error ? folderErr.message : 'Folder may already exist');
      }

      // Create file in VOSpace
      await createFile({
        path: directory,
        filename,
        content: currentCode,
        contentType: CONTENT_TYPES[codeLanguage],
      });

      // Build storage info
      const storedPath = '/arc/' + directory + '/' + filename;
      const newStorageInfo: StorageInfo = {
        filePath: storedPath,
        filename,
        directory: '/arc/' + directory,
        timestamp: new Date(),
      };

      // Update storage info state
      setStorageInfo(newStorageInfo);
      setIsCodeModified(false);

      console.log('[StarAIRunner] Code stored successfully:', storedPath);
      return newStorageInfo;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to store code';
      console.error('[StarAIRunner] Storage error:', errorMessage, err);
      setStorageError(errorMessage);
      addError({
        type: 'storage',
        severity: 'error',
        message: errorMessage,
        dismissible: true,
      });
      return null;
    } finally {
      setIsStoring(false);
    }
  }, [
    currentCode,
    codeLanguage,
    authStatus,
    createFile,
    createFolder,
    setStorageInfo,
    setIsCodeModified,
    setStorageError,
    addError,
  ]);

  /**
   * Handle code execution
   */
  const handleRunCode = useCallback(async () => {
    let currentStorageInfo = storageInfo;

    // Store code if not yet stored OR if modified
    if (!currentStorageInfo || isCodeModified) {
      console.log('[StarAIRunner] Storing code before execution...');
      const stored = await handleStoreCode();
      if (!stored) {
        setExecutionState({
          executionError: 'Failed to store code',
          executionStatus: 'error',
        });
        return;
      }
      currentStorageInfo = stored;
    }

    // Ensure we have storage info
    if (!currentStorageInfo?.filePath) {
      setExecutionState({
        executionError: 'Code must be stored before execution',
        executionStatus: 'error',
      });
      return;
    }

    setExecutionState({
      isExecuting: true,
      executionStatus: 'running',
      executionError: null,
      executionResults: '',
    });
    setExecutionStartTime(new Date());

    // Launch session
    await launchSession({
      language: codeLanguage,
      filePath: currentStorageInfo.filePath,
      cores: 2,
      ram: 4,
      registryUsername,
      registrySecret,
      containerImage,
    });
  }, [
    storageInfo,
    isCodeModified,
    handleStoreCode,
    codeLanguage,
    launchSession,
    setExecutionState,
    registryUsername,
    registrySecret,
    containerImage,
  ]);

  /**
   * Handle execution cancellation
   */
  const handleCancelExecution = useCallback(async () => {
    if (sessionId) {
      await cancelExecutionHook(sessionId);
      setExecutionState({
        isExecuting: false,
        executionStatus: 'error',
        executionError: 'Execution canceled by user',
      });
    }
  }, [sessionId, cancelExecutionHook, setExecutionState]);

  /**
   * Handle config button click
   */
  const handleConfigClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setConfigAnchorEl(event.currentTarget);
    setConfigPopoverOpen(true);
  }, []);

  /**
   * Handle config close
   */
  const handleConfigClose = useCallback(() => {
    setConfigPopoverOpen(false);
    setConfigAnchorEl(null);
  }, []);

  /**
   * Fetch results file from VOSpace
   */
  const fetchResultsFile = useCallback(async () => {
    if (!storageInfo?.filePath) {
      console.warn('[StarAIRunner] No storage info available for results file');
      return;
    }

    setIsLoadingResults(true);

    try {
      // Generate results file path
      // storageInfo.filePath has format: /arc/home/username/starai/script.py
      // VOSpace API expects: home/username/starai/script.py (without /arc/ prefix)
      let vospacePath = storageInfo.filePath;
      if (vospacePath.startsWith('/arc/')) {
        vospacePath = vospacePath.substring(5); // Remove '/arc/' prefix
      }

      const pathParts = vospacePath.split('/');
      const scriptFilename = pathParts[pathParts.length - 1];
      const scriptNameWithoutExt = scriptFilename.replace(/\.[^/.]+$/, '');
      const resultsFilename = `${scriptNameWithoutExt}_results.txt`;
      const resultsPath = pathParts.slice(0, -1).concat(resultsFilename).join('/');

      console.log('[StarAIRunner] Fetching results file from VOSpace:', resultsPath);

      const authHeaders = getAuthHeader();
      const response = await fetch(`/api/vospace/transfer?path=${encodeURIComponent(resultsPath)}`, {
        headers: {
          ...authHeaders,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        console.warn('[StarAIRunner] Results file not found:', response.status);
        setResultsFileContent('Results file not found. The script may not have generated results yet.');
        return;
      }

      const content = await response.text();
      setResultsFileContent(content);
      console.log('[StarAIRunner] Results file loaded, length:', content.length);
    } catch (err) {
      console.error('[StarAIRunner] Error fetching results file:', err);
      setResultsFileContent(`Error loading results file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoadingResults(false);
    }
  }, [storageInfo]);

  /**
   * Handle load code from conversation
   */
  const handleLoadCode = useCallback(
    (code: string, language: string) => {
      setCurrentCode(code);
      setCodeLanguage(language as CodeLanguage);
      setIsCodeModified(false);
      setStorageInfo(null); // Reset storage info
      setLeftTab('code'); // Switch to code tab
    },
    [setCurrentCode, setCodeLanguage, setIsCodeModified, setStorageInfo]
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'background.default',
      }}
    >
      {/* Top Section: Main Content (no scroll, flex layout) */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 165, // Reduced height for compact prompt area
          overflow: 'hidden',
          '@media print': {
            position: 'static',
            overflow: 'visible',
            bottom: 'auto',
          },
        }}
      >
        <Container maxWidth="xl" sx={{ py: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flexShrink: 0, mb: 1 }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 0.5 }}>
              StarAI Code Runner
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Generate, store, and execute code with AI assistance
            </Typography>
          </Box>

          <Grid container spacing={2} sx={{ flex: 1, minHeight: 0, mt: 0, overflow: 'hidden' }}>
            {/* Left Panel - Code/Results */}
            <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, height: '100%' }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                  maxHeight: '100%',
                  overflow: 'hidden',
                }}
              >
                <Tabs
                  value={leftTab}
                  onChange={(_, newValue) => setLeftTab(newValue)}
                  sx={{ borderBottom: 1, borderColor: 'divider', mb: 1.5, flexShrink: 0, minHeight: '48px' }}
                >
                  <Tab label="Code" value="code" />
                  <Tab label="Logs" value="logs" />
                  <Tab label="Results" value="results" />
                </Tabs>

                <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  {/* Code Tab Panel - Keep mounted */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: leftTab === 'code' ? 'flex' : 'none',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    {/* Code Snippets List */}
                    <Box sx={{ flex: codeSnippets.length > 0 ? 0.4 : 0, minHeight: 0, display: codeSnippets.length > 0 ? 'flex' : 'none', flexDirection: 'column' }}>
                      <CodeSnippetsList
                        snippets={codeSnippets}
                        selectedSnippetId={selectedSnippetId}
                        onSelectSnippet={setSelectedSnippetId}
                        onLoadSnippet={handleLoadSnippet}
                        onToggleCollapse={handleToggleCollapse}
                        onDeleteSnippet={handleDeleteSnippet}
                      />
                    </Box>

                    {/* Code Editor - Always visible */}
                    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Editor
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              const template = codeLanguage === 'python'
                                ? '# Write your Python code here\n\nprint("Hello, World!")\n'
                                : codeLanguage === 'javascript'
                                ? '// Write your JavaScript code here\n\nconsole.log("Hello, World!");\n'
                                : '# Write your code here\n\necho "Hello, World!"\n';
                              setCurrentCode(template);
                              setIsCodeModified(true);
                              setStorageInfo(null);
                            }}
                            disabled={isExecuting || isStoring}
                          >
                            New Code
                          </Button>
                        </Box>
                      </Box>
                      {!currentCode ? (
                        <Paper
                          variant="outlined"
                          sx={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            gap: 2,
                            p: 4,
                            backgroundColor: 'background.default',
                          }}
                        >
                          <Typography variant="h6" color="text.secondary">
                            No Code Yet
                          </Typography>
                          <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: 400 }}>
                            Click "New Code" to start writing manually, or use the AI prompt below to generate code
                          </Typography>
                        </Paper>
                      ) : (
                        <CodeEditor
                          code={currentCode}
                          language={codeLanguage}
                          onChange={setCurrentCode}
                          onStore={handleStoreCode}
                          onRun={handleRunCode}
                          isStoring={isStoring}
                          isExecuting={isExecuting}
                          isModified={isCodeModified}
                          storedFilePath={storageInfo?.filePath || null}
                          height="100%"
                          registryUsername={registryUsername}
                          registrySecret={registrySecret}
                          containerImage={containerImage}
                          onSettingsChange={(username, secret, image) => {
                            setRegistryAuth(username, secret);
                            setContainerImage(image);
                          }}
                          onResetImage={resetContainerImage}
                        />
                      )}
                    </Box>
                  </Box>

                  {/* Logs Tab Panel - Keep mounted */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: leftTab === 'logs' ? 'flex' : 'none',
                      flexDirection: 'column',
                    }}
                  >
                    <ExecutionResults
                      status={executionStatus}
                      results={executionResults}
                      error={executionError}
                      sessionId={sessionId}
                      startTime={executionStartTime || undefined}
                      onCancel={handleCancelExecution}
                      height="100%"
                    />
                  </Box>

                  {/* Results Tab Panel - Keep mounted */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: leftTab === 'results' ? 'flex' : 'none',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Results file content display */}
                    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {/* Header with Refresh button */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Results File Content
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={fetchResultsFile}
                          disabled={isLoadingResults || !storageInfo}
                          startIcon={isLoadingResults ? <CircularProgress size={16} /> : null}
                        >
                          {isLoadingResults ? 'Loading...' : 'Refresh'}
                        </Button>
                      </Box>

                      {/* Results content area */}
                      <Paper
                        variant="outlined"
                        sx={{
                          flex: 1,
                          minHeight: 0,
                          maxHeight: '100%',
                          overflow: 'auto',
                          padding: 2,
                          backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
                          fontFamily: 'Monaco, Menlo, "Courier New", monospace',
                          fontSize: '13px',
                          lineHeight: 1.6,
                        }}
                      >
                        {isLoadingResults && (
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 2,
                              minHeight: '200px',
                            }}
                          >
                            <CircularProgress />
                            <Typography variant="body2" color="text.secondary">
                              Loading results file...
                            </Typography>
                          </Box>
                        )}

                        {!isLoadingResults && !resultsFileContent && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minHeight: '200px',
                            }}
                          >
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center' }}>
                              No results file loaded. Click "Refresh" to load the results file after execution completes.
                            </Typography>
                          </Box>
                        )}

                        {!isLoadingResults && resultsFileContent && (
                          <Box
                            component="pre"
                            sx={{
                              margin: 0,
                              padding: 0,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              color: 'text.primary',
                            }}
                          >
                            {resultsFileContent}
                          </Box>
                        )}
                      </Paper>
                    </Box>
                  </Box>
                </Box>

                {storageError && (
                  <Alert severity="error" sx={{ mt: 2, flexShrink: 0 }} onClose={() => setStorageError(null)}>
                    {storageError}
                  </Alert>
                )}
              </Paper>
            </Grid>

            {/* Right Panel - Conversation History */}
            <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, height: '100%' }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                  maxHeight: '100%',
                  overflow: 'hidden',
                }}
              >
                <ConversationHistory
                  conversations={conversations}
                  activeTab={activeConversationTab}
                  onTabChange={setActiveConversationTab}
                  onCloseTab={removeConversation}
                />
              </Paper>
            </Grid>
          </Grid>
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
          pb: 1.5,
          pt: 1,
          '@media print': { display: 'none' },
        }}
      >
        <Container maxWidth="xl">
          {formError && (
            <Alert severity="error" sx={{ mb: 1 }} onClose={() => setFormError('')}>
              {formError}
            </Alert>
          )}

          {/* Context Inclusion Checkboxes - Compact Single Row */}
          <Box sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              Add prompt context:
            </Typography>
            <FormGroup row sx={{ gap: 1 }}>
              <FormControlLabel
                sx={{ m: 0 }}
                control={
                  <Checkbox
                    size="small"
                    checked={includeConversation}
                    onChange={(e) => setIncludeConversation(e.target.checked)}
                    disabled={isSubmitting || conversations.length === 0}
                  />
                }
                label={
                  <Typography variant="caption">
                    Conversation {conversations.length === 0 && '(empty)'}
                  </Typography>
                }
              />
              <FormControlLabel
                sx={{ m: 0 }}
                control={
                  <Checkbox
                    size="small"
                    checked={includeCode}
                    onChange={(e) => setIncludeCode(e.target.checked)}
                    disabled={isSubmitting || !currentCode.trim()}
                  />
                }
                label={
                  <Typography variant="caption">
                    Code {!currentCode.trim() && '(empty)'}
                  </Typography>
                }
              />
              <FormControlLabel
                sx={{ m: 0 }}
                control={
                  <Checkbox
                    size="small"
                    checked={includeLogs}
                    onChange={(e) => setIncludeLogs(e.target.checked)}
                    disabled={isSubmitting || !executionResults.trim()}
                  />
                }
                label={
                  <Typography variant="caption">
                    Logs {!executionResults.trim() && '(empty)'}
                  </Typography>
                }
              />
              <FormControlLabel
                sx={{ m: 0 }}
                control={
                  <Checkbox
                    size="small"
                    checked={includeResults}
                    onChange={(e) => setIncludeResults(e.target.checked)}
                    disabled={isSubmitting || !resultsFileContent.trim()}
                  />
                }
                label={
                  <Typography variant="caption">
                    Results {!resultsFileContent.trim() && '(empty)'}
                  </Typography>
                }
              />
            </FormGroup>
          </Box>

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
                placeholder="Describe the code you want to generate (e.g., 'Create a Python script to analyze CSV data')..."
                maxLength={4000}
                minRows={2}
                maxRows={5}
                fullWidth
                aria-label="AI prompt input"
                modelInfo={{
                  vendor: selectedModel,
                  modelName: selectedModelName,
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
            </Box>

            {/* Settings Button */}
            <Tooltip title="Configuration">
              <IconButton
                onClick={handleConfigClick}
                disabled={isSubmitting}
                color="primary"
                sx={{
                  width: 48,
                  height: 48,
                  mb: 0.5,
                }}
                aria-label="Open configuration settings"
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>

            {/* Ask Button */}
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isSubmitting}
              startIcon={
                isSubmitting ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <SendIcon />
                )
              }
              sx={{
                minWidth: 120,
                height: 48,
                mb: 0.5,
              }}
              aria-label="Send prompt"
            >
              {isSubmitting ? 'Asking...' : 'Ask'}
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
};
