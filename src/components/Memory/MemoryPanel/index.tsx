import { useState } from "react";
import { X, Trash2, Edit2, Check } from "lucide-react";
import type { MemoryEntry } from "../../../types/memory";
import styles from "./MemoryPanel.module.css";

export interface MemoryPanelProps {
  memories: MemoryEntry[];
  onClose: () => void;
  onUpdate: (id: string, fact: string) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export const MemoryPanel = ({
  memories,
  onClose,
  onUpdate,
  onDelete,
  onClearAll,
}: MemoryPanelProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const sorted = [...memories].sort((a, b) => b.createdAt - a.createdAt);

  const handleEditStart = (entry: MemoryEntry) => {
    setEditingId(entry.id);
    setEditValue(entry.fact);
  };

  const handleEditSave = () => {
    if (editingId && editValue.trim()) {
      onUpdate(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  const handleClearAll = () => {
    if (confirmClear) {
      onClearAll();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Long-Term Memory</h2>
          <button className={styles.closeBtn} onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          {sorted.length === 0 ? (
            <div className={styles.empty}>
              <p>No memories stored yet.</p>
              <p className={styles.emptyHint}>
                Facts will be extracted automatically after conversations when memory is enabled.
              </p>
            </div>
          ) : (
            <ul className={styles.list}>
              {sorted.map((entry) => (
                <li key={entry.id} className={styles.item}>
                  {editingId === entry.id ? (
                    <div className={styles.editRow}>
                      <input
                        className={styles.editInput}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleEditSave();
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                      />
                      <button className={styles.iconBtn} onClick={handleEditSave} type="button" title="Save">
                        <Check size={14} />
                      </button>
                      <button className={styles.iconBtn} onClick={() => setEditingId(null)} type="button" title="Cancel">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className={styles.factRow}>
                      <span className={styles.fact}>{entry.fact}</span>
                      <span className={styles.date}>
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        className={styles.iconBtn}
                        onClick={() => handleEditStart(entry)}
                        type="button"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles.deleteBtn}`}
                        onClick={() => onDelete(entry.id)}
                        type="button"
                        title="Delete"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {sorted.length > 0 && (
          <div className={styles.footer}>
            <button
              className={`${styles.clearBtn} ${confirmClear ? styles.clearConfirm : ""}`}
              onClick={handleClearAll}
              type="button"
            >
              <Trash2 size={14} />
              {confirmClear ? "Click again to confirm" : "Clear All"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
