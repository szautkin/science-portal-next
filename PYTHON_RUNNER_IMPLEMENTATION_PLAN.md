# Python Script Runner Implementation Plan

## Overview

Add Python script execution capabilities to the Star AI widget, allowing users to run containerized Python scripts using the Skaha API with contributed images from Harbor registry.

## Requirements Summary

Based on `/home/serhii/projects/star-ai-images/python-runner` project:

1. **Execute Python scripts** in containers via Skaha API
2. **Provide registry credentials** for contributed images (Harbor CLI secret)
3. **Pass parameters**: script name, optional callback endpoint
4. **Use Skaha session API** with advanced parameters
5. **UI integrated** into Star AI widget

## UI Design

### Location
**File**: `src/app/implementation/starAIWidget.tsx`

Add a **third section** in the Grid layout after "Create Folder" and "Create File":

```
Grid container:
  - Grid item (xs=12, md=4): Create Folder
  - Grid item (xs=12, md=4): Create File
  - Grid item (xs=12, md=4): Run Python Script ← NEW
```

### UI Components Structure

```typescript
// Inside StarAIWidgetImpl component

// New state for Python runner
const [pythonScriptPath, setPythonScriptPath] = useState('');
const [pythonImage, setPythonImage] = useState('');
const [callbackEndpoint, setCallbackEndpoint] = useState('');
const [pythonCores, setPythonCores] = useState(2);
const [pythonRam, setPythonRam] = useState(4);
const [registryUsername, setRegistryUsername] = useState('');
const [registrySecret, setRegistrySecret] = useState('');
const [credentialsAnchorEl, setCredentialsAnchorEl] = useState<HTMLElement | null>(null);
const [isExecutingScript, setIsExecutingScript] = useState(false);
const [executionSessionId, setExecutionSessionId] = useState('');

// Form structure
<Grid item xs={12} md={4}>
  <Box>
    <Typography variant="h6">Run Python Script</Typography>

    {/* Script Path Input */}
    <TextField
      label="Script Path"
      placeholder="/arc/projects/myproject/script.py"
      helperText="Full path to Python script in VOSpace"
    />

    {/* Image Selector */}
    <FormControl>
      <InputLabel>Container Image</InputLabel>
      <Select>
        <MenuItem>images.canfar.net/myproject/python-runner:1.0.0</MenuItem>
      </Select>
    </FormControl>

    {/* Optional Callback */}
    <TextField
      label="Callback Endpoint (Optional)"
      placeholder="https://api.example.com/callback"
      helperText="HTTP endpoint for completion notification"
    />

    {/* Resource Allocation */}
    <Grid container spacing={1}>
      <Grid item xs={6}>
        <TextField
          type="number"
          label="CPU Cores"
          value={pythonCores}
          inputProps={{ min: 1, max: 8 }}
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          type="number"
          label="RAM (GB)"
          value={pythonRam}
          inputProps={{ min: 1, max: 32 }}
        />
      </Grid>
    </Grid>

    {/* Credentials Button */}
    <Button
      variant="outlined"
      startIcon={<KeyIcon />}
      onClick={handleOpenCredentials}
    >
      Registry Credentials
    </Button>

    {/* Execute Button */}
    <Button
      variant="contained"
      startIcon={<PlayArrowIcon />}
      onClick={handleExecuteScript}
      disabled={!pythonScriptPath || !pythonImage || isExecutingScript}
    >
      Execute Script
    </Button>
  </Box>
</Grid>

{/* Credentials Popover */}
<Popover
  open={Boolean(credentialsAnchorEl)}
  anchorEl={credentialsAnchorEl}
  onClose={handleCloseCredentials}
>
  <Box sx={{ p: 2, width: 350 }}>
    <Typography variant="h6" gutterBottom>
      Registry Credentials
    </Typography>

    <TextField
      fullWidth
      label="Username"
      value={registryUsername}
      onChange={(e) => setRegistryUsername(e.target.value)}
      helperText="Harbor CLI username (CADC username)"
      sx={{ mb: 2 }}
    />

    <TextField
      fullWidth
      type="password"
      label="Secret"
      value={registrySecret}
      onChange={(e) => setRegistrySecret(e.target.value)}
      helperText="Harbor CLI Secret from user profile"
      sx={{ mb: 2 }}
    />

    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
      <Button onClick={handleCloseCredentials}>Cancel</Button>
      <Button variant="contained" onClick={handleSaveCredentials}>
        Save
      </Button>
    </Box>
  </Box>
</Popover>
```

## API Integration

### 1. Skaha API Call Structure

**Endpoint**: POST `/api/sessions`

