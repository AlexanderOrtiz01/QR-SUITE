import { localAdapter } from './localAdapter.js'

/**
 * Selector de adaptador. Hoy siempre devuelve el adaptador local: el de
 * Firestore se activará aquí cuando esté implementado y haya configuración
 * en las variables de entorno.
 */
export const storage = localAdapter

export const isPersistenceShared = storage.id !== 'local'
