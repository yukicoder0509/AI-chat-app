import { useState } from "react";
import { Button } from "../Common";
import styles from "./SystemPromptEditor.module.css";

export interface SystemPromptEditorProps {
  value: string;
  onChange: (prompt: string) => void;
}

export const SystemPromptEditor = ({
  value,
  onChange,
}: SystemPromptEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleSave = () => {
    onChange(tempValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className={styles.container}>
        <Button
          variant="secondary"
          onClick={() => setIsEditing(true)}
          size="small"
        >
          Edit System Prompt
        </Button>
        {value && <p className={styles.preview}>{value}</p>}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <label className={styles.label}>System Prompt</label>
      <textarea
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        className={styles.textarea}
        placeholder="Enter a system prompt to customize the assistant's behavior..."
        rows={4}
      />
      <div className={styles.actions}>
        <Button variant="primary" onClick={handleSave} size="small">
          Save
        </Button>
        <Button variant="secondary" onClick={handleCancel} size="small">
          Cancel
        </Button>
      </div>
    </div>
  );
};
