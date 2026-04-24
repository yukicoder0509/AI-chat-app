import { Plus, Trash2 } from "lucide-react";
import type { Conversation } from "../../types/chat";
import { formatTimestamp, createMessageSummary } from "../../utils";
import { Button } from "../Common";
import styles from "./ConversationList.module.css";

export interface ConversationListProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNewConversation: () => void;
}

/**
 * ConversationList component - displays list of conversations
 */
export const ConversationList = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
}: ConversationListProps) => {
  return (
    <div className={styles.container}>
      <Button
        variant="primary"
        size="large"
        onClick={onNewConversation}
        className={styles.newButton}
      >
        <Plus size={16} />
        New Chat
      </Button>

      <div className={styles.listContainer}>
        {conversations.length === 0 ? (
          <p className={styles.empty}>No conversations yet.</p>
        ) : null}

        {conversations.map((conv) => {
          const isActive = conv.id === currentConversationId;
          const preview = createMessageSummary(
            conv.messages.length > 0
              ? conv.messages[conv.messages.length - 1].content
              : "New conversation",
            60,
          );

          return (
            <div
              key={conv.id}
              className={`${styles.conversationItem} ${isActive ? styles.active : ""}`}
              onClick={() => onSelectConversation(conv.id)}
            >
              <div className={styles.conversationContent}>
                <h4 className={styles.title}>{conv.title}</h4>
                <p className={styles.preview}>{preview}</p>
                <span className={styles.date}>
                  {formatTimestamp(conv.updatedAt, "date")}
                </span>
              </div>

              <button
                className={styles.deleteButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(conv.id);
                }}
                title="Delete conversation"
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
