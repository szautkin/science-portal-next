'use client';

import React, { useState, useCallback, useEffect } from 'react';
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
} from '@mui/material';
import { Settings as SettingsIcon, Send as SendIcon } from '@mui/icons-material';
import { AppBarWithAuth } from '@/app/components/AppBarWithAuth/AppBarWithAuth';
import { ThemeToggle } from '@/app/components/ThemeToggle/ThemeToggle';
import { PromptTextarea } from '@/app/components/PromptTextarea/PromptTextarea';
import { ConfigPopover } from '@/app/components/ConfigPopover/ConfigPopover';
import { CodeEditor } from '@/app/components/CodeEditor/CodeEditor';
import { ExecutionResults } from '@/app/components/ExecutionResults/ExecutionResults';
import { ConversationHistory } from '@/app/components/ConversationHistory/ConversationHistory';
import { AIConfigProvider, useAIConfig } from '@/app/context/AIConfigContext';
import { CodeRunnerProvider, useCodeRunner } from '@/app/context/CodeRunnerContext';
import { useCodeExecution } from '@/lib/hooks/useCodeExecution';
import { useSessionPolling } from '@/lib/hooks/useSessionPolling';
import { useCreateFile, useCreateFolder } from '@/lib/hooks/useVOSpace';
import { useAuthStatus } from '@/lib/hooks/useAuth';
import { getAuthHeader } from '@/lib/auth/token-storage';
import { appBarWithUserMenu, CanfarLogo, SRCNetLogo } from '@/stories/shared/navigation';
import {
  ConversationItem,
  CodeLanguage,
  FILE_EXTENSIONS,
  CONTENT_TYPES,
  StorageInfo,
} from '@/app/types/CodeRunnerTypes';

/**
 * StarAI Runner Interface Component
 */
