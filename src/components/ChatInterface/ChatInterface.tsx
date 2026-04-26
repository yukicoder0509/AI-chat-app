import { useCallback } from "react";
import type { Conversation } from "../../types/chat";
import type { Attachment } from "../../types/attachments";
import type { RoutingDecision } from "../../types/routing";
import { detectVisionCapability } from "../../services/vision/imageProcessor";
import { MessageList } from "./MessageList";
import { InputBox } from "./InputBox";
import styles from "./ChatInterface.module.css";

export interface ChatInterfaceProps {
  conversation: Conversation | null;
  onSendMessage: (message: string, attachments: Attachment[]) => void;
  streamingContent?: string;
  isStreaming?: boolean;
  isLoading?: boolean;
  models?: string[];
  isLoadingModels?: boolean;
  onModelChange?: (model: string) => void;
  attachments?: Attachment[];
  onAttachmentsChange?: (attachments: Attachment[]) => void;
  lastRoutingDecision?: RoutingDecision | null;
  connectedServersCount?: number;
  isExtractingMemory?: boolean;
}

export const ChatInterface = ({
  conversation,
  onSendMessage,
  streamingContent = "",
  isStreaming = false,
  isLoading = false,
  models,
  isLoadingModels,
  onModelChange,
  attachments = [],
  onAttachmentsChange,
  lastRoutingDecision,
  connectedServersCount = 0,
  isExtractingMemory = false,
}: ChatInterfaceProps) => {
  const handleSendMessage = useCallback(
    (message: string, atts: Attachment[]) => {
      onSendMessage(message, atts);
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

  const modelOptions = models && models.length > 0 ? models : [conversation.model];
  const isAutoRouting = conversation.model === "auto";
  const visionEnabled = conversation.model === "auto" || detectVisionCapability(conversation.model);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{conversation.title}</h2>

        <div className={styles.headerRight}>
          {isAutoRouting && lastRoutingDecision && (
            <span className={styles.routingBadge}>
              {lastRoutingDecision.taskType} → {lastRoutingDecision.selectedModel}
            </span>
          )}

          {connectedServersCount > 0 && (
            <span className={styles.toolsBadge}>{connectedServersCount} tools</span>
          )}

          {onModelChange ? (
            <select
              className={styles.modelSelect}
              value={conversation.model}
              onChange={(e) => onModelChange(e.target.value)}
              disabled={isStreaming || isLoading || isLoadingModels}
            >
              {modelOptions.map((m) => (
                <option key={m} value={m}>
                  {m === "auto" ? "⚡ Auto" : m}
                </option>
              ))}
            </select>
          ) : (
            <p className={styles.modelInfo}>{conversation.model}</p>
          )}
        </div>
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
        attachments={attachments}
        onAttachmentsChange={onAttachmentsChange}
        visionEnabled={visionEnabled}
        isExtractingMemory={isExtractingMemory}
      />
    </div>
  );
};
