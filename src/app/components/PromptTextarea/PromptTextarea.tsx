import { PromptTextareaProps } from '@/app/types/PromptTextareaProps';
import { PromptTextareaImpl } from '@/app/implementation/promptTextarea';
import React from 'react';

export const PromptTextarea = React.forwardRef<
  HTMLTextAreaElement,
  PromptTextareaProps
>((props, ref) => {
  return <PromptTextareaImpl ref={ref} {...props} />;
});

PromptTextarea.displayName = 'PromptTextarea';
