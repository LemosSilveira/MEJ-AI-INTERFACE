import { useConversationsContext } from '../../hooks/useConversationsContext'
import NewChatButton from './NewChatButton'
import ConversationItem from './ConversationItem'
import ufcLogo from '../../assets/ufc-logo.svg'
import atlabLogo from '../../assets/atlab-logo.png'
import './Sidebar.css'

function Sidebar() {
  const { state, createConversation, setActiveConversation } = useConversationsContext()

  return (
    <aside className="sidebar">
      <NewChatButton onClick={createConversation} />
      <nav className="sidebar__conversations" aria-label="Conversas">
        {state.conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isActive={conversation.id === state.activeConversationId}
            onClick={() => setActiveConversation(conversation.id)}
          />
        ))}
      </nav>
      <footer className="sidebar__footer">
        <p className="sidebar__footer-label">Parcerias:</p>
        <p className="sidebar__footer-project">Projeto PDI - AI/WEB</p>
        <div className="sidebar__footer-logos">
          <img
            src={ufcLogo}
            alt="Universidade Federal do Ceará"
            className="sidebar__logo sidebar__logo--ufc"
          />
          <img src={atlabLogo} alt="ATLAB" className="sidebar__logo sidebar__logo--atlab" />
        </div>
      </footer>
    </aside>
  )
}

export default Sidebar
