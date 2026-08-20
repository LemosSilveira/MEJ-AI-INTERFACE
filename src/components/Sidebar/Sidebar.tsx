import { useEffect, useRef } from 'react'
import { useConversationsContext } from '../../hooks/useConversationsContext'
import { EXTERNAL_LINKS } from '../../constants/links'
import { ASSETS_POR_MODELO } from '../../constants/assets'
import NewChatButton from './NewChatButton'
import ConversationItem from './ConversationItem'
import ufcBrasao from '../../assets/ufc-brasao.svg'
import './Sidebar.css'

interface SidebarProps {
  open: boolean
  isDrawer: boolean
  onClose: () => void
}

function Sidebar({ open, isDrawer, onClose }: SidebarProps) {
  const { state, activeConversation, createConversation, setActiveConversation } =
    useConversationsContext()
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
    // §3.2.5: a conversa nova herda o modelo da ativa. É o comportamento menos
    // surpreendente — quem está no Vitra e cria uma aba continua no Vitra.
    createConversation(activeConversation.modelo)
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
      {/* Cabeçalho interno do drawer (node 85:4590). O CSS o esconde no
          desktop. O v3 troca o mascote pelo wordmark do modelo ativo. */}
      <div className="sidebar__drawer-head">
        <img
          src={ASSETS_POR_MODELO[activeConversation.modelo].wordmark}
          alt=""
          className="sidebar__drawer-wordmark"
        />
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
