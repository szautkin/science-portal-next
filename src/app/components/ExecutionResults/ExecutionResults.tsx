import { ExecutionResultsProps } from '@/app/types/ExecutionResultsProps';
import { ExecutionResultsImpl } from '@/app/implementation/executionResults';
import React from 'react';

export const ExecutionResults = React.forwardRef<
  HTMLDivElement,
  ExecutionResultsProps
>((props, ref) => {
  return <ExecutionResultsImpl ref={ref} {...props} />;
});

ExecutionResults.displayName = 'ExecutionResults';
