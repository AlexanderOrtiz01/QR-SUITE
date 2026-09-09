/**
 * Construcción de la URL corta que se imprime en el libro.
 *
 * En producción apuntará al subdominio del plan (qr.clases.edu.sv/{code}),
 * resuelto por la Cloud Function. Mientras esa función no exista, apunta a la
 * ruta /r/{code} de esta misma aplicación, que hace la redirección en cliente.
 */
const CONFIGURED_DOMAIN = import.meta.env.VITE_SHORT_DOMAIN || ''

export function shortUrlFor(shortCode) {
  if (CONFIGURED_DOMAIN) {
    const base = CONFIGURED_DOMAIN.replace(/\/+$/, '')
    const withScheme = /^https?:\/\//.test(base) ? base : `https://${base}`
    return `${withScheme}/${shortCode}`
  }
  return `${window.location.origin}/r/${shortCode}`
}

export const usingFallbackDomain = !CONFIGURED_DOMAIN
