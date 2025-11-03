# VOSpace Utility Hooks - Summary

## What We Built

Two new utility hooks for programmatic VOSpace operations:

### 1. **useCreateFolder**
Creates folders programmatically in VOSpace

**Location**: `src/lib/hooks/useVOSpace.ts:340-367`

**Signature**:
```typescript
useCreateFolder(): (params: { path: string; title?: string }) => Promise<void>
```

**Example**:
```tsx
const createFolder = useCreateFolder();

await createFolder({
  path: 'home/username/my-folder',
  title: 'My Project Folder'
});
```

---

### 2. **useCreateFile**
Creates files with content from strings or buffers

**Location**: `src/lib/hooks/useVOSpace.ts:401-443`

**Signature**:
```typescript
useCreateFile(): (params: {
  path: string;
  filename: string;
  content: string | Buffer;
  contentType?: string;
}) => Promise<void>
```

**Example**:
```tsx
const createFile = useCreateFile();

await createFile({
  path: 'home/username',
  filename: 'script.py',
  content: 'print("Hello")',
  contentType: 'text/x-python'
});
```

---

## Key Features

### useCreateFolder
- ✅ Simple folder creation with optional title
- ✅ Full path specification
- ✅ Error handling with detailed messages
- ✅ Automatic authentication handling
- ✅ Console logging for debugging

### useCreateFile
- ✅ Create files from string or Buffer content
- ✅ Automatic filename extension handling
- ✅ Content-Type specification (defaults to octet-stream)
- ✅ Supports all file types (text, Python, JSON, CSV, etc.)
- ✅ Automatic sanitization of filenames
- ✅ Error handling with detailed messages

---

## Common Use Cases

### 1. Project Initialization
Create complete folder structures for new projects:

```tsx
const createFolder = useCreateFolder();
const createFile = useCreateFile();

// Create structure
await createFolder({ path: 'home/user/project' });
await createFolder({ path: 'home/user/project/data' });
await createFolder({ path: 'home/user/project/scripts' });

// Add files
await createFile({
  path: 'home/user/project',
  filename: 'README.md',
  content: '# My Project',
  contentType: 'text/markdown'
});
```

### 2. Script Generation
Generate Python/JavaScript scripts programmatically:

```tsx
const createFile = useCreateFile();

await createFile({
  path: 'home/user/scripts',
  filename: 'analyze.py',
  content: pythonCode,
  contentType: 'text/x-python'
});
```

### 3. Configuration Management
Create JSON/YAML config files:

```tsx
const createFile = useCreateFile();

await createFile({
  path: 'home/user/project',
  filename: 'config.json',
  content: JSON.stringify(config, null, 2),
  contentType: 'application/json'
});
```

### 4. Data File Creation
Generate CSV or other data files:

```tsx
const createFile = useCreateFile();

await createFile({
  path: 'home/user/data',
  filename: 'observations.csv',
  content: csvData,
  contentType: 'text/csv'
});
```

---

## Documentation Files Created

1. **`VOSPACE_UTILITY_HOOKS.md`** - Comprehensive guide
   - Detailed API documentation
   - 10+ usage examples
   - Best practices
   - Error handling patterns
   - Complete project initialization example

2. **`src/app/components/VOSpaceUtilityExample.tsx`** - Demo component
   - 5 interactive examples
   - Progress tracking
   - Error display
   - Live demonstrations

3. **`UTILITY_HOOKS_SUMMARY.md`** - This file
   - Quick reference
   - Key features
   - Use cases

---

## Supported File Types

| Extension | Content Type | Use Case |
|-----------|--------------|----------|
| `.txt` | `text/plain` | Text files |
| `.py` | `text/x-python` | Python scripts |
| `.js` | `text/javascript` | JavaScript files |
| `.json` | `application/json` | Configuration |
| `.csv` | `text/csv` | Data files |
| `.md` | `text/markdown` | Documentation |
| `.html` | `text/html` | Web pages |
| `.fits` | `application/fits` | Astronomy data |
| `.xml` | `text/xml` | XML data |

