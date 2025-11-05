/**
 * Shared types for the StarAI Code Runner feature
 */

/**
 * Supported programming languages for code execution
 */
export type CodeLanguage = 'python' | 'javascript' | 'bash';

/**
 * Execution status states
 */
export type ExecutionStatus =
  | 'idle'
  | 'storing'
  | 'running'
  | 'polling'
  | 'completed'
  | 'error';

/**
 * Response type from AI (code or text)
 */
export type ResponseType = 'code' | 'text';

/**
 * Session status from SKAHA API
 */
export type SessionStatus =
  | 'Running'
  | 'Pending'
  | 'Succeeded'
  | 'Failed'
  | 'Terminating'
  | 'Error'
  | 'Unknown';

/**
 * Conversation item representing a single prompt-response pair
 */
export interface ConversationItem {
  /** Unique identifier (timestamp-based) */
  id: string;
  /** User's prompt */
  prompt: string;
  /** AI's response (HTML or text) */
  response: string;
  /** Type of response */
  responseType: ResponseType;
  /** When the conversation occurred */
  timestamp: Date;
  /** AI model vendor (e.g., "openai") */
  model: string;
  /** Specific model name (e.g., "gpt-4.1-mini") */
  modelName: string;
  /** Extracted code (if responseType is 'code') */
  code?: string;
  /** Programming language (if code is present) */
  language?: CodeLanguage;
}

/**
 * Code snippet displayed in the left panel
 */
export interface CodeSnippet {
  /** Unique identifier */
  id: string;
  /** The code content */
  code: string;
  /** Programming language */
  language: CodeLanguage;
  /** Brief description/title */
  title?: string;
  /** When it was generated */
  timestamp: Date;
  /** AI model that generated it */
  modelName: string;
  /** Whether the snippet is collapsed */
  collapsed?: boolean;
}

/**
 * Code execution result
 */
export interface ExecutionResult {
  /** Session ID from SKAHA */
  sessionId: string;
  /** Execution status */
  status: ExecutionStatus;
  /** Standard output */
  stdout?: string;
  /** Standard error */
  stderr?: string;
  /** Combined logs */
  logs?: string;
  /** Start time */
  startTime?: Date;
  /** End time */
  endTime?: Date;
  /** Error message if execution failed */
  error?: string;
}

/**
 * Code storage information
 */
export interface StorageInfo {
  /** Full path in VOSpace */
  filePath: string;
  /** Filename only */
  filename: string;
  /** Base directory */
  directory: string;
  /** When the file was stored */
  timestamp: Date;
}

/**
 * Session configuration for code execution
 */
export interface SessionConfig {
  /** Container image to use */
  containerImage: string;
  /** Number of CPU cores */
  cores: number;
  /** RAM in GB */
  ram: number;
  /** Number of GPUs (optional) */
  gpus?: number;
  /** Command line arguments */
  cmdArgs: string[];
  /** Environment variables */
  env?: Record<string, string>;
}

/**
 * Error state
 */
export interface ErrorState {
  /** Error category */
  type: 'prompt' | 'storage' | 'execution' | 'polling';
  /** Error severity */
  severity: 'error' | 'warning' | 'info';
  /** Error message */
  message: string;
  /** Additional details */
  details?: string;
  /** When the error occurred */
  timestamp: Date;
  /** Whether the error can be dismissed */
  dismissible: boolean;
  /** Whether to auto-hide */
  autoHide?: boolean;
  /** Auto-hide delay in ms */
  autoHideDelay?: number;
}

/**
 * Default container images by language
 */
export const DEFAULT_CONTAINER_IMAGES: Record<CodeLanguage, string> = {
  python: 'images.canfar.net/private-test/python-runner:1.0.0',
  javascript: 'images.canfar.net/skaha/node:18',
  bash: 'images.canfar.net/skaha/bash:5.1',
};

/**
 * Container images by language (for backward compatibility)
 * @deprecated Use DEFAULT_CONTAINER_IMAGES instead
 */
export const CONTAINER_IMAGES = DEFAULT_CONTAINER_IMAGES;

/**
 * Command arguments by language
 * For python-runner image: [sessionId, scriptPath, callbackEndpoint?]
 * The startup.sh script in the image handles running the interpreter
 */
export const LANGUAGE_COMMANDS: Record<CodeLanguage, (filePath: string, sessionId?: string) => string[]> = {
  // Python-runner image expects: sessionId, scriptPath
  // The image's startup.sh automatically runs: python <scriptPath>
  python: (filePath, sessionId = 'default') => [sessionId, filePath],
  javascript: (filePath) => ['node', filePath],
  bash: (filePath) => ['bash', filePath],
};

/**
 * File extensions by language
 */
export const FILE_EXTENSIONS: Record<CodeLanguage, string> = {
  python: '.py',
  javascript: '.js',
  bash: '.sh',
};

/**
 * Content types by language
 */
export const CONTENT_TYPES: Record<CodeLanguage, string> = {
  python: 'text/x-python',
  javascript: 'text/javascript',
  bash: 'text/x-shellscript',
};
