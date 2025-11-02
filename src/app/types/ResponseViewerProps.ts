export interface ResponseViewerProps {
  /** HTML content to render */
  content?: string;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string;
  /** Title for the response viewer */
  title?: string;
  /** Show copy button */
  showCopyButton?: boolean;
  /** Show download button */
  showDownloadButton?: boolean;
  /** Callback when content is copied */
  onCopy?: () => void;
  /** Callback when content is downloaded */
  onDownload?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Maximum height */
  maxHeight?: string | number;
}
