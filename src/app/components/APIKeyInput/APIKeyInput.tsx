import { APIKeyInputProps } from '@/app/types/APIKeyInputProps';
import { APIKeyInputImpl } from '@/app/implementation/apiKeyInput';
import React from 'react';

export const APIKeyInput = React.forwardRef<HTMLDivElement, APIKeyInputProps>(
  (props, ref) => {
    return <APIKeyInputImpl ref={ref} {...props} />;
  }
);

APIKeyInput.displayName = 'APIKeyInput';
