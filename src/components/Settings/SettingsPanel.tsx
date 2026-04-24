import { useState } from "react";
import { X } from "lucide-react";
import { Button, Input } from "../Common";
import { ModelSelector } from "./ModelSelector";
import { SystemPromptEditor } from "./SystemPromptEditor";
import { ApiParametersEditor } from "./ApiParametersEditor";
import { useSettings } from "../../hooks";
import styles from "./SettingsPanel.module.css";

export interface SettingsPanelProps {
  onClose: () => void;
}

export const SettingsPanel = ({ onClose }: SettingsPanelProps) => {
  const settings = useSettings();
  const [activeTab, setActiveTab] = useState<"general" | "api">("general");

  const handleApiKeyChange = (key: string) => {
    settings.setApiKey(key);
  };

  const handleApiUrlChange = (url: string) => {
    settings.setApiUrl(url);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Settings</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "general" ? styles.active : ""}`}
            onClick={() => setActiveTab("general")}
          >
            General
          </button>
          <button
            className={`${styles.tab} ${activeTab === "api" ? styles.active : ""}`}
            onClick={() => setActiveTab("api")}
          >
            API
          </button>
        </div>

        <div className={styles.content}>
          <div className={`${styles.section} ${activeTab !== "general" ? styles.sectionHidden : ""}`}>
            <Input
              label="API Key"
              type="password"
              value={settings.apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder="sk-..."
              fullWidth
            />

            <Input
              label="API URL"
              type="url"
              value={settings.apiUrl}
              onChange={(e) => handleApiUrlChange(e.target.value)}
              placeholder="https://..."
              fullWidth
            />

            <ModelSelector
              selectedModel={settings.selectedModel}
              onChange={(model) => settings.setSelectedModel(model)}
            />

            <SystemPromptEditor
              value={settings.systemPrompt}
              onChange={(prompt) => settings.setSystemPrompt(prompt)}
            />
          </div>

          <div className={`${styles.section} ${activeTab !== "api" ? styles.sectionHidden : ""}`}>
            <ApiParametersEditor
              config={settings.apiConfig}
              onChange={(config) => settings.updateApiConfig(config)}
            />
          </div>
        </div>

        <div className={styles.footer}>
          <Button
            variant="secondary"
            onClick={() => settings.resetToDefaults()}
            size="small"
          >
            Reset to Defaults
          </Button>
          <Button variant="primary" onClick={onClose} size="small">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
