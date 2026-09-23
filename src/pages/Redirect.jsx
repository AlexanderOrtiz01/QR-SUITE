import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { storage } from '../lib/storage/index.js'
import { createScan, resolveTarget } from '../lib/schema.js'
import { detectBrowser, detectOs } from '../lib/userAgent.js'

/**
 * Motor de redirección — VERSIÓN DE CLIENTE (Fase 2 pendiente).
 *
 * El plan sitúa esta lógica en una Cloud Function que responde un 302 en menos
 * de 200 ms. Esta ruta hace lo mismo dentro del navegador para que el MVP sea
 * demostrable, con un límite que conviene tener presente: la latencia incluye
 * descargar la aplicación, así que no cumple el objetivo de 200 ms.
 *
 * No usa el store: quien escanea un código impreso no ha iniciado sesión y no
 * puede leer las colecciones del panel. Solo pide el documento del código y
 * los ajustes, que es exactamente lo que hará la Cloud Function.
 */
export function Redirect() {
  const { shortCode } = useParams()
  const [error, setError] = useState('')
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    async function run() {
      const [qr, settings] = await Promise.all([
        storage.getQr(shortCode),
        storage.getSettings(),
      ])

      if (!qr) {
        setError(`El código ${shortCode} no existe.`)
        return
      }

      const target = resolveTarget(qr, settings)
      if (!target) {
        setError(
          `El código ${shortCode} no tiene destino configurado para su estado actual.`,
        )
        return
      }

      // El escaneo se registra antes de saltar, pero no se espera: un fallo al
      // contabilizar no debe impedir que el lector llegue al recurso.
      storage
        .addScan(
          createScan({
            shortCode,
            deviceOs: detectOs(),
            browser: detectBrowser(),
            userAgent: navigator.userAgent,
          }),
        )
        .catch((issue) => {
          console.error('[qrsuite] no se pudo registrar el escaneo', issue)
        })

      // replace() evita que el botón Atrás devuelva al usuario a esta pantalla.
      window.location.replace(target)
    }

    run().catch((issue) => {
      console.error('[qrsuite] fallo al resolver la redirección', issue)
      setError('No se pudo resolver el destino. Inténtalo de nuevo.')
    })
  }, [shortCode])

  return (
    <div className="flex min-h-dvh items-center justify-center bg-brand-page px-4 text-center">
      <div className="max-w-sm space-y-2">
        <p className="font-mono text-sm text-brand-ink/65">/{shortCode}</p>
        {error ? (
          <>
            <h1 className="text-lg font-bold text-brand-ink">
              No se pudo redirigir
            </h1>
            <p className="text-sm text-brand-ink/80">{error}</p>
          </>
        ) : (
          <h1 className="text-lg font-bold text-brand-ink">Redirigiendo…</h1>
        )}
      </div>
    </div>
  )
}
