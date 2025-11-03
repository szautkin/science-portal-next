# VOSpace Storage Widget

A comprehensive file browser widget for CANFAR VOSpace storage, following the project's 3-layer widget pattern.

## Overview

The VOSpace Storage Widget provides a complete file management interface for browsing, uploading, creating folders, and deleting files in CANFAR VOSpace storage. It integrates with the backend VOSpace API routes and uses React Query for efficient data fetching and caching.

## Architecture

This widget follows the standard 3-layer pattern:

1. **Shell Component** (`VOSpaceStorageWidget.tsx`) - Public-facing component that forwards props
2. **Props Interface** (`@/app/types/VOSpaceStorageWidgetProps.ts`) - TypeScript type definitions
3. **Implementation** (`@/app/implementation/voSpaceStorageWidget.tsx`) - All logic and UI

## Files Created

### Core Widget Files
- `/src/app/components/VOSpaceStorageWidget/VOSpaceStorageWidget.tsx` - Shell component
- `/src/app/components/VOSpaceStorageWidget/index.ts` - Public exports
- `/src/app/types/VOSpaceStorageWidgetProps.ts` - Props interface
- `/src/app/implementation/voSpaceStorageWidget.tsx` - Implementation

### React Query Hooks
- `/src/lib/hooks/useVOSpace.ts` - React Query hooks for VOSpace operations

## Features

### File Browsing
- Navigate through directory structure
- Breadcrumb navigation with clickable path segments
- Folder/file icons with visual distinction
- Sort: folders first, then files, alphabetically
- Click folders to navigate into them

### File Operations
- **Create Folder**: Create new directories with validation
- **Upload File**: Upload files via file picker or use test Python file
- **Download File**: Download files with browser download
- **Delete**: Delete files and folders with confirmation dialog
- **Refresh**: Reload current directory

### UI/UX Features
- Responsive Material-UI design
- Loading skeletons during data fetch
- Error handling with user-friendly messages
- Empty state when no files
- Action buttons disabled when not authenticated
- Confirmation dialogs for destructive actions
- Real-time feedback with loading indicators

## Usage

### Basic Usage

```tsx
import { VOSpaceStorageWidget } from '@/app/components/VOSpaceStorageWidget';

function MyPage() {
  return (
    <VOSpaceStorageWidget
      isAuthenticated={true}
      username="myusername"
    />
  );
}
```

### Advanced Usage

```tsx
import { VOSpaceStorageWidget } from '@/app/components/VOSpaceStorageWidget';

function MyPage() {
  const handleFileUploaded = (path: string) => {
    console.log('File uploaded to:', path);
  };

  const handlePathChange = (path: string) => {
    console.log('Navigated to:', path);
  };

  return (
    <VOSpaceStorageWidget
      title="My VOSpace Files"
      isAuthenticated={true}
      username="myusername"
      initialPath="home/myusername/projects"
      showRefreshButton={true}
      showBreadcrumbs={true}
      showActions={true}
      onFileUploaded={handleFileUploaded}
      onPathChange={handlePathChange}
      emptyMessage="No files or folders in this directory"
    />
  );
}
```

## Props

### Core Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `'VOSpace Storage'` | Widget title |
| `isAuthenticated` | `boolean` | `false` | Whether user is authenticated |
| `username` | `string` | - | Username for default path |
| `initialPath` | `string` | `'home'` or `'home/{username}'` | Initial directory path |

### UI Control Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showRefreshButton` | `boolean` | `true` | Show refresh button |
| `showBreadcrumbs` | `boolean` | `true` | Show breadcrumb navigation |
| `showActions` | `boolean` | `true` | Show action buttons |
| `emptyMessage` | `string` | `'No files or folders'` | Message when no files |
| `maxFiles` | `number` | `1000` | Maximum files to display |

### Callback Props

| Prop | Type | Description |
|------|------|-------------|
| `onRefresh` | `() => void` | Called when refresh button clicked |
| `onFileUploaded` | `(path: string) => void` | Called after successful upload |
| `onFolderCreated` | `(path: string) => void` | Called after folder created |
| `onNodeDeleted` | `(path: string) => void` | Called after node deleted |
| `onPathChange` | `(path: string) => void` | Called when navigation changes |

### Formatting Props

| Prop | Type | Description |
|------|------|-------------|
| `dateFormatter` | `(date: string) => string` | Custom date formatter |
| `fileSizeFormatter` | `(bytes: number) => string` | Custom file size formatter |

### Error/Loading Props

| Prop | Type | Description |
|------|------|-------------|
| `isLoading` | `boolean` | External loading state |
| `errorMessage` | `string` | External error message |

