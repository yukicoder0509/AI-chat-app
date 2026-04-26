import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "../../types/chat";
import { formatTimestamp, getRoleLabel } from "../../utils";
import { ToolCallBlock } from "./ToolCallBlock";
import styles from "./MessageList.module.css";

export interface MessageListProps {
  messages: Message[];
  streamingContent?: string;
  isStreaming?: boolean;
  isLoading?: boolean;
}

export const MessageList = ({
  messages,
  streamingContent = "",
  isStreaming = false,
  isLoading = false,
}: MessageListProps) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Hide "tool" role messages from display (they're shown via ToolCallBlock)
  const visibleMessages = messages.filter((m) => m.role !== "tool");

  return (
    <div className={styles.container}>
      {visibleMessages.length === 0 && !isStreaming ? (
        <div className={styles.empty}>
          <p>No messages yet. Start a conversation!</p>
        </div>
      ) : null}

      <div className={styles.messageList}>
        {visibleMessages.map((message) => (
          <div
            key={message.id}
            className={`${styles.messageGroup} ${styles[message.role]}`}
          >
            <div className={styles.messageContent}>
              <div className={styles.messageHeader}>
                <span className={styles.role}>
                  {getRoleLabel(message.role)}
                </span>
                {message.role === "assistant" && message.model && (
                  <span className={styles.modelBadge}>{message.model}</span>
                )}
                <span className={styles.timestamp}>
                  {formatTimestamp(message.timestamp, "time")}
                </span>
              </div>

              {message.role === "user" && message.attachments && message.attachments.length > 0 && (
                <div className={styles.attachmentThumbs}>
                  {message.attachments.map((att) => (
                    <img
                      key={att.id}
                      src={att.base64DataUrl}
                      alt={att.fileName}
                      className={styles.attachmentThumb}
                      title={att.fileName}
                    />
                  ))}
                </div>
              )}

              {message.role === "assistant" && message.toolCalls && message.toolCalls.length > 0 && (
                <div className={styles.toolCallList}>
                  {message.toolCalls.map((tc) => (
                    <ToolCallBlock key={tc.id} toolCall={tc} />
                  ))}
                </div>
              )}

              {message.content && (
                <div className={styles.messageText}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
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
