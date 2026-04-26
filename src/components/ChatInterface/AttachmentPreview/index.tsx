import { useEffect } from "react";
import type { Attachment } from "../../../types/attachments";
import styles from "./AttachmentPreview.module.css";

export interface AttachmentPreviewProps {
  attachments: Attachment[];
  onRemove: (id: string) => void;
}

export const AttachmentPreview = ({ attachments, onRemove }: AttachmentPreviewProps) => {
  useEffect(() => {
    return () => {
      attachments.forEach((a) => {
        if (a.previewObjectUrl) URL.revokeObjectURL(a.previewObjectUrl);
      });
    };
  }, [attachments]);

  if (attachments.length === 0) return null;

  return (
    <div className={styles.strip}>
      {attachments.map((attachment) => (
        <div key={attachment.id} className={styles.thumb}>
          <img
            src={attachment.previewObjectUrl || attachment.base64DataUrl}
            alt={attachment.fileName}
            className={styles.image}
          />
          <div className={styles.overlay}>
            <span className={styles.fileName}>{attachment.fileName}</span>
            <button
              className={styles.removeBtn}
              onClick={() => onRemove(attachment.id)}
              title="Remove attachment"
              type="button"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
