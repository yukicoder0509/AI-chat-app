import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "../../types/chat";
import { formatTimestamp, getRoleLabel } from "../../utils";
import styles from "./MessageList.module.css";

export interface MessageListProps {
  messages: Message[];
  streamingContent?: string;
  isStreaming?: boolean;
  isLoading?: boolean;
}

/**
 * MessageList component - displays chat messages
 */
export const MessageList = ({
  messages,
  streamingContent = "",
  isStreaming = false,
  isLoading = false,
}: MessageListProps) => {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  return (
    <div className={styles.container}>
      {messages.length === 0 && !isStreaming ? (
        <div className={styles.empty}>
          <p>No messages yet. Start a conversation!</p>
        </div>
      ) : null}

      <div className={styles.messageList}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.messageGroup} ${styles[message.role]}`}
          >
            <div className={styles.messageContent}>
              <div className={styles.messageHeader}>
                <span className={styles.role}>
                  {getRoleLabel(message.role)}
                </span>
                <span className={styles.timestamp}>
                  {formatTimestamp(message.timestamp, "time")}
                </span>
              </div>
              <div className={styles.messageText}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {isStreaming && streamingContent && (
          <div className={`${styles.messageGroup} ${styles.assistant}`}>
            <div className={styles.messageContent}>
              <div className={styles.messageHeader}>
                <span className={styles.role}>Assistant</span>
                <span className={styles.streaming}>Streaming...</span>
              </div>
              <div className={styles.messageText}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {streamingContent}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className={styles.loadingIndicator}>
            <div className={styles.spinner} />
            <p>Loading...</p>
          </div>
        )}
      </div>

      <div ref={endRef} />
    </div>
  );
};
