import { useState, useCallback } from "react";
import { useAppStore } from "../app/store";
import {
  loadMemories,
  saveMemory,
  updateMemory as storageUpdateMemory,
  deleteMemory as storageDeleteMemory,
  clearMemories as storageClearMemories,
} from "../services/memory/memoryStorage";
import { extractFacts } from "../services/memory/memoryExtractor";
import type { MemoryEntry } from "../types/memory";
import type { Message } from "../types/chat";
import type { OpenAITool } from "../types/openai";

const MAX_INJECT_MEMORIES = 10;
export const MEMORY_SERVER_ID = "__memory__";

function generateId(): string {
  return `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

type MemoryToolDef = OpenAITool & { serverId: string };

const MEMORY_TOOL_DEFS: MemoryToolDef[] = [
  {
    type: "function",
    function: {
      name: "store_memory",
      description:
        "Permanently store a new fact about the user so it is remembered in future conversations. Use this when the user explicitly asks you to remember something.",
      parameters: {
        type: "object",
        properties: {
          fact: {
            type: "string",
            description: "A concise, self-contained fact about the user.",
          },
        },
        required: ["fact"],
      },
    },
    serverId: MEMORY_SERVER_ID,
  },
  {
    type: "function",
    function: {
      name: "list_memories",
      description: "Return all facts currently stored about the user.",
      parameters: { type: "object", properties: {} },
    },
    serverId: MEMORY_SERVER_ID,
  },
  {
    type: "function",
    function: {
      name: "delete_memory",
      description: "Delete a stored fact by its ID. Use list_memories first to find the ID.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "The ID of the memory entry to delete." },
        },
        required: ["id"],
      },
    },
    serverId: MEMORY_SERVER_ID,
  },
];

export interface UseMemoryReturn {
  memories: MemoryEntry[];
  isExtracting: boolean;
  memoryTools: MemoryToolDef[];
  injectMemories: (systemPrompt: string) => string;
  extractAndStore: (
    conversationId: string,
    lastExchange: Message[],
    credentials: { apiKey: string; apiUrl: string },
    model: string,
  ) => void;
  executeMemoryTool: (name: string, args: Record<string, unknown>) => Promise<string>;
  updateMemory: (id: string, fact: string) => void;
  deleteMemory: (id: string) => void;
  clearMemories: () => void;
}

export const useMemory = (): UseMemoryReturn => {
  const { settings } = useAppStore();
  const [memories, setMemories] = useState<MemoryEntry[]>(() => loadMemories());
  const [isExtracting, setIsExtracting] = useState(false);

  const memoryTools = settings.memoryEnabled ? MEMORY_TOOL_DEFS : [];

  const injectMemories = useCallback(
    (systemPrompt: string): string => {
      if (!settings.memoryEnabled) return systemPrompt;

      const recent = [...memories]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, MAX_INJECT_MEMORIES);

      if (recent.length === 0) return systemPrompt;

      const block = [
        "What you know about me:",
        ...recent.map((m) => `- ${m.fact}`),
        "",
      ].join("\n");

      return block + systemPrompt;
    },
    [memories, settings.memoryEnabled],
  );

  const extractAndStore = useCallback(
    (
      conversationId: string,
      lastExchange: Message[],
      credentials: { apiKey: string; apiUrl: string },
      model: string,
    ): void => {
      if (!settings.memoryEnabled) return;

      // Fire and forget — never throws
      setIsExtracting(true);
      const existing = loadMemories();
      const existingFactStrings = existing.map((e) => e.fact);
      extractFacts(lastExchange, credentials, model, existingFactStrings)
        .then((newEntries) => {
          const existingFactsLower = new Set(
            existingFactStrings.map((f) => f.toLowerCase().trim()),
          );
          const withConvId = newEntries
            .map((e) => ({ ...e, sourceConversationId: conversationId }))
            .filter((e) => !existingFactsLower.has(e.fact.toLowerCase().trim()));
          withConvId.forEach((e) => saveMemory(e));
          setMemories(loadMemories());
        })
        .catch(() => {
          // intentionally swallowed
        })
        .finally(() => setIsExtracting(false));
    },
    [settings.memoryEnabled],
  );

  const executeMemoryTool = useCallback(
    (name: string, args: Record<string, unknown>): Promise<string> => {
      switch (name) {
        case "store_memory": {
          const fact = String(args.fact ?? "").trim();
          if (!fact) return Promise.resolve("Error: fact must be a non-empty string.");
          const existing = loadMemories();
          const isDuplicate = existing.some(
            (e) => e.fact.toLowerCase().trim() === fact.toLowerCase(),
          );
          if (isDuplicate) return Promise.resolve(`Already remembered: "${fact}"`);
          const entry: MemoryEntry = {
            id: generateId(),
            fact,
            sourceConversationId: "tool-call",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          saveMemory(entry);
          setMemories(loadMemories());
          return Promise.resolve(`Remembered: "${fact}"`);
        }
        case "list_memories": {
          const mems = loadMemories();
          if (mems.length === 0) return Promise.resolve("No memories stored yet.");
          return Promise.resolve(mems.map((m) => `[${m.id}] ${m.fact}`).join("\n"));
        }
        case "delete_memory": {
          const id = String(args.id ?? "").trim();
          if (!id) return Promise.resolve("Error: id must be a non-empty string.");
          storageDeleteMemory(id);
          setMemories(loadMemories());
          return Promise.resolve(`Deleted memory ${id}`);
        }
        default:
          return Promise.resolve(`Unknown memory tool: ${name}`);
      }
    },
    [],
  );

  const updateMemory = useCallback((id: string, fact: string) => {
    storageUpdateMemory(id, fact);
    setMemories(loadMemories());
  }, []);

  const deleteMemory = useCallback((id: string) => {
    storageDeleteMemory(id);
    setMemories(loadMemories());
  }, []);

  const clearMemories = useCallback(() => {
    storageClearMemories();
    setMemories([]);
  }, []);

  return {
    memories,
    isExtracting,
    memoryTools,
    injectMemories,
    extractAndStore,
    executeMemoryTool,
    updateMemory,
    deleteMemory,
    clearMemories,
  };
};
