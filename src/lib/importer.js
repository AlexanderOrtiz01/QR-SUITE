/**
 * Importación de códigos generados en otra plataforma.
 *
 * Un QR ya impreso codifica el enlace de esa plataforma y no se puede cambiar.
 * Lo que sí se puede es darlo de alta aquí: queda en el catálogo con su
 * proyecto y etiquetas, y recibe una URL corta propia con el mismo destino.
 * Esa URL sirve para reimprimir, y también para los libros que ya circulan si
 * la otra plataforma deja cambiar adónde apunta su código.
 *
 * Aquí solo hay funciones puras: leer una lista de enlaces pegada o de un CSV,
 * proponer un título y clasificar cada entrada antes de importarla.
 */

const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s"'<>]+/i

// Separadores habituales al pegar desde una hoja de cálculo o un CSV.
const SEPARATORS = /^[\s,;|\t–-]+|[\s,;|\t–-]+$/g

/** Normaliza un enlace: añade el esquema si falta y valida que sea http(s). */
export function normalizeUrl(raw) {
  if (!raw) return null
  let text = raw.trim().replace(/[),.;]+$/, '')
  if (/^www\./i.test(text)) text = `https://${text}`
  try {
    const url = new URL(text)
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.href
      : null
  } catch {
    return null
  }
}

// Tramos de ruta que no describen el recurso (visores, formularios, Drive).
const GENERIC_SEGMENTS = new Set([
  'watch',
  'view',
  'edit',
  'preview',
  'embed',
  'open',
  'index',
  'file',
  'viewform',
  'download',
  'share',
])

/**
 * Propone un título legible a partir del enlace: el último tramo de la ruta,
 * sin extensión ni guiones, o el dominio si la ruta no dice nada (un visor
 * genérico o un identificador opaco, como el de un vídeo o un archivo).
 */
export function titleFromUrl(href) {
  try {
    const url = new URL(href)
    const host = url.hostname.replace(/^www\./, '')
    const words = decodeURIComponent(
      url.pathname.split('/').filter(Boolean).at(-1) || '',
    )
      .replace(/\.[a-z0-9]{2,5}$/i, '')
      .replace(/[-_+]+/g, ' ')
      .trim()
    // Una sola palabra con cifras o mayúsculas intercaladas es un código
    // (bit.ly/3xK9pQz, un vídeo), no un nombre.
    const opaque =
      !/\s/.test(words) && (/\d/.test(words) || /[a-z][A-Z]/.test(words))
    const generic = GENERIC_SEGMENTS.has(words.toLowerCase())
    if (words && /[a-záéíóúñ]{3,}/i.test(words) && !opaque && !generic) {
      return words.charAt(0).toUpperCase() + words.slice(1)
    }
    return host
  } catch {
    return 'Recurso importado'
  }
}

/**
 * Lee una lista de enlaces, uno por línea. Admite el enlace solo o con un
 * título delante o detrás, separado por tabulador, punto y coma, coma o barra
 * (lo que sale al pegar dos columnas de una hoja de cálculo o un CSV). Las
 * líneas sin enlace se devuelven también, para poder señalarlas.
 */
export function parseLinks(text) {
  return (
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const match = line.match(URL_PATTERN)
        const url = match ? normalizeUrl(match[0]) : null
        const rest = match
          ? line.replace(match[0], ' ').replace(SEPARATORS, '').trim()
          : ''
        return {
          id: `enlace-${index}`,
          content: match ? match[0] : line,
          url,
          title:
            rest.replace(/^["']|["']$/g, '') || (url ? titleFromUrl(url) : ''),
          line: index + 1,
        }
      })
      // La cabecera de un CSV («titulo,url») no lleva enlace: se descarta solo
      // si es la primera línea.
      .filter((entry, index) => entry.url || index > 0)
  )
}

/**
 * Clasifica cada entrada frente a lo que ya existe. Estados:
 * - `leyendo`: la imagen aún se está analizando.
 * - `ilegible`: no se encontró ningún QR en la imagen.
 * - `listo`: se puede importar.
 * - `sin-enlace`: el QR o la línea no contiene un enlace web.
 * - `propio`: ya es una URL corta de QR Suite.
 * - `duplicado`: ya hay un código con ese mismo enlace (o se repite en la
 *   propia lista).
 */
export function classifyEntries(entries, { qrs = [], shortUrlBase = '' }) {
  const known = new Set()
  qrs.forEach((qr) => {
    if (qr.target_url) known.add(qr.target_url)
    if (qr.legacy_content) known.add(qr.legacy_content)
  })
  const seen = new Set()

  return entries.map((entry) => {
    if (entry.pending) return { ...entry, state: 'leyendo' }
    if (entry.unreadable) return { ...entry, state: 'ilegible' }
    if (!entry.url) return { ...entry, state: 'sin-enlace' }
    if (shortUrlBase && entry.url.startsWith(shortUrlBase)) {
      return { ...entry, state: 'propio' }
    }
    if (
      known.has(entry.url) ||
      known.has(entry.content) ||
      seen.has(entry.url)
    ) {
      return { ...entry, state: 'duplicado' }
    }
    seen.add(entry.url)
    return { ...entry, state: 'listo' }
  })
}

export const ENTRY_STATES = {
  leyendo: { label: 'Leyendo…' },
  ilegible: {
    label: 'Sin QR',
    hint: 'No se encontró un código en la imagen. Prueba con una foto más nítida y de frente, con el QR completo.',
  },
  listo: { label: 'Listo', importable: true },
  'sin-enlace': {
    label: 'Sin enlace',
    hint: 'El contenido no es un enlace web: no hay destino al que redirigir.',
  },
  propio: {
    label: 'Ya es de QR Suite',
    hint: 'Este código ya apunta a una URL corta de esta plataforma.',
  },
  duplicado: {
    label: 'Repetido',
    hint: 'Ya existe un código con este enlace, o se repite en la lista.',
  },
}

// Generadores de QR dinámicos y acortadores conocidos: sus enlaces redirigen,
// y la mayoría deja cambiar el destino desde su panel.
const REDIRECT_HOSTS = [
  'qrco.de',
  'qr-code-generator.com',
  'qrcode-monkey.com',
  'me-qr.com',
  'qrfy.com',
  'qr.io',
  'qrcodechimp.com',
  'uniqode.com',
  'beaconstac.com',
  'flowcode.com',
  'scanova.io',
  'bit.ly',
  'tinyurl.com',
  'rebrand.ly',
  'cutt.ly',
  'ow.ly',
  't.ly',
  'is.gd',
  's.id',
  'shorturl.at',
  'goo.gl',
  'l.ead.me',
]

/**
 * Tipo de QR impreso según lo que codifica:
 * - `redireccion`: pasa por una plataforma de QR o un acortador, que suele
 *   permitir cambiar el destino. Ahí se puede apuntar a la URL corta y los
 *   libros ya impresos pasan por QR Suite sin reimprimir.
 * - `directo`: lleva al recurso sin intermediarios (un vídeo, un PDF). Nadie
 *   puede cambiar adónde va; solo una reimpresión con el código nuevo da
 *   control sobre el destino y la analítica.
 */
export function legacyKind(href) {
  const host = sourceOf(href)
  if (!host) return 'directo'
  return REDIRECT_HOSTS.some(
    (known) => host === known || host.endsWith(`.${known}`),
  )
    ? 'redireccion'
    : 'directo'
}

/** Dominio de origen, para mostrar de qué plataforma viene un código. */
export function sourceOf(href) {
  try {
    return new URL(href).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}
