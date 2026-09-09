/**
 * Marcos para el código QR.
 *
 * Cada marco se define una sola vez y de ahí salen tanto la vista previa como
 * los archivos exportados: si divergieran, lo que se ve en pantalla no sería
 * lo que llega a imprenta.
 *
 * La geometría se expresa en proporción del lado del QR, de modo que el mismo
 * marco sirve a 200 px de vista previa y a 3543 px de imprenta.
 */
export const FRAMES = [
  { id: 'none', label: 'Sin marco', hasLabel: false },
  { id: 'borde', label: 'Borde simple', hasLabel: true },
  { id: 'etiqueta-inferior', label: 'Etiqueta inferior', hasLabel: true },
  { id: 'etiqueta-superior', label: 'Etiqueta superior', hasLabel: true },
  { id: 'redondeado', label: 'Redondeado', hasLabel: true },
  { id: 'bocadillo', label: 'Bocadillo', hasLabel: true },
  { id: 'esquinas', label: 'Esquinas', hasLabel: true },
]

export const DEFAULT_FRAME_LABEL = 'ESCANÉAME'

function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const FONT = 'Helvetica, Arial, sans-serif'

/**
 * Devuelve la caja exterior y la posición del QR dentro de ella, más el
 * dibujo del marco. `q` es el lado del QR en las unidades del lienzo.
 */
function layout(frameId, q, label, dark, light) {
  const text = escapeXml(label)
  const pad = q * 0.07
  const labelH = q * 0.2
  const stroke = Math.max(q * 0.016, 1)
  const radius = q * 0.06

  const labelText = (cx, cy, color, size) =>
    `<text x="${cx}" y="${cy}" fill="${color}" font-family="${FONT}" font-size="${size}" font-weight="700" text-anchor="middle" dominant-baseline="central" letter-spacing="${size * 0.06}">${text}</text>`

  switch (frameId) {
    case 'borde': {
      const width = q + pad * 2
      const height = q + pad * 2 + labelH
      return {
        width,
        height,
        qrX: pad,
        qrY: pad,
        svg:
          `<rect x="0" y="0" width="${width}" height="${height}" fill="${light}"/>` +
          `<rect x="${stroke / 2}" y="${stroke / 2}" width="${width - stroke}" height="${height - stroke}" fill="none" stroke="${dark}" stroke-width="${stroke}"/>` +
          labelText(width / 2, q + pad + labelH / 2, dark, labelH * 0.42),
      }
    }

    case 'etiqueta-inferior': {
      const width = q + pad * 2
      const height = q + pad * 2 + labelH
      return {
        width,
        height,
        qrX: pad,
        qrY: pad,
        svg:
          `<rect x="0" y="0" width="${width}" height="${height}" fill="${light}"/>` +
          `<rect x="0" y="${height - labelH}" width="${width}" height="${labelH}" fill="${dark}"/>` +
          labelText(width / 2, height - labelH / 2, light, labelH * 0.42),
      }
    }

    case 'etiqueta-superior': {
      const width = q + pad * 2
      const height = q + pad * 2 + labelH
      return {
        width,
        height,
        qrX: pad,
        qrY: labelH + pad,
        svg:
          `<rect x="0" y="0" width="${width}" height="${height}" fill="${light}"/>` +
          `<rect x="0" y="0" width="${width}" height="${labelH}" fill="${dark}"/>` +
          labelText(width / 2, labelH / 2, light, labelH * 0.42),
      }
    }

    case 'redondeado': {
      const width = q + pad * 2
      const height = q + pad * 2 + labelH
      return {
        width,
        height,
        qrX: pad,
        qrY: pad,
        svg:
          `<rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" fill="${dark}"/>` +
          `<rect x="${pad / 2}" y="${pad / 2}" width="${width - pad}" height="${q + pad}" rx="${radius * 0.7}" fill="${light}"/>` +
          labelText(width / 2, height - labelH / 2, light, labelH * 0.42),
      }
    }

    case 'bocadillo': {
      const tail = q * 0.09
      const width = q + pad * 2
      const height = q + pad * 2 + labelH + tail
      const bodyH = height - tail
      return {
        width,
        height,
        qrX: pad,
        qrY: pad,
        svg:
          `<path d="M ${width / 2 - tail} ${bodyH} L ${width / 2} ${height} L ${width / 2 + tail} ${bodyH} Z" fill="${dark}"/>` +
          `<rect x="0" y="0" width="${width}" height="${bodyH}" rx="${radius}" fill="${dark}"/>` +
          `<rect x="${pad / 2}" y="${pad / 2}" width="${width - pad}" height="${q + pad}" rx="${radius * 0.7}" fill="${light}"/>` +
          labelText(width / 2, bodyH - labelH / 2, light, labelH * 0.42),
      }
    }

    case 'esquinas': {
      const width = q + pad * 2
      const height = q + pad * 2 + labelH
      const arm = q * 0.18
      const s = stroke * 1.5
      const corner = (x, y, dx, dy) =>
        `<path d="M ${x} ${y + dy * arm} L ${x} ${y} L ${x + dx * arm} ${y}" fill="none" stroke="${dark}" stroke-width="${s}" stroke-linecap="square"/>`
      return {
        width,
        height,
        qrX: pad,
        qrY: pad,
        svg:
          `<rect x="0" y="0" width="${width}" height="${height}" fill="${light}"/>` +
          corner(s / 2, s / 2, 1, 1) +
          corner(width - s / 2, s / 2, -1, 1) +
          corner(s / 2, q + pad * 2 - s / 2, 1, -1) +
          corner(width - s / 2, q + pad * 2 - s / 2, -1, -1) +
          labelText(width / 2, q + pad * 2 + labelH / 2, dark, labelH * 0.42),
      }
    }

    default:
      return { width: q, height: q, qrX: 0, qrY: 0, svg: '' }
  }
}

