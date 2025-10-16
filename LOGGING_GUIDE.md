# Backend API Logging Guide

## Overview

All API routes now include comprehensive logging to help debug authentication and API call issues.

## Logging Features

### What Gets Logged

1. **Incoming Requests**
   - HTTP method and URL
   - Headers (with sensitive data masked)
   - Cookies (truncated for security)
   - Request body (with passwords redacted)

2. **External API Calls**
   - Target URL and method
   - Headers being sent
   - Response status and data

3. **Response Data**
   - Status code
   - Response payload (with sensitive fields masked)
   - Request duration

4. **Errors**
   - Error messages
   - Stack traces
   - Status codes

## How to Use

### Start Dev Server

```bash
npm run dev
```

The server logs will appear in your terminal with clear, formatted output.

### Log Format

```
================================================================================
📥 INCOMING REQUEST: POST /api/auth/login
================================================================================
⏰ Timestamp: 2025-10-16T16:45:23.123Z
🔗 URL: http://localhost:3000/api/auth/login

📋 Headers:
{
  "content-type": "application/json",
  "cookie": "session_token=abc123..."
}

🍪 Cookies:
  - session_token: abc123defgh...
  - refresh_token: xyz789...

📦 Request Body:
{
  "username": "testuser",
  "password": "***REDACTED***"
}
================================================================================

--------------------------------------------------------------------------------
🌐 EXTERNAL API CALL: POST https://ws-cadc.canfar.net/ac/login
--------------------------------------------------------------------------------

📋 Headers being sent:
{
  "Cookie": "session_token=abc123...",
  "Content-Type": "application/json"
}
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
📡 EXTERNAL API RESPONSE
--------------------------------------------------------------------------------
📊 Status: 200 OK

📦 Response Data:
{
  "username": "testuser",
  "displayName": "Test User",
  "email": "test@example.com"
}
--------------------------------------------------------------------------------

ℹ️  [/api/auth/login] Setting cookies from external API
{
  "cookies": "CADC_SSO=abcd1234efgh5678..."
}

================================================================================
✅ SUCCESS RESPONSE: POST /api/auth/login
================================================================================
📊 Status: 200

📦 Response Data:
{
  "username": "testuser",
  "displayName": "Test User",
  "email": "test@example.com"
}

⏱️  Duration: 234ms
================================================================================
```

## Logged Routes

Currently logging is enabled on:

- ✅ `/api/auth/login` - Login with full request/response logging
- ✅ `/api/auth/status` - Auth status checks with cookie forwarding details

## Adding Logging to New Routes

To add logging to a new API route:

```typescript
import { createLogger } from '@/app/api/lib/logger';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = createLogger('/api/your-route', 'GET');

  // Log incoming request
  logger.logRequest(request);

  // Log external API call
  const externalUrl = 'https://external-api.com/endpoint';
  logger.logExternalCall(externalUrl, 'GET', headers);

  const response = await fetchExternalApi(externalUrl, ...);

  // Log external response
  logger.logExternalResponse(response.status, response.statusText, data);

  // Log success
  logger.logSuccess(200, responseData);

  return successResponse(responseData);
});
```

## Security Features

### Automatic Redaction

The logger automatically masks sensitive data:

- **Passwords**: `***REDACTED***`
- **Tokens**: First 20 characters + `...`
- **Cookies**: First 30 characters + `...`
- **Authorization headers**: First 20 characters + `...`

### Example

```json
// Input
{
  "username": "testuser",
  "password": "mySecretPassword123"
}

// Logged as
{
  "username": "testuser",
  "password": "***REDACTED***"
}
```

## Troubleshooting with Logs

### Login Not Working

Look for:
1. **Request headers** - Are cookies being forwarded?
2. **External API call** - Is the right URL being called?
3. **External API response** - What status code is returned?
4. **Set-cookie headers** - Are cookies being returned and forwarded?

### Auth Status Always False

Look for:
1. **Cookies in request** - Are cookies present in the `/api/auth/status` call?
2. **External API response** - What status (401/403) is being returned?
3. **External API data** - Is user data being returned?

### Example Debug Flow

```
1. User submits login form
   → Check: Request body has username (password redacted)
   → Note: Client sends JSON, but API converts to form-urlencoded

2. API converts credentials to form-urlencoded
   → Check: "Sending form-urlencoded credentials" log appears
   → Check: Content-Type is application/x-www-form-urlencoded

3. API calls external auth service (CADC)
   → Check: External URL is correct (https://ws-cadc.canfar.net/ac/login)
   → Check: Headers include cookies if present
   → Check: Body is form-urlencoded: username=X&password=Y

4. External service responds
   → Check: Status 200 = success, 401 = invalid credentials
   → Check: Response contains user data (username, displayName, email)

5. Set cookies from external response
   → Check: "Setting cookies from external API" message appears
   → Check: CADC_SSO cookie or similar is being set

6. Return success to client
   → Check: Response data includes user info
   → Check: Duration is reasonable (< 5s)
```

## Important: Content-Type Handling

The login flow uses different content types:

1. **Client → Next.js API**: `application/json`
   ```json
   { "username": "user", "password": "pass" }
   ```

2. **Next.js API → CADC**: `application/x-www-form-urlencoded`
   ```
   username=user&password=pass
   ```

This conversion happens automatically in `/api/auth/login` route.

## Performance Monitoring

Each request logs its duration:

```
⏱️  Duration: 234ms
```

Typical durations:
- **Login**: 200-500ms (external API call)
- **Auth Status**: 100-300ms (external API call)
- **Sessions**: 100-500ms (depends on data size)

If durations exceed 2-3 seconds, investigate:
- Network connectivity
- External API performance
- Timeout settings (default 30s)

## Environment Variables

Check these if external API calls fail:

```bash
# Server-side (used by API routes)
SERVICE_STORAGE_API=https://ws-cadc.canfar.net/cavern
LOGIN_API=https://ws-cadc.canfar.net/ac
SKAHA_API=https://ws-uv.canfar.net/skaha
API_TIMEOUT=30000
```

Verify with:
```bash
grep -E "LOGIN_API|SERVICE_STORAGE_API|SKAHA_API" .env.local
```
