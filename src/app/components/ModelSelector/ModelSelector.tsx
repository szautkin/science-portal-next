import { ModelSelectorProps } from '@/app/types/ModelSelectorProps';
import { ModelSelectorImpl } from '@/app/implementation/modelSelector';
import React from 'react';

export const ModelSelector = React.forwardRef<
  HTMLDivElement,
  ModelSelectorProps
>((props, ref) => {
  return <ModelSelectorImpl ref={ref} {...props} />;
});

ModelSelector.displayName = 'ModelSelector';
