import './NewChatButton.css'

interface NewChatButtonProps {
  onClick?: () => void
}

function NewChatButton({ onClick }: NewChatButtonProps) {
  return (
    <button type="button" className="new-chat-button" onClick={onClick}>
      + Nova Conversa
    </button>
  )
}

export default NewChatButton
