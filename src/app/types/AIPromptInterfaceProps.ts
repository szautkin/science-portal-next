export interface AIPromptInterfaceProps {
  /** Initial prompt value */
  initialPrompt?: string;
  /** Initial API key value */
  initialApiKey?: string;
  /** Initial selected model */
  initialModel?: string;
  /** Callback when prompt is submitted */
  onSubmit?: (prompt: string, apiKey: string, model: string) => void;
  /** Loading state */
  loading?: boolean;
  /** Error message to display */
  error?: string;
  /** Response content to display */
  response?: string;
  /** Additional CSS classes */
  className?: string;
  /** Disable the interface */
  disabled?: boolean;
}
