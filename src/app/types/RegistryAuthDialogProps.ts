export interface RegistryAuthDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (username: string, secret: string, containerImage: string) => void;
  initialUsername?: string;
  initialSecret?: string;
  initialContainerImage?: string;
  onResetImage?: () => void;
}
