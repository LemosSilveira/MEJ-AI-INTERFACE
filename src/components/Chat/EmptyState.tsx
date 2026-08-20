import { MODELOS, type Modelo } from '../../constants/modelos'
import './EmptyState.css'

interface EmptyStateProps {
  modelo: Modelo
}

function EmptyState({ modelo }: EmptyStateProps) {
  const { apresentacao } = MODELOS[modelo]

  return (
    <div className="empty-state">
      {/* O texto pode ser vazio para um modelo (era o caso do Vitra até o
          texto oficial chegar). Sem a guarda, o gap do flex abriria um buraco
          de 51px acima da pergunta. */}
      {apresentacao && <p>{apresentacao}</p>}
      <p>Como posso lhe ajudar hoje ?</p>
    </div>
  )
}

export default EmptyState
