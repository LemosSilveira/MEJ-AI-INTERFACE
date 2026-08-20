import { MODELOS, type Modelo } from '../../constants/modelos'
import './QuickPrompts.css'

interface QuickPromptsProps {
  modelo: Modelo
  onSelect: (text: string) => void
}

function QuickPrompts({ modelo, onSelect }: QuickPromptsProps) {
  // O label do chip É a pergunta enviada à IA (F4), então os textos vêm do
  // mapa por modelo — trocar de modelo troca as três perguntas rápidas.
  const { chips } = MODELOS[modelo]

  return (
    <div className="quick-prompts">
      {chips.map((text) => (
        <button key={text} type="button" className="quick-prompts__chip" onClick={() => onSelect(text)}>
          {text}
        </button>
      ))}
    </div>
  )
}

export default QuickPrompts
