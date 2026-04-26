import type { Message } from "../../types/chat";
import type { MessageContent, OpenAITool, OpenAIToolCall } from "../../types/openai";
import { getOpenAIClient } from "./openaiClient";

export interface ToolCallAccumulator {
  index: number;
  id: string;
  name: string;
  argumentsRaw: string;
}

export interface StreamOptions {
  onChunk?: (content: string) => void;
  onComplete?: (fullMessage: string) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
  onToolCalls?: (calls: OpenAIToolCall[]) => void;
  tools?: OpenAITool[];
}

export async function streamChat(
  messages: Array<{
    role: "user" | "assistant" | "system" | "tool";
    content: MessageContent;
    tool_call_id?: string;
    tool_calls?: OpenAIToolCall[];
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
  // "auto" must never reach the API
  if (options.model === "auto") {
    throw new Error('Model "auto" is a routing sentinel and must not be sent to the API.');
  }

  const client = getOpenAIClient(
    credentials ? { apiKey: credentials.apiKey, apiUrl: credentials.apiUrl } : undefined,
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
      ...(callbacks.tools && callbacks.tools.length > 0
        ? { tools: callbacks.tools, tool_choice: "auto" as const }
        : {}),
    });

    const toolAccumulators = new Map<number, ToolCallAccumulator>();
    let finishedWithToolCalls = false;

    for await (const chunk of stream) {
      const choice = chunk?.choices?.[0];
      if (!choice) continue;

      const delta = choice.delta;

      // Accumulate tool call deltas
      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (!toolAccumulators.has(tc.index)) {
            toolAccumulators.set(tc.index, {
              index: tc.index,
              id: tc.id ?? "",
              name: tc.function?.name ?? "",
              argumentsRaw: "",
            });
          }
          const acc = toolAccumulators.get(tc.index)!;
          if (tc.id) acc.id = tc.id;
          if (tc.function?.name) acc.name = tc.function.name;
          if (tc.function?.arguments) acc.argumentsRaw += tc.function.arguments;
        }
      }

      const content = delta?.content;
      if (content) {
        fullMessage += content;
        callbacks.onChunk?.(content);
      }

      if (choice.finish_reason === "tool_calls") {
        finishedWithToolCalls = true;
      }
    }

    if (finishedWithToolCalls && toolAccumulators.size > 0) {
      const calls: OpenAIToolCall[] = Array.from(toolAccumulators.values()).map((acc) => ({
        id: acc.id,
        type: "function" as const,
        function: { name: acc.name, arguments: acc.argumentsRaw },
      }));
      callbacks.onToolCalls?.(calls);
      // Don't call onComplete here — the caller will continue with tool results
    } else {
      callbacks.onComplete?.(fullMessage);
    }

    return fullMessage;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    callbacks.onError?.(err);
    throw err;
  }
}

function extractContent(chunk: unknown): string {
  try {
    const c = chunk as { choices?: Array<{ delta?: { content?: string } }> };
    return c?.choices?.[0]?.delta?.content ?? "";
  } catch {
    return "";
  }
}

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