const StarAIRunnerInterface: React.FC = () => {
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
   * Extract code from response
   */
  const extractCode = useCallback((response: string): { code: string; language: CodeLanguage } | null => {
    // Look for code blocks with language specifier
    const codeBlockRegex = /```(\w+)\n([\s\S]*?)```/g;
    const matches = Array.from(response.matchAll(codeBlockRegex));

    if (matches.length > 0) {
      const [, language, code] = matches[0];
      const normalizedLang = language.toLowerCase();

      // Map to supported languages
      if (normalizedLang === 'python' || normalizedLang === 'py') {
        return { code: code.trim(), language: 'python' };
      } else if (normalizedLang === 'javascript' || normalizedLang === 'js') {
        return { code: code.trim(), language: 'javascript' };
      } else if (normalizedLang === 'bash' || normalizedLang === 'sh' || normalizedLang === 'shell') {
        return { code: code.trim(), language: 'bash' };
      }
    }

    return null;
  }, []);

  /**
   * Handle prompt submission
   */
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFormError('');

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 420000); // 7 minutes

    try {
      const response = await fetch('/api/ai/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          apiKey,
          modelName: selectedModelName,
          systemPrompt: `You are a helpful coding assistant for the CANFAR Science Portal. When generating code:

1. Always wrap code in markdown code blocks with the appropriate language identifier (\`\`\`python, \`\`\`javascript, \`\`\`bash, etc.)

2. CRITICAL LOGGING REQUIREMENTS - ALL code must include:
   - Print statements at the START: "Starting execution..." with script name
   - Print statements for EACH major step: "Step 1: Loading data...", "Step 2: Processing...", etc.
   - Print statements showing progress: "Processed 100 items...", "Analysis 50% complete..."
   - Print any warnings, errors, or important values
   - Print statement at the END: "Execution completed successfully" or "Execution failed: [reason]"
   - These logs are ESSENTIAL for monitoring execution progress

3. CRITICAL FILE OUTPUT REQUIREMENTS:
   - ALWAYS save results to a file with predictable naming: script_XXXXX_results.txt
   - Use the SAME directory as the script (use os.path.dirname(os.path.abspath(__file__)))
   - Write ALL analysis results, findings, and conclusions to this file
   - Print the FULL PATH where results were saved
   - Example Python pattern:
     \`\`\`python
     import os
     import sys

     print("=" * 60)
     print("Starting execution:", __file__)
     print("=" * 60)

     try:
         # Step 1: Setup
         print("Step 1: Initializing...")
         script_dir = os.path.dirname(os.path.abspath(__file__))
         script_filename = os.path.basename(__file__)
         # Remove extension (.py, .js, .sh, etc.)
         script_name = os.path.splitext(script_filename)[0]
         output_file = os.path.join(script_dir, f"{script_name}_results.txt")
         print(f"Script: {__file__}")
         print(f"Script directory: {script_dir}")
         print(f"Script name (no ext): {script_name}")
         print(f"Output will be saved to: {output_file}")

         # Step 2: Your analysis code
         print("Step 2: Running analysis...")
         results = "Your analysis results here"
         print("Analysis complete")

         # Step 3: Save results
         print("Step 3: Saving results...")
         with open(output_file, 'w') as f:
             f.write("=" * 60 + "\\n")
             f.write("ANALYSIS RESULTS\\n")
             f.write("=" * 60 + "\\n\\n")
             f.write(results)
             f.write("\\n\\n" + "=" * 60 + "\\n")
             f.write("END OF RESULTS\\n")
             f.write("=" * 60 + "\\n")

         print(f"✓ Results successfully saved to: {output_file}")
         print("=" * 60)
         print("Execution completed successfully")
         print("=" * 60)

     except Exception as e:
         print("=" * 60)
         print(f"ERROR: Execution failed: {e}")
         print("=" * 60)
         sys.exit(1)
     \`\`\`

4. For astronomy/data analysis tasks:
   - Log each data loading step
   - Print summary statistics as they're calculated
   - Log any plot/figure generation
   - Include all findings in the results file

5. Available packages in the image:
   - Astronomy: astropy, astroquery, photutils (>=1.10), specutils, reproject, regions
   - Data Science: numpy, scipy, pandas, matplotlib, scikit-learn, scikit-image
   - FITS: fitsio, h5py
   - CANFAR platform tools via 'canfar' package

6. IMPORTANT: Use correct imports for photutils (version 1.10+):
   \`\`\`python
   # Correct imports for photutils >= 1.10
   from photutils.detection import DAOStarFinder, IRAFStarFinder
   from photutils.aperture import CircularAperture, CircularAnnulus, aperture_photometry
   from photutils.background import Background2D, MedianBackground
   from photutils.segmentation import detect_sources, deblend_sources

   # Other common imports
   from astropy.io import fits
   from astropy.stats import sigma_clipped_stats, SigmaClip
   from astropy.wcs import WCS
   from astropy.coordinates import SkyCoord
   from astropy import units as u
   \`\`\`

7. CRITICAL: FITS file handling best practices:
   \`\`\`python
   # When opening FITS files, always inspect all HDUs
   # Data might be in HDU[0] (primary) or HDU[1] (first extension)

   with fits.open(fits_file_path) as hdul:
       # Print HDU information
       print(f"FITS file has {len(hdul)} HDU(s)")
       hdul.info()

       # Find the HDU with image data
       data = None
       data_hdu_index = None
       for i, hdu in enumerate(hdul):
           print(f"HDU {i}: {hdu.name}, type={type(hdu)}, shape={getattr(hdu.data, 'shape', 'N/A')}")
           if hdu.data is not None and len(getattr(hdu.data, 'shape', [])) >= 2:
               data = hdu.data
               data_hdu_index = i
               header = hdu.header
               print(f"Found image data in HDU {i} with shape {data.shape}")
               break

       if data is None:
           raise ValueError("No image data found in any HDU")

   # For downloading large FITS files, verify the download
   import os
   import urllib.request

   print(f"Downloading {url}...")
   urllib.request.urlretrieve(url, local_path)
   file_size_mb = os.path.getsize(local_path) / (1024 * 1024)
   print(f"Download complete. File size: {file_size_mb:.2f} MB")

   if file_size_mb < 0.1:
       raise ValueError("Downloaded file is too small, may be corrupted")
   \`\`\`

8. The code runs in a containerized environment with /arc/home/username mounted as home directory`,
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

      // Extract code if present
      const extracted = extractCode(responseContent);

      // Create conversation item
      const newConversation: ConversationItem = {
        id: Date.now().toString(),
        prompt: prompt.trim(),
        response: responseContent,
        responseType: extracted ? 'code' : 'text',
        timestamp: new Date(),
        model: selectedModel,
        modelName: selectedModelName,
        code: extracted?.code,
        language: extracted?.language,
      };

      // Add to conversations
      addConversation(newConversation);

      // If code, load it to editor
      if (extracted) {
        setCurrentCode(extracted.code);
        setCodeLanguage(extracted.language);
        setIsCodeModified(false);
        setStorageInfo(null); // Reset storage info
        setLeftTab('code'); // Switch to code tab
      }

      // Clear prompt
      setPrompt('');
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
    prompt,
    apiKey,
    selectedModel,
    selectedModelName,
    extractCode,
    addConversation,
    setCurrentCode,
    setCodeLanguage,
    setIsCodeModified,
    setStorageInfo,
    addError,
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
          bottom: 180, // Height for fixed prompt area
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

          <Grid container spacing={2} sx={{ flex: 1, minHeight: 0, mt: 0 }}>
            {/* Left Panel - Code/Results */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
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
                    }}
                  >
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
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                <ConversationHistory
                  conversations={conversations}
                  activeTab={activeConversationTab}
                  onTabChange={setActiveConversationTab}
                  onCloseTab={removeConversation}
                  onLoadCode={handleLoadCode}
                  maxHeight="100%"
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
          pb: 3,
          pt: 2,
          '@media print': { display: 'none' },
        }}
      >
        <Container maxWidth="xl">
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError('')}>
              {formError}
            </Alert>
          )}

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
                minRows={3}
                maxRows={6}
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

/**
 * Main Page Component
 */
export default function StarAIRunnerPage() {
  const isOIDCMode = process.env.NEXT_PUBLIC_USE_CANFAR !== 'true';

  return (
    <AIConfigProvider initialModel="openai" initialModelName="gpt-4.1-mini" initialApiKey="">
      <CodeRunnerProvider initialLanguage="python">
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
          {/* AppBar with full navigation */}
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
              wordmark="StarAI Code Runner"
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
            <StarAIRunnerInterface />
          </Box>
        </Box>
      </CodeRunnerProvider>
    </AIConfigProvider>
  );
}
