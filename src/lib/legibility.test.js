import { describe, expect, it } from 'vitest'
import { BRAND_PRESETS, DEFAULT_STYLE, GRADIENT_PRESETS } from './brand.js'
import {
  checkLegibility,
  contrast,
  moduleCount,
  printMetrics,
} from './legibility.js'

const URL_CORTA = 'https://qr-suite-brown.vercel.app/r/xfNYaV'
const preset = (id) => BRAND_PRESETS.find((item) => item.id === id)
const withPreset = (id, extra = {}) => ({
  ...DEFAULT_STYLE,
  preset: id,
  dark: preset(id).dark,
  light: preset(id).light,
  ...extra,
})

describe('moduleCount', () => {
  it('elige la versión mínima que admite los datos con corrección H', () => {
    expect(moduleCount('a'.repeat(7))).toBe(21)
    expect(moduleCount('a'.repeat(8))).toBe(25)
    // Una URL corta de producción cabe en la versión 5.
    expect(moduleCount(URL_CORTA)).toBe(37)
  })
})

describe('contrast', () => {
  it('va de 1 (iguales) a 21 (negro sobre blanco)', () => {
    expect(contrast('#ffffff', '#ffffff')).toBeCloseTo(1)
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21)
  })
})

describe('checkLegibility', () => {
  it('no avisa con la paleta institucional por defecto', () => {
    expect(checkLegibility({ data: URL_CORTA, style: DEFAULT_STYLE })).toEqual(
      [],
    )
  })

  it('todas las paletas con fondo claro y sus degradados se leen', () => {
    for (const id of ['institucional', 'azul-ssf', 'sobre-claro']) {
      for (const gradient of GRADIENT_PRESETS) {
        const style = withPreset(id, { gradient: { ...gradient } })
        const errors = checkLegibility({ data: URL_CORTA, style }).filter(
          (issue) => issue.level === 'error',
        )
        expect(errors, `${id} + ${gradient.id}`).toEqual([])
      }
    }
  })

  it('marca como error un degradado sobre la paleta invertida', () => {
    const style = withPreset('invertido', {
      gradient: { ...GRADIENT_PRESETS[0] },
    })
    const [issue] = checkLegibility({ data: URL_CORTA, style })
    expect(issue.level).toBe('error')
    expect(issue.id).toBe('contrast')
  })

  it('avisa, sin error, de un código invertido legible', () => {
    const issues = checkLegibility({
      data: URL_CORTA,
      style: withPreset('invertido'),
    })
    expect(issues.map((issue) => [issue.level, issue.id])).toEqual([
      ['warning', 'inverted'],
    ])
  })

  it('avisa de un logotipo por encima del 26 %', () => {
    const style = {
      ...DEFAULT_STYLE,
      logo: 'data:image/png;base64,',
      logoSize: 0.3,
    }
    const ids = checkLegibility({ data: URL_CORTA, style }).map((i) => i.id)
    expect(ids).toContain('logo')
  })

  it('marca como error imprimir por debajo del tamaño mínimo', () => {
    const { minSizeMm } = printMetrics(URL_CORTA, DEFAULT_STYLE, 30)
    const at = (sizeMm) =>
      checkLegibility({ data: URL_CORTA, style: DEFAULT_STYLE, sizeMm }).map(
        (issue) => issue.id,
      )
    expect(at(minSizeMm)).not.toContain('size')
    expect(at(minSizeMm - 1)).toContain('size')
  })

  it('los módulos en punto piden más tamaño', () => {
    const square = printMetrics(URL_CORTA, DEFAULT_STYLE, 30).minSizeMm
    const dots = printMetrics(
      URL_CORTA,
      { ...DEFAULT_STYLE, dotStyle: 'dots' },
      30,
    ).minSizeMm
    expect(dots).toBeGreaterThan(square)
  })
})
