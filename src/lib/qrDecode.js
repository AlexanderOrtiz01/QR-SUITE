/**
 * Lectura de un QR a partir de una imagen (foto o captura de la página del
 * libro, o el archivo que exportó la otra plataforma).
 *
 * Se usa `jsqr` y no `BarcodeDetector`, que no existe en Chrome de escritorio
 * para Windows y Linux ni en Firefox. La librería se carga solo al importar,
 * así que no pesa en el resto del panel.
 */

// Lado máximo con el que se analiza: una foto de móvil a resolución completa
// tarda segundos y no se lee mejor. Si falla, se reintenta más pequeña, que
// con fotos con ruido o poco enfocadas suele funcionar mejor.
const SIZES = [1600, 900]

function pixelsAt(bitmap, maxSide) {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  // Fondo blanco: un PNG transparente con módulos oscuros se leería como
  // negro sobre negro.
  context.fillStyle = '#fff'
  context.fillRect(0, 0, width, height)
  context.drawImage(bitmap, 0, 0, width, height)
  return context.getImageData(0, 0, width, height)
}

/** Devuelve el texto del QR de la imagen, o `null` si no encuentra ninguno. */
export async function decodeQrImage(file) {
  const { default: jsQR } = await import('jsqr')
  const bitmap = await createImageBitmap(file)
  try {
    for (const size of SIZES) {
      const { data, width, height } = pixelsAt(bitmap, size)
      const result = jsQR(data, width, height, {
        inversionAttempts: 'attemptBoth',
      })
      if (result?.data) return result.data
    }
    return null
  } finally {
    bitmap.close()
  }
}
