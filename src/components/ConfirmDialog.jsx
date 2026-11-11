import { useEffect, useId, useRef, useState } from 'react'
import { Button, Field, Input } from './ui.jsx'

/**
 * Confirmación de una acción que afecta a libros ya impresos o que no se puede
 * deshacer. Se monta solo cuando hace falta, así que el texto escrito no
 * sobrevive entre aperturas.
 *
 * Es un `<dialog>` nativo: `showModal` ya deja inerte el resto de la página y
 * atiende Esc. El foco arranca en la salida segura, nunca en la acción.
 *
 * Con `typeToConfirm`, el botón no se activa hasta escribir ese texto. Sin
 * `confirmLabel` el diálogo solo informa.
 */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  cancelLabel = 'Cancelar',
  tone = 'primary',
  typeToConfirm = '',
  extraAction = null,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null)
  const safeRef = useRef(null)
  const titleId = useId()
  const [typed, setTyped] = useState('')
  const ready = !typeToConfirm || typed.trim() === typeToConfirm

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog.open) dialog.showModal()
    safeRef.current?.focus()
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
      onClick={(event) => {
        // Solo el clic en el fondo tiene como destino el propio diálogo.
        if (event.target === dialogRef.current) onCancel()
      }}
      style={{ backgroundColor: 'rgb(255 255 255 / 0.94)' }}
      className="glass-thick m-auto w-[min(28rem,calc(100vw-2rem))] rounded-[1.75rem] p-0 text-brand-ink backdrop:bg-brand-deep/35 backdrop:backdrop-blur-sm open:[animation:aviso-entra_.25s_var(--ease-ios)_both]"
    >
      <form
        className="space-y-4 p-6"
        onSubmit={(event) => {
          event.preventDefault()
          if (ready && confirmLabel) onConfirm()
        }}
      >
        <h2 id={titleId} className="text-lg font-bold tracking-tight">
          {title}
        </h2>
        <div className="space-y-2 text-sm text-brand-ink/80">{children}</div>

        {typeToConfirm ? (
          <Field label={`Escribe «${typeToConfirm}» para confirmar`}>
            <Input
              ref={safeRef}
              value={typed}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => setTyped(event.target.value)}
            />
          </Field>
        ) : null}

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:flex-wrap sm:justify-end">
          <Button
            ref={typeToConfirm ? undefined : safeRef}
            variant="secondary"
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          {extraAction}
          {confirmLabel ? (
            <Button
              type="submit"
              variant={tone === 'danger' ? 'danger' : 'primary'}
              disabled={!ready}
            >
              {confirmLabel}
            </Button>
          ) : null}
        </div>
      </form>
    </dialog>
  )
}
