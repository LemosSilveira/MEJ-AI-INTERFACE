import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { MODELOS } from '../../constants/modelos'
import { MAX_TITULO } from '../../hooks/useConversations'
import { useConversationsContext } from '../../hooks/useConversationsContext'
import ConfirmDialog from '../ui/ConfirmDialog'
import iconRename from '../../assets/v3/icon-rename.svg'
import iconDelete from '../../assets/v3/icon-delete.svg'
import type { Conversation } from '../../types/chat'
import './ConversationItem.css'

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  onClick: () => void
}

function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
  const { renomearConversa, excluirConversa } = useConversationsContext()
  const [menuAberto, setMenuAberto] = useState(false)
  const [editando, setEditando] = useState(false)
  const [rascunhoTitulo, setRascunhoTitulo] = useState(conversation.title)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const gatilhoRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuId = useId()

  const { nome } = MODELOS[conversation.modelo]

  // Clique fora fecha o menu (§4.1).
  useEffect(() => {
    if (!menuAberto) return
    function aoClicarFora(evento: MouseEvent) {
      if (!containerRef.current?.contains(evento.target as Node)) setMenuAberto(false)
    }
    document.addEventListener('mousedown', aoClicarFora)
    return () => document.removeEventListener('mousedown', aoClicarFora)
  }, [menuAberto])

  // §4.2.1: campo pré-preenchido com o título atual e já selecionado.
  useEffect(() => {
    if (!editando) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [editando])

  function fecharMenu(devolverFoco = true) {
    setMenuAberto(false)
    if (devolverFoco) gatilhoRef.current?.focus()
  }

  function iniciarRenomear() {
    setRascunhoTitulo(conversation.title)
    setEditando(true)
    setMenuAberto(false)
  }

  function confirmarRenomear() {
    // §4.2.3: nome vazio é rejeitado e o anterior permanece. O hook devolve
    // false nesse caso; aqui isso só encerra a edição sem alterar nada.
    renomearConversa(conversation.id, rascunhoTitulo)
    setEditando(false)
    gatilhoRef.current?.focus()
  }

  function cancelarRenomear() {
    setRascunhoTitulo(conversation.title)
    setEditando(false)
    gatilhoRef.current?.focus()
  }

  function aoTeclarNoInput(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'Enter') {
      evento.preventDefault()
      confirmarRenomear()
    } else if (evento.key === 'Escape') {
      evento.preventDefault()
      cancelarRenomear()
    }
  }

  function aoTeclarNoMenu(evento: KeyboardEvent<HTMLDivElement>) {
    if (evento.key === 'Escape') {
      evento.preventDefault()
      fecharMenu()
    }
  }

  return (
    <div
      ref={containerRef}
      className={`conversation-item${isActive ? ' conversation-item--active' : ''}`}
    >
      {editando ? (
        <input
          ref={inputRef}
          type="text"
          className="conversation-item__input"
          value={rascunhoTitulo}
          // §8.3: limite no dado. O maxLength trava digitação e colagem; o
          // slice cobre valor injetado por script, que ignora maxLength.
          maxLength={MAX_TITULO}
          onChange={(e) => setRascunhoTitulo(e.target.value.slice(0, MAX_TITULO))}
          onKeyDown={aoTeclarNoInput}
          onBlur={confirmarRenomear}
          aria-label="Novo nome da conversa"
        />
      ) : (
        <button
          type="button"
          className="conversation-item__main"
          onClick={onClick}
          aria-current={isActive ? 'true' : undefined}
        >
          {/* §3.2.3: ponto na cor do modelo DESTA conversa — o data-modelo
              próprio impede que todas as linhas herdem a cor da ativa. */}
          <span
            className="conversation-item__badge"
            data-modelo={conversation.modelo}
            aria-hidden="true"
          />
          <span className="conversation-item__title">{conversation.title}</span>
          <span className="conversation-item__sr">{` (${nome})`}</span>
        </button>
      )}

      {conversation.isLoading && (
        <span className="conversation-item__loading" aria-label="Gerando resposta" />
      )}

      {/* O data-modelo aqui redefine --cor-primaria só para este botão, então
          cada linha da lista mostra a cor do SEU modelo — laranja no Junior,
          ciano no Vitra — e não a da conversa ativa. Mesma lógica do badge. */}
      <button
        type="button"
        ref={gatilhoRef}
        className="conversation-item__menu-trigger"
        data-modelo={conversation.modelo}
        onClick={() => (menuAberto ? fecharMenu(false) : setMenuAberto(true))}
        aria-haspopup="menu"
        aria-expanded={menuAberto}
        aria-controls={menuAberto ? menuId : undefined}
        aria-label={`Opções da conversa ${conversation.title}`}
      >
        <span className="conversation-item__menu-icon" aria-hidden="true" />
      </button>

      {menuAberto && (
        <div
          id={menuId}
          role="menu"
          className="conversation-item__menu"
          aria-label={`Opções da conversa ${conversation.title}`}
          onKeyDown={aoTeclarNoMenu}
        >
          <button
            type="button"
            role="menuitem"
            className="conversation-item__menu-item"
            onClick={iniciarRenomear}
          >
            <img src={iconRename} alt="" />
            Renomear
          </button>
          <button
            type="button"
            role="menuitem"
            className="conversation-item__menu-item"
            onClick={() => {
              setMenuAberto(false)
              setConfirmandoExclusao(true)
            }}
          >
            <img src={iconDelete} alt="" />
            Excluir
          </button>
        </div>
      )}

      {confirmandoExclusao && (
        <ConfirmDialog
          titulo="Excluir conversa"
          // §4.3.3: sem persistência, a exclusão é definitiva na sessão — o
          // diálogo precisa deixar isso claro.
          descricao={`“${conversation.title}” e todas as suas mensagens serão apagadas. Esta ação não pode ser desfeita.`}
          rotuloConfirmar="Excluir"
          onCancel={() => setConfirmandoExclusao(false)}
          onConfirm={() => {
            setConfirmandoExclusao(false)
            excluirConversa(conversation.id)
          }}
        />
      )}
    </div>
  )
}

export default ConversationItem
