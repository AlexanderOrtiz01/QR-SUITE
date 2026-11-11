import { useState } from 'react'
import { Button, IconButton } from './ui.jsx'
import { IconAlert, IconCheck, IconCopy } from './icons.jsx'

/** Copia un texto y confirma el resultado durante un momento, también si falla. */
export function CopyButton({ text, label, iconOnly = false }) {
  const [state, setState] = useState('idle')

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setState('copied')
    } catch (error) {
      console.error('[qrsuite] no se pudo copiar', error)
      setState('failed')
    }
    setTimeout(() => setState('idle'), 2200)
  }

  const Icon =
    state === 'copied' ? IconCheck : state === 'failed' ? IconAlert : IconCopy
  const current =
    state === 'copied'
      ? 'Copiada'
      : state === 'failed'
        ? 'No se pudo copiar'
        : label

  if (iconOnly) {
    return <IconButton label={current} icon={Icon} onClick={copy} />
  }

  return (
    <Button variant="secondary" size="compact" onClick={copy}>
      <Icon className="size-4 shrink-0" />
      <span aria-live="polite">{current}</span>
    </Button>
  )
}
