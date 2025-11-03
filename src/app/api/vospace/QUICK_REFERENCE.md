# VOSpace API Quick Reference

## API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/vospace/nodes/[...path]` | List directory or get metadata |
| PUT | `/api/vospace/nodes/[...path]` | Create folder or file node |
| POST | `/api/vospace/nodes/[...path]` | Update properties |
| DELETE | `/api/vospace/nodes/[...path]` | Delete node |
| POST | `/api/vospace/transfer` | Upload file |
| GET | `/api/vospace/transfer?path=...` | Download file |

## Common Operations

### List Directory
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/vospace/nodes/home/username
```

### Create Folder
```bash
curl -X PUT \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"type":"folder","title":"My Folder"}' \
  http://localhost:3000/api/vospace/nodes/home/username/myfolder
```

### Upload File (Multipart)
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "path=home/username/file.txt" \
  -F "file=@/local/path/file.txt" \
  http://localhost:3000/api/vospace/transfer
```

### Upload File (JSON)
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "home/username/file.txt",
    "content": "Hello World",
    "encoding": "utf8"
  }' \
  http://localhost:3000/api/vospace/transfer
```

### Download File
```bash
curl -H "Authorization: Bearer <token>" \
  -o output.txt \
  "http://localhost:3000/api/vospace/transfer?path=home/username/file.txt"
```

### Delete File/Folder
```bash
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/vospace/nodes/home/username/file.txt
```

### Update Properties
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"properties":{"title":"New Title"}}' \
  http://localhost:3000/api/vospace/nodes/home/username/file.txt
```

## TypeScript Usage

### Initialize Client
```typescript
import { createVOSpaceClient } from '@/app/api/vospace/lib/vospace-client';

const client = createVOSpaceClient('https://ws-uv.canfar.net/arc', 30000);
```

### List Directory
```typescript
const nodes = await client.listNodes('home/username', token);
```

### Create Folder
```typescript
await client.createFolder('home/username/myfolder', 'My Folder', token);
```

### Upload File
```typescript
await client.uploadFile('home/username/file.txt', 'Hello World', token);
```

### Download File
```typescript
const content = await client.downloadFile('home/username/file.txt', token);
const text = content.toString('utf8');
```

### Delete Node
```typescript
await client.deleteNode('home/username/file.txt', token);
```

### Update Properties
```typescript
await client.updateProperties('home/username/file.txt', {
  title: 'New Title',
  description: 'Updated description'
}, token);
```

### Check Existence
```typescript
const exists = await client.nodeExists('home/username/file.txt', token);
```

## Path Utilities

```typescript
import {
  toVOSpaceURI,
  fromVOSpaceURI,
  normalizePath,
  getParentPath,
  getNodeName,
  joinPath
} from '@/app/api/vospace/lib/vospace-utils';

// Convert to VOSpace URI
toVOSpaceURI('home/user1/data')
// => 'vos://cadc.nrc.ca~arc/home/user1/data'

// Extract path from URI
fromVOSpaceURI('vos://cadc.nrc.ca~arc/home/user1/data')
// => 'home/user1/data'

// Normalize path
normalizePath('//home//user1///data/')
// => 'home/user1/data'

// Get parent
getParentPath('home/user1/data/file.txt')
// => 'home/user1/data'

// Get name
getNodeName('home/user1/data/file.txt')
// => 'file.txt'

// Join paths
joinPath('home', 'user1', 'data')
// => 'home/user1/data'
```

## Response Types

### Node Object
```typescript
{
  uri: string;
  type: VONodeType;
  name: string;
  size?: number;
  created?: string;
  modified?: string;
  properties?: Record<string, string>;
  nodes?: VONode[];  // For containers
  isPublic?: boolean;
  target?: string;   // For links
}
```

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "status": 400,
  "details": "Additional details"
}
```

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (already exists) |
| 500 | Internal Server Error |

## Environment Variables

### OIDC Mode (default)
```bash
NEXT_PUBLIC_SRC_ARC_API=https://src.canfar.net/arc
# or
SRC_ARC_API=https://src.canfar.net/arc
```

### CANFAR Mode
```bash
NEXT_USE_CANFAR=true
VOSPACE_API=https://ws-uv.canfar.net/arc
# or
NEXT_PUBLIC_VOSPACE_API=https://ws-uv.canfar.net/arc
```

## Testing

Run the test script:
```bash
export VOSPACE_TOKEN=your-token
export VOSPACE_USERNAME=your-username
./src/app/api/vospace/examples/test-vospace.sh
```

Skip cleanup:
```bash
SKIP_CLEANUP=1 ./src/app/api/vospace/examples/test-vospace.sh
```

## Common Patterns

### Upload Multiple Files
```typescript
const files = [
  { path: 'home/user/file1.txt', content: 'Content 1' },
  { path: 'home/user/file2.txt', content: 'Content 2' }
];

for (const file of files) {
  await client.uploadFile(file.path, file.content, token);
}
```

### Copy File
```typescript
// Download source
const content = await client.downloadFile(sourcePath, token);

// Upload to destination
await client.uploadFile(destPath, content, token);
```

### Move File
```typescript
// Download source
const content = await client.downloadFile(sourcePath, token);

// Upload to destination
await client.uploadFile(destPath, content, token);

// Delete source
await client.deleteNode(sourcePath, token);
```

### Recursive Listing
```typescript
async function listRecursive(path: string): Promise<VONode[]> {
  const nodes = await client.listNodes(path, token);
  const all = [...nodes];

  for (const node of nodes) {
    if (node.type === VONodeType.ContainerNode) {
      const children = await listRecursive(joinPath(path, node.name));
      all.push(...children);
    }
  }

  return all;
}
```

## Best Practices

1. **Always normalize paths** before using them
2. **Check if node exists** before overwriting
3. **Handle errors** with try-catch blocks
4. **Use meaningful titles** for better organization
5. **Clean up temporary files** after operations
6. **Validate input** before sending to API
7. **Log operations** for debugging
8. **Use appropriate timeouts** for large files
9. **Consider rate limiting** for bulk operations
10. **Secure tokens** - never commit them to code

## Troubleshooting

### "Authentication required"
- Ensure Authorization header is present
- Check token is valid and not expired

### "Node not found"
- Verify path is correct
- Check parent directories exist
- Use `nodeExists()` to verify

### "Access forbidden"
- Verify user has permissions
- Check token has correct scope

### "Timeout"
- Increase timeout for large files
- Check network connectivity
- Verify VOSpace service is available

### "Invalid path"
- Use `normalizePath()` to clean paths
- Avoid special characters
- Check path doesn't start with `/`
