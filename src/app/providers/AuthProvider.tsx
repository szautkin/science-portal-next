'use client';

import { SessionProvider } from 'next-auth/react';

/**
 * Auth Provider - Mode-aware authentication wrapper
 *
 * - OIDC mode: Uses NextAuth's SessionProvider with automatic polling
 * - CANFAR mode: Uses SessionProvider but disables automatic polling (cookie-based auth)
 *
 * Note: We keep SessionProvider in both modes because useSession() hook requires it,
 * but we disable automatic session refetching in CANFAR mode.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isCANFAR = process.env.NEXT_PUBLIC_USE_CANFAR === 'true';

  return (
    <SessionProvider
      // In CANFAR mode, disable automatic session polling
      // We use cookie-based auth, so no need for client-side session checks
      refetchInterval={isCANFAR ? 0 : 300} // 0 = disabled, 300 = 5 minutes for OIDC
      refetchOnWindowFocus={!isCANFAR} // Disable for CANFAR, enable for OIDC
    >
      {children}
    </SessionProvider>
  );
}
