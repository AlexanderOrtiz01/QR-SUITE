import { useEffect, useRef } from 'react'
import { QRCodeStyling, buildQrOptions } from '../lib/qr.js'

/**
 * Vista previa en canvas. Mantiene una única instancia de qr-code-styling y la
 * actualiza, en lugar de recrearla en cada pulsación de tecla.
 */
export function QrPreview({ data, style, size = 260, className = '' }) {
  const containerRef = useRef(null)
  const instanceRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined
    const instance = new QRCodeStyling(buildQrOptions({ data, style, size }))
    instanceRef.current = instance
    instance.append(container)
    return () => {
      container.replaceChildren()
      instanceRef.current = null
    }
    // La instancia se crea una vez; los cambios se aplican en el efecto de abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size])

  useEffect(() => {
    instanceRef.current?.update(buildQrOptions({ data, style, size }))
  }, [data, style, size])

  return <div ref={containerRef} className={className} />
}
