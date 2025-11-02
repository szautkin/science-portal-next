export interface ModelPricing {
  input: number;
  cachedInput: number;
  output: number;
}

export interface ModelConfig {
  id: string;
  name: string;
  pricing: ModelPricing;
  enabled: boolean;
  description?: string;
  isDefault?: boolean;
}

export const openAIModels: ModelConfig[] = [
  {
    id: 'gpt-5',
    name: 'GPT-5',
    pricing: {
      input: 1.25,
      cachedInput: 0.125,
      output: 10.0,
    },
    enabled: true,
    description: 'Most advanced model with superior reasoning',
  },
  {
    id: 'gpt-5-mini',
    name: 'GPT-5 Mini',
    pricing: {
      input: 0.25,
      cachedInput: 0.025,
      output: 2.0,
    },
    enabled: true,
    description: 'Fast and efficient for most tasks',
  },
  {
    id: 'gpt-5-nano',
    name: 'GPT-5 Nano',
    pricing: {
      input: 0.05,
      cachedInput: 0.005,
      output: 0.4,
    },
    enabled: true,
    description: 'Ultra-fast for simple tasks',
  },
  {
    id: 'gpt-5-chat-latest',
    name: 'GPT-5 Chat Latest',
    pricing: {
      input: 1.25,
      cachedInput: 0.125,
      output: 10.0,
    },
    enabled: true,
    description: 'Latest chat-optimized model',
  },
  {
    id: 'gpt-4.1',
    name: 'GPT-4.1',
    pricing: {
      input: 2.0,
      cachedInput: 0.5,
      output: 8.0,
    },
    enabled: true,
    description: 'Advanced model with strong capabilities',
  },
  {
    id: 'gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    pricing: {
      input: 0.4,
      cachedInput: 0.1,
      output: 1.6,
    },
    enabled: true,
    isDefault: true,
    description: 'Balanced performance and cost',
  },
  {
    id: 'gpt-4.1-nano',
    name: 'GPT-4.1 Nano',
    pricing: {
      input: 0.1,
      cachedInput: 0.025,
      output: 0.4,
    },
    enabled: true,
    description: 'Cost-effective for basic tasks',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    pricing: {
      input: 2.5,
      cachedInput: 1.25,
      output: 10.0,
    },
    enabled: true,
    description: 'Optimized multimodal model',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    pricing: {
      input: 0.15,
      cachedInput: 0.075,
      output: 0.6,
    },
    enabled: true,
    description: 'Affordable multimodal model',
  },
];

export const getDefaultModel = (): ModelConfig | undefined => {
  return openAIModels.find((m) => m.isDefault) || openAIModels[0];
};
