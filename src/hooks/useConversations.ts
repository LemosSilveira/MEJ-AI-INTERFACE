import { useCallback, useReducer } from 'react'
import { askJuniorStream } from '../services/api'
import type { AppState, Conversation, Message } from '../types/chat'

type Action =
  | { type: 'CREATE_CONVERSATION' }
  | { type: 'SET_ACTIVE'; conversationId: string }
  | { type: 'SET_DRAFT'; conversationId: string; draft: string }
  | { type: 'ADD_MESSAGE'; conversationId: string; message: Message }
  | { type: 'APPEND_CHUNK'; conversationId: string; messageId: string; chunk: string }
  | { type: 'SET_STREAM_DONE'; conversationId: string; messageId: string }
  | { type: 'SET_STREAM_ERROR'; conversationId: string; messageId: string; error: string }
  | { type: 'SET_LOADING'; conversationId: string; isLoading: boolean }
  | { type: 'RESET_FOR_RETRY'; conversationId: string; messageId: string }

function createConversation(): Conversation {
  return {
    id: crypto.randomUUID(),
    title: 'Nova Conversa',
    messages: [],
    draft: '',
    isLoading: false,
    createdAt: Date.now(),
  }
}

function truncateTitle(text: string, max = 30): string {
  const trimmed = text.trim()
  return trimmed.length > max ? `${trimmed.slice(0, max).trimEnd()}…` : trimmed
}

function updateConversation(
  state: AppState,
  conversationId: string,
  updater: (conversation: Conversation) => Conversation,
): AppState {
  return {
    ...state,
    conversations: state.conversations.map((conversation) =>
      conversation.id === conversationId ? updater(conversation) : conversation,
    ),
  }
}

function updateMessage(
  conversation: Conversation,
  messageId: string,
  updater: (message: Message) => Message,
): Conversation {
  return {
    ...conversation,
    messages: conversation.messages.map((message) =>
      message.id === messageId ? updater(message) : message,
    ),
  }
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'CREATE_CONVERSATION': {
      const conversation = createConversation()
      return {
        conversations: [conversation, ...state.conversations],
        activeConversationId: conversation.id,
      }
    }
    case 'SET_ACTIVE':
      return { ...state, activeConversationId: action.conversationId }
    case 'SET_DRAFT':
      return updateConversation(state, action.conversationId, (conversation) => ({
        ...conversation,
        draft: action.draft,
      }))
    case 'ADD_MESSAGE':
      return updateConversation(state, action.conversationId, (conversation) => ({
        ...conversation,
        messages: [...conversation.messages, action.message],
        title:
          action.message.role === 'user' && conversation.messages.length === 0
            ? truncateTitle(action.message.content)
            : conversation.title,
      }))
    case 'APPEND_CHUNK':
      return updateConversation(state, action.conversationId, (conversation) =>
        updateMessage(conversation, action.messageId, (message) => ({
          ...message,
          content: message.content + action.chunk,
        })),
      )
    case 'SET_STREAM_DONE':
      return updateConversation(state, action.conversationId, (conversation) =>
        updateMessage(conversation, action.messageId, (message) => ({
          ...message,
          isStreaming: false,
        })),
      )
    case 'SET_STREAM_ERROR':
      return updateConversation(state, action.conversationId, (conversation) =>
        updateMessage(conversation, action.messageId, (message) => ({
          ...message,
          isStreaming: false,
          error: action.error,
        })),
      )
    case 'SET_LOADING':
      return updateConversation(state, action.conversationId, (conversation) => ({
        ...conversation,
        isLoading: action.isLoading,
      }))
    case 'RESET_FOR_RETRY':
      return updateConversation(state, action.conversationId, (conversation) =>
        updateMessage(conversation, action.messageId, (message) => ({
          ...message,
          content: '',
          isStreaming: true,
          error: undefined,
        })),
      )
    default:
      return state
  }
}

function createInitialState(): AppState {
  const conversation = createConversation()
  return {
    conversations: [conversation],
    activeConversationId: conversation.id,
  }
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Erro desconhecido ao consultar a MEJ IA.'
}

export function useConversations() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState)

  const createConversationAction = useCallback(() => {
    dispatch({ type: 'CREATE_CONVERSATION' })
  }, [])

  const setActiveConversation = useCallback((conversationId: string) => {
    dispatch({ type: 'SET_ACTIVE', conversationId })
  }, [])

  const setDraft = useCallback((conversationId: string, draft: string) => {
    dispatch({ type: 'SET_DRAFT', conversationId, draft })
  }, [])

  const sendMessage = useCallback(async (conversationId: string, text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      createdAt: Date.now(),
    }
    dispatch({ type: 'ADD_MESSAGE', conversationId, message: userMessage })
    dispatch({ type: 'SET_DRAFT', conversationId, draft: '' })

    const assistantId = crypto.randomUUID()
    dispatch({
      type: 'ADD_MESSAGE',
      conversationId,
      message: {
        id: assistantId,
        role: 'assistant',
        content: '',
        isStreaming: true,
        createdAt: Date.now(),
      },
    })
    dispatch({ type: 'SET_LOADING', conversationId, isLoading: true })

    try {
      await askJuniorStream(trimmed, (chunk) => {
        dispatch({ type: 'APPEND_CHUNK', conversationId, messageId: assistantId, chunk })
      })
      dispatch({ type: 'SET_STREAM_DONE', conversationId, messageId: assistantId })
    } catch (error) {
      dispatch({
        type: 'SET_STREAM_ERROR',
        conversationId,
        messageId: assistantId,
        error: toErrorMessage(error),
      })
    } finally {
      dispatch({ type: 'SET_LOADING', conversationId, isLoading: false })
    }
  }, [])

  const retryMessage = useCallback(async (conversationId: string, messageId: string, question: string) => {
    const trimmed = question.trim()
    if (!trimmed) return

    dispatch({ type: 'RESET_FOR_RETRY', conversationId, messageId })
    dispatch({ type: 'SET_LOADING', conversationId, isLoading: true })

    try {
      await askJuniorStream(trimmed, (chunk) => {
        dispatch({ type: 'APPEND_CHUNK', conversationId, messageId, chunk })
      })
      dispatch({ type: 'SET_STREAM_DONE', conversationId, messageId })
    } catch (error) {
      dispatch({
        type: 'SET_STREAM_ERROR',
        conversationId,
        messageId,
        error: toErrorMessage(error),
      })
    } finally {
      dispatch({ type: 'SET_LOADING', conversationId, isLoading: false })
    }
  }, [])

  const activeConversation =
    state.conversations.find((conversation) => conversation.id === state.activeConversationId) ??
    state.conversations[0]

  return {
    state,
    activeConversation,
    createConversation: createConversationAction,
    setActiveConversation,
    setDraft,
    sendMessage,
    retryMessage,
  }
}
