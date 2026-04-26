import { useState, useEffect, useCallback } from "react";
import { useChat, useSettings, useModels, useRouting, useMemory, useTools } from "../hooks";
import { MEMORY_SERVER_ID } from "../hooks/useMemory";
import { ChatInterface, Sidebar, SettingsPanel, Toast, MemoryPanel } from "../components";
import { MainLayout } from "./layout/MainLayout";
import { useAppStore, useChatStore } from "./store";
import type { Attachment } from "../types/attachments";
import type { RoutingDecision } from "../types/routing";
import styles from "./App.module.css";

export const App = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [lastRoutingDecision, setLastRoutingDecision] = useState<RoutingDecision | null>(null);

  const settings = useSettings();
  const { models, isLoadingModels } = useModels();
  const routing = useRouting();
  const memory = useMemory();
  const tools = useTools();
  const { error, setError } = useAppStore();

  // Convert McpTool[] → OpenAITool[] for the API, keeping serverId so useChat can route tool calls.
  const openAiTools = tools.availableTools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.inputSchema,
    },
    serverId: t.serverId,
  }));

  // Merge MCP tools with local memory tools.
  const allTools = [...openAiTools, ...memory.memoryTools];

  // Route tool calls: memory tools are handled locally, MCP tools go to the client.
  const executeTool = useCallback(
    (serverId: string, name: string, args: Record<string, unknown>) => {
      if (serverId === MEMORY_SERVER_ID) return memory.executeMemoryTool(name, args);
      return tools.executeTool(serverId, name, args);
    },
    [memory, tools],
  );

  const chat = useChat({
    injectMemories: memory.injectMemories,
    extractAndStore: memory.extractAndStore,
    availableTools: allTools.length > 0 ? allTools : undefined,
    executeTool: allTools.length > 0 ? executeTool : undefined,
  });

  useEffect(() => {
    if (useChatStore.getState().conversations.length === 0) {
      chat.startNewConversation("Welcome", settings.systemPrompt);
    }
  }, []);

  useEffect(() => {
    if (models.length === 0) return;
    const realModels = models.filter((m) => m !== "auto");
    if (!settings.selectedModel && realModels.length > 0) {
      settings.setSelectedModel(realModels[0]);
    }
    if (chat.currentConversation && !chat.currentConversation.model && realModels.length > 0) {
      chat.updateConversationSettings(chat.currentConversation.id, {
        model: realModels[0],
      });
    }
  }, [models]);

  const handleSendMessage = useCallback(
    async (message: string, atts: Attachment[] = []) => {
      if (!chat.currentConversation || !settings.apiKey) {
        alert("Please configure your API key in settings first.");
        setShowSettings(true);
        return;
      }

      const conv = chat.currentConversation;

      if (conv.model === "auto") {
        const { modelId, decision } = routing.resolveModel(
          message,
          atts.length > 0,
          models,
        );
        setLastRoutingDecision(decision);
        chat.updateConversationSettings(conv.id, { model: modelId });
      }

      try {
        await chat.sendMessage(message, atts);
        setAttachments([]);
      } catch (err) {
        console.error("Error sending message:", err);
      } finally {
        if (conv.model === "auto") {
          chat.updateConversationSettings(conv.id, { model: "auto" });
        }
      }
    },
    [chat, settings.apiKey, models, routing],
  );

  const handleNewConversation = useCallback(() => {
    const title = `Chat ${new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}`;
    chat.startNewConversation(title, settings.systemPrompt);
    setLastRoutingDecision(null);
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
      setLastRoutingDecision(null);
    },
    [chat],
  );

  const handleModelChange = useCallback(
    (model: string) => {
      if (chat.currentConversation) {
        chat.updateConversationSettings(chat.currentConversation.id, { model });
        if (model !== "auto") setLastRoutingDecision(null);
      }
    },
    [chat],
  );

  const connectedServersCount = tools.servers.filter(
    (s) => s.enabled && s.status === "connected",
  ).length;

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
            models={models}
            isLoadingModels={isLoadingModels}
            onModelChange={handleModelChange}
            attachments={attachments}
            onAttachmentsChange={setAttachments}
            lastRoutingDecision={lastRoutingDecision}
            connectedServersCount={connectedServersCount}
            isExtractingMemory={memory.isExtracting}
          />
        }
      />

      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          onOpenMemoryPanel={() => {
            setShowSettings(false);
            setShowMemoryPanel(true);
          }}
          mcpServers={tools.servers}
          mcpActions={{
            addServer: tools.addServer,
            updateServer: tools.updateServer,
            removeServer: tools.removeServer,
            reconnect: tools.reconnect,
          }}
        />
      )}

      {showMemoryPanel && (
        <MemoryPanel
          memories={memory.memories}
          onClose={() => setShowMemoryPanel(false)}
          onUpdate={memory.updateMemory}
          onDelete={memory.deleteMemory}
          onClearAll={memory.clearMemories}
        />
      )}

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
