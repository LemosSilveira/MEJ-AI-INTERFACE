import './QuickPrompts.css'

const PROMPTS = [
  'Encontre editais, eventos ou oportunidades',
  'Tire dúvidas sobre a Universidade',
  'Quero participar de uma Empresa Júnior',
]

interface QuickPromptsProps {
  onSelect: (text: string) => void
}

function QuickPrompts({ onSelect }: QuickPromptsProps) {
  return (
    <div className="quick-prompts">
      {PROMPTS.map((text) => (
        <button key={text} type="button" className="quick-prompts__chip" onClick={() => onSelect(text)}>
          {text}
        </button>
      ))}
    </div>
  )
}

export default QuickPrompts
