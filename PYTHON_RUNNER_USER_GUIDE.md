# Python Script Runner - User Guide

## Overview

The Python Script Runner in the Star AI widget allows you to execute Python scripts in containerized environments using the CANFAR Skaha platform. This feature enables running astronomy and data science workloads on scalable infrastructure.

## Location

**Navigation**: Science Portal → Star AI Widget → "Run Python Script" section

The widget has three sections:
- **Create Folder** (left)
- **Create File** (center)
- **Run Python Script** (right)

## Features

✅ Execute Python scripts from VOSpace storage
✅ Use pre-built Python runner containers
✅ Configure compute resources (CPU, RAM)
✅ Optional HTTP callback for completion notifications
✅ Support for private Harbor registry images
✅ Real-time session tracking

## Quick Start

### Basic Usage (3 Steps)

1. **Enter Script Path**:
   ```
   /arc/projects/myproject/analyze.py
   ```

2. **Select Container Image** (dropdown):
   - `python-runner:latest` (recommended)
   - `python-runner:1.0.0` (stable)

3. **Click "Execute Script"**

That's it! Your script will run in a container with default resources (2 cores, 4 GB RAM).

## Detailed Usage

### 1. Script Path

**Format**: Full path to your Python script in VOSpace

**Examples**:
```
/arc/projects/astronomy/process_fits.py
/arc/home/username/scripts/analyze.py
/arc/projects/team/pipelines/reduction.py
```

**Requirements**:
- Script must exist in VOSpace
- Must be a `.py` file
- Must have execute permissions (handled by container)

**How to Upload Scripts**:
Use the VOSpace Storage widget or Star AI widget to create/upload your script:
1. Go to "Create File" section
2. Choose location
3. Select "Python" content type
4. Paste your Python code
5. Create the file

### 2. Container Image Selection

**Available Images**:

| Image | Description | Packages |
|-------|-------------|----------|
| `python-runner:latest` | Latest version with all updates | Python 3.11, astropy, numpy, scipy, pandas, matplotlib, scikit-learn, astroquery |
| `python-runner:1.0.0` | Stable release for production | Same as latest |

**Custom Images**:
You can use your own Docker images from Harbor registry. Requirements:
- Must be tagged as "contributed" in Harbor
- Must include `/skaha/startup.sh` script
- Must have proper Skaha labels

### 3. Resource Allocation

#### CPU Cores
- **Range**: 1-8 cores
- **Default**: 2 cores
- **Recommendation**:
  - Simple scripts: 1-2 cores
  - Parallel processing: 4-8 cores
  - I/O heavy: 1-2 cores

#### RAM (Memory)
- **Range**: 1-32 GB
- **Default**: 4 GB
- **Recommendation**:
  - Small datasets: 2-4 GB
  - Medium data: 8-16 GB
  - Large arrays: 16-32 GB
  - FITS files: ~2x file size

**Resource Tips**:
- Start small and increase if needed
- Monitor logs for out-of-memory errors
- More cores ≠ faster (unless code is parallelized)
- RAM usage depends on your data size

### 4. Callback Endpoint (Optional)

Get notified when your script completes.

**Format**: `https://api.example.com/callback`

**What You Receive**:
```json
POST to your endpoint
{
  "session_id": "python-1730534400000",
  "script_path": "/arc/projects/myproject/script.py",
  "exit_code": 0,
  "timestamp": "2025-11-02T12:34:56Z",
  "status": "success"
}
```

**Status Values**:
- `"success"` - Script exited with code 0
- `"failed"` - Script exited with non-zero code

**Use Cases**:
- Trigger downstream workflows
- Update dashboards
- Send notifications (email, Slack, etc.)
- Log completion in your database
- Chain multiple scripts together

**Requirements**:
- Must be HTTPS (not HTTP)
- Must accept POST requests
- Should respond within 30 seconds
- Endpoint must be publicly accessible

### 5. Registry Credentials

Required for **private Harbor images** only. Public images don't need credentials.

#### How to Get Harbor CLI Secret

1. Log in to CANFAR: https://www.canfar.net/
2. Go to User Profile
3. Find "Harbor CLI Secret"
4. Copy the secret value

#### Entering Credentials

1. Click **"Registry Credentials"** button (key icon)
2. Popover opens with two fields:
   - **Username**: Your CADC username
   - **Secret**: Harbor CLI Secret from profile
3. Click **"Save"**

**Credentials are stored**:
- In component state only (memory)
- Not in browser storage
- Not sent to any server except Skaha API
- Cleared when page refreshes

## Complete Workflow Example

### Scenario: Process Astronomical Images

**Goal**: Run a FITS image processing pipeline

#### Step 1: Prepare Script

Create script in VOSpace (`/arc/projects/astronomy/process_images.py`):

