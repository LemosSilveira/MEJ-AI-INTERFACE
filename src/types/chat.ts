export type Role = 'user' | 'assistant'

export interface Message {
  id: string
  role: Role
  content: string
  isStreaming?: boolean
  error?: string
  createdAt: number
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  draft: string
  isLoading: boolean
  createdAt: number
}

export interface AppState {
  conversations: Conversation[]
  activeConversationId: string
}
