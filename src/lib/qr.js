import QRCodeStyling from 'qr-code-styling'
import { ECC_LEVEL, LOGO_MARGIN_RATIO } from './brand.js'

/**
 * Traduce el estilo institucional guardado en el documento del QR a las
 * opciones de qr-code-styling.
 *
 * El nivel de corrección de errores queda fijado a H (30%) tal y como exige
 * el plan: es lo que permite tapar el centro con el logotipo sin perder
 * legibilidad.
 */
export function buildQrOptions({ data, style, size = 320, type = 'canvas' }) {
  return {
    width: size,
    height: size,
    type,
    data: data || ' ',
    margin: Math.round(size * 0.04),
    qrOptions: { errorCorrectionLevel: ECC_LEVEL },
    dotsOptions: { color: style.dark, type: style.dotStyle },
    backgroundOptions: { color: style.light },
    cornersSquareOptions: { color: style.dark, type: style.cornerSquareStyle },
    cornersDotOptions: { color: style.dark, type: style.cornerDotStyle },
    image: style.logo || undefined,
    imageOptions: {
      crossOrigin: 'anonymous',
      // Margen de seguridad alrededor del logo, en píxeles del lienzo actual.
      margin: Math.round(size * LOGO_MARGIN_RATIO * 0.5),
      imageSize: style.logoSize,
      hideBackgroundDots: true,
    },
  }
}

/** Píxeles necesarios para imprimir `mm` milímetros a la resolución dada. */
export function mmToPx(mm, dpi = 300) {
  return Math.round((mm / 25.4) * dpi)
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function slugify(text) {
  return (
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'qr'
  )
}

/**
 * Exporta el QR al formato pedido.
 *
 * - `svg`: vectorial, para colocar en InDesign/Illustrator sin pérdida.
 * - `png` / `webp`: rasterizados a la resolución de impresión indicada.
 */
export async function exportQr({
  data,
  style,
  title,
  format,
  sizeMm = 30,
  dpi = 300,
}) {
  const isVector = format === 'svg'
  const pixels = isVector ? 1024 : mmToPx(sizeMm, dpi)
  const instance = new QRCodeStyling(
    buildQrOptions({
      data,
      style,
      size: pixels,
      type: isVector ? 'svg' : 'canvas',
    }),
  )
  const blob = await instance.getRawData(format)
  const suffix = isVector ? 'vector' : `${sizeMm}mm-${dpi}dpi`
  triggerDownload(blob, `${slugify(title)}-${suffix}.${format}`)
}

export { QRCodeStyling }
