import { describe, expect, it } from 'vitest'

import { isHttpUrl, urlIssue } from './urls.js'

describe('isHttpUrl', () => {
  it('acepta http y https', () => {
    expect(isHttpUrl('https://clases.edu.sv/video')).toBe(true)
    expect(isHttpUrl('http://clases.edu.sv')).toBe(true)
    expect(isHttpUrl('  https://clases.edu.sv  ')).toBe(true)
  })

  it('rechaza los esquemas que ejecutarían código', () => {
    expect(isHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isHttpUrl('JaVaScRiPt:alert(1)')).toBe(false)
    expect(isHttpUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
  })

  it('rechaza lo que no es un enlace', () => {
    expect(isHttpUrl('esto no es una url')).toBe(false)
    expect(isHttpUrl('clases.edu.sv')).toBe(false)
    expect(isHttpUrl('')).toBe(false)
    expect(isHttpUrl(null)).toBe(false)
  })
})

describe('urlIssue', () => {
  it('no se queja de un enlace válido', () => {
    expect(urlIssue('https://clases.edu.sv')).toBe('')
  })

  it('solo exige el enlace cuando el campo es obligatorio', () => {
    expect(urlIssue('')).toBe('')
    expect(urlIssue('   ')).toBe('')
    expect(urlIssue('', { required: true })).toMatch(/Escribe/)
  })

  it('reconoce un dominio al que le falta el esquema', () => {
    expect(urlIssue('recursos.clases.edu.sv/video')).toMatch(/Falta https/)
  })

  it('explica qué se espera en cualquier otro caso', () => {
    expect(urlIssue('esto no es una url')).toMatch(/empiece por https/)
    expect(urlIssue('javascript:alert(1)')).toMatch(/empiece por https/)
  })
})
