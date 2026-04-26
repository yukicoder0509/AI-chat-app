import styles from "./ModelSelector.module.css";

export interface ModelSelectorProps {
  selectedModel: string;
  onChange: (model: string) => void;
  models?: string[];
  isLoadingModels?: boolean;
}

export const ModelSelector = ({
  selectedModel,
  onChange,
  models,
  isLoadingModels,
}: ModelSelectorProps) => {
  const options =
    models && models.length > 0
      ? models
      : selectedModel
        ? [selectedModel]
        : [];

  return (
    <div className={styles.container}>
      <label className={styles.label}>Model</label>
      <select
        value={selectedModel}
        onChange={(e) => onChange(e.target.value)}
        className={styles.select}
        disabled={isLoadingModels || options.length === 0}
      >
        {isLoadingModels ? (
          <option value="">Loading models…</option>
        ) : options.length === 0 ? (
          <option value="">No models available</option>
        ) : (
          options.map((id) => (
            <option key={id} value={id}>
              {id === "auto" ? "⚡ Auto" : id}
            </option>
          ))
        )}
      </select>
    </div>
  );
};
