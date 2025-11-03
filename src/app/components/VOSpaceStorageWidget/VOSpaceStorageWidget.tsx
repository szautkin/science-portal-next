/**
 * VOSpace Storage Widget Shell Component
 *
 * This is the public-facing component that forwards props to the implementation.
 * Follows the 3-layer widget pattern used throughout the application.
 */

import { VOSpaceStorageWidgetProps } from '@/app/types/VOSpaceStorageWidgetProps';
import { VOSpaceStorageWidgetImpl } from '@/app/implementation/voSpaceStorageWidget';
import React from 'react';

export const VOSpaceStorageWidget = React.forwardRef<
  HTMLDivElement,
  VOSpaceStorageWidgetProps
>((props, ref) => {
  return <VOSpaceStorageWidgetImpl ref={ref} {...props} />;
});

VOSpaceStorageWidget.displayName = 'VOSpaceStorageWidget';
