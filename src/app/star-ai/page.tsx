'use client';

import { Box } from '@mui/material';
import { AppBarWithAuth } from '@/app/components/AppBarWithAuth/AppBarWithAuth';
import { ThemeToggle } from '@/app/components/ThemeToggle/ThemeToggle';
import { AIConfigProvider } from '@/app/context/AIConfigContext';
import { appBarWithUserMenu, CanfarLogo, SRCNetLogo } from '@/stories/shared/navigation';
import { getDefaultModel } from '@/app/config/modelConfig';
import { StarAIInterface } from './StarAIInterface';

/**
 * StarAI Page Component
 *
 * Main page component that wraps the StarAI interface with
 * necessary providers and layout components.
 */
export default function StarAIPage() {
  const isOIDCMode = process.env.NEXT_PUBLIC_USE_CANFAR !== 'true';
  const defaultModel = getDefaultModel();

  return (
    <AIConfigProvider
      initialModel="openai"
      initialModelName={defaultModel?.id || 'gpt-4.1-mini'}
      initialApiKey=""
    >
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
        {/* AppBar with StarAI wordmark */}
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
            wordmark="StarAI"
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
          <StarAIInterface />
        </Box>
      </Box>
    </AIConfigProvider>
  );
}
