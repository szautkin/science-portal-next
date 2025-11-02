import { AIPromptInterfaceProps } from '@/app/types/AIPromptInterfaceProps';
import { AIPromptInterfaceImpl } from '@/app/implementation/aiPromptInterface';
import React from 'react';

export const AIPromptInterface = React.forwardRef<
  HTMLDivElement,
  AIPromptInterfaceProps
>((props, ref) => {
  return <AIPromptInterfaceImpl ref={ref} {...props} />;
});

AIPromptInterface.displayName = 'AIPromptInterface';
