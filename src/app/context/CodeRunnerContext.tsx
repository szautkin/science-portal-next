'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from 'react';
import {
  ConversationItem,
  CodeLanguage,
  ExecutionStatus,
  StorageInfo,
  ErrorState,
  DEFAULT_CONTAINER_IMAGES,
} from '@/app/types/CodeRunnerTypes';

/**
 * Context value interface
 */
interface CodeRunnerContextValue {
  // Code State
  currentCode: string;
  setCurrentCode: (code: string) => void;
  codeLanguage: CodeLanguage;
  setCodeLanguage: (lang: CodeLanguage) => void;
  isCodeModified: boolean;
  setIsCodeModified: (modified: boolean) => void;

  // Execution State
  isExecuting: boolean;
  sessionId: string | null;
  executionStatus: ExecutionStatus;
  executionResults: string;
  executionError: string | null;
  setExecutionState: (
    state: Partial<{
      isExecuting: boolean;
      sessionId: string | null;
      executionStatus: ExecutionStatus;
      executionResults: string;
      executionError: string | null;
    }>
  ) => void;

  // Storage State
  storageInfo: StorageInfo | null;
  setStorageInfo: (info: StorageInfo | null) => void;
  isStoring: boolean;
  setIsStoring: (storing: boolean) => void;
  storageError: string | null;
  setStorageError: (error: string | null) => void;

  // Conversation State
  conversations: ConversationItem[];
  activeConversationTab: number;
  setActiveConversationTab: (index: number) => void;
  addConversation: (conversation: ConversationItem) => void;
  removeConversation: (index: number) => void;
  clearConversations: () => void;

  // Error State
  errors: ErrorState[];
  addError: (error: Omit<ErrorState, 'timestamp'>) => void;
  removeError: (index: number) => void;
  clearErrors: () => void;

  // Registry Auth State
  registryUsername: string;
  registrySecret: string;
  setRegistryAuth: (username: string, secret: string) => void;

  // Container Image State
  containerImage: string;
  setContainerImage: (image: string) => void;
  resetContainerImage: () => void;
}

/**
 * Context
 */
const CodeRunnerContext = createContext<CodeRunnerContextValue | undefined>(
  undefined
);

/**
 * Hook to use the context
 */
export const useCodeRunner = (): CodeRunnerContextValue => {
  const context = useContext(CodeRunnerContext);
  if (!context) {
    throw new Error('useCodeRunner must be used within CodeRunnerProvider');
  }
  return context;
};

/**
 * Provider props
 */
interface CodeRunnerProviderProps {
  children: ReactNode;
  initialLanguage?: CodeLanguage;
}

/**
 * Provider component
 */
export const CodeRunnerProvider: React.FC<CodeRunnerProviderProps> = ({
  children,
  initialLanguage = 'python',
}) => {
  // Code State
  const [currentCode, setCurrentCode] = useState<string>('');
  const [codeLanguage, setCodeLanguage] = useState<CodeLanguage>(initialLanguage);
  const [isCodeModified, setIsCodeModified] = useState<boolean>(false);

  // Execution State
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>('idle');
  const [executionResults, setExecutionResults] = useState<string>('');
  const [executionError, setExecutionError] = useState<string | null>(null);

  // Storage State
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [isStoring, setIsStoring] = useState<boolean>(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  // Conversation State
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationTab, setActiveConversationTab] = useState<number>(0);

  // Error State
  const [errors, setErrors] = useState<ErrorState[]>([]);

  // Registry Auth State
  const [registryUsername, setRegistryUsername] = useState<string>('');
  const [registrySecret, setRegistrySecret] = useState<string>('');

  // Container Image State
  const [containerImage, setContainerImage] = useState<string>(
    DEFAULT_CONTAINER_IMAGES[initialLanguage]
  );

  // Set execution state (batch update)
  const setExecutionState = useCallback(
    (
      state: Partial<{
        isExecuting: boolean;
        sessionId: string | null;
        executionStatus: ExecutionStatus;
        executionResults: string;
        executionError: string | null;
      }>
    ) => {
      if (state.isExecuting !== undefined) setIsExecuting(state.isExecuting);
      if (state.sessionId !== undefined) setSessionId(state.sessionId);
      if (state.executionStatus !== undefined)
        setExecutionStatus(state.executionStatus);
      if (state.executionResults !== undefined)
        setExecutionResults(state.executionResults);
      if (state.executionError !== undefined)
        setExecutionError(state.executionError);
    },
    []
  );

  // Add conversation
  const addConversation = useCallback((conversation: ConversationItem) => {
    setConversations((prev) => [...prev, conversation]);
    setActiveConversationTab((prev) => prev + 1);
  }, []);

  // Remove conversation
  const removeConversation = useCallback((index: number) => {
    setConversations((prev) => prev.filter((_, i) => i !== index));
    setActiveConversationTab((prev) => {
      if (prev >= index && prev > 0) {
        return prev - 1;
      }
      return prev;
    });
  }, []);

  // Clear conversations
  const clearConversations = useCallback(() => {
    setConversations([]);
    setActiveConversationTab(0);
  }, []);

  // Add error
  const addError = useCallback(
    (error: Omit<ErrorState, 'timestamp'>) => {
      const newError: ErrorState = {
        ...error,
        timestamp: new Date(),
      };
      setErrors((prev) => [...prev, newError]);

      // Auto-hide if specified
      if (error.autoHide && error.autoHideDelay) {
        setTimeout(() => {
          setErrors((prev) =>
            prev.filter((e) => e.timestamp !== newError.timestamp)
          );
        }, error.autoHideDelay);
      }
    },
    []
  );

  // Remove error
  const removeError = useCallback((index: number) => {
    setErrors((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Clear errors
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // Set registry auth
  const setRegistryAuth = useCallback((username: string, secret: string) => {
    setRegistryUsername(username);
    setRegistrySecret(secret);
  }, []);

  // Reset container image to default for current language
  const resetContainerImage = useCallback(() => {
    setContainerImage(DEFAULT_CONTAINER_IMAGES[codeLanguage]);
  }, [codeLanguage]);

  // Update container image when language changes
  useEffect(() => {
    setContainerImage(DEFAULT_CONTAINER_IMAGES[codeLanguage]);
  }, [codeLanguage]);

  // Track code modifications
  useEffect(() => {
    if (currentCode && storageInfo) {
      // Code has been edited after storing
      setIsCodeModified(true);
    }
  }, [currentCode, storageInfo]);

  const value: CodeRunnerContextValue = {
    // Code State
    currentCode,
    setCurrentCode,
    codeLanguage,
    setCodeLanguage,
    isCodeModified,
    setIsCodeModified,

    // Execution State
    isExecuting,
    sessionId,
    executionStatus,
    executionResults,
    executionError,
    setExecutionState,

    // Storage State
    storageInfo,
    setStorageInfo,
    isStoring,
    setIsStoring,
    storageError,
    setStorageError,

    // Conversation State
    conversations,
    activeConversationTab,
    setActiveConversationTab,
    addConversation,
    removeConversation,
    clearConversations,

    // Error State
    errors,
    addError,
    removeError,
    clearErrors,

    // Registry Auth State
    registryUsername,
    registrySecret,
    setRegistryAuth,

    // Container Image State
    containerImage,
    setContainerImage,
    resetContainerImage,
  };

  return (
    <CodeRunnerContext.Provider value={value}>
      {children}
    </CodeRunnerContext.Provider>
  );
};
