import { ResponseViewerProps } from '@/app/types/ResponseViewerProps';
import { ResponseViewerImpl } from '@/app/implementation/responseViewer';
import React from 'react';

export const ResponseViewer = React.forwardRef<
  HTMLDivElement,
  ResponseViewerProps
>((props, ref) => {
  return <ResponseViewerImpl ref={ref} {...props} />;
});

ResponseViewer.displayName = 'ResponseViewer';
