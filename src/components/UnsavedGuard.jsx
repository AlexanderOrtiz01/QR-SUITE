import { useEffect } from 'react'
import { useBlocker } from 'react-router-dom'
import { ConfirmDialog } from './ConfirmDialog.jsx'

/**
 * Avisa antes de perder cambios sin guardar: al navegar dentro del panel, con
 * un diálogo propio; al recargar o cerrar la pestaña, con el aviso del
 * navegador, que es el único que se permite ahí.
 *
 * `bypassRef` deja pasar una salida intencionada, como la de borrar el código.
 */
export function UnsavedGuard({ when, bypassRef, message }) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      when &&
      !bypassRef?.current &&
      currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (!when) return undefined
    function warn(event) {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [when])

  if (blocker.state !== 'blocked') return null

  return (
    <ConfirmDialog
      title="¿Salir sin guardar?"
      confirmLabel="Salir sin guardar"
      cancelLabel="Seguir editando"
      tone="danger"
      onConfirm={() => blocker.proceed()}
      onCancel={() => blocker.reset()}
    >
      <p>{message}</p>
    </ConfirmDialog>
  )
}