---

## Error Handling

Both hooks throw descriptive errors:

```tsx
try {
  await createFolder({ path: 'home/user/folder' });
  await createFile({
    path: 'home/user/folder',
    filename: 'file.txt',
    content: 'content'
  });
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('409')) {
      // Already exists
    } else if (error.message.includes('401')) {
      // Not authenticated
    } else if (error.message.includes('403')) {
      // Permission denied
    }
  }
}
```

---

## Integration with Existing Code

These hooks work seamlessly with existing VOSpace functionality:

```tsx
// Existing hooks still work
const { data: nodes } = useVOSpaceNodes('home/user');
const { mutate: uploadFile } = useUploadVOSpaceFile();

// New utility hooks
const createFolder = useCreateFolder();
const createFile = useCreateFile();

// Mix and match
await createFolder({ path: 'home/user/new-folder' });
await createFile({
  path: 'home/user/new-folder',
  filename: 'data.json',
  content: JSON.stringify(data)
});
```

---

## Testing the Hooks

### Method 1: Use the Example Component

Add to your page:
```tsx
import VOSpaceUtilityExample from '@/app/components/VOSpaceUtilityExample';

export default function TestPage() {
  return <VOSpaceUtilityExample />;
}
```

### Method 2: Direct Usage

```tsx
'use client';

import { useCreateFolder, useCreateFile } from '@/lib/hooks/useVOSpace';

export default function TestComponent() {
  const createFolder = useCreateFolder();
  const createFile = useCreateFile();

  const test = async () => {
    // Test folder creation
    await createFolder({
      path: 'home/szautkin/test-folder'
    });

    // Test file creation
    await createFile({
      path: 'home/szautkin/test-folder',
      filename: 'test.txt',
      content: 'Hello, VOSpace!'
    });

    alert('Success!');
  };

  return <button onClick={test}>Test Hooks</button>;
}
```

---

## Performance Considerations

1. **Sequential Operations**: Operations are awaited sequentially to ensure parent folders exist before children
2. **Error Propagation**: Errors stop execution and propagate up for handling
3. **Automatic Sanitization**: Filenames are automatically sanitized
4. **Logging**: Console logs help with debugging without affecting performance

---

## Differences from Existing Hooks

### useCreateVOSpaceFolder (existing)
- React Query mutation
- Designed for UI interactions
- Includes refetch logic
- Returns mutation object

### useCreateFolder (new)
- Direct async function
- Designed for programmatic use
- Simpler API
- Returns Promise

### useUploadVOSpaceFile (existing)
- Requires File object
- Designed for user file uploads
- Includes file validation

### useCreateFile (new)
- Takes string or Buffer
- Designed for programmatic content
- Simpler API for generated content

---

## Future Enhancements

Potential improvements:
1. Batch operations (create multiple files/folders at once)
2. Progress callbacks for large operations
3. Template support (project templates)
4. Validation hooks (check before create)
5. Transaction support (rollback on error)

---

## Quick Reference

```typescript
// Import
import { useCreateFolder, useCreateFile } from '@/lib/hooks/useVOSpace';

// Initialize
const createFolder = useCreateFolder();
const createFile = useCreateFile();

// Create folder
await createFolder({
  path: 'home/username/folder',
  title: 'Optional Title'
});

// Create file
await createFile({
  path: 'home/username/folder',
  filename: 'file.ext',
  content: 'content or buffer',
  contentType: 'mime/type'  // optional
});
```

---

## Summary

These utility hooks provide a **simple, programmatic way** to create folders and files in VOSpace, perfect for:
- Project initialization
- Script generation
- Configuration management
- Data file creation
- Automated workflows

They complement the existing UI-focused hooks and provide a cleaner API for programmatic operations.
