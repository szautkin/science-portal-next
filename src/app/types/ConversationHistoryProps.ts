import { ConversationItem } from './CodeRunnerTypes';

export interface ConversationHistoryProps {
  /** Array of conversation items */
  conversations: ConversationItem[];
  /** Active conversation tab index */
  activeTab: number;
  /** Tab change handler */
  onTabChange: (index: number) => void;
  /** Close tab handler */
  onCloseTab: (index: number) => void;
  /** Maximum height of conversation area */
  maxHeight?: string | number;
  /** Show empty state */
  showEmptyState?: boolean;
}
