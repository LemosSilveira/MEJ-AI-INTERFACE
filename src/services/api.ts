import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL

if (!baseURL) {
  throw new Error('VITE_API_URL não está definida no .env')
}

export const api = axios.create({
  baseURL,
})

export const getAlgo = () => api.get('/algum-endpoint')
export const getUsuarios = () => api.get('/usuarios')

export async function askJuniorStream(
  pergunta: string,
  onChunk: (chunk: string) => void,
): Promise<void> {
  const response = await fetch(`${baseURL}/junior_stream`, {
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