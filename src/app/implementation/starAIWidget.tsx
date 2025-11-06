'use client';

/**
 * Star AI Widget Implementation
 *
 * A comprehensive interface for VOSpace operations and Python script execution.
 * Provides three sections:
 * 1. Create Folder - Create new folders in VOSpace
 * 2. Create File - Create new files with various content types
 * 3. Run Python Script - Execute Python scripts via Skaha API
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Paper,
  Typography,
  IconButton,
  Box,
  Alert,
  TextField,
  Button,
  Select,
  MenuItem,
  LinearProgress,
  Tooltip,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Popover,
  Grid,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CreateNewFolder as CreateFolderIcon,
  InsertDriveFile as FileIcon,
  PlayArrow as PlayArrowIcon,
  Key as KeyIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { StarAIWidgetProps } from '@/app/types/StarAIWidgetProps';
import { useCreateFolder, useCreateFile } from '@/lib/hooks/useVOSpace';
import { getAuthHeader } from '@/lib/auth/token-storage';

/**
 * Content type options for file creation with extensions
 */
const CONTENT_TYPES = [
  { value: 'text/plain', label: 'Plain Text', placeholder: 'Enter plain text content...', extension: '.txt' },
  { value: 'text/x-python', label: 'Python', placeholder: 'def hello():\n    print("Hello, World!")', extension: '.py' },
  { value: 'application/json', label: 'JSON', placeholder: '{\n  "key": "value"\n}', extension: '.json' },
  { value: 'text/x-markdown', label: 'Markdown', placeholder: '# Markdown Content\n\nWrite your markdown here...', extension: '.md' },
  { value: 'text/csv', label: 'CSV', placeholder: 'name,value\nitem1,100\nitem2,200', extension: '.csv' },
  { value: 'text/javascript', label: 'JavaScript', placeholder: 'console.log("Hello, World!");', extension: '.js' },
  { value: 'text/html', label: 'HTML', placeholder: '<!DOCTYPE html>\n<html>\n<body>\n  <h1>Hello</h1>\n</body>\n</html>', extension: '.html' },
];

/**
 * Available Harbor registry projects for Python containers
 */
const PYTHON_REGISTRIES = [
  'private-test',
  'szautkin',
  'skaha',
  'canucs',
  'casa-4',
];

/**
 * Get file extension for content type
 */
const getExtensionForContentType = (contentType: string): string => {
  const type = CONTENT_TYPES.find(t => t.value === contentType);
  return type?.extension || '';
};

/**
 * Ensure filename has correct extension
 */
const ensureFileExtension = (filename: string, contentType: string): string => {
  const extension = getExtensionForContentType(contentType);
  if (!extension) return filename;

  // If filename already has the correct extension, return as-is
  if (filename.toLowerCase().endsWith(extension.toLowerCase())) {
    return filename;
  }

  // If filename has a different extension, replace it
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex > 0) {
    return filename.substring(0, lastDotIndex) + extension;
  }

  // Otherwise, add the extension
  return filename + extension;
};

/**
 * Star AI Widget Implementation Component
 */
export const StarAIWidgetImpl = React.forwardRef<
  HTMLDivElement,
  StarAIWidgetProps
