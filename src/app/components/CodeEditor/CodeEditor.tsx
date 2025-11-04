import { CodeEditorProps } from '@/app/types/CodeEditorProps';
import { CodeEditorImpl } from '@/app/implementation/codeEditor';
import React from 'react';

export const CodeEditor = React.forwardRef<HTMLDivElement, CodeEditorProps>(
  (props, ref) => {
    return <CodeEditorImpl ref={ref} {...props} />;
  }
);

CodeEditor.displayName = 'CodeEditor';
