# VOSpace API Integration

Complete backend infrastructure for CANFAR VOSpace storage integration.

## Overview

This implementation provides a full-featured REST API for interacting with CANFAR VOSpace, supporting:
- Directory listing and navigation
- File and folder creation
- File upload and download
- Node deletion
- Property updates
- Full authentication support

## Architecture

```
/api/vospace/
├── lib/
│   ├── vospace-utils.ts      # Path and URI utilities
│   ├── vospace-xml.ts         # XML parsing and generation
│   └── vospace-client.ts      # VOSpace client class
├── nodes/[...path]/
│   └── route.ts               # Node operations (CRUD)
└── transfer/
    └── route.ts               # File upload/download
```

## API Endpoints

### 1. List Directory / Get Node Metadata

**GET** `/api/vospace/nodes/[...path]`

Lists contents of a directory or gets metadata for a single node.

**Query Parameters:**
- `detail=metadata` - Get single node metadata instead of listing

**Example:**
```bash
# List home directory
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/vospace/nodes/home/username

# Get node metadata
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/vospace/nodes/home/username/file.txt?detail=metadata
```

**Response:**
```json
[
  {
    "uri": "vos://cadc.nrc.ca~arc/home/username/data",
    "type": "vos:ContainerNode",
    "name": "data",
    "created": "2025-11-01T10:30:00Z",
    "modified": "2025-11-02T14:20:00Z",
    "properties": {
      "title": "My Data Folder"
    }
  },
  {
    "uri": "vos://cadc.nrc.ca~arc/home/username/script.py",
    "type": "vos:DataNode",
    "name": "script.py",
    "size": 1024,
    "created": "2025-11-02T09:15:00Z",
    "modified": "2025-11-02T09:15:00Z"
  }
]
```

### 2. Create Folder

**PUT** `/api/vospace/nodes/[...path]`

Creates a new folder (ContainerNode).

**Request Body:**
```json
{
  "type": "folder",
  "title": "My New Folder"
}
```

**Example:**
```bash
curl -X PUT \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"type":"folder","title":"Data Folder"}' \
  http://localhost:3000/api/vospace/nodes/home/username/data
```

### 3. Create File Node

**PUT** `/api/vospace/nodes/[...path]`

Creates file metadata (DataNode). Use before uploading file content.

**Request Body:**
```json
{
  "type": "file",
  "title": "My Script"
}
```

### 4. Upload File

**POST** `/api/vospace/transfer`

Uploads file content to VOSpace. Supports both multipart and JSON.

**Option A: Multipart Form Data**
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "path=home/username/script.py" \
  -F "file=@/path/to/local/script.py" \
  -F "title=Hello World Script" \
  http://localhost:3000/api/vospace/transfer
```

**Option B: JSON with Base64**
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "home/username/script.py",
    "content": "IyEvdXNyL2Jpbi9lbnYgcHl0aG9uCnByaW50KCJIZWxsbyBXb3JsZCIp",
    "encoding": "base64",
    "title": "Hello World Script"
  }' \
  http://localhost:3000/api/vospace/transfer
```

**Option C: JSON with UTF-8**
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "home/username/hello.py",
    "content": "#!/usr/bin/env python\nprint(\"Hello from VOSpace!\")\n",
    "encoding": "utf8"
  }' \
  http://localhost:3000/api/vospace/transfer
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "path": "home/username/script.py"
}
```

### 5. Download File

**GET** `/api/vospace/transfer?path=...`

Downloads file content from VOSpace.

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  -o script.py \
  "http://localhost:3000/api/vospace/transfer?path=home/username/script.py"
```

### 6. Delete Node

**DELETE** `/api/vospace/nodes/[...path]`

Deletes a file or folder (recursive for folders).

**Example:**
```bash
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/vospace/nodes/home/username/old-file.txt
```

### 7. Update Properties

**POST** `/api/vospace/nodes/[...path]`

Updates node properties (metadata).

**Request Body:**
```json
{
  "properties": {
    "title": "Updated Title",
    "description": "This is my updated description"
  }
}
```

**Example:**
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"properties":{"title":"My Updated Script"}}' \
  http://localhost:3000/api/vospace/nodes/home/username/script.py
```

## VOSpace Utilities

### Path Utilities (`vospace-utils.ts`)

```typescript
import {
  toVOSpaceURI,
  fromVOSpaceURI,
  normalizePath,
  getParentPath,
  getNodeName,
  joinPath,
  isChildPath,
  isValidPath
} from '@/app/api/vospace/lib/vospace-utils';

// Convert path to VOSpace URI
toVOSpaceURI('home/user1/data')
// => 'vos://cadc.nrc.ca~arc/home/user1/data'

// Extract path from URI
fromVOSpaceURI('vos://cadc.nrc.ca~arc/home/user1/data')
// => 'home/user1/data'

// Normalize path
normalizePath('//home//user1///data/')
// => 'home/user1/data'

// Get parent path
getParentPath('home/user1/data/file.txt')
// => 'home/user1/data'

