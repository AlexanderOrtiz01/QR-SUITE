import { describe, expect, it } from 'vitest'

import { ROLES, can } from './roles.js'
import { TOURS, getTour } from './tours.js'

const CATEGORIES = ['Primeros pasos', 'Códigos', 'Análisis', 'Administración']
const PLACEMENTS = ['bottom', 'top', 'left', 'right', 'auto']

// Un permiso es válido si al menos un rol lo concede.
const isPermission = (permission) =>
  Object.keys(ROLES).some((role) => can(role, permission))

describe('TOURS', () => {
  it('tiene ids únicos', () => {
    const ids = TOURS.map((tour) => tour.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(TOURS.map((tour) => [tour.id, tour]))(
    '%s está bien formada',
    (_id, tour) => {
      expect(tour.title).toBeTruthy()
      expect(tour.description).toBeTruthy()
      expect(CATEGORIES).toContain(tour.category)
      if (tour.requires !== undefined) {
        expect(isPermission(tour.requires)).toBe(true)
      }
      expect(tour.steps.length).toBeGreaterThan(0)
      for (const step of tour.steps) {
        expect(step.title).toBeTruthy()
        expect(step.body).toBeTruthy()
        if (step.route !== undefined) expect(step.route).toMatch(/^\//)
        if (step.placement !== undefined) {
          expect(PLACEMENTS).toContain(step.placement)
        }
      }
    },
  )

  it('getTour encuentra una guía por id', () => {
    expect(getTour('crear-qr')?.title).toBe('Crear un código QR')
    expect(getTour('no-existe')).toBeUndefined()
  })
})
