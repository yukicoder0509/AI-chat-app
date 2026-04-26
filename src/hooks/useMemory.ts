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

const MAX_INJECT_MEMORIES = 10;

export interface UseMemoryReturn {
  memories: MemoryEntry[];
  isExtracting: boolean;
  injectMemories: (systemPrompt: string) => string;
  extractAndStore: (
    conversationId: string,
    lastExchange: Message[],
    credentials: { apiKey: string; apiUrl: string },
    model: string,
  ) => void;
  updateMemory: (id: string, fact: string) => void;
  deleteMemory: (id: string) => void;
  clearMemories: () => void;
}

export const useMemory = (): UseMemoryReturn => {
  const { settings } = useAppStore();
  const [memories, setMemories] = useState<MemoryEntry[]>(() => loadMemories());
  const [isExtracting, setIsExtracting] = useState(false);

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
      extractFacts(lastExchange, credentials, model)
        .then((newEntries) => {
          const withConvId = newEntries.map((e) => ({
            ...e,
            sourceConversationId: conversationId,
          }));
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

  return { memories, isExtracting, injectMemories, extractAndStore, updateMemory, deleteMemory, clearMemories };
};
