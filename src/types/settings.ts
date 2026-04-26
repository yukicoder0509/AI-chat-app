/**
 * Settings and configuration TypeScript types
 */

export interface ModelConfig {
  id: string;
  name: string;
  displayName: string;
  contextWindow: number;
  maxTokens: number;
  costPer1kInputTokens: number;
  costPer1kOutputTokens: number;
}

export interface ApiConfig {
  temperature: number; // 0-2
  maxTokens: number;
  topP: number; // 0-1
  frequencyPenalty: number; // -2 to 2
  presencePenalty: number; // -2 to 2
}

export interface UserSettings {
  selectedModel: string; // any model ID from /v1/models, OR "auto" which activates routing
  systemPrompt: string;
  apiUrl: string;
  apiKey: string;
  apiConfig: ApiConfig;
  theme: "light" | "dark" | "auto";
  autoSave: boolean;
  memoryEnabled: boolean;
}

export interface SettingsState {
  settings: UserSettings;
  updateModel: (model: string) => void;
  updateSystemPrompt: (prompt: string) => void;
  updateApiConfig: (config: Partial<ApiConfig>) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  resetSettings: () => void;
}

export const DEFAULT_API_CONFIG: ApiConfig = {
  temperature: 0.7,
  maxTokens: 2000,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  selectedModel: "",
  systemPrompt:
    "You are a helpful, harmless, and honest assistant. Help the user with their questions.",
  apiUrl: import.meta.env.VITE_LLM_API_URL,
  apiKey: import.meta.env.VITE_LLM_API_KEY,
  apiConfig: DEFAULT_API_CONFIG,
  theme: "auto",
  autoSave: true,
  memoryEnabled: false,
};
