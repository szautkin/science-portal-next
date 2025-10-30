import React from 'react';
import { CanfarResourceInputProps } from '@/app/types/CanfarResourceInputProps';
import { CanfarResourceInputImpl } from '@/app/implementation/canfarResourceInput';

export const CanfarResourceInput = React.forwardRef<HTMLDivElement, CanfarResourceInputProps>(
  (props, ref) => {
    return <CanfarResourceInputImpl ref={ref} {...props} />;
  }
);

CanfarResourceInput.displayName = 'CanfarResourceInput';
