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
  const chatState = useChatStore();
  const appState = useAppStore();

  /**
   * Send a message and get a streaming response
   */
  const sendMessage = useCallback(
    async (content: string) => {
      const conv = chatState.currentConversation;
      if (!conv) {
        appState.setError("No conversation selected");
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
      chatState.addMessage(conv.id, userMessage);

      // Create assistant message placeholder
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      };

      chatState.addMessage(conv.id, assistantMessage);

      // Prepare messages for API
      const messages = [
        ...(conv.systemPrompt
          ? [{ role: "system" as const, content: conv.systemPrompt }]
          : []),
        ...conv.messages.map((msg) => ({
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
        })),
      ];

      try {
        // Initialize streaming
        chatState.startStreaming();
        appState.setError(null);

        // Get OpenAI API key and validate
        const apiKey = appState.settings.apiKey;

        if (!apiKey) {
          throw new Error("API key not configured");
        }

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
              chatState.appendStreamingChunk(chunk);
            },
            onComplete: (fullContent: string) => {
              chatState.updateLastMessage(conv.id, fullContent);
              chatState.finishStreaming();
            },
            onError: (error: Error) => {
              appState.setError(error.message);
              chatState.finishStreaming();
            },
          },
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to send message";
        appState.setError(message);
        chatState.finishStreaming();

        // Remove the assistant message if there was an error
        const updated = chatState.currentConversation;
        if (updated && updated.messages.length > 0) {
          const lastMsg = updated.messages[updated.messages.length - 1];
          if (lastMsg.role === "assistant" && lastMsg.content === "") {
            updated.messages = updated.messages.slice(0, -1);
            chatState.updateConversation(updated);
          }
        }
      }
    },
    [chatState, appState],
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

      return chatState.createConversation(defaultTitle, defaultPrompt, model);
    },
    [chatState, appState],
  );

  /**
   * Get current conversation
   */
  const getCurrentConversation = useCallback(() => {
    return chatState.currentConversation;
  }, [chatState]);

  /**
   * Switch to a different conversation
   */
  const switchConversation = useCallback(
    (id: string) => {
      chatState.setCurrentConversation(id);
    },
    [chatState],
  );

  /**
   * Delete a conversation
   */
  const deleteConversation = useCallback(
    (id: string) => {
      chatState.deleteConversation(id);
    },
    [chatState],
  );

  /**
   * Clear all conversations
   */
  const clearAllConversations = useCallback(() => {
    chatState.clear();
  }, [chatState]);

  /**
   * Update conversation settings
   */
  const updateConversationSettings = useCallback(
    (id: string, settings: Partial<Conversation>) => {
      const conv = chatState.getConversation(id);
      if (conv) {
        const updated = { ...conv, ...settings, id: conv.id };
        chatState.updateConversation(updated);
      }
    },
    [chatState],
  );

  return {
    // State
    currentConversation: chatState.currentConversation,
    conversations: chatState.conversations,
    isStreaming: chatState.isStreamingResponse,
    streamingContent: chatState.currentStreamingChunk,

    // Actions
    sendMessage,
    startNewConversation,
    getCurrentConversation,
    switchConversation,
    deleteConversation,
    clearAllConversations,
    updateConversationSettings,
  };
};
