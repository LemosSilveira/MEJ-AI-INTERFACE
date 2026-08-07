import { createContext, type ReactNode } from 'react'
import { useConversations } from '../hooks/useConversations'

export type ConversationsContextValue = ReturnType<typeof useConversations>

export const ConversationsContext = createContext<ConversationsContextValue | undefined>(undefined)

export function ConversationsProvider({ children }: { children: ReactNode }) {
  const value = useConversations()
  return <ConversationsContext.Provider value={value}>{children}</ConversationsContext.Provider>
}
