export interface ModelDropdownProps {
  value?: string;
  onChange?: (modelName: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  helperText?: string;
  error?: boolean;
  fullWidth?: boolean;
  required?: boolean;
  className?: string;
}
