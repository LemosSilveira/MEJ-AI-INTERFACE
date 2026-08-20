import { useEffect, useRef } from 'react'
import { useConversationsContext } from '../../hooks/useConversationsContext'
import type { Modelo } from '../../constants/modelos'
import EmptyState from './EmptyState'
import QuickPrompts from './QuickPrompts'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import './ChatWindow.css'

const STICK_TO_BOTTOM_THRESHOLD = 80

interface ChatWindowProps {
  modelo: Modelo
}

function ChatWindow({ modelo }: ChatWindowProps) {
  const { activeConversation, sendMessage } = useConversationsContext()
  const scrollRef = useRef<HTMLDivElement>(null)
  const stickToBottomRef = useRef(true)

  const hasMessages = activeConversation.messages.length > 0
  const lastMessage = activeConversation.messages[activeConversation.messages.length - 1]

  useEffect(() => {
    stickToBottomRef.current = true
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [activeConversation.id])

  useEffect(() => {
    const el = scrollRef.current
    if (!el || !stickToBottomRef.current) return
    el.scrollTop = el.scrollHeight
  }, [lastMessage?.content, activeConversation.messages.length])

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    stickToBottomRef.current = distanceFromBottom < STICK_TO_BOTTOM_THRESHOLD
  }

  function handleQuickPrompt(text: string) {
    void sendMessage(activeConversation.id, text)
  }

  return (
    <main className="chat-window">
      {/* Divs, não <img>: o desenho é pintado por mask-image com
          background: var(--cor-primaria), que é o que faz a marca d'água
          acompanhar o tema sem precisar de um arquivo por modelo (§2.2). */}
      <div className="chat-window__watermark" aria-hidden="true">
        <div className="chat-window__paw chat-window__paw--1" />
        <div className="chat-window__paw chat-window__paw--2" />
      </div>

      <div className="chat-window__scroll" ref={scrollRef} onScroll={handleScroll}>
        <div className="chat-window__scroll-inner">
          {hasMessages ? (
            <MessageList conversation={activeConversation} />
          ) : (
            <div className="chat-window__empty">
              <EmptyState modelo={modelo} />
              <QuickPrompts modelo={modelo} onSelect={handleQuickPrompt} />
            </div>
          )}
        </div>
      </div>

      <div className="chat-window__input-bar">
        <ChatInput conversation={activeConversation} />
      </div>
    </main>
  )
}

export default ChatWindow
