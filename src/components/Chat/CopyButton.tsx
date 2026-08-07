import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'
import copyIcon from '../../assets/copy-icon.svg'
import './CopyButton.css'

interface CopyButtonProps {
  text: string
}

function CopyButton({ text }: CopyButtonProps) {
  const { copied, copy } = useCopyToClipboard()

  return (
    <button type="button" className="copy-button" onClick={() => copy(text)} aria-label="Copiar resposta">
      <img src={copyIcon} alt="" className="copy-button__icon" />
      <span>{copied ? 'Copiado' : 'Copiar'}</span>
    </button>
  )
}

export default CopyButton
