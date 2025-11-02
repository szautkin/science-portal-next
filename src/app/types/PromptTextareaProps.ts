import { TextareaAutosizeProps } from '@mui/material';

export interface PromptTextareaProps
  extends Omit<TextareaAutosizeProps, 'size'> {
  /** Label for the textarea */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Size of the component */
  size?: 'sm' | 'md' | 'lg';
  /** Full width */
  fullWidth?: boolean;
  /** Required field */
  required?: boolean;
  /** Maximum rows */
  maxRows?: number;
  /** Minimum rows */
  minRows?: number;
  /** Character limit */
  maxLength?: number;
  /** Show character count */
  showCharCount?: boolean;
}
