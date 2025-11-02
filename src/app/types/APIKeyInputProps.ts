import { TextFieldProps as MuiTextFieldProps } from '@mui/material';

export interface APIKeyInputProps
  extends Omit<MuiTextFieldProps, 'type' | 'variant' | 'size'> {
  /** Size of the component */
  size?: 'sm' | 'md' | 'lg';
  /** Show/hide password toggle */
  showToggle?: boolean;
  /** Validation pattern for API key */
  pattern?: string;
  /** Custom validation function */
  validate?: (value: string) => string | null;
  /** Show validation state */
  showValidation?: boolean;
}
