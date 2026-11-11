import { describe, expect, it } from 'vitest'

import { PROBES, gradeProbe, gradeRun } from './roleTests.js'

const probe = (id) => PROBES.find((item) => item.id === id)

describe('gradeProbe', () => {
  it('supera cuando las reglas rechazan lo que el rol no debe hacer', () => {
    expect(gradeProbe('analyst', probe('qr-write'), 'denied').verdict).toBe(
      'pass',
    )
  })

  it('falla cuando las reglas dejan pasar algo prohibido', () => {
    expect(gradeProbe('editor', probe('qr-delete'), 'allowed').verdict).toBe(
      'fail',
    )
  })

  it('falla cuando las reglas bloquean algo permitido', () => {
    expect(gradeProbe('admin', probe('roles-list'), 'denied').verdict).toBe(
      'fail',
    )
  })

  it('no concluye nada si no se pudo probar', () => {
    expect(gradeProbe('editor', probe('qr-write'), 'skipped').verdict).toBe(
      'inconclusive',
    )
    expect(gradeProbe('editor', probe('qr-write'), 'error').verdict).toBe(
      'inconclusive',
    )
  })
})

describe('gradeRun', () => {
  it('da por buena una prueba sin fallos', () => {
    expect(
      gradeRun([
        { verdict: 'pass' },
        { verdict: 'inconclusive' },
        { verdict: 'pass' },
      ]),
    ).toEqual({ passed: 2, failed: 0, total: 3, ok: true })
  })

  it('la da por mala con un solo fallo', () => {
    expect(gradeRun([{ verdict: 'pass' }, { verdict: 'fail' }]).ok).toBe(false)
  })
})
