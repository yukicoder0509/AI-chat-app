import { useState } from "react";
import { Plus, Trash2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import type { McpServer } from "../../../types/mcp";
import type { UseToolsReturn } from "../../../hooks/useTools";
import styles from "./McpSettings.module.css";

export interface McpSettingsProps {
  servers: McpServer[];
  onAddServer: UseToolsReturn["addServer"];
  onUpdateServer: UseToolsReturn["updateServer"];
  onRemoveServer: UseToolsReturn["removeServer"];
  onReconnect: UseToolsReturn["reconnect"];
}

const STATUS_LABEL: Record<string, string> = {
  connected: "Connected",
  disconnected: "Disconnected",
  connecting: "Connecting…",
  error: "Error",
};

export const McpSettings = ({
  servers,
  onAddServer,
  onUpdateServer,
  onRemoveServer,
  onReconnect,
}: McpSettingsProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedServerId, setExpandedServerId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleTestAndSave = async () => {
    if (!newName.trim() || !newUrl.trim()) {
      setAddError("Name and URL are required.");
      return;
    }
    try { new URL(newUrl); } catch {
      setAddError("Please enter a valid URL.");
      return;
    }

    setAddError(null);
    setIsSaving(true);
    try {
      await onAddServer({ name: newName.trim(), url: newUrl.trim(), enabled: true });
      setNewName("");
      setNewUrl("");
      setShowAddForm(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      onRemoveServer(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  };

  return (
    <div className={styles.container}>
      {servers.length === 0 && !showAddForm ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No MCP servers configured</p>
          <p className={styles.emptyDesc}>
            Add an MCP server to enable tool use in conversations. MCP servers expose tools
            the assistant can call mid-response via the Model Context Protocol.
          </p>
          <button className={styles.addBtn} onClick={() => setShowAddForm(true)} type="button">
            <Plus size={14} />
            Add Server
          </button>
        </div>
      ) : (
        <>
          <ul className={styles.serverList}>
            {servers.map((server) => (
              <li key={server.id} className={styles.serverItem}>
                <div className={styles.serverRow}>
                  <div className={styles.serverInfo}>
                    <span className={styles.serverName}>{server.name}</span>
                    <span className={`${styles.statusBadge} ${styles[server.status]}`}>
                      {STATUS_LABEL[server.status] ?? server.status}
                    </span>
                    {server.status === "error" && server.statusMessage && (
                      <span className={styles.errorMsg}>{server.statusMessage}</span>
                    )}
                  </div>

                  <div className={styles.serverActions}>
                    {(server.status === "disconnected" || server.status === "error") && (
                      <button
                        className={styles.iconBtn}
                        onClick={() => onReconnect(server.id)}
                        title="Reconnect"
                        type="button"
                      >
                        <RefreshCw size={14} />
                      </button>
                    )}

                    <label className={styles.toggleLabel} title={server.enabled ? "Disable" : "Enable"}>
                      <input
                        type="checkbox"
                        checked={server.enabled}
                        onChange={(e) => onUpdateServer(server.id, { enabled: e.target.checked })}
                        className={styles.toggleInput}
                      />
                      <span className={`${styles.toggleTrack} ${server.enabled ? styles.toggleOn : ""}`}>
                        <span className={styles.toggleThumb} />
                      </span>
                    </label>

                    <button
                      className={`${styles.iconBtn} ${confirmDeleteId === server.id ? styles.iconBtnDanger : ""}`}
                      onClick={() => handleDelete(server.id)}
                      title={confirmDeleteId === server.id ? "Click again to confirm" : "Delete"}
                      type="button"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {server.status === "connected" && server.tools.length > 0 && (
                  <div className={styles.toolsSection}>
                    <button
                      className={styles.toolsToggle}
                      onClick={() =>
                        setExpandedServerId(expandedServerId === server.id ? null : server.id)
                      }
                      type="button"
                    >
                      {server.tools.length} tool{server.tools.length !== 1 ? "s" : ""} available
                      {expandedServerId === server.id ? (
                        <ChevronUp size={12} />
                      ) : (
                        <ChevronDown size={12} />
                      )}
                    </button>

                    {expandedServerId === server.id && (
                      <ul className={styles.toolList}>
                        {server.tools.map((tool) => (
                          <li key={tool.name} className={styles.toolItem}>
                            <span className={styles.toolName}>{tool.name}</span>
                            {tool.description && (
                              <span className={styles.toolDesc}>{tool.description}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>

          {!showAddForm ? (
            <button className={styles.addBtn} onClick={() => setShowAddForm(true)} type="button">
              <Plus size={14} />
              Add Server
            </button>
          ) : null}
        </>
      )}

      {showAddForm && (
        <div className={styles.addForm}>
          <p className={styles.formTitle}>Add MCP Server</p>
          <input
            className={styles.input}
            placeholder="Server name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />
          <input
            className={styles.input}
            placeholder="URL (e.g. http://localhost:3001/mcp)"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleTestAndSave()}
          />
          {addError && <p className={styles.formError}>{addError}</p>}
          <div className={styles.formButtons}>
            <button
              className={styles.cancelBtn}
              onClick={() => { setShowAddForm(false); setAddError(null); }}
              type="button"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              className={styles.saveBtn}
              onClick={handleTestAndSave}
              type="button"
              disabled={isSaving}
            >
              {isSaving ? "Connecting…" : "Test & Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
