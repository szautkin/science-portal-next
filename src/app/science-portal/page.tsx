'use client';

import { useState, useCallback } from 'react';
import { AppBar } from '@/app/components/AppBar/AppBar';
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

export default function SciencePortalPage() {
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingPlatform, setIsLoadingPlatform] = useState(false);

  // Mock active sessions data
  const [activeSessions, setActiveSessions] = useState<SessionCardProps[]>([
    {
      sessionType: 'notebook',
      sessionName: 'analysis-notebook-01',
      status: 'Running',
      containerImage: 'images.canfar.net/ml:latest',
      startedTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      expiresTime: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
      memoryUsage: '3.2G',
      memoryAllocated: '8G',
      cpuUsage: '1.5',
      cpuAllocated: '2',
      connectUrl: '/sessions/notebook/analysis-notebook-01',
    },
    {
      sessionType: 'desktop',
      sessionName: 'desktop-session-02',
      status: 'Running',
      containerImage: 'images.canfar.net/desktop:latest',
      startedTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      expiresTime: new Date(Date.now() + 11.5 * 60 * 60 * 1000).toISOString(),
      memoryUsage: '5.1G',
      memoryAllocated: '16G',
      cpuUsage: '0.8',
      cpuAllocated: '4',
      connectUrl: '/sessions/desktop/desktop-session-02',
    },
  ]);

  // Mock platform load data
  const [platformLoadData, setPlatformLoadData] = useState<PlatformLoadData>({
    cpu: {
      name: 'CPU',
      used: 1215.1,
      free: 1486.9,
    },
    ram: {
      name: 'RAM',
      used: 6200.5,
      free: 3818.55,
    },
    instances: {
      name: 'Instances',
      used: 100,
      free: 100,
      headless: 49,
    },
    maxValues: {
      cpu: 2702.0,
      ram: 10019.05,
      instances: 249,
    },
    lastUpdate: new Date(),
  });

  // Handle refresh for ActiveSessionsWidget
  const handleSessionsRefresh = useCallback(() => {
    setIsLoadingSessions(true);

    // Simulate fetching new session data
    setTimeout(() => {
      // In a real app, you would fetch new data here
      console.log('Refreshing sessions data...');

      // Optional: Update sessions with new mock data or keep the same
      setActiveSessions((prev) => [...prev]);

      setIsLoadingSessions(false);
    }, 2000);
  }, []);

  // Handle refresh for PlatformLoad
  const handlePlatformRefresh = useCallback(() => {
    setIsLoadingPlatform(true);

    // Simulate fetching new platform data
    setTimeout(() => {
      // In a real app, you would fetch new data here
      console.log('Refreshing platform load data...');

      // Update with slightly different mock data to show the refresh worked
      setPlatformLoadData((prev) => ({
        ...prev,
        cpu: {
          ...prev.cpu,
          used: prev.cpu.used + (Math.random() * 100 - 50), // Random change
          free: prev.cpu.free + (Math.random() * 100 - 50),
        },
        ram: {
          ...prev.ram,
          used: prev.ram.used + (Math.random() * 200 - 100),
          free: prev.ram.free + (Math.random() * 200 - 100),
        },
        instances: {
          ...prev.instances,
          used: Math.max(
            0,
            prev.instances.used + Math.floor(Math.random() * 20 - 10)
          ),
          free: Math.max(
            0,
            prev.instances.free + Math.floor(Math.random() * 20 - 10)
          ),
          headless: Math.max(
            0,
            (('headless' in prev.instances
              ? (prev.instances.headless as number)
              : 0) || 0) + Math.floor(Math.random() * 10 - 5)
          ),
        },
        lastUpdate: new Date(),
      }));

      setIsLoadingPlatform(false);
    }, 2000);
  }, []);

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
      <AppBar
        variant="surface"
        position="sticky"
        elevation={0}
        wordmark="Science Portal"
        logoHref="/"
        menuLabel="Jane Doe"
        logo={<CanfarLogo />}
        links={appBarWithUserMenu.links}
        menuItems={appBarWithUserMenu.menuItems}
        accountButton={<ThemeToggle size="md" />}
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
                isAuthenticated={true}
                name="janedoe"
                storageUrl="https://api.canfar.net/storage/"
                testMode={true}
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
              <LaunchFormWidget helpUrl="https://www.opencadc.org/science-containers/" />
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
                data={platformLoadData}
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
