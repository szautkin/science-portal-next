/**
 * Star AI Widget Props Interface
 *
 * Type definitions for the Star AI Widget component.
 */

/**
 * Props for the Star AI Widget
 */
export interface StarAIWidgetProps {
  /**
   * Widget title
   * @default 'Star AI'
   */
  title?: string;

  /**
   * Whether the user is authenticated
   */
  isAuthenticated?: boolean;

  /**
   * Username for default path
   * If provided, initial path will be 'home/{username}'
   */
  username?: string;

  /**
   * Initial directory path for file operations
   * @default 'home' or 'home/{username}' if username provided
   */
  initialPath?: string;

  /**
   * Whether the widget is in a loading state
   */
  isLoading?: boolean;

  /**
   * Error message to display
   */
  errorMessage?: string;

  /**
   * Callback for refresh button
   */
  onRefresh?: () => void;

  /**
   * Show refresh button
   * @default true
   */
  showRefreshButton?: boolean;

  /**
   * Callback when a folder is created successfully
   */
  onFolderCreated?: (path: string) => void;

  /**
   * Callback when a file is created successfully
   */
  onFileCreated?: (path: string) => void;
}
