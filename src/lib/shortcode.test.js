import { describe, expect, it } from 'vitest'

import {
  generateShortCode,
  generateUniqueShortCode,
  isValidShortCode,
} from './shortcode.js'

const AMBIGUOUS = ['0', 'O', '1', 'l', 'I']

describe('generateShortCode', () => {
  it('respeta la longitud mínima y máxima', () => {
    expect(generateShortCode(3)).toHaveLength(6)
    expect(generateShortCode()).toHaveLength(6)
    expect(generateShortCode(7)).toHaveLength(7)
    expect(generateShortCode(20)).toHaveLength(8)
  })

  it('nunca emite caracteres ambiguos al transcribir a mano', () => {
    const muestra = Array.from({ length: 200 }, () =>
      generateShortCode(8),
    ).join('')
    for (const char of AMBIGUOUS) {
      expect(muestra).not.toContain(char)
    }
  })
})

describe('generateUniqueShortCode', () => {
  it('no devuelve un código ya ocupado', () => {
    const ocupados = Array.from({ length: 50 }, () => generateShortCode())
    expect(ocupados).not.toContain(generateUniqueShortCode(ocupados))
  })

  it('devuelve siempre un código válido, con lista vacía o sin argumento', () => {
    expect(isValidShortCode(generateUniqueShortCode())).toBe(true)
    expect(isValidShortCode(generateUniqueShortCode([]))).toBe(true)
  })

  it('no repite códigos en un lote de 500', () => {
    const emitidos = []
    for (let i = 0; i < 500; i += 1) {
      emitidos.push(generateUniqueShortCode(emitidos))
    }
    expect(new Set(emitidos).size).toBe(500)
  })
})

describe('isValidShortCode', () => {
  it('acepta un código recién generado', () => {
    expect(isValidShortCode(generateShortCode())).toBe(true)
  })

  it('rechaza longitudes fuera de rango, tipos raros y caracteres ambiguos', () => {
    expect(isValidShortCode('abc')).toBe(false)
    expect(isValidShortCode('abcdefghi')).toBe(false)
    expect(isValidShortCode(null)).toBe(false)
    expect(isValidShortCode(123456)).toBe(false)
    expect(isValidShortCode('abcd0f')).toBe(false)
    expect(isValidShortCode('abc-ef')).toBe(false)
  })
})
