import { Settings, BotMessageSquare } from "lucide-react";
import type { Conversation } from "../../types/chat";
import { ConversationList } from "./ConversationList";
import styles from "./Sidebar.module.css";

export interface SidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNewConversation: () => void;
  onOpenSettings: () => void;
}

/**
 * Sidebar component - main sidebar container
 */
export const Sidebar = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
  onOpenSettings,
}: SidebarProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1><BotMessageSquare size={16} strokeWidth={2.5} />AI Chatroom</h1>
      </div>

      <ConversationList
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={onSelectConversation}
        onDeleteConversation={onDeleteConversation}
        onNewConversation={onNewConversation}
      />

      <button
        className={styles.settingsButton}
        onClick={onOpenSettings}
        title="Settings"
      >
        <Settings size={16} />
        Settings
      </button>
    </div>
  );
};
