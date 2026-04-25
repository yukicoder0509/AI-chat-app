/**
 * Global app configuration store
 * Manages LLM provider settings, API configuration, and app-level state
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { UserSettings, ApiConfig } from "../../types/settings";
import {
  DEFAULT_USER_SETTINGS,
  DEFAULT_API_CONFIG,
} from "../../types/settings";
import { SettingsStorage } from "../../services/storage";

/**
 * App configuration state interface
 */
export interface AppState {
  // Settings
  settings: UserSettings;
  apiConfig: ApiConfig;

  // Settings actions
  setSettings: (settings: UserSettings) => void;
  updateSetting: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => void;
  setApiConfig: (config: ApiConfig) => void;
  updateApiConfig: (config: Partial<ApiConfig>) => void;
  resetSettings: () => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Error handling
  error: string | null;
  setError: (error: string | null) => void;
}

/**
 * Create app configuration store with persistence
 */
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => {
        // Load initial settings from storage
        const initialSettings = SettingsStorage.loadSettings();
        const initialApiConfig =
          initialSettings.apiConfig || DEFAULT_API_CONFIG;

        return {
          // Initial state
          settings: initialSettings,
          apiConfig: initialApiConfig,
          isLoading: false,
          error: null,

          // Settings actions
          setSettings: (settings: UserSettings) => {
            SettingsStorage.saveSettings(settings);
            set({ settings });
          },

          updateSetting: <K extends keyof UserSettings>(
            key: K,
            value: UserSettings[K],
          ) => {
            set((state) => {
              const updated = { ...state.settings, [key]: value };
              SettingsStorage.saveSettings(updated);
              return { settings: updated };
            });
          },

          setApiConfig: (config: ApiConfig) => {
            set((state) => {
              const updated = { ...state.settings, apiConfig: config };
              SettingsStorage.saveSettings(updated);
              return {
                settings: updated,
                apiConfig: config,
              };
            });
          },

          updateApiConfig: (config: Partial<ApiConfig>) => {
            set((state) => {
              const updated = { ...state.apiConfig, ...config };
              const newSettings = { ...state.settings, apiConfig: updated };
              SettingsStorage.saveSettings(newSettings);
              return {
                settings: newSettings,
                apiConfig: updated,
              };
            });
          },

          resetSettings: () => {
            SettingsStorage.resetSettings();
            set({
              settings: DEFAULT_USER_SETTINGS,
              apiConfig: DEFAULT_API_CONFIG,
            });
          },

          // Loading state
          setIsLoading: (loading: boolean) => set({ isLoading: loading }),

          // Error handling
          setError: (error: string | null) => set({ error }),
        };
      },
      {
        name: "app-store",
        version: 1,
      },
    ),
  ),
);
