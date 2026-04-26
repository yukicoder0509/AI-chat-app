import { useState } from "react";
import { Loader2, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from "lucide-react";
import type { ToolCall } from "../../../types/mcp";
import styles from "./ToolCallBlock.module.css";

export interface ToolCallBlockProps {
  toolCall: ToolCall;
}

export const ToolCallBlock = ({ toolCall }: ToolCallBlockProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`${styles.card} ${styles[toolCall.status]}`}>
      <div className={styles.header} onClick={() => toolCall.status === "complete" && setExpanded((v) => !v)}>
        <div className={styles.left}>
          {(toolCall.status === "pending" || toolCall.status === "running") && (
            <Loader2 size={14} className={styles.spinner} />
          )}
          {toolCall.status === "complete" && <CheckCircle size={14} className={styles.iconComplete} />}
          {toolCall.status === "error" && <AlertCircle size={14} className={styles.iconError} />}

          <span className={styles.toolName}>{toolCall.toolName}</span>
          {toolCall.serverId && (
            <span className={styles.serverLabel}>via {toolCall.serverId}</span>
          )}
        </div>

        <div className={styles.right}>
          {toolCall.status === "pending" && <span className={styles.statusText}>Waiting…</span>}
          {toolCall.status === "running" && <span className={styles.statusText}>Running…</span>}
          {toolCall.status === "error" && (
            <span className={styles.statusError}>{toolCall.error ?? "Error"}</span>
          )}
          {toolCall.status === "complete" && (
            <button className={styles.toggleBtn} type="button">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>

      {toolCall.status === "complete" && expanded && toolCall.result && (
        <div className={styles.result}>
          <pre>{toolCall.result}</pre>
        </div>
      )}
    </div>
  );
};
