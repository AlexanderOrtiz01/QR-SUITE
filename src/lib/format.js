/** Formatos de lectura compartidos por el panel. */

export function scansLabel(count) {
  const total = count || 0
  return `${total} ${total === 1 ? 'escaneo' : 'escaneos'}`
}

/**
 * Clave `AAAA-MM-DD` del día en la hora de quien mira. No sale de
 * `toISOString`, que va en UTC: en El Salvador (UTC-6) un escaneo nocturno
 * caería en el día siguiente.
 */
export function localDayKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** «4 nov»: un `11/04` se lee como 11 de abril. */
export function dayLabel(key) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
    .toLocaleDateString('es', { day: 'numeric', month: 'short' })
    .replace('.', '')
}
