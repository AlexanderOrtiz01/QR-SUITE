/**
 * Generador de datos de demostración.
 *
 * Existe porque la analítica solo se puede evaluar con escaneos dentro, y en
 * modo local no hay forma de conseguirlos sin abrir la URL corta a mano una y
 * otra vez. Se descarta en cuanto la Cloud Function alimente escaneos reales.
 */
import { createProject, createQr, createScan } from './schema.js'

const DAYS = 30

// Repartos aproximados de un centro escolar salvadoreño: predominio de Android
// y de navegación desde el móvil.
const OS = [
  ['Android', 45],
  ['iOS', 30],
  ['Windows', 15],
  ['macOS', 7],
  ['Linux', 3],
]

const BROWSERS = [
  ['Chrome', 55],
  ['Safari', 25],
  ['Firefox', 10],
  ['Edge', 8],
  ['Opera', 2],
]

// Peso por hora: los escaneos siguen la jornada escolar, con pico a media
// mañana y una cola de tareas por la tarde-noche.
const HOURS = [
  1, 1, 1, 1, 1, 2, 5, 12, 20, 26, 30, 24, 18, 22, 28, 26, 20, 14, 12, 14, 16,
  12, 6, 3,
]

const RECURSOS = [
  ['Guía de Matemática 7.º', 'Video'],
  ['Laboratorio de Ciencias 8.º', 'Actividad'],
  ['Antología de Lenguaje 9.º', 'PDF'],
  ['Evaluación de Sociales 6.º', 'Evaluación'],
  ['Audio de Inglés 5.º', 'Audio'],
]

function pick(table) {
  const total = table.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = Math.random() * total
  for (const [value, weight] of table) {
    roll -= weight
    if (roll <= 0) return value
  }
  return table[table.length - 1][0]
}

function pickHour() {
  const total = HOURS.reduce((sum, weight) => sum + weight, 0)
  let roll = Math.random() * total
  for (let hour = 0; hour < HOURS.length; hour += 1) {
    roll -= HOURS[hour]
    if (roll <= 0) return hour
  }
  return 12
}

/**
 * Devuelve un juego completo de proyecto, códigos y escaneos. No toca el
 * almacenamiento: quien lo llama decide si lo añade o lo descarta.
 */
export function buildDemoData({ createdBy = 'demo@clases.edu.sv' } = {}) {
  const project = createProject({
    name: 'Materiales de demostración',
    department: 'Dirección Nacional de Currículo',
    createdBy,
  })

  const qrs = RECURSOS.map(([title, tag], index) =>
    createQr({
      shortCode: `demo${index + 1}`,
      projectId: project.id,
      title,
      targetUrl: `https://clases.edu.sv/recursos/demo-${index + 1}`,
      status: index === RECURSOS.length - 1 ? 'draft' : 'published',
      tags: [tag],
      createdBy,
    }),
  )

  const scans = []
  const now = Date.now()

  qrs.forEach((qr, index) => {
    // Los primeros recursos de la lista circulan más que los últimos.
    const popularity = 1 - index * 0.16

    for (let back = DAYS - 1; back >= 0; back -= 1) {
      // Tendencia creciente hacia el presente, más ruido diario, y fines de
      // semana flojos: sin eso la serie sale plana y no se ve la forma.
      const day = new Date(now - back * 86400000)
      const weekday = day.getDay()
      const weekend = weekday === 0 || weekday === 6 ? 0.35 : 1
      const growth = 0.5 + ((DAYS - back) / DAYS) * 0.9
      const count = Math.round(
        Math.random() * 6 * popularity * growth * weekend,
      )

      for (let i = 0; i < count; i += 1) {
        day.setHours(pickHour(), Math.floor(Math.random() * 60), 0, 0)
        const scan = createScan({
          shortCode: qr.short_code,
          deviceOs: pick(OS),
          browser: pick(BROWSERS),
          userAgent: 'demo',
        })
        scan.timestamp = day.toISOString()
        scans.push(scan)
      }
    }
  })

  scans.sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  const counts = new Map()
  scans.forEach((scan) => {
    counts.set(scan.short_code, (counts.get(scan.short_code) || 0) + 1)
  })

  return {
    project,
    qrs: qrs.map((qr) => ({
      ...qr,
      total_scans: counts.get(qr.short_code) || 0,
    })),
    scans,
  }
}
