export interface ModelSelectorProps {
  /** Selected model value */
  value?: string;
  /** Callback when model selection changes */
  onChange?: (model: string) => void;
  /** Label for the selector */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error state */
  error?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Size of the component */
  size?: 'sm' | 'md' | 'lg';
  /** Required field */
  required?: boolean;
  /** Available models */
  models?: Array<{
    id: string;
    name: string;
    enabled: boolean;
    description?: string;
  }>;
}
