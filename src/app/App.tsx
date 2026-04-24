import { useState, useEffect, useCallback } from "react";
import { useChat, useSettings } from "../hooks";
import { ChatInterface, Sidebar, SettingsPanel, Toast } from "../components";
import { MainLayout } from "./layout/MainLayout";
import { useAppStore } from "./store";
import styles from "./App.module.css";

/**
 * Main App component - root component of the application
 */
export const App = () => {
  const [showSettings, setShowSettings] = useState(false);
  const chat = useChat();
  const settings = useSettings();
  const { error, setError } = useAppStore();

  // Initialize first conversation if none exists
  useEffect(() => {
    if (chat.conversations.length === 0) {
      chat.startNewConversation("Welcome", settings.systemPrompt);
    }
  }, []);

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!chat.currentConversation || !settings.apiKey) {
        alert("Please configure your API key in settings first.");
        setShowSettings(true);
        return;
      }

      try {
        await chat.sendMessage(message);
      } catch (error) {
        console.error("Error sending message:", error);
      }
    },
    [chat, settings.apiKey],
  );

  const handleNewConversation = useCallback(() => {
    const title = `Chat ${new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}`;
    chat.startNewConversation(title, settings.systemPrompt);
  }, [chat, settings.systemPrompt]);

  const handleDeleteConversation = useCallback(
    (id: string) => {
      if (confirm("Are you sure you want to delete this conversation?")) {
        chat.deleteConversation(id);
      }
    },
    [chat],
  );

  const handleSelectConversation = useCallback(
    (id: string) => {
      chat.switchConversation(id);
    },
    [chat],
  );

  return (
    <div className={styles.app}>
      <MainLayout
        sidebar={
          <Sidebar
            conversations={chat.conversations}
            currentConversationId={chat.currentConversation?.id || null}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteConversation}
            onNewConversation={handleNewConversation}
            onOpenSettings={() => setShowSettings(true)}
          />
        }
        mainContent={
          <ChatInterface
            conversation={chat.currentConversation}
            onSendMessage={handleSendMessage}
            streamingContent={chat.streamingContent}
            isStreaming={chat.isStreaming}
          />
        }
      />

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}

      {error && (
        <Toast
          message={error}
          host={(() => {
            try { return new URL(settings.apiUrl).host; } catch { return settings.apiUrl; }
          })()}
          onClose={() => setError(null)}
        />
      )}
    </div>
  );
};
