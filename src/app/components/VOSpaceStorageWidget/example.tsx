/**
 * VOSpace Storage Widget - Usage Examples
 *
 * This file demonstrates various ways to use the VOSpace Storage Widget
 * in your Next.js pages or components.
 */

'use client';

import React from 'react';
import { VOSpaceStorageWidget } from './VOSpaceStorageWidget';
import { Box, Container, Typography } from '@mui/material';

/**
 * Example 1: Basic Usage
 * Minimal configuration with just authentication
 */
export function BasicExample() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <VOSpaceStorageWidget
        isAuthenticated={true}
        username="exampleuser"
      />
    </Container>
  );
}

/**
 * Example 2: With Custom Title and Path
 * Start at a specific directory
 */
export function CustomPathExample() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <VOSpaceStorageWidget
        title="My Project Files"
        isAuthenticated={true}
        username="exampleuser"
        initialPath="home/exampleuser/projects"
      />
    </Container>
  );
}

/**
 * Example 3: With Event Handlers
 * React to file operations
 */
export function WithEventHandlersExample() {
  const handleFileUploaded = (path: string) => {
    console.log('File uploaded to:', path);
    // Show notification, update analytics, etc.
  };

  const handleFolderCreated = (path: string) => {
    console.log('Folder created at:', path);
  };

  const handleNodeDeleted = (path: string) => {
    console.log('Node deleted:', path);
  };

  const handlePathChange = (path: string) => {
    console.log('Navigated to:', path);
    // Update URL, track navigation, etc.
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <VOSpaceStorageWidget
        isAuthenticated={true}
        username="exampleuser"
        onFileUploaded={handleFileUploaded}
        onFolderCreated={handleFolderCreated}
        onNodeDeleted={handleNodeDeleted}
        onPathChange={handlePathChange}
      />
    </Container>
  );
}

/**
 * Example 4: Integrated with Auth Context
 * Use with a real authentication system
 */
export function WithAuthContextExample() {
  // In a real app, get these from your auth context/hook
  const isAuthenticated = true; // e.g., from useAuth()
  const username = 'exampleuser'; // e.g., from useAuth()

  if (!isAuthenticated) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Please log in to access VOSpace storage.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <VOSpaceStorageWidget
        isAuthenticated={isAuthenticated}
        username={username}
      />
    </Container>
  );
}

/**
 * Example 5: Custom Formatters
 * Override default date and file size formatting
 */
export function CustomFormattersExample() {
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '0 bytes';
    const units = ['bytes', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <VOSpaceStorageWidget
        isAuthenticated={true}
        username="exampleuser"
        dateFormatter={formatDate}
        fileSizeFormatter={formatFileSize}
      />
    </Container>
  );
}

/**
 * Example 6: Side-by-Side with Other Widgets
 * Multiple widgets in a dashboard layout
 */
export function DashboardExample() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        My CANFAR Dashboard
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          mt: 3,
        }}
      >
        {/* VOSpace Storage Widget */}
        <Box>
          <VOSpaceStorageWidget
            title="VOSpace Files"
            isAuthenticated={true}
            username="exampleuser"
            maxFiles={50}
          />
        </Box>

        {/* Other widgets can go here */}
        <Box sx={{ p: 3, border: '1px solid #ddd', borderRadius: 2 }}>
          <Typography variant="h6">Other Widget</Typography>
          <Typography variant="body2" color="text.secondary">
            e.g., UserStorageWidget, ActiveSessionsWidget, etc.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}

/**
 * Example 7: Read-Only Mode
 * Hide action buttons for read-only access
 */
export function ReadOnlyExample() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <VOSpaceStorageWidget
        title="Shared Files (Read Only)"
        isAuthenticated={true}
        username="exampleuser"
        initialPath="home/exampleuser/public"
        showActions={false}
        emptyMessage="No shared files available"
      />
    </Container>
  );
}

/**
 * Example 8: With External Refresh Control
 * Control refresh from parent component
 */
export function WithExternalRefreshExample() {
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleExternalRefresh = () => {
    console.log('External refresh triggered');
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 2 }}>
        <button onClick={handleExternalRefresh}>
          External Refresh Button
        </button>
      </Box>

      <VOSpaceStorageWidget
        key={refreshKey}
        isAuthenticated={true}
        username="exampleuser"
        onRefresh={handleExternalRefresh}
      />
    </Container>
  );
}

/**
 * Example 9: Compact Mode
 * Minimal UI for embedding in tight spaces
 */
export function CompactExample() {
  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <VOSpaceStorageWidget
        title="Files"
        isAuthenticated={true}
        username="exampleuser"
        showBreadcrumbs={false}
        maxFiles={20}
      />
    </Container>
  );
}

/**
 * Example 10: Complete Page Implementation
 * Full-featured page with all bells and whistles
 */
export default function VOSpaceStoragePage() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(true);
  const [username, setUsername] = React.useState('exampleuser');

  const handleFileUploaded = (path: string) => {
    console.log('File uploaded successfully:', path);
    // Show success notification
  };

  const handleError = (error: string) => {
    console.error('VOSpace error:', error);
    // Show error notification
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        VOSpace Storage Browser
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Browse and manage your CANFAR VOSpace files. Upload new files, create
        folders, and organize your data.
      </Typography>

      <Box sx={{ mt: 4 }}>
        <VOSpaceStorageWidget
          title="My VOSpace Files"
          isAuthenticated={isAuthenticated}
          username={username}
          showRefreshButton={true}
          showBreadcrumbs={true}
          showActions={true}
          onFileUploaded={handleFileUploaded}
          onFolderCreated={(path) => console.log('Folder created:', path)}
          onNodeDeleted={(path) => console.log('Node deleted:', path)}
          onPathChange={(path) => console.log('Path changed:', path)}
          emptyMessage="This directory is empty. Create a folder or upload a file to get started."
          maxFiles={100}
        />
      </Box>

      <Box sx={{ mt: 4, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Tip: Click on folders to navigate into them. Use the breadcrumbs to
          navigate back up the directory tree.
        </Typography>
      </Box>
    </Container>
  );
}
