import { ConversationHistoryProps } from '@/app/types/ConversationHistoryProps';
import { ConversationHistoryImpl } from '@/app/implementation/conversationHistory';
import React from 'react';

export const ConversationHistory = React.forwardRef<
  HTMLDivElement,
  ConversationHistoryProps
>((props, ref) => {
  return <ConversationHistoryImpl ref={ref} {...props} />;
});

ConversationHistory.displayName = 'ConversationHistory';
