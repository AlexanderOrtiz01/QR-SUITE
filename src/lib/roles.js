/**
 * Roles y permisos del Módulo 1. Esto solo decide qué muestra la interfaz: la
 * frontera real son las reglas de `firestore.rules`, que deben decir lo mismo.
 *
 * No hay autorregistro: solo entra quien un administrador haya añadido, porque
 * el dominio institucional también incluye a los estudiantes.
 */

/** Marca de acceso retirado. No es un rol: no concede ningún permiso. */
export const REVOKED = 'revoked'

export const ROLES = {
  admin: {
    id: 'admin',
    label: 'Administrador',
    hint: 'Control total: personas, proyectos y ajustes',
  },
  editor: {
    id: 'editor',
    label: 'Editor / Maquetador',
    hint: 'Crea QR y descarga en alta resolución',
  },
  analyst: {
    id: 'analyst',
    label: 'Consultor / Analista',
    hint: 'Solo lectura de métricas',
  },
}

const PERMISSIONS = {
  admin: [
    'project:write',
    'qr:write',
    'qr:delete',
    'qr:export',
    'analytics:read',
    'settings:write',
  ],
  editor: ['qr:write', 'qr:export', 'analytics:read'],
  analyst: ['analytics:read'],
}

export function can(role, permission) {
  return (PERMISSIONS[role] || []).includes(permission)
}
