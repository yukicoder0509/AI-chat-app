import { useState, useRef, useCallback } from "react";
import { ArrowUp, Loader2, Paperclip } from "lucide-react";
import type { Attachment } from "../../types/attachments";
import { validateImage } from "../../services/vision/imageProcessor";
import { AttachmentPreview } from "./AttachmentPreview";
import styles from "./InputBox.module.css";

export interface InputBoxProps {
  onSendMessage: (message: string, attachments: Attachment[]) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  attachments?: Attachment[];
  onAttachmentsChange?: (attachments: Attachment[]) => void;
  visionEnabled?: boolean;
  isExtractingMemory?: boolean;
}

export const InputBox = ({
  onSendMessage,
  isLoading = false,
  disabled = false,
  placeholder = "Type your message here...",
  attachments = [],
  onAttachmentsChange,
  visionEnabled = false,
  isExtractingMemory = false,
}: InputBoxProps) => {
  const [message, setMessage] = useState("");
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = useCallback(() => {
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message, attachments);
      setMessage("");
      setAttachmentError(null);

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  }, [message, attachments, onSendMessage, isLoading, disabled]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setMessage(text);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 200) + "px";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setAttachmentError(null);

    const newAttachments: Attachment[] = [];
    for (const file of files) {
      try {
        validateImage(file);
        const previewObjectUrl = URL.createObjectURL(file);
        newAttachments.push({
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          messageId: "",
          type: "image",
          mimeType: file.type as Attachment["mimeType"],
          fileName: file.name,
          fileSizeBytes: file.size,
          previewObjectUrl,
          base64DataUrl: "",
        });
      } catch (err) {
        setAttachmentError(err instanceof Error ? err.message : "Invalid file");
      }
    }

    if (newAttachments.length > 0) {
      onAttachmentsChange?.([...attachments, ...newAttachments]);
    }

    // Reset so the same file can be re-selected
    e.target.value = "";
  };

  const handleRemoveAttachment = (id: string) => {
    const removed = attachments.find((a) => a.id === id);
    if (removed?.previewObjectUrl) URL.revokeObjectURL(removed.previewObjectUrl);
    onAttachmentsChange?.(attachments.filter((a) => a.id !== id));
  };

  return (
    <div className={styles.container}>
      {attachments.length > 0 && (
        <AttachmentPreview attachments={attachments} onRemove={handleRemoveAttachment} />
      )}

      {attachmentError && (
        <p className={styles.attachmentError}>{attachmentError}</p>
      )}

      <div className={styles.inputWrapper}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className={styles.fileInput}
          onChange={handleFileSelect}
        />

        <button
          className={styles.attachButton}
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={!visionEnabled || isLoading || disabled}
          title={
            visionEnabled
              ? "Attach image"
              : "Vision not supported by selected model"
          }
        >
          <Paperclip size={16} />
        </button>

        <textarea
          ref={textareaRef}
          className={styles.textarea}
          placeholder={placeholder}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading || disabled}
          rows={1}
        />
        <button
          className={styles.sendButton}
          onClick={handleSendMessage}
          disabled={!message.trim() || isLoading || disabled}
          title="Send message"
        >
          {isLoading ? <Loader2 size={16} className={styles.spinIcon} /> : <ArrowUp size={16} />}
        </button>
      </div>
      <div className={styles.hintRow}>
        <p className={styles.hint}>Press Ctrl+Enter to send</p>
        {isExtractingMemory && (
          <p className={styles.extractingHint}>Extracting memories…</p>
        )}
      </div>
    </div>
  );
};
