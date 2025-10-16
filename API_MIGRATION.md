# API Migration Guide

This document explains the server-side API migration and how to use the new authentication-aware hooks.

## Overview

All API calls have been migrated from client-side to server-side Next.js API routes. This provides:
- ✅ Better security (API keys and endpoints not exposed to browser)
- ✅ Server-side authentication handling
- ✅ Centralized error handling
- ✅ Better performance and caching

## Important Changes

### 1. Hydration Fix

The `PlatformLoad` interface now returns `lastUpdate` as a string (ISO timestamp) instead of a `Date` object to prevent hydration mismatches.

```typescript
export interface PlatformLoad {
  // ...
  lastUpdate: string | Date; // Now supports both
}
```

### 2. NextAuth Session Endpoint

Created `/api/auth/session` to support NextAuth's SessionProvider. This endpoint:
- Returns `null` when user is not authenticated
- Returns session data when authenticated
- Integrates with our custom auth system at `/api/auth/status`

### 3. Authentication-Aware Hooks

All data-fetching hooks now accept an optional `isAuthenticated` parameter to prevent unnecessary API calls when the user is not logged in.

## Usage Examples

### Before (Old Pattern - Still Works)

```typescript
// This will make API calls even if user is not authenticated
const { data: sessions } = useSessions();
const { data: platformLoad } = usePlatformLoad();
const { data: quota } = useUserStorageQuota('username');
```

### After (Recommended Pattern)

```typescript
import { useAuthStatus } from '@/lib/hooks/useAuth';
import { useSessions } from '@/lib/hooks/useSessions';
import { usePlatformLoad } from '@/lib/hooks/usePlatformLoad';
import { useUserStorageQuota } from '@/lib/hooks/useUserStorage';

function MyComponent() {
  // 1. Check authentication status first
  const { data: authStatus } = useAuthStatus();
  const isAuthenticated = authStatus?.authenticated;

  // 2. Pass authentication status to data hooks
  const { data: sessions, isLoading } = useSessions(isAuthenticated);
  const { data: platformLoad } = usePlatformLoad(isAuthenticated);
  const { data: quota } = useUserStorageQuota(
    authStatus?.user?.username || '',
    isAuthenticated
  );

  // 3. Hooks will automatically:
  //    - Skip API calls if isAuthenticated is false
  //    - Stop refetch intervals when not authenticated
  //    - Resume fetching when user logs in

  if (!isAuthenticated) {
    return <LoginPrompt />;
  }

  return (
    <div>
      {/* Render your data */}
    </div>
  );
}
```

## API Routes

### Authentication (`/api/auth/*`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | User login |
| `/api/auth/logout` | POST | User logout |
| `/api/auth/status` | GET | Get auth status (whoami) |
| `/api/auth/session` | GET | NextAuth session endpoint |
| `/api/auth/user/[username]` | GET | Get user details |
| `/api/auth/permissions` | GET | Check user permissions |

### Sessions (`/api/sessions/*`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sessions` | GET | List all sessions |
| `/api/sessions` | POST | Launch new session |
| `/api/sessions/[id]` | GET | Get session details |
| `/api/sessions/[id]` | DELETE | Terminate session |
| `/api/sessions/[id]/renew` | POST | Extend session expiry |
| `/api/sessions/[id]/logs` | GET | Get session logs |
| `/api/sessions/[id]/events` | GET | Get session events |
| `/api/sessions/platform-load` | GET | Get platform load stats |
| `/api/sessions/images` | GET | Get container images |

### Storage (`/api/storage/*`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/storage/quota/[username]` | GET | Get user storage quota |
| `/api/storage/files/[username]` | GET | List files |
| `/api/storage/files/[username]` | POST | Upload file |
| `/api/storage/files/[username]` | PUT | Create directory |
| `/api/storage/files/[username]` | DELETE | Delete file/directory |
| `/api/storage/raw/[username]` | GET | Get raw XML storage data |

## Hook Signatures

### useSessions

```typescript
function useSessions(
  isAuthenticated?: boolean,
  options?: UseQueryOptions<Session[]>
): UseQueryResult<Session[]>
```

### usePlatformLoad

```typescript
function usePlatformLoad(
  isAuthenticated?: boolean,
  options?: UseQueryOptions<PlatformLoad>
): UseQueryResult<PlatformLoad>
```

### useUserStorageQuota

```typescript
function useUserStorageQuota(
  username: string,
  isAuthenticated?: boolean,
  options?: UseQueryOptions<UserStorageQuota>
): UseQueryResult<UserStorageQuota>
```

## Environment Variables

### Server-Side (NOT exposed to browser)

```bash
# .env.local
SERVICE_STORAGE_API=https://ws-cadc.canfar.net/cavern
LOGIN_API=https://ws-cadc.canfar.net/ac
SKAHA_API=https://ws-uv.canfar.net/skaha
API_TIMEOUT=30000
```

### Client-Side (for backward compatibility - can be removed later)

```bash
# .env.local
NEXT_PUBLIC_SERVICE_STORAGE_API=https://ws-cadc.canfar.net/cavern
NEXT_PUBLIC_LOGIN_API=https://ws-cadc.canfar.net/ac
NEXT_PUBLIC_SKAHA_API=https://ws-uv.canfar.net/skaha
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS=true
```

## Migration Checklist for Components

When updating a component that uses data hooks:

- [ ] Import `useAuthStatus` hook
- [ ] Call `useAuthStatus()` to get authentication status
- [ ] Pass `isAuthenticated` to all data-fetching hooks
- [ ] Add loading/error states for auth status
- [ ] Show login prompt if not authenticated
- [ ] Test that API calls only happen when authenticated
- [ ] Test that refetch intervals stop when logged out

## Testing

```bash
# Run build to verify TypeScript types
npm run build

# Start dev server
npm run dev

# Test scenarios:
# 1. Load page while not logged in - should NOT make API calls
# 2. Log in - should start making API calls and enable intervals
# 3. Log out - should stop all API calls and intervals
```

## Troubleshooting

### Issue: Hydration mismatch with timestamps

**Solution**: Ensure all date/time values are returned as ISO strings from the API routes, not Date objects.

### Issue: API calls happening before login

**Solution**: Make sure you're passing `isAuthenticated` to all data hooks:

```typescript
const { data: authStatus } = useAuthStatus();
const { data: sessions } = useSessions(authStatus?.authenticated);
```

### Issue: NextAuth session errors

**Solution**: The `/api/auth/session` endpoint is now available and returns session data compatible with NextAuth.

### Issue: React Query still refetching when logged out

**Solution**: Check that the hook's `enabled` option is correctly set based on `isAuthenticated`.

## Additional Resources

- [React Query Documentation](https://tanstack.com/query/latest/docs/react/overview)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [NextAuth.js](https://next-auth.js.org/)
