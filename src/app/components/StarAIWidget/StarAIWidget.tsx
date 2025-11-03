/**
 * Star AI Widget Shell Component
 *
 * This is the public-facing component that forwards props to the implementation.
 * Follows the 3-layer widget pattern used throughout the application.
 */

import { StarAIWidgetProps } from '@/app/types/StarAIWidgetProps';
import { StarAIWidgetImpl } from '@/app/implementation/starAIWidget';
import React from 'react';

export const StarAIWidget = React.forwardRef<
  HTMLDivElement,
  StarAIWidgetProps
>((props, ref) => {
  return <StarAIWidgetImpl ref={ref} {...props} />;
});

StarAIWidget.displayName = 'StarAIWidget';
