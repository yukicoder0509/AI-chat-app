/**
 * Conversation storage using localStorage and IndexedDB
 * Handles persistence of conversation history
 */

import type { Conversation, ConversationMetadata } from '../../types/chat'

const STORAGE_KEY = 'ai-chatroom-conversations'
const METADATA_STORAGE_KEY = 'ai-chatroom-metadata'

export class ConversationStorage {
  /**
   * Save a conversation to storage
   */
  static saveConversation(conversation: Conversation): void {
    try {
      const conversations = this.getAllConversations()
      const index = conversations.findIndex((c) => c.id === conversation.id)

      if (index >= 0) {
        conversations[index] = conversation
      } else {
        conversations.push(conversation)
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
      this.updateMetadata(conversation)
    } catch (error) {
      console.error('Error saving conversation:', error)
      throw new Error('Failed to save conversation')
    }
  }

  /**
   * Get a conversation by ID
   */
  static getConversation(id: string): Conversation | null {
    try {
      const conversations = this.getAllConversations()
      return conversations.find((c) => c.id === id) || null
    } catch (error) {
      console.error('Error getting conversation:', error)
      return null
    }
  }

  /**
   * Get all conversations
   */
  static getAllConversations(): Conversation[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error parsing conversations:', error)
      return []
    }
  }

  /**
   * Get conversation metadata for list view
   */
  static getConversationMetadata(): ConversationMetadata[] {
    try {
      const data = localStorage.getItem(METADATA_STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error getting conversation metadata:', error)
      return []
    }
  }

  /**
   * Delete a conversation
   */
  static deleteConversation(id: string): void {
    try {
      const conversations = this.getAllConversations()
      const filtered = conversations.filter((c) => c.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))

      const metadata = this.getConversationMetadata()
      const filteredMetadata = metadata.filter((m) => m.id !== id)
      localStorage.setItem(METADATA_STORAGE_KEY, JSON.stringify(filteredMetadata))
    } catch (error) {
      console.error('Error deleting conversation:', error)
      throw new Error('Failed to delete conversation')
    }
  }

  /**
   * Clear all conversations
   */
  static clearAllConversations(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(METADATA_STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing conversations:', error)
      throw new Error('Failed to clear conversations')
    }
  }

  /**
   * Get storage statistics
   */
  static getStorageStats(): { conversations: number; totalMessages: number; totalTokens: number } {
    const conversations = this.getAllConversations()
    let totalMessages = 0
    let totalTokens = 0

    conversations.forEach((conv) => {
      totalMessages += conv.messages.length
      totalTokens += conv.totalTokens || 0
    })

    return { conversations: conversations.length, totalMessages, totalTokens }
  }

  /**
   * Update metadata for a conversation
   */
  private static updateMetadata(conversation: Conversation): void {
    const metadata: ConversationMetadata = {
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messageCount: conversation.messages.length,
      totalTokens: conversation.totalTokens || 0,
    }

    const allMetadata = this.getConversationMetadata()
    const index = allMetadata.findIndex((m) => m.id === metadata.id)

    if (index >= 0) {
      allMetadata[index] = metadata
    } else {
      allMetadata.push(metadata)
    }

    localStorage.setItem(METADATA_STORAGE_KEY, JSON.stringify(allMetadata))
  }
}