// Get node name
getNodeName('home/user1/data/file.txt')
// => 'file.txt'
```

### XML Handler (`vospace-xml.ts`)

```typescript
import {
  parseNodeResponse,
  parseNodeList,
  generateContainerNode,
  generateDataNode,
  generatePropertyUpdate,
  VONode,
  VONodeType
} from '@/app/api/vospace/lib/vospace-xml';

// Parse XML response
const node: VONode = parseNodeResponse(xmlString);

// Generate XML for creating folder
const xml = generateContainerNode('vos://cadc.nrc.ca~arc/home/user1/data', 'My Data');
```

### VOSpace Client (`vospace-client.ts`)

```typescript
import { createVOSpaceClient } from '@/app/api/vospace/lib/vospace-client';

const client = createVOSpaceClient('https://ws-uv.canfar.net/arc', 30000);

// List nodes
const nodes = await client.listNodes('home/username', token);

// Create folder
await client.createFolder('home/username/data', 'My Data', token);

// Upload file
await client.uploadFile('home/username/script.py', fileContent, token);

// Download file
const content = await client.downloadFile('home/username/script.py', token);

// Delete node
await client.deleteNode('home/username/old-file.txt', token);

// Update properties
await client.updateProperties('home/username/script.py', { title: 'Updated' }, token);

// Get node metadata
const node = await client.getNode('home/username/script.py', token);

// Check if node exists
const exists = await client.nodeExists('home/username/script.py', token);
```

## Configuration

The VOSpace integration uses the server configuration from `/src/app/api/lib/server-config.ts`:

```typescript
serverApiConfig.vospace = {
  baseUrl: 'https://ws-uv.canfar.net/arc',
  timeout: 30000
}
```

### Environment Variables

**OIDC Mode:**
- `NEXT_PUBLIC_SRC_ARC_API` or `SRC_ARC_API` (default: `https://src.canfar.net/arc`)

**CANFAR Mode:**
- `VOSPACE_API` or `NEXT_PUBLIC_VOSPACE_API` (default: `https://ws-uv.canfar.net/arc`)

## Authentication

All endpoints require authentication via Bearer token:

```
Authorization: Bearer <your-token>
```

The token is automatically forwarded from:
- OIDC mode: NextAuth session access token
- CANFAR mode: Client Authorization header

## Error Handling

All endpoints return standardized error responses:

```json
{
  "error": "Unauthorized",
  "message": "Authentication required",
  "status": 401
}
```

Common status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (node already exists)
- `500` - Internal Server Error

## VOSpace Concepts

### Node Types

- **ContainerNode**: Directory/folder that can contain other nodes
- **DataNode**: File containing data
- **LinkNode**: Symbolic link to another node
- **UnstructuredDataNode**: File with unstructured data
- **StructuredDataNode**: File with structured data

### VOSpace URIs

VOSpace uses special URI format:
```
vos://cadc.nrc.ca~arc/path/to/node
```

The utilities automatically convert between regular paths and VOSpace URIs.

### Properties

Nodes can have metadata properties:
- `title` - Human-readable title
- `description` - Description
- `date` - Creation date
- `lastmod` - Last modification date
- `length` - File size in bytes
- `ispublic` - Public access flag

## Example: Upload Python Script

Here's a complete example of uploading a Python "Hello World" script:

```bash
# Create the script content
cat > hello.py << 'EOF'
#!/usr/bin/env python
"""Hello World from VOSpace"""

def main():
    print("Hello from VOSpace!")
    print("This file was uploaded through the Science Portal")

if __name__ == "__main__":
    main()
EOF

# Upload via multipart form data
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "path=home/YOUR_USERNAME/hello.py" \
  -F "file=@hello.py" \
  -F "title=Hello World Script" \
  http://localhost:3000/api/vospace/transfer

# Download it back
curl -H "Authorization: Bearer YOUR_TOKEN" \
  -o downloaded.py \
  "http://localhost:3000/api/vospace/transfer?path=home/YOUR_USERNAME/hello.py"

# Verify
python downloaded.py
```

## Testing

Run the test suite:

```bash
npm test -- vospace
```

## Implementation Notes

- All XML operations use native DOMParser for browser compatibility
- File transfers use sync transfer endpoints for immediate uploads/downloads
- All paths are normalized to prevent directory traversal attacks
- Token authentication supports both OIDC and CANFAR modes
- Error messages include detailed information from VOSpace API
- Comprehensive logging for debugging external API calls
- Timeout handling for long-running operations
- Content-Type detection for downloads based on file extension
- Support for binary and text file uploads

## Production Considerations

1. **File Size Limits**: Consider implementing size limits for uploads
2. **Rate Limiting**: Add rate limiting for transfer endpoints
3. **Caching**: Implement caching for frequently accessed node listings
4. **Pagination**: Add pagination for large directory listings
5. **Webhooks**: Consider webhooks for async transfer completion
6. **Validation**: Add comprehensive input validation and sanitization
7. **Monitoring**: Add metrics and monitoring for API usage
8. **Documentation**: Generate OpenAPI/Swagger documentation

## References

- [IVOA VOSpace Specification](http://www.ivoa.net/documents/VOSpace/)
- [CANFAR Documentation](https://www.canfar.net/en/)
- [CADC VOSpace](https://www.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/en/doc/vospace/)
