/**
 * Adaptador de Firestore (Fase 1 del roadmap).
 *
 * Escribe documento a documento en lugar de volcar colecciones enteras: en
 * Firestore cada escritura se cobra y se replica, así que guardar los 200
 * códigos cada vez que cambia uno sería caro y además pisaría los cambios de
 * otro usuario. Expone la misma interfaz que `localAdapter`.
 */
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase.js'

/**
 * Techo de escaneos que se traen al arrancar. La analítica cubre como mucho
 * 30 días; leer el historial completo multiplicaría el coste de cada carga
 * sin cambiar ninguna cifra en pantalla.
 */
const SCAN_LIMIT = 5000

/** Firestore acepta 500 operaciones por lote. */
const BATCH_LIMIT = 500

const SETTINGS_DOC = 'app'

function docsOf(snapshot) {
  return snapshot.docs.map((entry) => entry.data())
}

/** Borra en lotes: una lista larga de referencias no cabe en un solo commit. */
async function deleteAll(refs) {
  for (let index = 0; index < refs.length; index += BATCH_LIMIT) {
    const batch = writeBatch(db)
    refs.slice(index, index + BATCH_LIMIT).forEach((ref) => batch.delete(ref))
    await batch.commit()
  }
}

async function scanRefsFor(shortCodes) {
  if (shortCodes.length === 0) return []
  const refs = []
  // `in` admite 30 valores por consulta, así que los códigos van por tandas.
  for (let index = 0; index < shortCodes.length; index += 30) {
    const chunk = shortCodes.slice(index, index + 30)
    const snapshot = await getDocs(
      query(collection(db, 'scans'), where('short_code', 'in', chunk)),
    )
    snapshot.docs.forEach((entry) => refs.push(entry.ref))
  }
  return refs
}

export const firestoreAdapter = {
  id: 'firestore',
  label: 'Firestore (compartido)',
  isShared: true,

  async loadAll() {
    const [projects, qrs, scans, settings] = await Promise.all([
      getDocs(query(collection(db, 'projects'), orderBy('created_at', 'desc'))),
      getDocs(query(collection(db, 'qrs'), orderBy('created_at', 'desc'))),
      getDocs(
        query(
          collection(db, 'scans'),
          orderBy('timestamp', 'desc'),
          limit(SCAN_LIMIT),
        ),
      ),
      getDoc(doc(db, 'settings', SETTINGS_DOC)),
    ])

    return {
      projects: docsOf(projects),
      qrs: docsOf(qrs),
      scans: docsOf(scans),
      settings: settings.exists() ? settings.data() : null,
    }
  },

  /**
   * Lectura puntual para el motor de redirección: quien escanea un código
   * impreso no tiene sesión, así que no puede listar la colección entera.
   */
  async getQr(shortCode) {
    const snapshot = await getDoc(doc(db, 'qrs', shortCode))
    return snapshot.exists() ? snapshot.data() : null
  },

  async getSettings() {
    const snapshot = await getDoc(doc(db, 'settings', SETTINGS_DOC))
    return snapshot.exists() ? snapshot.data() : null
  },

  /** Alta y baja de personas: la lista de `roles` es la puerta del panel. */
  async listRoles() {
    const snapshot = await getDocs(collection(db, 'roles'))
    return snapshot.docs.map((entry) => ({ email: entry.id, ...entry.data() }))
  },

  async setRole(email, role) {
    await setDoc(doc(db, 'roles', email), {
      role,
      updated_at: new Date().toISOString(),
    })
  },

  async removeRole(email) {
    await deleteDoc(doc(db, 'roles', email))
  },

  async addProject(project) {
    await setDoc(doc(db, 'projects', project.id), project)
  },

  async removeProject(projectId) {
    const qrs = await getDocs(
      query(collection(db, 'qrs'), where('project_id', '==', projectId)),
    )
    const codes = qrs.docs.map((entry) => entry.data().short_code)
    await deleteAll(await scanRefsFor(codes))
    await deleteAll(qrs.docs.map((entry) => entry.ref))
    await deleteDoc(doc(db, 'projects', projectId))
  },

  async addQr(qr) {
    await setDoc(doc(db, 'qrs', qr.short_code), qr)
  },

  async updateQr(shortCode, patch) {
    await updateDoc(doc(db, 'qrs', shortCode), patch)
  },

  async removeQr(shortCode) {
    await deleteAll(await scanRefsFor([shortCode]))
    await deleteDoc(doc(db, 'qrs', shortCode))
  },

  async addScan(scan) {
    // El contador vive en el propio código para que las listas no tengan que
    // agregar la colección de escaneos en cada render.
    const batch = writeBatch(db)
    batch.set(doc(db, 'scans', scan.id), scan)
    batch.update(doc(db, 'qrs', scan.short_code), { total_scans: increment(1) })
    await batch.commit()
  },

  async saveSettings(settings) {
    await setDoc(doc(db, 'settings', SETTINGS_DOC), settings)
  },

  async seed({ projects = [], qrs = [], scans = [] }) {
    const documents = [
      ...projects.map((item) => [doc(db, 'projects', item.id), item]),
      ...qrs.map((item) => [doc(db, 'qrs', item.short_code), item]),
      ...scans.map((item) => [doc(db, 'scans', item.id), item]),
    ]
    for (let index = 0; index < documents.length; index += BATCH_LIMIT) {
      const batch = writeBatch(db)
      documents
        .slice(index, index + BATCH_LIMIT)
        .forEach(([ref, data]) => batch.set(ref, data))
      await batch.commit()
    }
  },

  async clear() {
    for (const name of ['scans', 'qrs', 'projects']) {
      const snapshot = await getDocs(collection(db, name))
      await deleteAll(snapshot.docs.map((entry) => entry.ref))
    }
  },
}
