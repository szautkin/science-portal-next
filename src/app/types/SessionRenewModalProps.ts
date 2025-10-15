export interface SessionRenewModalProps {
  open: boolean;
  sessionName?: string;
  sessionId?: string;
  onClose: () => void;
  isRenewing?: boolean;
}
