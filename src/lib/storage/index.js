import { isFirebaseConfigured } from '../firebase.js'
import { firestoreAdapter } from './firestoreAdapter.js'
import { localAdapter } from './localAdapter.js'

/**
 * Selector de adaptador. Con credenciales de Firebase en el entorno se usa
 * Firestore; sin ellas la aplicación sigue funcionando contra el navegador,
 * que es lo que permite clonar el repo y arrancar sin configurar nada.
 */
export const storage = isFirebaseConfigured ? firestoreAdapter : localAdapter

export const isPersistenceShared = storage.isShared
