'use client';

import { Box } from '@mui/material';
import { StarAIInterface } from '@/app/star-ai/StarAIInterface';
import { AIConfigProvider } from '@/app/context/AIConfigContext';
import { getDefaultModel } from '@/app/config/modelConfig';

/**
 * Search Page
 *
 * StarAI Search interface for querying astronomical data.
 * Uses fixed positioning to fill the available space below the navigation.
 * Total top offset: 64px (main nav) + 56px (secondary nav) = 120px
 */
export default function SearchPage() {
  const defaultModel = getDefaultModel();

  return (
    <AIConfigProvider
      initialModel="openai"
      initialModelName={defaultModel?.id || 'gpt-4.1-mini'}
      initialApiKey=""
    >
      <Box
        sx={{
          position: 'fixed',
          top: 120, // 64px main nav + 56px secondary nav
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
    </AIConfigProvider>
  );
}
