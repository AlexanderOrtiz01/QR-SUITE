import { describe, expect, it } from 'vitest'
import {
  classifyEntries,
  normalizeUrl,
  legacyKind,
  parseLinks,
  sourceOf,
  titleFromUrl,
} from './importer.js'

describe('normalizeUrl', () => {
  it('acepta http(s) y completa el esquema de www', () => {
    expect(normalizeUrl('https://mined.gob.sv/a')).toBe(
      'https://mined.gob.sv/a',
    )
    expect(normalizeUrl('www.mined.gob.sv')).toBe('https://www.mined.gob.sv/')
  })

  it('quita la puntuación que arrastra un enlace dentro de una frase', () => {
    expect(normalizeUrl('https://bit.ly/abc).')).toBe('https://bit.ly/abc')
  })

  it('rechaza lo que no es un enlace web', () => {
    expect(normalizeUrl('mailto:a@b.c')).toBeNull()
    expect(normalizeUrl('texto suelto')).toBeNull()
    expect(normalizeUrl('')).toBeNull()
  })
})

describe('titleFromUrl', () => {
  it('usa el último tramo legible de la ruta', () => {
    expect(
      titleFromUrl('https://recursos.edu.sv/videos/ecuaciones-cuadraticas.mp4'),
    ).toBe('Ecuaciones cuadraticas')
  })

  it('cae al dominio con visores genéricos o identificadores opacos', () => {
    expect(titleFromUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'youtube.com',
    )
    expect(titleFromUrl('https://bit.ly/3xK9pQz')).toBe('bit.ly')
    expect(
      titleFromUrl('https://drive.google.com/file/d/1AbCdEfGh123/view'),
    ).toBe('drive.google.com')
  })
})

describe('parseLinks', () => {
  it('lee un enlace por línea y propone el título', () => {
    const [entry] = parseLinks('https://recursos.edu.sv/guia-de-lectura.pdf')
    expect(entry.url).toBe('https://recursos.edu.sv/guia-de-lectura.pdf')
    expect(entry.title).toBe('Guia de lectura')
  })

  it('separa título y enlace pegados desde una hoja de cálculo o un CSV', () => {
    const entries = parseLinks(
      [
        'titulo,url',
        'Video 1\thttps://youtu.be/abc',
        'Lectura 2; https://bit.ly/xyz',
        'https://qrco.de/bd4Kp9, Actividad 3',
      ].join('\n'),
    )
    expect(entries.map((entry) => entry.title)).toEqual([
      'Video 1',
      'Lectura 2',
      'Actividad 3',
    ])
  })

  it('conserva las líneas sin enlace, salvo la cabecera', () => {
    const entries = parseLinks('https://a.sv/x\nsolo texto')
    expect(entries).toHaveLength(2)
    expect(entries[1].url).toBeNull()
  })
})

describe('classifyEntries', () => {
  const qrs = [
    {
      target_url: 'https://ya.sv/existe',
      legacy_content: 'https://qrco.de/old',
    },
  ]
  const base = 'https://qr.clases.edu.sv/'

  it('marca repetidos, propios y sin enlace', () => {
    const entries = [
      { url: 'https://nuevo.sv/a', content: 'https://nuevo.sv/a' },
      { url: 'https://ya.sv/existe', content: 'https://ya.sv/existe' },
      { url: 'https://qrco.de/old', content: 'https://qrco.de/old' },
      { url: 'https://nuevo.sv/a', content: 'https://nuevo.sv/a' },
      { url: 'https://qr.clases.edu.sv/AbC234', content: '' },
      { url: null, content: 'WIFI:S:red;;' },
      { pending: true },
      { unreadable: true },
    ]
    expect(
      classifyEntries(entries, { qrs, shortUrlBase: base }).map((e) => e.state),
    ).toEqual([
      'listo',
      'duplicado',
      'duplicado',
      'duplicado',
      'propio',
      'sin-enlace',
      'leyendo',
      'ilegible',
    ])
  })
})

describe('sourceOf', () => {
  it('devuelve el dominio sin www', () => {
    expect(sourceOf('https://www.qrco.de/x')).toBe('qrco.de')
    expect(sourceOf('no es url')).toBe('')
  })
})

describe('legacyKind', () => {
  it('reconoce plataformas de QR y acortadores', () => {
    expect(legacyKind('https://qrco.de/bfK2pQ')).toBe('redireccion')
    expect(legacyKind('https://bit.ly/3xK9pQz')).toBe('redireccion')
    expect(legacyKind('https://app.flowcode.com/x')).toBe('redireccion')
  })

  it('trata el resto como enlace directo al recurso', () => {
    expect(legacyKind('https://www.youtube.com/watch?v=x')).toBe('directo')
    expect(legacyKind('https://mined.gob.sv/guia.pdf')).toBe('directo')
    expect(legacyKind('no es url')).toBe('directo')
  })
})
