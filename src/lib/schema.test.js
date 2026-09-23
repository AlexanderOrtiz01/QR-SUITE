import { describe, expect, it } from 'vitest'

import { createProject, createQr, createScan, resolveTarget } from './schema.js'

describe('createProject', () => {
  it('genera id propio y sella la fecha de creación', () => {
    const proyecto = createProject({ name: 'Matemática 7º', createdBy: 'u1' })
    expect(proyecto.id).toMatch(/^proj_/)
    expect(proyecto.department).toBe('')
    expect(proyecto.created_by).toBe('u1')
    expect(Number.isNaN(Date.parse(proyecto.created_at))).toBe(false)
  })
})

describe('createQr', () => {
  it('nace como borrador, sin escaneos y con los nombres del esquema Firestore', () => {
    const qr = createQr({
      shortCode: 'abc123',
      projectId: 'proj_1',
      title: 'Video de fracciones',
      targetUrl: 'https://ejemplo.edu.sv/video',
      createdBy: 'u1',
    })
    expect(qr.status).toBe('draft')
    expect(qr.total_scans).toBe(0)
    expect(qr.short_code).toBe('abc123')
    expect(qr.target_url).toBe('https://ejemplo.edu.sv/video')
    expect(qr.tags).toEqual([])
    expect(qr.style).toBeDefined()
  })
})

describe('createScan', () => {
  it('registra el escaneo con id propio y hash de IP vacío por defecto', () => {
    const scan = createScan({
      shortCode: 'abc123',
      deviceOs: 'Android',
      browser: 'Chrome',
      userAgent: 'Mozilla/5.0',
    })
    expect(scan.id).toMatch(/^scan_/)
    expect(scan.ip_hash).toBe('')
    expect(Number.isNaN(Date.parse(scan.timestamp))).toBe(false)
  })
})

describe('resolveTarget', () => {
  const settings = { deprecatedUrl: 'https://ejemplo.edu.sv/edicion-nueva' }

  it('en borrador manda a la vista previa interna', () => {
    const qr = {
      status: 'draft',
      draft_url: 'https://ejemplo.edu.sv/preview',
      target_url: 'https://ejemplo.edu.sv/final',
    }
    expect(resolveTarget(qr, settings)).toBe('https://ejemplo.edu.sv/preview')
  })

  it('en borrador sin vista previa cae al destino final', () => {
    const qr = {
      status: 'draft',
      draft_url: '',
      target_url: 'https://ejemplo.edu.sv/final',
    }
    expect(resolveTarget(qr, settings)).toBe('https://ejemplo.edu.sv/final')
  })

  it('publicado manda al destino oficial', () => {
    const qr = {
      status: 'published',
      draft_url: 'https://ejemplo.edu.sv/preview',
      target_url: 'https://ejemplo.edu.sv/final',
    }
    expect(resolveTarget(qr, settings)).toBe('https://ejemplo.edu.sv/final')
  })

  it('deprecado manda al aviso, ignorando su destino anterior', () => {
    const qr = {
      status: 'deprecated',
      target_url: 'https://ejemplo.edu.sv/viejo',
    }
    expect(resolveTarget(qr, settings)).toBe(settings.deprecatedUrl)
  })

  it('devuelve null y no revienta cuando falta el QR o el aviso', () => {
    expect(resolveTarget(null, settings)).toBe(null)
    expect(resolveTarget(undefined, settings)).toBe(null)
    expect(resolveTarget({ status: 'deprecated' }, {})).toBe(null)
    expect(resolveTarget({ status: 'deprecated' }, undefined)).toBe(null)
    expect(resolveTarget({ status: 'published' }, settings)).toBe(null)
  })
})
