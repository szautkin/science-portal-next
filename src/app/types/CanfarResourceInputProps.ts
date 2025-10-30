export interface CanfarResourceInputProps {
  value: number;
  options: number[];
  onChange: (value: number) => void;
  onBlur?: () => void;
  onValidationChange?: (hasError: boolean) => void;
  disabled?: boolean;
  label?: string;
  error?: boolean;
  helperText?: string;
}
