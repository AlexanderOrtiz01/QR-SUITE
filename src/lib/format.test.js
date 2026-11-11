import { describe, expect, it } from 'vitest'

import { dayLabel, localDayKey, scansLabel } from './format.js'

describe('scansLabel', () => {
  it('concuerda en número', () => {
    expect(scansLabel(0)).toBe('0 escaneos')
    expect(scansLabel(1)).toBe('1 escaneo')
    expect(scansLabel(2)).toBe('2 escaneos')
  })

  it('trata la ausencia de dato como cero', () => {
    expect(scansLabel(undefined)).toBe('0 escaneos')
  })
})

describe('localDayKey', () => {
  it('usa el día local, no el de UTC', () => {
    expect(localDayKey(new Date(2026, 10, 4, 23, 30))).toBe('2026-11-04')
    expect(localDayKey(new Date(2026, 0, 2, 0, 5))).toBe('2026-01-02')
  })
})

describe('dayLabel', () => {
  it('escribe el mes para que no se confunda con otra fecha', () => {
    expect(dayLabel('2026-11-04')).toMatch(/^4 nov/)
    expect(dayLabel('2026-04-11')).toMatch(/^11 abr/)
  })
})