**Request Body**:
```typescript
{
  sessionType: "contributed",
  sessionName: `python-${Date.now()}`,
  containerImage: pythonImage,
  cores: pythonCores,
  ram: pythonRam,
  gpus: 0,
  cmd: `/skaha/startup.sh ${sessionId} ${pythonScriptPath} ${callbackEndpoint || ''}`.trim(),
  env: {
    PYTHONUNBUFFERED: "1",
    PYTHONDONTWRITEBYTECODE: "1"
  },
  registryUsername: registryUsername || undefined,
  registrySecret: registrySecret || undefined
}
```

### 2. Implementation Flow

```typescript
const handleExecuteScript = async () => {
  try {
    setIsExecutingScript(true);
    setError('');

    // Generate session ID
    const sessionId = `python-${Date.now()}`;

    // Build command
    const cmdParts = [
      '/skaha/startup.sh',
      sessionId,
      pythonScriptPath.trim()
    ];

    if (callbackEndpoint.trim()) {
      cmdParts.push(callbackEndpoint.trim());
    }

    const cmd = cmdParts.join(' ');

    // Launch session
    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({
        sessionType: 'contributed',
        sessionName: `python-${Date.now()}`,
        containerImage: pythonImage,
        cores: pythonCores,
        ram: pythonRam,
        gpus: 0,
        cmd: cmd,
        env: {
          PYTHONUNBUFFERED: '1',
          PYTHONDONTWRITEBYTECODE: '1'
        },
        registryUsername: registryUsername || undefined,
        registrySecret: registrySecret || undefined
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to launch session');
    }

    const session = await response.json();
    setExecutionSessionId(session.id);

    setSuccessMessage(
      `Script execution started! Session ID: ${session.id}. ` +
      `${callbackEndpoint ? 'Waiting for callback notification...' : 'Check logs for results.'}`
    );

    // Clear form
    setPythonScriptPath('');
    setCallbackEndpoint('');

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to execute script';
    setError(errorMsg);
  } finally {
    setIsExecutingScript(false);
  }
};
```

## Image Selection

### Option 1: Static List (Simpler)
```typescript
const PYTHON_RUNNER_IMAGES = [
  'images.canfar.net/skaha/python-runner:latest',
  'images.canfar.net/skaha/python-runner:1.0.0',
];
```

### Option 2: Dynamic from API (Better)
Fetch contributed images from `/api/images` and filter for python-runner:
```typescript
const { data: images } = useQuery({
  queryKey: ['images', 'contributed'],
  queryFn: async () => {
    const response = await fetch('/api/images?type=contributed');
    return response.json();
  }
});

const pythonImages = images?.filter(img =>
  img.name.includes('python-runner') ||
  img.labels?.['ca.nrc.cadc.skaha.type'] === 'headless'
);
```

## Validation

### Required Fields
- Script path: Must not be empty
- Container image: Must be selected
- Cores: 1-8
- RAM: 1-32 GB

### Optional Fields
- Callback endpoint: Must be valid URL if provided
- Registry credentials: Only required for private images

### Validation Logic
```typescript
const isScriptPathValid = pythonScriptPath.trim().length > 0;
const isImageSelected = pythonImage.trim().length > 0;
const isCoresValid = pythonCores >= 1 && pythonCores <= 8;
const isRamValid = pythonRam >= 1 && pythonRam <= 32;
const isCallbackValid = !callbackEndpoint.trim() ||
  callbackEndpoint.trim().startsWith('http');

const canExecute = isScriptPathValid &&
                    isImageSelected &&
                    isCoresValid &&
                    isRamValid &&
                    isCallbackValid &&
                    !isExecutingScript;
```

## Icons to Add

```typescript
import {
  PlayArrow as PlayArrowIcon,
  Key as KeyIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
```

## Layout Adjustments

### Current Layout (2 columns)
```
[Create Folder] [Create File]
```

### New Layout (3 columns)
```
[Create Folder] [Create File] [Run Python Script]
```

### Mobile Layout (stacked)
```
[Create Folder]
[Create File]
[Run Python Script]
```

### Grid Configuration
```typescript
<Grid container spacing={2}>
  <Grid item xs={12} md={4}>
    {/* Create Folder */}
  </Grid>

  <Grid item xs={12} md={4}>
    {/* Create File */}
  </Grid>

  <Grid item xs={12} md={4}>
    {/* Run Python Script */}
  </Grid>
</Grid>
```

## Session Monitoring

### Option 1: Show Session Link
```typescript
{executionSessionId && (
  <Alert severity="info" sx={{ mt: 2 }}>
    Session running: {executionSessionId}
    <Button
      size="small"
      onClick={() => window.open(`/sessions/${executionSessionId}`, '_blank')}
    >
      View Logs
    </Button>
  </Alert>
)}
```

### Option 2: Integrate with Callback
If callback endpoint provided, show waiting state and update when callback received.

## Error Handling

### Common Errors
1. **Authentication Failed**: Invalid registry credentials
2. **Image Not Found**: Image doesn't exist or not accessible
3. **Script Not Found**: Script path doesn't exist in VOSpace
4. **Resource Limit**: Requested resources exceed quota
5. **Session Launch Failed**: Skaha API error

