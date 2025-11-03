'use client';

/**
 * VOSpace Utility Hooks Example Component
 *
 * Demonstrates the use of useCreateFolder and useCreateFile hooks
 * for programmatic file/folder creation in VOSpace.
 */

import React, { useState } from 'react';
import { Box, Button, Paper, Typography, TextField, Alert, LinearProgress } from '@mui/material';
import { useCreateFolder, useCreateFile } from '@/lib/hooks/useVOSpace';

interface ProgressStep {
  message: string;
  status: 'pending' | 'success' | 'error';
}

export default function VOSpaceUtilityExample() {
  const createFolder = useCreateFolder();
  const createFile = useCreateFile();

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressStep[]>([]);
  const [username, setUsername] = useState('szautkin');
  const [projectName, setProjectName] = useState('test-project');

  const addProgress = (message: string, status: ProgressStep['status'] = 'success') => {
    setProgress(prev => [...prev, { message, status }]);
  };

  const clearProgress = () => {
    setProgress([]);
  };

  /**
   * Example 1: Create a simple folder
   */
  const handleCreateFolder = async () => {
    setLoading(true);
    clearProgress();

    try {
      addProgress('Creating folder...', 'pending');

      await createFolder({
        path: `home/${username}/test-folder`,
        title: 'Test Folder'
      });

      addProgress('✅ Folder created successfully!', 'success');
    } catch (error) {
      addProgress(
        `❌ Failed to create folder: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Example 2: Create a text file
   */
  const handleCreateTextFile = async () => {
    setLoading(true);
    clearProgress();

    try {
      addProgress('Creating text file...', 'pending');

      await createFile({
        path: `home/${username}`,
        filename: 'hello.txt',
        content: 'Hello from VOSpace utility hooks!',
        contentType: 'text/plain'
      });

      addProgress('✅ Text file created successfully!', 'success');
    } catch (error) {
      addProgress(
        `❌ Failed to create file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Example 3: Create a Python script
   */
  const handleCreatePythonScript = async () => {
    setLoading(true);
    clearProgress();

    const pythonCode = `#!/usr/bin/env python3
"""
Example Python Script
Created by VOSpace utility hooks
"""

def greet(name):
    """Print a greeting message."""
    print(f"Hello, {name}!")

def main():
    """Main function."""
    greet("World")
    print("This script was created programmatically!")

if __name__ == "__main__":
    main()
`;

    try {
      addProgress('Creating Python script...', 'pending');

      await createFile({
        path: `home/${username}`,
        filename: 'example.py',
        content: pythonCode,
        contentType: 'text/x-python'
      });

      addProgress('✅ Python script created successfully!', 'success');
    } catch (error) {
      addProgress(
        `❌ Failed to create script: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Example 4: Create a JSON configuration file
   */
  const handleCreateJSONConfig = async () => {
    setLoading(true);
    clearProgress();

    const config = {
      project: projectName,
      version: '1.0.0',
      created: new Date().toISOString(),
      settings: {
        enabled: true,
        maxFiles: 1000,
        autoSync: false
      }
    };

    try {
      addProgress('Creating JSON config...', 'pending');

      await createFile({
        path: `home/${username}`,
        filename: 'config.json',
        content: JSON.stringify(config, null, 2),
        contentType: 'application/json'
      });

      addProgress('✅ JSON config created successfully!', 'success');
    } catch (error) {
      addProgress(
        `❌ Failed to create config: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Example 5: Initialize a complete project structure
   */
  const handleInitializeProject = async () => {
    setLoading(true);
    clearProgress();

    const basePath = `home/${username}/projects/${projectName}`;

    try {
      // Create folders
      addProgress('Creating project folder structure...', 'pending');

      await createFolder({
        path: basePath,
        title: projectName
      });

      await createFolder({
        path: `${basePath}/data`,
        title: 'Data Files'
      });

      await createFolder({
        path: `${basePath}/scripts`,
        title: 'Scripts'
      });

      await createFolder({
        path: `${basePath}/results`,
        title: 'Results'
      });

      addProgress('✅ Folders created', 'success');

      // Create README
      addProgress('Creating README...', 'pending');

      await createFile({
        path: basePath,
        filename: 'README.md',
        content: `# ${projectName}

## Overview
Project created on ${new Date().toLocaleString()}

## Structure
- \`data/\` - Data files
- \`scripts/\` - Analysis scripts
- \`results/\` - Output files

## Usage
1. Add your data to the \`data/\` folder
2. Run scripts from the \`scripts/\` folder
3. Check results in the \`results/\` folder
`,
        contentType: 'text/markdown'
      });

      addProgress('✅ README created', 'success');

      // Create config
      addProgress('Creating config...', 'pending');

      await createFile({
        path: basePath,
        filename: 'config.json',
        content: JSON.stringify({
          project: projectName,
          created: new Date().toISOString(),
          version: '1.0.0'
        }, null, 2),
        contentType: 'application/json'
      });

      addProgress('✅ Config created', 'success');

      // Create starter script
      addProgress('Creating starter script...', 'pending');

      await createFile({
        path: `${basePath}/scripts`,
        filename: 'start.py',
        content: `#!/usr/bin/env python3
"""
${projectName} - Starter Script
"""

def main():
    print("Welcome to ${projectName}!")
    print("Add your analysis code here.")

if __name__ == "__main__":
    main()
`,
        contentType: 'text/x-python'
      });

      addProgress('✅ Starter script created', 'success');

      addProgress('🎉 Project initialized successfully!', 'success');
    } catch (error) {
      addProgress(
        `❌ Failed to initialize project: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 800, margin: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        VOSpace Utility Hooks Examples
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Demonstrations of useCreateFolder and useCreateFile hooks
      </Typography>

      {/* Configuration */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          size="small"
          fullWidth
        />
        <TextField
          label="Project Name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          size="small"
          fullWidth
        />
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
        <Button
          variant="outlined"
          onClick={handleCreateFolder}
          disabled={loading}
        >
          1. Create Folder
        </Button>

        <Button
          variant="outlined"
          onClick={handleCreateTextFile}
          disabled={loading}
        >
          2. Create Text File
        </Button>

        <Button
          variant="outlined"
          onClick={handleCreatePythonScript}
          disabled={loading}
        >
          3. Create Python Script
        </Button>

        <Button
          variant="outlined"
          onClick={handleCreateJSONConfig}
          disabled={loading}
        >
          4. Create JSON Config
        </Button>

        <Button
          variant="contained"
          onClick={handleInitializeProject}
          disabled={loading}
          color="primary"
        >
          5. Initialize Complete Project
        </Button>
      </Box>

      {/* Loading Indicator */}
      {loading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
        </Box>
      )}

      {/* Progress Log */}
      {progress.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Progress:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {progress.map((step, index) => (
              <Alert
                key={index}
                severity={
                  step.status === 'success'
                    ? 'success'
                    : step.status === 'error'
                    ? 'error'
                    : 'info'
                }
                sx={{ fontSize: '0.875rem' }}
              >
                {step.message}
              </Alert>
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
}
