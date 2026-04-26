import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  loadMemories,
  saveMemory,
  updateMemory,
  deleteMemory,
  clearMemories,
} from "../src/services/memory/memoryStorage";
import { extractFacts } from "../src/services/memory/memoryExtractor";
import { useMemory } from "../src/hooks/useMemory";
import { useAppStore } from "../src/app/store/useAppStore";
import type { MemoryEntry } from "../src/types/memory";
import type { Message } from "../src/types/chat";

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<MemoryEntry> = {}): MemoryEntry {
  return {
    id: "mem-test-1",
    fact: "User prefers dark mode",
    sourceConversationId: "conv-1",
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

// ─── memoryStorage ────────────────────────────────────────────────────────────

describe("memoryStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loadMemories returns empty array when nothing stored", () => {
    expect(loadMemories()).toEqual([]);
  });

  it("saveMemory persists an entry", () => {
    const entry = makeEntry();
    saveMemory(entry);
    const loaded = loadMemories();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toEqual(entry);
  });

  it("saveMemory appends without overwriting existing entries", () => {
    saveMemory(makeEntry({ id: "mem-1", fact: "fact one" }));
    saveMemory(makeEntry({ id: "mem-2", fact: "fact two" }));
    const loaded = loadMemories();
    expect(loaded).toHaveLength(2);
    expect(loaded.map((e) => e.id)).toEqual(["mem-1", "mem-2"]);
  });

  it("updateMemory changes fact and updatedAt for matching id", () => {
    const entry = makeEntry({ id: "mem-1", fact: "old fact", updatedAt: 100 });
    saveMemory(entry);

    const before = Date.now();
    updateMemory("mem-1", "new fact");
    const after = Date.now();

    const loaded = loadMemories();
    expect(loaded[0].fact).toBe("new fact");
    expect(loaded[0].updatedAt).toBeGreaterThanOrEqual(before);
    expect(loaded[0].updatedAt).toBeLessThanOrEqual(after);
  });

  it("updateMemory does not affect other entries", () => {
    saveMemory(makeEntry({ id: "mem-1", fact: "fact one" }));
    saveMemory(makeEntry({ id: "mem-2", fact: "fact two" }));
    updateMemory("mem-1", "updated");
    const loaded = loadMemories();
    expect(loaded.find((e) => e.id === "mem-2")?.fact).toBe("fact two");
  });

  it("deleteMemory removes the matching entry", () => {
    saveMemory(makeEntry({ id: "mem-1" }));
    saveMemory(makeEntry({ id: "mem-2", fact: "keep me" }));
    deleteMemory("mem-1");
    const loaded = loadMemories();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe("mem-2");
  });

  it("deleteMemory is a no-op for unknown id", () => {
    saveMemory(makeEntry({ id: "mem-1" }));
    deleteMemory("nonexistent");
    expect(loadMemories()).toHaveLength(1);
  });

  it("clearMemories removes all entries", () => {
    saveMemory(makeEntry({ id: "mem-1" }));
    saveMemory(makeEntry({ id: "mem-2" }));
    clearMemories();
    expect(loadMemories()).toEqual([]);
  });

  it("loadMemories returns empty array on corrupt localStorage data", () => {
    localStorage.setItem("ai-chatroom-memories", "not-valid-json{{{");
    expect(loadMemories()).toEqual([]);
  });
});

// ─── memoryExtractor ──────────────────────────────────────────────────────────

