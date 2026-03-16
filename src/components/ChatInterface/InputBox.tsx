import { useState, useRef, useCallback } from "react";
import { Button } from "../Common";
import styles from "./InputBox.module.css";

export interface InputBoxProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * InputBox component - for user message input
 */
export const InputBox = ({
  onSendMessage,
  isLoading = false,
  disabled = false,
  placeholder = "Type your message here...",
}: InputBoxProps) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSendMessage = useCallback(() => {
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message);
      setMessage("");

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  }, [message, onSendMessage, isLoading, disabled]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }

    // Auto-grow textarea
    if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
      // Allow normal line break
      return;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setMessage(text);

    // Auto-grow textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 200) + "px";
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.inputWrapper}>
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
        <Button
          variant="primary"
          size="medium"
          onClick={handleSendMessage}
          disabled={!message.trim() || isLoading || disabled}
          loading={isLoading}
          className={styles.sendButton}
        >
          Send
        </Button>
      </div>
      <p className={styles.hint}>Press Ctrl+Enter to send</p>
    </div>
  );
};
