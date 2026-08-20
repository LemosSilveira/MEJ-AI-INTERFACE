import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { MODELOS, MODELOS_ORDENADOS, type Modelo } from '../../constants/modelos'
import chevronDown from '../../assets/v3/icon-chevron-down.svg'
import checkIcon from '../../assets/v3/icon-check-small.svg'
import './ModelSelector.css'

interface ModelSelectorProps {
  modelo: Modelo
  onSelect: (modelo: Modelo) => void
}

/**
 * Seletor de modelo (PRD v3 §3.1), dentro da barra de input — nodes 85:3779
 * (gatilho) e 85:4026 (popover).
 *
 * Semântica de menu com `menuitemradio`: são opções mutuamente exclusivas com
 * uma marcada, que é exatamente o `aria-checked` que o PRD pede.
 */
function ModelSelector({ modelo, onSelect }: ModelSelectorProps) {
  const [aberto, setAberto] = useState(false)
  // Índice com foco enquanto o menu está aberto. Começa na opção ativa.
  const [indiceFoco, setIndiceFoco] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const gatilhoRef = useRef<HTMLButtonElement>(null)
  const opcoesRef = useRef<(HTMLButtonElement | null)[]>([])
  const menuId = useId()

  function abrir() {
    setIndiceFoco(Math.max(0, MODELOS_ORDENADOS.indexOf(modelo)))
    setAberto(true)
  }

  /** Fecha e devevolve o foco ao gatilho, como manda a §3.1. */
  function fechar(devolverFoco = true) {
    setAberto(false)
    if (devolverFoco) gatilhoRef.current?.focus()
  }

  function escolher(escolhido: Modelo) {
    onSelect(escolhido)
    fechar()
  }

  // Clique fora. Escuta em 'mousedown' e não em 'click' para fechar antes que
  // o alvo do clique reaja — senão um clique no botão de enviar fecharia o
  // menu e dispararia o envio no mesmo gesto.
  useEffect(() => {
    if (!aberto) return
    function aoClicarFora(evento: MouseEvent) {
      if (!containerRef.current?.contains(evento.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', aoClicarFora)
    return () => document.removeEventListener('mousedown', aoClicarFora)
  }, [aberto])

  // Move o foco de verdade para a opção ativa; sem isso a navegação por setas
  // seria só visual e o leitor de tela não anunciaria nada.
  useEffect(() => {
    if (!aberto) return
    opcoesRef.current[indiceFoco]?.focus()
  }, [aberto, indiceFoco])

  function aoTeclarNoMenu(evento: KeyboardEvent<HTMLDivElement>) {
    const total = MODELOS_ORDENADOS.length
    switch (evento.key) {
      case 'Escape':
        evento.preventDefault()
        fechar()
        break
      case 'ArrowDown':
        evento.preventDefault()
        setIndiceFoco((i) => (i + 1) % total)
        break
      case 'ArrowUp':
        evento.preventDefault()
        setIndiceFoco((i) => (i - 1 + total) % total)
        break
      case 'Home':
        evento.preventDefault()
        setIndiceFoco(0)
        break
      case 'End':
        evento.preventDefault()
        setIndiceFoco(total - 1)
        break
      case 'Tab':
        // Tab sai do menu: fechar sem roubar o foco de volta.
        fechar(false)
        break
    }
  }

  function aoTeclarNoGatilho(evento: KeyboardEvent<HTMLButtonElement>) {
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      evento.preventDefault()
      abrir()
    }
  }

  return (
    <div className="model-selector" ref={containerRef}>
      <button
        type="button"
        ref={gatilhoRef}
        className="model-selector__trigger"
        onClick={() => (aberto ? fechar(false) : abrir())}
        onKeyDown={aoTeclarNoGatilho}
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-controls={aberto ? menuId : undefined}
        aria-label={`Modelo: ${MODELOS[modelo].nome}. Trocar de modelo`}
      >
        <span className="model-selector__nome">{MODELOS[modelo].nome}</span>
        <img
          src={chevronDown}
          alt=""
          className={`model-selector__chevron${aberto ? ' model-selector__chevron--aberto' : ''}`}
        />
      </button>

      {aberto && (
        <div
          id={menuId}
          role="menu"
          className="model-selector__menu"
          aria-label="Escolher modelo"
          onKeyDown={aoTeclarNoMenu}
        >
          {MODELOS_ORDENADOS.map((chave, indice) => {
            const ativo = chave === modelo
            return (
              <button
                key={chave}
                type="button"
                role="menuitemradio"
                aria-checked={ativo}
                ref={(el) => {
                  opcoesRef.current[indice] = el
                }}
                // Roving tabindex: só a opção focada é alcançável por Tab.
                tabIndex={indice === indiceFoco ? 0 : -1}
                className="model-selector__opcao"
                onClick={() => escolher(chave)}
              >
                <span className="model-selector__opcao-topo">
                  <span className="model-selector__opcao-nome">{MODELOS[chave].nome}</span>
                  {ativo && <img src={checkIcon} alt="" className="model-selector__check" />}
                </span>
                <span className="model-selector__opcao-desc">{MODELOS[chave].descricao}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ModelSelector
