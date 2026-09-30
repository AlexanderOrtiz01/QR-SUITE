import { useEffect, useRef, useState } from 'react'
import { QrPreview } from './QrPreview.jsx'
import { IconCheck } from './icons.jsx'

/**
 * Confirmación de guardado.
 *
 * La pantalla se desenfoca y el código emerge en una lámina de vidrio, como
 * una confirmación del sistema en iOS: breve, sin escena, y con el código que
 * se acaba de crear como protagonista. Luego la lámina se disuelve y se abre
 * la ficha del código.
 *
 * Se puede saltar con un clic o con una tecla, y con `prefers-reduced-motion`
 * se muestra quieta el tiempo justo para leerla.
 */

/** Momento en que la lámina empieza a salir, y final de la confirmación. */
const SALIDA_MS = 1500
const TOTAL_MS = 1800

function prefiereQuietud() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function SaveReveal({ data, style, title, onDone }) {
  const [saliendo, setSaliendo] = useState(false)
  const terminado = useRef(false)

  // Con la barra de desplazamiento visible, un `fixed inset-0` se queda unos
  // píxeles corto y se cuela la pantalla de debajo.
  useEffect(() => {
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previo
    }
  }, [])

  useEffect(() => {
    function terminar() {
      if (terminado.current) return
      terminado.current = true
      onDone()
    }

    const quieta = prefiereQuietud()
    const salida = quieta
      ? null
      : setTimeout(() => setSaliendo(true), SALIDA_MS)
    const fin = setTimeout(terminar, quieta ? 1200 : TOTAL_MS)

    // Se puede saltar: quien guarda diez códigos seguidos no quiere esperar
    // diez veces.
    window.addEventListener('keydown', terminar)
    return () => {
      clearTimeout(salida)
      clearTimeout(fin)
      window.removeEventListener('keydown', terminar)
    }
  }, [onDone])

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={onDone}
      className="fixed inset-0 z-50 flex h-dvh w-dvw cursor-pointer items-center justify-center bg-brand-deep/20 px-6 backdrop-blur-xl backdrop-saturate-150 [animation:velo-entra_.35s_ease-out_both]"
    >
      <div
        className={`glass-thick flex w-full max-w-xs flex-col items-center rounded-[2.25rem] px-7 pt-7 pb-6 text-center ${
          saliendo
            ? '[animation:lamina-sale_.3s_ease-in_both]'
            : '[animation:lamina-emerge_.55s_var(--ease-ios)_both]'
        }`}
      >
        <div className="glass-well rounded-3xl bg-white p-3">
          <QrPreview data={data} style={style} size={184} />
        </div>

        <div className="mt-5 flex items-center gap-2">
          <span className="glass-tint grid size-6 place-items-center rounded-full text-white">
            <IconCheck
              strokeWidth="2.6"
              strokeDasharray="24"
              className="size-3.5 [animation:check-traza_.4s_ease-out_.3s_both]"
            />
          </span>
          <p className="text-sm font-semibold text-brand-primary-deep">
            Código guardado
          </p>
        </div>
        <p className="mt-1.5 line-clamp-2 text-lg font-bold tracking-tight text-brand-ink">
          {title}
        </p>
      </div>
    </div>
  )
}
