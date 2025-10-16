# Login Setup & Testing Guide

## Overview

The login system is now fully configured with:
- ✅ Server-side API routes with detailed logging
- ✅ Form-urlencoded credentials for CADC API
- ✅ Cookie forwarding and management
- ✅ Stable UI without flickering
- ✅ Proper authentication state handling

## Quick Start

```bash
# Start the development server
npm run dev

# Open browser to http://localhost:3000
# Click "Account" → "Login"
# Enter your CADC credentials
# Watch terminal for detailed logs
```

## What's Fixed

### 1. ✅ Login API Content-Type

**Problem**: Was sending JSON, CADC expects form-urlencoded

**Solution**: Automatic conversion in `/api/auth/login`

```typescript
// Client sends JSON
{ "username": "user", "password": "pass" }

// API converts to form-urlencoded for CADC
username=user&password=pass
Content-Type: application/x-www-form-urlencoded
```

### 2. ✅ AppBar Flickering

**Problem**: AppBar menu changed while checking auth status

**Solution**:
- Added `initialData: { authenticated: false }` to prevent undefined state
- Added `isLoading` check to hide menu items during auth check
- Menu stays stable until auth status is confirmed

```typescript
// Before
const { data: authStatus } = useAuthStatus();
// authStatus is undefined initially → causes flicker

// After
const { data: authStatus, isLoading: isCheckingAuth } = useAuthStatus();
// authStatus is { authenticated: false } initially → no flicker
// isCheckingAuth prevents menu from showing during check
```

### 3. ✅ Comprehensive Logging

All API routes now log:
- Request headers and cookies
- Request body (passwords redacted)
- External API calls
- Response data
- Errors with stack traces
- Request duration

## Login Flow

```
1. User opens login modal
   └─> LoginModal component

2. User submits credentials
   └─> POST /api/auth/login (JSON)

3. API converts to form-urlencoded
   └─> POST https://ws-cadc.canfar.net/ac/login (form data)

4. CADC authenticates
   └─> Returns plain text response + CADC_SSO cookie

5. API forwards cookie to client
   └─> Sets cookie in browser
   └─> Returns user data (username from request)

6. Auth status updates
   └─> useAuthStatus() refetches
   └─> AppBar shows user name
   └─> Other components get authenticated state
```

## Logout Flow

```
1. User clicks Logout
   └─> POST /api/auth/logout

2. Server clears authentication cookies
   └─> Expires CADC_SSO cookie
   └─> Expires JSESSIONID cookie
   └─> No external API call needed

3. React Query cache cleared
   └─> queryClient.clear()
   └─> All cached data removed

4. UI updates
   └─> AppBar shows "Account" button
   └─> User redirected to logged-out state
```

## Testing the Login

### 1. Check Initial State (Not Logged In)

```bash
npm run dev
```

Open http://localhost:3000

**Expected**:
- ✅ AppBar shows "Account" button
- ✅ No flickering or changes
- ✅ Terminal shows auth status check:
  ```
  📥 INCOMING REQUEST: GET /api/auth/status
  🌐 EXTERNAL API CALL: GET https://ws-cadc.canfar.net/ac/whoami
  ℹ️  User not authenticated
  ```

### 2. Test Login

Click "Account" → "Login"

Enter credentials and submit

**Expected Terminal Logs**:
```
================================================================================
📥 INCOMING REQUEST: POST /api/auth/login
================================================================================
📦 Request Body:
{
  "username": "youruser",
  "password": "***REDACTED***"
}

ℹ️  [/api/auth/login] Sending form-urlencoded credentials

--------------------------------------------------------------------------------
🌐 EXTERNAL API CALL: POST https://ws-cadc.canfar.net/ac/login
--------------------------------------------------------------------------------
📋 Headers being sent:
{
  "Content-Type": "application/x-www-form-urlencoded"
}

--------------------------------------------------------------------------------
📡 EXTERNAL API RESPONSE
--------------------------------------------------------------------------------
📊 Status: 200 OK
📦 Response Data:
{
  "username": "youruser",
  "displayName": "Your Name",
  "email": "you@example.com"
}

ℹ️  [/api/auth/login] Setting cookies from external API

✅ SUCCESS RESPONSE: POST /api/auth/login
⏱️  Duration: 234ms
```

**Expected UI**:
- ✅ Login modal closes
- ✅ AppBar updates to show your name
- ✅ Menu items change to authenticated options
- ✅ No flickering during transition

### 3. Verify Auth Persistence

Refresh the page (F5)

**Expected**:
- ✅ Still logged in (cookie persists)
- ✅ AppBar shows your name immediately
- ✅ Terminal logs show successful auth check with user data

### 4. Test Logout

Click your name → "Logout"

