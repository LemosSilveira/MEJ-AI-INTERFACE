import type { Conversation } from '../../types/chat'
import MessageBubble from './MessageBubble'
import './MessageList.css'

interface MessageListProps {
  conversation: Conversation
}

function MessageList({ conversation }: MessageListProps) {
  return (
    <div className="message-list">
      {conversation.messages.map((message, index) => {
        let retryQuestion: string | undefined
        if (message.role === 'assistant' && message.error) {
          for (let i = index - 1; i >= 0; i -= 1) {
            if (conversation.messages[i].role === 'user') {
              retryQuestion = conversation.messages[i].content
              break
            }
          }
        }
        return (
          <MessageBubble
            key={message.id}
            message={message}
            conversationId={conversation.id}
            retryQuestion={retryQuestion}
          />
        )
      })}
    </div>
  )
}

export default MessageList
