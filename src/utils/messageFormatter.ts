/**
 * Message formatter utility
 * Handles formatting and display of messages
 */

import type { Message } from "../types/chat";

/**
 * Format timestamp to readable string
 */
export const formatTimestamp = (
  timestamp: number,
  format?: "time" | "date" | "full",
): string => {
  const date = new Date(timestamp);

  if (format === "time") {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  if (format === "date") {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  // Default: full format
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Get display name for message role
 */
export const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    user: "You",
    assistant: "Assistant",
    system: "System",
  };
  return labels[role] || role;
};

/**
 * Escape HTML in message content
 */
export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
};

/**
 * Format message content for display (plain text)
 */
export const formatMessageContent = (content: string): string => {
  return content.trim();
};

/**
 * Create summary of message for preview
 */
export const createMessageSummary = (
  content: string,
  maxLength: number = 100,
): string => {
  const trimmed = content.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return trimmed.substring(0, maxLength).trim() + "...";
};

/**
 * Get initials from role name
 */
export const getRoleInitials = (role: string): string => {
  const labels = getRoleLabel(role);
  return labels
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

/**
 * Format message for export (markdown)
 */
export const formatMessageAsMarkdown = (message: Message): string => {
  const roleLabel = getRoleLabel(message.role).toUpperCase();
  const timestamp = formatTimestamp(message.timestamp, "time");
  const tokens = message.tokens ? ` ~${message.tokens} tokens` : "";

  return `**${roleLabel}** _${timestamp}${tokens}_\n\n${message.content}\n\n---\n`;
};

/**
 * Format message for export (JSON)
 */
export const formatMessageAsJson = (message: Message) => {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: formatTimestamp(message.timestamp, "full"),
    tokens: message.tokens,
  };
};

/**
 * Extract code blocks from message
 */
export const extractCodeBlocks = (
  content: string,
): Array<{ language: string; code: string }> => {
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const blocks: Array<{ language: string; code: string }> = [];
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    blocks.push({
      language: match[1] || "plaintext",
      code: match[2].trim(),
    });
  }

  return blocks;
};

/**
 * Highlight code blocks in content
 */
export const highlightCodeBlocks = (content: string): string => {
  return content.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_match, language, code) => {
      return `<pre><code class="language-${language || "plaintext"}">${escapeHtml(code.trim())}</code></pre>`;
    },
  );
};

/**
 * Convert markdown links to clickable format
 */
export const parseMarkdownLinks = (content: string): string => {
  return content.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );
};

/**
 * Check if content contains code blocks
 */
export const hasCodeBlocks = (content: string): boolean => {
  return /```[\s\S]*?```/g.test(content);
};

/**
 * Check if content contains markdown links
 */
export const hasMarkdownLinks = (content: string): boolean => {
  return /\[([^\]]+)\]\(([^)]+)\)/g.test(content);
};
