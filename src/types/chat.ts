/**
 * Chat-related TypeScript types and interfaces
 */

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  tokens?: number // Estimated tokens used by this message
}

export interface ConversationMetadata {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messageCount: number
  totalTokens: number
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
  totalTokens: number
  systemPrompt: string
  model: string
  temperature: number
  maxTokens: number
}

export interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
  model: string
  temperature: number
  maxTokens: number
  stream: boolean
}

export interface ChatResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: 'assistant'
      content: string
    }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface StreamChunk {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      role?: string
      content?: string
    }
    finish_reason: string | null
  }>
}
