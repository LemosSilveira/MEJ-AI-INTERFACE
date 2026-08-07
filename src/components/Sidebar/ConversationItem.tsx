import type { Conversation } from '../../types/chat'
import './ConversationItem.css'

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  onClick: () => void
}

function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
  return (
    <button
      type="button"
      className={`conversation-item${isActive ? ' conversation-item--active' : ''}`}
      onClick={onClick}
      aria-current={isActive ? 'true' : undefined}
    >
      <span className="conversation-item__title">{conversation.title}</span>
      {conversation.isLoading && (
        <span className="conversation-item__loading" aria-label="Gerando resposta" />
      )}
    </button>
  )
}

export default ConversationItem
