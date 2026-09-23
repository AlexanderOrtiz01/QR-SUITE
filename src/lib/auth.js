/**
 * Módulo 1 — autenticación.
 *
 * Con Firebase configurado se usa Google Provider restringido al dominio
 * institucional y el rol se lee de la colección `roles`. Sin credenciales se
 * conserva el acceso simulado del MVP, que solo comprueba el dominio del
 * correo en cliente y no protege nada.
 */
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from './firebase.js'

export const isAuthEnabled = isFirebaseConfigured

const LOCAL_SESSION_KEY = 'qrsuite:session'

/** Mensajes de error en el idioma del producto, no los códigos de Firebase. */
const ERRORS = {
  'auth/popup-closed-by-user': 'Cerraste la ventana antes de terminar.',
  'auth/popup-blocked':
    'El navegador bloqueó la ventana emergente. Permítela e inténtalo de nuevo.',
  'auth/cancelled-popup-request': 'Hay otra ventana de acceso abierta.',
  'auth/network-request-failed': 'No hay conexión con el servidor de acceso.',
  'auth/unauthorized-domain':
    'Este dominio no está autorizado en Firebase Auth.',
  'auth/operation-not-allowed':
    'El acceso con Google no está habilitado en el proyecto de Firebase.',
}

export function describeAuthError(error) {
  return ERRORS[error?.code] || 'No se pudo completar el acceso.'
}

/**
 * Construye la sesión a partir del usuario de Firebase.
 *
 * Devuelve `null` cuando la cuenta no cumple los requisitos: dominio ajeno,
 * correo sin verificar o sin rol asignado. La interfaz no es la frontera real
 * —esa son las reglas de Firestore—, pero evita dejar entrar a un panel vacío
 * a quien no tiene permisos.
 */
async function buildSession(user, allowedDomain) {
  const email = user.email?.toLowerCase() || ''
  const domain = email.split('@')[1]

  if (!user.emailVerified) {
    return { error: 'La cuenta de Google no tiene el correo verificado.' }
  }
  if (allowedDomain && domain !== allowedDomain.toLowerCase()) {
    return { error: `Solo se permiten cuentas @${allowedDomain}.` }
  }

  const snapshot = await getDoc(doc(db, 'roles', email))
  if (!snapshot.exists()) {
    return {
      error:
        'Tu cuenta no tiene un rol asignado. Pide a un administrador que te dé acceso.',
    }
  }

  return {
    session: {
      email,
      role: snapshot.data().role,
      name: user.displayName || '',
      uid: user.uid,
      signed_in_at: new Date().toISOString(),
    },
  }
}

/**
 * Observa la sesión activa. El callback recibe `{ session, error }`: el error
 * describe por qué una cuenta autenticada en Google no puede usar el panel.
 */
export function observeSession(allowedDomain, callback) {
  if (!isAuthEnabled) {
    let session = null
    try {
      const raw = localStorage.getItem(LOCAL_SESSION_KEY)
      session = raw ? JSON.parse(raw) : null
    } catch {
      session = null
    }
    callback({ session, error: '' })
    return () => {}
  }

  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback({ session: null, error: '' })
      return
    }
    try {
      const result = await buildSession(user, allowedDomain)
      if (result.error) {
        // Una cuenta que no puede entrar no debe quedar autenticada: si no se
        // cierra, el observador la reevalúa en bucle en cada recarga.
        await firebaseSignOut(auth)
        callback({ session: null, error: result.error })
        return
      }
      callback({ session: result.session, error: '' })
    } catch (error) {
      console.error('[qrsuite] fallo al resolver la sesión', error)
      await firebaseSignOut(auth)
      callback({
        session: null,
        error: 'No se pudo comprobar tu rol. Inténtalo de nuevo.',
      })
    }
  })
}

/** Abre el selector de cuentas de Google acotado al dominio institucional. */
export async function signInWithGoogle(allowedDomain) {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({
    prompt: 'select_account',
    // `hd` es una sugerencia para el selector de Google, no un control de
    // acceso: la comprobación que cuenta la hacen buildSession y las reglas.
    ...(allowedDomain ? { hd: allowedDomain } : {}),
  })
  await signInWithPopup(auth, provider)
}

/** Acceso simulado del MVP, solo cuando no hay Firebase configurado. */
export function signInLocal(session) {
  try {
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session))
  } catch (error) {
    console.error('[qrsuite] no se pudo guardar la sesión local', error)
  }
}

export async function signOut() {
  if (isAuthEnabled) {
    await firebaseSignOut(auth)
    return
  }
  try {
    localStorage.removeItem(LOCAL_SESSION_KEY)
  } catch {
    // Sin almacenamiento la sesión local no persistía de todos modos.
  }
}
