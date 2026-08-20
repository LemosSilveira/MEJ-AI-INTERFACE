import { useEffect, useId, useRef, type KeyboardEvent } from 'react'
import './ConfirmDialog.css'

interface ConfirmDialogProps {
  titulo: string
  descricao: string
  rotuloConfirmar: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Diálogo de confirmação (PRD v3 §4.3.1).
 *
 * Não existe node no Figma para ele — os 16 cobrem só os popovers —, então
 * segue a mesma linguagem visual: zinc/700, raio 20px, texto branco.
 *
 * Foco preso enquanto aberto e foco inicial em "Cancelar" (§4.3.1 e §4.4):
 * a ação destrutiva nunca é a que está sob o Enter.
 */
function ConfirmDialog({
  titulo,
  descricao,
  rotuloConfirmar,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelarRef = useRef<HTMLButtonElement>(null)
  const tituloId = useId()
  const descricaoId = useId()

  useEffect(() => {
    cancelarRef.current?.focus()
  }, [])

  // Devolve o foco a quem abriu o diálogo (§4.4). Capturado na montagem porque
  // no desmonte o elemento ativo já é o <body>.
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null
    return () => anterior?.focus?.()
  }, [])

  function aoTeclar(evento: KeyboardEvent<HTMLDivElement>) {
    if (evento.key === 'Escape') {
      evento.preventDefault()
      onCancel()
      return
    }
    if (evento.key !== 'Tab') return

    // Focus trap: Tab circula só entre os elementos focáveis do diálogo.
    const focaveis = dialogRef.current?.querySelectorAll<HTMLElement>('button')
    if (!focaveis?.length) return
    const primeiro = focaveis[0]
    const ultimo = focaveis[focaveis.length - 1]

    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault()
      ultimo.focus()
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault()
      primeiro.focus()
    }
  }

  return (
    <div className="confirm-dialog__overlay" onMouseDown={onCancel}>
      <div
        ref={dialogRef}
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        aria-describedby={descricaoId}
        onKeyDown={aoTeclar}
        // Impede que o mousedown do overlay feche ao clicar dentro do diálogo.
        onMouseDown={(evento) => evento.stopPropagation()}
      >
        <h2 id={tituloId} className="confirm-dialog__titulo">
          {titulo}
        </h2>
        <p id={descricaoId} className="confirm-dialog__descricao">
          {descricao}
        </p>
        <div className="confirm-dialog__acoes">
          <button
            type="button"
            ref={cancelarRef}
            className="confirm-dialog__botao confirm-dialog__botao--cancelar"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="confirm-dialog__botao confirm-dialog__botao--confirmar"
            onClick={onConfirm}
          >
            {rotuloConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
