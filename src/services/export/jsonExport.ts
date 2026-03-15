/**
 * Export conversations to JSON format
 */

import type { Conversation } from '../../types/chat'

export interface JsonExportFormat {
  version: string
  exportedAt: string
  conversation: Conversation
}

/**
 * Export a conversation to JSON
 */
export function exportToJson(conversation: Conversation): JsonExportFormat {
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    conversation,
  }
}

/**
 * Download a conversation as JSON file
 */
export function downloadJsonExport(conversation: Conversation): void {
  const data = exportToJson(conversation)
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  downloadFile(blob, `conversation-${conversation.id}-${Date.now()}.json`)
}

/**
 * Create a JSON string from conversation
 */
export function conversationToJsonString(conversation: Conversation): string {
  const data = exportToJson(conversation)
  return JSON.stringify(data, null, 2)
}

/**
 * Import a conversation from JSON string
 */
export function importFromJson(jsonString: string): Conversation {
  try {
    const data = JSON.parse(jsonString) as JsonExportFormat
    return data.conversation
  } catch (error) {
    throw new Error('Invalid JSON format for conversation import')
  }
}

/**
 * Utility function to download a file
 */
function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
