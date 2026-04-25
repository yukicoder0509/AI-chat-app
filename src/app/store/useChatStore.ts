/**
 * Global chat state store
 * Manages conversations, messages, and streaming state
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Conversation, Message } from "../../types/chat";
import { ConversationStorage } from "../../services/storage";

/**
 * Chat state interface
 */
export interface ChatState {
  // Conversations
  conversations: Conversation[];
  currentConversationId: string | null;

  // Derived state
  currentConversation: Conversation | null;

  // Streaming state
  isStreamingResponse: boolean;
  currentStreamingChunk: string;

  // Conversation actions
  createConversation: (
    title: string,
    systemPrompt: string,
    model: string,
  ) => Conversation;
  loadConversations: () => void;
  getConversation: (id: string) => Conversation | null;
  updateConversation: (conversation: Conversation) => void;
  deleteConversation: (id: string) => void;
  setCurrentConversation: (id: string) => void;

  // Message actions
  addMessage: (conversationId: string, message: Message) => void;
  updateLastMessage: (
    conversationId: string,
    content: string,
    tokens?: number,
  ) => void;

  // Streaming actions
  startStreaming: () => void;
  appendStreamingChunk: (chunk: string) => void;
  finishStreaming: () => void;
  resetStreamingState: () => void;

  // Conversation metadata
  clear: () => void;
}

/**
 * Helper to generate unique IDs
 */
const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create chat state store
 */
export const useChatStore = create<ChatState>()(
  devtools((set, get) => {
    // Load conversations from storage on initialization
    const stored = ConversationStorage.getAllConversations();

    return {
      // Initial state
      conversations: stored,
      currentConversationId: stored.length > 0 ? stored[0].id : null,
      currentConversation: stored.length > 0 ? stored[0] : null,
      isStreamingResponse: false,
      currentStreamingChunk: "",

      // Conversation actions
      createConversation: (
        title: string,
        systemPrompt: string,
        model: string,
      ): Conversation => {
        const newConversation: Conversation = {
          id: generateId("conv"),
          title,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          totalTokens: 0,
          systemPrompt,
          model,
          temperature: 0.7,
          maxTokens: 2000,
        };

        ConversationStorage.saveConversation(newConversation);

        set((state) => ({
          conversations: [...state.conversations, newConversation],
          currentConversationId: newConversation.id,
          currentConversation: newConversation,
        }));

        return newConversation;
      },

      loadConversations: () => {
        const conversations = ConversationStorage.getAllConversations();
        const currentId = get().currentConversationId;
        const current =
          conversations.find((c) => c.id === currentId) ||
          (conversations.length > 0 ? conversations[0] : null);

        set({
          conversations,
          currentConversationId: current?.id || null,
          currentConversation: current,
        });
      },

      getConversation: (id: string): Conversation | null => {
        return get().conversations.find((c) => c.id === id) || null;
      },

      updateConversation: (conversation: Conversation) => {
        ConversationStorage.saveConversation(conversation);

        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversation.id ? conversation : c,
          ),
          currentConversation:
            state.currentConversationId === conversation.id
              ? conversation
              : state.currentConversation,
        }));
      },

      deleteConversation: (id: string) => {
        ConversationStorage.deleteConversation(id);

        set((state) => {
          const remaining = state.conversations.filter((c) => c.id !== id);
          const newCurrent =
            state.currentConversationId === id
              ? remaining.length > 0
                ? remaining[0]
                : null
              : state.currentConversation;

          return {
            conversations: remaining,
            currentConversationId: newCurrent?.id || null,
            currentConversation: newCurrent,
          };
        });
      },

      setCurrentConversation: (id: string) => {
        const conversation = get().conversations.find((c) => c.id === id);
        if (conversation) {
          set({
            currentConversationId: id,
            currentConversation: conversation,
            currentStreamingChunk: "",
            isStreamingResponse: false,
          });
        }
      },

      // Message actions
      addMessage: (conversationId: string, message: Message) => {
        set((state) => {
          const updated = state.conversations.map((c) => {
            if (c.id === conversationId) {
              const newConversation = {
                ...c,
                messages: [...c.messages, message],
                totalTokens: c.totalTokens + (message.tokens || 0),
                updatedAt: Date.now(),
              };
              ConversationStorage.saveConversation(newConversation);
              return newConversation;
            }
            return c;
          });

          return {
            conversations: updated,
            currentConversation:
              state.currentConversationId === conversationId
                ? updated.find((c) => c.id === conversationId) || null
                : state.currentConversation,
          };
        });
      },

      updateLastMessage: (
        conversationId: string,
        content: string,
        tokens?: number,
      ) => {
        set((state) => {
          const updated = state.conversations.map((c) => {
            if (c.id === conversationId && c.messages.length > 0) {
              const messages = [...c.messages];
              const lastMsg = messages[messages.length - 1];
              messages[messages.length - 1] = {
                ...lastMsg,
                content,
                tokens: tokens || lastMsg.tokens,
              };

              const newConversation = {
                ...c,
                messages,
                totalTokens:
                  c.totalTokens + (tokens || 0) - (lastMsg.tokens || 0),
                updatedAt: Date.now(),
              };
              ConversationStorage.saveConversation(newConversation);
              return newConversation;
            }
            return c;
          });

          return {
            conversations: updated,
            currentConversation:
              state.currentConversationId === conversationId
                ? updated.find((c) => c.id === conversationId) || null
                : state.currentConversation,
          };
        });
      },

      // Streaming actions
      startStreaming: () => {
        set({
          isStreamingResponse: true,
          currentStreamingChunk: "",
        });
      },

      appendStreamingChunk: (chunk: string) => {
        set((state) => ({
          currentStreamingChunk: state.currentStreamingChunk + chunk,
        }));
      },

      finishStreaming: () => {
        set({
          isStreamingResponse: false,
        });
      },

      resetStreamingState: () => {
        set({
          isStreamingResponse: false,
          currentStreamingChunk: "",
        });
      },

      // Clear all data
      clear: () => {
        ConversationStorage.clearAllConversations();
        set({
          conversations: [],
          currentConversationId: null,
          currentConversation: null,
          isStreamingResponse: false,
          currentStreamingChunk: "",
        });
      },
    };
  }),
);
