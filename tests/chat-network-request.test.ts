/**
 * Test suite to verify network requests are sent when messages are submitted
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  OpenAIClient,
  getOpenAIClient,
  resetOpenAIClient,
} from "../src/services/openai/openaiClient";
import { streamChat } from "../src/services/openai/streamChat";

// Mock fetch globally
global.fetch = vi.fn();

describe("Network Requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetOpenAIClient();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("OpenAIClient - streamChatCompletion", () => {
    it("should send a fetch request when streamChatCompletion is called", async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

      // Mock the fetch response with a mock ReadableStream
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
            ),
          );
          controller.enqueue(
            new TextEncoder().encode(
              'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
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

      const client = new OpenAIClient({
        apiUrl: "https://api.openai.com",
        apiKey: "test-key",
      });

      const messages = [
        {
          role: "user" as const,
          content: "Hello",
        },
      ];

      // Consume the async iterator
      const iterator = client.streamChatCompletion({
        model: "gpt-3.5-turbo",
        messages,
      });

      // Iterate through to trigger the fetch
      for await (const chunk of iterator) {
        // Process chunks
      }

      // Verify fetch was called
      expect(mockFetch).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/v1/chat/completions"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer test-key",
          }),
        }),
      );
    });

    it("should send correct request body with stream: true", async () => {
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

      const client = new OpenAIClient({
        apiUrl: "https://api.openai.com",
        apiKey: "test-key",
      });

      const messages = [
        {
          role: "user" as const,
          content: "Test message",
        },
      ];

      const iterator = client.streamChatCompletion({
        model: "gpt-4",
        messages,
        temperature: 0.7,
        maxTokens: 100,
      });

      for await (const chunk of iterator) {
        // Process chunks
      }

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      // Verify basic request structure
      expect(requestBody.model).toBe("gpt-4");
      expect(requestBody.messages).toEqual(messages);
      expect(requestBody.temperature).toBe(0.7);
      expect(requestBody.stream).toBe(true);
      // Verify max_tokens is set (handling both camelCase and snake_case)
      expect(requestBody.max_tokens || requestBody.maxTokens).toBe(100);
    });
  });

  describe("streamChat function", () => {
    it("should send fetch request when streamChat is called", async () => {
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

      getOpenAIClient({
        apiUrl: "https://api.openai.com",
        apiKey: "test-key",
      });

      await streamChat(
        [
          {
            role: "user",
            content: "Say hello",
          },
        ],
        {
          model: "gpt-3.5-turbo",
        },
        {},
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should call onChunk callbacks as stream data arrives", async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      const onChunkMock = vi.fn();
      const onCompleteMock = vi.fn();

      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
            ),
          );
          controller.enqueue(
            new TextEncoder().encode(
              'data: {"choices":[{"delta":{"content":" "}}]}\n\n',
            ),
          );
          controller.enqueue(
            new TextEncoder().encode(
              'data: {"choices":[{"delta":{"content":"world"}}]}\n\n',
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

      getOpenAIClient({
        apiUrl: "https://api.openai.com",
        apiKey: "test-key",
      });

      await streamChat(
        [
          {
            role: "user",
            content: "Say hello",
          },
        ],
        {
          model: "gpt-3.5-turbo",
        },
        {
          onChunk: onChunkMock,
          onComplete: onCompleteMock,
        },
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(onChunkMock).toHaveBeenCalledWith("Hello");
      expect(onChunkMock).toHaveBeenCalledWith(" ");
      expect(onChunkMock).toHaveBeenCalledWith("world");
      expect(onCompleteMock).toHaveBeenCalledWith("Hello world");
    });

    it("should call onError callback when network request fails", async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      const onErrorMock = vi.fn();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: {
            message: "Unauthorized",
            code: "invalid_api_key",
          },
        }),
      });

      getOpenAIClient({
        apiUrl: "https://api.openai.com",
        apiKey: "test-key",
      });

      try {
        await streamChat(
          [
            {
              role: "user",
              content: "Test",
            },
          ],
          {
            model: "gpt-3.5-turbo",
          },
          {
            onError: onErrorMock,
          },
        );
      } catch (error) {
        // Expected to throw
      }

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(onErrorMock).toHaveBeenCalled();
    });
  });

  describe("Request headers and authentication", () => {
    it("should include Authorization header with API key", async () => {
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

      const testApiKey = "sk-test-12345";
      const client = new OpenAIClient({
        apiUrl: "https://api.openai.com",
        apiKey: testApiKey,
      });

      const iterator = client.streamChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "test" }],
      });

      for await (const chunk of iterator) {
        // Process chunks
      }

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1].headers.Authorization).toBe(`Bearer ${testApiKey}`);
    });

    it("should set Content-Type header to application/json", async () => {
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

      const client = new OpenAIClient({
        apiUrl: "https://api.openai.com",
        apiKey: "test-key",
      });

      const iterator = client.streamChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "test" }],
      });

      for await (const chunk of iterator) {
        // Process chunks
      }

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1].headers["Content-Type"]).toBe("application/json");
    });
  });
});
