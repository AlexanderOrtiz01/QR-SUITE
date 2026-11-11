/**
 * Prueba automática de permisos contra las reglas reales de Firestore.
 *
 * Cada sonda es una operación que las reglas aceptan o rechazan según el rol,
 * elegida para que no cambie ningún dato aunque se acepte:
 *
 * - borrar un documento que no existe (no hay nada que borrar);
 * - reescribir un campo con el mismo valor que ya tiene;
 * - leer.
 *
 * Así la puede lanzar cualquier cuenta, también la del administrador en
 * producción, sin dejar rastro en los datos de trabajo.
 */
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  updateDoc,
} from 'firebase/firestore/lite'
import { db, isFirebaseConfigured } from './firebase.js'
import { PROBES, gradeProbe } from './roleTests.js'

/**
 * Identificador que nunca usa un documento real (los códigos son base62, sin
 * guiones). No puede tener la forma `__…__`: Firestore reserva esos nombres y
 * rechaza la operación antes de evaluar las reglas.
 */
const PHANTOM_ID = 'prueba-de-permisos'

export const canProbe = isFirebaseConfigured

async function attempt(operation) {
  try {
    const result = await operation()
    return result === 'skipped' ? 'skipped' : 'allowed'
  } catch (error) {
    if (error?.code === 'permission-denied') return 'denied'
    console.error('[qrsuite] sonda de permisos sin respuesta clara', error)
    return 'error'
  }
}

const OPERATIONS = {
  read: async () => {
    await getDocs(query(collection(db, 'qrs'), limit(1)))
    await getDocs(query(collection(db, 'scans'), limit(1)))
  },

  // Reescribe `short_code` con su propio valor: la actualización no cambia
  // nada, pero las reglas la evalúan como cualquier otra.
  'qr-write': async () => {
    const snapshot = await getDocs(query(collection(db, 'qrs'), limit(1)))
    const first = snapshot.docs[0]
    if (!first) return 'skipped'
    await updateDoc(first.ref, { short_code: first.id })
  },

  'qr-delete': () => deleteDoc(doc(db, 'qrs', PHANTOM_ID)),
  'project-write': () => deleteDoc(doc(db, 'projects', PHANTOM_ID)),
  'settings-write': () => deleteDoc(doc(db, 'settings', PHANTOM_ID)),
  'roles-list': () => getDocs(collection(db, 'roles')),
}

/**
 * Lanza todas las sondas con la sesión actual y las califica según el rol.
 * Van en serie: son pocas y así un fallo de red no se multiplica.
 */
export async function probePermissions(role) {
  const results = []
  for (const probe of PROBES) {
    const outcome = await attempt(OPERATIONS[probe.id])
    results.push(gradeProbe(role, probe, outcome))
  }
  return results
}
