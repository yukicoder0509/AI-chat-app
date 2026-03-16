import { AVAILABLE_MODELS, MODEL_OPTIONS } from "../../constants";
import styles from "./ModelSelector.module.css";

export interface ModelSelectorProps {
  selectedModel: string;
  onChange: (model: string) => void;
}

export const ModelSelector = ({
  selectedModel,
  onChange,
}: ModelSelectorProps) => {
  return (
    <div className={styles.container}>
      <label className={styles.label}>Model</label>
      <select
        value={selectedModel}
        onChange={(e) => onChange(e.target.value)}
        className={styles.select}
      >
        {MODEL_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label} ({option.contextWindow.toLocaleString()} tokens)
          </option>
        ))}
      </select>

      {selectedModel in AVAILABLE_MODELS && (
        <div className={styles.info}>
          <p>
            <strong>Context:</strong>{" "}
            {AVAILABLE_MODELS[selectedModel].contextWindow.toLocaleString()}{" "}
            tokens
          </p>
          <p>
            <strong>Max Output:</strong>{" "}
            {AVAILABLE_MODELS[selectedModel].maxTokens.toLocaleString()} tokens
          </p>
        </div>
      )}
    </div>
  );
};
