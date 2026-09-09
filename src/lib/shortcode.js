/**
 * Generación de códigos cortos para el motor de redirección dinámica.
 *
 * Alfabeto sin caracteres ambiguos (0/O, 1/l/I) para reducir errores al
 * transcribir un código impreso a mano.
 */
const ALPHABET = '23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'

const MIN_LENGTH = 6
const MAX_LENGTH = 8

export function generateShortCode(length = MIN_LENGTH) {
  const size = Math.min(Math.max(length, MIN_LENGTH), MAX_LENGTH)
  const bytes = new Uint32Array(size)
  crypto.getRandomValues(bytes)
  let out = ''
  for (let i = 0; i < size; i += 1) {
    out += ALPHABET[bytes[i] % ALPHABET.length]
  }
  return out
}

/**
 * Genera un código corto que no colisione con los ya usados. Amplía la
 * longitud si el espacio de 6 caracteres empieza a saturarse.
 */
export function generateUniqueShortCode(taken = []) {
  const used = new Set(taken)
  for (let length = MIN_LENGTH; length <= MAX_LENGTH; length += 1) {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const code = generateShortCode(length)
      if (!used.has(code)) return code
    }
  }
  throw new Error('No se pudo generar un código corto único')
}

export function isValidShortCode(code) {
  if (typeof code !== 'string') return false
  if (code.length < MIN_LENGTH || code.length > MAX_LENGTH) return false
  return [...code].every((char) => ALPHABET.includes(char))
}
