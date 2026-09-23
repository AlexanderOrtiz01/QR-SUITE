/**
 * Inicialización de Firebase (Fase 1 del roadmap).
 *
 * La app arranca igual sin credenciales: si faltan variables de entorno,
 * `isFirebaseConfigured` queda en false y el resto del código cae al
 * almacenamiento local y al login simulado. Eso permite clonar el repo y
 * trabajar sin tocar la consola de Firebase.
 */
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/** Las tres que de verdad hacen falta para hablar con Auth y Firestore. */
export const isFirebaseConfigured = Boolean(
  config.apiKey && config.projectId && config.appId,
)

const app = isFirebaseConfigured ? initializeApp(config) : null

export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null
export const projectId = config.projectId || ''
