import { useEffect, useRef, useState } from 'react'
import { renderFinalSvg } from '../lib/qr.js'
import { Skeleton } from './ui.jsx'

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
 */
export function QrPreview({ data, style, size = 260, className = '' }) {
  const [svg, setSvg] = useState('')
  const requestRef = useRef(0)

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
      className={`[animation:velo-entra_.3s_ease-out_both] [&>svg]:block [&>svg]:h-auto [&>svg]:w-full ${className}`}
      style={{ width: size, maxWidth: '100%' }}
      // El SVG lo genera esta misma aplicación a partir de valores de un
      // conjunto cerrado; no hay contenido de terceros que inyectar.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
