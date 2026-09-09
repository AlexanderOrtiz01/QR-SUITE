/**
 * Adaptador de Firestore — PENDIENTE DE IMPLEMENTAR (Fase 1 del roadmap).
 *
 * Debe exponer exactamente la misma interfaz que `localAdapter` para que
 * `storage/index.js` pueda intercambiarlos. Los pasos pendientes son:
 *
 *   1. Crear el proyecto Firebase y rellenar las variables de `.env.example`.
 *   2. `npm install firebase`.
 *   3. Sustituir los cuerpos de abajo por lecturas/escrituras a las
 *      colecciones `projects`, `qrs` y `scans`.
 *   4. Escribir las reglas de seguridad que repliquen `lib/roles.js`.
 *
 * Mientras no exista configuración, `storage/index.js` no lo selecciona.
 */
function pending() {
  throw new Error(
    'El adaptador de Firestore aún no está implementado. Ver src/lib/storage/firestoreAdapter.js',
  )
}

export const firestoreAdapter = {
  id: 'firestore',
  label: 'Firestore',
  loadAll: pending,
  saveProjects: pending,
  saveQrs: pending,
  saveScans: pending,
  saveSettings: pending,
  saveSession: pending,
  clear: pending,
}
