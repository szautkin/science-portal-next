'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/**
 * Type definitions for AI configuration state
 */
export interface AIConfigState {
  /** Selected AI vendor (e.g., 'openai') */
  selectedModel: string;
  /** Selected model name (e.g., 'gpt-4.1-mini') */
  selectedModelName: string;
  /** API key for the selected vendor */
  apiKey: string;
}

/**
 * Type definitions for AI configuration context value
 */
export interface AIConfigContextValue extends AIConfigState {
  /** Update the selected model vendor */
  setSelectedModel: (model: string) => void;
  /** Update the selected model name */
  setSelectedModelName: (modelName: string) => void;
  /** Update the API key */
  setApiKey: (apiKey: string) => void;
}

/**
 * Props for AIConfigProvider component
 */
export interface AIConfigProviderProps {
  /** Child components */
  children: ReactNode;
  /** Initial model vendor */
  initialModel?: string;
  /** Initial model name */
  initialModelName?: string;
  /** Initial API key */
  initialApiKey?: string;
}

// Create the context with undefined default value
const AIConfigContext = createContext<AIConfigContextValue | undefined>(undefined);

/**
 * AIConfigProvider component
 *
 * Provides AI configuration state management for the StarAI interface.
 * Manages selected model, model name, and API key with setter functions.
 *
 * @example
 * ```tsx
 * <AIConfigProvider initialModel="openai" initialModelName="gpt-4.1-mini">
 *   <YourComponent />
 * </AIConfigProvider>
 * ```
 */
export function AIConfigProvider({
  children,
  initialModel = 'openai',
  initialModelName = 'gpt-4.1-mini',
  initialApiKey = '',
}: AIConfigProviderProps) {
  const [selectedModel, setSelectedModel] = useState(initialModel);
  const [selectedModelName, setSelectedModelName] = useState(initialModelName);
  const [apiKey, setApiKey] = useState(initialApiKey);

  const handleSetSelectedModel = useCallback((model: string) => {
    setSelectedModel(model);
  }, []);

  const handleSetSelectedModelName = useCallback((modelName: string) => {
    setSelectedModelName(modelName);
  }, []);

  const handleSetApiKey = useCallback((key: string) => {
    setApiKey(key);
  }, []);

  const value: AIConfigContextValue = {
    selectedModel,
    selectedModelName,
    apiKey,
    setSelectedModel: handleSetSelectedModel,
    setSelectedModelName: handleSetSelectedModelName,
    setApiKey: handleSetApiKey,
  };

  return (
    <AIConfigContext.Provider value={value}>
      {children}
    </AIConfigContext.Provider>
  );
}

/**
 * Hook to access AI configuration context
 *
 * @throws {Error} If used outside of AIConfigProvider
 * @returns {AIConfigContextValue} The AI configuration context value
 *
 * @example
 * ```tsx
 * const { selectedModel, selectedModelName, apiKey, setApiKey } = useAIConfig();
 * ```
 */
export function useAIConfig(): AIConfigContextValue {
  const context = useContext(AIConfigContext);

  if (context === undefined) {
    throw new Error('useAIConfig must be used within an AIConfigProvider');
  }

  return context;
}
