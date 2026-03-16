/**
 * Streaming response handler for OpenAI API
 * Wraps the stream iteration with additional logic and error handling
 */

import type { Message } from "../../types/chat";
import { getOpenAIClient } from "./openaiClient";

export interface StreamOptions {
  onChunk?: (content: string) => void;
  onComplete?: (fullMessage: string) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
}

/**
 * Stream a chat completion from OpenAI API
 */
export async function streamChat(
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }>,
  options: {
    model: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  },
  callbacks: StreamOptions,
  credentials?: {
    apiKey: string;
    apiUrl: string;
  },
): Promise<string> {
  const client = getOpenAIClient(
    credentials
      ? {
          apiKey: credentials.apiKey,
          apiUrl: credentials.apiUrl,
        }
      : undefined,
  );

  let fullMessage = "";
  callbacks.onStart?.();

  try {
    const stream = client.streamChatCompletion({
      model: options.model,
      messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
    });

    for await (const chunk of stream) {
      const content = extractContent(chunk);
      if (content) {
        fullMessage += content;
        callbacks.onChunk?.(content);
      }
    }

    callbacks.onComplete?.(fullMessage);
    return fullMessage;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    callbacks.onError?.(err);
    throw err;
  }
}

/**
 * Extract content from a stream chunk
 */
function extractContent(chunk: any): string {
  try {
    if (chunk?.choices?.[0]?.delta?.content) {
      return chunk.choices[0].delta.content;
    }
  } catch (error) {
    console.error("Error extracting content from chunk:", error);
  }
  return "";
}

/**
 * Convert streaming response to Message objects
 */
export async function* streamChatAsMessages(
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }>,
  options: {
    model: string;
    temperature?: number;
    maxTokens?: number;
  },
): AsyncGenerator<Partial<Message>> {
  const client = getOpenAIClient();
  let fullContent = "";

  try {
    const stream = client.streamChatCompletion({
      model: options.model,
      messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    });

    for await (const chunk of stream) {
      const content = extractContent(chunk);
      if (content) {
        fullContent += content;
        yield {
          role: "assistant",
          content: fullContent,
          timestamp: Date.now(),
        };
      }
    }
  } catch (error) {
    console.error("Stream error:", error);
    throw error;
  }
}
