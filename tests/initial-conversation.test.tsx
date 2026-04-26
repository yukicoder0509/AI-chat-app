import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, waitFor, act } from "@testing-library/react";
import { App } from "../src/app/App";
import { useChatStore } from "../src/app/store/useChatStore";

// Suppress network requests (models endpoint, MCP, etc.)
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ data: [] }),
  body: new ReadableStream({ start(c) { c.close(); } }),
});

Element.prototype.scrollIntoView = vi.fn();

describe("Initial conversation creation", () => {
  beforeEach(() => {
    localStorage.clear();
    useChatStore.getState().clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("creates exactly one conversation when the chat list is empty", async () => {
    render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );

    await waitFor(() => {
      expect(useChatStore.getState().conversations).toHaveLength(1);
    });

    // Hold for a tick to confirm no second conversation is added
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(useChatStore.getState().conversations).toHaveLength(1);
  });

  it("does not create a new conversation when one already exists", async () => {
    useChatStore
      .getState()
      .createConversation("Existing Chat", "You are helpful", "gpt-4");

    render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(useChatStore.getState().conversations).toHaveLength(1);
  });
});
