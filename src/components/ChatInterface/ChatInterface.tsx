import { useCallback } from "react";
import type { Conversation } from "../../types/chat";
import { MessageList } from "./MessageList";
import { InputBox } from "./InputBox";
import styles from "./ChatInterface.module.css";

export interface ChatInterfaceProps {
  conversation: Conversation | null;
  onSendMessage: (message: string) => void;
  streamingContent?: string;
  isStreaming?: boolean;
  isLoading?: boolean;
}

/**
 * ChatInterface component - main chat interface container
 */
export const ChatInterface = ({
  conversation,
  onSendMessage,
  streamingContent = "",
  isStreaming = false,
  isLoading = false,
}: ChatInterfaceProps) => {
  const handleSendMessage = useCallback(
    (message: string) => {
      onSendMessage(message);
    },
    [onSendMessage],
  );

  if (!conversation) {
    return (
      <div className={styles.container}>
        <div className={styles.noConversation}>
          <h2>No Conversation Selected</h2>
          <p>Start a new conversation to begin chatting.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{conversation.title}</h2>
        <p className={styles.modelInfo}>{conversation.model}</p>
      </div>

      <MessageList
        messages={conversation.messages}
        streamingContent={streamingContent}
        isStreaming={isStreaming}
        isLoading={isLoading}
      />

      <InputBox
        onSendMessage={handleSendMessage}
        isLoading={isStreaming || isLoading}
        disabled={isStreaming || isLoading}
      />
    </div>
  );
};
