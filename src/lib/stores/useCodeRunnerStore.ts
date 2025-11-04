/**
 * Code Runner Store (Zustand)
 *
 * Manages code runner state with persistence to localStorage
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  ConversationItem,
  CodeLanguage,
  ExecutionStatus,
  StorageInfo,
} from '@/app/types/CodeRunnerTypes';

interface ExecutionState {
  isExecuting: boolean;
  sessionId: string | null;
  executionStatus: ExecutionStatus;
  executionResults: string;
  executionError: string | null;
  startTime: Date | null;
  endTime: Date | null;
}

interface CodeRunnerState {
  // Code State
  currentCode: string;
  codeLanguage: CodeLanguage;
  isCodeModified: boolean;

  // Execution State
  execution: ExecutionState;

  // Storage State
  storageInfo: StorageInfo | null;
  isStoring: boolean;
  storageError: string | null;

  // Conversation State
  conversations: ConversationItem[];
  activeConversationTab: number;

  // Preferences
  preferences: {
    cores: number;
    ram: number;
    defaultLanguage: CodeLanguage;
    autoSave: boolean;
  };

  // Actions - Code
  setCurrentCode: (code: string) => void;
  setCodeLanguage: (language: CodeLanguage) => void;
  setIsCodeModified: (modified: boolean) => void;
  clearCode: () => void;

  // Actions - Execution
  startExecution: (sessionId: string) => void;
  updateExecutionStatus: (status: ExecutionStatus) => void;
  setExecutionResults: (results: string) => void;
  setExecutionError: (error: string) => void;
  completeExecution: (results: string, endTime: Date) => void;
  failExecution: (error: string, endTime: Date) => void;
  cancelExecution: () => void;
  resetExecution: () => void;

  // Actions - Storage
  setStorageInfo: (info: StorageInfo | null) => void;
  setIsStoring: (storing: boolean) => void;
  setStorageError: (error: string | null) => void;
  markAsStored: (info: StorageInfo) => void;

  // Actions - Conversations
  addConversation: (conversation: ConversationItem) => void;
  removeConversation: (index: number) => void;
  setActiveConversationTab: (index: number) => void;
  clearConversations: () => void;
  loadConversationCode: (index: number) => void;

  // Actions - Preferences
  updatePreferences: (preferences: Partial<CodeRunnerState['preferences']>) => void;

  // Actions - Reset
  resetAll: () => void;
}

const initialExecutionState: ExecutionState = {
  isExecuting: false,
  sessionId: null,
  executionStatus: 'idle',
  executionResults: '',
  executionError: null,
  startTime: null,
  endTime: null,
};

const initialState = {
  currentCode: '',
  codeLanguage: 'python' as CodeLanguage,
  isCodeModified: false,
  execution: initialExecutionState,
  storageInfo: null,
  isStoring: false,
  storageError: null,
  conversations: [],
  activeConversationTab: 0,
  preferences: {
    cores: 2,
    ram: 4,
    defaultLanguage: 'python' as CodeLanguage,
    autoSave: true,
  },
};

export const useCodeRunnerStore = create<CodeRunnerState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Code Actions
        setCurrentCode: (code) =>
          set((state) => ({
            currentCode: code,
            isCodeModified: state.storageInfo !== null, // Modified if already stored
          })),

        setCodeLanguage: (language) =>
          set({ codeLanguage: language }),

        setIsCodeModified: (modified) =>
          set({ isCodeModified: modified }),

        clearCode: () =>
          set({
            currentCode: '',
            isCodeModified: false,
            storageInfo: null,
            execution: initialExecutionState,
          }),

        // Execution Actions
        startExecution: (sessionId) =>
          set({
            execution: {
              isExecuting: true,
              sessionId,
              executionStatus: 'running',
              executionResults: '',
              executionError: null,
              startTime: new Date(),
              endTime: null,
            },
          }),

        updateExecutionStatus: (status) =>
          set((state) => ({
            execution: {
              ...state.execution,
              executionStatus: status,
            },
          })),

        setExecutionResults: (results) =>
          set((state) => ({
            execution: {
              ...state.execution,
              executionResults: results,
            },
          })),

        setExecutionError: (error) =>
          set((state) => ({
            execution: {
              ...state.execution,
              executionError: error,
            },
          })),

        completeExecution: (results, endTime) =>
          set((state) => ({
            execution: {
              ...state.execution,
              isExecuting: false,
              executionStatus: 'completed',
              executionResults: results,
              executionError: null,
              endTime,
            },
          })),

        failExecution: (error, endTime) =>
          set((state) => ({
            execution: {
              ...state.execution,
              isExecuting: false,
              executionStatus: 'error',
              executionError: error,
              endTime,
            },
          })),

        cancelExecution: () =>
          set((state) => ({
            execution: {
              ...state.execution,
              isExecuting: false,
              executionStatus: 'error',
              executionError: 'Execution canceled by user',
              endTime: new Date(),
            },
          })),

        resetExecution: () =>
          set({ execution: initialExecutionState }),

        // Storage Actions
        setStorageInfo: (info) =>
          set({ storageInfo: info }),

        setIsStoring: (storing) =>
          set({ isStoring: storing }),

        setStorageError: (error) =>
          set({ storageError: error }),

        markAsStored: (info) =>
          set({
            storageInfo: info,
            isCodeModified: false,
            storageError: null,
          }),

        // Conversation Actions
        addConversation: (conversation) =>
          set((state) => ({
            conversations: [...state.conversations, conversation],
            activeConversationTab: state.conversations.length,
          })),

        removeConversation: (index) =>
          set((state) => {
            const newConversations = state.conversations.filter((_, i) => i !== index);
            let newActiveTab = state.activeConversationTab;

            // Adjust active tab if needed
            if (newActiveTab >= index && newActiveTab > 0) {
              newActiveTab--;
            }

            return {
              conversations: newConversations,
              activeConversationTab: Math.min(newActiveTab, newConversations.length - 1),
            };
          }),

        setActiveConversationTab: (index) =>
          set({ activeConversationTab: index }),

        clearConversations: () =>
          set({
            conversations: [],
            activeConversationTab: 0,
          }),

        loadConversationCode: (index) => {
          const conversation = get().conversations[index];
          if (conversation?.code && conversation?.language) {
            set({
              currentCode: conversation.code,
              codeLanguage: conversation.language,
              isCodeModified: false,
              storageInfo: null, // Reset storage since this is a new code load
              execution: initialExecutionState, // Reset execution
            });
          }
        },

        // Preferences Actions
        updatePreferences: (preferences) =>
          set((state) => ({
            preferences: {
              ...state.preferences,
              ...preferences,
            },
          })),

        // Reset All
        resetAll: () =>
          set(initialState),
      }),
      {
        name: 'code-runner-storage',
        partialize: (state) => ({
          // Only persist certain fields
          currentCode: state.currentCode,
          codeLanguage: state.codeLanguage,
          storageInfo: state.storageInfo,
          conversations: state.conversations.slice(-10), // Keep last 10 conversations
          activeConversationTab: state.activeConversationTab,
          preferences: state.preferences,
          // Don't persist execution state (ephemeral)
        }),
      }
    ),
    { name: 'CodeRunnerStore' }
  )
);

// Selectors for optimized access
export const useCurrentCode = () => useCodeRunnerStore((state) => state.currentCode);
export const useCodeLanguage = () => useCodeRunnerStore((state) => state.codeLanguage);
export const useExecutionState = () => useCodeRunnerStore((state) => state.execution);
export const useConversations = () => useCodeRunnerStore((state) => state.conversations);
export const usePreferences = () => useCodeRunnerStore((state) => state.preferences);
