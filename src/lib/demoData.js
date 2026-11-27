/**
 * Generador de datos de prueba para demostraciones.
 *
 * La analítica solo se puede enseñar con escaneos dentro. Estos datos conviven
 * con los reales, así que sus proyectos van marcados con `DEMO_DEPARTMENT`:
 * borrarlos desde Proyectos se lleva también sus códigos y escaneos.
 */
import { createProject, createQr, createScan } from './schema.js'
import { generateUniqueShortCode } from './shortcode.js'
import { detectBrowser, detectOs } from './userAgent.js'

/** Marca visible que distingue estos proyectos de los reales. */
export const DEMO_DEPARTMENT = 'Datos de prueba'

const DAYS = 30
const DAY_MS = 86400000
/** Techo de escaneos por código y día, antes de ponderar. */
const DAILY_PEAK = 9

// Repartos aproximados de un centro escolar salvadoreño: predominio de Android
// y de navegación desde el móvil. El sistema y el navegador se deducen del
// user agent, igual que en un escaneo real.
const DEVICES = [
  [
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
    42,
  ],
  ['Mozilla/5.0 (Android 14; Mobile; rv:143.0) Gecko/143.0 Firefox/143.0', 3],
  [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1',
    22,
  ],
  [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0.0.0 Mobile/15E148 Safari/604.1',
    8,
  ],
  [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    9,
  ],
  [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
    6,
  ],
  [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/122.0.0.0',
    2,
  ],
  [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15',
    5,
  ],
  ['Mozilla/5.0 (X11; Linux x86_64; rv:143.0) Gecko/20100101 Firefox/143.0', 3],
]

// Peso por hora: los escaneos siguen la jornada escolar, con pico a media
// mañana y una cola de tareas por la tarde-noche.
const HOURS = [
  1, 1, 1, 1, 1, 2, 5, 12, 20, 26, 30, 24, 18, 22, 28, 26, 20, 14, 12, 14, 16,
  12, 6, 3,
].map((weight, hour) => [hour, weight])

const WIKI = 'https://es.wikipedia.org/wiki/'

// Cada recurso: título, etiqueta, artículo de destino y popularidad. Los
// destinos son páginas reales para que escanear en vivo no acabe en un 404.
const CATALOG = [
  {
    name: 'Matemática 7.º grado',
    resources: [
      ['Fracciones equivalentes', 'Video', 'Fracci%C3%B3n', 1],
      ['Teorema de Pitágoras', 'Actividad', 'Teorema_de_Pit%C3%A1goras', 0.8],
      [
        'Ecuaciones de primer grado',
        'PDF',
        'Ecuaci%C3%B3n_de_primer_grado',
        0.6,
      ],
      ['Evaluación de porcentajes', 'Evaluación', 'Porcentaje', 0.08],
    ],
  },
  {
    name: 'Ciencia y Tecnología 8.º grado',
    resources: [
      ['La célula y sus partes', 'Video', 'C%C3%A9lula', 0.9],
      ['Laboratorio de fotosíntesis', 'Actividad', 'Fotos%C3%ADntesis', 0.7],
      ['El ciclo del agua', 'PDF', 'Ciclo_hidrol%C3%B3gico', 0.5],
      ['Recorrido por el sistema solar', 'Enlace', 'Sistema_solar', 0.55],
    ],
  },
  {
    name: 'Lenguaje y cultura salvadoreña 9.º grado',
    resources: [
      ['Los cuentos de Salarrué', 'Audio', 'Salarru%C3%A9', 0.65],
      ['La metáfora en la poesía', 'PDF', 'Met%C3%A1fora', 0.4],
      ['Joya de Cerén', 'Video', 'Joya_de_Cer%C3%A9n', 0.75],
      ['Estructura del cuento', 'Evaluación', 'Cuento', 0.3],
    ],
  },
]

/** Recurso que queda en borrador, para enseñar ese estado. */
const DRAFT_TITLE = 'Evaluación de porcentajes'
/** Recurso que queda retirado, si hay página de aviso a la que llevarlo. */
const RETIRED_TITLE = 'Estructura del cuento'

function pick(table) {
  const total = table.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = Math.random() * total
  for (const [value, weight] of table) {
    roll -= weight
    if (roll <= 0) return value
  }
  return table[table.length - 1][0]
}

function statusFor(title, deprecatedUrl) {
  if (title === DRAFT_TITLE) return 'draft'
  if (title === RETIRED_TITLE && deprecatedUrl) return 'deprecated'
  return 'published'
}

function scansFor(qr, popularity, now) {
  const scans = []

  for (let back = DAYS - 1; back >= 0; back -= 1) {
    // Tendencia creciente hacia el presente, más ruido diario, y fines de
    // semana flojos: sin eso la serie sale plana y no se ve la forma.
    const day = new Date(now - back * DAY_MS)
    const weekday = day.getDay()
    const weekend = weekday === 0 || weekday === 6 ? 0.35 : 1
    const growth = 0.5 + ((DAYS - back) / DAYS) * 0.9
    const count = Math.round(
      Math.random() * DAILY_PEAK * popularity * growth * weekend,
    )

    for (let i = 0; i < count; i += 1) {
      day.setHours(
        pick(HOURS),
        Math.floor(Math.random() * 60),
        Math.floor(Math.random() * 60),
        0,
      )
      // Hoy todavía no ha terminado: nada de escaneos en el futuro.
      if (day.getTime() > now) continue

      const userAgent = pick(DEVICES)
      const scan = createScan({
        shortCode: qr.short_code,
        deviceOs: detectOs(userAgent),
        browser: detectBrowser(userAgent),
        userAgent,
      })
      scan.timestamp = day.toISOString()
      scans.push(scan)
    }
  }

  return scans
}

/**
 * Devuelve un juego completo de proyectos, códigos y escaneos. No toca el
 * almacenamiento: quien lo llama decide si lo añade o lo descarta. Con
 * `takenCodes` no pisa ningún código que ya exista.
 */
export function buildDemoData({
  createdBy = 'demo@clases.edu.sv',
  takenCodes = [],
  deprecatedUrl = '',
  now = Date.now(),
} = {}) {
  const taken = new Set(takenCodes)
  const projects = []
  const qrs = []
  const scans = []

  CATALOG.forEach(({ name, resources }) => {
    const project = {
      ...createProject({ name, department: DEMO_DEPARTMENT, createdBy }),
      created_at: new Date(now - (DAYS + 11) * DAY_MS).toISOString(),
    }
    projects.push(project)

    resources.forEach(([title, tag, article, popularity]) => {
      const shortCode = generateUniqueShortCode(taken)
      taken.add(shortCode)

      const status = statusFor(title, deprecatedUrl)
      // Anteriores al primer escaneo y escalonados, para que las listas no
      // salgan con la misma fecha.
      const createdAt = new Date(
        now - (DAYS + 10 - qrs.length / 2) * DAY_MS,
      ).toISOString()
      const qr = {
        ...createQr({
          shortCode,
          projectId: project.id,
          title,
          targetUrl: `${WIKI}${article}`,
          draftUrl: status === 'draft' ? `${WIKI}Proporcionalidad` : '',
          status,
          tags: [tag],
          createdBy,
        }),
        created_at: createdAt,
        updated_at: createdAt,
      }
      const own = scansFor(qr, popularity, now)
      qrs.push({ ...qr, total_scans: own.length })
      scans.push(...own)
    })
  })

  scans.sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  return { projects, qrs, scans }
}
