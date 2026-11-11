/**
 * Validación de los enlaces de destino.
 *
 * Un destino acaba en `location.replace`: solo se admite http y https, porque
 * otros esquemas (`javascript:`, `data:`) ejecutarían código en este dominio.
 * La Cloud Function de redirección de la Fase 2 debe aplicar la misma regla.
 */
export function isHttpUrl(value) {
  try {
    const url = new URL(String(value).trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/** Devuelve qué le falla al enlace, en el idioma del producto, o `''`. */
export function urlIssue(value, { required = false } = {}) {
  const text = String(value ?? '').trim()
  if (!text) return required ? 'Escribe el enlace de destino.' : ''
  if (isHttpUrl(text)) return ''

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(text)
  const looksLikeDomain = /^[^\s/]+\.[^\s/]{2,}(\/\S*)?$/.test(text)
  if (!hasScheme && looksLikeDomain) {
    return 'Falta https:// al principio del enlace.'
  }
  return 'Escribe un enlace completo que empiece por https://.'
}
