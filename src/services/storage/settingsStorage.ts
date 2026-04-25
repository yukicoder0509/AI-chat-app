/**
 * Settings service for user preferences and API configuration
 * Handles persistence of settings using localStorage
 */

import type { UserSettings, ApiConfig } from "../../types/settings";
import {
  DEFAULT_USER_SETTINGS,
  DEFAULT_API_CONFIG,
} from "../../types/settings";

const SETTINGS_STORAGE_KEY = "ai-chatroom-settings";

export class SettingsStorage {
  /**
   * Load settings from storage, with defaults for missing values
   */
  static loadSettings(): UserSettings {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!stored) {
        return DEFAULT_USER_SETTINGS;
      }

      const parsed = JSON.parse(stored);

      // Merge with defaults to handle missing keys
      return {
        ...DEFAULT_USER_SETTINGS,
        ...parsed,
        apiConfig: {
          ...DEFAULT_API_CONFIG,
          ...parsed.apiConfig,
        },
      };
    } catch (error) {
      console.error("Error loading settings:", error);
      return DEFAULT_USER_SETTINGS;
    }
  }

  /**
   * Save settings to storage
   */
  static saveSettings(settings: UserSettings): void {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Error saving settings:", error);
      throw new Error("Failed to save settings");
    }
  }

  /**
   * Update a specific setting
   */
  static updateSetting<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ): UserSettings {
    const settings = this.loadSettings();
    settings[key] = value;
    this.saveSettings(settings);
    return settings;
  }

  /**
   * Update API configuration
   */
  static updateApiConfig(config: Partial<ApiConfig>): UserSettings {
    const settings = this.loadSettings();
    settings.apiConfig = {
      ...settings.apiConfig,
      ...config,
    };
    this.saveSettings(settings);
    return settings;
  }

  /**
   * Reset settings to defaults
   */
  static resetSettings(): UserSettings {
    this.saveSettings(DEFAULT_USER_SETTINGS);
    return DEFAULT_USER_SETTINGS;
  }

  /**
   * Clear all settings
   */
  static clearSettings(): void {
    try {
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing settings:", error);
      throw new Error("Failed to clear settings");
    }
  }
}
