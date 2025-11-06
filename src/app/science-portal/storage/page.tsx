'use client';

import { useCallback } from 'react';
import { useAuthStatus } from '@/lib/hooks/useAuth';
import { VOSpaceStorageWidget } from '@/app/components/VOSpaceStorageWidget/VOSpaceStorageWidget';
import { UserStorageWidget } from '@/app/components/UserStorageWidget/UserStorageWidget';
import { Box } from '@/app/components/Box/Box';
import { Container } from '@mui/material';

/**
 * Storage Page
 *
 * Displays VO Space storage management and user storage information.
 * Features an 80/20 split layout:
 * - VOSpaceStorageWidget (80% width on large screens)
 * - UserStorageWidget (20% width on large screens)
 */
export default function StoragePage() {
  const { data: authStatus } = useAuthStatus();
  const isAuthenticated = authStatus?.authenticated ?? false;
  const isLoadingStorage = !isAuthenticated;

  // Handle refresh for VOSpace Storage Widget
  const handleVOSpaceRefresh = useCallback(() => {
    // VOSpace widget manages its own query invalidation
    // This callback is provided for potential future use
    console.log('VOSpace refresh requested');
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        backgroundColor: 'background.default',
      }}
    >
      {/* Storage Widgets - 80/20 split */}
      <Container maxWidth="xl" sx={{ pt: 2, pb: 4, px: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            gap: 3,
          }}
        >
          {/* VOSpaceStorageWidget - 80% width on large screens */}
          <Box
            sx={{
              flex: { xs: 1, lg: '0 0 80%' },
              minWidth: 0, // Prevent flex item from overflowing
            }}
          >
            <VOSpaceStorageWidget
              title="VO Space Storage"
              isAuthenticated={isAuthenticated}
              username={authStatus?.user?.username || ''}
              initialPath={authStatus?.user?.username ? `home/${authStatus.user.username}` : 'home'}
              isLoading={isLoadingStorage}
              onRefresh={handleVOSpaceRefresh}
              showRefreshButton={true}
            />
          </Box>

          {/* UserStorageWidget - 20% width on large screens */}
          <Box
            sx={{
              flex: { xs: 1, lg: '0 0 20%' },
              minWidth: 0, // Prevent flex item from overflowing
              px: { xs: 1, sm: 2 }, // Add horizontal padding
            }}
          >
            <UserStorageWidget
              isAuthenticated={isAuthenticated}
              name={authStatus?.user?.username || ''}
              isLoading={isLoadingStorage}
            />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
