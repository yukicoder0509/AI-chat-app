/**
 * Utility functions exports
 * Re-export all utility functions from a single entry point
 */

export {
  estimateTokens,
  estimateMessageTokens,
  calculateConversationTokens,
  wouldExceedTokenLimit,
  getRemainingTokens,
  formatTokenCount,
  truncateConversationToTokenLimit,
} from "./tokenCounter";

export {
  formatTimestamp,
  getRoleLabel,
  escapeHtml,
  formatMessageContent,
  createMessageSummary,
  getRoleInitials,
  formatMessageAsMarkdown,
  formatMessageAsJson,
  extractCodeBlocks,
  highlightCodeBlocks,
  parseMarkdownLinks,
  hasCodeBlocks,
  hasMarkdownLinks,
} from "./messageFormatter";

export {
  validateApiKey,
  validateApiUrl,
  validateMessageContent,
  validateSystemPrompt,
  validateTemperature,
  validateMaxTokens,
  validateTopP,
  validateFrequencyPenalty,
  validatePresencePenalty,
  validateConversationTitle,
  validateModel,
  validateApiParameters,
} from "./validators";

export type { ValidationResult } from "./validators";
