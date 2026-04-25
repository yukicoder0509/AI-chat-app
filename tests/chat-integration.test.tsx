/**
 * Integration test: Verify network requests are sent when user sends message from UI
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatInterface } from "../src/components/ChatInterface";
import { useChat } from "../src/hooks/useChat";
import { useChatStore } from "../src/app/store/useChatStore";
import { useAppStore } from "../src/app/store/useAppStore";
import {
  getOpenAIClient,
  resetOpenAIClient,
} from "../src/services/openai/openaiClient";

// Mock fetch globally
global.fetch = vi.fn();

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Wrapper component that uses the useChat hook
const ChatInterfaceWithHook = () => {
  const { sendMessage } = useChat();
  const chatStore = useChatStore();

  return (
    <ChatInterface
      conversation={chatStore.currentConversation}
      onSendMessage={sendMessage}
      isLoading={false}
      isStreaming={false}
    />
  );
};

describe("Integration: UI Message Send -> Network Request", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetOpenAIClient();

    // Initialize OpenAI client
    getOpenAIClient({
      apiUrl: "https://api.openai.com",
      apiKey: "test-key-123",
    });

    // Clear store state to ensure clean test environment
    useChatStore.getState().clear();
    useAppStore.getState().resetSettings();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should send network request when user submits message from UI", async () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

    // Mock the streaming response
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            'data: {"choices":[{"delta":{"content":"This "}}]}\n\n',
          ),
        );
        controller.enqueue(
          new TextEncoder().encode(
            'data: {"choices":[{"delta":{"content":"is "}}]}\n\n',
          ),
        );
        controller.enqueue(
          new TextEncoder().encode(
            'data: {"choices":[{"delta":{"content":"a response"}}]}\n\n',
          ),
        );
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: mockStream,
    });

    // Set up stores
    const chatStore = useChatStore.getState();
    const appStore = useAppStore.getState();

    // Set API key using the correct method
    appStore.updateSetting("apiKey", "test-key-123");

    // Create a conversation
    const conversation = chatStore.createConversation(
      "Test Chat",
      "You are a helpful assistant.",
      "gpt-3.5-turbo",
    );

    chatStore.setCurrentConversation(conversation.id);

    // Render the component with the useChat hook
    render(<ChatInterfaceWithHook />);

    // Find the input box and send button
    const textarea = screen.getByPlaceholderText(/Type your message here/i);
    const sendButton = screen.getByRole("button", { name: /Send/i });

    // Type a message
    await userEvent.type(textarea, "Hello, what is 2+2?");

    // Verify the text was entered
    expect((textarea as HTMLTextAreaElement).value).toBe("Hello, what is 2+2?");

    // Send the message
    await userEvent.click(sendButton);

    // Wait for the fetch to be called
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    // Verify fetch was called with the correct endpoint and method
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/v1/chat/completions"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer test-key-123",
        }),
      }),
    );

    // Verify the request body is properly formed
    const callArgs = mockFetch.mock.calls[0];
    const requestBody = JSON.parse(callArgs[1].body);

    expect(requestBody.stream).toBe(true);
    expect(requestBody.model).toBe("gpt-3.5-turbo");
    expect(Array.isArray(requestBody.messages)).toBe(true);
  });

  it("should send request with correct API parameters from settings", async () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: mockStream,
    });

    // Set up stores
    const chatStore = useChatStore.getState();
    const appStore = useAppStore.getState();

    appStore.updateSetting("apiKey", "test-key-123");
    appStore.updateApiConfig({
      temperature: 0.8,
      maxTokens: 500,
    });

    // Create conversation
    const conversation = chatStore.createConversation(
      "Test Chat",
      "You are helpful",
      "gpt-4",
    );

    chatStore.setCurrentConversation(conversation.id);

    // Render and send message
    render(<ChatInterfaceWithHook />);

    const textarea = screen.getByPlaceholderText(/Type your message here/i);
    const sendButton = screen.getByRole("button", { name: /Send/i });

    await userEvent.type(textarea, "Test message");
    await userEvent.click(sendButton);

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    // Verify request body has custom settings
    const callArgs = mockFetch.mock.calls[0];
    const requestBody = JSON.parse(callArgs[1].body);

    expect(requestBody.temperature).toBe(0.8);
    expect(requestBody.model).toBe("gpt-4");
    // max_tokens may be in different format, check both
    expect(requestBody.max_tokens || requestBody.maxTokens).toBe(500);
  });

  it("should handle missing API key gracefully", async () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

    // Reset to remove the API key from the client
    resetOpenAIClient();

    // Don't set API key - simulates missing configuration
    const chatStore = useChatStore.getState();
    const appStore = useAppStore.getState();

    // Clear any existing API key
    appStore.resetSettings();

    // Create a conversation
    const conversation = chatStore.createConversation(
      "Test Chat",
      "You are helpful",
      "gpt-3.5-turbo",
    );

    chatStore.setCurrentConversation(conversation.id);

    render(<ChatInterfaceWithHook />);

    const textarea = screen.getByPlaceholderText(/Type your message here/i);
    const sendButton = screen.getByRole("button", { name: /Send/i });

    await userEvent.type(textarea, "Should not send");
    await userEvent.click(sendButton);

    // Wait for error handling
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Verify an error was set in the store
    const state = useAppStore.getState();
    expect(state.error).toBeTruthy();
    // Error should be about configuration or API key
    expect(state.error || "").toMatch(/API key|configuration/i);
  });
});
