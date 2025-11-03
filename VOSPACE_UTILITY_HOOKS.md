# VOSpace Utility Hooks

Two new utility hooks for programmatically creating folders and files in VOSpace.

## Installation

These hooks are already included in `src/lib/hooks/useVOSpace.ts`. Simply import them:

```typescript
import { useCreateFolder, useCreateFile } from '@/lib/hooks/useVOSpace';
```

---

## 1. useCreateFolder

Create folders programmatically in VOSpace.

### Signature

```typescript
function useCreateFolder(): (params: {
  path: string;
  title?: string
}) => Promise<void>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | `string` | Yes | Full path to the folder (e.g., `home/username/my-folder`) |
| `title` | `string` | No | Optional descriptive title for the folder |

### Basic Usage

```tsx
import { useCreateFolder } from '@/lib/hooks/useVOSpace';

function MyComponent() {
  const createFolder = useCreateFolder();

  const handleCreateFolder = async () => {
    try {
      await createFolder({
        path: 'home/username/my-new-folder',
        title: 'My Project Folder'
      });
      console.log('Folder created successfully!');
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  return (
    <button onClick={handleCreateFolder}>
      Create Folder
    </button>
  );
}
```

### Advanced Example: Create Nested Folders

```tsx
import { useCreateFolder } from '@/lib/hooks/useVOSpace';

function CreateProjectStructure() {
  const createFolder = useCreateFolder();

  const createProjectFolders = async (username: string, projectName: string) => {
    const basePath = `home/${username}/projects/${projectName}`;

    try {
      // Create main project folder
      await createFolder({
        path: basePath,
        title: `${projectName} Project`
      });

      // Create subdirectories
      await createFolder({
        path: `${basePath}/data`,
        title: 'Data Files'
      });

      await createFolder({
        path: `${basePath}/scripts`,
        title: 'Analysis Scripts'
      });

      await createFolder({
        path: `${basePath}/results`,
        title: 'Results and Outputs'
      });

      console.log('Project structure created successfully!');
    } catch (error) {
      console.error('Failed to create project structure:', error);
      throw error;
    }
  };

  return (
    <button onClick={() => createProjectFolders('szautkin', 'astronomy-analysis')}>
      Create Project Structure
    </button>
  );
}
```

---

## 2. useCreateFile

Create files with content programmatically in VOSpace.

### Signature

```typescript
function useCreateFile(): (params: {
  path: string;
  filename: string;
  content: string | Buffer;
  contentType?: string;
}) => Promise<void>
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `path` | `string` | Yes | - | Directory path where file will be created |
| `filename` | `string` | Yes | - | Name of the file (including extension) |
| `content` | `string \| Buffer` | Yes | - | File content as string or Buffer |
| `contentType` | `string` | No | `'application/octet-stream'` | MIME type of the file |

### Common Content Types

| File Type | Content Type |
|-----------|--------------|
| Text | `'text/plain'` |
| Python | `'text/x-python'` |
| JavaScript | `'text/javascript'` |
| JSON | `'application/json'` |
| CSV | `'text/csv'` |
| HTML | `'text/html'` |
| Markdown | `'text/markdown'` |
| FITS (Astronomy) | `'application/fits'` |

### Basic Usage: Create Text File

```tsx
import { useCreateFile } from '@/lib/hooks/useVOSpace';

function MyComponent() {
  const createFile = useCreateFile();

  const handleCreateFile = async () => {
    try {
      await createFile({
        path: 'home/username',
        filename: 'hello.txt',
        content: 'Hello, World!',
        contentType: 'text/plain'
      });
      console.log('File created successfully!');
    } catch (error) {
      console.error('Failed to create file:', error);
    }
  };

  return (
    <button onClick={handleCreateFile}>
      Create Text File
    </button>
  );
}
```

### Example: Create Python Script

```tsx
import { useCreateFile } from '@/lib/hooks/useVOSpace';

function CreatePythonScript() {
  const createFile = useCreateFile();

  const createAnalysisScript = async () => {
    const pythonCode = `#!/usr/bin/env python3
"""
Data Analysis Script
"""

import numpy as np
import pandas as pd

def analyze_data(filename):
    """Load and analyze data from file."""
    data = pd.read_csv(filename)

    print(f"Dataset shape: {data.shape}")
    print(f"\\nSummary statistics:")
    print(data.describe())

    return data

if __name__ == "__main__":
    result = analyze_data("data.csv")
    print("\\nAnalysis complete!")
`;

    try {
      await createFile({
        path: 'home/username/scripts',
        filename: 'analyze.py',
        content: pythonCode,
        contentType: 'text/x-python'
      });
      console.log('Python script created successfully!');
    } catch (error) {
      console.error('Failed to create script:', error);
    }
  };

  return (
    <button onClick={createAnalysisScript}>
      Create Analysis Script
    </button>
  );
}
```

### Example: Create JSON Configuration

```tsx
import { useCreateFile } from '@/lib/hooks/useVOSpace';

function CreateConfig() {
  const createFile = useCreateFile();

  const createConfigFile = async () => {
    const config = {
      project: "Astronomy Analysis",
      version: "1.0.0",
      settings: {
        telescope: "JWST",
        instrument: "NIRCam",
        filters: ["F090W", "F150W", "F200W"],
        exposure_time: 1000,
        output_format: "FITS"
      },
      paths: {
        data: "./data",
        output: "./results",
        cache: "./cache"
      }
    };

    try {
      await createFile({
        path: 'home/username/projects/jwst-analysis',
        filename: 'config.json',
        content: JSON.stringify(config, null, 2),
        contentType: 'application/json'
      });
      console.log('Config file created successfully!');
    } catch (error) {
      console.error('Failed to create config:', error);
    }
  };

  return (
    <button onClick={createConfigFile}>
      Create Config
    </button>
  );
}
```

### Example: Create CSV Data File

```tsx
import { useCreateFile } from '@/lib/hooks/useVOSpace';

function CreateCSVData() {
  const createFile = useCreateFile();

  const createDataFile = async () => {
    const csvData = `object_id,ra,dec,magnitude,redshift
NGC1234,180.5234,45.6789,18.5,0.045
NGC5678,220.8765,12.3456,19.2,0.089
NGC9012,156.2341,-23.4567,17.8,0.032
IC3456,195.7890,67.8901,20.1,0.156`;

    try {
      await createFile({
        path: 'home/username/data',
        filename: 'observations.csv',
        content: csvData,
        contentType: 'text/csv'
      });
      console.log('CSV file created successfully!');
    } catch (error) {
      console.error('Failed to create CSV:', error);
    }
  };

  return (
    <button onClick={createDataFile}>
      Create CSV Data
    </button>
  );
}
```

### Example: Create Markdown Documentation

```tsx
import { useCreateFile } from '@/lib/hooks/useVOSpace';

function CreateDocumentation() {
  const createFile = useCreateFile();

  const createReadme = async (projectName: string) => {
    const markdown = `# ${projectName}

## Overview
This project contains astronomical data analysis scripts and results.

## Directory Structure
\`\`\`
${projectName}/
├── data/           # Raw observation data
├── scripts/        # Analysis scripts
├── results/        # Output files and plots
└── README.md       # This file
\`\`\`

## Usage

1. Place your FITS files in the \`data/\` directory
2. Run the analysis: \`python scripts/analyze.py\`
3. Check results in \`results/\` directory

## Dependencies

- Python 3.8+
- NumPy
- AstroPy
- Matplotlib

## Author
Created with VOSpace utility hooks
`;

    try {
      await createFile({
        path: `home/username/projects/${projectName}`,
        filename: 'README.md',
        content: markdown,
        contentType: 'text/markdown'
      });
      console.log('README created successfully!');
    } catch (error) {
      console.error('Failed to create README:', error);
    }
  };

  return (
    <button onClick={() => createReadme('jwst-analysis')}>
      Create README
    </button>
  );
}
```

---

## Complete Example: Initialize New Project

Here's a complete example that creates a full project structure with folders and files:

```tsx
import { useCreateFolder, useCreateFile } from '@/lib/hooks/useVOSpace';
import { useState } from 'react';

