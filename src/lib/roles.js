/**
 * Roles y permisos del Módulo 1. Hoy los aplica solo la interfaz; cuando
 * entre Firebase Auth deben duplicarse en las reglas de seguridad de
 * Firestore, que son la única frontera real.
 */
export const ROLES = {
  admin: {
    id: 'admin',
    label: 'Administrador',
    hint: 'Control total y auditoría',
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
