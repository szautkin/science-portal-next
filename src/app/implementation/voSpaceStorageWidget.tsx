'use client';

/**
 * VOSpace Storage Widget Implementation
 *
 * A comprehensive file browser widget for CANFAR VOSpace storage.
 * Supports browsing directories, uploading files, creating folders, and deleting nodes.
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Paper,
  Typography,
  IconButton,
  Box,
  Alert,
  Skeleton,
  Breadcrumbs,
  Link,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  CreateNewFolder as CreateFolderIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { VOSpaceStorageWidgetProps } from '@/app/types/VOSpaceStorageWidgetProps';
import {
  useVOSpaceNodes,
  useCreateVOSpaceFolder,
  useUploadVOSpaceFile,
  useDeleteVOSpaceNode,
  useDownloadVOSpaceFile,
  VONode,
  VONodeType,
} from '@/lib/hooks/useVOSpace';

/**
 * Default Python "Hello World" content for testing uploads
 */
const DEFAULT_TEST_FILE_CONTENT = `#!/usr/bin/env python
"""Hello World from VOSpace"""

def main():
    print("Hello from VOSpace!")
    print("This file was uploaded through the Science Portal")

if __name__ == "__main__":
    main()
`;

/**
 * Utility function to format file size
 */
const formatFileSize = (bytes?: number | undefined): string => {
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

/**
 * Utility function to format date
 */
const formatDate = (dateString?: string | undefined): string => {
  if (!dateString) return 'Unknown';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Unknown';
  }
};

/**
 * Check if node is a container/folder
 */
const isContainer = (node: VONode): boolean => {
  return node.type === VONodeType.ContainerNode;
};

/**
 * VOSpace Storage Widget Implementation Component
 */
export const VOSpaceStorageWidgetImpl = React.forwardRef<
  HTMLDivElement,
  VOSpaceStorageWidgetProps
