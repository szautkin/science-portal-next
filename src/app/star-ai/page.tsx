'use client';

import { Container, Typography } from '@mui/material';
import { AIPromptInterface } from '@/app/components/AIPromptInterface/AIPromptInterface';
import { AppBarWithAuth } from '@/app/components/AppBarWithAuth/AppBarWithAuth';
import { Box } from '@/app/components/Box/Box';
import { Footer } from '@/app/components/Footer/Footer';
import { ThemeToggle } from '@/app/components/ThemeToggle/ThemeToggle';
import { appBarWithUserMenu, CanfarLogo, SRCNetLogo } from '@/stories/shared/navigation';
import { useAuthStatus } from '@/lib/hooks/useAuth';
import {
  DOCS_URL,
  ABOUT_URL,
  OPEN_SOURCE_URL,
  SUPPORT_EMAIL,
  DISCORD_URL,
  STORAGE_MANAGEMENT_URL,
  GROUP_MANAGEMENT_URL,
  DATA_PUBLICATION_URL,
  SCIENCE_PORTAL_URL,
  CADC_SEARCH_URL,
  OPENSTACK_CLOUD_URL,
} from '@/lib/config/site-config';

export default function StarAIPage() {
  // Check if in OIDC mode (CANFAR mode when NEXT_PUBLIC_USE_CANFAR=true)
  const isOIDCMode = process.env.NEXT_PUBLIC_USE_CANFAR !== 'true';

  // Get authentication status
  const { data: authStatus } = useAuthStatus();
  const isAuthenticated = authStatus?.authenticated ?? false;

  const footerSections = [
    {
      title: 'Resources',
      links: [
        { label: 'Documentation', href: DOCS_URL, external: true },
        { label: 'About', href: ABOUT_URL, external: true },
        { label: 'Open Source', href: OPEN_SOURCE_URL, external: true },
      ],
    },
    {
      title: 'Services',
      links: [
        { label: 'Storage Management', href: STORAGE_MANAGEMENT_URL, external: true },
        { label: 'Group Management', href: GROUP_MANAGEMENT_URL, external: true },
        { label: 'Data Publication', href: DATA_PUBLICATION_URL, external: true },
        { label: 'Science Portal', href: SCIENCE_PORTAL_URL, external: true },
        { label: 'CADC Search', href: CADC_SEARCH_URL, external: true },
        { label: 'OpenStack Cloud', href: OPENSTACK_CLOUD_URL, external: true },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Help', href: SUPPORT_EMAIL, external: false },
        { label: 'Join us on Discord', href: DISCORD_URL, external: true },
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
      {/* AppBar with StarAI wordmark */}
      <AppBarWithAuth
        variant="surface"
        position="sticky"
        elevation={0}
        wordmark="StarAI"
        logoHref="/"
        logo={isOIDCMode ? <SRCNetLogo /> : <CanfarLogo />}
        links={isOIDCMode ? [] : appBarWithUserMenu.links}
        accountButton={<ThemeToggle size="md" />}
        showLoginButton={true}
      />

      {/* Main content area */}
      <Box component="main" sx={{ flex: 1, pt: 2 }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              StarAI
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Leverage StarAI to explore and analyze astronomical data from the
              Canadian Astronomy Data Centre (CADC) and interact with the CANFAR
              platform. Query datasets, generate analysis scripts, and get
              assistance with data processing workflows.
            </Typography>
          </Box>

          <AIPromptInterface initialModel="openai" initialPrompt="" />
        </Container>
      </Box>

      {/* Footer - full width - CANFAR mode only */}
      {!isOIDCMode && (
        <Footer
          sections={footerSections}
          copyright="© 2022-2025"
        />
      )}
    </Box>
  );
}