## React Query Hooks

### `useVOSpaceNodes(path, isAuthenticated, options)`

Fetch nodes in a directory.

```tsx
const { data: nodes, isLoading, error, refetch } = useVOSpaceNodes(
  'home/username',
  isAuthenticated
);
```

### `useCreateVOSpaceFolder(options)`

Create a new folder.

```tsx
const { mutate: createFolder, isPending } = useCreateVOSpaceFolder({
  onSuccess: () => console.log('Folder created'),
});

createFolder({ path: 'home/username/new-folder', title: 'My Folder' });
```

### `useUploadVOSpaceFile(options)`

Upload a file.

```tsx
const { mutate: uploadFile, isPending } = useUploadVOSpaceFile({
  onSuccess: () => console.log('File uploaded'),
});

uploadFile({ path: 'home/username/file.txt', file: fileObject });
```

### `useDeleteVOSpaceNode(options)`

Delete a file or folder.

```tsx
const { mutate: deleteNode, isPending } = useDeleteVOSpaceNode({
  onSuccess: () => console.log('Node deleted'),
});

deleteNode('home/username/file.txt');
```

### `useDownloadVOSpaceFile()`

Download a file.

```tsx
const downloadFile = useDownloadVOSpaceFile();

downloadFile('home/username/file.txt');
```

## Query Key Factory

The `vospaceKeys` object provides consistent query keys:

```tsx
export const vospaceKeys = {
  all: ['vospace'],
  nodes: () => [...vospaceKeys.all, 'nodes'],
  nodeList: (path: string) => [...vospaceKeys.nodes(), path],
  nodeDetail: (path: string) => [...vospaceKeys.nodes(), path, 'detail'],
};
```

## Backend API Routes

The widget uses these API endpoints:

- `GET /api/vospace/nodes/[...path]` - List directory contents
- `PUT /api/vospace/nodes/[...path]` - Create folder
- `DELETE /api/vospace/nodes/[...path]` - Delete node
- `POST /api/vospace/transfer` - Upload file
- `GET /api/vospace/transfer?path=...` - Download file

## VONode Interface

```typescript
export interface VONode {
  uri: string;
  type: VONodeType;
  name: string;
  size?: number;
  created?: string;
  modified?: string;
  properties?: Record<string, string>;
  nodes?: VONode[];
  isPublic?: boolean;
  target?: string;
}

export enum VONodeType {
  ContainerNode = 'vos:ContainerNode',
  DataNode = 'vos:DataNode',
  LinkNode = 'vos:LinkNode',
  UnstructuredDataNode = 'vos:UnstructuredDataNode',
  StructuredDataNode = 'vos:StructuredDataNode',
}
```

## Test File Content

When no file is selected for upload, the widget uploads a default Python "Hello World" script:

```python
#!/usr/bin/env python
"""Hello World from VOSpace"""

def main():
    print("Hello from VOSpace!")
    print("This file was uploaded through the Science Portal")

if __name__ == "__main__":
    main()
```

## Styling

The widget uses:
- Material-UI components with `sx` prop for styling
- Theme colors and spacing tokens
- Responsive breakpoints for mobile support
- Tailwind CSS classes (if needed in parent containers)

## Error Handling

- Network errors displayed in Alert component
- Validation errors shown in dialog helper text
- Authentication errors handled gracefully
- Loading states prevent multiple submissions

## Cache Invalidation

React Query automatically invalidates and refetches:
- Parent directory after creating folder
- Parent directory after uploading file
- Parent directory after deleting node

## Accessibility

- Semantic HTML structure
- ARIA labels on buttons and actions
- Keyboard navigation support
- Screen reader compatible
- Proper focus management in dialogs

## Performance

- Query caching reduces redundant API calls
- Optimistic updates for better UX
- Lazy loading of large directories
- Maximum file limit prevents UI slowdown
- Memoized computations for sorting and filtering

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Development Notes

### Adding New Features

1. Add prop to `VOSpaceStorageWidgetProps.ts`
2. Update implementation in `voSpaceStorageWidget.tsx`
3. Add React Query hook if backend operation needed
4. Update this README

### Debugging

Enable React Query DevTools to inspect cache:

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<ReactQueryDevtools initialIsOpen={false} />
```

### Testing

The widget is designed to work with:
- Authenticated users with VOSpace access
- Test mode with hardcoded Python file upload
- Error scenarios (network errors, permission errors)

## Related Components

- `UserStorageWidget` - Shows storage quota/usage
- `ActiveSessionsWidget` - Shows active compute sessions
- `LaunchFormWidget` - Launch new sessions

## License

Part of the CANFAR Science Portal Next.js application.
