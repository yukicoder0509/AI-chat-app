import {
  TEMPERATURE,
  MAX_TOKENS,
  TOP_P,
  FREQUENCY_PENALTY,
  PRESENCE_PENALTY,
} from "../../constants/apiDefaults";
import type { ApiConfig } from "../../types/settings";
import styles from "./ApiParametersEditor.module.css";

export interface ApiParametersEditorProps {
  config: ApiConfig;
  onChange: (config: Partial<ApiConfig>) => void;
}

export const ApiParametersEditor = ({
  config,
  onChange,
}: ApiParametersEditorProps) => {
  const handleChange = (key: keyof ApiConfig, value: number) => {
    onChange({ [key]: value });
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>API Parameters</h3>

      <div className={styles.parameter}>
        <label className={styles.label}>
          Temperature ({config.temperature.toFixed(2)})
        </label>
        <input
          type="range"
          min={TEMPERATURE.min}
          max={TEMPERATURE.max}
          step={TEMPERATURE.step}
          value={config.temperature}
          onChange={(e) =>
            handleChange("temperature", parseFloat(e.target.value))
          }
          className={styles.slider}
        />
        <p className={styles.hint}>
          Controls randomness. Lower = more deterministic.
        </p>
      </div>

      <div className={styles.parameter}>
        <label className={styles.label}>Max Tokens ({config.maxTokens})</label>
        <input
          type="range"
          min={MAX_TOKENS.min}
          max={MAX_TOKENS.max}
          step={MAX_TOKENS.step}
          value={config.maxTokens}
          onChange={(e) => handleChange("maxTokens", parseInt(e.target.value))}
          className={styles.slider}
        />
        <p className={styles.hint}>Maximum length of generated response.</p>
      </div>

      <div className={styles.parameter}>
        <label className={styles.label}>Top P ({config.topP.toFixed(2)})</label>
        <input
          type="range"
          min={TOP_P.min}
          max={TOP_P.max}
          step={TOP_P.step}
          value={config.topP}
          onChange={(e) => handleChange("topP", parseFloat(e.target.value))}
          className={styles.slider}
        />
        <p className={styles.hint}>Nucleus sampling. 0.1 to 1 recommended.</p>
      </div>

      <div className={styles.parameter}>
        <label className={styles.label}>
          Frequency Penalty ({config.frequencyPenalty.toFixed(2)})
        </label>
        <input
          type="range"
          min={FREQUENCY_PENALTY.min}
          max={FREQUENCY_PENALTY.max}
          step={FREQUENCY_PENALTY.step}
          value={config.frequencyPenalty}
          onChange={(e) =>
            handleChange("frequencyPenalty", parseFloat(e.target.value))
          }
          className={styles.slider}
        />
        <p className={styles.hint}>Reduces repetition of the same tokens.</p>
      </div>

      <div className={styles.parameter}>
        <label className={styles.label}>
          Presence Penalty ({config.presencePenalty.toFixed(2)})
        </label>
        <input
          type="range"
          min={PRESENCE_PENALTY.min}
          max={PRESENCE_PENALTY.max}
          step={PRESENCE_PENALTY.step}
          value={config.presencePenalty}
          onChange={(e) =>
            handleChange("presencePenalty", parseFloat(e.target.value))
          }
          className={styles.slider}
        />
        <p className={styles.hint}>Encourages discussing new topics.</p>
      </div>
    </div>
  );
};