```python
#!/usr/bin/env python3
"""
Process FITS images: background subtraction and source detection
"""
from astropy.io import fits
from photutils import Background2D, MedianBackground
from photutils.detection import DAOStarFinder
import numpy as np

def process_image(input_path, output_path):
    # Load FITS file
    with fits.open(input_path) as hdul:
        data = hdul[0].data
        header = hdul[0].header

    # Background estimation
    bkg_estimator = MedianBackground()
    bkg = Background2D(data, (50, 50), filter_size=(3, 3),
                       bkg_estimator=bkg_estimator)

    # Subtract background
    data_sub = data - bkg.background

    # Source detection
    mean, median, std = np.mean(data_sub), np.median(data_sub), np.std(data_sub)
    daofind = DAOStarFinder(fwhm=3.0, threshold=5.*std)
    sources = daofind(data_sub - median)

    print(f"Found {len(sources)} sources")

    # Save result
    fits.writeto(output_path, data_sub, header, overwrite=True)

    return len(sources)

if __name__ == "__main__":
    import sys
    input_file = sys.argv[1] if len(sys.argv) > 1 else "/arc/data/input.fits"
    output_file = sys.argv[2] if len(sys.argv) > 2 else "/arc/data/output.fits"

    num_sources = process_image(input_file, output_file)
    print(f"Processing complete. Detected {num_sources} sources.")
    sys.exit(0)
```

#### Step 2: Configure Execution

In Star AI widget → Run Python Script section:

1. **Script Path**:
   ```
   /arc/projects/astronomy/process_images.py
   ```

2. **Container Image**: Select `python-runner:latest`

3. **Callback Endpoint** (optional):
   ```
   https://myapi.example.com/astronomy/callback
   ```

4. **Resources**:
   - CPU Cores: 4 (parallel processing)
   - RAM: 16 GB (large FITS files)

5. **Registry Credentials**: (Skip if using public image)

#### Step 3: Execute

Click **"Execute Script"** button

**Result**:
```
✅ Script execution started!
   Session ID: python-1730534400000
   Waiting for callback...
```

#### Step 4: Monitor

Option 1: **Check Logs**
```bash
# Via canfar CLI
canfar logs python-1730534400000

# Via Skaha API
GET /skaha/v0/session/python-1730534400000/logs
```

Option 2: **Wait for Callback**
Your endpoint receives:
```json
{
  "session_id": "python-1730534400000",
  "script_path": "/arc/projects/astronomy/process_images.py",
  "exit_code": 0,
  "timestamp": "2025-11-02T12:45:30Z",
  "status": "success"
}
```

## Troubleshooting

### Error: "Script path is required"
**Cause**: Script path field is empty
**Solution**: Enter full path to your Python script

### Error: "Container image is required"
**Cause**: No image selected from dropdown
**Solution**: Select an image from the dropdown menu

### Error: "Authentication required"
**Cause**: Not logged in to CANFAR
**Solution**: Log in at the top of the page

### Error: "Failed to launch session: 401 Unauthorized"
**Cause**: Session/token expired
**Solution**: Refresh page and log in again

### Error: "Failed to launch session: 403 Forbidden"
**Cause**: Invalid registry credentials or no access to image
**Solution**:
- Verify Harbor CLI secret is correct
- Check image exists and is tagged as "contributed"
- Ensure you have access to the Harbor project

### Error: "Script not found"
**Cause**: Script doesn't exist at the specified path
**Solution**:
- Verify path is correct (case-sensitive)
- Check VOSpace Storage widget to see files
- Ensure script was uploaded successfully

### Script Fails (Exit Code ≠ 0)
**Check logs** to see error messages:
```bash
canfar logs python-1730534400000
```

**Common Issues**:
- **ImportError**: Missing Python package (not in python-runner image)
- **FileNotFoundError**: Data file path incorrect
- **MemoryError**: Increase RAM allocation
- **Timeout**: Script takes too long (increase resources)

### No Callback Received
**Possible Causes**:
1. Callback endpoint is down/unreachable
2. Endpoint doesn't accept POST requests
3. Script failed (check logs)
4. Network issue from Skaha to your endpoint

**Debug Steps**:
1. Test endpoint manually: `curl -X POST https://your-endpoint`
2. Check firewall rules (must allow Skaha IP range)
3. Review script logs for errors
4. Verify callback URL is correct (https, not http)

## Best Practices

### Script Design

1. **Use argparse for parameters**:
   ```python
   import argparse
   parser = argparse.ArgumentParser()
   parser.add_argument('--input', required=True)
   parser.add_argument('--output', required=True)
   args = parser.parse_args()
   ```

2. **Print progress for monitoring**:
   ```python
   print("Step 1: Loading data...")
   print("Step 2: Processing...")
   print("Step 3: Saving results...")
   ```

