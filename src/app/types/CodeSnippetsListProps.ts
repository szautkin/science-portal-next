import { CodeSnippet } from './CodeRunnerTypes';

export interface CodeSnippetsListProps {
  /** Array of code snippets */
  snippets: CodeSnippet[];
  /** Selected snippet ID */
  selectedSnippetId: string | null;
  /** Selection handler */
  onSelectSnippet: (id: string) => void;
  /** Load selected snippet to editor */
  onLoadSnippet?: () => void;
  /** Toggle collapse state */
  onToggleCollapse: (id: string) => void;
  /** Delete snippet handler */
  onDeleteSnippet: (id: string) => void;
  /** Maximum height of snippets area */
  maxHeight?: string | number;
}
