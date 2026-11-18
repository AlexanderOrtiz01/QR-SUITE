import { REVOKED } from '../roles.js'

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
  roles: 'qrsuite:roles',
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
  isShared: false,

  async loadAll() {
    return {
      projects: read(KEYS.projects, []),
      qrs: read(KEYS.qrs, []),
      scans: read(KEYS.scans, []),
      settings: read(KEYS.settings, null),
    }
  },

  async getQr(shortCode) {
    return read(KEYS.qrs, []).find((qr) => qr.short_code === shortCode) || null
  },

  async getSettings() {
    return read(KEYS.settings, null)
  },

  async listRoles() {
    return read(KEYS.roles, [])
  },

  async setRole(email, role) {
    const others = read(KEYS.roles, []).filter((item) => item.email !== email)
    write(KEYS.roles, [
      { email, role, updated_at: new Date().toISOString() },
      ...others,
    ])
  },

  async removeRole(email) {
    const others = read(KEYS.roles, []).filter((item) => item.email !== email)
    write(KEYS.roles, [
      { email, role: REVOKED, updated_at: new Date().toISOString() },
      ...others,
    ])
  },

  async addProject(project) {
    write(KEYS.projects, [project, ...read(KEYS.projects, [])])
  },

  async removeProject(projectId) {
    write(
      KEYS.projects,
      read(KEYS.projects, []).filter((project) => project.id !== projectId),
    )
    const qrs = read(KEYS.qrs, [])
    const orphaned = new Set(
      qrs
        .filter((qr) => qr.project_id === projectId)
        .map((qr) => qr.short_code),
    )
    write(
      KEYS.qrs,
      qrs.filter((qr) => qr.project_id !== projectId),
    )
    write(
      KEYS.scans,
      read(KEYS.scans, []).filter((scan) => !orphaned.has(scan.short_code)),
    )
  },

  async addQr(qr) {
    write(KEYS.qrs, [qr, ...read(KEYS.qrs, [])])
  },

  async updateQr(shortCode, patch) {
    write(
      KEYS.qrs,
      read(KEYS.qrs, []).map((qr) =>
        qr.short_code === shortCode ? { ...qr, ...patch } : qr,
      ),
    )
  },

  async removeQr(shortCode) {
    write(
      KEYS.qrs,
      read(KEYS.qrs, []).filter((qr) => qr.short_code !== shortCode),
    )
    write(
      KEYS.scans,
      read(KEYS.scans, []).filter((scan) => scan.short_code !== shortCode),
    )
  },

  async addScan(scan) {
    write(KEYS.scans, [scan, ...read(KEYS.scans, [])])
    write(
      KEYS.qrs,
      read(KEYS.qrs, []).map((qr) =>
        qr.short_code === scan.short_code
          ? { ...qr, total_scans: (qr.total_scans || 0) + 1 }
          : qr,
      ),
    )
  },

  async saveSettings(settings) {
    write(KEYS.settings, settings)
  },

  async seed({ projects = [], qrs = [], scans = [] }) {
    write(KEYS.projects, [...projects, ...read(KEYS.projects, [])])
    write(KEYS.qrs, [...qrs, ...read(KEYS.qrs, [])])
    write(KEYS.scans, [...scans, ...read(KEYS.scans, [])])
  },

  async clear() {
    // Los ajustes y la sesión no son datos de trabajo: se conservan.
    ;[KEYS.projects, KEYS.qrs, KEYS.scans].forEach((key) =>
      localStorage.removeItem(key),
    )
  },
}
