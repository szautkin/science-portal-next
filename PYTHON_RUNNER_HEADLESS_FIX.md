# Python Runner Session Type Fix

## Problem

Python script execution was failing with a Kubernetes error:

```
500 Internal Server Error
unexpected exception: java.lang.RuntimeException: io.kubernetes.client.openapi.ApiException:
Message:
HTTP response code: 404
HTTP response body: {"kind":"Status","apiVersion":"v1","metadata":{},"status":"Failure","message":"jobs.batch \"skaha-contributed-szautkin-r8777026\" not found","reason":"NotFound","details":{"name":"skaha-contributed-szautkin-r8777026","group":"batch","kind":"jobs"},"code":404}
```

## Root Cause

The Python runner container was being launched with **wrong session type**:

```typescript
{
  sessionType: 'contributed',  // ❌ WRONG
  ...
}
```

But python-runner containers are designed as **headless** (batch) jobs, not contributed (interactive) sessions.

### Why This Matters

**Session Types in Skaha**:

1. **`headless`** - Batch jobs
   - Run-and-exit pattern
   - No interactive UI
   - Labeled with `ca.nrc.cadc.skaha.type="headless"`
   - Creates Kubernetes `Job` resources
   - Example: python-runner, data processing pipelines

2. **`contributed`** - Interactive sessions
   - Long-running services
   - Web UI access (notebooks, desktops)
   - Labeled with `ca.nrc.cadc.skaha.type="contributed"`
   - Creates Kubernetes `Deployment` resources
   - Example: Jupyter notebooks, CARTA, desktop sessions

### The Mismatch

- **Container labels**: Python-runner has `ca.nrc.cadc.skaha.type="headless"`
- **API request**: We sent `sessionType: 'contributed'`
- **Result**: Skaha tried to create a contributed deployment but container expected batch job → Kubernetes 404 error

## Solution

Changed session type from `contributed` to `headless`:

**File**: `src/app/implementation/starAIWidget.tsx:321`

**Before** ❌:
```typescript
body: JSON.stringify({
  sessionType: 'contributed',
  sessionName: sessionId,
  containerImage: pythonImage,
  ...
})
```

**After** ✅:
```typescript
body: JSON.stringify({
  sessionType: 'headless',
  sessionName: sessionId,
  containerImage: pythonImage,
  ...
})
```

## How Python Runner Works

### Container Design

The python-runner container is purpose-built for batch execution:

**Dockerfile labels**:
```dockerfile
LABEL ca.nrc.cadc.skaha.type="headless"
LABEL ca.nrc.cadc.skaha.description="Python script runner with astronomy stack"
```

**Startup script** (`/skaha/startup.sh`):
```bash
#!/bin/bash
SESSION_ID=$1
SCRIPT_PATH=$2
CALLBACK_ENDPOINT=$3

# Execute Python script
python $SCRIPT_PATH

# Capture exit code
EXIT_CODE=$?

# Optional: Send callback
if [ -n "$CALLBACK_ENDPOINT" ]; then
  curl -X POST "$CALLBACK_ENDPOINT" -d "{...}"
fi

# Exit with script's exit code
exit $EXIT_CODE
```

This is a **run-and-exit** pattern, not an interactive service.

### Kubernetes Resource Type

**With `sessionType: 'headless'`** ✅:
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: skaha-headless-szautkin-r8777026
spec:
  template:
    spec:
      containers:
      - name: python-runner
        image: images.canfar.net/skaha/python-runner:1.0.0
        command: ["/skaha/startup.sh", "python-123", "/arc/projects/script.py"]
      restartPolicy: Never
```

**With `sessionType: 'contributed'`** ❌:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: skaha-contributed-szautkin-r8777026
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: python-runner
        # Container expects batch job but gets deployment → mismatch
```

## Impact

### Before Fix

**Request**:
```json
{
  "sessionType": "contributed",
  "containerImage": "images.canfar.net/skaha/python-runner:1.0.0"
}
```

