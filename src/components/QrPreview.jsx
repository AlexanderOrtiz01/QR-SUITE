import { useEffect, useRef, useState } from 'react'
import { renderFinalSvg } from '../lib/qr.js'

/**
 * Vista previa del código.
 *
 * Renderiza el mismo SVG que se exporta, en lugar de un canvas aparte: es la
 * única forma de garantizar que lo que se ve en pantalla —marco y etiqueta
 * incluidos— es lo que acaba en el archivo.
 *
 * La generación es asíncrona, así que se descarta el resultado si llega
 * después de que el estilo haya vuelto a cambiar.
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

  return (
    <div
      className={`[&>svg]:block [&>svg]:h-auto [&>svg]:w-full ${className}`}
      style={{ width: size, maxWidth: '100%' }}
      // El SVG lo genera esta misma aplicación a partir de valores de un
      // conjunto cerrado; no hay contenido de terceros que inyectar.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
