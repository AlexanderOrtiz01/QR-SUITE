import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { renderFinalSvg } from '../lib/qr.js'
import { Skeleton } from './ui.jsx'
import { playModuleCascade } from '../lib/qrMotion.js'

const EASE_IOS = 'cubic-bezier(0.32, 0.72, 0, 1)'
const POP_MS = 460

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Vista previa del código.
 *
 * Renderiza el mismo SVG que se exporta, en lugar de un canvas aparte: es la
 * única forma de garantizar que lo que se ve en pantalla —marco y etiqueta
 * incluidos— es lo que acaba en el archivo.
 *
 * La generación es asíncrona, así que se descarta el resultado si llega
 * después de que el estilo haya vuelto a cambiar. Solo la primera vez hay
 * esqueleto: después se conserva el código anterior hasta que llega el nuevo,
 * que es menos brusco que parpadear en cada ajuste de color.
 *
 * Movimiento: la primera vez los módulos brotan en cascada desde las marcas
 * de posición (ver `qrMotion.js`); en cada cambio de estilo el código da un
 * pequeño «pop» para confirmar que el ajuste se aplicó. Va con Web Animations
 * y no con una librería: son unos pocos fotogramas clave sobre `transform`.
 * Al arrastrar un deslizador llegan cambios seguidos, así que un pop en curso
 * no se reinicia: se encadenarían en un temblor. Con movimiento reducido no
 * se anima nada.
 */
export function QrPreview({
  data,
  style,
  size = 260,
  className = '',
  animated = true,
  entranceDelay = 0,
}) {
  const [svg, setSvg] = useState('')
  const requestRef = useRef(0)
  const frameRef = useRef(null)
  const shownRef = useRef(false)
  const popRef = useRef(null)

  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!svg || !frame || !animated || prefersReducedMotion()) {
      if (svg) shownRef.current = true
      return
    }

    if (!shownRef.current) {
      shownRef.current = true
      // La lámina blanca (y el marco, si lo hay) entra suave; encima, los
      // módulos brotan en cascada desde las marcas de posición.
      frame.animate(
        [
          { opacity: 0, transform: 'scale(0.96)' },
          { opacity: 1, transform: 'scale(1)' },
        ],
        {
          duration: 360,
          delay: entranceDelay,
          easing: EASE_IOS,
          fill: 'backwards',
        },
      )
      const stopCascade = playModuleCascade(frame, {
        delay: entranceDelay + 80,
      })
      // Si el código cambia o el componente se desmonta a mitad, la cascada
      // se detiene y la siguiente vista vuelve a entrar desde cero (también
      // el doble montaje de StrictMode en desarrollo).
      return () => {
        if (stopCascade()) shownRef.current = false
      }
    }

    if (popRef.current?.playState === 'running') return
    popRef.current = frame.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(0.94)', offset: 0.28, easing: 'ease-out' },
        { transform: 'scale(1.035)', offset: 0.66, easing: 'ease-in-out' },
        { transform: 'scale(1)' },
      ],
      { duration: POP_MS },
    )
  }, [svg, animated, entranceDelay])

  useEffect(() => {
    const id = ++requestRef.current
    let cancelled = false
    renderFinalSvg({ data, style, size: 512 })
      .then((markup) => {
        if (cancelled || id !== requestRef.current) return
        setSvg(markup)
      })
      .catch((error) =>
        console.error('[qrsuite] fallo al generar la vista previa', error),
      )
    return () => {
      cancelled = true
    }
  }, [data, style, size])

  if (!svg) {
    return (
      <div
        role="status"
        className={className}
        style={{ width: size, maxWidth: '100%' }}
      >
        <span className="sr-only">Generando el código…</span>
        <Skeleton className="aspect-square w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div
      ref={frameRef}
      className={`[&>svg]:block [&>svg]:h-auto [&>svg]:w-full ${className}`}
      style={{ width: size, maxWidth: '100%' }}
      // El SVG lo genera esta misma aplicación a partir de valores de un
      // conjunto cerrado; no hay contenido de terceros que inyectar.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
