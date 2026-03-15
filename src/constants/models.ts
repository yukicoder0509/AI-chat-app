/**
 * Available OpenAI models and their configuration
 */

import type { ModelConfig } from '../types/settings'

export const AVAILABLE_MODELS: Record<string, ModelConfig> = {
  'gpt-4': {
    id: 'gpt-4',
    name: 'gpt-4',
    displayName: 'GPT-4',
    contextWindow: 8192,
    maxTokens: 8192,
    costPer1kInputTokens: 0.03,
    costPer1kOutputTokens: 0.06,
  },
  'gpt-4-turbo': {
    id: 'gpt-4-turbo',
    name: 'gpt-4-turbo',
    displayName: 'GPT-4 Turbo',
    contextWindow: 128000,
    maxTokens: 4096,
    costPer1kInputTokens: 0.01,
    costPer1kOutputTokens: 0.03,
  },
  'gpt-3.5-turbo': {
    id: 'gpt-3.5-turbo',
    name: 'gpt-3.5-turbo',
    displayName: 'GPT-3.5 Turbo',
    contextWindow: 4096,
    maxTokens: 2048,
    costPer1kInputTokens: 0.0005,
    costPer1kOutputTokens: 0.0015,
  },
}

export const DEFAULT_MODEL = 'gpt-3.5-turbo'

export const MODEL_OPTIONS = Object.values(AVAILABLE_MODELS).map((model) => ({
  value: model.id,
  label: model.displayName,
  contextWindow: model.contextWindow,
  maxTokens: model.maxTokens,
}))