describe("extractFacts", () => {
  const credentials = { apiKey: "test-key", apiUrl: "https://api.example.com" };
  const model = "gpt-4";

  const exchange: Message[] = [
    { id: "1", role: "user", content: "My name is Alice and I love Rust.", timestamp: 1000 },
    { id: "2", role: "assistant", content: "Nice to meet you, Alice!", timestamp: 1001 },
  ];

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockFetchWithFacts(facts: unknown) {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(facts) } }],
      }),
    });
  }

  it("returns extracted facts as MemoryEntry objects", async () => {
    mockFetchWithFacts(["User's name is Alice", "User loves Rust"]);
    const entries = await extractFacts(exchange, credentials, model);
    expect(entries).toHaveLength(2);
    expect(entries[0].fact).toBe("User's name is Alice");
    expect(entries[1].fact).toBe("User loves Rust");
    entries.forEach((e) => {
      expect(e.id).toMatch(/^mem-/);
      expect(typeof e.createdAt).toBe("number");
      expect(e.sourceConversationId).toBe("");
    });
  });

  it("caps extracted facts at 5", async () => {
    const sixFacts = ["f1", "f2", "f3", "f4", "f5", "f6"];
    mockFetchWithFacts(sixFacts);
    const entries = await extractFacts(exchange, credentials, model);
    expect(entries).toHaveLength(5);
  });

  it("returns empty array when API responds with empty JSON array", async () => {
    mockFetchWithFacts([]);
    const entries = await extractFacts(exchange, credentials, model);
    expect(entries).toEqual([]);
  });

  it("returns empty array on non-ok API response", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: false });
    const entries = await extractFacts(exchange, credentials, model);
    expect(entries).toEqual([]);
  });

  it("returns empty array when response content has no JSON array", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Sorry, I cannot extract facts." } }],
      }),
    });
    const entries = await extractFacts(exchange, credentials, model);
    expect(entries).toEqual([]);
  });

  it("returns empty array and does not throw on fetch failure", async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network error"));
    await expect(extractFacts(exchange, credentials, model)).resolves.toEqual([]);
  });

  it("filters out non-string items in the facts array", async () => {
    mockFetchWithFacts(["valid fact", 42, null, "another fact"]);
    const entries = await extractFacts(exchange, credentials, model);
    expect(entries).toHaveLength(2);
    expect(entries[0].fact).toBe("valid fact");
    expect(entries[1].fact).toBe("another fact");
  });

  it("sends correct request body to the API", async () => {
    mockFetchWithFacts(["some fact"]);
    await extractFacts(exchange, credentials, model);

    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("https://api.example.com/v1/chat/completions");

    const body = JSON.parse(init.body as string);
    expect(body.model).toBe(model);
    expect(body.stream).toBe(false);
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[1].role).toBe("user");
    expect(body.messages[1].content).toContain("Alice");
  });

  it("includes existing facts in the user message when provided", async () => {
    mockFetchWithFacts(["User also likes Go"]);
    const existing = ["User's name is Alice", "User loves Rust"];
    await extractFacts(exchange, credentials, model, existing);

    const body = JSON.parse(
      ((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit).body as string,
    );
    const userContent: string = body.messages[1].content;
    expect(userContent).toContain("User's name is Alice");
    expect(userContent).toContain("User loves Rust");
    expect(userContent).toContain("New conversation exchange:");
  });

  it("shows 'none' in user message when no existing facts provided", async () => {
    mockFetchWithFacts([]);
    await extractFacts(exchange, credentials, model, []);

    const body = JSON.parse(
      ((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit).body as string,
    );
    const userContent: string = body.messages[1].content;
    expect(userContent).toContain("Already known facts: none");
  });
});

// ─── useMemory hook ───────────────────────────────────────────────────────────

