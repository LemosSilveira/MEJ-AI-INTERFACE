import { useContext } from 'react'
import { ConversationsContext, type ConversationsContextValue } from '../context/ConversationsContext'

export function useConversationsContext(): ConversationsContextValue {
  const context = useContext(ConversationsContext)
  if (!context) {
    throw new Error('useConversationsContext deve ser usado dentro de ConversationsProvider')
  }
  return context
}
