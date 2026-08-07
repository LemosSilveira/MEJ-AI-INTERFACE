import { useCallback, useState } from 'react'

export function useCopyToClipboard(resetDelay = 2000) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        window.setTimeout(() => setCopied(false), resetDelay)
      } catch {
        // Clipboard indisponível (ex.: contexto não seguro) — falha silenciosa.
      }
    },
    [resetDelay],
  )

  return { copied, copy }
}
