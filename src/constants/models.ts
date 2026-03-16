/**
 * Available Qwen models and their configuration
 */

import type { ModelConfig } from "../types/settings";

export const AVAILABLE_MODELS: Record<string, ModelConfig> = {
  "qwen35-4b": {
    id: "qwen35-4b",
    name: "qwen35-4b",
    displayName: "Qwen 3.5 (4B)",
    contextWindow: 32768,
    maxTokens: 8192,
    costPer1kInputTokens: 0,
    costPer1kOutputTokens: 0,
  },
  "qwen35-397b": {
    id: "qwen35-397b",
    name: "qwen35-397b",
    displayName: "Qwen 3.5 (397B)",
    contextWindow: 32768,
    maxTokens: 8192,
    costPer1kInputTokens: 0,
    costPer1kOutputTokens: 0,
  },
};

export const DEFAULT_MODEL = "qwen35-4b";

export const MODEL_OPTIONS = Object.values(AVAILABLE_MODELS).map((model) => ({
  value: model.id,
  label: model.displayName,
  contextWindow: model.contextWindow,
  maxTokens: model.maxTokens,
}));
