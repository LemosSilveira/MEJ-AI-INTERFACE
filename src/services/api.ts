import axios from 'axios'
import type { Modelo } from '../constants/modelos'

const baseURL = import.meta.env.VITE_API_URL

if (!baseURL) {
  throw new Error('VITE_API_URL não está definida no .env')
}

export const api = axios.create({
  baseURL,
})

export const getAlgo = () => api.get('/algum-endpoint')
export const getUsuarios = () => api.get('/usuarios')

/**
 * Único lugar do projeto onde existe um caminho de endpoint (PRD v3 §3.3).
 *
 * É um mapa fechado, indexado por um valor da união `Modelo` — nunca por
 * string livre. Isso é o que impede que a resposta da IA, um parâmetro de URL,
 * o nome de uma conversa ou o localStorage decidam para onde a requisição vai
 * (§8.2). Se um dia alguém precisar de um terceiro modelo, ele entra aqui e o
 * TypeScript encontra sozinho todos os pontos que precisam saber disso.
 */
const ENDPOINTS = {
  junior: '/junior_stream',
  vitra: '/vitra_stream',
} as const satisfies Record<Modelo, `/${string}`>

// Reexportado para quem consome só a camada de API. A união em si vive em
// constants/modelos.ts — uma fonte só. O `satisfies` acima é o que garante
// que os dois arquivos não possam divergir: acrescentar um modelo lá sem
// mapear o endpoint aqui vira erro de compilação, não requisição para 404.
export type { Modelo }

/**
 * Contrato validado empiricamente contra os dois endpoints (Etapa 2 do v3):
 * ambos respondem 200 com `text/plain; charset=utf-8`, `transfer-encoding:
 * chunked`, corpo `{ "pergunta": string }` e markdown em streaming
 * incremental. Por isso a mesma função serve aos dois — não há ramificação
 * por modelo além da escolha do caminho.
 */
export async function askStream(
  modelo: Modelo,
  pergunta: string,
  onChunk: (chunk: string) => void,
): Promise<void> {
  const response = await fetch(`${baseURL}${ENDPOINTS[modelo]}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pergunta }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Erro ${response.status}: ${text}`)
  }

  if (!response.body) {
    throw new Error('Resposta da API não contém corpo de streaming')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let done = false

  while (!done) {
    const { value, done: readerDone } = await reader.read()
    if (value) {
      const chunk = decoder.decode(value, { stream: true })
      onChunk(chunk)
    }
    done = readerDone
  }
}

/**
 * Mantida por compatibilidade (§0.2): mesma assinatura de sempre. Continua
 * exportada porque o v1 a congelou como contrato público da camada de API.
 */
export async function askJuniorStream(
  pergunta: string,
  onChunk: (chunk: string) => void,
): Promise<void> {
  return askStream('junior', pergunta, onChunk)
}