/**
 * Compone el SVG final: marco debajo, código QR encima.
 *
 * `qrSvg` es el SVG que produce qr-code-styling, que se anida tal cual como
 * elemento hijo posicionado; así no hay que interpretar su contenido.
 */
export function composeFramedSvg({
  qrSvg,
  frameId,
  label,
  dark,
  light,
  qrSize,
}) {
  const geom = layout(frameId, qrSize, label, dark, light)

  // El SVG anidado se coloca con un <g transform>, no con atributos x/y: la
  // posición de un <svg> anidado la ignoran varios motores de render, y estos
  // archivos acaban en Illustrator y en un RIP de imprenta. El reemplazo de
  // atributos se limita a la etiqueta de apertura, porque aplicado a todo el
  // documento borraría el width y el height de cada <rect> del código.
  const nested = qrSvg
    .replace(/^[\s\S]*?(?=<svg)/, '')
    .replace(
      /<svg\b([^>]*)>/,
      (match, attrs) =>
        `<svg${attrs.replace(/\s(width|height|x|y)="[^"]*"/g, '')}` +
        ` width="${qrSize}" height="${qrSize}">`,
    )

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${geom.width}" height="${geom.height}" viewBox="0 0 ${geom.width} ${geom.height}">` +
    geom.svg +
    `<g transform="translate(${geom.qrX} ${geom.qrY})">` +
    nested +
    '</g>' +
    '</svg>'
  )
}

/**
 * Miniatura para la rejilla de selección. Usa la misma geometría que el marco
 * real, con un bloque gris en lugar del código: así el tile enseña la forma
 * exacta sin pagar el coste de generar un QR por cada opción.
 */
export function frameThumbnail(
  frameId,
  { dark = '#303845', light = '#FFFFFF' } = {},
) {
  const q = 100
  const geom = layout(frameId, q, 'ESCANÉAME', dark, light)
  const cells = []
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      if ((row * 7 + col * 3) % 3 === 0) {
        cells.push(
          `<rect x="${geom.qrX + col * 20 + 2}" y="${geom.qrY + row * 20 + 2}" width="16" height="16" fill="${dark}"/>`,
        )
      }
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${geom.width} ${geom.height}">` +
    (geom.svg ||
      `<rect x="0" y="0" width="${geom.width}" height="${geom.height}" fill="${light}"/>`) +
    cells.join('') +
    '</svg>'
  )
}
