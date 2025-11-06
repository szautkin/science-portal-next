'use client';

import { Box } from '@mui/material';
import { AppBarWithAuth } from '@/app/components/AppBarWithAuth/AppBarWithAuth';
import { ThemeToggle } from '@/app/components/ThemeToggle/ThemeToggle';
import { AIConfigProvider } from '@/app/context/AIConfigContext';
import { CodeRunnerProvider } from '@/app/context/CodeRunnerContext';
import { appBarWithUserMenu, CanfarLogo, SRCNetLogo } from '@/stories/shared/navigation';
import { StarAIRunnerInterface } from './StarAIRunnerInterface';

/**
 * Main Page Component
 */
export default function StarAIRunnerPage() {
  const isOIDCMode = process.env.NEXT_PUBLIC_USE_CANFAR !== 'true';

  return (
    <AIConfigProvider initialModel="openai" initialModelName="gpt-4.1-mini" initialApiKey="">
      <CodeRunnerProvider initialLanguage="python">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            backgroundColor: 'background.default',
            '@media print': {
              minHeight: 'auto',
              backgroundColor: '#ffffff',
            },
          }}
        >
          {/* AppBar with full navigation */}
          <Box
            sx={{
              '@media print': {
                display: 'none !important',
              },
            }}
          >
            <AppBarWithAuth
              variant="surface"
              position="fixed"
              elevation={0}
              wordmark="StarAI Code Runner"
              logoHref="/"
              logo={isOIDCMode ? <SRCNetLogo /> : <CanfarLogo />}
              links={isOIDCMode ? [] : appBarWithUserMenu.links}
              accountButton={<ThemeToggle size="md" />}
              showLoginButton={true}
            />
          </Box>

          {/* Main content area */}
          <Box
            component="main"
            sx={{
              position: 'fixed',
              top: 64,
              left: 0,
              right: 0,
              bottom: 0,
              overflow: 'hidden',
              '@media print': {
                position: 'static',
                overflow: 'visible',
              },
            }}
          >
            <StarAIRunnerInterface />
          </Box>
        </Box>
      </CodeRunnerProvider>
    </AIConfigProvider>
  );
}
