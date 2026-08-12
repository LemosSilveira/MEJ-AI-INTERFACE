import { useEffect, useRef } from 'react'
import { useConversationsContext } from '../../hooks/useConversationsContext'
import { EXTERNAL_LINKS } from '../../constants/links'
import NewChatButton from './NewChatButton'
import ConversationItem from './ConversationItem'
import mascotHeader from '../../assets/mascot-header.png'
import ufcBrasao from '../../assets/ufc-brasao.svg'
import './Sidebar.css'

interface SidebarProps {
  open: boolean
  isDrawer: boolean
  onClose: () => void
}

function Sidebar({ open, isDrawer, onClose }: SidebarProps) {
  const { state, createConversation, setActiveConversation } = useConversationsContext()
  const asideRef = useRef<HTMLElement>(null)

  const isDrawerOpen = isDrawer && open

  useEffect(() => {
    if (!isDrawerOpen) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isDrawerOpen, onClose])

  // Foco entra no drawer ao abrir, para leitor de tela e teclado não ficarem
  // presos atrás do overlay (§4.3).
  useEffect(() => {
    if (!isDrawerOpen) return
    asideRef.current?.focus()
  }, [isDrawerOpen])

  function handleSelect(conversationId: string) {
    setActiveConversation(conversationId)
    if (isDrawer) onClose()
  }

  function handleCreate() {
    createConversation()
    if (isDrawer) onClose()
  }

  return (
    <aside
      id="sidebar"
      ref={asideRef}
      tabIndex={-1}
      className={`sidebar${open ? ' sidebar--open' : ''}`}
      aria-label="Conversas"
      aria-hidden={!open}
      inert={!open}
    >
      {/* Cabeçalho interno do drawer (node 50:3446). O CSS o esconde no desktop. */}
      <div className="sidebar__drawer-head">
        <img src={mascotHeader} alt="" className="sidebar__drawer-mascot" />
        <button
          type="button"
          className="sidebar__drawer-close"
          onClick={onClose}
          aria-label="Fechar barra lateral"
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <NewChatButton onClick={handleCreate} />
      <nav className="sidebar__conversations" aria-label="Lista de conversas">
        {state.conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isActive={conversation.id === state.activeConversationId}
            onClick={() => handleSelect(conversation.id)}
          />
        ))}
      </nav>
      <footer className="sidebar__footer">
        <a
          href={EXTERNAL_LINKS.ufc}
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar__logo-link"
          aria-label="Site da Universidade Federal do Ceará"
        >
          <img
            src={ufcBrasao}
            alt="Universidade Federal do Ceará"
            className="sidebar__logo sidebar__logo--ufc"
          />
        </a>
      </footer>
    </aside>
  )
}

export default Sidebar
