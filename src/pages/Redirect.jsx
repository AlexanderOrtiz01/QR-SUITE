import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { storage } from '../lib/storage/index.js'
import { createScan, resolveTarget } from '../lib/schema.js'
import { isHttpUrl } from '../lib/urls.js'
import { detectBrowser, detectOs } from '../lib/userAgent.js'
import { Button, Spinner } from '../components/ui.jsx'

/**
 * Lo que ve quien escanea un libro si algo falla. Esa persona no puede
 * arreglarlo: se le dice qué ocurre y a quién avisar, sin tecnicismos.
 */
const READER_ERRORS = {
  missing: {
    title: 'Este código no está disponible',
    body: 'No encontramos el recurso de este código. Avisa a tu docente para que lo revise.',
  },
  unavailable: {
    title: 'Este recurso no está disponible por ahora',
    body: 'El código existe, pero todavía no lleva a ningún recurso. Avisa a tu docente para que lo revise.',
  },
  network: {
    title: 'No se pudo abrir el recurso',
    body: 'Puede ser un problema de conexión. Compruébala e inténtalo de nuevo.',
    retry: true,
  },
}

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
  const [error, setError] = useState(null)
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
        setError(READER_ERRORS.missing)
        return
      }

      // Se comprueba antes de contar el escaneo y de saltar: un destino que no
      // sea http o https no se abre nunca, aunque esté guardado así.
      const target = resolveTarget(qr, settings)
      if (!isHttpUrl(target)) {
        setError(READER_ERRORS.unavailable)
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
      window.location.replace(target.trim())
    }

    run().catch((issue) => {
      console.error('[qrsuite] fallo al resolver la redirección', issue)
      setError(READER_ERRORS.network)
    })
  }, [shortCode])

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 text-center">
      <div className="glass w-full max-w-sm space-y-2 rounded-[1.75rem] px-6 py-8">
        {error ? (
          <div role="alert" className="space-y-2">
            <h1 className="text-lg font-bold text-brand-ink">{error.title}</h1>
            <p className="text-sm text-brand-ink/80">{error.body}</p>
            <p className="font-mono text-xs break-all text-brand-ink/75">
              Código: {shortCode}
            </p>
            {error.retry ? (
              <Button className="mt-2" onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            ) : null}
          </div>
        ) : (
          <div role="status" className="flex flex-col items-center gap-3">
            <Spinner className="size-7 text-brand-ink/70" />
            <h1 className="text-lg font-bold text-brand-ink">Redirigiendo…</h1>
          </div>
        )}
      </div>
    </div>
  )
}
