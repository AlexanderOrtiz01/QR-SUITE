/**
 * Prueba de permisos por rol. Lo esperado se deriva de `roles.js`: si cambia
 * un permiso, cambia lo que se espera de cada sonda sin otra lista a mano.
 */
import { ROLES, can } from './roles.js'

export const ROLE_IDS = Object.keys(ROLES)

/**
 * Sondas de la prueba automática: operaciones contra Firestore que no cambian
 * ningún dato pero que las reglas aceptan o rechazan según el rol. La
 * implementación vive en `permissionProbe.js`; aquí solo qué se espera.
 */
export const PROBES = [
  {
    id: 'read',
    label: 'Leer códigos y escaneos',
    permission: 'analytics:read',
  },
  {
    id: 'qr-write',
    label: 'Modificar un código',
    permission: 'qr:write',
  },
  {
    id: 'qr-delete',
    label: 'Eliminar códigos',
    permission: 'qr:delete',
  },
  {
    id: 'project-write',
    label: 'Crear o eliminar proyectos',
    permission: 'project:write',
  },
  {
    id: 'settings-write',
    label: 'Cambiar los ajustes',
    permission: 'settings:write',
  },
  {
    id: 'roles-list',
    label: 'Ver y gestionar personas',
    permission: 'settings:write',
  },
]

/**
 * Compara lo que respondió Firestore con lo que el rol debería poder hacer.
 * `outcome` es 'allowed', 'denied', 'skipped' (no había datos con que probar)
 * o 'error' (fallo ajeno a los permisos, como la red).
 */
export function gradeProbe(role, probe, outcome) {
  const expected = can(role, probe.permission) ? 'allowed' : 'denied'
  let verdict = 'inconclusive'
  if (outcome === 'allowed' || outcome === 'denied') {
    verdict = outcome === expected ? 'pass' : 'fail'
  }
  return { id: probe.id, expected, outcome, verdict }
}

/** Una prueba automática supera si no falla ninguna sonda concluyente. */
export function gradeRun(results = []) {
  const failed = results.filter((item) => item.verdict === 'fail').length
  const passed = results.filter((item) => item.verdict === 'pass').length
  return { passed, failed, total: results.length, ok: failed === 0 }
}
