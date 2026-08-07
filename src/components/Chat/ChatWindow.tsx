import { useEffect, useRef } from 'react'
import { useConversationsContext } from '../../hooks/useConversationsContext'
import pawOne from '../../assets/watermark-paw-1.svg'
import pawTwo from '../../assets/watermark-paw-2.svg'
import EmptyState from './EmptyState'
import QuickPrompts from './QuickPrompts'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import './ChatWindow.css'

const STICK_TO_BOTTOM_THRESHOLD = 80

function ChatWindow() {
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
      <div className="chat-window__watermark" aria-hidden="true">
        <img src={pawOne} alt="" className="chat-window__paw chat-window__paw--1" />
        <img src={pawTwo} alt="" className="chat-window__paw chat-window__paw--2" />
      </div>

      <div className="chat-window__scroll" ref={scrollRef} onScroll={handleScroll}>
        <div className="chat-window__scroll-inner">
          {hasMessages ? (
            <MessageList conversation={activeConversation} />
          ) : (
            <div className="chat-window__empty">
              <EmptyState />
              <QuickPrompts onSelect={handleQuickPrompt} />
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
