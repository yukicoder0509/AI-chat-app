/**
 * Export conversations to Markdown format
 */

import type { Conversation } from "../../types/chat";

/**
 * Export a conversation to Markdown
 */
export function exportToMarkdown(conversation: Conversation): string {
  const lines: string[] = [];

  // Header
  lines.push(`# ${escapeMarkdown(conversation.title)}`);
  lines.push("");

  // Metadata
  lines.push("## Conversation Info");
  lines.push(
    `- **Created**: ${new Date(conversation.createdAt).toLocaleString()}`,
  );
  lines.push(
    `- **Updated**: ${new Date(conversation.updatedAt).toLocaleString()}`,
  );
  lines.push(`- **Model**: ${conversation.model}`);
  lines.push(`- **Temperature**: ${conversation.temperature}`);
  lines.push(`- **Max Tokens**: ${conversation.maxTokens}`);
  lines.push(`- **Total Messages**: ${conversation.messages.length}`);
  lines.push("");

  // System Prompt
  if (conversation.systemPrompt) {
    lines.push("## System Prompt");
    lines.push("```");
    lines.push(conversation.systemPrompt);
    lines.push("```");
    lines.push("");
  }

  // Messages
  lines.push("## Conversation");
  lines.push("");

  conversation.messages.forEach((message) => {
    if (message.role === "system") {
      return; // Skip system messages in conversation output
    }

    const timestamp = new Date(message.timestamp).toLocaleTimeString();
    const role = message.role === "user" ? "👤 User" : "🤖 Assistant";

    lines.push(`### ${role} (${timestamp})`);
    if (message.tokens) {
      lines.push(`**Tokens**: ${message.tokens}`);
    }
    lines.push("");
    lines.push(escapeMarkdown(message.content));
    lines.push("");
  });

  return lines.join("\n");
}

/**
 * Download a conversation as Markdown file
 */
export function downloadMarkdownExport(conversation: Conversation): void {
  const markdown = exportToMarkdown(conversation);
  const blob = new Blob([markdown], { type: "text/markdown" });
  downloadFile(blob, `conversation-${conversation.id}-${Date.now()}.md`);
}

/**
 * Create a Markdown string from conversation
 */
export function conversationToMarkdownString(
  conversation: Conversation,
): string {
  return exportToMarkdown(conversation);
}

/**
 * Escape special Markdown characters
 */
function escapeMarkdown(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\*/g, "\\*")
    .replace(/_/g, "\\_")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/#/g, "\\#")
    .replace(/\+/g, "\\+")
    .replace(/\-/g, "\\-")
    .replace(/\./g, "\\.")
    .replace(/!/g, "\\!")
    .replace(/\`/g, "\\`");
}

/**
 * Utility function to download a file
 */
function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
