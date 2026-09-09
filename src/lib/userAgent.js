/** Desglose técnico del Módulo 5, a partir del user agent del escaneo. */
export function detectOs(ua = navigator.userAgent) {
  if (/android/i.test(ua)) return 'Android'
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS'
  if (/mac os x/i.test(ua)) return 'macOS'
  if (/windows/i.test(ua)) return 'Windows'
  if (/linux/i.test(ua)) return 'Linux'
  return 'Desconocido'
}

export function detectBrowser(ua = navigator.userAgent) {
  if (/edg\//i.test(ua)) return 'Edge'
  if (/opr\/|opera/i.test(ua)) return 'Opera'
  if (/chrome|crios/i.test(ua)) return 'Chrome'
  if (/firefox|fxios/i.test(ua)) return 'Firefox'
  if (/safari/i.test(ua)) return 'Safari'
  return 'Desconocido'
}
