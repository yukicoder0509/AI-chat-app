/**
 * useChat hook
 * Provides chat functionality and operations
 */

import { useCallback } from "react";
import { useChatStore } from "../app/store";
import { useAppStore } from "../app/store";
import { streamChat } from "../services/openai/streamChat";
import type { Message, Conversation } from "../types/chat";

/**
 * Hook for chat operations
 */
export const useChat = () => {
  const {
    conversations,
    currentConversation,
    isStreamingResponse: isStreaming,
    currentStreamingChunk: streamingContent,
    addMessage,
    updateLastMessage,
    startStreaming,
    appendStreamingChunk,
    finishStreaming,
    createConversation,
    getConversation,
    updateConversation,
    deleteConversation,
    setCurrentConversation,
    clear,
  } = useChatStore();

  const appState = useAppStore();

  /**
   * Send a message and get a streaming response
   */
  const sendMessage = useCallback(
    async (content: string) => {
      try {
        const conv = currentConversation;
        if (!conv) {
          appState.setError("No conversation selected");
          return;
        }

        // Safely get settings
        const settings = appState.settings;
        if (!settings) {
          appState.setError("Settings not initialized");
          return;
        }

        const apiKey = settings.apiKey;
        const apiUrl = settings.apiUrl;

        if (!apiKey) {
          appState.setError("API key not configured");
          return;
        }

        if (!apiUrl) {
          appState.setError("API URL not configured");
          return;
        }

        // Create user message
        const userMessage: Message = {
          id: `msg-${Date.now()}`,
          role: "user",
          content,
          timestamp: Date.now(),
        };

        // Add user message to conversation
        addMessage(conv.id, userMessage);

        // Create assistant message placeholder
        const assistantMessage: Message = {
          id: `msg-${Date.now()}-assistant`,
          role: "assistant",
          content: "",
          timestamp: Date.now(),
        };

        addMessage(conv.id, assistantMessage);

        // Get updated conversation with the new messages
        const updatedConv = getConversation(conv.id);
        if (!updatedConv) {
          appState.setError("Failed to retrieve conversation");
          finishStreaming();
          return;
        }

        // Prepare messages for API (excluding the last assistant placeholder)
        const messages = [
          ...(updatedConv.systemPrompt
            ? [{ role: "system" as const, content: updatedConv.systemPrompt }]
            : []),
          ...updatedConv.messages
            .slice(0, -1) // Exclude the empty assistant message
            .map((msg) => ({
              role: msg.role as "user" | "assistant" | "system",
              content: msg.content,
            })),
        ];

        try {
          // Initialize streaming
          startStreaming();
          appState.setError(null);

          // Stream the response
          await streamChat(
            messages,
            {
              model: conv.model,
              temperature: appState.apiConfig.temperature,
              maxTokens: appState.apiConfig.maxTokens,
              topP: appState.apiConfig.topP,
              frequencyPenalty: appState.apiConfig.frequencyPenalty,
              presencePenalty: appState.apiConfig.presencePenalty,
            },
            {
              onChunk: (chunk: string) => {
                appendStreamingChunk(chunk);
              },
              onComplete: (fullContent: string) => {
                updateLastMessage(conv.id, fullContent);
                finishStreaming();
              },
              onError: (error: Error) => {
                appState.setError(error.message);
                finishStreaming();
              },
            },
            {
              apiKey: apiKey,
              apiUrl: apiUrl,
            },
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to send message";
          appState.setError(message);
          finishStreaming();

          // Remove the assistant message if there was an error
          const errorConv = getConversation(conv.id);
          if (errorConv && errorConv.messages.length > 0) {
            const lastMsg = errorConv.messages[errorConv.messages.length - 1];
            if (lastMsg.role === "assistant" && lastMsg.content === "") {
              errorConv.messages = errorConv.messages.slice(0, -1);
              updateConversation(errorConv);
            }
          }
        }
      } catch (error) {
        console.error("Unexpected error in sendMessage:", error);
        appState.setError("An unexpected error occurred");
      }
    },
    [
      appState,
      currentConversation,
      addMessage,
      startStreaming,
      appendStreamingChunk,
      finishStreaming,
      updateLastMessage,
      updateConversation,
      getConversation,
    ],
  );

  /**
   * Create a new conversation
   */
  const startNewConversation = useCallback(
    (title?: string, systemPrompt?: string) => {
      const defaultTitle =
        title ||
        `Chat ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      const defaultPrompt = systemPrompt || appState.settings.systemPrompt;
      const model = appState.settings.selectedModel;

      return createConversation(defaultTitle, defaultPrompt, model);
    },
    [createConversation, appState],
  );

  /**
   * Switch to a different conversation
   */
  const switchConversation = useCallback(
    (id: string) => {
      setCurrentConversation(id);
    },
    [setCurrentConversation],
  );

  /**
   * Delete a conversation
   */
  const deleteConversation_ = useCallback(
    (id: string) => {
      deleteConversation(id);
    },
    [deleteConversation],
  );

  /**
   * Clear all conversations
   */
  const clearAllConversations = useCallback(() => {
    clear();
  }, [clear]);

  /**
   * Update conversation settings
   */
  const updateConversationSettings = useCallback(
    (id: string, settings: Partial<Conversation>) => {
      const conv = getConversation(id);
      if (conv) {
        const updated = { ...conv, ...settings, id: conv.id };
        updateConversation(updated);
      }
    },
    [getConversation, updateConversation],
  );

  return {
    // State
    currentConversation: currentConversation,
    conversations: conversations,
    isStreaming: isStreaming,
    streamingContent: streamingContent,

    // Actions
    sendMessage,
    startNewConversation,
    switchConversation,
    deleteConversation: deleteConversation_,
    clearAllConversations,
    updateConversationSettings,
  };
};
