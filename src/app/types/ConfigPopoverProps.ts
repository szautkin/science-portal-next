/**
 * Props for the ConfigPopover component
 *
 * A popover that displays AI configuration options including model selection,
 * model name selection, and API key input. Integrates with AIConfigContext
 * to manage configuration state.
 */
export interface ConfigPopoverProps {
  /** Whether the popover is open */
  open: boolean;
  /** Callback when the popover should close */
  onClose: () => void;
  /** Anchor element for the popover positioning */
  anchorEl: HTMLElement | null;
  /** Whether the configuration inputs are disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}