function InitializeProject() {
  const createFolder = useCreateFolder();
  const createFile = useCreateFile();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);

  const initializeProject = async (username: string, projectName: string) => {
    setLoading(true);
    setProgress([]);

    const basePath = `home/${username}/projects/${projectName}`;

    try {
      // Step 1: Create folder structure
      setProgress(prev => [...prev, 'Creating folders...']);

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

      // Step 2: Create README
      setProgress(prev => [...prev, 'Creating README...']);

      await createFile({
        path: basePath,
        filename: 'README.md',
        content: `# ${projectName}\n\nProject initialized on ${new Date().toISOString()}`,
        contentType: 'text/markdown'
      });

      // Step 3: Create config file
      setProgress(prev => [...prev, 'Creating configuration...']);

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

      // Step 4: Create starter script
      setProgress(prev => [...prev, 'Creating starter script...']);

      await createFile({
        path: `${basePath}/scripts`,
        filename: 'start.py',
        content: `#!/usr/bin/env python3
"""
${projectName} - Starter Script
"""

def main():
    print("Welcome to ${projectName}!")
    print("Edit this script to add your analysis code.")

if __name__ == "__main__":
    main()
`,
        contentType: 'text/x-python'
      });

      // Step 5: Create .gitignore
      setProgress(prev => [...prev, 'Creating .gitignore...']);

      await createFile({
        path: basePath,
        filename: '.gitignore',
        content: `# Python
__pycache__/
*.py[cod]
*.so

# Data files
*.fits
*.csv
data/

# Results
results/

# IDE
.vscode/
.idea/
`,
        contentType: 'text/plain'
      });

      setProgress(prev => [...prev, '✅ Project initialized successfully!']);
    } catch (error) {
      console.error('Failed to initialize project:', error);
      setProgress(prev => [...prev, `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => initializeProject('szautkin', 'my-astronomy-project')}
        disabled={loading}
      >
        {loading ? 'Initializing...' : 'Initialize Project'}
      </button>

      {progress.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h3>Progress:</h3>
          <ul>
            {progress.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default InitializeProject;
```

---

## Error Handling

Both hooks throw errors that should be caught and handled:

```tsx
import { useCreateFolder, useCreateFile } from '@/lib/hooks/useVOSpace';

function MyComponent() {
  const createFolder = useCreateFolder();
  const createFile = useCreateFile();

  const handleOperation = async () => {
    try {
      // Create folder
      await createFolder({
        path: 'home/username/test',
        title: 'Test Folder'
      });

      // Create file
      await createFile({
        path: 'home/username/test',
        filename: 'test.txt',
        content: 'Hello!',
        contentType: 'text/plain'
      });

      // Success!
      alert('Created successfully!');
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('409')) {
          alert('Item already exists!');
        } else if (error.message.includes('401')) {
          alert('Authentication required!');
        } else if (error.message.includes('403')) {
          alert('Permission denied!');
        } else {
          alert(`Error: ${error.message}`);
        }
      }
    }
  };

  return <button onClick={handleOperation}>Create Test Items</button>;
}
```

---

## Best Practices

### 1. Path Sanitization

Filenames are automatically sanitized (spaces → underscores), but provide clean paths when possible:

```tsx
// Good
await createFile({
  path: 'home/username',
  filename: 'my-file.txt',  // Use hyphens or underscores
  content: 'content'
});

// Works, but gets sanitized to 'my_file.txt'
await createFile({
  path: 'home/username',
  filename: 'my file.txt',  // Spaces will be replaced
  content: 'content'
});
```

### 2. Content Type Specification

Always specify the correct content type for better file handling:

```tsx
// Good - explicit content type
await createFile({
  path: 'home/username',
  filename: 'data.json',
  content: JSON.stringify(data),
  contentType: 'application/json'  // Explicit
});

// Works, but less optimal
await createFile({
  path: 'home/username',
  filename: 'data.json',
  content: JSON.stringify(data)
  // contentType defaults to 'application/octet-stream'
});
```

### 3. Error Handling

Always wrap operations in try-catch blocks:

```tsx
try {
  await createFolder({ path: 'home/username/folder' });
  await createFile({
    path: 'home/username/folder',
    filename: 'file.txt',
    content: 'content'
  });
} catch (error) {
  // Handle error appropriately
  console.error('Operation failed:', error);
}
```

### 4. Sequential Operations

When creating multiple items, await each operation:

```tsx
// Good - sequential with error handling
try {
  await createFolder({ path: 'home/username/parent' });
  await createFolder({ path: 'home/username/parent/child' });
  await createFile({
    path: 'home/username/parent/child',
    filename: 'file.txt',
    content: 'content'
  });
} catch (error) {
  console.error('Failed:', error);
}

// Bad - parallel operations may fail if parent doesn't exist
Promise.all([
  createFolder({ path: 'home/username/parent' }),
  createFolder({ path: 'home/username/parent/child' })  // May fail!
]);
```

---

## TypeScript Types

```typescript
// useCreateFolder return type
type CreateFolder = (params: {
  path: string;
  title?: string;
}) => Promise<void>;

// useCreateFile return type
type CreateFile = (params: {
  path: string;
  filename: string;
  content: string | Buffer;
  contentType?: string;
}) => Promise<void>;
```

---

## See Also

- [VOSpace Widget Documentation](./VOSPACE_WIDGET.md)
- [VOSpace API Documentation](./src/app/api/vospace/README.md)
- [Code Review Improvements](./CODE_REVIEW_IMPROVEMENTS.md)
