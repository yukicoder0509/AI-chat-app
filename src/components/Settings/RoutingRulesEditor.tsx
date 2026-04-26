import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { loadRoutingConfig, saveRoutingConfig } from "../../services/routing/routingConfig";
import type { RoutingRule } from "../../types/routing";
import styles from "./RoutingRulesEditor.module.css";

export interface RoutingRulesEditorProps {
  availableModels?: string[];
}

export const RoutingRulesEditor = ({ availableModels = [] }: RoutingRulesEditorProps) => {
  const [rules, setRules] = useState<RoutingRule[]>([]);

  useEffect(() => {
    setRules(loadRoutingConfig().rules);
  }, []);

  const persist = (next: RoutingRule[]) => {
    setRules(next);
    saveRoutingConfig({ rules: next });
  };

  const addRule = () => persist([...rules, { keyword: "", model: "" }]);

  const updateRule = (index: number, field: keyof RoutingRule, value: string) => {
    const next = rules.map((r, i) => (i === index ? { ...r, [field]: value } : r));
    persist(next);
  };

  const removeRule = (index: number) => persist(rules.filter((_, i) => i !== index));

  return (
    <div className={styles.container}>
      <p className={styles.description}>
        When "Auto" routing is active, messages matching a keyword are sent to the specified model.
        Rules are checked top-to-bottom; first match wins. Falls back to capability-based routing if
        no rule matches or the model is unavailable.
      </p>

      {rules.length > 0 && (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span>Keyword (regex)</span>
            <span>Model</span>
            <span />
          </div>
          {rules.map((rule, i) => (
            <div key={i} className={styles.row}>
              <input
                className={styles.input}
                placeholder="e.g. translate|summarize"
                value={rule.keyword}
                onChange={(e) => updateRule(i, "keyword", e.target.value)}
              />
              {availableModels.length > 0 ? (
                <select
                  className={styles.select}
                  value={rule.model}
                  onChange={(e) => updateRule(i, "model", e.target.value)}
                >
                  <option value="">— pick model —</option>
                  {availableModels.filter((m) => m !== "auto").map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              ) : (
                <input
                  className={styles.input}
                  placeholder="model-id"
                  value={rule.model}
                  onChange={(e) => updateRule(i, "model", e.target.value)}
                />
              )}
              <button className={styles.removeButton} onClick={() => removeRule(i)} type="button">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button className={styles.addButton} onClick={addRule} type="button">
        <Plus size={14} />
        Add rule
      </button>
    </div>
  );
};