3. **Handle errors gracefully**:
   ```python
   try:
       process_data()
   except Exception as e:
       print(f"ERROR: {e}")
       sys.exit(1)
   ```

4. **Exit with proper codes**:
   ```python
   sys.exit(0)  # Success
   sys.exit(1)  # Error
   ```

### Resource Optimization

1. **Start small**: Begin with 2 cores, 4 GB RAM
2. **Monitor first run**: Check logs for performance
3. **Scale up if needed**: Increase resources gradually
4. **Parallel processing**: Use multiprocessing for CPU-bound tasks
5. **Memory management**: Free unused variables, use generators

### Security

1. **Don't hardcode secrets**: Use environment variables or VOSpace files
2. **Validate inputs**: Check file paths before processing
3. **Secure callbacks**: Use HTTPS, validate requests
4. **Limit exposure**: Don't expose sensitive data in logs

### Production Usage

1. **Version control**: Tag your container images with versions
2. **Test locally**: Test scripts before running on Skaha
3. **Document scripts**: Add comments and docstrings
4. **Error handling**: Implement retry logic if needed
5. **Logging**: Use Python logging module for better output

## Advanced Topics

### Environment Variables

The python-runner automatically sets:
- `PYTHONUNBUFFERED=1` - Real-time output (no buffering)
- `PYTHONDONTWRITEBYTECODE=1` - No .pyc files

Access in your script:
```python
import os
session_id = os.environ.get('SESSION_ID')
```

### Multiple Script Execution

To run the same script multiple times:

**Option 1: Sequential**
Execute → Wait for completion → Execute again

**Option 2: Parallel (Replicas)**
Use Skaha API directly with `replicas` parameter:
```bash
curl -X POST "https://ws-uv.canfar.net/skaha/v0/session" \
  -F "replicas=10" \
  ...
```

### Custom Docker Images

Build your own python-runner variant:

1. Create Dockerfile:
```dockerfile
FROM images.canfar.net/skaha/python-runner:latest

# Add custom packages
RUN pip install my-custom-package

# Add startup script
COPY startup.sh /skaha/startup.sh
RUN chmod +x /skaha/startup.sh

# Skaha labels
LABEL ca.nrc.cadc.skaha.type="headless"
LABEL ca.nrc.cadc.skaha.description="Custom Python Runner"
```

2. Build and push:
```bash
docker build -t images.canfar.net/myproject/custom-runner:1.0.0 .
docker push images.canfar.net/myproject/custom-runner:1.0.0
```

3. Tag as "contributed" in Harbor web interface

4. Use in Star AI widget!

## FAQ

### Q: How long can scripts run?
**A**: Default timeout is usually 24 hours. Check with Skaha administrator for limits.

### Q: Can I access my VOSpace files?
**A**: Yes! VOSpace is mounted at `/arc/`. Use full paths like `/arc/projects/myproject/data.fits`.

### Q: What Python version is used?
**A**: Python 3.11 (as of python-runner:latest)

### Q: What packages are pre-installed?
**A**: astropy, numpy, scipy, matplotlib, pandas, scikit-learn, astroquery, photutils, specutils, h5py, fitsio, and more. See python-runner documentation for full list.

### Q: Can I install additional packages?
**A**: Not at runtime. You need to create a custom Docker image with your packages pre-installed.

### Q: Is my data secure?
**A**: Yes. Scripts run in isolated containers. Only you can access your VOSpace files.

### Q: Can I see other users' scripts?
**A**: No. Each user has isolated VOSpace storage.

### Q: What happens if my script crashes?
**A**: The container exits with non-zero exit code. Check logs to see the error.

### Q: Can I schedule scripts?
**A**: Not directly. Use external schedulers (cron, Airflow) to call the Skaha API.

### Q: Where do I find session logs after execution?
**A**: Use `canfar logs <session-id>` or GET `/skaha/v0/session/<session-id>/logs`

## Support

- **Documentation**: https://www.opencadc.org/science-containers/
- **CANFAR Support**: support@canfar.net
- **GitHub Issues**: https://github.com/opencadc/science-platform/issues
- **Slack**: #canfar on astropy.slack.com

## Related Resources

- [CANFAR Documentation](https://www.canfar.net/en/docs/)
- [Skaha API Reference](https://ws-uv.canfar.net/skaha/)
- [Python Runner Project](https://github.com/your-org/python-runner)
- [VOSpace Guide](https://www.canfar.net/en/docs/storage/)
- [Harbor Registry](https://images.canfar.net/)

## Summary

The Python Script Runner provides a streamlined interface for executing astronomy and data science workflows on CANFAR infrastructure. With built-in support for:

✅ Pre-configured Python environments
✅ VOSpace integration
✅ Scalable compute resources
✅ Callback notifications
✅ Private image support

You can focus on your science while the platform handles the infrastructure.

Happy computing! 🚀