### Error Messages
```typescript
const ERROR_MESSAGES = {
  AUTH_FAILED: 'Registry authentication failed. Check your Harbor CLI credentials.',
  IMAGE_NOT_FOUND: 'Container image not found. Verify image path and credentials.',
  SCRIPT_NOT_FOUND: 'Script not found. Check the path in VOSpace.',
  RESOURCE_LIMIT: 'Resource limit exceeded. Reduce cores or RAM.',
  LAUNCH_FAILED: 'Failed to launch session. Check Skaha status.'
};
```

## Testing Checklist

- [ ] Script path validation
- [ ] Image selection
- [ ] Callback endpoint validation (optional)
- [ ] Resource allocation (cores, RAM)
- [ ] Credentials popover open/close
- [ ] Save credentials
- [ ] Execute button disabled states
- [ ] Session launch success
- [ ] Session launch failure
- [ ] Error messages displayed
- [ ] Success messages with session ID
- [ ] Form reset after execution
- [ ] Mobile responsive layout
- [ ] Authentication with registry credentials
- [ ] Without registry credentials (public images)

## Documentation

Create user guide at `PYTHON_RUNNER_USAGE.md`:

1. How to prepare Python scripts in VOSpace
2. How to select container image
3. How to obtain Harbor CLI secret
4. How to execute scripts
5. How to monitor execution
6. How to handle callbacks
7. Troubleshooting common errors

## Dependencies

### New MUI Components Needed
- `Popover` - For credentials dialog
- Additional icons: `PlayArrowIcon`, `KeyIcon`

### Existing Dependencies (Already in project)
- `@mui/material` - UI components
- `@tanstack/react-query` - For image fetching (if using dynamic images)
- Auth utilities - Already implemented

## Implementation Steps

1. **Add state management** to `starAIWidget.tsx`
2. **Create UI section** for Python runner
3. **Implement credentials popover**
4. **Add validation logic**
5. **Integrate Skaha API call**
6. **Add error/success handling**
7. **Test with real python-runner image**
8. **Create documentation**

## Example Usage Scenario

### User Story
As a researcher, I want to:
1. Upload a Python script to VOSpace: `/arc/projects/myproject/analyze.py`
2. Select python-runner image: `images.canfar.net/skaha/python-runner:latest`
3. Provide Harbor credentials for private image
4. Execute the script with 4 cores and 8GB RAM
5. Receive notification at `https://myapi.com/callback` when complete
6. View logs to check results

### Steps in UI
1. Navigate to Star AI widget
2. Go to "Run Python Script" section
3. Enter script path: `/arc/projects/myproject/analyze.py`
4. Select image from dropdown
5. Enter callback: `https://myapi.com/callback`
6. Set resources: 4 cores, 8 GB RAM
7. Click "Registry Credentials" button
8. Enter username and Harbor CLI secret
9. Click "Execute Script"
10. See success message with session ID
11. Click "View Logs" to monitor

## Architecture Diagram

```
User Interface (Star AI Widget)
    ↓
Form Submission (handleExecuteScript)
    ↓
POST /api/sessions
    ↓
Skaha API (ws-uv.canfar.net/skaha/v0/session)
    ↓
Kubernetes Pod Created
    ↓
Python Runner Container Starts
    ↓
startup.sh executes Python script
    ↓
Optional: POST callback with results
    ↓
Container exits with script exit code
```

## Security Considerations

1. **Credentials Storage**: Store registry credentials only in component state (not localStorage)
2. **HTTPS Only**: Enforce HTTPS for callback endpoints
3. **Input Sanitization**: Sanitize script paths and command arguments
4. **Token Forwarding**: Use existing auth token forwarding mechanism
5. **Private Images**: Support both public and private Harbor images

## Performance Considerations

1. **Resource Limits**: Default to reasonable values (2 cores, 4GB RAM)
2. **Session Naming**: Use timestamp to avoid conflicts
3. **Lazy Loading**: Only fetch images when section is visible
4. **Debounce**: Debounce callback endpoint validation

## Future Enhancements

1. **Script Templates**: Pre-configured common scripts
2. **VOSpace Browser**: File picker for script selection
3. **Execution History**: Show recent script executions
4. **Progress Tracking**: Real-time status updates
5. **Batch Execution**: Run multiple scripts with replicas
6. **Environment Variables**: Custom env var configuration
7. **Result Viewer**: Display callback results in UI
8. **Log Streaming**: Live log output in widget

## Summary

This implementation adds comprehensive Python script execution capabilities to the Star AI widget, following the existing patterns from the launch session form while being simpler and more focused on the script execution use case. The UI is clean, integrated, and provides all necessary controls for authentication, configuration, and monitoring.