>(
  (
    {
      title = 'VOSpace Storage',
      isAuthenticated = false,
      username,
      initialPath,
      isLoading: externalLoading = false,
      errorMessage: externalError,
      onRefresh,
      showRefreshButton = true,
      showBreadcrumbs = true,
      showActions = true,
      emptyMessage = 'No files or folders',
      maxFiles = 1000,
      dateFormatter = formatDate,
      fileSizeFormatter = formatFileSize,
      onFileUploaded,
      onFolderCreated,
      onNodeDeleted,
      onPathChange,
    },
    ref
  ) => {
    const theme = useTheme();

    // Determine initial path
    const defaultPath = useMemo(() => {
      if (initialPath) return initialPath;
      if (username) return `home/${username}`;
      return 'home';
    }, [initialPath, username]);

    // State management
    const [currentPath, setCurrentPath] = useState<string>(defaultPath);

    // Update current path when defaultPath changes (e.g., when username loads after auth)
    useEffect(() => {
      setCurrentPath((prev) => {
        // Only update if we're still at the root 'home' path and we now have a username
        if (prev === 'home' && defaultPath !== 'home' && defaultPath.startsWith('home/')) {
          console.log(`[VOSpace] Updating path from 'home' to '${defaultPath}' after auth`);
          return defaultPath;
        }
        return prev;
      });
    }, [defaultPath]);
    const [createFolderOpen, setCreateFolderOpen] = useState(false);
    const [uploadFileOpen, setUploadFileOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [folderName, setFolderName] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [nodeToDelete, setNodeToDelete] = useState<VONode | null>(null);
    const [folderNameError, setFolderNameError] = useState('');
    const [uploadFileError, setUploadFileError] = useState('');
    const [fileExistsWarning, setFileExistsWarning] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch nodes for current path
    const {
      data: nodes,
      isLoading: nodesLoading,
      isFetching: nodesFetching,
      error: nodesError,
      refetch: refetchNodes,
    } = useVOSpaceNodes(currentPath, isAuthenticated);

    // Mutations
    const { mutate: createFolder, isPending: isCreatingFolder } = useCreateVOSpaceFolder({
      onSuccess: (_, variables) => {
        setCreateFolderOpen(false);
        setFolderName('');
        setFolderNameError('');
        onFolderCreated?.(variables.path);
      },
      onError: (error) => {
        setFolderNameError(error.message);
      },
    });

    const { mutate: uploadFile, isPending: isUploadingFile } = useUploadVOSpaceFile({
      onSuccess: (_, variables) => {
        setUploadFileOpen(false);
        setSelectedFile(null);
        setUploadFileError('');
        setFileExistsWarning(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        onFileUploaded?.(variables.path);
      },
      onError: (error) => {
        setUploadFileError(error.message);
      },
    });

    const { mutate: deleteNode, isPending: isDeletingNode } = useDeleteVOSpaceNode({
      onSuccess: (_, path) => {
        setDeleteConfirmOpen(false);
        setNodeToDelete(null);
        onNodeDeleted?.(path);
      },
    });

    const downloadFile = useDownloadVOSpaceFile();

    // Combined loading state
    const isLoading = externalLoading || nodesLoading || nodesFetching;

    // Combined error state
    const errorMessage = externalError || (nodesError ? nodesError.message : undefined);

    // Parse path into breadcrumb parts
    const pathParts = useMemo(() => {
      if (!currentPath) return [];
      return currentPath.split('/').filter(Boolean);
    }, [currentPath]);

    // Handle navigation
    const handleNavigate = useCallback(
      (path: string) => {
        setCurrentPath(path);
        onPathChange?.(path);
      },
      [onPathChange]
    );

    const handleBreadcrumbClick = useCallback(
      (index: number) => {
        if (index === -1) {
          // Home click
          handleNavigate('');
        } else {
          const newPath = pathParts.slice(0, index + 1).join('/');
          handleNavigate(newPath);
        }
      },
      [pathParts, handleNavigate]
    );

    const handleNodeClick = useCallback(
      (node: VONode) => {
        if (isContainer(node)) {
          // Navigate into folder
          const newPath = currentPath ? `${currentPath}/${node.name}` : node.name;
          handleNavigate(newPath);
        }
      },
      [currentPath, handleNavigate]
    );

    // Create folder handlers
    const handleCreateFolderOpen = useCallback(() => {
      setFolderName('');
      setFolderNameError('');
      setCreateFolderOpen(true);
    }, []);

    const handleCreateFolderClose = useCallback(() => {
      setCreateFolderOpen(false);
      setFolderName('');
      setFolderNameError('');
    }, []);

    const handleCreateFolder = useCallback(() => {
      // Validate folder name
      if (!folderName.trim()) {
        setFolderNameError('Folder name is required');
        return;
      }

      if (folderName.includes('/')) {
        setFolderNameError('Folder name cannot contain slashes');
        return;
      }

      const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
      createFolder({ path: newPath });
    }, [folderName, currentPath, createFolder]);

    // Upload file handlers
    const handleUploadFileOpen = useCallback(() => {
      setSelectedFile(null);
      setUploadFileError('');
      setUploadFileOpen(true);
    }, []);

    const handleUploadFileClose = useCallback(() => {
      setUploadFileOpen(false);
      setSelectedFile(null);
      setUploadFileError('');
      setFileExistsWarning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, []);

    const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        setSelectedFile(file);

        // Check if file with same name already exists
        const fileExists = nodes?.some(node => node.name === file.name);
        setFileExistsWarning(!!fileExists);

        if (fileExists) {
          console.log('[VOSpace Upload] Warning: File with same name already exists:', file.name);
        }
      }
    }, [nodes]);

    const handleUploadFile = useCallback(() => {
      let fileToUpload: File;

      if (selectedFile) {
        fileToUpload = selectedFile;
      } else {
        // Create a test file with default Python content
        const blob = new Blob([DEFAULT_TEST_FILE_CONTENT], { type: 'text/x-python' });
        fileToUpload = new File([blob], 'hello_world.py', { type: 'text/x-python' });
      }

      const filePath = currentPath
        ? `${currentPath}/${fileToUpload.name}`
        : fileToUpload.name;

      uploadFile({ path: filePath, file: fileToUpload });
    }, [selectedFile, currentPath, uploadFile]);

    // Delete handlers
    const handleDeleteClick = useCallback((node: VONode) => {
      setNodeToDelete(node);
      setDeleteConfirmOpen(true);
    }, []);

    const handleDeleteClose = useCallback(() => {
      setDeleteConfirmOpen(false);
      setNodeToDelete(null);
    }, []);

    const handleDeleteConfirm = useCallback(() => {
      if (nodeToDelete) {
        const nodePath = currentPath
          ? `${currentPath}/${nodeToDelete.name}`
          : nodeToDelete.name;
        deleteNode(nodePath);
      }
    }, [nodeToDelete, currentPath, deleteNode]);

    // Download handler
    const handleDownload = useCallback(
      (node: VONode) => {
        const nodePath = currentPath ? `${currentPath}/${node.name}` : node.name;
        downloadFile(nodePath);
      },
      [currentPath, downloadFile]
    );

    // Refresh handler
    const handleRefresh = useCallback(() => {
      if (onRefresh) {
        onRefresh();
      }
      refetchNodes();
    }, [onRefresh, refetchNodes]);

    // Sort nodes: folders first, then files, alphabetically
    const sortedNodes = useMemo(() => {
      if (!nodes) return [];
      return [...nodes]
        .sort((a, b) => {
          const aIsContainer = isContainer(a);
          const bIsContainer = isContainer(b);

          if (aIsContainer && !bIsContainer) return -1;
          if (!aIsContainer && bIsContainer) return 1;

          return a.name.localeCompare(b.name);
        })
        .slice(0, maxFiles);
    }, [nodes, maxFiles]);

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
        {/* Error Alert */}
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
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
                aria-label="refresh storage"
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
          color={(nodesLoading || nodesFetching) ? 'primary' : 'success'}
          variant={(nodesLoading || nodesFetching) ? 'indeterminate' : 'determinate'}
          value={(nodesLoading || nodesFetching) ? undefined : 100}
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

        {/* Breadcrumbs */}
        {showBreadcrumbs && (
          <Box sx={{ mb: 2 }}>
            <Breadcrumbs
              separator={<NavigateNextIcon fontSize="small" />}
              aria-label="breadcrumb"
            >
              <Link
                component="button"
                variant="body2"
                onClick={() => handleBreadcrumbClick(-1)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                <HomeIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
                Root
              </Link>
              {pathParts.map((part, index) => {
                const isLast = index === pathParts.length - 1;
                return (
                  <Link
                    key={index}
                    component="button"
                    variant="body2"
                    onClick={() => handleBreadcrumbClick(index)}
                    sx={{
                      cursor: isLast ? 'default' : 'pointer',
                      textDecoration: 'none',
                      color: isLast ? 'text.primary' : 'primary.main',
                      fontWeight: isLast ? 'bold' : 'normal',
                      '&:hover': {
                        textDecoration: isLast ? 'none' : 'underline',
                      },
                    }}
                  >
                    {part}
                  </Link>
                );
              })}
            </Breadcrumbs>
          </Box>
        )}

        {/* Action Buttons */}
        {showActions && isAuthenticated && (
          <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<CreateFolderIcon />}
              onClick={handleCreateFolderOpen}
              disabled={isLoading}
              size="small"
            >
              Create Folder
            </Button>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={handleUploadFileOpen}
              disabled={isLoading}
              size="small"
            >
              Upload File
            </Button>
          </Box>
        )}

        {/* Files Table */}
        {isLoading ? (
          <Box sx={{ py: 2 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} variant="rectangular" height={40} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : sortedNodes.length === 0 ? (
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
          <TableContainer
            sx={{
              maxHeight: {
                xs: '50vh', // Mobile: 50% of viewport height
                sm: '60vh', // Tablet: 60% of viewport height
                md: 600,    // Desktop: 600px fixed
              },
              overflowY: 'auto',
              overflowX: 'auto',
              // Smooth scrolling
              scrollBehavior: 'smooth',
              // Custom scrollbar styling for better UX
              '&::-webkit-scrollbar': {
                width: '8px',
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                },
              },
              // Add border to indicate scrollable area
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      backgroundColor: theme.palette.background.paper,
                      fontWeight: 'bold',
                      borderBottom: `2px solid ${theme.palette.divider}`,
                    }}
                  >
                    Name
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: theme.palette.background.paper,
                      fontWeight: 'bold',
                      borderBottom: `2px solid ${theme.palette.divider}`,
                    }}
                  >
                    Type
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      backgroundColor: theme.palette.background.paper,
                      fontWeight: 'bold',
                      borderBottom: `2px solid ${theme.palette.divider}`,
                    }}
                  >
                    Size
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: theme.palette.background.paper,
                      fontWeight: 'bold',
                      borderBottom: `2px solid ${theme.palette.divider}`,
                    }}
                  >
                    Modified
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      backgroundColor: theme.palette.background.paper,
                      fontWeight: 'bold',
                      borderBottom: `2px solid ${theme.palette.divider}`,
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedNodes.map((node) => {
                  const nodeIsContainer = isContainer(node);
                  return (
                    <TableRow
                      key={node.uri}
                      hover
                      sx={{
                        cursor: nodeIsContainer ? 'pointer' : 'default',
                        '&:hover': {
                          backgroundColor: nodeIsContainer
                            ? theme.palette.action.hover
                            : 'transparent',
                        },
                      }}
                    >
                      <TableCell
                        onClick={() => nodeIsContainer && handleNodeClick(node)}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        {nodeIsContainer ? (
                          <FolderIcon color="primary" fontSize="small" />
                        ) : (
                          <FileIcon color="action" fontSize="small" />
                        )}
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: nodeIsContainer ? 'bold' : 'normal',
                            color: nodeIsContainer ? 'primary.main' : 'text.primary',
                          }}
                        >
                          {node.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {nodeIsContainer ? 'Folder' : 'File'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="caption" color="text.secondary">
                          {nodeIsContainer ? '-' : fileSizeFormatter(node.size ?? 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {node.modified ? dateFormatter(node.modified) : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          {!nodeIsContainer && (
                            <Tooltip title="Download">
                              <IconButton
                                size="small"
                                onClick={() => handleDownload(node)}
                                aria-label={`download ${node.name}`}
                              >
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {isAuthenticated && (
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteClick(node)}
                                aria-label={`delete ${node.name}`}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Create Folder Dialog */}
        <Dialog
          open={createFolderOpen}
          onClose={handleCreateFolderClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Folder Name"
              type="text"
              fullWidth
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              error={!!folderNameError}
              helperText={folderNameError || 'Enter a name for the new folder'}
              disabled={isCreatingFolder}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isCreatingFolder) {
                  handleCreateFolder();
                }
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCreateFolderClose} disabled={isCreatingFolder}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              variant="contained"
              disabled={isCreatingFolder}
              startIcon={isCreatingFolder ? <CircularProgress size={16} /> : null}
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>

        {/* Upload File Dialog */}
        <Dialog
          open={uploadFileOpen}
          onClose={handleUploadFileClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Upload File</DialogTitle>
          <DialogContent>
            {uploadFileError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {uploadFileError}
              </Alert>
            )}
            {fileExistsWarning && !uploadFileError && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <strong>Warning:</strong> A file with the name "{selectedFile?.name}" already exists.
                Uploading will overwrite the existing file.
              </Alert>
            )}
            <Box sx={{ pt: 1 }}>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                style={{ display: 'block', marginBottom: '16px' }}
                disabled={isUploadingFile}
              />
              {selectedFile && (
                <Typography variant="body2" color="text.secondary">
                  Selected: {selectedFile.name} ({fileSizeFormatter(selectedFile.size)})
                </Typography>
              )}
              {!selectedFile && (
                <Typography variant="body2" color="text.secondary">
                  No file selected. A test Python file will be uploaded.
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleUploadFileClose} disabled={isUploadingFile}>
              Cancel
            </Button>
            <Button
              onClick={handleUploadFile}
              variant="contained"
              disabled={isUploadingFile}
              startIcon={isUploadingFile ? <CircularProgress size={16} /> : <UploadIcon />}
            >
              Upload
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={handleDeleteClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete{' '}
              <strong>{nodeToDelete?.name}</strong>?
              {nodeToDelete && isContainer(nodeToDelete) && (
                <Typography color="error" sx={{ mt: 1 }}>
                  Warning: This will delete the folder and all its contents.
                </Typography>
              )}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteClose} disabled={isDeletingNode}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              variant="contained"
              color="error"
              disabled={isDeletingNode}
              startIcon={isDeletingNode ? <CircularProgress size={16} /> : <DeleteIcon />}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    );
  }
);

VOSpaceStorageWidgetImpl.displayName = 'VOSpaceStorageWidgetImpl';
