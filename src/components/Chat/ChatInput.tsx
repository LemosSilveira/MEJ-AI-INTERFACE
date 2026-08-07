import { useEffect, useRef, type FormEvent, type KeyboardEvent } from 'react'
import { useConversationsContext } from '../../hooks/useConversationsContext'
import type { Conversation } from '../../types/chat'
import sendButtonBg from '../../assets/send-button-bg.svg'
import sendIcon from '../../assets/send-icon.png'
import './ChatInput.css'

const MAX_TEXTAREA_HEIGHT = 160

interface ChatInputProps {
  conversation: Conversation
}

function ChatInput({ conversation }: ChatInputProps) {
  const { setDraft, sendMessage } = useConversationsContext()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const canSend = conversation.draft.trim().length > 0 && !conversation.isLoading

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`
  }, [conversation.draft])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSend) return
    void sendMessage(conversation.id, conversation.draft)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (canSend) void sendMessage(conversation.id, conversation.draft)
    }
  }

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <textarea
        ref={textareaRef}
        className="chat-input__textarea"
        placeholder="Pergunta para o MEJ IA"
        aria-label="Pergunta para o MEJ IA"
        rows={1}
        value={conversation.draft}
        onChange={(event) => setDraft(conversation.id, event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button
        type="submit"
        className="chat-input__send"
        disabled={!canSend}
        aria-label="Enviar pergunta"
      >
        <img src={sendButtonBg} alt="" className="chat-input__send-bg" />
        <img src={sendIcon} alt="" className="chat-input__send-icon" />
      </button>
    </form>
  )
}

export default ChatInput
