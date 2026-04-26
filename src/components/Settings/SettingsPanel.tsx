import { useState } from "react";
import { X } from "lucide-react";
import { Button, Input } from "../Common";
import { ModelSelector } from "./ModelSelector";
import { SystemPromptEditor } from "./SystemPromptEditor";
import { ApiParametersEditor } from "./ApiParametersEditor";
import { McpSettings } from "./McpSettings";
import { RoutingRulesEditor } from "./RoutingRulesEditor";
import { useSettings, useModels } from "../../hooks";
import { useAppStore } from "../../app/store";
import type { McpServer } from "../../types/mcp";
import type { UseToolsReturn } from "../../hooks/useTools";
import styles from "./SettingsPanel.module.css";

export interface SettingsPanelProps {
  onClose: () => void;
  onOpenMemoryPanel?: () => void;
  mcpServers?: McpServer[];
  mcpActions?: Pick<UseToolsReturn, "addServer" | "updateServer" | "removeServer" | "reconnect">;
}

export const SettingsPanel = ({
  onClose,
  onOpenMemoryPanel,
  mcpServers = [],
  mcpActions,
}: SettingsPanelProps) => {
  const settings = useSettings();
  const { models, isLoadingModels } = useModels();
  const { updateSetting } = useAppStore();
  const [activeTab, setActiveTab] = useState<"general" | "api" | "mcp" | "routing">("general");

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
          <button
            className={`${styles.tab} ${activeTab === "mcp" ? styles.active : ""}`}
            onClick={() => setActiveTab("mcp")}
          >
            MCP
          </button>
          <button
            className={`${styles.tab} ${activeTab === "routing" ? styles.active : ""}`}
            onClick={() => setActiveTab("routing")}
          >
            Routing
          </button>
        </div>

        <div className={styles.content}>
          <div className={`${styles.section} ${activeTab !== "general" ? styles.sectionHidden : ""}`}>
            <Input
              label="API Key"
              type="password"
              value={settings.apiKey}
              onChange={(e) => settings.setApiKey(e.target.value)}
              placeholder="sk-..."
              fullWidth
            />

            <Input
              label="API URL"
              type="url"
              value={settings.apiUrl}
              onChange={(e) => settings.setApiUrl(e.target.value)}
              placeholder="https://..."
              fullWidth
            />

            <ModelSelector
              selectedModel={settings.selectedModel}
              onChange={(model) => settings.setSelectedModel(model)}
              models={models}
              isLoadingModels={isLoadingModels}
            />

            <SystemPromptEditor
              value={settings.systemPrompt}
              onChange={(prompt) => settings.setSystemPrompt(prompt)}
            />

            <div className={styles.toggleRow}>
              <label className={styles.toggleLabel}>
                <span>Long-Term Memory</span>
                <span className={styles.toggleDesc}>Extract and recall facts across conversations</span>
              </label>
              <button
                className={`${styles.toggle} ${settings.settings.memoryEnabled ? styles.toggleOn : ""}`}
                onClick={() => updateSetting("memoryEnabled", !settings.settings.memoryEnabled)}
                type="button"
                role="switch"
                aria-checked={settings.settings.memoryEnabled}
              >
                <span className={styles.toggleThumb} />
              </button>
            </div>

            {onOpenMemoryPanel && (
              <button className={styles.memoryLink} onClick={onOpenMemoryPanel} type="button">
                Manage Memories →
              </button>
            )}
          </div>

          <div className={`${styles.section} ${activeTab !== "api" ? styles.sectionHidden : ""}`}>
            <ApiParametersEditor
              config={settings.apiConfig}
              onChange={(config) => settings.updateApiConfig(config)}
            />
          </div>

          <div className={`${styles.section} ${activeTab !== "mcp" ? styles.sectionHidden : ""}`}>
            {mcpActions ? (
              <McpSettings
                servers={mcpServers}
                onAddServer={mcpActions.addServer}
                onUpdateServer={mcpActions.updateServer}
                onRemoveServer={mcpActions.removeServer}
                onReconnect={mcpActions.reconnect}
              />
            ) : (
              <p className={styles.mcpNote}>MCP actions not available.</p>
            )}
          </div>

          <div className={`${styles.section} ${activeTab !== "routing" ? styles.sectionHidden : ""}`}>
            <RoutingRulesEditor availableModels={models} />
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
