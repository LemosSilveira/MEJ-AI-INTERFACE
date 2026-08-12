import { useEffect, useRef, type FormEvent, type KeyboardEvent } from 'react'
import { useConversationsContext } from '../../hooks/useConversationsContext'
import type { Conversation } from '../../types/chat'
import sendButtonBg from '../../assets/send-button-bg.svg'
import sendIcon from '../../assets/send-icon.png'
import './ChatInput.css'

const MAX_TEXTAREA_HEIGHT = 160
// §7.6. O maxLength do textarea já trunca digitação e colagem, mas cortamos
// também no handler: maxLength não cobre valor injetado por script.
export const MAX_INPUT_LENGTH = 2000
const CONTADOR_A_PARTIR_DE = 0.8

interface ChatInputProps {
  conversation: Conversation
}

function ChatInput({ conversation }: ChatInputProps) {
  const { setDraft, sendMessage } = useConversationsContext()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const restantes = MAX_INPUT_LENGTH - conversation.draft.length
  const mostrarContador =
    conversation.draft.length >= MAX_INPUT_LENGTH * CONTADOR_A_PARTIR_DE
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
        maxLength={MAX_INPUT_LENGTH}
        value={conversation.draft}
        onChange={(event) =>
          setDraft(conversation.id, event.target.value.slice(0, MAX_INPUT_LENGTH))
        }
        onKeyDown={handleKeyDown}
      />
      {mostrarContador && (
        <span
          className={`chat-input__counter${restantes === 0 ? ' chat-input__counter--limite' : ''}`}
          aria-live="polite"
        >
          {restantes === 0 ? 'Limite de 2000 caracteres atingido' : `${restantes} restantes`}
        </span>
      )}
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
