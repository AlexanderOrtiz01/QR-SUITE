import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useApp } from '../store/useApp.js'
import { resolveTarget } from '../lib/schema.js'

/**
 * Motor de redirección — VERSIÓN DE CLIENTE (Fase 2 pendiente).
 *
 * El plan sitúa esta lógica en una Cloud Function que responde un 302 en menos
 * de 200 ms. Esta ruta hace lo mismo dentro del navegador para que el MVP sea
 * demostrable, con dos límites que conviene tener presentes:
 *
 *   - La latencia incluye descargar la aplicación, así que no cumple el
 *     objetivo de 200 ms.
 *   - El escaneo se registra en el almacenamiento del propio navegador, no en
 *     una base compartida.
 */
export function Redirect() {
  const { shortCode } = useParams()
  const { ready, qrs, settings, recordScan } = useApp()
  const handled = useRef(false)

  // El estado se deriva en el render: no hace falta guardarlo con setState.
  const qr = ready ? qrs.find((item) => item.short_code === shortCode) : null
  const target = qr ? resolveTarget(qr, settings) : null

  let error = ''
  if (ready && !qr) error = `El código ${shortCode} no existe.`
  else if (ready && !target) {
    error = `El código ${shortCode} no tiene destino configurado para su estado actual.`
  }

  useEffect(() => {
    if (!target || handled.current) return
    handled.current = true
    recordScan(shortCode)
    // replace() evita que el botón Atrás devuelva al usuario a esta pantalla.
    window.location.replace(target)
  }, [target, shortCode, recordScan])

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ssf-mist px-4 text-center">
      <div className="max-w-sm space-y-2">
        <p className="font-mono text-sm text-slate-500">/{shortCode}</p>
        {error ? (
          <>
            <h1 className="text-lg font-semibold text-ssf-charcoal">
              No se pudo redirigir
            </h1>
            <p className="text-sm text-slate-600">{error}</p>
          </>
        ) : (
          <h1 className="text-lg font-semibold text-ssf-charcoal">
            Redirigiendo…
          </h1>
        )}
      </div>
    </div>
  )
}
