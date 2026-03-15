/**
 * OpenAI API client wrapper
 * Handles all communication with the OpenAI API
 */

import type {
  OpenAIRequestBody,
  OpenAIResponse,
  OpenAIStreamResponse,
  OpenAIErrorResponse,
} from "../../types/openai";

export interface OpenAIClientConfig {
  apiUrl: string;
  apiKey: string;
}

export class OpenAIClient {
  private apiUrl: string;
  private apiKey: string;

  constructor(config: OpenAIClientConfig) {
    this.apiUrl = config.apiUrl;
    this.apiKey = config.apiKey;
  }

  /**
   * Set a new API key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Set a new API URL
   */
  setApiUrl(apiUrl: string): void {
    this.apiUrl = apiUrl;
  }

  /**
   * Make a non-streaming chat request to the OpenAI API
   */
  async createChatCompletion(
    body: Omit<OpenAIRequestBody, "stream">,
  ): Promise<OpenAIResponse> {
    const requestBody: OpenAIRequestBody = {
      ...body,
      stream: false,
    };

    const response = await this.makeRequest<OpenAIResponse>(
      "/v1/chat/completions",
      requestBody,
    );
    return response;
  }

  /**
   * Make a streaming chat request to the OpenAI API
   * Returns an async iterable of stream chunks
   */
  async *streamChatCompletion(
    body: Omit<OpenAIRequestBody, "stream">,
  ): AsyncIterable<OpenAIStreamResponse> {
    const requestBody: OpenAIRequestBody = {
      ...body,
      stream: true,
    };

    const response = await fetch(`${this.apiUrl}/v1/chat/completions`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as OpenAIErrorResponse;
      throw new OpenAIError(
        errorData.error.message,
        response.status,
        errorData.error.code || "unknown_error",
      );
    }

    if (!response.body) {
      throw new Error("No response body for streaming request");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines[lines.length - 1];

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();

          if (line === "" || line === "[DONE]") {
            continue;
          }

          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data) as OpenAIStreamResponse;
              yield parsed;
            } catch (error) {
              console.error("Error parsing stream chunk:", error, data);
            }
          }
        }
      }

      // Process final buffer
      if (buffer.trim() && !buffer.includes("[DONE]")) {
        if (buffer.startsWith("data: ")) {
          const data = buffer.slice(6);
          try {
            const parsed = JSON.parse(data) as OpenAIStreamResponse;
            yield parsed;
          } catch (error) {
            console.error("Error parsing final stream chunk:", error, data);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Test the API connection and key validity
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: "test",
          },
        ],
        max_tokens: 10,
      });
      return !!response.id;
    } catch (error) {
      return false;
    }
  }

  /**
   * Make a generic request to the OpenAI API
   */
  private async makeRequest<T>(endpoint: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as OpenAIErrorResponse;
      throw new OpenAIError(
        errorData.error.message,
        response.status,
        errorData.error.code || "unknown_error",
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * Get the headers for API requests
   */
  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };
  }
}

/**
 * Custom error class for OpenAI API errors
 */
export class OpenAIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
  ) {
    super(message);
    this.name = "OpenAIError";
  }
}

/**
 * Create a singleton instance of OpenAI client
 */
let clientInstance: OpenAIClient | null = null;

export function getOpenAIClient(config?: OpenAIClientConfig): OpenAIClient {
  if (!clientInstance) {
    if (!config) {
      throw new Error(
        "OpenAI client configuration is required for initialization",
      );
    }
    clientInstance = new OpenAIClient(config);
  }
  return clientInstance;
}

export function setOpenAIClient(client: OpenAIClient): void {
  clientInstance = client;
}

export function resetOpenAIClient(): void {
  clientInstance = null;
}
