/**
 * Legibilidad del código impreso.
 *
 * Un QR que se ve bien en pantalla puede no leerse en papel: por contraste,
 * por ir invertido, por un logo demasiado grande o por imprimirse tan pequeño
 * que la cámara no distingue los módulos. Aquí se calculan esos riesgos a
 * partir del estilo y del tamaño, sin generar la imagen.
 */

/**
 * Capacidad en bytes de cada versión con corrección de errores H, que es la
 * que fija la app. Es la tabla de la norma ISO/IEC 18004 para modo byte.
 */
const BYTE_CAPACITY_H = [
  7, 14, 24, 34, 44, 58, 64, 84, 98, 119, 137, 155, 177, 194, 220, 250, 280,
  310, 338, 382,
]

/** Margen que deja el generador, en proporción del lado (ver `lib/qr.js`). */
export const MARGIN_RATIO = 0.04

/** Módulos de zona libre que pide la norma alrededor del código. */
const QUIET_ZONE_MODULES = 4

/**
 * Tamaño mínimo de módulo impreso para leerse con una cámara de móvil a la
 * distancia de un libro. Los módulos en punto ocupan menos superficie, así
 * que piden algo más.
 */
const MIN_MODULE_MM = 0.5
const MIN_MODULE_MM_DOTS = 0.6

/** Por debajo de este contraste el lector ya no separa módulo de fondo. */
export const MIN_CONTRAST = 3

/** Logo a partir del cual conviene probar el código impreso antes de tirar. */
const LARGE_LOGO = 0.26

/** Módulos por lado del código que generará `data` (versión 1 = 21). */
export function moduleCount(data) {
  const bytes = new TextEncoder().encode(data || ' ').length
  const index = BYTE_CAPACITY_H.findIndex((capacity) => bytes <= capacity)
  const version = index === -1 ? BYTE_CAPACITY_H.length : index + 1
  return 17 + version * 4
}

function channel(value) {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** Luminancia relativa de un color `#rrggbb`. */
export function luminance(hex) {
  const clean = hex.replace('#', '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean
  const [r, g, b] = [0, 2, 4].map((at) =>
    channel(parseInt(full.slice(at, at + 2), 16)),
  )
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Contraste entre dos colores, de 1 a 21. */
export function contrast(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

/** Colores con que se pintan los módulos: el sólido o las paradas del degradado. */
function moduleColors(style) {
  return style.gradient
    ? [style.gradient.from, style.gradient.to]
    : [style.dark]
}

/**
 * Lado mínimo recomendado para imprimir el código, en milímetros, y el tamaño
 * de módulo que resulta del lado pedido.
 */
export function printMetrics(data, style, sizeMm) {
  const modules = moduleCount(data)
  const usable = 1 - MARGIN_RATIO * 2
  const minModule =
    style.dotStyle === 'dots' ? MIN_MODULE_MM_DOTS : MIN_MODULE_MM
  const moduleMm = (sizeMm * usable) / modules
  const margin = sizeMm * MARGIN_RATIO
  return {
    modules,
    moduleMm,
    minSizeMm: Math.ceil((minModule * modules) / usable),
    // Lo que falta, fuera del archivo, para llegar a la zona libre de la norma.
    quietZoneMm: Math.max(0, QUIET_ZONE_MODULES * moduleMm - margin),
  }
}

/**
 * Revisa el estilo y devuelve los avisos ordenados por gravedad. `error`
 * significa que el código probablemente no se leerá; `warning`, que se leerá
 * en la mayoría de móviles pero conviene probarlo impreso.
 */
export function checkLegibility({ data, style, sizeMm = null }) {
  const issues = []

  const worst = Math.min(
    ...moduleColors(style).map((color) => contrast(color, style.light)),
  )
  if (worst < MIN_CONTRAST) {
    issues.push({
      level: 'error',
      id: 'contrast',
      title: 'Contraste insuficiente',
      detail: style.gradient
        ? `El degradado queda a ${worst.toFixed(1)}:1 sobre el fondo. Quita el degradado o usa una paleta con fondo claro.`
        : `Módulos y fondo quedan a ${worst.toFixed(1)}:1. Usa otra paleta.`,
    })
  }

  const inverted = moduleColors(style).some(
    (color) => luminance(color) > luminance(style.light),
  )
  if (inverted && worst >= MIN_CONTRAST) {
    issues.push({
      level: 'warning',
      id: 'inverted',
      title: 'Código invertido',
      detail:
        'Claro sobre oscuro: algunos lectores y cámaras antiguas no lo leen. Para impresión es más seguro oscuro sobre claro.',
    })
  }

  if (style.logo && style.logoSize > LARGE_LOGO) {
    issues.push({
      level: 'warning',
      id: 'logo',
      title: 'Logotipo grande',
      detail: `Cubre el ${Math.round(style.logoSize * 100)} % del ancho. La corrección de errores lo admite, pero prueba el código impreso antes de tirar la edición.`,
    })
  }

  if (sizeMm !== null) {
    const print = printMetrics(data, style, sizeMm)
    if (sizeMm < print.minSizeMm) {
      issues.push({
        level: 'error',
        id: 'size',
        title: 'Demasiado pequeño para papel',
        detail: `A ${sizeMm} mm cada módulo mide ${print.moduleMm.toFixed(2)} mm. Imprime a ${print.minSizeMm} mm o más.`,
      })
    }
  }

  const order = { error: 0, warning: 1 }
  return issues.sort((a, b) => order[a.level] - order[b.level])
}
