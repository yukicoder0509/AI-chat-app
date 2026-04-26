import { useCallback } from "react";
import { useChatStore } from "../app/store";
import { useAppStore } from "../app/store";
import { streamChat } from "../services/openai/streamChat";
import { resizeAndCompressFromUrl, encodeToBase64DataUrl } from "../services/vision/imageProcessor";
import type { Message, Conversation } from "../types/chat";
import type { Attachment } from "../types/attachments";
import type { TextContent, ImageContent, OpenAITool, OpenAIToolCall } from "../types/openai";
import type { ToolCall } from "../types/mcp";

async function buildBase64Attachment(att: Attachment): Promise<Attachment> {
  const blob = await resizeAndCompressFromUrl(att.previewObjectUrl!);
  const base64DataUrl = await encodeToBase64DataUrl(blob);
  return { ...att, base64DataUrl };
}

export interface UseChatOptions {
  injectMemories?: (systemPrompt: string) => string;
  extractAndStore?: (
    conversationId: string,
    lastExchange: Message[],
    credentials: { apiKey: string; apiUrl: string },
    model: string,
  ) => void;
  availableTools?: OpenAITool[];
  executeTool?: (serverId: string, name: string, args: Record<string, unknown>) => Promise<string>;
}

export const useChat = (options: UseChatOptions = {}) => {
  const {
    conversations,
    currentConversation,
    isStreamingResponse: isStreaming,
    currentStreamingChunk: streamingContent,
    addMessage,
    updateLastMessage,
    updateMessage,
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

  const sendMessage = useCallback(
    async (content: string, attachments: Attachment[] = []) => {
      try {
        const conv = currentConversation;
        if (!conv) { appState.setError("No conversation selected"); return; }

        const settings = appState.settings;
        if (!settings) { appState.setError("Settings not initialized"); return; }

        const { apiKey, apiUrl } = settings;
        if (!apiKey) { appState.setError("API key not configured"); return; }
        if (!apiUrl) { appState.setError("API URL not configured"); return; }

        // Encode attachments to base64
        let processedAttachments: Attachment[] = [];
        if (attachments.length > 0) {
          processedAttachments = await Promise.all(
            attachments.map(buildBase64Attachment),
          );
        }

        const userMessage: Message = {
          id: `msg-${Date.now()}`,
          role: "user",
          content,
          timestamp: Date.now(),
          attachments: processedAttachments.length > 0 ? processedAttachments : undefined,
        };

        addMessage(conv.id, userMessage);

        const assistantMessageId = `msg-${Date.now()}-assistant`;
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          timestamp: Date.now(),
        };

        addMessage(conv.id, assistantMessage);

        const buildApiMessages = () => {
          const updatedConv = getConversation(conv.id);
          if (!updatedConv) return [];
          return [
            ...(updatedConv.systemPrompt
              ? [{ role: "system" as const, content: updatedConv.systemPrompt }]
              : []),
            ...updatedConv.messages
              .filter((m) => m.role !== "assistant" || m.content !== "" || (m.toolCalls && m.toolCalls.length > 0))
              .map((msg) => {
                if (msg.role === "tool") {
                  return {
                    role: "tool" as const,
                    content: msg.content,
                    tool_call_id: msg.toolCallId,
                  };
                }
                if (msg.role === "user" && msg.attachments && msg.attachments.length > 0) {
                  const blocks: Array<TextContent | ImageContent> = [
                    { type: "text" as const, text: msg.content },
                    ...msg.attachments.map(
                      (att): ImageContent => ({
                        type: "image_url",
                        image_url: { url: att.base64DataUrl, detail: "auto" },
                      }),
                    ),
                  ];
                  return { role: "user" as const, content: blocks };
                }
                if (msg.role === "assistant" && msg.toolCalls && msg.toolCalls.length > 0) {
                  const openAiToolCalls: OpenAIToolCall[] = msg.toolCalls.map((tc) => ({
                    id: tc.id,
                    type: "function" as const,
                    function: {
                      name: tc.toolName,
                      arguments: JSON.stringify(tc.arguments),
                    },
                  }));
                  return {
                    role: "assistant" as const,
                    content: msg.content || "",
                    tool_calls: openAiToolCalls,
                  };
                }
                return {
                  role: msg.role as "user" | "assistant" | "system",
                  content: msg.content,
                };
              }),
          ];
        };

        try {
          startStreaming();
          appState.setError(null);

          const runStream = async (): Promise<void> => {
            const apiMessages = buildApiMessages();
            // Read the model fresh from the store — App.tsx may have resolved "auto"
            // to a real model ID via updateConversationSettings before calling sendMessage.
            const currentModel = getConversation(conv.id)?.model ?? conv.model;

            await streamChat(
              apiMessages,
              {
                model: currentModel,
                temperature: appState.apiConfig.temperature,
                maxTokens: appState.apiConfig.maxTokens,
                topP: appState.apiConfig.topP,
                frequencyPenalty: appState.apiConfig.frequencyPenalty,
                presencePenalty: appState.apiConfig.presencePenalty,
              },
              {
                tools: options.availableTools,
                onChunk: (chunk: string) => appendStreamingChunk(chunk),
                onComplete: (fullContent: string) => {
                  updateLastMessage(conv.id, fullContent);
                  updateMessage(conv.id, assistantMessageId, { model: currentModel });
                  finishStreaming();

                  if (options.extractAndStore) {
                    const assistantMsg: Message = {
                      id: assistantMessageId,
                      role: "assistant",
                      content: fullContent,
                      timestamp: Date.now(),
                    };
                    options.extractAndStore(
                      conv.id,
                      [userMessage, assistantMsg],
                      { apiKey, apiUrl },
                      currentModel,
                    );
                  }
                },
                onError: (error: Error) => {
                  appState.setError(error.message);
                  finishStreaming();
                },
                onToolCalls: async (calls: OpenAIToolCall[]) => {
                  if (!options.executeTool) {
                    finishStreaming();
                    return;
                  }

                  // Record pending tool calls on the assistant message
                  const pendingToolCalls: ToolCall[] = calls.map((c) => ({
                    id: c.id,
                    toolName: c.function.name,
                    serverId: "",
                    arguments: (() => {
                      try { return JSON.parse(c.function.arguments) as Record<string, unknown>; }
                      catch { return {}; }
                    })(),
                    status: "pending" as const,
                  }));

                  const updatedConv = getConversation(conv.id);
                  if (updatedConv) {
                    const lastMsg = updatedConv.messages[updatedConv.messages.length - 1];
                    if (lastMsg?.id === assistantMessageId) {
                      updateMessage(conv.id, assistantMessageId, {
                        toolCalls: pendingToolCalls,
                      });
                    }
                  }

                  // Execute each tool call sequentially
                  for (const tc of pendingToolCalls) {
                    // Find which server has this tool
                    const serverEntry = options.availableTools?.find(
                      (t) => t.function.name === tc.toolName,
                    );
                    const serverId = (serverEntry as { serverId?: string } | undefined)?.serverId ?? "";

                    // Mark running
                    updateMessage(conv.id, assistantMessageId, {
                      toolCalls: pendingToolCalls.map((t) =>
                        t.id === tc.id ? { ...t, status: "running" as const, serverId, startedAt: Date.now() } : t,
                      ),
                    });

                    try {
                      const result = await options.executeTool(serverId, tc.toolName, tc.arguments);

                      // Mark complete and inject tool result message
                      pendingToolCalls.forEach((t) => {
                        if (t.id === tc.id) {
                          t.status = "complete";
                          t.serverId = serverId;
                          t.result = result;
                          t.completedAt = Date.now();
                        }
                      });

                      updateMessage(conv.id, assistantMessageId, { toolCalls: [...pendingToolCalls] });

                      const toolResultMsg: Message = {
                        id: `msg-${Date.now()}-tool`,
                        role: "tool",
                        content: result,
                        timestamp: Date.now(),
                        toolCallId: tc.id,
                      };
                      addMessage(conv.id, toolResultMsg);
                    } catch (err) {
                      pendingToolCalls.forEach((t) => {
                        if (t.id === tc.id) {
                          t.status = "error";
                          t.error = err instanceof Error ? err.message : "Tool error";
                          t.completedAt = Date.now();
                        }
                      });
                      updateMessage(conv.id, assistantMessageId, { toolCalls: [...pendingToolCalls] });
                    }
                  }

                  // Add a new empty assistant message and resume streaming
                  const resumeAssistantMsg: Message = {
                    id: `msg-${Date.now()}-resume`,
                    role: "assistant",
                    content: "",
                    timestamp: Date.now(),
                  };
                  addMessage(conv.id, resumeAssistantMsg);

                  // Resume stream with the full updated conversation
                  await runStream();
                },
              },
              { apiKey, apiUrl },
            );
          };

          await runStream();
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Failed to send message";
          appState.setError(msg);
          finishStreaming();

          const errorConv = getConversation(conv.id);
          if (errorConv && errorConv.messages.length > 0) {
            const last = errorConv.messages[errorConv.messages.length - 1];
            if (last.role === "assistant" && last.content === "") {
              errorConv.messages = errorConv.messages.slice(0, -1);
              updateConversation(errorConv);
            }
          }
        }
      } catch (error) {
        console.error("Unexpected error in sendMessage:", error);
        appState.setError(error instanceof Error ? error.message : "An unexpected error occurred");
      }
    },
    [
      options,
      appState,
      currentConversation,
      addMessage,
      startStreaming,
      appendStreamingChunk,
      finishStreaming,
      updateLastMessage,
      updateMessage,
      updateConversation,
      getConversation,
    ],
  );

  const startNewConversation = useCallback(
    (title?: string, systemPrompt?: string) => {
      const defaultTitle =
        title ||
        `Chat ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      const rawPrompt = systemPrompt || appState.settings.systemPrompt;
      const enrichedPrompt = options.injectMemories
        ? options.injectMemories(rawPrompt)
        : rawPrompt;
      const model = appState.settings.selectedModel;
      return createConversation(defaultTitle, enrichedPrompt, model);
    },
    [createConversation, appState, options],
  );

  const switchConversation = useCallback(
    (id: string) => setCurrentConversation(id),
    [setCurrentConversation],
  );

  const deleteConversation_ = useCallback(
    (id: string) => deleteConversation(id),
    [deleteConversation],
  );

  const clearAllConversations = useCallback(() => clear(), [clear]);

  const updateConversationSettings = useCallback(
    (id: string, settings: Partial<Conversation>) => {
      const conv = getConversation(id);
      if (conv) updateConversation({ ...conv, ...settings, id: conv.id });
    },
    [getConversation, updateConversation],
  );

  return {
    currentConversation,
    conversations,
    isStreaming,
    streamingContent,
    sendMessage,
    startNewConversation,
    switchConversation,
    deleteConversation: deleteConversation_,
    clearAllConversations,
    updateConversationSettings,
  };
};
