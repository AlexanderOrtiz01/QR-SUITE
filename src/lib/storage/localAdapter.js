/**
 * Adaptador de almacenamiento sobre localStorage.
 *
 * Es el adaptador del MVP: permite trabajar sin credenciales de Firebase.
 * Limitación conocida: los datos viven en el navegador, no se comparten entre
 * dispositivos ni usuarios. Se sustituye por el adaptador de Firestore sin
 * tocar las pantallas, porque ambos exponen esta misma interfaz.
 */
const KEYS = {
  projects: 'qrsuite:projects',
  qrs: 'qrsuite:qrs',
  scans: 'qrsuite:scans',
  settings: 'qrsuite:settings',
  session: 'qrsuite:session',
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('[qrsuite] no se pudo escribir en localStorage', error)
  }
}

export const localAdapter = {
  id: 'local',
  label: 'Local (navegador)',

  async loadAll() {
    return {
      projects: read(KEYS.projects, []),
      qrs: read(KEYS.qrs, []),
      scans: read(KEYS.scans, []),
      settings: read(KEYS.settings, null),
      session: read(KEYS.session, null),
    }
  },

  async saveProjects(projects) {
    write(KEYS.projects, projects)
  },

  async saveQrs(qrs) {
    write(KEYS.qrs, qrs)
  },

  async saveScans(scans) {
    write(KEYS.scans, scans)
  },

  async saveSettings(settings) {
    write(KEYS.settings, settings)
  },

  async saveSession(session) {
    write(KEYS.session, session)
  },

  async clear() {
    Object.values(KEYS).forEach((key) => localStorage.removeItem(key))
  },
}