>(
  (
    {
      title = 'Star AI',
      isAuthenticated = false,
      username,
      initialPath,
      isLoading: externalLoading = false,
      errorMessage: externalError,
      onRefresh,
      showRefreshButton = true,
      onFolderCreated,
      onFileCreated,
    },
    ref
  ) => {
    const theme = useTheme();

    // Determine default path
    const defaultPath = useMemo(() => {
      if (initialPath) return initialPath;
      if (username) return `home/${username}`;
      return 'home';
    }, [initialPath, username]);

    // State management for folder creation
    const [folderPath, setFolderPath] = useState('');
    const [folderPathError, setFolderPathError] = useState('');
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);

    // State management for file creation
    const [fileLocationPath, setFileLocationPath] = useState(''); // Optional subfolder for file
    const [filename, setFilename] = useState('');
    const [fileContent, setFileContent] = useState('');
    const [contentType, setContentType] = useState('text/plain');
    const [filenameError, setFilenameError] = useState('');
    const [fileContentError, setFileContentError] = useState('');
    const [isCreatingFile, setIsCreatingFile] = useState(false);

    // State management for Python script execution
    const [pythonScriptPath, setPythonScriptPath] = useState('');
    const [pythonRegistry, setPythonRegistry] = useState('private-test');
    const [pythonImageName, setPythonImageName] = useState('python-runner:1.0.0');
    const [callbackEndpoint, setCallbackEndpoint] = useState('');
    const [pythonCores, setPythonCores] = useState(2);
    const [pythonRam, setPythonRam] = useState(4);
    const [registryUsername, setRegistryUsername] = useState('');
    const [registrySecret, setRegistrySecret] = useState('');
    const [credentialsAnchorEl, setCredentialsAnchorEl] = useState<HTMLElement | null>(null);
    const [isExecutingScript, setIsExecutingScript] = useState(false);
    const [executionSessionId, setExecutionSessionId] = useState('');

    // General state
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Hooks
    const createFolder = useCreateFolder();
    const createFile = useCreateFile();

    // Combined loading state
    const isLoading = externalLoading || isCreatingFolder || isCreatingFile || isExecutingScript;

    // Combined error state
    const errorDisplay = externalError || error;

    // Get placeholder for selected content type
    const currentPlaceholder = useMemo(() => {
      const type = CONTENT_TYPES.find(t => t.value === contentType);
      return type?.placeholder || 'Enter file content...';
    }, [contentType]);

    // Handle folder creation
    const handleCreateFolder = useCallback(async () => {
      // Clear previous messages
      setError('');
      setSuccessMessage('');
      setFolderPathError('');

      // Validate folder path
      if (!folderPath.trim()) {
        setFolderPathError('Folder path is required');
        return;
      }

      try {
        setIsCreatingFolder(true);

        // Prepend username path (defaultPath is already home/username)
        const fullPath = `${defaultPath}/${folderPath.trim()}`;

        await createFolder({ path: fullPath });

        setSuccessMessage(`Folder created successfully: ${fullPath}`);
        setFolderPath('');

        // Call success callback
        onFolderCreated?.(fullPath);

        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create folder';
        setError(errorMsg);
        setFolderPathError(errorMsg);
      } finally {
        setIsCreatingFolder(false);
      }
    }, [folderPath, defaultPath, createFolder, onFolderCreated]);

    // Handle file creation
    const handleCreateFile = useCallback(async () => {
      // Clear previous messages
      setError('');
      setSuccessMessage('');
      setFilenameError('');
      setFileContentError('');

      // Validate filename
      if (!filename.trim()) {
        setFilenameError('Filename is required');
        return;
      }

      // Validate content
      if (!fileContent.trim()) {
        setFileContentError('File content is required');
        return;
      }

      try {
        setIsCreatingFile(true);

        // Ensure filename has correct extension based on content type
        const filenameWithExtension = ensureFileExtension(filename.trim(), contentType);

        // Determine base path
        // If fileLocationPath is provided, prepend defaultPath to it; otherwise use defaultPath directly
        const basePath = fileLocationPath.trim()
          ? `${defaultPath}/${fileLocationPath.trim()}`
          : defaultPath;

        await createFile({
          path: basePath,
          filename: filenameWithExtension,
          content: fileContent,
          contentType: contentType,
        });

        const fullPath = `${basePath}/${filenameWithExtension}`;
        setSuccessMessage(`File created successfully: ${fullPath}`);

        // Clear form
        setFileLocationPath('');
        setFilename('');
        setFileContent('');

        // Call success callback
        onFileCreated?.(fullPath);

        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create file';
        setError(errorMsg);
        setFileContentError(errorMsg);
      } finally {
        setIsCreatingFile(false);
      }
    }, [filename, fileContent, contentType, fileLocationPath, defaultPath, createFile, onFileCreated]);

    // Handle content type change
    const handleContentTypeChange = useCallback((event: SelectChangeEvent) => {
      setContentType(event.target.value);
    }, []);

    // Handle Python script execution
    const handleExecuteScript = useCallback(async () => {
      // Clear previous messages
      setError('');
      setSuccessMessage('');

      // Validate script path
      if (!pythonScriptPath.trim()) {
        setError('Script path is required');
        return;
      }

      // Validate container image name
      if (!pythonImageName.trim()) {
        setError('Image name is required');
        return;
      }

      try {
        setIsExecutingScript(true);

        // Generate unique session ID
        const sessionId = `python-${Date.now()}`;

        // Normalize script path - ensure it starts with /arc/
        let normalizedScriptPath = pythonScriptPath.trim();
        if (!normalizedScriptPath.startsWith('/arc/')) {
          // Remove leading slash if present
          if (normalizedScriptPath.startsWith('/')) {
            normalizedScriptPath = normalizedScriptPath.substring(1);
          }
          // Prepend /arc/ if the path doesn't include it
          normalizedScriptPath = `/arc/${normalizedScriptPath}`;
        }

        // Build environment variables for python-runner
        // The updated startup.sh accepts parameters via env vars (more reliable than cmd args)
        const envVars: Record<string, string> = {
          PYTHONUNBUFFERED: '1',
          PYTHONDONTWRITEBYTECODE: '1',
          PYTHON_RUNNER_SESSION_ID: sessionId,
          PYTHON_RUNNER_SCRIPT_PATH: normalizedScriptPath,
        };

        // Add callback endpoint if provided
        if (callbackEndpoint.trim()) {
          envVars.PYTHON_RUNNER_CALLBACK_ENDPOINT = callbackEndpoint.trim();
        }

        // Construct full image path
        const containerImage = `images.canfar.net/${pythonRegistry}/${pythonImageName}`;

        // Launch session via Skaha v0 API (headless endpoint)
        // Python-runner is a batch job container, must use headless type
        const authHeaders = getAuthHeader();
        const response = await fetch('/api/sessions/headless', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          credentials: 'include',
          body: JSON.stringify({
            sessionType: 'headless',
            sessionName: sessionId,
            containerImage: containerImage,
            cores: pythonCores,
            ram: pythonRam,
            gpus: 0,
            env: envVars,
            registryUsername: registryUsername || undefined,
            registrySecret: registrySecret || undefined,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to launch session: ${response.statusText}`);
        }

        const session = await response.json();
        setExecutionSessionId(session.id || sessionId);

        setSuccessMessage(
          `Script execution started! Session ID: ${session.id || sessionId}. ` +
          (callbackEndpoint.trim() ? 'Waiting for callback...' : 'Check logs for results.')
        );

        // Clear form fields (except persistent settings like image, cores, RAM)
        setPythonScriptPath('');
        setCallbackEndpoint('');

        // Clear success message after 10 seconds
        setTimeout(() => setSuccessMessage(''), 10000);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to execute script';
        setError(errorMsg);
      } finally {
        setIsExecutingScript(false);
      }
    }, [pythonScriptPath, pythonRegistry, pythonImageName, callbackEndpoint, pythonCores, pythonRam, registryUsername, registrySecret]);

    // Handle opening credentials popover
    const handleOpenCredentials = useCallback((event: React.MouseEvent<HTMLElement>) => {
      setCredentialsAnchorEl(event.currentTarget);
    }, []);

    // Handle closing credentials popover
    const handleCloseCredentials = useCallback(() => {
      setCredentialsAnchorEl(null);
    }, []);

    // Handle saving credentials
    const handleSaveCredentials = useCallback(() => {
      setCredentialsAnchorEl(null);
    }, []);

    // Check if credentials popover is open
    const credentialsOpen = Boolean(credentialsAnchorEl);

    // Handle refresh
    const handleRefresh = useCallback(() => {
      setError('');
      setSuccessMessage('');
      onRefresh?.();
    }, [onRefresh]);

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
          [theme.breakpoints.down('sm')]: {
            padding: theme.spacing(1.5),
          },
        }}
        component="div"
      >
        {/* Success Alert */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
            {successMessage}
          </Alert>
        )}

        {/* Error Alert */}
        {errorDisplay && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {errorDisplay}
          </Alert>
        )}

        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.spacing(1),
            [theme.breakpoints.down('sm')]: {
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 1,
            },
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

          {showRefreshButton && (
            <Tooltip title="Refresh">
              <IconButton
                aria-label="refresh"
                onClick={handleRefresh}
                disabled={isLoading}
                size="small"
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Loading Progress Bar */}
        <LinearProgress
          color={isLoading ? 'primary' : 'success'}
          variant={isLoading ? 'indeterminate' : 'determinate'}
          value={isLoading ? undefined : 100}
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

        {/* Main Content - Three Column Layout */}
        <Grid container spacing={2}>
          {/* Folder Creation Section */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{
                padding: theme.spacing(2),
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                backgroundColor: theme.palette.background.default,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontSize: theme.typography.body1.fontSize,
                  fontWeight: theme.typography.fontWeightBold,
                }}
              >
                Create Folder
              </Typography>

              <TextField
                fullWidth
                label="Folder Path"
                placeholder="my-folder (created under your home directory)"
                value={folderPath}
                onChange={(e) => {
                  setFolderPath(e.target.value);
                  setFolderPathError('');
                }}
                error={!!folderPathError}
                helperText={folderPathError || `Folder will be created at: ${defaultPath}/[your-folder-name]`}
                disabled={isLoading || !isAuthenticated}
                sx={{ mb: 2 }}
              />

              <Button
                fullWidth
                variant="contained"
                startIcon={<CreateFolderIcon />}
                onClick={handleCreateFolder}
                disabled={isLoading || !isAuthenticated || !folderPath.trim()}
              >
                Create Folder
              </Button>
            </Box>
          </Grid>

          {/* File Creation Section */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{
                padding: theme.spacing(2),
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                backgroundColor: theme.palette.background.default,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontSize: theme.typography.body1.fontSize,
                  fontWeight: theme.typography.fontWeightBold,
                }}
              >
                Create File
              </Typography>

              <TextField
                fullWidth
                label="Location (Optional)"
                placeholder="projects/my-project (leave empty for home directory)"
                value={fileLocationPath}
                onChange={(e) => {
                  setFileLocationPath(e.target.value);
                }}
                helperText={
                  fileLocationPath.trim()
                    ? `File will be created at: ${defaultPath}/${fileLocationPath.trim()}/`
                    : `File will be created at: ${defaultPath}/`
                }
                disabled={isLoading || !isAuthenticated}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Filename"
                placeholder="myfile (extension auto-added)"
                value={filename}
                onChange={(e) => {
                  setFilename(e.target.value);
                  setFilenameError('');
                }}
                error={!!filenameError}
                helperText={filenameError || `Extension (${getExtensionForContentType(contentType)}) will be auto-added`}
                disabled={isLoading || !isAuthenticated}
                sx={{ mb: 2 }}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="content-type-label">Content Type</InputLabel>
                <Select
                  labelId="content-type-label"
                  id="content-type"
                  value={contentType}
                  label="Content Type"
                  onChange={handleContentTypeChange}
                  disabled={isLoading || !isAuthenticated}
                >
                  {CONTENT_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={8}
                label="File Content"
                placeholder={currentPlaceholder}
                value={fileContent}
                onChange={(e) => {
                  setFileContent(e.target.value);
                  setFileContentError('');
                }}
                error={!!fileContentError}
                helperText={fileContentError || 'Enter the file content'}
                disabled={isLoading || !isAuthenticated}
                sx={{ mb: 2, fontFamily: 'monospace' }}
                InputProps={{
                  sx: { fontFamily: 'monospace' },
                }}
              />

              <Button
                fullWidth
                variant="contained"
                startIcon={<FileIcon />}
                onClick={handleCreateFile}
                disabled={isLoading || !isAuthenticated || !filename.trim() || !fileContent.trim()}
              >
                Create File
              </Button>
            </Box>
          </Grid>

          {/* Python Script Execution Section */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{
                padding: theme.spacing(2),
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                backgroundColor: theme.palette.background.default,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontSize: theme.typography.body1.fontSize,
                  fontWeight: theme.typography.fontWeightBold,
                }}
              >
                Run Python Script
              </Typography>

              {/* Script Path Input */}
              <TextField
                fullWidth
                label="Script Path"
                placeholder="/arc/projects/myproject/script.py"
                value={pythonScriptPath}
                onChange={(e) => setPythonScriptPath(e.target.value)}
                helperText="VOSpace path to Python script (/arc/ prefix added automatically if missing)"
                disabled={isLoading || !isAuthenticated}
                sx={{
                  mb: 2,
                  '& .MuiInputBase-input': {
                    fontFamily: 'monospace',
                  },
                }}
              />

              {/* Registry Selection */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="python-registry-label">Harbor Registry Project</InputLabel>
                <Select
                  labelId="python-registry-label"
                  id="python-registry"
                  value={pythonRegistry}
                  label="Harbor Registry Project"
                  onChange={(e: SelectChangeEvent) => setPythonRegistry(e.target.value)}
                  disabled={isLoading || !isAuthenticated}
                >
                  {PYTHON_REGISTRIES.map((registry) => (
                    <MenuItem key={registry} value={registry}>
                      {registry}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Container Image Name Input */}
              <TextField
                fullWidth
                label="Image Name"
                placeholder="python-runner:1.0.0"
                value={pythonImageName}
                onChange={(e) => setPythonImageName(e.target.value)}
                helperText={`Full path: images.canfar.net/${pythonRegistry}/${pythonImageName}`}
                disabled={isLoading || !isAuthenticated}
                sx={{
                  mb: 2,
                  '& .MuiInputBase-input': {
                    fontFamily: 'monospace',
                  },
                }}
              />

              {/* Callback Endpoint (Optional) */}
              <TextField
                fullWidth
                label="Callback Endpoint (Optional)"
                placeholder="https://api.example.com/callback"
                value={callbackEndpoint}
                onChange={(e) => setCallbackEndpoint(e.target.value)}
                helperText="HTTP endpoint for completion notification"
                disabled={isLoading || !isAuthenticated}
                sx={{ mb: 2 }}
              />

              {/* Resource Allocation Grid */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="CPU Cores"
                    value={pythonCores}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (value >= 1 && value <= 8) {
                        setPythonCores(value);
                      }
                    }}
                    inputProps={{
                      min: 1,
                      max: 8,
                      step: 1,
                    }}
                    helperText="1-8 cores"
                    disabled={isLoading || !isAuthenticated}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="RAM (GB)"
                    value={pythonRam}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (value >= 1 && value <= 32) {
                        setPythonRam(value);
                      }
                    }}
                    inputProps={{
                      min: 1,
                      max: 32,
                      step: 1,
                    }}
                    helperText="1-32 GB"
                    disabled={isLoading || !isAuthenticated}
                  />
                </Grid>
              </Grid>

              {/* Registry Credentials Button */}
              <Button
                fullWidth
                variant="outlined"
                startIcon={<KeyIcon />}
                onClick={handleOpenCredentials}
                disabled={isLoading || !isAuthenticated}
                sx={{ mb: 2 }}
              >
                Registry Credentials
              </Button>

              {/* Credentials Popover */}
              <Popover
                open={credentialsOpen}
                anchorEl={credentialsAnchorEl}
                onClose={handleCloseCredentials}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
              >
                <Box sx={{ p: 2, minWidth: 300 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontSize: theme.typography.body1.fontSize }}>
                    Harbor Registry Credentials
                  </Typography>

                  <TextField
                    fullWidth
                    label="Username"
                    value={registryUsername}
                    onChange={(e) => setRegistryUsername(e.target.value)}
                    placeholder="Harbor CLI username"
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    type="password"
                    label="Secret"
                    value={registrySecret}
                    onChange={(e) => setRegistrySecret(e.target.value)}
                    placeholder="Harbor CLI secret"
                    sx={{ mb: 2 }}
                  />

                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button onClick={handleCloseCredentials}>
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSaveCredentials}
                    >
                      Save
                    </Button>
                  </Box>
                </Box>
              </Popover>

              {/* Execute Button */}
              <Button
                fullWidth
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={handleExecuteScript}
                disabled={
                  isLoading ||
                  !isAuthenticated ||
                  !pythonScriptPath.trim() ||
                  !pythonImageName.trim()
                }
              >
                Execute Script
              </Button>

              {/* Display Session ID if available */}
              {executionSessionId && (
                <Typography
                  variant="caption"
                  sx={{
                    mt: 1,
                    display: 'block',
                    fontFamily: 'monospace',
                    color: theme.palette.text.secondary,
                  }}
                >
                  Session: {executionSessionId}
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* Authentication Notice */}
        {!isAuthenticated && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="info">
              Please sign in to create folders and files.
            </Alert>
          </Box>
        )}
      </Paper>
    );
  }
);

StarAIWidgetImpl.displayName = 'StarAIWidgetImpl';