describe("useMemory hook", () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.getState().resetSettings();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads existing memories from localStorage on mount", () => {
    const entry = makeEntry({ id: "pre-existing" });
    saveMemory(entry);

    const { result } = renderHook(() => useMemory());
    expect(result.current.memories).toHaveLength(1);
    expect(result.current.memories[0].id).toBe("pre-existing");
  });

  describe("injectMemories", () => {
    it("returns the system prompt unchanged when memoryEnabled is false", () => {
      useAppStore.getState().updateSetting("memoryEnabled", false);
      saveMemory(makeEntry({ fact: "User is Alice" }));

      const { result } = renderHook(() => useMemory());
      const output = result.current.injectMemories("Be helpful.");
      expect(output).toBe("Be helpful.");
    });

    it("returns system prompt unchanged when memoryEnabled is true but no memories exist", () => {
      useAppStore.getState().updateSetting("memoryEnabled", true);

      const { result } = renderHook(() => useMemory());
      const output = result.current.injectMemories("Be helpful.");
      expect(output).toBe("Be helpful.");
    });

    it("prepends memory block when memoryEnabled is true and memories exist", () => {
      useAppStore.getState().updateSetting("memoryEnabled", true);
      saveMemory(makeEntry({ fact: "User loves Rust" }));

      const { result } = renderHook(() => useMemory());
      const output = result.current.injectMemories("Be helpful.");
      expect(output).toContain("What you know about me:");
      expect(output).toContain("User loves Rust");
      expect(output).toContain("Be helpful.");
    });

    it("injects at most 10 memories (most recent first)", () => {
      useAppStore.getState().updateSetting("memoryEnabled", true);
      for (let i = 0; i < 12; i++) {
        saveMemory(
          makeEntry({ id: `mem-${i}`, fact: `fact ${i}`, createdAt: i * 1000, updatedAt: i * 1000 }),
        );
      }

      const { result } = renderHook(() => useMemory());
      const output = result.current.injectMemories("sys");
      const lines = output.split("\n").filter((l) => l.startsWith("- "));
      expect(lines).toHaveLength(10);
      // Most recent (highest createdAt) should appear first
      expect(lines[0]).toContain("fact 11");
    });
  });

  describe("updateMemory / deleteMemory / clearMemories", () => {
    it("updateMemory updates fact in state and storage", () => {
      saveMemory(makeEntry({ id: "mem-1", fact: "old fact" }));

      const { result } = renderHook(() => useMemory());
      act(() => {
        result.current.updateMemory("mem-1", "new fact");
      });

      expect(result.current.memories[0].fact).toBe("new fact");
      expect(loadMemories()[0].fact).toBe("new fact");
    });

    it("deleteMemory removes entry from state and storage", () => {
      saveMemory(makeEntry({ id: "mem-1" }));
      saveMemory(makeEntry({ id: "mem-2", fact: "keep" }));

      const { result } = renderHook(() => useMemory());
      act(() => {
        result.current.deleteMemory("mem-1");
      });

      expect(result.current.memories).toHaveLength(1);
      expect(result.current.memories[0].id).toBe("mem-2");
    });

    it("clearMemories empties state and storage", () => {
      saveMemory(makeEntry({ id: "mem-1" }));
      saveMemory(makeEntry({ id: "mem-2" }));

      const { result } = renderHook(() => useMemory());
      act(() => {
        result.current.clearMemories();
      });

      expect(result.current.memories).toEqual([]);
      expect(loadMemories()).toEqual([]);
    });
  });

  describe("extractAndStore", () => {
    const credentials = { apiKey: "test-key", apiUrl: "https://api.example.com" };
    const exchange: Message[] = [
      { id: "1", role: "user", content: "I live in Tokyo.", timestamp: 1000 },
      { id: "2", role: "assistant", content: "Cool!", timestamp: 1001 },
    ];

    it("does not call fetch when memoryEnabled is false", async () => {
      useAppStore.getState().updateSetting("memoryEnabled", false);
      global.fetch = vi.fn();

      const { result } = renderHook(() => useMemory());
      act(() => {
        result.current.extractAndStore("conv-1", exchange, credentials, "gpt-4");
      });

      await new Promise((r) => setTimeout(r, 50));
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("does not save a duplicate fact that already exists in storage", async () => {
      useAppStore.getState().updateSetting("memoryEnabled", true);
      saveMemory(makeEntry({ id: "existing", fact: "User lives in Tokyo" }));

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '["User lives in Tokyo"]' } }],
        }),
      });

      const { result } = renderHook(() => useMemory());
      act(() => {
        result.current.extractAndStore("conv-2", exchange, credentials, "gpt-4");
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 100));
      });

      expect(result.current.memories).toHaveLength(1);
      expect(result.current.memories[0].id).toBe("existing");
    });

    it("does not save a duplicate fact differing only by case/whitespace", async () => {
      useAppStore.getState().updateSetting("memoryEnabled", true);
      saveMemory(makeEntry({ id: "existing", fact: "User lives in Tokyo" }));

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '["  user lives in tokyo  "]' } }],
        }),
      });

      const { result } = renderHook(() => useMemory());
      act(() => {
        result.current.extractAndStore("conv-2", exchange, credentials, "gpt-4");
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 100));
      });

      expect(result.current.memories).toHaveLength(1);
    });

    it("extracts facts and stores them when memoryEnabled is true", async () => {
      useAppStore.getState().updateSetting("memoryEnabled", true);
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '["User lives in Tokyo"]' } }],
        }),
      });

      const { result } = renderHook(() => useMemory());
      act(() => {
        result.current.extractAndStore("conv-1", exchange, credentials, "gpt-4");
      });

      // Wait for async extraction
      await act(async () => {
        await new Promise((r) => setTimeout(r, 100));
      });

      expect(result.current.memories).toHaveLength(1);
      expect(result.current.memories[0].fact).toBe("User lives in Tokyo");
      expect(result.current.memories[0].sourceConversationId).toBe("conv-1");
    });

    it("sets isExtracting true during extraction and false after", async () => {
      useAppStore.getState().updateSetting("memoryEnabled", true);

      let resolve: (v: unknown) => void;
      const fetchPromise = new Promise((r) => { resolve = r; });
      global.fetch = vi.fn().mockReturnValueOnce(fetchPromise);

      const { result } = renderHook(() => useMemory());

      act(() => {
        result.current.extractAndStore("conv-1", exchange, credentials, "gpt-4");
      });

      expect(result.current.isExtracting).toBe(true);

      await act(async () => {
        resolve!({
          ok: true,
          json: async () => ({ choices: [{ message: { content: "[]" } }] }),
        });
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(result.current.isExtracting).toBe(false);
    });
  });

  describe("memoryTools", () => {
    it("returns empty array when memoryEnabled is false", () => {
      useAppStore.getState().updateSetting("memoryEnabled", false);
      const { result } = renderHook(() => useMemory());
      expect(result.current.memoryTools).toHaveLength(0);
    });

    it("returns 3 tool definitions when memoryEnabled is true", () => {
      useAppStore.getState().updateSetting("memoryEnabled", true);
      const { result } = renderHook(() => useMemory());
      expect(result.current.memoryTools).toHaveLength(3);
      const names = result.current.memoryTools.map((t) => t.function.name);
      expect(names).toContain("store_memory");
      expect(names).toContain("list_memories");
      expect(names).toContain("delete_memory");
    });

    it("all tool definitions carry serverId __memory__", () => {
      useAppStore.getState().updateSetting("memoryEnabled", true);
      const { result } = renderHook(() => useMemory());
      result.current.memoryTools.forEach((t) => {
        expect(t.serverId).toBe("__memory__");
      });
    });
  });

  describe("executeMemoryTool", () => {
    it("store_memory saves a new fact and returns confirmation", async () => {
      const { result } = renderHook(() => useMemory());
      let msg = "";
      await act(async () => {
        msg = await result.current.executeMemoryTool("store_memory", { fact: "User likes cats" });
      });
      expect(msg).toContain("Remembered");
      expect(result.current.memories.some((m) => m.fact === "User likes cats")).toBe(true);
    });

    it("store_memory rejects a duplicate fact", async () => {
      saveMemory(makeEntry({ fact: "User likes cats" }));
      const { result } = renderHook(() => useMemory());
      let msg = "";
      await act(async () => {
        msg = await result.current.executeMemoryTool("store_memory", { fact: "User likes cats" });
      });
      expect(msg).toContain("Already remembered");
      expect(result.current.memories).toHaveLength(1);
    });

    it("store_memory returns error for empty fact", async () => {
      const { result } = renderHook(() => useMemory());
      let msg = "";
      await act(async () => {
        msg = await result.current.executeMemoryTool("store_memory", { fact: "   " });
      });
      expect(msg).toContain("Error");
    });

    it("list_memories returns all stored facts with ids", async () => {
      saveMemory(makeEntry({ id: "mem-1", fact: "fact one" }));
      saveMemory(makeEntry({ id: "mem-2", fact: "fact two" }));
      const { result } = renderHook(() => useMemory());
      let msg = "";
      await act(async () => {
        msg = await result.current.executeMemoryTool("list_memories", {});
      });
      expect(msg).toContain("mem-1");
      expect(msg).toContain("fact one");
      expect(msg).toContain("mem-2");
      expect(msg).toContain("fact two");
    });

    it("list_memories reports empty when no memories exist", async () => {
      const { result } = renderHook(() => useMemory());
      let msg = "";
      await act(async () => {
        msg = await result.current.executeMemoryTool("list_memories", {});
      });
      expect(msg).toContain("No memories");
    });

    it("delete_memory removes the entry and returns confirmation", async () => {
      saveMemory(makeEntry({ id: "mem-1", fact: "to delete" }));
      saveMemory(makeEntry({ id: "mem-2", fact: "keep" }));
      const { result } = renderHook(() => useMemory());
      let msg = "";
      await act(async () => {
        msg = await result.current.executeMemoryTool("delete_memory", { id: "mem-1" });
      });
      expect(msg).toContain("mem-1");
      expect(result.current.memories).toHaveLength(1);
      expect(result.current.memories[0].id).toBe("mem-2");
    });

    it("unknown tool name returns error string without throwing", async () => {
      const { result } = renderHook(() => useMemory());
      let msg = "";
      await act(async () => {
        msg = await result.current.executeMemoryTool("nonexistent_tool", {});
      });
      expect(msg).toContain("Unknown memory tool");
    });
  });
});
