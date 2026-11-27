import { describe, expect, it } from 'vitest'

import { buildDemoData, DEMO_DEPARTMENT } from './demoData.js'
import { isValidShortCode } from './shortcode.js'
import { isHttpUrl } from './urls.js'

const now = new Date(2026, 10, 27, 10, 0).getTime()

describe('buildDemoData', () => {
  const demo = buildDemoData({ now })

  it('marca todos los proyectos como datos de prueba', () => {
    expect(demo.projects).toHaveLength(3)
    for (const project of demo.projects) {
      expect(project.department).toBe(DEMO_DEPARTMENT)
    }
  })

  it('usa códigos cortos válidos, únicos y destinos http', () => {
    const codes = demo.qrs.map((qr) => qr.short_code)
    expect(new Set(codes).size).toBe(demo.qrs.length)
    for (const qr of demo.qrs) {
      expect(isValidShortCode(qr.short_code)).toBe(true)
      expect(isHttpUrl(qr.target_url)).toBe(true)
    }
  })

  it('cuenta en cada código sus propios escaneos', () => {
    for (const qr of demo.qrs) {
      const own = demo.scans.filter((scan) => scan.short_code === qr.short_code)
      expect(qr.total_scans).toBe(own.length)
    }
  })

  it('no inventa escaneos futuros ni anteriores a la creación del código', () => {
    const born = new Map(
      demo.qrs.map((qr) => [qr.short_code, Date.parse(qr.created_at)]),
    )
    for (const scan of demo.scans) {
      const at = Date.parse(scan.timestamp)
      expect(at).toBeLessThanOrEqual(now)
      expect(at).toBeGreaterThan(born.get(scan.short_code))
    }
  })

  it('genera escaneos que las reglas de Firestore admiten', () => {
    for (const scan of demo.scans) {
      expect(Object.keys(scan).sort()).toEqual([
        'browser',
        'device_os',
        'id',
        'ip_hash',
        'short_code',
        'timestamp',
        'user_agent',
      ])
      expect(scan.user_agent.length).toBeLessThanOrEqual(512)
      expect(scan.device_os).not.toBe('Desconocido')
      expect(scan.browser).not.toBe('Desconocido')
    }
  })

  it('solo retira un código si hay página de aviso', () => {
    const retired = (data) =>
      data.qrs.filter((qr) => qr.status === 'deprecated').length
    expect(retired(demo)).toBe(0)
    expect(
      retired(buildDemoData({ now, deprecatedUrl: 'https://clases.edu.sv/' })),
    ).toBe(1)
  })
})