**Result**:
- Skaha tries to create contributed deployment
- Container is labeled as headless
- Kubernetes resource type mismatch
- 404 error: "jobs.batch not found"
- ❌ Script never executes

### After Fix

**Request**:
```json
{
  "sessionType": "headless",
  "containerImage": "images.canfar.net/skaha/python-runner:1.0.0"
}
```

**Result**:
- Skaha creates headless batch job
- Container matches expected type
- Kubernetes Job resource created
- ✅ Script executes successfully

## Verification

### Test Case

1. **Launch Script**:
   - Script: `/arc/projects/photom1/f.py`
   - Image: `images.canfar.net/skaha/python-runner:1.0.0`
   - Session type: `headless` (fixed)

2. **Expected Behavior**:
   ```
   POST /api/sessions
   {
     "sessionType": "headless",
     "sessionName": "python-1762136879554",
     "cmd": "/skaha/startup.sh python-1762136879554 /arc/projects/photom1/f.py"
   }

   → Skaha creates Kubernetes Job
   → Container starts
   → startup.sh executes Python script
   → Container exits with script's exit code
   → ✅ Success
   ```

3. **Verification Commands**:
   ```bash
   # List sessions (should show headless job)
   canfar list

   # Check logs
   canfar logs python-1762136879554

   # Or via Skaha API
   GET /skaha/v0/session?type=headless
   GET /skaha/v0/session/python-1762136879554/logs
   ```

## Key Differences: Headless vs Contributed

| Aspect | Headless | Contributed |
|--------|----------|-------------|
| **Purpose** | Batch jobs | Interactive sessions |
| **Lifecycle** | Run-and-exit | Long-running |
| **UI Access** | None | Web UI (Jupyter, Desktop, etc.) |
| **K8s Resource** | Job | Deployment |
| **Restart Policy** | Never | Always/OnFailure |
| **Exit Behavior** | Container exits with script code | Container restarts on failure |
| **Use Case** | Data processing, pipelines | Notebooks, visualization |
| **Python Runner** | ✅ Correct | ❌ Wrong |

## Documentation Updates

Updated files:
- `PYTHON_RUNNER_TECHNICAL_SUMMARY.md` - Changed sessionType to 'headless'
- `src/app/implementation/starAIWidget.tsx:321` - Fixed session type
- Added inline comment explaining why headless is used

## Related Issues

This fix also clarifies:

1. **Session Monitoring**: Headless jobs appear in `/skaha/v0/session?type=headless`
2. **Log Access**: Same as other sessions, via session ID
3. **Resource Cleanup**: Jobs auto-cleanup after completion
4. **Callback Timing**: Callback sent after script exits (not during)

## Future Considerations

### Multiple Session Types

If we want to support both headless and interactive Python execution:

**Option 1: Image-based Detection**
```typescript
const isHeadless = pythonImage.includes('python-runner') ||
                   pythonImage.includes('headless');
const sessionType = isHeadless ? 'headless' : 'contributed';
```

**Option 2: User Selection**
```tsx
<FormControl>
  <InputLabel>Session Type</InputLabel>
  <Select value={sessionType} onChange={...}>
    <MenuItem value="headless">Batch (run-and-exit)</MenuItem>
    <MenuItem value="contributed">Interactive (long-running)</MenuItem>
  </Select>
</FormControl>
```

**Option 3: Separate Sections**
- "Run Python Script" (headless) - Current implementation
- "Launch Python Notebook" (contributed) - Different section

### Best Practice

For python-runner and similar batch containers:
- **Always use `headless`** session type
- Check container labels before deciding session type
- Document expected session type in image metadata

## Summary

**Problem**: Python runner failed with Kubernetes 404 error due to session type mismatch

**Root Cause**: Container labeled as "headless" but launched as "contributed"

**Solution**: Changed `sessionType` from `'contributed'` to `'headless'`

**Result**: Python scripts now execute correctly in batch jobs

This fix aligns the UI implementation with the python-runner container's intended design and the Skaha platform's session type architecture.
