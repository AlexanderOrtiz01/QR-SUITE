import QRCodeStyling from 'qr-code-styling'
import { ECC_LEVEL, LOGO_MARGIN_RATIO } from './brand.js'
import { composeFramedSvg } from './frames.js'

/**
 * Traduce el estilo institucional guardado en el documento del QR a las
 * opciones de qr-code-styling.
 *
 * El nivel de corrección de errores queda fijado a H (30%) tal y como exige
 * el plan: es lo que permite tapar el centro con el logotipo sin perder
 * legibilidad.
 */
export function buildQrOptions({ data, style, size = 320, type = 'canvas' }) {
  // Con degradado, qr-code-styling ignora `color`, así que se envía uno u
  // otro pero nunca ambos.
  const paint = style.gradient
    ? {
        gradient: {
          type: style.gradient.type,
          rotation: style.gradient.rotation ?? 0,
          colorStops: [
            { offset: 0, color: style.gradient.from },
            { offset: 1, color: style.gradient.to },
          ],
        },
      }
    : { color: style.dark }

  return {
    width: size,
    height: size,
    type,
    data: data || ' ',
    margin: Math.round(size * 0.04),
    qrOptions: { errorCorrectionLevel: ECC_LEVEL },
    dotsOptions: { ...paint, type: style.dotStyle },
    backgroundOptions: { color: style.light },
    cornersSquareOptions: { ...paint, type: style.cornerSquareStyle },
    cornersDotOptions: { ...paint, type: style.cornerDotStyle },
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

/** Genera el SVG del código, sin marco. */
export async function renderQrSvg({ data, style, size = 512 }) {
  const instance = new QRCodeStyling(
    buildQrOptions({ data, style, size, type: 'svg' }),
  )
  const blob = await instance.getRawData('svg')
  return blob.text()
}

/**
 * Genera el SVG definitivo: el código más su marco, si lo tiene.
 *
 * Es la única función que compone la pieza final, y la usan tanto la vista
 * previa como la exportación.
 */
export async function renderFinalSvg({ data, style, size = 512 }) {
  const qrSvg = await renderQrSvg({ data, style, size })
  // Se compone siempre, incluso sin marco: así el resultado lleva un viewBox
  // conocido y la interfaz puede escalarlo sin casos especiales.
  return composeFramedSvg({
    qrSvg,
    frameId: style.frame,
    label: style.frameLabel,
    dark: style.dark,
    light: style.light,
    qrSize: size,
  })
}

/** Rasteriza un SVG al tamaño pedido, respetando su relación de aspecto. */
async function rasterize(svgString, targetWidth, format) {
  const viewBox = svgString.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
  const ratio = viewBox ? Number(viewBox[2]) / Number(viewBox[1]) : 1
  const width = targetWidth
  const height = Math.round(targetWidth * ratio)

  const image = new Image()
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`
  await image.decode()

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  context.drawImage(image, 0, 0, width, height)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('No se pudo rasterizar el QR')),
      `image/${format}`,
      1,
    )
  })
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
 * Exporta el código al formato pedido.
 *
 * - `svg`: vectorial, para colocar en InDesign/Illustrator sin pérdida.
 * - `png` / `webp`: rasterizados a la resolución de impresión indicada.
 *
 * En los rasterizados, `sizeMm` es el lado del código en sí; si lleva marco,
 * el archivo resultante es mayor, que es lo que se espera al maquetar.
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
  const qrPixels = isVector ? 1024 : mmToPx(sizeMm, dpi)
  const svg = await renderFinalSvg({ data, style, size: qrPixels })
  const suffix = isVector ? 'vector' : `${sizeMm}mm-${dpi}dpi`
  const name = `${slugify(title)}-${suffix}.${format}`

  if (isVector) {
    triggerDownload(new Blob([svg], { type: 'image/svg+xml' }), name)
    return
  }

  const viewBox = svg.match(/viewBox="0 0 ([\d.]+) /)
  const outerWidth = viewBox ? Math.round(Number(viewBox[1])) : qrPixels
  triggerDownload(await rasterize(svg, outerWidth, format), name)
}

export { QRCodeStyling }
