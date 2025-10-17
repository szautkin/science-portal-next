'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { AppBarWithAuth } from '@/app/components/AppBarWithAuth/AppBarWithAuth';
import { ActiveSessionsWidget } from '@/app/components/ActiveSessionsWidget/ActiveSessionsWidget';
import { UserStorageWidget } from '@/app/components/UserStorageWidget/UserStorageWidget';
import { LaunchFormWidget } from '@/app/components/LaunchFormWidget/LaunchFormWidget';
import { PlatformLoad } from '@/app/components/PlatformLoad/PlatformLoad';
import { Footer } from '@/app/components/Footer/Footer';
import { Box } from '@/app/components/Box/Box';
import { Container } from '@mui/material';
import { ThemeToggle } from '@/app/components/ThemeToggle/ThemeToggle';
import { appBarWithUserMenu, CanfarLogo } from '@/stories/shared/navigation';
import type { SessionCardProps } from '@/app/types/SessionCardProps';
import type { PlatformLoadData } from '@/app/types/PlatformLoadProps';
import { useAuthStatus } from '@/lib/hooks/useAuth';
import { useSessions, useDeleteSession, useRenewSession } from '@/lib/hooks/useSessions';
import { usePlatformLoad } from '@/lib/hooks/usePlatformLoad';
import { useContainerImages, useImageRepositories } from '@/lib/hooks/useImages';
import { useQueryClient } from '@tanstack/react-query';
import type { Session } from '@/lib/api/skaha';

