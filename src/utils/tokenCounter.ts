/**
 * Token counter utility
 * Estimates token count for messages and text
 * Uses a simple estimation based on character count
 * For production, use OpenAI's tiktoken library
 */

/**
 * Estimate token count for a given text
 * Rough estimation: ~1 token per 4 characters (English)
 * For precise counts, use OpenAI's tiktoken library
 */
export const estimateTokens = (text: string): number => {
  if (!text) return 0;
  // Split by words and estimate
  return Math.ceil(text.length / 4);
};

/**
 * Estimate tokens for a message
 */
export const estimateMessageTokens = (
  _role: string,
  content: string,
): number => {
  // Add overhead for role and formatting
  const overhead = 4; // tokens for message formatting
  return overhead + estimateTokens(content);
};

/**
 * Calculate total tokens for a conversation
 */
export const calculateConversationTokens = (
  messages: Array<{ role: string; content: string }>,
): number => {
  return messages.reduce((total, msg) => {
    return total + estimateMessageTokens(msg.role, msg.content);
  }, 0);
};

/**
 * Check if adding a message would exceed token limit
 */
export const wouldExceedTokenLimit = (
  currentTokens: number,
  newMessage: string,
  limit: number,
): boolean => {
  const newTokens = estimateMessageTokens("user", newMessage);
  return currentTokens + newTokens > limit;
};

/**
 * Get remaining tokens for a conversation
 */
export const getRemainingTokens = (
  currentTokens: number,
  limit: number,
): number => {
  return Math.max(0, limit - currentTokens);
};

/**
 * Format token count for display
 */
export const formatTokenCount = (tokens: number): string => {
  if (tokens < 1000) {
    return `${tokens} tokens`;
  }
  return `${(tokens / 1000).toFixed(1)}k tokens`;
};

/**
 * Truncate conversation messages to fit within token limit
 * Removes oldest messages first, keeping the most recent ones
 */
export const truncateConversationToTokenLimit = (
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
): Array<{ role: string; content: string }> => {
  let totalTokens = 0;
  const result: Array<{ role: string; content: string }> = [];

  // Work backwards from the most recent message
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const msgTokens = estimateMessageTokens(msg.role, msg.content);

    if (totalTokens + msgTokens <= maxTokens) {
      result.unshift(msg);
      totalTokens += msgTokens;
    } else {
      break;
    }
  }

  return result;
};
