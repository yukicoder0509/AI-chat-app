import type { MemoryEntry } from "../../types/memory";

const STORAGE_KEY = "ai-chatroom-memories";

export function loadMemories(): MemoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MemoryEntry[];
  } catch {
    return [];
  }
}

export function saveMemory(entry: MemoryEntry): void {
  const entries = loadMemories();
  entries.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function updateMemory(id: string, fact: string): void {
  const entries = loadMemories().map((e) =>
    e.id === id ? { ...e, fact, updatedAt: Date.now() } : e,
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function deleteMemory(id: string): void {
  const entries = loadMemories().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function clearMemories(): void {
  localStorage.removeItem(STORAGE_KEY);
}
