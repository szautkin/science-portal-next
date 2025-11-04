import { CodeLanguage } from './CodeRunnerTypes';

export interface CodeEditorProps {
  /** Code content */
  code: string;
  /** Programming language */
  language: CodeLanguage;
  /** Change handler */
  onChange: (code: string) => void;
  /** Store button click handler */
  onStore: () => void;
  /** Run button click handler */
  onRun: () => void;
  /** Whether code is being stored */
  isStoring: boolean;
  /** Whether code is executing */
  isExecuting: boolean;
  /** Whether code has been modified after storing */
  isModified: boolean;
  /** Path where code is stored (null if not stored) */
  storedFilePath: string | null;
  /** Read-only mode */
  readOnly?: boolean;
  /** Editor height */
  height?: string | number;
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Theme */
  theme?: 'light' | 'dark';
  /** Placeholder text */
  placeholder?: string;
  /** Registry authentication username */
  registryUsername?: string;
  /** Registry authentication secret */
  registrySecret?: string;
  /** Container image to use */
  containerImage?: string;
  /** Settings update handler */
  onSettingsChange?: (username: string, secret: string, containerImage: string) => void;
  /** Reset container image to default */
  onResetImage?: () => void;
}