**Expected Terminal Logs**:
```
================================================================================
📥 INCOMING REQUEST: POST /api/auth/logout
================================================================================

ℹ️  [/api/auth/logout] Clearing authentication cookies
ℹ️  [/api/auth/logout] Cleared cookie: CADC_SSO
ℹ️  [/api/auth/logout] Cleared cookie: JSESSIONID

✅ SUCCESS RESPONSE: POST /api/auth/logout
⏱️  Duration: 5ms
```

**Expected UI**:
- ✅ AppBar returns to "Account"
- ✅ Menu shows "Login" option
- ✅ All React Query cache cleared (no cached sessions, platform load, etc.)
- ✅ Auth status immediately updates to unauthenticated

## Troubleshooting

### Login fails with 401

**Check logs for**:
1. Is Content-Type `application/x-www-form-urlencoded`?
2. Is the username/password being sent?
3. What's the exact error from CADC?

```bash
# Look for this in terminal:
📡 EXTERNAL API RESPONSE
📊 Status: 401 Unauthorized
```

### Cookies not being set

**Check logs for**:
```bash
# Should see this after successful login:
ℹ️  [/api/auth/login] Setting cookies from external API
{
  "cookies": "CADC_SSO=..."
}
```

If missing, CADC didn't return cookies.

### AppBar still flickering

**Check**:
1. Does `useAuthStatus()` have `initialData`?
2. Is `isCheckingAuth` being used in AppBarWithAuth?
3. Are you running the latest code?

```bash
# Verify the fix:
grep -A 5 "initialData" src/lib/hooks/useAuth.ts
# Should show: initialData: { authenticated: false }
```

### Auth status always false after login

**Check logs for**:
1. Was CADC_SSO cookie set in login response?
2. Is cookie being forwarded in subsequent /api/auth/status calls?

```bash
# Look for cookies in status check:
📥 INCOMING REQUEST: GET /api/auth/status
🍪 Cookies:
  - CADC_SSO: abc123...
```

## Environment Variables

Verify these are set in `.env.local`:

```bash
# Server-side (used by API routes)
LOGIN_API=https://ws-cadc.canfar.net/ac
SERVICE_STORAGE_API=https://ws-cadc.canfar.net/cavern
SKAHA_API=https://ws-uv.canfar.net/skaha
API_TIMEOUT=30000

# Client-side (for backward compatibility)
NEXT_PUBLIC_LOGIN_API=https://ws-cadc.canfar.net/ac
NEXT_PUBLIC_SERVICE_STORAGE_API=https://ws-cadc.canfar.net/cavern
NEXT_PUBLIC_SKAHA_API=https://ws-uv.canfar.net/skaha
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS=true
```

## Key Files

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts          # ✅ Login with form-urlencoded
│   │   │   ├── status/route.ts         # ✅ Auth status check
│   │   │   ├── session/route.ts        # ✅ NextAuth compatibility
│   │   │   └── logout/route.ts         # ✅ Cookie clearing (no external API)
│   │   └── lib/
│   │       ├── logger.ts               # ✅ Comprehensive logging
│   │       ├── api-utils.ts            # API utilities
│   │       └── server-config.ts        # Server config
│   └── components/
│       ├── AppBarWithAuth/
│       │   └── AppBarWithAuth.tsx      # ✅ No flickering
│       └── LoginModal/
│           └── LoginModal.tsx          # Login form
└── lib/
    ├── hooks/
    │   └── useAuth.ts                  # ✅ Initial data, stable state
    └── api/
        └── login.ts                    # Client API calls

Documentation:
├── LOGGING_GUIDE.md                    # How to use logging
├── API_MIGRATION.md                    # Server-side migration guide
└── LOGIN_SETUP.md                      # This file
```

## Next Steps

After successful login testing:

1. **Update other components** to use authenticated state:
   ```typescript
   const { data: authStatus } = useAuthStatus();
   const isAuthenticated = authStatus?.authenticated;

   const { data: sessions } = useSessions(isAuthenticated);
   const { data: platformLoad } = usePlatformLoad(isAuthenticated);
   ```

2. **Remove legacy client-side environment variables** (optional):
   - Once all APIs work, remove `NEXT_PUBLIC_*` versions
   - Keep server-side versions only

3. **Test full workflow**:
   - Login → View sessions → Launch session → Logout

## Common Issues

### "ECONNREFUSED" error

CADC API is down or unreachable.

**Check**:
```bash
curl -i https://ws-cadc.canfar.net/ac/whoami
```

### "Network timeout"

API taking too long (> 30s).

**Increase timeout** in `.env.local`:
```bash
API_TIMEOUT=60000  # 60 seconds
```

### React Query DevTools not showing

Enable in `.env.local`:
```bash
NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS=true
```

Restart dev server.

## Support

For issues:
1. Check terminal logs for detailed error info
2. Verify environment variables are set
3. Test CADC API directly with curl
4. Check browser Network tab for cookie handling
5. Check browser Console for client-side errors
