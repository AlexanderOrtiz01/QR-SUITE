import { describe, expect, it } from 'vitest'

import { ROLES, can } from './roles.js'

describe('can', () => {
  it('da control total al administrador', () => {
    for (const permiso of [
      'project:write',
      'qr:write',
      'qr:export',
      'analytics:read',
      'settings:write',
    ]) {
      expect(can('admin', permiso)).toBe(true)
    }
  })

  it('deja al editor crear y exportar, pero no tocar ajustes ni proyectos', () => {
    expect(can('editor', 'qr:write')).toBe(true)
    expect(can('editor', 'qr:export')).toBe(true)
    expect(can('editor', 'settings:write')).toBe(false)
    expect(can('editor', 'project:write')).toBe(false)
  })

  it('deja al analista solo leer métricas', () => {
    expect(can('analyst', 'analytics:read')).toBe(true)
    expect(can('analyst', 'qr:write')).toBe(false)
    expect(can('analyst', 'qr:export')).toBe(false)
  })

  it('niega todo ante un rol desconocido o ausente', () => {
    expect(can('intruso', 'analytics:read')).toBe(false)
    expect(can(undefined, 'analytics:read')).toBe(false)
  })

  it('cada rol declarado tiene al menos un permiso', () => {
    for (const id of Object.keys(ROLES)) {
      expect(can(id, 'analytics:read')).toBe(true)
    }
  })
})
