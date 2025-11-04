'use client';

import React from 'react';
import { RegistryAuthDialogImpl } from '@/app/implementation/registryAuthDialog';
import { RegistryAuthDialogProps } from '@/app/types/RegistryAuthDialogProps';

export const RegistryAuthDialog = React.forwardRef<HTMLDivElement, RegistryAuthDialogProps>(
  (props, ref) => {
    return <RegistryAuthDialogImpl ref={ref} {...props} />;
  }
);

RegistryAuthDialog.displayName = 'RegistryAuthDialog';
