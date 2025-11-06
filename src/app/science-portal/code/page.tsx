'use client';

import { Box } from '@mui/material';
import { StarAIRunnerInterface } from '@/app/starai-runner/StarAIRunnerInterface';
import { AIConfigProvider } from '@/app/context/AIConfigContext';
import { CodeRunnerProvider } from '@/app/context/CodeRunnerContext';
import { getDefaultModel } from '@/app/config/modelConfig';

/**
 * Code Runner Page
 *
 * StarAI Code Runner interface for generating, storing, and executing code.
 * Uses fixed positioning to fill the available space below the navigation.
 * Total top offset: 64px (main nav) + 56px (secondary nav) = 120px
 */
export default function CodePage() {
  const defaultModel = getDefaultModel();

  return (
    <AIConfigProvider
      initialModel="openai"
      initialModelName={defaultModel?.id || 'gpt-4.1-mini'}
      initialApiKey=""
    >
      <CodeRunnerProvider initialLanguage="python">
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
          <StarAIRunnerInterface />
        </Box>
      </CodeRunnerProvider>
    </AIConfigProvider>
  );
}