export default function SciencePortalPage() {
  // Get authentication status and query client for cache management
  const { data: authStatus, isLoading: isAuthLoading } = useAuthStatus();
  const isAuthenticated = authStatus?.authenticated ?? false;
  const queryClient = useQueryClient();

  // Track previous auth state to detect logout
  const [prevAuthState, setPrevAuthState] = useState(isAuthenticated);

  // Detect logout and trigger page reload to reset everything
  useEffect(() => {
    // If user logged out, clear everything and reload the page
    if (!isAuthenticated && prevAuthState === true) {
      setPrevAuthState(isAuthenticated);

      // Clear all queries except auth status
      queryClient.invalidateQueries({
        predicate: (query) => {
          return !query.queryKey.includes('auth');
        },
      });

      // Remove all non-auth queries from cache
      queryClient.removeQueries({
        predicate: (query) => {
          return !query.queryKey.includes('auth');
        },
      });

      // Clear nuqs state from URL (remove all query parameters)
      // and reload the page to reset all state
      const currentUrl = new URL(window.location.href);
      currentUrl.search = ''; // Clear all query parameters
      window.location.href = currentUrl.toString(); // Full page reload
    } else if (isAuthenticated && prevAuthState === false) {
      setPrevAuthState(isAuthenticated);
    }
  }, [isAuthenticated, prevAuthState, queryClient]);

  // Fetch active sessions using the hook
  const {
    data: sessions = [],
    isLoading,
    isFetching,
    refetch: refetchSessions
  } = useSessions(isAuthenticated);

  // Fetch platform load using the hook
  const {
    data: platformLoadData,
    isLoading: isPlatformLoading,
    isFetching: isPlatformFetching,
    refetch: refetchPlatformLoad
  } = usePlatformLoad(isAuthenticated);

  // Fetch container images and repositories for the Launch Form
  const {
    data: imagesByType = {},
    isLoading: isLoadingImages,
    isFetching: isFetchingImages,
    refetch: refetchImages
  } = useContainerImages(isAuthenticated);

  const {
    data: imageRepositories = [],
    isLoading: isLoadingRepositories,
    isFetching: isFetchingRepositories,
    refetch: refetchRepositories
  } = useImageRepositories(isAuthenticated);

  // SIMPLE LOADING LOGIC - ALL IN ONE PLACE:
  // NOT authenticated → ALWAYS show loading
  // IS authenticated → show loading ONLY while fetching (isLoading = true)
  const isLoadingSessions = !isAuthenticated || isLoading;
  const isLoadingPlatform = !isAuthenticated || isPlatformLoading;
  const isLoadingLaunchForm = !isAuthenticated || isLoadingImages || isLoadingRepositories;
  const isLoadingUserStorage = !isAuthenticated;

  // Mutation hooks for session actions
  const { mutate: deleteSession } = useDeleteSession({
    onSuccess: () => {
      console.log('Session deleted successfully');
      // Explicitly refetch sessions to update the Active Sessions widget
      refetchSessions();
    },
    onError: (error) => {
      console.error('Failed to delete session:', error);
    },
  });

  const { mutate: renewSession } = useRenewSession({
    onSuccess: () => {
      console.log('Session renewed successfully');
    },
    onError: (error) => {
      console.error('Failed to renew session:', error);
    },
  });

  // Transform Session data to SessionCardProps format with action handlers
  const activeSessions: SessionCardProps[] = useMemo(() => {
    return sessions.map((session: Session) => ({
      id: session.id,
      sessionId: session.sessionId,
      sessionType: session.sessionType,
      sessionName: session.sessionName,
      status: session.status,
      containerImage: session.containerImage,
      startedTime: session.startedTime,
      expiresTime: session.expiresTime,
      memoryUsage: session.memoryUsage,
      memoryAllocated: session.memoryAllocated,
      cpuUsage: session.cpuUsage,
      cpuAllocated: session.cpuAllocated,
      connectUrl: session.connectUrl,
      requestedRAM: session.requestedRAM,
      requestedCPU: session.requestedCPU,
      onDelete: () => {
        if (session.id) {
          deleteSession(session.id);
        }
      },
      onExtendTime: () => {
        if (session.id) {
          // Default to 12 hours extension - this will be customizable via modal
          renewSession({ sessionId: session.id, hours: 12 });
        }
      },
    }));
  }, [sessions, deleteSession, renewSession]);

  // Handle refresh for ActiveSessionsWidget
  const handleSessionsRefresh = useCallback(() => {
    // Refetch sessions from API
    refetchSessions();
  }, [refetchSessions]);

  // Handle refresh for PlatformLoad
  const handlePlatformRefresh = useCallback(() => {
    // Refetch platform load from API
    refetchPlatformLoad();
  }, [refetchPlatformLoad]);

  // Handle refresh for Launch Form (images and repositories)
  const handleLaunchFormRefresh = useCallback(() => {
    // Refetch both images and repositories
    refetchImages();
    refetchRepositories();
  }, [refetchImages, refetchRepositories]);

  // Provide placeholder data for Platform Load when data is not yet loaded
  const platformLoadDataOrPlaceholder: PlatformLoadData = useMemo(() => {
    if (platformLoadData) {
      return platformLoadData;
    }
    // Return placeholder data to show widget while loading
    return {
      cpu: { name: 'CPU', used: 0, free: 0 },
      ram: { name: 'RAM', used: 0, free: 0 },
      instances: { name: 'Instances', used: 0, free: 0 },
      maxValues: { cpu: 1, ram: 1, instances: 1 },
      lastUpdate: new Date().toISOString(),
    };
  }, [platformLoadData]);

  const footerSections = [
    {
      title: 'Resources',
      links: [
        { label: 'Documentation', href: '/docs' },
        { label: 'API Reference', href: '/docs/api' },
        { label: 'Tutorials', href: '/docs/tutorials' },
      ],
    },
    {
      title: 'Community',
      links: [
        { label: 'Forum', href: 'https://forum.canfar.net', external: true },
        { label: 'GitHub', href: 'https://github.com/canfar', external: true },
        { label: 'Slack', href: '/community/slack' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', href: '/support' },
        { label: 'Contact Us', href: '/contact' },
        { label: 'System Status', href: '/status' },
      ],
    },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'background.default',
      }}
    >
      {/* AppBar with Science Portal wordmark */}
      <AppBarWithAuth
        variant="surface"
        position="sticky"
        elevation={0}
        wordmark="Science Portal"
        logoHref="/"
        logo={<CanfarLogo />}
        links={appBarWithUserMenu.links}
        accountButton={<ThemeToggle size="md" />}
        showLoginButton={true}
      />

      {/* Main content area */}
      <Box component="main" sx={{ flex: 1, pt: 2 }}>
        {/* Active Sessions and User Storage Widgets - 80/20 split */}
        <Container maxWidth="xl" sx={{ mb: 4, px: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', lg: 'row' },
              gap: 3,
            }}
          >
            {/* ActiveSessionsWidget - 80% width on large screens */}
            <Box
              sx={{
                flex: { xs: 1, lg: '0 0 80%' },
                minWidth: 0, // Prevent flex item from overflowing
              }}
            >
              <ActiveSessionsWidget
                sessions={activeSessions}
                layout="responsive"
                isLoading={isLoadingSessions}
                onRefresh={handleSessionsRefresh}
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
                isLoading={isLoadingUserStorage}
              />
            </Box>
          </Box>
        </Container>

        {/* 60/40 split container for LaunchFormWidget and PlatformLoad */}
        <Container maxWidth="xl" sx={{ mb: 4, px: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', lg: 'row' },
              gap: 3,
            }}
          >
            {/* LaunchFormWidget - 60% width on large screens */}
            <Box
              sx={{
                flex: { xs: 1, lg: '0 0 60%' },
                minWidth: 0, // Prevent flex item from overflowing
              }}
            >
              <LaunchFormWidget
              helpUrl="https://www.opencadc.org/science-containers/"
              imagesByType={imagesByType}
              repositoryHosts={imageRepositories.map(repo => repo.host)}
              isLoading={isLoadingLaunchForm}
              onRefresh={handleLaunchFormRefresh}
              activeSessions={sessions}
            />
            </Box>

            {/* PlatformLoad - 40% width on large screens */}
            <Box
              sx={{
                flex: { xs: 1, lg: '0 0 40%' },
                minWidth: 0, // Prevent flex item from overflowing
                px: { xs: 1, sm: 2 }, // Add horizontal padding
              }}
            >
              <PlatformLoad
                data={platformLoadDataOrPlaceholder}
                isLoading={isLoadingPlatform}
                onRefresh={handlePlatformRefresh}
              />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Footer - full width */}
      <Footer
        sections={footerSections}
        copyright="© 2024 CANFAR. All rights reserved."
      />
    </Box>
  );
}
