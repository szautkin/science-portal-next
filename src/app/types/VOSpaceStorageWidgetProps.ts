/**
 * VOSpace Storage Widget Props Interface
 *
 * Type definitions for the VOSpace Storage widget component.
 */

/**
 * Props for the VOSpace Storage Widget
 */
export interface VOSpaceStorageWidgetProps {
  /**
   * Widget title
   * @default 'VOSpace Storage'
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
   * Initial directory path to display
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
   * Show breadcrumb navigation
   * @default true
   */
  showBreadcrumbs?: boolean;

  /**
   * Show action buttons (create folder, upload file)
   * @default true
   */
  showActions?: boolean;

  /**
   * Custom empty message when no files
   * @default 'No files or folders'
   */
  emptyMessage?: string;

  /**
   * Maximum number of files to display
   * @default 1000
   */
  maxFiles?: number;

  /**
   * Custom date formatter
   */
  dateFormatter?: (date: string) => string;

  /**
   * Custom file size formatter
   */
  fileSizeFormatter?: (bytes: number) => string;

  /**
   * Callback when a file is uploaded successfully
   */
  onFileUploaded?: (path: string) => void;

  /**
   * Callback when a folder is created successfully
   */
  onFolderCreated?: (path: string) => void;

  /**
   * Callback when a node is deleted successfully
   */
  onNodeDeleted?: (path: string) => void;

  /**
   * Callback when navigation changes
   */
  onPathChange?: (path: string) => void;
}
