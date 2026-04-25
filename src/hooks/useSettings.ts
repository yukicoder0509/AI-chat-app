/**
 * useSettings hook
 * Provides settings management functionality
 */

import { useCallback } from "react";
import { useAppStore } from "../app/store";
import type { UserSettings, ApiConfig } from "../types/settings";

/**
 * Hook for settings management
 */
export const useSettings = () => {
  const appState = useAppStore();

  /**
   * Update API key
   */
  const setApiKey = useCallback(
    (apiKey: string) => {
      appState.updateSetting("apiKey", apiKey);
    },
    [appState],
  );

  /**
   * Update API URL
   */
  const setApiUrl = useCallback(
    (apiUrl: string) => {
      appState.updateSetting("apiUrl", apiUrl);
    },
    [appState],
  );

  /**
   * Update selected model
   */
  const setSelectedModel = useCallback(
    (model: string) => {
      appState.updateSetting("selectedModel", model);
    },
    [appState],
  );

  /**
   * Update system prompt
   */
  const setSystemPrompt = useCallback(
    (prompt: string) => {
      appState.updateSetting("systemPrompt", prompt);
    },
    [appState],
  );

  /**
   * Update temperature
   */
  const setTemperature = useCallback(
    (temperature: number) => {
      appState.updateApiConfig({ temperature });
    },
    [appState],
  );

  /**
   * Update max tokens
   */
  const setMaxTokens = useCallback(
    (maxTokens: number) => {
      appState.updateApiConfig({ maxTokens });
    },
    [appState],
  );

  /**
   * Update top_p
   */
  const setTopP = useCallback(
    (topP: number) => {
      appState.updateApiConfig({ topP });
    },
    [appState],
  );

  /**
   * Update frequency penalty
   */
  const setFrequencyPenalty = useCallback(
    (frequencyPenalty: number) => {
      appState.updateApiConfig({ frequencyPenalty });
    },
    [appState],
  );

  /**
   * Update presence penalty
   */
  const setPresencePenalty = useCallback(
    (presencePenalty: number) => {
      appState.updateApiConfig({ presencePenalty });
    },
    [appState],
  );

  /**
   * Update all API config at once
   */
  const updateApiConfig = useCallback(
    (config: Partial<ApiConfig>) => {
      appState.updateApiConfig(config);
    },
    [appState],
  );

  /**
   * Update all settings at once
   */
  const updateSettings = useCallback(
    (settings: Partial<UserSettings>) => {
      const current = appState.settings;
      appState.setSettings({ ...current, ...settings });
    },
    [appState],
  );

  /**
   * Reset to defaults
   */
  const resetToDefaults = useCallback(() => {
    appState.resetSettings();
  }, [appState]);

  return {
    // State
    settings: appState.settings,
    apiConfig: appState.apiConfig,
    apiKey: appState.settings.apiKey,
    apiUrl: appState.settings.apiUrl,
    selectedModel: appState.settings.selectedModel,
    systemPrompt: appState.settings.systemPrompt,
    defaultModel: appState.settings.selectedModel,
    defaultSystemPrompt: appState.settings.systemPrompt,

    // Actions
    setApiKey,
    setApiUrl,
    setSelectedModel,
    setSystemPrompt,
    setTemperature,
    setMaxTokens,
    setTopP,
    setFrequencyPenalty,
    setPresencePenalty,
    updateApiConfig,
    updateSettings,
    resetToDefaults,
  };
};
